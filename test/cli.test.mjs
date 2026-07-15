import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
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

function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), "apc-cli-"));
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
