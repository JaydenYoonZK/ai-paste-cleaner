# Contributing

Thanks for helping make this cleaner more accurate. The most valuable contributions are reports about real text: characters the tool misses, and characters it should have left alone.

## Report a detection problem

Open a [false positive/negative report](https://github.com/JaydenYoonZK/ai-paste-cleaner/issues/new/choose) with:

- The text (or a minimal sample that reproduces it)
- The codepoint if you know it, in `U+XXXX` form
- What the tool did, and what you expected instead
- The source application and destination editor, if relevant

If the text is sensitive, reproduce the problem with the sample loader first and share that instead.

## Add or change a rule

1. Rules live in [`docs/cleaner.js`](docs/cleaner.js), in `CHAR_RULES` (single codepoints) and `RANGE_RULES` (ranges). Context exemptions are in `analyze()`.
2. Every new rule needs a test in [`test/cleaner.test.mjs`](test/cleaner.test.mjs). If the rule has a legitimate use that must be preserved, add a preservation test too. That second test is the important one.
3. Regenerate the published ruleset: `npm run export-rules`
4. Run the suite: `npm test`

Rules should cite what breaks. "This character exists" is not a reason to strip it; "this character corrupts YAML frontmatter" is.

## Style

- No build step, no dependencies. The engine stays a single ES module that runs in browsers and Node as-is.
- Plain JavaScript, no frameworks.
- Keep the UI understandable without documentation.

## Pull requests

Small, focused PRs are easiest to review and merge. If you are planning something larger, open an issue first so we can agree on the direction before you spend the time.

Please report security-sensitive findings privately through [GitHub Security Advisories](https://github.com/JaydenYoonZK/ai-paste-cleaner/security/advisories/new), not in a public issue.
