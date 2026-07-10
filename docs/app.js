import { analyze, clean, CATEGORIES, DEFAULT_OPTIONS } from "./cleaner.js?v=1.4.17";

const $ = (id) => document.getElementById(id);
const input = $("input");
const stats = $("stats");
const alerts = $("alerts");
const inspector = $("inspector");
const output = $("output");
const results = $("results");
const copyBtn = $("copy");
const copyStatus = $("copy-status");
const clearBtn = $("clear");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const scrollBehavior = () => reducedMotion.matches ? "auto" : "smooth";

// Clear is enabled when the input has ANY content. This tool targets invisible
// characters, so trimming would wrongly treat an all-invisible paste (exactly
// what it exists to clean) as empty. Copy is enabled only when there is output.
function syncControls() {
  clearBtn.disabled = input.value.length === 0;
  copyBtn.disabled = output.value.length === 0;
}
const charcount = $("charcount");

// The page ships with Typography ticked: cleaning pasted rich text is the
// main use case here. The engine's own default stays conservative for clean().
const options = { ...DEFAULT_OPTIONS, typography: true };

const CAT_COLOR = {
  invisible: "green",
  bidi: "red",
  tags: "red",
  variation: "amber",
  spaces: "amber",
  typography: "blue",
  confusables: "red"
};

// Short labels for badges shown in place of invisible characters.
const SHORT = {
  0x200B: "ZWSP", 0x200C: "ZWNJ", 0x200D: "ZWJ", 0x2060: "WJ",
  0xFEFF: "BOM", 0x00AD: "SHY", 0x180E: "MVS",
  0x200E: "LRM", 0x200F: "RLM", 0x061C: "ALM",
  0x00A0: "NBSP", 0x202F: "NNBSP", 0x1680: "OGSP",
  0x205F: "MMSP", 0x3000: "IDSP",
  0x3164: "HF", 0xFFA0: "HWHF", 0x115F: "HCF", 0x1160: "HJF",
  0x2061: "FA", 0x2062: "IT", 0x2063: "IS", 0x2064: "IP"
};

