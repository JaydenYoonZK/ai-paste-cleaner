#!/usr/bin/env node
// Scan files for invisible Unicode, hidden tag payloads, direction overrides,
// lookalike letters, and smart typography. Report exactly what is there and why,
// fix it only when asked, and never damage legitimate text.
// Usage: npx ai-paste-cleaner <files, folders, or ->

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { analyze, clean, CATEGORIES, DEFAULT_OPTIONS } from "../docs/cleaner.js";
import { printBanner } from "./banner.mjs";

const VERSION = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
).version;

const HELP = `ai-paste-cleaner v${VERSION}
Reveal and remove the characters you cannot see, from files or a pipe.

Usage
  ai-paste-cleaner [options] <files, folders, or ->

Modes
  (default)        report findings, exit 1 if anything needs fixing
  --write          fix the files in place, keeping legitimate characters
  -                read stdin, write cleaned text to stdout
                   e.g.  pbpaste | ai-paste-cleaner - | pbcopy

Options
  --json           machine-readable report on stdout
  --typography     also fix smart quotes, em dashes, and ellipses
  --em-dash <s>    with --typography: comma, hyphen, or keep
  --only <cats>    limit to these categories (comma separated)
  --skip <cats>    exclude these categories
  --list           print every finding instead of the first 20 per file
  --quiet          print the summary only
  --no-color       plain output (NO_COLOR is respected too)
  -V, --version    print the version
  -h, --help       show this help

Categories
  ${Object.keys(CATEGORIES).join(", ")}

Binary files and files over 10 MB are skipped and counted in the summary.

Exit codes
  0 clean or fixed, 1 findings in report mode, 2 usage or read error`;

// ----- arguments ------------------------------------------------------------

const args = process.argv.slice(2);
const opts = {
  write: false, json: false, typography: false, emDash: "comma",
  only: null, skip: null, list: false, quiet: false, color: true, stdin: false
};
const paths = [];
let emDashSet = false;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "-h" || a === "--help") {
    printBanner(`ai-paste-cleaner v${VERSION}`, { color: !process.env.NO_COLOR && !args.includes("--no-color") });
    console.log(HELP);
    process.exit(0);
  }
  else if (a === "-V" || a === "--version") { console.log(VERSION); process.exit(0); }
  else if (a === "--write") opts.write = true;
  else if (a === "--json") opts.json = true;
  else if (a === "--typography") opts.typography = true;
  else if (a === "--em-dash") {
    const v = args[++i];
    if (!["comma", "hyphen", "keep"].includes(v)) fail(`--em-dash takes comma, hyphen, or keep (got "${v ?? ""}")`);
    opts.emDash = v;
    emDashSet = true;
  }
  else if (a === "--only" || a === "--skip") {
    const v = (args[++i] ?? "").split(",").map(s => s.trim()).filter(Boolean);
    const bad = v.filter(c => !CATEGORIES[c]);
    if (!v.length || bad.length) fail(`${a} takes categories: ${Object.keys(CATEGORIES).join(", ")}`);
    opts[a.slice(2)] = v;
  }
  else if (a === "--list") opts.list = true;
  else if (a === "--quiet") opts.quiet = true;
  else if (a === "--no-color") opts.color = false;
  else if (a === "-") opts.stdin = true;
  else if (a.startsWith("-")) fail(`Unknown option "${a}" (see --help)`);
  else paths.push(a);
}

if (process.env.NO_COLOR || !process.stdout.isTTY) opts.color = false;
if (opts.stdin && paths.length) fail("Use either file paths or -, not both");
if (!opts.json && !opts.quiet) printBanner(`ai-paste-cleaner v${VERSION}`, { color: opts.color });
if (!opts.stdin && !paths.length) { console.log(HELP); process.exit(2); }

function fail(msg) {
  console.error(`ai-paste-cleaner: ${msg}`);
  process.exit(2);
}

function warn(msg) {
  console.error(`ai-paste-cleaner: ${msg}`);
}

// Which categories count as actionable in this run.
function enabledCategories() {
  const on = {};
  for (const c of Object.keys(CATEGORIES)) {
    on[c] = c === "typography" ? opts.typography : DEFAULT_OPTIONS[c];
    if (opts.only) on[c] = opts.only.includes(c);
    if (opts.skip && opts.skip.includes(c)) on[c] = false;
  }
  return on;
}
const ENABLED = enabledCategories();
const cleanOptions = { ...ENABLED, emDash: opts.emDash };

if (emDashSet && !ENABLED.typography) {
  warn("--em-dash has no effect without --typography");
}

// Why a category is off, for truthful report labels.
function disabledLabel(cat) {
  if (opts.only && !opts.only.includes(cat)) return "excluded by --only";
  if (opts.skip && opts.skip.includes(cat)) return "skipped by --skip";
  return "off by default";
}

// The replacement a finding will actually get under the current options.
function effectiveReplacement(f) {
  if (f.cp === 0x2014) {
    if (opts.emDash === "keep") return "";
    return opts.emDash === "hyphen" ? " - " : ", ";
  }
  return f.replacement;
}

