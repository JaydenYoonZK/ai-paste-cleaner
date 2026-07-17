/*! AI Paste Cleaner | Copyright (c) 2026 Jayden Yoon ZK | MIT License | https://github.com/JaydenYoonZK/ai-paste-cleaner */
/**
 * ai-paste-cleaner engine
 *
 * Pure functions, no DOM access. The same module runs in the browser
 * and under Node's test runner.
 *
 * Design rule: preserve recognized legitimate contexts. Zero-width joiners
 * inside emoji, ZWNJ inside joining scripts, supported variation sequences,
 * and subdivision-flag tags are detected but exempted from cleaning, and the
 * UI explains why.
 */

export const CATEGORIES = {
  invisible: {
    label: "Invisible characters",
    color: "green",
    why: "Zero-width and filler characters survive copy-paste, break string comparisons, corrupt YAML and JSON, and show up as phantom diffs in git."
  },
  bidi: {
    label: "Direction controls",
    color: "red",
    why: "Bidirectional control characters reorder how text is displayed. In source code, the logic a reviewer reads can differ from the logic a compiler ingests (Trojan Source, CVE-2021-42574). In a filename, exe.txt can be made to appear as txt.exe (right-to-left override spoofing)."
  },
  tags: {
    label: "Hidden tag characters",
    color: "red",
    why: "Unicode tag characters encode ASCII-based strings without ordinary visible glyphs. Outside valid emoji tag sequences, they are decoded and removed for review."
  },
  variation: {
    label: "Variation selectors",
    color: "amber",
    why: "Variation selectors choose defined glyph forms. Misplaced or repeated selectors have no visible purpose and can carry hidden data."
  },
  spaces: {
    label: "Nonstandard spaces",
    color: "amber",
    why: "Spaces that look ordinary but are not can break search, deduplication, shell commands, and CSV parsing."
  },
  typography: {
    label: "Typographic substitutions",
    color: "blue",
    why: "Smart quotes, em dashes, and the single-character ellipsis are valid prose typography but can break code, configuration files, and shell commands."
  },
  confusables: {
    label: "Mixed-script lookalikes",
    color: "red",
    why: "Cyrillic or Greek letters inside Latin words can be used in phishing and can bypass exact-match filters while appearing familiar to a reader."
  }
};

const N = (cp, name, category, replacement = "") => ({ cp, name, category, replacement });

