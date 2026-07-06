// Regenerates docs/data/rules.json from the engine.
// Run after changing rules in docs/cleaner.js:  npm run export-rules
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ruleset } from "../docs/cleaner.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, "docs", "data", "rules.json");
writeFileSync(out, JSON.stringify(ruleset(), null, 2) + "\n");
console.log("wrote", out);
