import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("../bin/cli.mjs", import.meta.url));

function run(args, input) {
  return spawnSync(process.execPath, [CLI, ...args], {
    input,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" }
  });
}

const TEMP_DIRS = [];
after(() => { for (const d of TEMP_DIRS) rmSync(d, { recursive: true, force: true }); });

function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), "apc-cli-"));
  TEMP_DIRS.push(dir);
  return { dir, done: () => rmSync(dir, { recursive: true, force: true }) };
}

const FAMILY = "\u{1F468}‍\u{1F469}‍\u{1F467}";
const SCOTLAND = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}";
const payload = (msg) => [...msg].map(c => String.fromCodePoint(0xE0000 + c.codePointAt(0))).join("");

test("cli reports findings and exits 1", () => {
  const { dir, done } = tempDir();
  writeFileSync(join(dir, "a.md"), "pro​duct at 9:30 AM");
  const r = run([join(dir, "a.md")]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /ZERO WIDTH SPACE/);
  assert.match(r.stdout, /NARROW NO-BREAK SPACE/);
  assert.match(r.stdout, /2 characters to fix/);
  done();
});

test("cli exits 0 on a clean file", () => {
  const { dir, done } = tempDir();
  writeFileSync(join(dir, "a.txt"), "perfectly ordinary text\n");
  const r = run([join(dir, "a.txt")]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /all clean/);
  done();
});

test("--write fixes the file and a re-scan is clean", () => {
  const { dir, done } = tempDir();
  const f = join(dir, "a.md");
  writeFileSync(f, "pro​duct");
  const w = run(["--write", f]);
  assert.equal(w.status, 0);
  assert.equal(readFileSync(f, "utf8"), "product");
  const again = run([f]);
  assert.equal(again.status, 0);
  done();
});

test("--write never touches legitimate characters", () => {
  const { dir, done } = tempDir();
  const f = join(dir, "keep.md");
  const original = `Family ${FAMILY} flag ${SCOTLAND}\nPersian می‌خواهم\nRange 2019–2024\nHeart ❤️\n`;
  writeFileSync(f, original);
  const r = run(["--write", f]);
  assert.equal(r.status, 0);
  assert.equal(readFileSync(f, "utf8"), original);
  done();
});

test("decodes hidden tag payloads", () => {
  const { dir, done } = tempDir();
  const f = join(dir, "wm.md");
  writeFileSync(f, `marked${payload("SECRET-7")} text`);
  const r = run([f]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /hidden message decoded: "SECRET-7"/);
  done();
});

test("--json emits a machine-readable report", () => {
  const { dir, done } = tempDir();
  const f = join(dir, "a.md");
  writeFileSync(f, `a​b${payload("X")}`);
  const r = run(["--json", f]);
  assert.equal(r.status, 1);
  const out = JSON.parse(r.stdout);
  assert.equal(out.tool, "ai-paste-cleaner");
  assert.equal(out.clean, false);
  assert.equal(out.files.length, 1);
  assert.deepEqual(out.files[0].hiddenMessages, ["X"]);
  assert.ok(out.totals.fixable >= 2);
  const zwsp = out.files[0].findings.find(x => x.code === "U+200B");
  assert.equal(zwsp.category, "invisible");
  assert.equal(zwsp.exempt, false);
  done();
});

test("stdin mode cleans to stdout and reports on stderr", () => {
  const r = run(["-"], "pro​duct at 9:30 AM");
  assert.equal(r.status, 0);
  assert.equal(r.stdout, "product at 9:30 AM");
  assert.match(r.stderr, /fixed 2 characters/);
});

test("stdin mode leaves typography alone by default", () => {
  const r = run(["-"], "It works — mostly — fine");
  assert.equal(r.stdout, "It works — mostly — fine");
});

test("--typography straightens quotes and replaces em dashes", () => {
  const r = run(["--typography", "-"], "It works — mostly — with “quotes”.");
  assert.equal(r.stdout, 'It works, mostly, with "quotes".');
});

test("--em-dash hyphen uses a spaced hyphen", () => {
  const r = run(["--typography", "--em-dash", "hyphen", "-"], "a — b");
  assert.equal(r.stdout, "a - b");
});

test("--only limits the categories that count", () => {
  const { dir, done } = tempDir();
  const f = join(dir, "a.md");
  writeFileSync(f, "a​b");
  const r = run(["--only", "spaces", f]);
  assert.equal(r.status, 0);
  done();
});

test("binary files are skipped, not scanned", () => {
  const { dir, done } = tempDir();
  writeFileSync(join(dir, "blob.bin"), Buffer.from([0, 1, 2, 0x61]));
  writeFileSync(join(dir, "a.txt"), "clean\n");
  const r = run([dir]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /1 binary skipped/);
  done();
});

test("directories recurse and node_modules is skipped", () => {
  const { dir, done } = tempDir();
  const nm = join(dir, "node_modules");
  const sub = join(dir, "src");
  for (const d of [nm, sub]) {
    mkdirSync(d, { recursive: true });
  }
  writeFileSync(join(nm, "dep.js"), "zwsp​here");
  writeFileSync(join(sub, "app.js"), "zwsp​here");
  const r = run([dir]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /app\.js/);
  assert.doesNotMatch(r.stdout, /node_modules/);
  done();
});

test("usage errors exit 2", () => {
  assert.equal(run(["--em-dash", "bogus", "x"]).status, 2);
  assert.equal(run(["missing-file-xyz.txt"]).status, 2);
  assert.equal(run([]).status, 2);
});

