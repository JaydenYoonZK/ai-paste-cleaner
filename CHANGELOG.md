# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Ambient 3D background scene with depth of field: nine glass cubes and shaded spheres from overly large to tiny, blur increasing with distance, balanced across both margins, drifting on slow organic paths with wobbling multi-axis tumbles, twinkling star specks in three parallax depth layers with varied size and blur (dark mode only), mouse parallax, and scroll parallax that reveals deeper shapes as the page moves. CSS transforms only, hidden on small screens, adapted per theme, frozen under reduced motion.
- Sticky navigation bar with brand, section links that highlight as you scroll, and smooth anchor scrolling.
- Light and dark mode toggle, persisted across visits, honoring the system preference on first visit, with a ?theme= URL override.
- Animated header illustration in the suite's mini-window style, hidden on small screens to keep mobile content-first.
- Scroll-to-top button that appears after scrolling.
- Emoji accents on section headings.

### Changed (motion)

- Entrance and hover motion throughout (CSS only, respects reduced-motion preferences).
- Removed textarea autofocus so the page no longer loads scrolled past the header.

### Fixed

- Scroll-to-top button no longer turns dark on hover (it was caught by the generic secondary-button hover rule).
- Reference tables now scroll inside their own container on narrow screens instead of widening the page.

### Changed

- The page eyebrow now names the tool instead of saying "free browser tool".
- Kept characters (legitimate emoji internals and non-Latin script joiners) now render as green check-marked tags and get their own summary chip, so a fully clean text with preserved emoji no longer looks like a partial result.

## [1.1.0] - 2026-07-07

### Added

- Paste from clipboard button, with a keyboard-shortcut hint on browsers that restrict clipboard access.

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

[1.1.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.1.0
[1.0.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.0.0
