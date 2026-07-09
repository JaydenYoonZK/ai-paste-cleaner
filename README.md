# AI Paste Cleaner

Reveal and safely remove the characters you cannot see: invisible Unicode, hidden watermarks, direction overrides, lookalike letters, and the typographic tells that AI writing tools leave in copied text.

<p>
  <a href="https://jaydenyoonzk.github.io/ai-paste-cleaner/"><img src="https://img.shields.io/badge/Live%20tool-open-abcf37?style=for-the-badge&logo=githubpages&logoColor=black" alt="Open the live tool"></a>
  <a href="https://github.com/JaydenYoonZK/ai-paste-cleaner/stargazers"><img src="https://img.shields.io/github/stars/JaydenYoonZK/ai-paste-cleaner?style=for-the-badge&logo=github" alt="GitHub stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/JaydenYoonZK/ai-paste-cleaner?style=for-the-badge" alt="MIT License"></a>
</p>

<a href="https://jaydenyoonzk.github.io/ai-paste-cleaner/?demo">
  <img src="docs/assets/preview.png" alt="AI Paste Cleaner shown in light and dark themes, the hero with its illustration revealing hidden characters and keeping legitimate ones" width="100%">
</a>

**[Open the live tool](https://jaydenyoonzk.github.io/ai-paste-cleaner/)** or **[jump straight to a loaded demo](https://jaydenyoonzk.github.io/ai-paste-cleaner/?demo)**. Everything runs in your browser. Your text never leaves your device.

## The problem

Text copied from AI chats, web pages, and word processors carries characters that render as nothing or look identical to what you expect. They cause real damage:

- A zero-width space inside a product name breaks search and matching forever.
- A narrow no-break space (`U+202F`, a known fingerprint of AI chat output) makes `9:30 AM` fail to equal `9:30 AM`.
- Bidirectional overrides can display `exe.txt` as `txt.exe` (the Trojan Source technique, CVE-2021-42574).
- Unicode tag characters carry invisible ASCII payloads used for watermarking and hidden instructions. This tool decodes them and shows you the message, and it is not fooled by a payload hiding behind a flag emoji prefix.
- The Unicode-only line breaks (`U+2028`, `U+2029`) render as nothing in most editors but make `JSON.parse` and older JavaScript engines reject otherwise valid text.
- A Cyrillic `о` inside a Latin word defeats every filter and review that relies on reading.

## What makes this cleaner different

Most strippers delete everything invisible and destroy real content in the process. This one checks context first:

| Kept | Why |
|---|---|
| ZWJ inside 👨‍👩‍👧 | Removing it splits the family into three people |
| ZWNJ in Persian and Hindi words | Required spelling, not noise |
| Variation selector after ❤ | Chooses emoji vs text presentation |
| Tag characters in 🏴󠁧󠁢󠁳󠁣󠁴󠁿 | Subdivision flags are built from them |
| En dash in `2019–2024` | Correct typography for ranges |
| Ideographic space in Japanese text | Standard CJK typography |
| Narrow spaces in `Bonjour !` and `« mot »` | Standard French punctuation spacing |

The inspector shows every kept character with a dashed outline and a reason, so you can verify each decision.

## Use it

No install. Open [the tool](https://jaydenyoonzk.github.io/ai-paste-cleaner/), paste, review, copy. It works offline once loaded.

To run locally:

```bash
git clone https://github.com/JaydenYoonZK/ai-paste-cleaner.git
cd ai-paste-cleaner
npm run serve   # http://localhost:8321
```

## Use the engine in your own project

The detection and cleaning engine is a single dependency-free ES module, [`docs/cleaner.js`](docs/cleaner.js):

```js
import { analyze, clean } from "./cleaner.js";

const report = analyze(suspiciousText);
// report.findings, report.hiddenMessages, report.counts

const { text } = clean(suspiciousText, { typography: true, emDash: "comma" });
```

The full ruleset is also published as [machine-readable JSON](docs/data/rules.json).

## Tests

```bash
npm test
```

30 tests cover the risky cases: emoji preservation including skin-toned sequences, Persian ZWNJ, subdivision flags versus disguised payloads, payload decoding, Japanese and French spacing, Unicode-only line breaks, idempotency, and a linear-time guarantee against pastes flooded with modifier characters.

## Contributing

Found a character this tool misses, or one it should leave alone? That is exactly the feedback this project needs. See [CONTRIBUTING.md](CONTRIBUTING.md), or open a [false positive/negative report](https://github.com/JaydenYoonZK/ai-paste-cleaner/issues/new/choose).

## License

MIT. Built and maintained by [Jayden Yoon ZK](https://github.com/JaydenYoonZK).