test("--help and --version exit 0", () => {
  const h = run(["--help"]);
  assert.equal(h.status, 0);
  assert.match(h.stdout, /Usage/);
  const v = run(["--version"]);
  assert.equal(v.status, 0);
  assert.match(v.stdout.trim(), /^\d+\.\d+\.\d+$/);
});

test("--skip excludes a category and labels it truthfully", () => {
  const { dir, done } = tempDir();
  const f = join(dir, "a.md");
  writeFileSync(f, "a\u200Bb");
  const r = run(["--skip", "invisible", f]);
  assert.equal(r.status, 0);
  const listed = run(["--skip", "invisible", "--list", f]);
  assert.match(listed.stdout, /skipped by --skip/);
  const only = run(["--only", "spaces", "--list", f]);
  assert.match(only.stdout, /excluded by --only/);
  done();
});

test("--quiet prints only the summary line", () => {
  const { dir, done } = tempDir();
  const f = join(dir, "a.md");
  writeFileSync(f, "a\u200Bb");
  const r = run(["--quiet", f]);
  assert.equal(r.status, 1);
  assert.doesNotMatch(r.stdout, /ZERO WIDTH SPACE/);
  assert.match(r.stdout, /1 file scanned/);
  done();
});

test("--list shows findings past the 20-per-file cap", () => {
  const { dir, done } = tempDir();
  const f = join(dir, "many.md");
  writeFileSync(f, Array.from({ length: 25 }, (_, i) => `w${i}\u200B`).join(" "));
  const capped = run([f]);
  assert.match(capped.stdout, /and 5 more \(use --list to see all\)/);
  const full = run(["--list", f]);
  assert.doesNotMatch(full.stdout, /use --list/);
  assert.equal((full.stdout.match(/ZERO WIDTH SPACE/g) || []).length, 25);
  done();
});

test("mixing - with file paths, unknown options, and bad categories exit 2", () => {
  const { dir, done } = tempDir();
  const f = join(dir, "a.md");
  writeFileSync(f, "x");
  assert.equal(run(["-", f]).status, 2);
  assert.equal(run(["--bogus", f]).status, 2);
  assert.equal(run(["--only", "nope", f]).status, 2);
  done();
});

test("--em-dash keep reports and writes nothing for em dashes", () => {
  const { dir, done } = tempDir();
  const f = join(dir, "d.md");
  const original = "a \u2014 b";
  writeFileSync(f, original);
  const report = run(["--typography", "--em-dash", "keep", f]);
  assert.equal(report.status, 0);
  assert.match(report.stdout, /all clean/);
  const write = run(["--write", "--typography", "--em-dash", "keep", f]);
  assert.equal(write.status, 0);
  assert.equal(readFileSync(f, "utf8"), original);
  done();
});

test("--em-dash without --typography warns", () => {
  const { dir, done } = tempDir();
  const f = join(dir, "a.md");
  writeFileSync(f, "plain");
  const r = run(["--em-dash", "hyphen", f]);
  assert.match(r.stderr, /--em-dash has no effect without --typography/);
  done();
});

test("stdin --json uses the same envelope as file mode and exits 1 on findings", () => {
  const r = run(["--json", "-"], "a\u200Bb");
  assert.equal(r.status, 1);
  const out = JSON.parse(r.stdout);
  assert.equal(out.tool, "ai-paste-cleaner");
  assert.equal(out.scanned, 1);
  assert.equal(out.clean, false);
  assert.equal(out.files[0].path, "stdin");
  assert.equal(out.files[0].fixed, false);
  assert.equal(out.totals.fixable, 1);
  const clean = run(["--json", "-"], "plain text");
  assert.equal(clean.status, 0);
  assert.equal(JSON.parse(clean.stdout).clean, true);
});

test("an unreadable entry inside a directory is skipped, not fatal", { skip: process.platform === "win32" }, () => {
  const { dir, done } = tempDir();
  const sub = join(dir, "sub");
  mkdirSync(sub, { recursive: true });
  writeFileSync(join(dir, "a.txt"), "zw\u200Bsp");
  symlinkSync("/nowhere-at-all-xyz", join(sub, "broken-link"));
  const r = run([dir]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /a\.txt/);
  assert.match(r.stderr, /skipped .*broken-link \(unreadable\)/);
  assert.match(r.stdout, /1 unreadable skipped/);
  done();
});

test("--write on an unwritable file fails with a clean message and exit 2", { skip: process.platform === "win32" }, () => {
  const { dir, done } = tempDir();
  const f = join(dir, "ro.md");
  writeFileSync(f, "a\u200Bb");
  chmodSync(f, 0o444);
  const r = run(["--write", f]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /Cannot write/);
  assert.doesNotMatch(r.stderr, /at .*cli\.mjs/);
  chmodSync(f, 0o644);
  done();
});

test("a file over 10 MB is skipped with an explanation", () => {
  const { dir, done } = tempDir();
  const f = join(dir, "big.txt");
  writeFileSync(f, Buffer.alloc(10 * 1024 * 1024 + 1, 0x61));
  const r = run([f]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /larger than 10 MB, skipped/);
  done();
});

test("a clean summary mentions optional findings", () => {
  const { dir, done } = tempDir();
  const f = join(dir, "typo.md");
  writeFileSync(f, "word \u2014 word");
  const r = run([f]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /all clean \(1 optional, see --typography\)/);
  done();
});
