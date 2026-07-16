import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, clean, ruleset, DEFAULT_OPTIONS } from "../docs/cleaner.js";

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
  const { text } = clean("a\u2000b\u2003c\u2009d\u200ae");
  assert.equal(text, "a b c d e");
});

test("preserves emoji variation selector, strips stray one", () => {
  const heart = "❤️";
  const { text } = clean(`${heart} x️y`);
  assert.equal(text, `${heart} xy`);
});

test("preserves one emoji variation selector but removes duplicates", () => {
  assert.equal(clean("❤️️").text, "❤️");
  assert.equal(clean("1️⃣").text, "1️⃣");
});

test("preserves Mongolian variation selectors only after Mongolian letters", () => {
  assert.equal(clean("ᠠ᠋ᠠ᠏").text, "ᠠ᠋ᠠ᠏");
  assert.equal(clean("漢᠋x᠏").text, "漢x");
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
  const plain = "Nothing  to see here.\nJust text.";
  assert.equal(clean(plain).text, plain);
  assert.equal(analyze(plain).findings.length, 0);
});

test("normalizing nonstandard spaces does not collapse neighboring plain spaces", () => {
  assert.equal(clean("a \u00A0 b").text, "a   b");
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

test("black flag cannot launder malformed tag runs", () => {
  const languageTag = String.fromCodePoint(0xE0001);
  const g = String.fromCodePoint(0xE0067);
  const cancel = String.fromCodePoint(0xE007F);
  const malformed = "🏴" + languageTag + g + cancel;
  assert.ok(analyze(malformed).findings.every(f => !f.exempt));
  assert.equal(clean(malformed).text, "🏴");
});

test("clean can reuse a completed analysis", () => {
  const input = "a​b";
  const analysis = analyze(input);
  assert.deepEqual(clean(input, {}, analysis), clean(input));
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

test("French spacing before punctuation is kept, unrelated narrow space cleaned", () => {
  const fr = "Bonjour ! « salut »";
  assert.equal(clean(fr).text, fr);
  assert.equal(clean("9:30 AM").text, "9:30 AM");
});

test("modifier floods stay linear, not quadratic", () => {
  const bomb = "️".repeat(30000);
  const t0 = Date.now();
  analyze(bomb);
  // Generous budget: linear work finishes in milliseconds even on a loaded
  // CI runner, while quadratic behavior on 30k modifiers takes far longer.
  assert.ok(Date.now() - t0 < 5000, "30k modifiers should analyze in milliseconds");
});

test("preserves ZWJ script shaping in Sinhala, Tamil, and Devanagari", () => {
  const sinhala = "\u0DC1\u0DCA\u200D\u0DBB\u0DD3";        // Sri (rakaransaya)
  const tamil = "\u0BB8\u0BCD\u200D\u0BB0\u0BC0";          // Sri ligature
  const devanagari = "\u0915\u094D\u200D\u0937";            // kSa half form
  for (const word of [sinhala, tamil, devanagari]) {
    assert.equal(clean(word).text, word);
    assert.ok(analyze(word).findings.filter(f => f.cp === 0x200D).every(f => f.exempt));
  }
});

test("black flag with a well-formed but non-RGI tag body is decoded, real flags kept", () => {
  const tags = (str) => [...str].map(c => String.fromCodePoint(0xE0000 + c.codePointAt(0))).join("");
  const cancel = String.fromCodePoint(0xE007F);
  const smuggled = "\u{1F3F4}" + tags("attack") + cancel;
  assert.deepEqual(analyze(smuggled).hiddenMessages, ["attack"]);
  assert.equal(clean(smuggled).text, "\u{1F3F4}");
  for (const region of ["gbsct", "gbeng", "gbwls"]) {
    const flag = "\u{1F3F4}" + tags(region) + cancel;
    assert.equal(clean(flag).text, flag);
    assert.equal(analyze(flag).hiddenMessages.length, 0);
  }
});

test("em dash opening a line or sitting between digits is kept", () => {
  const t = { typography: true };
  assert.equal(clean("list:\n\u2014 first\n\u2014 second", t).text, "list:\n\u2014 first\n\u2014 second");
  assert.equal(clean("\u2014 a dialogue line", t).text, "\u2014 a dialogue line");
  assert.equal(clean("pages 12\u201415", t).text, "pages 12\u201415");
});

test("em dash runs collapse and line ends stay clean", () => {
  const t = { typography: true };
  assert.equal(clean("a\u2014\u2014b", t).text, "a, b");
  assert.equal(clean("a \u2014 \u2014 b", t).text, "a, b");
  assert.equal(clean("word\u2014\nword", t).text, "word,\nword");
  assert.equal(clean("word\u2014", t).text, "word,");
});

test("em dash absorbs no-break spaces around it", () => {
  const t = { typography: true };
  assert.equal(clean("word\u00A0\u2014\u00A0word", t).text, "word, word");
  assert.equal(clean("word\u202F\u2014\u202Fword", t).text, "word, word");
});

test("em dash keep mode leaves text untouched and counts nothing", () => {
  const t = { typography: true, emDash: "keep" };
  const input = "a \u2014 b and c\u2014d";
  const { text, removed, replaced } = clean(input, t);
  assert.equal(text, input);
  assert.equal(removed + replaced, 0);
});

test("clean is idempotent when removal fuses two single-script tokens", () => {
  const once = clean("\u043C\u0438\u0440\u200Bworld");   // Russian mir + ZWSP + world
  assert.equal(once.text, "\u043C\u0438\u0440world");
  const twice = clean(once.text);
  assert.equal(twice.text, once.text);
  assert.equal(twice.removed + twice.replaced, 0);
});

test("true spoofs are still rewritten, genuine foreign words are not", () => {
  assert.equal(clean("s\u0430mple").text, "sample");        // Cyrillic a
  assert.equal(clean("g\u03BFod").text, "good");            // Greek omicron
  assert.equal(clean("\u0422oken").text, "Token");          // Cyrillic Te
  const russian = "\u043F\u0440\u0438\u0432\u0435\u0442";
  assert.equal(clean(russian + " hello").text, russian + " hello");
});

test("every single-codepoint rule fires between plain Latin letters", () => {
  const rs = ruleset();
  for (const rule of rs.rules) {
    if (!rule.codepoint) continue;                            // range rules below
    const cp = parseInt(rule.codepoint.slice(2), 16);
    const probe = "a" + String.fromCodePoint(cp) + "b";
    const { text } = clean(probe, { typography: true });
    assert.notEqual(text, probe, rule.codepoint + " " + rule.name + " should be cleaned between Latin letters");
  }
  for (const rule of rs.rules) {
    if (!rule.range) continue;
    for (const end of rule.range.split("..")) {
      const cp = parseInt(end.slice(2), 16);
      const probe = "a" + String.fromCodePoint(cp) + "b";
      const { text } = clean(probe, { typography: true });
      assert.notEqual(text, probe, end + " " + rule.name + " should be cleaned between Latin letters");
    }
  }
});

test("analyze counts report found and exempt per category", () => {
  const { counts } = analyze("a\u200Bb \u{1F468}\u200D\u{1F469}");
  assert.equal(counts.invisible.found, 2);
  assert.equal(counts.invisible.exempt, 1);
  assert.equal(counts.bidi.found, 0);
});

test("clean(clean(x)) === clean(x) across mixed samples", () => {
  const samples = [
    "He said \u2014 twice \u2014 that it\u2019s \u201Cfine\u201D\u2026",
    "list:\n\u2014 item one\n\u2014 item two",
    "\u043C\u0438\u0440\u200Bworld and s\u0430mple",
    "\u0DC1\u0DCA\u200D\u0DBB\u0DD3 with \u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}"
  ];
  for (const s of samples) {
    const once = clean(s, { typography: true }).text;
    assert.equal(clean(once, { typography: true }).text, once);
  }
});
