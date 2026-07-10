# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Added

- Mongolian free variation selector four (`U+180F`) is now included in the published ruleset.
- Static site checks now verify local assets, internal anchors, structured metadata, and explicit accessible names for interactive controls.
- A security policy, private-reporting route, issue guidance, and monthly GitHub Actions update checks now cover repository maintenance.
- CI now tests Node.js 22, 24, and 26 on Linux, macOS, and Windows with pinned action revisions and syntax checks.

### Changed

- Inspector findings can be focused from the keyboard, buttons meet a 44-pixel minimum touch height, and reduced-motion preferences now cover scripted scrolling and the inline illustration.

### Fixed

- Cleaning no longer collapses intentional pairs of ordinary spaces in otherwise clean text.
- Emoji, CJK, and Mongolian variation selectors are preserved only when they directly follow a compatible base, so duplicate or misplaced selectors are removed.
- Malformed tag runs after a black flag can no longer pass as subdivision flag data.
- The browser UI reuses one analysis result and omits the unmarked remainder of oversized inspector previews, reducing duplicate work and preventing hidden direction controls beyond the preview cap from affecting the display.
- Copy feedback now reports failure honestly and leaves the cleaned text selected for manual copying.

## [1.3.2] - 2026-07-10

### Added

- Continuous integration now runs the cleaner test suite and checks that the generated rules JSON is current.

### Fixed

- A zero-width joiner is no longer preserved just because it touches one emoji. It now has to sit between two emoji neighbors to count as a real emoji sequence, so cases like `😀(zwj)x`, `x(zwj)😀`, and doubled joiners between emoji are cleaned instead of treated as legitimate emoji internals.

## [1.3.1] - 2026-07-09

### Fixed

- The inspector no longer bogs the tab down on an enormous paste. It draws one marker per finding, so a paste of a million invisible characters used to create a million DOM nodes and leave the page janky for seconds (a forced layout measured over three seconds). The visual markup is now capped at 20,000 marks, which no real document reaches, and a note says so when it triggers. The character counts and the cleaned output are still computed from every finding, so nothing is silently dropped: on that million-character paste the layout cost fell from about 3 seconds to 128 milliseconds.

## [1.3.0] - 2026-07-09

### Added

- Seven new detections: the Unicode-only line breaks (`U+2028`, `U+2029`) and `NEL` (`U+0085`), normalized to real newlines instead of removed; the combining grapheme joiner (`U+034F`); the object replacement character (`U+FFFC`) that rich editors leave behind; the braille pattern blank (`U+2800`) used to fake empty text; and the Mongolian free variation selectors (`U+180B..U+180D`). The machine-readable ruleset includes them all.
- Two new keep rules, honoring the promise to never damage legitimate text: the ideographic space next to CJK characters (standard Japanese typography), and no-break spaces adjacent to French punctuation marks. The AI-fingerprint narrow space in contexts like `9:30(nnbsp)AM` is still cleaned.
- A Content Security Policy with `connect-src 'none'`, enforcing "your text never leaves your device" at the browser level rather than only in the code.

### Fixed

- A hidden payload can no longer hide behind a flag emoji. Only a genuine subdivision flag (black flag, short lowercase region code, cancel tag) is preserved; any other tag run after a black flag is decoded and cleaned like the watermark it is.
- A zero-width joiner between digits is no longer mistaken for an emoji join, and is removed.
- Analysis stays linear on hostile input. A paste flooded with tens of thousands of modifier characters used to cost quadratic time and could hang the tab; context scanning is now capped, and a regression test pins the bound.

### Changed

- Accessibility: the paste box has a real label and the cleaned-text box an accessible name.
- 30 tests, up from 21.

## [1.2.5] - 2026-07-09

### Changed

- Light mode's status colors are livelier and now measurably meet WCAG AA. The olive green, brown amber, and muted red came from darkening alone, which made them muddy; they are replaced with fully saturated deep equivalents (accent #4c7a00, green #1d7a25, orange #ba4700, red #c62a22), the soft chip tints were eased to match, primary buttons in light mode use white text on the deep accent, and light muted text was deepened one step. Measured on the rendered page, every status pill, link, button label, and muted text now sits at 4.5:1 or better; the previous accent and the muted text on tinted chips quietly failed. Dark mode is untouched.

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

[1.3.2]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.3.2
[1.3.1]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.3.1
[1.3.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.3.0
[1.2.5]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.2.5
[1.2.4]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.2.4
[1.2.3]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.2.3
[1.2.2]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.2.2
[1.2.1]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.2.1
[1.2.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.2.0
[1.1.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.1.0
[1.0.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.0.0