// Single-codepoint rules.
const CHAR_RULES = new Map([
  // Invisible
  [0x200B, N(0x200B, "ZERO WIDTH SPACE", "invisible")],
  [0x2060, N(0x2060, "WORD JOINER", "invisible")],
  [0xFEFF, N(0xFEFF, "ZERO WIDTH NO-BREAK SPACE (BOM)", "invisible")],
  [0x00AD, N(0x00AD, "SOFT HYPHEN", "invisible")],
  [0x180E, N(0x180E, "MONGOLIAN VOWEL SEPARATOR", "invisible")],
  [0x180F, N(0x180F, "MONGOLIAN FREE VARIATION SELECTOR FOUR", "variation")],
  [0x2061, N(0x2061, "FUNCTION APPLICATION", "invisible")],
  [0x2062, N(0x2062, "INVISIBLE TIMES", "invisible")],
  [0x2063, N(0x2063, "INVISIBLE SEPARATOR", "invisible")],
  [0x2064, N(0x2064, "INVISIBLE PLUS", "invisible")],
  [0x3164, N(0x3164, "HANGUL FILLER", "invisible")],
  [0xFFA0, N(0xFFA0, "HALFWIDTH HANGUL FILLER", "invisible")],
  [0x115F, N(0x115F, "HANGUL CHOSEONG FILLER", "invisible")],
  [0x1160, N(0x1160, "HANGUL JUNGSEONG FILLER", "invisible")],
  [0x034F, N(0x034F, "COMBINING GRAPHEME JOINER", "invisible")],
  [0xFFFC, N(0xFFFC, "OBJECT REPLACEMENT CHARACTER", "invisible")],
  // Unicode-only line breaks can create unexpected boundaries and break
  // pre-ES2019 JavaScript source. Normalize them to a plain newline.
  [0x0085, N(0x0085, "NEXT LINE (NEL)", "invisible", "\n")],
  [0x2028, N(0x2028, "LINE SEPARATOR", "invisible", "\n")],
  [0x2029, N(0x2029, "PARAGRAPH SEPARATOR", "invisible", "\n")],
  // Joiners (context-aware, see exemptions)
  [0x200C, N(0x200C, "ZERO WIDTH NON-JOINER", "invisible")],
  [0x200D, N(0x200D, "ZERO WIDTH JOINER", "invisible")],
  // Direction controls
  [0x200E, N(0x200E, "LEFT-TO-RIGHT MARK", "bidi")],
  [0x200F, N(0x200F, "RIGHT-TO-LEFT MARK", "bidi")],
  [0x061C, N(0x061C, "ARABIC LETTER MARK", "bidi")],
  // Nonstandard spaces
  [0x00A0, N(0x00A0, "NO-BREAK SPACE", "spaces", " ")],
  [0x202F, N(0x202F, "NARROW NO-BREAK SPACE", "spaces", " ")],
  [0x1680, N(0x1680, "OGHAM SPACE MARK", "spaces", " ")],
  [0x205F, N(0x205F, "MEDIUM MATHEMATICAL SPACE", "spaces", " ")],
  [0x3000, N(0x3000, "IDEOGRAPHIC SPACE", "spaces", " ")],
  [0x2800, N(0x2800, "BRAILLE PATTERN BLANK", "spaces", " ")],
  // Typography
  [0x2018, N(0x2018, "LEFT SINGLE QUOTATION MARK", "typography", "'")],
  [0x2019, N(0x2019, "RIGHT SINGLE QUOTATION MARK", "typography", "'")],
  [0x201C, N(0x201C, "LEFT DOUBLE QUOTATION MARK", "typography", '"')],
  [0x201D, N(0x201D, "RIGHT DOUBLE QUOTATION MARK", "typography", '"')],
  [0x2032, N(0x2032, "PRIME", "typography", "'")],
  [0x2033, N(0x2033, "DOUBLE PRIME", "typography", '"')],
  [0x2026, N(0x2026, "HORIZONTAL ELLIPSIS", "typography", "...")],
  [0x2011, N(0x2011, "NON-BREAKING HYPHEN", "typography", "-")],
  [0x2212, N(0x2212, "MINUS SIGN", "typography", "-")],
  [0x2013, N(0x2013, "EN DASH", "typography", "-")],
  [0x2014, N(0x2014, "EM DASH", "typography", ", ")]
]);

// Codepoint-range rules.
const RANGE_RULES = [
  { from: 0x202A, to: 0x202E, name: "BIDI EMBEDDING/OVERRIDE CONTROL", category: "bidi" },
  { from: 0x2066, to: 0x2069, name: "BIDI ISOLATE CONTROL", category: "bidi" },
  { from: 0x2000, to: 0x200A, name: "TYPOGRAPHIC SPACE", category: "spaces", replacement: " " },
  { from: 0xFE00, to: 0xFE0F, name: "VARIATION SELECTOR", category: "variation" },
  { from: 0x180B, to: 0x180D, name: "MONGOLIAN FREE VARIATION SELECTOR", category: "variation" },
  { from: 0xE0100, to: 0xE01EF, name: "VARIATION SELECTOR SUPPLEMENT", category: "variation" },
  { from: 0xE0000, to: 0xE007F, name: "TAG CHARACTER", category: "tags" }
];

// Mixed-script lookalikes mapped to their Latin twins.
export const CONFUSABLES = new Map(Object.entries({
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c",
  "у": "y", "х": "x", "ѕ": "s", "і": "i", "ј": "j",
  "һ": "h", "ԛ": "q", "ԝ": "w",
  "А": "A", "В": "B", "Е": "E", "К": "K", "М": "M",
  "Н": "H", "О": "O", "Р": "P", "С": "C", "Т": "T",
  "У": "Y", "Х": "X", "Ѕ": "S", "І": "I", "Ј": "J",
  "ο": "o", "ν": "v",
  "Α": "A", "Β": "B", "Ε": "E", "Ζ": "Z", "Η": "H",
  "Ι": "I", "Κ": "K", "Μ": "M", "Ν": "N", "Ο": "O",
  "Ρ": "P", "Τ": "T", "Υ": "Y", "Χ": "X"
}));

