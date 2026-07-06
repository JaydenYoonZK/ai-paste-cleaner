# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-07-07

First stable release.

### Added

- Browser inspector that reveals invisible Unicode as labeled inline tags, with hover explanations for every finding.
- Context-aware cleaning: emoji ZWJ sequences, ZWNJ in joining scripts, CJK variation sequences, subdivision flag tags, and numeric en dash ranges are detected but preserved.
- Hidden payload decoding for Unicode tag characters, with the recovered ASCII shown in a warning.
- Mixed-script lookalike detection and correction for Cyrillic and Greek twins inside Latin words.
- Optional typography normalization (smart quotes, ellipsis, em and en dashes) with a configurable em dash replacement style.
- Dependency-free ES module engine (`docs/cleaner.js`) usable in any project, plus a machine-readable ruleset at `docs/data/rules.json`.
- 21 Node test cases covering the risky preservation paths.
- `?demo` URL parameter that loads a sample text with one of everything planted.

[1.0.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.0.0
