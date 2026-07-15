#!/usr/bin/env node
// Scan files for invisible Unicode, hidden watermarks, direction overrides,
// lookalike letters, and AI typography. Report exactly what is there and why,
// fix it only when asked, and never damage legitimate text.
// Usage: npx ai-paste-cleaner <files, folders, or ->

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { analyze, clean, CATEGORIES, DEFAULT_OPTIONS } from "../docs/cleaner.js";

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
  --em-dash <s>    replacement for an em dash: comma, hyphen, keep
  --only <cats>    limit to these categories (comma separated)
  --skip <cats>    exclude these categories
  --list           print every finding instead of the first 20 per file
  --quiet          print the summary only
  --no-color       plain output (NO_COLOR is respected too)
  -V, --version    print the version
  -h, --help       show this help

Categories
  ${Object.keys(CATEGORIES).join(", ")}

Exit codes
  0 clean or fixed, 1 findings in report mode, 2 usage or read error`;

// ----- arguments ------------------------------------------------------------

const args = process.argv.slice(2);
const opts = {
  write: false, json: false, typography: false, emDash: "comma",
  only: null, skip: null, list: false, quiet: false, color: true, stdin: false
};
const paths = [];

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "-h" || a === "--help") { console.log(HELP); process.exit(0); }
  else if (a === "-V" || a === "--version") { console.log(VERSION); process.exit(0); }
  else if (a === "--write") opts.write = true;
  else if (a === "--json") opts.json = true;
  else if (a === "--typography") opts.typography = true;
  else if (a === "--em-dash") {
    const v = args[++i];
    if (!["comma", "hyphen", "keep"].includes(v)) fail(`--em-dash takes comma, hyphen, or keep (got "${v ?? ""}")`);
    opts.emDash = v;
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
if (!opts.stdin && !paths.length) { console.log(HELP); process.exit(2); }

function fail(msg) {
  console.error(`ai-paste-cleaner: ${msg}`);
  process.exit(2);
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

// ----- output helpers -------------------------------------------------------

const ANSI = { red: 31, amber: 33, green: 32, blue: 36 };
const paint = (code, s) => opts.color ? `\x1b[${code}m${s}\x1b[0m` : s;
const bold = (s) => paint(1, s);
const dim = (s) => paint(2, s);
const catColor = (cat, s) => paint(ANSI[CATEGORIES[cat]?.color] ?? 0, s);

function lineCol(text, index) {
  let line = 1, last = -1;
  for (let i = 0; i < index; i++) {
    if (text.charCodeAt(i) === 10) { line++; last = i; }
  }
  return `${line}:${index - last}`;
}

// ----- scanning -------------------------------------------------------------

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "vendor", ".next", ".cache"]);
const MAX_BYTES = 10 * 1024 * 1024;

function collect(p, out, depth = 0) {
  let st;
  try { st = statSync(p); } catch { fail(`Cannot read ${p}`); }
  if (st.isDirectory()) {
    if (depth > 0 && SKIP_DIRS.has(basename(p))) return;
    for (const entry of readdirSync(p)) {
      if (depth === 0 || !entry.startsWith(".")) collect(join(p, entry), out, depth + 1);
    }
  } else if (st.isFile()) {
    if (st.size > MAX_BYTES) return;
    out.push(p);
  }
}

function isBinary(buf) {
  const n = Math.min(buf.length, 8192);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

function scanText(text) {
  const { findings, hiddenMessages, counts } = analyze(text);
  const actionable = findings.filter(f => !f.exempt && ENABLED[f.category]);
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
    const { text } = clean(input, cleanOptions);
    process.stdout.write(JSON.stringify(jsonEntry("stdin", scan, input !== text), null, 2) + "\n");
  } else {
    const { text } = clean(input, cleanOptions);
    process.stdout.write(text);
    if (!opts.quiet) {
      const n = scan.actionable.length;
      process.stderr.write(n
        ? `ai-paste-cleaner: fixed ${n} character${n === 1 ? "" : "s"}${scan.kept.length ? `, kept ${scan.kept.length} legitimate` : ""}\n`
        : "ai-paste-cleaner: already clean\n");
    }
  }
  process.exit(0);
}

// ----- file mode ------------------------------------------------------------

const files = [];
for (const p of paths) collect(p, files);
if (!files.length) fail("No files to scan");

const report = [];
let skippedBinary = 0;

for (const file of files) {
  let buf;
  try { buf = readFileSync(file); } catch { fail(`Cannot read ${file}`); }
  if (isBinary(buf)) { skippedBinary++; continue; }
  const text = buf.toString("utf8");
  const scan = scanText(text);

  let wrote = false;
  if (opts.write && scan.actionable.length) {
    const { text: cleaned } = clean(text, cleanOptions);
    if (cleaned !== text) { writeFileSync(file, cleaned); wrote = true; }
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
    skippedBinary,
    files: report.filter(r => r.scan.findings.length || r.scan.hiddenMessages.length)
      .map(r => jsonEntry(r.file, r.scan, r.wrote)),
    totals: { fixable: totalFix, kept: totalKept, optional: totalOpt, hiddenMessages: totalHidden },
    clean: dirty.length === 0
  };
  console.log(JSON.stringify(out, null, 2));
  process.exit(opts.write || !dirty.length ? 0 : 1);
}

function jsonEntry(path, scan, wrote) {
  return {
    path,
    fixed: !!wrote,
    hiddenMessages: scan.hiddenMessages,
    findings: scan.findings.map(f => ({
      index: f.index, code: f.code, name: f.name, category: f.category,
      exempt: f.exempt, note: f.note || undefined,
      replacement: f.replacement || undefined
    }))
  };
}

// Human report: any file with something to fix, a hidden payload, or
// (under --list) legitimate kept characters worth explaining.
const printable = opts.quiet ? [] : report.filter(r =>
  r.scan.actionable.length || r.scan.hiddenMessages.length || (opts.list && r.scan.kept.length)
);
for (const r of printable) {
  const { file, text, scan, wrote } = r;
  console.log("\n" + bold(file) + (wrote ? paint(32, "  fixed") : ""));

  const shown = opts.list ? scan.actionable : scan.actionable.slice(0, 20);
  for (const f of shown) {
    const action = wrote ? "" : f.replacement ? dim(`  ->  "${f.replacement}"`) : dim("  ->  remove");
    console.log(`  ${dim(lineCol(text, f.index).padEnd(8))}${f.code.padEnd(9)}${f.name.padEnd(34)}${catColor(f.category, f.category)}${action}`);
  }
  if (scan.actionable.length > shown.length) {
    console.log(dim(`  ... and ${scan.actionable.length - shown.length} more (use --list to see all)`));
  }
  for (const f of scan.optional.slice(0, opts.list ? Infinity : 3)) {
    console.log(dim(`  ${lineCol(text, f.index).padEnd(8)}${f.code.padEnd(9)}${f.name.padEnd(34)}${f.category}  off by default`));
  }
  if (scan.kept.length) {
    console.log(dim(`  kept ${scan.kept.length} legitimate character${scan.kept.length === 1 ? "" : "s"} (emoji joiners, script shaping, flag tags)`));
  }
  for (const msg of scan.hiddenMessages) {
    console.log(`  ${paint(31, bold("hidden message decoded:"))} ${JSON.stringify(msg)}`);
  }
}

const summary = `${report.length} file${report.length === 1 ? "" : "s"} scanned` +
  (skippedBinary ? ` (${skippedBinary} binary skipped)` : "") + ": " +
  (dirty.length
    ? `${dirty.length} with findings, ${totalFix} character${totalFix === 1 ? "" : "s"} ${opts.write ? "fixed" : "to fix"}` +
      (totalOpt ? `, ${totalOpt} optional` : "") + (totalKept ? `, ${totalKept} kept` : "")
    : paint(32, "all clean") + (totalKept ? ` (${totalKept} legitimate kept)` : ""));
console.log("\n" + summary);
if (totalHidden) console.log(paint(31, `${totalHidden} hidden payload${totalHidden === 1 ? "" : "s"} decoded, review above`));

process.exit(opts.write || !dirty.length ? 0 : 1);
