# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.2.4] - 2026-07-09

### Added

- The hero illustration now has a light-mode version. It is the same inline drawing recolored through the theme tokens, so it follows the theme toggle instantly and always stays in step with the palette. Dark mode is unchanged.

## [1.2.3] - 2026-07-09

### Fixed

- Clicking a menu item now always highlights the item you clicked. The highlight was driven by an observer watching a band in the middle of the viewport, but a menu jump lands the section heading at the top, outside that band, so the green pill often stayed on a section the page had merely scrolled past. The active item is now computed directly from the scroll position: the last section whose heading sits above the reading line under the header, with the last section winning at the very bottom of the page.

## [1.2.2] - 2026-07-09

### Changed

- The menu now sits in its own tinted band under the brand bar on every screen size, giving the header a clear hierarchy: brand and theme toggle on top, menu below, every item always visible. The whole header is sticky again on all devices, and section jumps measure the header instead of assuming its height, so they land exactly below it however many rows the menu wraps to.

## [1.2.1] - 2026-07-09

### Fixed

- On phones the menu no longer hides items behind an invisible horizontal scroll. Below 720px it wraps onto its own row under the brand with every item visible and centered, and the bar scrolls away with the page instead of pinning several rows to a small screen; the back-to-top button brings it back into reach. Desktop keeps the single sticky row, and section jumps account for the new offsets.

## [1.2.0] - 2026-07-09

### Added

- Ambient 3D background scene with depth of field: eleven glass cubes and shaded spheres from overly large to tiny, near and far sphere pairs on both sides, blur increasing with distance, balanced across both margins, drifting on slow organic paths with wobbling multi-axis tumbles, twinkling star specks in three parallax depth layers with varied size and blur (dark mode only), mouse parallax, and scroll parallax that reveals deeper shapes as the page moves. CSS transforms only, hidden on small screens, adapted per theme, frozen under reduced motion.
- Sticky navigation bar with brand, section links that highlight as you scroll, and smooth anchor scrolling.
- Light and dark mode toggle, persisted across visits, honoring the system preference on first visit, with a ?theme= URL override.
- Animated header illustration in the suite's mini-window style, hidden on small screens to keep mobile content-first.
- Scroll-to-top button that appears after scrolling.
- Emoji accents on section headings.

### Changed (motion)

- Entrance and hover motion throughout (CSS only, respects reduced-motion preferences).
- Removed textarea autofocus so the page no longer loads scrolled past the header.

### Fixed

- The Paste button works on iPhone and iPad again. The previous touch flow skipped the iOS clipboard confirmation and waited for a manual paste that most people never discover, so the button looked dead. The clipboard is now requested the same way on every device: iOS shows its Paste confirmation at the tap point, and confirming it fills the box and cleans the text in one motion. If the read is declined, the box is focused with a hint and the cleaner runs by itself as soon as a paste lands. An empty clipboard now says so.
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

[1.2.4]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.2.4
[1.2.3]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.2.3
[1.2.2]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.2.2
[1.2.1]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.2.1
[1.2.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.2.0
[1.1.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.1.0
[1.0.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.0.0
