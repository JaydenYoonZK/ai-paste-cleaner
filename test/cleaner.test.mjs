import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, clean, DEFAULT_OPTIONS } from "../docs/cleaner.js";

test("strips zero width space", () => {
  const { text, removed } = clean("jo​in");
  assert.equal(text, "join");
  assert.equal(removed, 1);
});

test("strips word joiner, BOM, and soft hyphen", () => {
  const { text } = clean("﻿a⁠b­c");
  assert.equal(text, "abc");
});

test("preserves emoji ZWJ sequences", () => {
  const family = "\u{1F468}‍\u{1F469}‍\u{1F467}";
  const { text } = clean(`hi ${family} team`);
  assert.equal(text, `hi ${family} team`);
  const { findings } = analyze(family);
  assert.ok(findings.filter(f => f.cp === 0x200D).every(f => f.exempt));
});

test("strips ZWJ outside emoji", () => {
  const { text } = clean("pass‍word");
  assert.equal(text, "password");
});

test("preserves ZWNJ in Persian", () => {
  const persian = "می‌خواهم";
  const { text } = clean(persian);
  assert.equal(text, persian);
});

test("strips ZWNJ between Latin letters", () => {
  const { text } = clean("ad‌min");
  assert.equal(text, "admin");
});

test("normalizes narrow no-break space and NBSP", () => {
  const { text } = clean("9:30 AM and one two");
  assert.equal(text, "9:30 AM and one two");
});

test("normalizes en quad through hair space", () => {
  const { text } = clean("a b c d");
  assert.equal(text, "a b c d");
});

test("preserves emoji variation selector, strips stray one", () => {
  const heart = "❤️";
  const { text } = clean(`${heart} x️y`);
  assert.equal(text, `${heart} xy`);
});

test("decodes hidden tag payload and strips it", () => {
  const hidden = "hello" + [..."secret"].map(c =>
    String.fromCodePoint(0xE0000 + c.codePointAt(0))).join("") + " world";
  const { hiddenMessages } = analyze(hidden);
  assert.deepEqual(hiddenMessages, ["secret"]);
  const { text } = clean(hidden);
  assert.equal(text, "hello world");
});

test("preserves subdivision flag emoji tags", () => {
  const scotland = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}";
  const { text } = clean(scotland);
  assert.equal(text, scotland);
  const { hiddenMessages } = analyze(scotland);
  assert.equal(hiddenMessages.length, 0);
});

test("removes bidi controls", () => {
  const { text } = clean("safe‮txt.exe‬");
  assert.equal(text, "safetxt.exe");
});

test("typography off by default", () => {
  const input = "“hello” — it’s fine…";
  const { text } = clean(input);
  assert.equal(text, input);
});

test("typography normalization straightens quotes and ellipsis", () => {
  const { text } = clean("“hi” it’s…", { typography: true });
  assert.equal(text, `"hi" it's...`);
});

test("em dash becomes comma with space absorption", () => {
  const { text } = clean("fast — reliable", { typography: true, emDash: "comma" });
  assert.equal(text, "fast, reliable");
});

test("em dash hyphen mode", () => {
  const { text } = clean("fast—reliable", { typography: true, emDash: "hyphen" });
  assert.equal(text, "fast - reliable");
});

test("en dash kept between digits, replaced between words", () => {
  const { text } = clean("2019–2024 was up – a lot", { typography: true });
  assert.equal(text, "2019–2024 was up - a lot");
});

test("fixes Cyrillic lookalikes inside Latin words", () => {
  const { text } = clean("dоmain lеtter");
  assert.equal(text, "domain letter");
});

test("leaves pure Cyrillic words alone", () => {
  const russian = "привет";
  const { text } = clean(`hello ${russian}`);
  assert.equal(text, `hello ${russian}`);
});

test("clean is idempotent", () => {
  const messy = "a​b “q” — c d";
  const opts = { ...DEFAULT_OPTIONS, typography: true };
  const once = clean(messy, opts).text;
  const twice = clean(once, opts).text;
  assert.equal(once, twice);
});

test("empty and plain input pass through", () => {
  assert.equal(clean("").text, "");
  const plain = "Nothing to see here.\nJust text.";
  assert.equal(clean(plain).text, plain);
  assert.equal(analyze(plain).findings.length, 0);
});

test("preserves skin-toned ZWJ sequences", () => {
  const couple = "\u{1F469}\u{1F3FD}‍\u{1F91D}‍\u{1F468}\u{1F3FC}";
  assert.equal(clean(couple).text, couple);
});

test("strips ZWJ hidden between digits (not an emoji join)", () => {
  assert.equal(clean("1‍2").text, "12");
});

test("strips ZWJ when only one side is emoji", () => {
  assert.equal(clean("😀‍x").text, "😀x");
  assert.equal(clean("x‍😀").text, "x😀");
});

test("strips doubled ZWJ between emoji", () => {
  assert.equal(clean("😀‍‍😀").text, "😀😀");
});

test("black flag cannot launder a hidden payload", () => {
  const evil = "\u{1F3F4}" + [..."attack"].map(c => String.fromCodePoint(0xE0000 + c.codePointAt(0))).join("");
  const { hiddenMessages } = analyze(evil);
  assert.deepEqual(hiddenMessages, ["attack"]);
  assert.equal(clean(evil).text, "\u{1F3F4}");
});

test("unicode-only line breaks normalize to newlines", () => {
  assert.equal(clean("a b cd").text, "a\nb\nc\nd");
});

test("detects and removes CGJ, object replacement, Mongolian FVS", () => {
  assert.equal(clean("a͏b￼c᠋d").text, "abcd");
});

test("braille pattern blank becomes a plain space", () => {
  assert.equal(clean("a⠀b").text, "a b");
});

test("ideographic space is kept in CJK text, cleaned elsewhere", () => {
  const jp = "こんにちは　世界";
  assert.equal(clean(jp).text, jp);
  assert.equal(clean("code　here").text, "code here");
});

test("French spacing before punctuation is kept, AI narrow space cleaned", () => {
  const fr = "Bonjour ! « salut »";
  assert.equal(clean(fr).text, fr);
  assert.equal(clean("9:30 AM").text, "9:30 AM");
});

test("modifier floods stay linear, not quadratic", () => {
  const bomb = "️".repeat(30000);
  const t0 = Date.now();
  analyze(bomb);
  assert.ok(Date.now() - t0 < 500, "30k modifiers should analyze in milliseconds");
});