// ----- output helpers -------------------------------------------------------

const ANSI = { red: 31, amber: 33, green: 32, blue: 36 };
const paint = (code, s) => opts.color ? `\x1b[${code}m${s}\x1b[0m` : s;
const bold = (s) => paint(1, s);
const dim = (s) => paint(2, s);
const catColor = (cat, s) => paint(ANSI[CATEGORIES[cat]?.color] ?? 0, s);

function lineColPair(text, index) {
  let line = 1, last = -1;
  for (let i = 0; i < index; i++) {
    if (text.charCodeAt(i) === 10) { line++; last = i; }
  }
  return { line, column: index - last };
}

function lineCol(text, index) {
  const { line, column } = lineColPair(text, index);
  return `${line}:${column}`;
}

// ----- scanning -------------------------------------------------------------

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "vendor", ".next", ".cache"]);
const MAX_BYTES = 10 * 1024 * 1024;
const skipped = { binary: 0, large: 0, unreadable: 0 };

function collect(p, out, depth = 0) {
  let st;
  try { st = statSync(p); } catch {
    if (depth === 0) fail(`Cannot read ${p}`);
    warn(`skipped ${p} (unreadable)`);
    skipped.unreadable++;
    return;
  }
  if (st.isDirectory()) {
    if (depth > 0 && SKIP_DIRS.has(basename(p))) return;
    for (const entry of readdirSync(p)) {
      if (depth === 0 || !entry.startsWith(".")) collect(join(p, entry), out, depth + 1);
    }
  } else if (st.isFile()) {
    if (st.size > MAX_BYTES) {
      if (depth === 0) warn(`${p} is larger than 10 MB, skipped`);
      skipped.large++;
      return;
    }
    out.push(p);
  }
}

