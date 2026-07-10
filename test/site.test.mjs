import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docs = join(root, "docs");
const html = readFileSync(join(docs, "index.html"), "utf8");

test("every button and select has an explicit accessible name", () => {
  for (const match of html.matchAll(/<(button|select)\b[^>]*>/g)) {
    assert.match(match[0], /\baria-label="[^"]+"/, `missing aria-label: ${match[0]}`);
  }
});

test("internal navigation targets exist", () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  const targets = [...html.matchAll(/\bhref="#([^"]+)"/g)].map(match => match[1]);
  for (const target of targets) assert.ok(ids.has(target), `missing #${target}`);
});

test("local page assets exist", () => {
  const references = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  const local = references.filter(value =>
    !/^(?:[a-z]+:|#)/i.test(value) && !value.startsWith("//")
  );
  for (const reference of local) {
    const path = reference.split(/[?#]/, 1)[0];
    assert.ok(existsSync(join(docs, path)), `missing local asset: ${reference}`);
  }
});

test("security and structured metadata remain valid", () => {
  assert.match(html, /connect-src 'none'/);
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(jsonLd, "missing JSON-LD metadata");
  assert.doesNotThrow(() => JSON.parse(jsonLd[1]));
});