function shortLabel(f) {
  if (SHORT[f.cp]) return SHORT[f.cp];
  if (f.category === "tags") return "TAG";
  if (f.category === "variation") return "VS";
  if (f.category === "bidi") return "BIDI";
  if (f.category === "spaces") return "SP";
  return f.code;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function chipRow(counts, removed, replaced) {
  const rows = [];
  const order = ["invisible", "bidi", "tags", "variation", "spaces", "typography", "confusables"];
  let totalActive = 0;
  let totalKept = 0;
  for (const key of order) {
    const c = counts[key];
    const active = c.found - c.exempt;
    totalActive += active;
    totalKept += c.exempt;
    if (!active) continue;
    const color = CAT_COLOR[key];
    rows.push(`<span class="chip ${color}"><strong>${active}</strong> ${CATEGORIES[key].label.toLowerCase()}</span>`);
  }
  if (!totalActive) {
    const keptNote = totalKept
      ? ` <span class="chip"><strong>${totalKept}</strong> invisible characters kept: they are legitimate parts of emoji or non-Latin words</span>`
      : "";
    return `<span class="chip ok"><strong>0</strong> issues. This text is clean.</span>` + keptNote;
  }
  if (totalKept) rows.push(`<span class="chip"><strong>${totalKept}</strong> kept (legitimate emoji or script characters)</span>`);
  rows.push(`<span class="chip"><strong>${removed}</strong> removed, <strong>${replaced}</strong> replaced by current settings</span>`);
  return rows.join("");
}

// Bound the inspector DOM for large inputs. Counts and cleaned output remain complete.
const MAX_INSPECTOR_MARKS = 20000;

function renderInspector(text, findings) {
  const shown = findings.length > MAX_INSPECTOR_MARKS ? findings.slice(0, MAX_INSPECTOR_MARKS) : findings;
  let html = "";
  let cursor = 0;
  for (const f of shown) {
    html += esc(text.slice(cursor, f.index));
    const color = CAT_COLOR[f.category];
    const tip = esc(`${f.code} ${f.name}${f.note ? " · " + f.note : ""}${f.exempt ? " · kept" : ""}`);
    if (f.category === "typography" || f.category === "confusables") {
      html += `<span class="hl ${color}" title="${tip}" aria-label="${tip}" tabindex="0">${esc(f.char)}</span>`;
    } else {
      html += `<span class="badge ${f.exempt ? "exempt" : color}" title="${tip}" aria-label="${tip}" tabindex="0">${f.exempt ? "\u2713 " : ""}${shortLabel(f)}</span>`;
    }
    cursor = f.index + f.length;
  }
  html += shown.length < findings.length
    ? '<span class="inspector-truncated"> Remainder omitted from this preview.</span>'
    : esc(text.slice(cursor));
  return {
    html: html || '<span style="color:var(--ink-mute)">Paste something above to inspect it.</span>',
    shownMarks: shown.length,
    totalMarks: findings.length
  };
}

function run() {
  const text = input.value;
  charcount.textContent = text ? `${Array.from(text).length} characters` : "";
  if (!text) {
    results.hidden = true;
    output.value = "";
    syncControls();
    return;
  }
  results.hidden = false;

  const analysis = analyze(text);
  const { findings, hiddenMessages, counts } = analysis;
  const cleaned = clean(text, options, analysis);

  stats.innerHTML = chipRow(counts, cleaned.removed, cleaned.replaced);

  const view = renderInspector(text, findings);
  const notices = [];
  if (hiddenMessages.length) {
    notices.push(`<div class="alert" role="alert">⚠️ <strong>Hidden payload found.</strong> Invisible tag characters in this text decode to: <code>${esc(hiddenMessages.join(" · "))}</code>. This may be a watermark or a hidden instruction; review the text's source before using it.</div>`);
  }
  if (view.totalMarks > view.shownMarks) {
    notices.push(`<div class="alert info" role="status">The inspector is showing the first ${view.shownMarks.toLocaleString()} of ${view.totalMarks.toLocaleString()} marks so the page stays responsive. The summary above and the cleaned text below still cover every one.</div>`);
  }
  alerts.innerHTML = notices.join("");

  inspector.innerHTML = view.html;
  output.value = cleaned.text;
  syncControls();
}

// Options panel
for (const el of document.querySelectorAll("[data-opt]")) {
  el.checked = options[el.dataset.opt];
  el.addEventListener("change", () => {
    options[el.dataset.opt] = el.checked;
    run();
  });
}

$("emdash-style").addEventListener("change", (e) => {
  options.emDash = e.target.value;
  run();
});

input.addEventListener("input", run);
syncControls();

function loadSample() {
  const hidden = [..."wm:demo-7f3a"].map(c => String.fromCodePoint(0xE0000 + c.codePointAt(0))).join("");
  input.value =
    "Introducing SwiftDesk \u2014 the all\u2011in\u2011one help\u00ADdesk for growing teams. " +
    "Our supp\u043Ert staff replies within 15 minutes, every day from 9:00\u202FAM.\n\n" +
    "\u201CSwiftDesk cut our response time by 40%\u2026 it just works.\u201D\u200B \u2013 a happy customer\n\n" +
    "Try it free\u200E for 30\u00A0days" + hidden + ". No credit card required. Cancel any\u2060time. " +
    "Works great with emoji like \u{1F468}\u200D\u{1F469}\u200D\u{1F467} and \u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F} too.";
  run();
}

$("sample").addEventListener("click", () => {
  loadSample();
  input.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
});

const pasteBtn = $("paste");
const pasteLabel = pasteBtn.textContent;
let pasteFlashTimer = 0;
let waitingForPaste = false;
function flashPaste(msg) {
  pasteBtn.textContent = msg;
  clearTimeout(pasteFlashTimer);
  pasteFlashTimer = setTimeout(() => { pasteBtn.textContent = pasteLabel; }, 2600);
}
pasteBtn.addEventListener("click", async () => {
  // Read the clipboard on every device. On iOS the system shows its Paste
  // confirmation bubble at the tap point; confirming it fills the box and
  // cleans in one motion. That bubble is the minimum iOS allows before a
  // page may read the clipboard.
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      input.value = text;
      run();
      input.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
      return;
    }
    flashPaste("Clipboard is empty");
    return;
  } catch { /* declined or unsupported, fall back to a manual paste */ }
  waitingForPaste = true;
  input.focus();
  input.select(); // a manual paste then replaces the old content
  flashPaste(matchMedia("(pointer: coarse)").matches
    ? "Long-press the box, then Paste"
    : (navigator.platform?.includes("Mac") ? "Press \u2318V to paste" : "Press Ctrl+V to paste"));
});
// After a manual paste the box's input listener runs the cleaner; this only
// restores the button label.
input.addEventListener("paste", () => {
  if (!waitingForPaste) return;
  waitingForPaste = false;
  clearTimeout(pasteFlashTimer);
  pasteBtn.textContent = pasteLabel;
});

