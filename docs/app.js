/*! AI Paste Cleaner | Copyright (c) 2026 Jayden Yoon ZK | MIT License | https://github.com/JaydenYoonZK/ai-paste-cleaner */
import { analyze, clean, CATEGORIES, DEFAULT_OPTIONS } from "./cleaner.js?v=1.6.0";

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
      html += `<span class="hl ${color}" role="img" title="${tip}" aria-label="${tip}" tabindex="0">${esc(f.char)}</span>`;
    } else {
      html += `<span class="badge ${f.exempt ? "exempt" : color}" role="img" title="${tip}" aria-label="${tip}" tabindex="0">${f.exempt ? "\u2713 " : ""}${shortLabel(f)}</span>`;
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
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "light" ? "#f6f4ee" : "#0d0c0a");
      try { localStorage.setItem("theme", next); } catch { /* storage may be blocked */ }
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
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "light" ? "#f6f4ee" : "#0d0c0a");
  try { localStorage.setItem("theme", next); } catch { /* storage may be blocked */ }
  syncThemeIcon();
});
syncThemeIcon();

if (reducedMotion.matches) document.querySelectorAll("svg").forEach((el) => el.pauseAnimations?.());

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

// Cursor dust: tiny chartreuse sparks trail the pointer and burn out about
// a second after it rests. Everything lives on one fixed canvas: spawning
// is distance-based so speed sets density, the animation loop stops the
// moment the last spark dies, and touch or reduced-motion visitors never
// pay for any of it.
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  // width/height 100% is load-bearing: a canvas is a replaced element, so
  // inset alone does not stretch it and it would lay out at its intrinsic
  // dpr-scaled size, drawing every spark dpr times too far from the cursor.
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:2100;pointer-events:none;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  let w = 0, h = 0;
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  addEventListener("resize", size);

  // One pre-rendered glow sprite per theme: drawImage per spark is far
  // cheaper than building a fresh radial gradient every frame.
  const sprite = (core) => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const halo = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    halo.addColorStop(0, "rgba(171, 207, 55, 0.55)");
    halo.addColorStop(0.4, "rgba(171, 207, 55, 0.16)");
    halo.addColorStop(1, "rgba(171, 207, 55, 0)");
    g.fillStyle = halo;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = core;
    g.beginPath();
    g.arc(32, 32, 4.5, 0, 7);
    g.fill();
    return c;
  };
  // The pale core glows against the night theme; light mode gets a deeper
  // green core so the dust stays visible on cream.
  const dust = { dark: sprite("#d7ef7a"), light: sprite("#7e9c26") };

  const sparks = [];
  const MAX = 90;
  let raf = 0, prev = 0, lastX = -1, lastY = -1, carry = 0;

  const spawn = (x, y, dx, dy) => {
    if (sparks.length >= MAX) return;
    const a = Math.random() * Math.PI * 2;
    const push = 4 + Math.random() * 16;
    sparks.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(a) * push + dx * 1.4,
      vy: Math.sin(a) * push + dy * 1.4,
      life: 0,
      ttl: 0.45 + Math.random() * 0.5,
      r: 5 + Math.random() * 9,
      star: Math.random() < 0.25,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 4,
      seed: Math.random() * 40
    });
  };

  const star = (R) => {
    ctx.beginPath();
    ctx.moveTo(0, -R);
    ctx.quadraticCurveTo(R * 0.16, -R * 0.16, R, 0);
    ctx.quadraticCurveTo(R * 0.16, R * 0.16, 0, R);
    ctx.quadraticCurveTo(-R * 0.16, R * 0.16, -R, 0);
    ctx.quadraticCurveTo(-R * 0.16, -R * 0.16, 0, -R);
    ctx.fill();
  };

  const tick = (now) => {
    const t = now / 1000;
    const dt = Math.min(0.05, prev ? t - prev : 0.016);
    prev = t;
    ctx.clearRect(0, 0, w, h);
    const light = document.documentElement.dataset.theme === "light";
    const img = light ? dust.light : dust.dark;
    ctx.fillStyle = light ? "#7e9c26" : "#d7ef7a";
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life += dt;
      if (s.life >= s.ttl) { sparks.splice(i, 1); continue; }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.9;
      s.vy = s.vy * 0.9 + 26 * dt; // the dust settles gently
      const k = 1 - s.life / s.ttl;
      const twinkle = 0.7 + 0.3 * Math.sin(t * 16 + s.seed);
      ctx.globalAlpha = k * k * twinkle;
      const R = s.r * (0.5 + 0.7 * k);
      ctx.drawImage(img, s.x - R, s.y - R, R * 2, R * 2);
      if (s.star) {
        s.rot += s.spin * dt;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        star(R * 0.9);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    if (sparks.length) raf = requestAnimationFrame(tick);
    else { raf = 0; prev = 0; ctx.clearRect(0, 0, w, h); }
  };

  addEventListener("pointermove", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    if (lastX < 0) { lastX = e.clientX; lastY = e.clientY; return; }
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    carry += Math.hypot(dx, dy);
    while (carry > 10) {
      carry -= 10;
      spawn(e.clientX, e.clientY, dx, dy);
    }
    if (sparks.length && !raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
})();


// Offline support: a small service worker caches the page shell so the
// tool opens without a connection after the first visit.
if ("serviceWorker" in navigator) {
  addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => { /* offline support is optional */ });
  });
}

console.info(
  "%cBuilt by Jayden Yoon ZK%c https://github.com/JaydenYoonZK",
  "background:#abcf37;color:#101400;font-weight:700;padding:2px 8px;border-radius:999px",
  "color:inherit"
);

// The footer's copyright year keeps itself current.
const yearEl = document.getElementById("copyright-year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// FAQ accordions: the button carries the disclosure state, so keyboard
// and screen reader users get the expand and collapse for free.
document.querySelectorAll(".faq-q button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const open = item.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
});

// Terminal section: copy a command with one press.
document.querySelectorAll(".cli-copy").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const code = btn.closest(".cli-card")?.querySelector("code");
    if (!code) return;
    try { await navigator.clipboard.writeText(code.textContent.trim()); } catch { return; }
    const label = btn.textContent;
    btn.textContent = "Copied \u2713";
    setTimeout(() => { btn.textContent = label; }, 1400);
  });
});
