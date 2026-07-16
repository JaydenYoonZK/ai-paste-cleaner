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