$("clear").addEventListener("click", () => {
  input.value = "";
  run();
  input.focus();
});

copyBtn.addEventListener("click", async () => {
  let copied = false;
  try {
    await navigator.clipboard.writeText(output.value);
    copied = true;
  } catch {
    output.select();
    try { copied = document.execCommand("copy"); } catch { /* leave selected */ }
  }
  copyBtn.textContent = copied ? "Copied ✓" : "Copy manually";
  copyStatus.textContent = copied ? "Cleaned text copied." : "Automatic copy failed. The cleaned text is selected for manual copying.";
  setTimeout(() => {
    copyBtn.textContent = "Copy cleaned text";
    copyStatus.textContent = "";
  }, 2200);
});

run();

if (new URLSearchParams(location.search).has("demo")) loadSample();

const toTop = document.getElementById("to-top");
if (toTop) {
  addEventListener("scroll", () => {
    toTop.classList.toggle("show", scrollY > 600);
  }, { passive: true });
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: scrollBehavior() }));
}

const themeToggle = document.getElementById("theme-toggle");
function syncThemeIcon() {
  const label = document.documentElement.dataset.theme === "light" ? "Switch to dark mode" : "Switch to light mode";
  themeToggle.setAttribute("aria-label", label);
  themeToggle.setAttribute("data-tip", label);
}
let themeFadeTimer = 0;
themeToggle.addEventListener("click", () => {
  // Crossfade the page in one composited pass where the browser supports
  // view transitions; text then cannot re-ease its inherited color and lag
  // behind the page. Elsewhere, fall back to fading only non-inherited
  // colors so text switches in one clean step.
  if (document.startViewTransition) {
    document.documentElement.classList.add("vt-active");
    const vt = document.startViewTransition(() => {
      const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("theme", next);
      syncThemeIcon();
    });
    vt.finished.finally(() => document.documentElement.classList.remove("vt-active"));
    return;
  }
  document.documentElement.classList.add("theme-fading");
  clearTimeout(themeFadeTimer);
  themeFadeTimer = setTimeout(() => document.documentElement.classList.remove("theme-fading"), 500);
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
  syncThemeIcon();
});
syncThemeIcon();

if (reducedMotion.matches) document.querySelector(".hero-art svg")?.pauseAnimations?.();

// Use a reading line below the sticky header so menu jumps and scrolling
// resolve the active section consistently.
const navAnchors = [...document.querySelectorAll(".nav-links a")];
const navSections = navAnchors.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
navSections.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
function syncActiveLink() {
  const nav = document.querySelector(".site-nav");
  const line = (nav ? nav.offsetHeight : 0) + 40;
  let current = null;
  for (const sec of navSections) {
    if (sec.getBoundingClientRect().top <= line) current = sec;
  }
  // At the very bottom the last section is current even when the page is
  // too short to lift its heading up to the line.
  if (navSections.length && Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2) {
    current = navSections[navSections.length - 1];
  }
  for (const a of navAnchors) {
    const on = !!current && a.hash === "#" + current.id;
    a.classList.toggle("active", on);
    if (on) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  }
}
let spyRaf = 0;
addEventListener("scroll", () => { if (!spyRaf) spyRaf = requestAnimationFrame(() => { spyRaf = 0; syncActiveLink(); }); }, { passive: true });
addEventListener("resize", syncActiveLink, { passive: true });
syncActiveLink();

const scene = document.querySelector(".bg-scene");
if (scene && matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let rafId = 0;
  addEventListener("mousemove", (e) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      scene.style.setProperty("--px", (e.clientX / innerWidth - 0.5).toFixed(3));
      scene.style.setProperty("--py", (e.clientY / innerHeight - 0.5).toFixed(3));
    });
  }, { passive: true });
}

if (scene && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let scrollRaf = 0;
  const applyScroll = () => {
    scrollRaf = 0;
    scene.style.setProperty("--sy", String(scrollY));
  };
  addEventListener("scroll", () => {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(applyScroll);
  }, { passive: true });
  applyScroll();
}

// The bar is a brand row plus a menu band, and the band wraps on narrow
// screens, so the anchor offset is measured rather than hardcoded.
const siteNav = document.querySelector(".site-nav");
if (siteNav) {
  const setNavHeight = () => document.documentElement.style.setProperty("--nav-h", siteNav.offsetHeight + "px");
  addEventListener("resize", setNavHeight, { passive: true });
  setNavHeight();
}
