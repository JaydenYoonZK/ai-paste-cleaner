import { test } from "node:test";
import assert from "node:assert/strict";
import { BRAND_ART, printBanner } from "../bin/banner.mjs";

test("the brand art is three rows that fit an 80 column terminal", () => {
  assert.equal(BRAND_ART.length, 3);
  for (const row of BRAND_ART) assert.ok([...row].length <= 80);
});

test("the banner stays silent for pipes and prints when forced", () => {
  let out = "";
  const fake = { isTTY: false, write: (s) => { out += s; } };
  assert.equal(printBanner("tool v1", { stream: fake }), false);
  assert.equal(out, "");
  assert.equal(printBanner("tool v1", { stream: fake, force: true }), true);
  assert.ok(out.includes("╦") && out.includes("tool v1"));
});

test("the art carries no em or en dashes", () => {
  const joined = BRAND_ART.join("");
  assert.ok(!joined.includes("—") && !joined.includes("–"));
});

test("banner color control: NO_COLOR env and the color option strip ANSI", () => {
  const capture = () => { let buf = ""; return { isTTY: true, write: (x) => { buf += x; }, text: () => buf }; };

  let st = capture();
  printBanner("tool v1", { stream: st, force: true, color: false });
  assert.ok(!st.text().includes("\u001b"), "color:false must emit no escape codes");

  st = capture();
  printBanner("tool v1", { stream: st, force: true, color: true });
  assert.ok(st.text().includes("\u001b[38;5;149m"), "color:true must paint chartreuse");

  const saved = process.env.NO_COLOR;
  try {
    process.env.NO_COLOR = "1";
    st = capture();
    printBanner("tool v1", { stream: st, force: true });
    assert.ok(!st.text().includes("\u001b"), "NO_COLOR must strip escapes by default");
  } finally {
    if (saved === undefined) delete process.env.NO_COLOR; else process.env.NO_COLOR = saved;
  }
});