function isBinary(buf) {
  const n = Math.min(buf.length, 8192);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

// An em dash the user chose to keep is not actionable: report, write, JSON,
// and exit codes all agree with what clean() will actually do.
const keptByChoice = (f) => f.cp === 0x2014 && opts.emDash === "keep";

function scanText(text) {
  const { findings, hiddenMessages, counts } = analyze(text);
  const actionable = findings.filter(f => !f.exempt && ENABLED[f.category] && !keptByChoice(f));
  const kept = findings.filter(f => f.exempt);
  const optional = findings.filter(f => !f.exempt && !ENABLED[f.category]);
  return { findings, hiddenMessages, counts, actionable, kept, optional };
}

// ----- stdin pipe mode ------------------------------------------------------

if (opts.stdin) {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const input = Buffer.concat(chunks).toString("utf8");
  const scan = scanText(input);

  if (opts.json) {
    // Same envelope as file mode, so pipeline consumers read one schema.
    const out = {
      tool: "ai-paste-cleaner",
      version: VERSION,
      scanned: 1,
      skippedBinary: 0,
      skippedLarge: 0,
      skippedUnreadable: 0,
      files: scan.findings.length || scan.hiddenMessages.length
        ? [jsonEntry("stdin", input, scan, false)]
        : [],
      totals: {
        fixable: scan.actionable.length,
        kept: scan.kept.length,
        optional: scan.optional.length,
        hiddenMessages: scan.hiddenMessages.length
      },
      clean: scan.actionable.length === 0
    };
    console.log(JSON.stringify(out, null, 2));
    process.exit(scan.actionable.length ? 1 : 0);
  }

  const { text } = clean(input, cleanOptions);
  process.stdout.write(text);
  if (!opts.quiet) {
    const n = scan.actionable.length;
    process.stderr.write(n
      ? `ai-paste-cleaner: fixed ${n} character${n === 1 ? "" : "s"}${scan.kept.length ? `, kept ${scan.kept.length} legitimate` : ""}\n`
      : "ai-paste-cleaner: already clean\n");
  }
  process.exit(0);
}

// ----- file mode ------------------------------------------------------------

const files = [];
for (const p of paths) collect(p, files);
if (!files.length) {
  // If everything named was skipped, say why rather than a bare failure.
  const why = [];
  if (skipped.large) why.push(`${skipped.large} over 10 MB`);
  if (skipped.binary) why.push(`${skipped.binary} binary`);
  if (skipped.unreadable) why.push(`${skipped.unreadable} unreadable`);
  fail(why.length ? `Nothing to scan: ${why.join(", ")}` : "No files to scan");
}

const report = [];

for (const file of files) {
  let buf;
  try { buf = readFileSync(file); } catch {
    warn(`skipped ${file} (unreadable)`);
    skipped.unreadable++;
    continue;
  }
  if (isBinary(buf)) { skipped.binary++; continue; }
  const text = buf.toString("utf8");
  const scan = scanText(text);

  let wrote = false;
  if (opts.write && scan.actionable.length) {
    const { text: cleaned } = clean(text, cleanOptions);
    if (cleaned !== text) {
      try { writeFileSync(file, cleaned); } catch { fail(`Cannot write ${file}`); }
      wrote = true;
    }
  }
  report.push({ file, text, scan, wrote });
}

const dirty = report.filter(r => r.scan.actionable.length);
const totalFix = dirty.reduce((n, r) => n + r.scan.actionable.length, 0);
const totalKept = report.reduce((n, r) => n + r.scan.kept.length, 0);
const totalOpt = report.reduce((n, r) => n + r.scan.optional.length, 0);
const totalHidden = report.reduce((n, r) => n + r.scan.hiddenMessages.length, 0);

if (opts.json) {
  const out = {
    tool: "ai-paste-cleaner",
    version: VERSION,
    scanned: report.length,
    skippedBinary: skipped.binary,
    skippedLarge: skipped.large,
    skippedUnreadable: skipped.unreadable,
    files: report.filter(r => r.scan.findings.length || r.scan.hiddenMessages.length)
      .map(r => jsonEntry(r.file, r.text, r.scan, r.wrote)),
    totals: { fixable: totalFix, kept: totalKept, optional: totalOpt, hiddenMessages: totalHidden },
    clean: dirty.length === 0
  };
  console.log(JSON.stringify(out, null, 2));
  process.exit(opts.write || !dirty.length ? 0 : 1);
}

function jsonEntry(path, text, scan, wrote) {
  return {
    path,
    fixed: !!wrote,
    hiddenMessages: scan.hiddenMessages,
    findings: scan.findings.map(f => {
      // line and column, so a pipeline can annotate a diff without re-reading
      // the file to work out where index landed
      const { line, column } = lineColPair(text, f.index);
      return {
        index: f.index, line, column,
        code: f.code, name: f.name, category: f.category,
        exempt: f.exempt, note: f.note || undefined,
        replacement: effectiveReplacement(f) || undefined
      };
    })
  };
}

// Human report: any file with something to fix, a hidden payload, or
// (under --list) legitimate kept characters worth explaining.
const printable = opts.quiet ? [] : report.filter(r =>
  r.scan.actionable.length || r.scan.hiddenMessages.length ||
  (opts.list && (r.scan.kept.length || r.scan.optional.length))
);
for (const r of printable) {
  const { file, text, scan, wrote } = r;
  console.log("\n" + bold(file) + (wrote ? paint(32, "  fixed") : ""));

  const shown = opts.list ? scan.actionable : scan.actionable.slice(0, 20);
  for (const f of shown) {
    const rep = effectiveReplacement(f);
    const action = wrote ? "" : rep ? dim(`  ->  "${rep}"`) : dim("  ->  remove");
    console.log(`  ${dim(lineCol(text, f.index).padEnd(8))}${f.code.padEnd(9)}${f.name.padEnd(34)}${catColor(f.category, f.category)}${action}`);
  }
  if (scan.actionable.length > shown.length) {
    console.log(dim(`  ... and ${scan.actionable.length - shown.length} more (use --list to see all)`));
  }
  for (const f of scan.optional.slice(0, opts.list ? Infinity : 3)) {
    console.log(dim(`  ${lineCol(text, f.index).padEnd(8)}${f.code.padEnd(9)}${f.name.padEnd(34)}${f.category}  ${disabledLabel(f.category)}`));
  }
  if (scan.kept.length) {
    console.log(dim(`  kept ${scan.kept.length} legitimate character${scan.kept.length === 1 ? "" : "s"} (emoji joiners, script shaping, flag tags)`));
  }
  for (const msg of scan.hiddenMessages) {
    console.log(`  ${paint(31, bold("hidden message decoded:"))} ${JSON.stringify(msg)}`);
  }
}

const skippedParts = [];
if (skipped.binary) skippedParts.push(`${skipped.binary} binary skipped`);
if (skipped.large) skippedParts.push(`${skipped.large} large skipped`);
if (skipped.unreadable) skippedParts.push(`${skipped.unreadable} unreadable skipped`);

// Only suggest --typography when it would actually change this run: if the
// user turned typography off with --only or --skip, the flag will not help.
const typographyReachable = disabledLabel("typography") === "off by default";
const optionalHint = totalOpt
  ? `${totalOpt} optional${typographyReachable && report.some(r => r.scan.optional.some(f => f.category === "typography")) ? ", see --typography" : ""}`
  : "";

const summary = `${report.length} file${report.length === 1 ? "" : "s"} scanned` +
  (skippedParts.length ? ` (${skippedParts.join(", ")})` : "") + ": " +
  (dirty.length
    ? `${dirty.length} with findings, ${totalFix} character${totalFix === 1 ? "" : "s"} ${opts.write ? "fixed" : "to fix"}` +
      (optionalHint ? `, ${optionalHint}` : "") + (totalKept ? `, ${totalKept} kept` : "")
    : paint(32, "all clean") +
      (totalKept || optionalHint
        ? ` (${[totalKept ? `${totalKept} legitimate kept` : "", optionalHint].filter(Boolean).join(", ")})`
        : ""));
console.log("\n" + summary);
if (totalHidden) console.log(paint(31, `${totalHidden} hidden payload${totalHidden === 1 ? "" : "s"} decoded, review above`));

process.exit(opts.write || !dirty.length ? 0 : 1);