const EMOJI_BASE = /\p{Emoji}/u;
// For ZWJ context, digits and #/* must NOT count as emoji: they are keycap
// bases for variation selectors, but no emoji ZWJ sequence joins through
// them, so a ZWJ between digits is not a valid emoji join.
const EMOJI_CORE = /\p{Extended_Pictographic}/u;
const HAN = /\p{Script=Han}/u;
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const MONGOLIAN = /\p{Script=Mongolian}/u;
const ZWNJ_SCRIPTS = new RegExp(
  "[" +
  "\\p{Script=Arabic}\\p{Script=Syriac}\\p{Script=Nko}\\p{Script=Mongolian}" +
  "\\p{Script=Devanagari}\\p{Script=Bengali}\\p{Script=Gurmukhi}\\p{Script=Gujarati}" +
  "\\p{Script=Oriya}\\p{Script=Tamil}\\p{Script=Telugu}\\p{Script=Kannada}" +
  "\\p{Script=Malayalam}\\p{Script=Sinhala}\\p{Script=Myanmar}\\p{Script=Khmer}" +
  "\\p{Script=Lao}\\p{Script=Thai}\\p{Script=Tibetan}" +
  "]", "u"
);
const LATIN = /\p{Script=Latin}/u;
const CYR_GREEK = /[\p{Script=Cyrillic}\p{Script=Greek}]/u;
const WORD = /[\p{L}\p{M}][\p{L}\p{M}'’-]*/gu;
const BLACK_FLAG = 0x1F3F4;
const CANCEL_TAG = 0xE007F;
// The emoji subdivision flags with RGI status (Unicode CLDR): England,
// Scotland, Wales. Any other tag body behind a black flag is treated as a
// hidden payload, not a flag.
const RGI_SUBDIVISION_FLAGS = new Set(["gbeng", "gbsct", "gbwls"]);
// Whitespace that can indent a line, including the exotic spaces this tool
// normalizes, so a dash opening a line is recognized however it was indented.
const SPACE_LIKE = /[ \t\u00A0\u202F\u2000-\u200A\u1680\u205F\u3000]/;
const isSpaceLike = (c) => c !== "" && SPACE_LIKE.test(c);

function ruleFor(cp) {
  const single = CHAR_RULES.get(cp);
  if (single) return single;
  for (const r of RANGE_RULES) {
    if (cp >= r.from && cp <= r.to) {
      return N(cp, r.name, r.category, r.replacement ?? "");
    }
  }
  return null;
}

function hex(cp) {
  return "U+" + cp.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Analyze text. Returns findings (one per suspicious character or word),
 * decoded hidden messages, and per-category counts.
 *
 * Finding: { index, length, cp?, char, name, category, exempt, note?, replacement? }
 */
export function analyze(text) {
  const cps = Array.from(text);
  const findings = [];
  const hiddenMessages = [];

  // Precompute string indexes for each codepoint position.
  const starts = new Array(cps.length);
  let pos = 0;
  for (let i = 0; i < cps.length; i++) {
    starts[i] = pos;
    pos += cps[i].length;
  }

  // Modifiers to look through when finding the real neighbor: variation
  // selectors, ZWJ, and skin tone modifiers. The scan is capped because a
  // legitimate emoji sequence never stacks more than a few of these; without
  // the cap, a pasted run of thousands of modifiers costs O(n^2).
  const isJoinModifier = (c) =>
    (c >= 0xFE00 && c <= 0xFE0F) || c === 0x200D || (c >= 0x1F3FB && c <= 0x1F3FF);
  const isEmojiNeighborModifier = (c) =>
    (c >= 0xFE00 && c <= 0xFE0F) || (c >= 0x1F3FB && c <= 0x1F3FF);
  const MAX_MODIFIER_SCAN = 16;
  const prevOf = (i) => {
    for (let j = i - 1, skipped = 0; j >= 0 && skipped <= MAX_MODIFIER_SCAN; j--) {
      const c = cps[j].codePointAt(0);
      if (isJoinModifier(c)) { skipped++; continue; }
      return cps[j];
    }
    return "";
  };
  const prevEmojiNeighborOf = (i) => {
    for (let j = i - 1, skipped = 0; j >= 0 && skipped <= MAX_MODIFIER_SCAN; j--) {
      const c = cps[j].codePointAt(0);
      if (isEmojiNeighborModifier(c)) { skipped++; continue; }
      return cps[j];
    }
    return "";
  };
  const nextEmojiNeighborOf = (i) => {
    for (let j = i + 1, skipped = 0; j < cps.length && skipped <= MAX_MODIFIER_SCAN; j++) {
      const c = cps[j].codePointAt(0);
      if (isEmojiNeighborModifier(c)) { skipped++; continue; }
      return cps[j];
    }
    return "";
  };
  const nextOf = (i) => {
    for (let j = i + 1, skipped = 0; j < cps.length && skipped <= MAX_MODIFIER_SCAN; j++) {
      const c = cps[j].codePointAt(0);
      if (isJoinModifier(c)) { skipped++; continue; }
      return cps[j];
    }
    return "";
  };
  // Tag runs are classified once per run, not once per character.
  let tagRunEnd = -1;
  let tagRunExempt = false;

  for (let i = 0; i < cps.length; i++) {
    const ch = cps[i];
    const cp = ch.codePointAt(0);
    const rule = ruleFor(cp);
    if (!rule) continue;

    let exempt = false;
    let note = "";

    if (cp === 0x200D) {
      const prev = prevEmojiNeighborOf(i);
      const next = nextEmojiNeighborOf(i);
      if (EMOJI_CORE.test(prev) && EMOJI_CORE.test(next)) {
        exempt = true;
        note = "Part of an emoji sequence. Removing it would split the emoji.";
      } else {
        // ZWJ is required orthography in several scripts: Sinhala rakaransaya,
        // Tamil sri ligatures, Devanagari eyelash ra and half forms, and more.
        // Both real neighbors must belong to a joining script, so a ZWJ hidden
        // between Latin letters is still cleaned.
        const p = i > 0 ? cps[i - 1] : "";
        const n = i + 1 < cps.length ? cps[i + 1] : "";
        if (ZWNJ_SCRIPTS.test(p) && ZWNJ_SCRIPTS.test(n)) {
          exempt = true;
          note = "Required for correct shaping in this script (Sinhala, Tamil, Devanagari, and others).";
        }
      }
    } else if (cp === 0x200C) {
      const around = prevOf(i) + nextOf(i);
      if (ZWNJ_SCRIPTS.test(around)) {
        exempt = true;
        note = "Required for correct shaping in this script (Persian, Hindi, and others).";
      }
    } else if (cp === 0xFE0E || cp === 0xFE0F) {
      const prev = i > 0 ? cps[i - 1] : "";
      if (EMOJI_BASE.test(prev)) {
        exempt = true;
        note = "Selects emoji or text presentation for the preceding symbol.";
      }
    } else if ((cp >= 0x180B && cp <= 0x180D) || cp === 0x180F) {
      const prev = i > 0 ? cps[i - 1] : "";
      if (MONGOLIAN.test(prev)) {
        exempt = true;
        note = "Selects a standardized glyph form for the preceding Mongolian letter.";
      }
    } else if (rule.category === "variation") {
      const prev = i > 0 ? cps[i - 1] : "";
      if (HAN.test(prev)) {
        exempt = true;
        note = "Part of a CJK ideographic variation sequence.";
      }
    } else if (rule.category === "tags") {
      if (i > tagRunEnd) {
        // New run: find its end and decode the payload once.
        let j = i;
        let msg = "";
        while (j < cps.length) {
          const c = cps[j].codePointAt(0);
          if (ruleFor(c)?.category !== "tags") break;
          if (c >= 0xE0020 && c <= 0xE007E) msg += String.fromCodePoint(c - 0xE0000);
          j++;
        }
        tagRunEnd = j - 1;
        // A real subdivision flag (Scotland, Wales, England) is a black flag
        // followed by one of the RGI region codes and a cancel tag. A black
        // flag in front of anything else does not launder the payload: a run
        // whose body is not an RGI code is decoded and cleaned like any other.
        const before = i > 0 ? cps[i - 1].codePointAt(0) : 0;
        const run = cps.slice(i, j).map(c => c.codePointAt(0));
        const endsWithCancel = run[run.length - 1] === CANCEL_TAG;
        const body = endsWithCancel ? run.slice(0, -1) : run;
        const bodyText = body.map(c => String.fromCodePoint(c - 0xE0000)).join("");
        tagRunExempt = before === BLACK_FLAG && endsWithCancel && RGI_SUBDIVISION_FLAGS.has(bodyText);
        if (!tagRunExempt && msg.trim()) hiddenMessages.push(msg);
      }
      if (tagRunExempt) {
        exempt = true;
        note = "Part of a subdivision flag emoji.";
      }
    } else if (cp === 0x3000) {
      const prev = i > 0 ? cps[i - 1] : "";
      const next = i + 1 < cps.length ? cps[i + 1] : "";
      if (CJK.test(prev) || CJK.test(next)) {
        exempt = true;
        note = "Ideographic space next to CJK text is standard typography.";
      }
    } else if (cp === 0x00A0 || cp === 0x202F) {
      const prev = i > 0 ? cps[i - 1] : "";
      const next = i + 1 < cps.length ? cps[i + 1] : "";
      if (/[«‹]/.test(prev) || /[»›!?;:]/.test(next)) {
        exempt = true;
        note = "Standard French spacing around punctuation.";
      }
    } else if (cp === 0x2014) {
      const prev = i > 0 ? cps[i - 1] : "";
      const next = i + 1 < cps.length ? cps[i + 1] : "";
      // An em dash between digits is left alone because its replacement is a
      // comma, and "3, 4" corrupts a range. An en dash in the same spot has a
      // clean ASCII equivalent (a hyphen: "3-4"), so it is converted like any
      // other typography rather than kept.
      if (/\d/.test(prev) && /\d/.test(next)) {
        exempt = true;
        note = "Em dash between digits reads as a range. Left alone.";
      } else {
        // A dash opening a line is deliberate typography (dialogue, lists,
        // attributions), not the mid-sentence pattern this category targets.
        // Any whitespace can indent it, including the exotic spaces this tool
        // itself normalizes, so the walk-back skips all of them.
        let k = i - 1;
        while (k >= 0 && isSpaceLike(cps[k])) k--;
        if (k < 0 || cps[k] === "\n" || cps[k] === "\r") {
          exempt = true;
          note = "Em dash opening a line reads as a list or dialogue marker. Left alone.";
        }
      }
    }

    findings.push({
      index: starts[i],
      length: ch.length,
      cp,
      char: ch,
      code: hex(cp),
      name: rule.name,
      category: rule.category,
      replacement: rule.replacement,
      exempt,
      note
    });
  }

  // Mixed-script lookalike detection, word by word.
  for (const m of text.matchAll(WORD)) {
    const word = m[0];
    if (!(LATIN.test(word) && CYR_GREEK.test(word))) continue;
    const wcps = Array.from(word);
    // A spoof only works if every non-Latin letter passes as Latin. A word
    // that also contains plainly foreign letters (like the whole of a fused
    // Russian token) is genuine mixed-language text, so it is left alone.
    // This also keeps clean() idempotent when removing an invisible character
    // fuses two single-script tokens into one word.
    const foreign = wcps.filter((c) => CYR_GREEK.test(c));
    if (!foreign.every((c) => CONFUSABLES.has(c))) continue;
    let off = 0;
    for (const wch of wcps) {
      if (CONFUSABLES.has(wch)) {
        const cp = wch.codePointAt(0);
        findings.push({
          index: m.index + off,
          length: wch.length,
          cp,
          char: wch,
          code: hex(cp),
          name: "LOOKALIKE LETTER IN LATIN WORD",
          category: "confusables",
          replacement: CONFUSABLES.get(wch),
          exempt: false,
          note: `Looks like "${CONFUSABLES.get(wch)}" but is a different letter (${hex(cp)}).`
        });
      }
      off += wch.length;
    }
  }

  findings.sort((a, b) => a.index - b.index);

  const counts = {};
  for (const key of Object.keys(CATEGORIES)) counts[key] = { found: 0, exempt: 0 };
  for (const f of findings) {
    counts[f.category].found++;
    if (f.exempt) counts[f.category].exempt++;
  }

  return { findings, hiddenMessages, counts };
}

export const DEFAULT_OPTIONS = {
  invisible: true,
  bidi: true,
  tags: true,
  variation: true,
  spaces: true,
  typography: false,
  confusables: true,
  emDash: "comma" // "comma" | "hyphen" | "keep"
};

/**
 * Clean text. Returns { text, removed, replaced } where removed/replaced
 * count the characters acted on. Exempt findings are always preserved.
 * A completed analysis may be supplied to avoid scanning the same text twice.
 *
 * Removing an invisible character can fuse two single-script tokens into one
 * word that only a rescan recognizes as a lookalike spoof, so clean() runs to
 * a fixed point (bounded): clean(clean(x)) === clean(x).
 */
export function clean(text, options = {}, analysis = null) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let current = cleanOnce(text, opts, analysis);
  let removed = current.removed;
  let replaced = current.replaced;
  let guard = 0;
  while (current.changed && guard++ < 4) {
    const next = cleanOnce(current.text, opts, null);
    if (!next.changed) break;
    removed += next.removed;
    replaced += next.replaced;
    current = next;
  }
  return { text: current.text, removed, replaced };
}

// One cleaning pass. Output is accumulated as chunks and joined once, so the
// em dash branch can trim backwards without rescanning the whole result;
// cleanOnce stays linear even on inputs with tens of thousands of findings.
function cleanOnce(text, opts, analysis) {
  const { findings } = analysis ?? analyze(text);
  const parts = [];
  let cursor = 0;
  let removed = 0;
  let replaced = 0;

  // An exempt no-break space (French spacing, for example) must survive even
  // when it sits next to a converted em dash, so absorption skips it. Any
  // non-exempt no-break space has already become a plain space through its own
  // finding, so trimming only plain spaces below leaves exempt ones intact.
  const exemptSpaceAt = new Set();
  for (const f of findings) {
    if (f.exempt && (f.cp === 0x00A0 || f.cp === 0x202F)) exemptSpaceAt.add(f.index);
  }
  const canAbsorb = (idx) => {
    const c = text[idx];
    if (c === " " || c === "\t") return true;
    if ((c === "\u00A0" || c === "\u202F") && !exemptSpaceAt.has(idx)) return true;
    return false;
  };
  const trimTrailingPlainSpace = () => {
    while (parts.length) {
      const last = parts[parts.length - 1];
      let end = last.length;
      while (end > 0 && (last[end - 1] === " " || last[end - 1] === "\t")) end--;
      if (end === 0) { parts.pop(); continue; }
      if (end < last.length) parts[parts.length - 1] = last.slice(0, end);
      return;
    }
  };
  const dropTrailingSpaceOnce = () => {
    const last = parts.length - 1;
    if (last >= 0 && parts[last].endsWith(" ")) parts[last] = parts[last].slice(0, -1);
  };

  // Text index just past the last converted em dash, for collapsing runs.
  let lastDashEnd = -1;

  for (const f of findings) {
    if (f.index < cursor) continue; // consumed by an earlier dash absorption
    if (f.exempt) continue;
    if (!opts[f.category]) continue;

    if (f.cp === 0x2014) {
      if (opts.emDash === "keep") continue; // stays in the pending slice

      let after = f.index + f.length;
      while (after < text.length && canAbsorb(after)) after++;
      const atBreak = after >= text.length || text[after] === "\n" || text[after] === "\r";

      // A second dash separated from the first by nothing but absorbable
      // spaces joins the same pause: "a — — b" and "a——b" both become "a, b".
      let collapsible = lastDashEnd === cursor;
      for (let p = cursor; collapsible && p < f.index; p++) collapsible = canAbsorb(p);
      if (collapsible) {
        removed++;
        cursor = after;
        lastDashEnd = after;
        // The first dash added a trailing space assuming more text followed;
        // if the run actually ends the line, take that space back.
        if (atBreak) dropTrailingSpaceOnce();
        continue;
      }

      parts.push(text.slice(cursor, f.index));
      trimTrailingPlainSpace();
      // The comma binds to the word before it; at the end of a line or of the
      // text, the pause mark stands alone with no trailing space.
      const core = opts.emDash === "hyphen" ? " -" : ",";
      parts.push(atBreak ? core : core + " ");
      replaced++;
      cursor = after;
      lastDashEnd = after;
      continue;
    }

    parts.push(text.slice(cursor, f.index));
    if (f.replacement) replaced++; else removed++;
    parts.push(f.replacement);
    cursor = f.index + f.length;
  }
  parts.push(text.slice(cursor));

  const out = parts.join("");
  return { text: out, removed, replaced, changed: out !== text };
}

/** Machine-readable ruleset, used by scripts/export-rules.mjs. */
export function ruleset() {
  const rules = [];
  for (const [, r] of CHAR_RULES) {
    rules.push({ codepoint: hex(r.cp), name: r.name, category: r.category, replacement: r.replacement });
  }
  for (const r of RANGE_RULES) {
    rules.push({
      range: [hex(r.from), hex(r.to)].join(".."),
      name: r.name,
      category: r.category,
      replacement: r.replacement ?? ""
    });
  }
  return {
    version: 1,
    categories: Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, v.why])),
    rules,
    confusables: Object.fromEntries(CONFUSABLES)
  };
}
