import { analyze, clean, CATEGORIES, DEFAULT_OPTIONS } from "./cleaner.js";

const $ = (id) => document.getElementById(id);
const input = $("input");
const stats = $("stats");
const alerts = $("alerts");
const inspector = $("inspector");
const output = $("output");
const results = $("results");
const copyBtn = $("copy");
const charcount = $("charcount");

const options = { ...DEFAULT_OPTIONS };

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

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function chipRow(counts, removed, replaced) {
  const rows = [];
  const order = ["invisible", "bidi", "tags", "variation", "spaces", "typography", "confusables"];
  for (const key of order) {
    const c = counts[key];
    const active = c.found - c.exempt;
    if (!c.found) continue;
    const color = CAT_COLOR[key];
    const kept = c.exempt ? ` <span title="Legitimate uses, left untouched">(${c.exempt} kept)</span>` : "";
    rows.push(`<span class="chip ${color}"><strong>${active}</strong> ${CATEGORIES[key].label.toLowerCase()}${kept}</span>`);
  }
  if (!rows.length) {
    return `<span class="chip ok"><strong>0</strong> issues found. This text is clean.</span>`;
  }
  rows.push(`<span class="chip"><strong>${removed}</strong> removed, <strong>${replaced}</strong> replaced by current settings</span>`);
  return rows.join("");
}

function renderInspector(text, findings) {
  let html = "";
  let cursor = 0;
  for (const f of findings) {
    html += esc(text.slice(cursor, f.index));
    const color = CAT_COLOR[f.category];
    const tip = esc(`${f.code} ${f.name}${f.note ? " · " + f.note : ""}${f.exempt ? " · kept" : ""}`);
    if (f.category === "typography" || f.category === "confusables") {
      html += `<span class="hl ${color}" title="${tip}">${esc(f.char)}</span>`;
    } else {
      html += `<span class="badge ${color}${f.exempt ? " exempt" : ""}" title="${tip}">${shortLabel(f)}</span>`;
    }
    cursor = f.index + f.length;
  }
  html += esc(text.slice(cursor));
  return html || '<span style="color:var(--ink-mute)">Paste something above to inspect it.</span>';
}

function run() {
  const text = input.value;
  charcount.textContent = text ? `${Array.from(text).length} characters` : "";
  if (!text) {
    results.hidden = true;
    return;
  }
  results.hidden = false;

  const { findings, hiddenMessages, counts } = analyze(text);
  const cleaned = clean(text, options);

  stats.innerHTML = chipRow(counts, cleaned.removed, cleaned.replaced);

  alerts.innerHTML = hiddenMessages.length
    ? `<div class="alert">⚠️ <strong>Hidden payload found.</strong> Invisible tag characters in this text decode to: <code>${esc(hiddenMessages.join(" · "))}</code>. Someone embedded this on purpose, most likely as a watermark or a smuggled instruction.</div>`
    : "";

  inspector.innerHTML = renderInspector(text, findings);
  output.value = cleaned.text;
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
  input.scrollIntoView({ behavior: "smooth", block: "center" });
});

$("clear").addEventListener("click", () => {
  input.value = "";
  run();
  input.focus();
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    copyBtn.textContent = "Copied ✓";
  } catch {
    output.select();
    document.execCommand("copy");
    copyBtn.textContent = "Copied ✓";
  }
  setTimeout(() => { copyBtn.textContent = "Copy cleaned text"; }, 1600);
});

run();

if (new URLSearchParams(location.search).has("demo")) loadSample();
