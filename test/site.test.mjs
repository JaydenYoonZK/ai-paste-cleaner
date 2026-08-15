import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docs = join(root, "docs");
const html = readFileSync(join(docs, "index.html"), "utf8");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

test("every versioned asset reference carries the package version", () => {
  const v = pkg.version;
  const pages = ["index.html", "404.html", "app.js", "sw.js"];
  for (const name of pages) {
    const text = name === "index.html" ? html : readFileSync(join(docs, name), "utf8");
    for (const ref of text.match(/\?v=(\d+\.\d+\.\d+)/g) || []) {
      assert.equal(ref, `?v=${v}`, `${name} carries ${ref}, expected ?v=${v}`);
    }
  }
  assert.ok(html.includes(`"softwareVersion": "${v}"`), "JSON-LD softwareVersion in lockstep");
  assert.ok(html.includes(`>v${v}</a>`), "the footer version stamp is in lockstep");
});

test("every button and select has an accessible name", () => {
  // An accessible name is an aria-label or visible text content; the FAQ
  // disclosure buttons are named by the question text they contain.
  for (const match of html.matchAll(/<(button|select)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    const hasLabel = /\baria-label="[^"]+"/.test(match[0].slice(0, match[0].indexOf(">") + 1));
    const visibleText = match[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    assert.ok(hasLabel || visibleText.length > 0, `no accessible name: ${match[0].slice(0, 120)}`);
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

test("search and social metadata point to the canonical site", () => {
  const robots = readFileSync(join(docs, "robots.txt"), "utf8");
  const sitemap = readFileSync(join(docs, "sitemap.xml"), "utf8");
  assert.match(robots, /Sitemap: https:\/\/jaydenyoonzk\.github\.io\/ai-paste-cleaner\/sitemap\.xml/);
  assert.match(sitemap, /<loc>https:\/\/jaydenyoonzk\.github\.io\/ai-paste-cleaner\/<\/loc>/);
  assert.match(html, /<meta property="og:image:alt" content="[^"]+">/);
  assert.match(html, /<meta name="twitter:description" content="[^"]+">/);
});
