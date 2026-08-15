# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.9.9] - 2026-08-16

### Fixed

- The status bar shield now rides fixed to the viewport instead of sticky. Under a fast scroll Safari could lag the sticky one by a frame, which was just long enough to flash page content above the menu.

## [1.9.8] - 2026-08-16

### Fixed

- On iPhones, scrolling could flash page content in the status bar strip above the menu. The cover for that strip now lives outside the blurred bar, where Safari actually draws it.

## [1.9.7] - 2026-08-15

### Changed

- The copyright sentence stands alone again, with the changelog version link on its own line just beneath it.

## [1.9.6] - 2026-08-15

### Changed

- The footer's copyright line now carries the version, linked to this changelog.

## [1.9.5] - 2026-07-20

### Changed

- The dark theme's pushable buttons now stand on a visible warm-gray base instead of a black one. Black under a dark button read as a drop shadow; the lighter base reads as the key's side, the way it already did in the light theme.

## [1.9.4] - 2026-07-20

### Changed

- The sponsor tooltip wears a bolder frame: a four-pixel gold-to-lavender-to-pink keyline the arrow melts into, replacing the hairline border.

## [1.9.3] - 2026-07-19

### Fixed

- The sponsor tooltip keyline now flows around the arrow, up one edge, over the tip, and down the other, with no line across the base and no gaps at the shoulders.

## [1.9.2] - 2026-07-19

### Fixed

- The sponsor tooltip keyline now runs unbroken across the arrow base: the arrow tucks behind the bubble and its outlined tip grows out of the border instead of interrupting it.

## [1.9.1] - 2026-07-19

### Fixed

- The sponsor tooltip arrow now grows out of the bubble as one shape, its keyline flowing up into the point, instead of sitting on it as a separate triangle.

## [1.9.0] - 2026-07-19

### Added

- The sponsor tooltip turned magical: a charmed bubble with a pink-to-gold keyline that springs open and breathes a soft glow, sparkles twinkling around its rim, and little hearts tumbling out of the button while it is hovered. Keyboard focus gets the bubble and sparkles, touch stays plain, and reduced motion gets a calm fade.

## [1.8.6] - 2026-07-19

### Changed

- The output actions now sit on their own row above the code, right-aligned, instead of floating over it.

## [1.8.5] - 2026-07-19

### Changed

- Disabled buttons now press down onto their base like the other keys, so the locked state looks pressed in instead of floating flat.

## [1.8.4] - 2026-07-19

### Fixed

- Navigation links now stay highlighted when you jump to a section near the bottom of the page, such as the FAQ.

## [1.8.3] - 2026-07-18

### Changed

- The page starts in the dark theme by default before scripts run.

## [1.8.2] - 2026-07-18

### Changed

- The section headings carry their emoji again.

## [1.8.1] - 2026-07-18

### Changed

- Section headings are plain text now, without the leading emoji.
- Tightened the hero lede, two FAQ answers, one category description, and the README test summary.
- CI runs on Node 22 and 26, the supported floor and the current release, instead of also testing 24 in between.

## [1.8.0] - 2026-07-18

### Changed

- An en dash between digits is now cleaned like any other typography. It used to be kept as a "range", so cleaning "3–4x" left the en dash in place while "$1,200–$1,500" became a hyphen: the same character, two different outcomes, and a special dash surviving in text you asked to clean. A hyphen is a clean ASCII stand-in for a range, so "3–4x" now becomes "3-4x" and "2019–2024" becomes "2019-2024". An em dash between digits is still left alone, because its replacement is a comma and "3, 4" would corrupt the range.
- The two samples are everyday text now. "Try a sample" is a casual message with the smart punctuation a chat, a doc, or autocorrect adds. "Hard case" is the spammy "paste this into your AI" message that hidden tag payloads actually ride in, so the constructed example teaches the real threat.

### Fixed

- The summary no longer calls a kept character an "invisible character... part of emoji or non-Latin words". That was wrong for a kept en dash, a French spacing character, or a line-opening em dash. It now reads "left in place: legitimate characters this tool does not touch", and each one still explains itself on hover.

## [1.7.0] - 2026-07-17

### Changed

- The page now describes what the tool actually finds. An AI chat hands you typography: em dashes, curly quotes, single-character ellipses. Web pages, PDFs, and word processors are where genuinely invisible characters come from. Pasting a chat reply and seeing no invisible characters is the normal, correct result, and the page now says so instead of implying the tool missed something.
- "Try a sample" is now two samples. "AI chat sample" loads what a real chat reply looks like, so the first click matches what you will see with your own text. "Hard case" loads the constructed example carrying every category at once, labelled as constructed.
- The hidden payload alert explains the real risk. Text carrying a tag payload is usually text someone prepared for an AI to read, so it tells you to check the source before pasting it into an assistant. The sample payload now reads like a real one instead of a pretend watermark.
- The narrow no-break space section records the one invisible character AI chats are known to produce, including OpenAI's description of it as a quirk of training rather than a watermark.

### Fixed

- Removed the claim that invisible characters "quietly mark text as machine-made". They do not, it contradicted the FAQ four screens below it, and it set up anyone pasting a chat reply to think a clean result meant a broken tool.
- Removed "hidden watermarks" from the package summary and the npm keywords. No shipping model marks text with characters. The two real text watermarks work by token sampling, so no character cleaner can see or remove them.
- The answer to "will cleaning make AI text read as human" now points at the test that settles it: adding or removing hidden characters does not change whether a detector flags text.
- Bidirectional overrides are two separate risks, and the docs no longer cite one CVE for both. Source code that reads differently than it compiles is Trojan Source, CVE-2021-42574. A filename showing `exe.txt` as `txt.exe` is right-to-left override spoofing.
- The terminal section no longer claims every hidden character is reported. The default shows the first 20 per file and `--list` prints the rest. It also now states that the command line leaves typography alone until you pass `--typography`, which the page's own defaults do not.

### Added

- `--json` findings carry `line` and `column`, so a pipeline can annotate a diff without re-reading the file to work out where an index landed.

## [1.6.1] - 2026-07-16

Follow-up fixes to the 1.6.0 changes.

### Fixed

- The 1.6.0 em dash rewrite could delete an exempt no-break space (French spacing around guillemets and punctuation) when it sat next to a converted dash. Absorption now skips exempt spaces, so legitimate text is preserved exactly as promised.
- A run of em dashes ending a line or the text (`a\u2014\u2014`) no longer leaves a trailing space.
- Cleaning now reaches a true fixed point. Removing an invisible character can fuse two tokens into a word that only a rescan recognizes as a lookalike spoof, so cleaning repeats until stable; `clean(clean(x))` always equals `clean(x)`.
- A line-opening em dash is kept no matter which kind of space indents it, including the exotic spaces this tool itself normalizes.

### Changed

- The "see --typography" hint in a clean summary no longer appears when typography was turned off by `--only` or `--skip`, where the flag would have no effect.
- When every file named on the command line is skipped, the tool reports what it skipped rather than a bare "No files to scan".
- Tests grew to 90, adding French-spacing preservation, dash-run line ends, fixed-point idempotency, indent-agnostic line starts, `--no-color`, and oversize-file messaging.

## [1.6.0] - 2026-07-16

Fixes across the engine, the command line, the page, and the docs.

### Fixed

- Cleaning a large text full of em dashes no longer freezes the page. The conversion step re-trimmed the entire output once per dash, which is quadratic: 20,000 dashes took 9 seconds. The cleaner now builds its output in chunks and the same input takes under 20 milliseconds.
- Sinhala, Tamil, Devanagari, and other joining-script words no longer lose their zero-width joiners. ZWJ between letters of a joining script is required orthography (the Sinhala in "Sri Lanka" changes shape without it), so those joiners are now kept and explained, exactly like the ZWNJ rule beside them. ZWJ hidden between Latin letters is still removed.
- A black flag followed by a made-up region code no longer smuggles a hidden tag payload past detection. Only the three real subdivision flags (England, Scotland, Wales) are exempt; every other tag body behind a black flag is decoded and reported.
- Em dash conversion now handles real-world contexts: a dash opening a line (dialogue, lists, attributions) is kept, a dash between digits reads as a range and is kept, runs like "a——b" collapse to a single pause instead of ",,", no-break spaces around a dash are absorbed instead of doubling, and a dash at the end of a line no longer leaves a trailing space.
- Cleaning is idempotent. Removing an invisible character between a Russian word and an English word used to create a "mixed-script" token that a second pass would then rewrite, corrupting the genuine Cyrillic. The lookalike check now only fires when every non-Latin letter in the word passes as Latin, which is what an actual spoof looks like.
- `--em-dash keep` now truly keeps: kept dashes no longer count as fixable, no longer fail CI with exit 1, no longer appear as rows promising a replacement, and `--write` no longer claims to have fixed them.
- `--write` on a file it cannot write reports one clean line and exit code 2 instead of a raw stack trace.
- One unreadable entry (a broken symlink, a permission-denied file) no longer aborts a whole directory scan. It is skipped with a note, counted in the summary, and everything else is still scanned.
- `- --json` (stdin JSON) now emits the same envelope as file mode, reports `fixed: false` honestly, and exits 1 when anything needs fixing, so one schema and one exit contract cover every mode.
- A file over 10 MB named on the command line now names the limit and skips the file with a clear message; the limit is documented in `--help` and skipped files are counted in the summary.
- `--no-color` now also strips the banner's colors, matching its promise of plain output.
- The 404 page works at any depth. Its stylesheet, script, icons, and links were relative, so a missing URL two segments deep rendered an unstyled page whose home button looped to itself. Everything on it is now project-absolute.
- The back-to-top button can no longer be tab-focused while invisible.
- Reduced-motion users no longer get looping SVG scenes: every decorative animation is paused on both pages, not just the hero.
- The theme boot and toggle survive blocked storage (private modes, strict cookie settings) instead of throwing, and the toggle's label can no longer desync from the theme.
- A very long decoded payload wraps inside its alert card instead of forcing the page to scroll sideways on phones.
- The ruleset JSON linked in the footer is precached, so it opens offline like everything else on the page.

### Changed

- The hero's privacy line now says exactly what is true: your text is never sent or stored; the theme choice and the offline copy of the page itself do use browser storage.
- Report labels are truthful about why a category is off: "skipped by --skip", "excluded by --only", or "off by default".
- A clean scan now mentions optional findings it was told not to act on, such as "all clean (3 optional, see --typography)".
- Using `--em-dash` without `--typography` warns that it has no effect instead of silently ignoring the choice.
- The "what this tool finds" table on the page describes the typography category honestly instead of a code range that was wrong in both directions.

### Added

- PNG favicon fallback and an Apple touch icon, so Safari tabs and home-screen pins show the paragraph mark; the 404 page now has icons too.
- A `theme-color` meta that follows the active theme, so mobile browser chrome blends with the page.
- `funding` field in package.json, so `npm fund` points at GitHub Sponsors.
- Regression tests for everything above: the suite grew to cover the engine rule table end to end, every documented CLI flag, both banner color paths, and the new dash, joiner, flag, and idempotency behavior.

## [1.5.3] - 2026-07-16

### Added

- A Jayden Yoon ZK brand banner in the terminal: the name in ASCII art prints when the tool runs in an interactive terminal, and stays out of pipes, JSON, and CI logs so automated runs see only their data.

## [1.5.2] - 2026-07-15

### Added

- A Terminal section on the page: three copyable command cards for scanning files, cleaning the clipboard through a pipe, and gating CI, plus the engine import, all linked from the navigation.

## [1.5.1] - 2026-07-15

### Added

- A sponsor heart in the navigation, beside the theme toggle: quiet at rest, GitHub sponsor pink on hover, with the toggle's own downward tooltip and arrow, linking to the GitHub Sponsors profile. On the 404 page too.

## [1.5.0] - 2026-07-15

The web tool becomes a developer tool: the same engine now runs on files, folders, pipes, and CI.

### Added

- Command line tool: `npx ai-paste-cleaner <files, folders, or ->` scans for every category the browser tool knows, reports each finding with line and column, character code, name, and the planned fix, and decodes hidden tag payloads.
- `--write` fixes files in place with the browser tool's exact preservation rules; recognized emoji internals, script shaping, flag tags, and the other exempt contexts are never touched.
- Stdin pipe mode: `pbpaste | ai-paste-cleaner - | pbcopy` cleans the clipboard in one line, with the summary on stderr so pipes stay clean.
- CI gating: the scan exits 1 when it finds something to fix, 0 when clean, 2 on usage errors, and `--json` emits a machine-readable report.
- Options: `--typography`, `--em-dash comma|hyphen|keep`, `--only`, `--skip`, `--list`, `--quiet`, and `--no-color` with NO_COLOR respected.
- Directory scanning skips node_modules, .git, build output, hidden folders, and binary files automatically.
- npm package: the CLI installs as `ai-paste-cleaner`, and the engine imports as `import { analyze, clean } from "ai-paste-cleaner"`.
- Fifteen end-to-end CLI tests covering exit codes, write round-trips, preservation guarantees, stdin piping, JSON shape, and directory walking.
- The CI workflow now syntax-checks the CLI and scans this repository's own documentation with it as a release gate.
- A FAQ entry on the site covering file scanning and CI use.

## [1.4.60] - 2026-07-12

### Fixed

- The strip above the navigation bar is solid now. iOS skips the frosted blur in the overscroll zone, so the translucent skin let content ghost through it; the bleed wears the opaque page background, which reads identically to the bar over an empty page in both themes.

## [1.4.59] - 2026-07-12

### Fixed

- The navigation bar now bleeds its own skin above the viewport, so iOS elastic scrolling, the collapsing Safari chrome, and desktop rubber-banding show navigation instead of a bare transparent strip. Works in both themes.

## [1.4.58] - 2026-07-12

### Added

- A purpose-built 1280x640 social preview card, and the page's link-sharing metadata now points at it with honest dimensions.

## [1.4.57] - 2026-07-12

### Changed

- The navigation bar's soft shadow shows at all times now instead of appearing on scroll.

## [1.4.56] - 2026-07-12

### Added

- The navigation bar lifts with a soft, tight shadow once the page scrolls beneath it, and sits flush again at the top. Each theme carries its own tint.

## [1.4.55] - 2026-07-12

### Added

- An "All projects" pill at the end of the navigation and a footer link, both pointing at the new projects directory, one page that lists every tool.

### Fixed

- The structured metadata's softwareVersion had drifted from the package version and is back in sync.

## [1.4.54] - 2026-07-12

### Changed

- The FAQ heading reads "Frequently asked questions" now, and the story section is linked from the navigation.

## [1.4.53] - 2026-07-12

### Fixed

- The story's sprout now takes its height from the text beside it, reaching from just above the paragraph to exactly its last line. The empty band that used to open under short text is gone.

## [1.4.52] - 2026-07-12

### Changed

- The story's sprout sits higher now, anchored toward the section heading instead of hanging at the paragraph's midline.
- When the scenes hide on narrow screens, the explainer text expands to the full section width like its neighbors.

## [1.4.51] - 2026-07-12

### Fixed

- The two explainer scenes now sit properly centered against their text. Each SVG's frame hugs its drawing, so the potted sprout no longer sags below the paragraph it accompanies.

## [1.4.50] - 2026-07-12

### Fixed

- Hovering or pressing an FAQ row no longer paints the square key-cap background over the card's rounded corners. The accordion rows now fully opt out of the tactile key states.

## [1.4.49] - 2026-07-12

### Added

- The FAQ is a set of full-width accordions now. Each question carries a plus that turns into a close mark as the answer unfolds, with the whole row clickable and the state exposed to keyboards and screen readers.

## [1.4.48] - 2026-07-12

### Changed

- The "What gets left alone" list flows in two balanced columns and its paragraphs run the full section width, so the section closes cleanly at both edges.
- The "Why I built this" story pairs its text with a small sprout scene instead of trailing off into empty space.

## [1.4.47] - 2026-07-12

### Changed

- The two deep-dive notes under the findings table now share a row on wide screens, closing the section to the table's full width. They keep two columns down to tablet width and stack on phones, where side-by-side text would leave only a few words per line.

## [1.4.46] - 2026-07-12

### Changed

- The result chips grow to close each row, so the summary strip meets both edges instead of ending ragged.
- The space between the tool and the first explainer section is tighter.
- The opening explainer pairs its text with a small animated scene of a hidden character being caught, so the right side of the section no longer sits empty.

## [1.4.45] - 2026-07-12

### Fixed

- The privacy pill's lock now stays vertically centered when the text wraps to a second line.

## [1.4.44] - 2026-07-12

### Changed

- The footer is now centered, and the copyright line links a bold Jayden Yoon ZK to https://www.JaydenYoonZK.com.

## [1.4.43] - 2026-07-12

### Added

- Every page, including the 404, now closes with a quiet copyright line in the footer: Copyright © Jayden Yoon ZK with the current year, All Rights Reserved. The year keeps itself current.

## [1.4.42] - 2026-07-12

### Added

- Source attribution in the shipped files. Every stylesheet and script now opens with a license banner naming Jayden Yoon ZK, each page carries an author meta tag and an HTML notice, and the browser console prints a small signature with a link back to the source.

## [1.4.41] - 2026-07-12

### Fixed

- The 404 page's key and tool cards no longer pick up the prose link underline on hover, focus, or press.

## [1.4.40] - 2026-07-12

### Fixed

- The 404 page now carries the same Built by Jayden Yoon ZK footer as every other page.
- Short pages no longer show a hard-edged second copy of the page glow near the bottom. The body background propagates to the canvas, which tiles the glow image below a short page; the glow is now painted exactly once.

## [1.4.39] - 2026-07-12

### Added

- The tool now works offline. A small service worker caches the page shell on the first visit, answers repeat visits from cache while refreshing in the background, and drops old caches on every release. Since the tool runs entirely in the browser, everything keeps working with no connection at all, and the privacy note now says so.

## [1.4.38] - 2026-07-11

### Changed

- The 404 page is now a full member of the site. It carries the brand navigation bar with the working theme toggle and crossfade, the ambient three dimensional background scene with its parallax, the cursor dust, and a new animated illustration of a browser window missing its page, complete with a searching magnifying glass. Navigation links from the 404 lead back into the tool's sections.

## [1.4.37] - 2026-07-11

### Added

- A branded 404 page. Broken or mistyped links now land on a page in the full design, with a note written in the tool's own voice, a chartreuse key back to the tool, and a grid linking the six sibling tools. GitHub Pages serves it automatically for any missing path, and search engines are told not to index it.

## [1.4.36] - 2026-07-11

### Added

- The site now publishes its own search and AI crawler metadata: a robots.txt with a deliberate allow policy, a sitemap.xml, and an llms.txt that maps the tool, documentation, and source for AI systems. The llms.txt follows the structure the format proposes, with the required name heading, a summary blockquote, and annotated link sections.

## [1.4.35] - 2026-07-11

### Added

- A skip to main content link for keyboard and screen reader users. It waits off screen as the page's first focusable element and drops in as a chartreuse key when focused, jumping past the navigation straight to the tool. The slide respects reduced motion preferences.

## [1.4.34] - 2026-07-11

### Fixed

- A disabled primary button no longer blends the pressed-key look with the dashed disabled outline. The primary styling outranked the disabled state, so buttons such as a not-yet-usable submit looked clickable and not clickable at once, with light mode even painting the full chartreuse key under the dashes. Disabled primaries now render as a flat ghost in both themes.

## [1.4.33] - 2026-07-11

### Fixed

- Tables are readable on phones. The old narrow-screen treatment turned tables into sideways-scrolling boxes with no hint that more columns existed, so status pills were chopped mid-word and explanation columns sat invisible off-screen. Rows now restack as cards on narrow screens: names and pills flow on one line, the explanation wraps at full width beneath them, decorative header rows step aside, and nothing scrolls sideways.

## [1.4.32] - 2026-07-11

### Changed

- The film grain steps up once more in both themes. With the fine dot size this reads as richer paper texture rather than noise. README previews regenerated.

## [1.4.31] - 2026-07-11

### Changed

- The film grain is a touch more present in both themes, still well below its original strength, keeping gradients dithered while the texture stays a quiet detail. README previews regenerated.

## [1.4.30] - 2026-07-11

### Changed

- Button shadows are lighter. The ground shadow under the 3D keys drops much of its opacity and trades its tight spread for a softer blur, so it reads as ambient light falloff instead of an ink block, and the hard edge tone eases slightly in both themes. The key geometry and travel are unchanged. README previews regenerated.

## [1.4.29] - 2026-07-11

### Added

- The resize corner of text boxes shows a hand-drawn affordance again: two diagonal grip lines in brand green floating on a transparent square, so people can tell the box expands while the rounded corner stays clean. Light mode uses the deeper green for contrast on cream.

## [1.4.28] - 2026-07-11

### Fixed

- Scrollbars inside rounded boxes no longer break the corner. A scrollbar strip is always rectangular, so the glow, the center rail, and the system resize grip read as a square poking through a text box's corner radius. Inner scrollables now show a clean chartreuse pill with no glow or rail and an invisible resizer, while the page scrollbar, whose corners really are square, keeps the full glowing treatment.

## [1.4.27] - 2026-07-11

### Changed

- The scrollbar now carries the brand. The thumb is a glowing chartreuse key-cap pill with the same top-lit gradient the buttons use, riding a faint chartreuse center rail. It brightens and thickens under the pointer and charges up with a hotter gradient and stronger glow while being dragged. Firefox shows a solid chartreuse thumb through the standard scrollbar properties.

## [1.4.26] - 2026-07-11

### Added

- Custom scrollbars, on the page and inside any scrollable box such as the paste areas and code snippets. A slim rounded pill floats on a fully transparent track in each theme's surface tone, thickens and brightens under the pointer, and turns chartreuse while being dragged, the same accent the buttons use. WebKit browsers get the full treatment and Firefox gets the matching thin themed scrollbar through the standard properties.

## [1.4.25] - 2026-07-11

### Added

- Selected text now wears the brand. Highlighting any text shows the same chartreuse-with-dark-ink pairing the primary buttons use, identical in both themes, replacing the browser's default blue.

## [1.4.24] - 2026-07-11

### Fixed

- The cursor dust now lands directly on the pointer. The trail canvas is a replaced element, so inset alone did not stretch it and it laid out at its intrinsic retina-scaled size; on high-density displays every spark drew at a multiple of the cursor's position, drifting further from it toward the bottom right of the page. The canvas is now explicitly stretched to the viewport, verified at retina density.

## [1.4.23] - 2026-07-11

### Added

- A magical cursor trail. Tiny chartreuse sparks with the occasional twinkling four point star follow the pointer and burn out about a second after it rests. Dark mode gets pale glowing dust, light mode a deeper green so it stays visible on cream. It runs on a single fixed canvas, spawn rate follows how far the pointer travels, and the animation loop stops the moment the last spark dies, so an idle page costs nothing. Touch devices never load it and reduced motion turns it off entirely.

## [1.4.22] - 2026-07-11

### Changed

- The film grain is finer and milder. Each grain dot is now half its previous size, one device pixel on typical phone screens, and the overall intensity is reduced by about a quarter in both themes. Finer grain dithers banding more efficiently per unit of opacity, so gradients stay smooth while the texture recedes to a whisper. README previews regenerated.

## [1.4.21] - 2026-07-11

### Fixed

- The theme toggle no longer glitches when tapped on phones. Touch browsers pin the hover state to the last-tapped control, so after a tap the toggle sat stuck mid-twist with its hover halo on, layered over the press spin. All decorative hover styling for buttons, the toggle, and the scroll-to-top control now only exists on devices that can actually hover; touch devices get the clean press feedback alone. Controls also opt out of the double-tap zoom gesture, so taps respond without hesitation.

## [1.4.20] - 2026-07-11

### Fixed

- The film grain now actually renders on iPhone and iPad. WebKit does not apply SVG filters when an SVG is rasterized as a CSS background image, so the turbulence-based tile painted a faint dark veil with no noise at all on iOS, leaving gradient banding fully visible there. The grain is now a small pre-rendered raster tile that every browser draws identically, and it renders pixel-crisp on high-density screens instead of being smoothed into blur when the display upscales it. Gradient banding is dithered away in both themes with no soft or low-quality look. README previews regenerated.

## [1.4.19] - 2026-07-11

### Fixed

- The key press finally travels. During a click the pointer is still hovering, and the hover lift rule outranked the press rule, so the cap held its raised position while the shadows switched to pressed geometry, which read as the base jumping up instead of the cap going down. The press is now declared after the hover lift at matching specificity and wins the cascade, so the cap visibly sinks 3px into its anchored base on every click.
- Dark mode's primary button no longer loses its 3D edge on hover. A leftover rule from before the key redesign replaced the whole hover shadow with a flat glow.
- In light mode the pressed shadow now outranks the hover shadow mid click, so the primary button's base geometry stays correct through the press.
- Tapping controls on phones no longer flashes the system's default gray tap rectangle over the design's own pressed states. Keyboard focus outlines are unaffected.

## [1.4.18] - 2026-07-11

### Changed

- The 3D key buttons are rebuilt on realistic press physics. The base and its ground shadow are now anchored in place through every state: at rest the cap sits proud on a 5px base, hovering lifts the cap 1px while the base bottom stays put, and pressing sinks the cap 3px into the base with 2px of it still showing beneath the sunken cap, its ground shadow never moving and the shading inside the cap deepening. Before, the whole assembly moved together and the press read as the base rising instead of the cap sinking. Under reduced motion the cap stays still and only the shading responds. README previews are regenerated with the new resting stance.

## [1.4.17] - 2026-07-10

### Changed

- The Typography option is now ticked when the page loads. Cleaning pasted rich text is the main reason people arrive here, and straightened quotes with dash and ellipsis cleanup is usually wanted. The cleaning engine's own default is unchanged for direct clean() calls.
- Pressing a button now reads as the cap sinking into its socket. Before, the dark bottom edge collapsed as the button traveled down, which looked like the base rising to meet it. The edge now stays put beneath the sunken cap and a soft shadow falls across the cap's top, so the press feels like a real key going down.

## [1.4.16] - 2026-07-10

### Added

- A whisper of film grain now sits over the whole page in both themes. Large soft gradients band into visible steps on most displays; the static monochrome noise dithers those steps away and gives the surface a subtle print-like tooth. It is one tiled SVG turbulence texture with no blend mode and no animation, so it composites for free, stays out of pointer input, and is dropped entirely in print. README previews are regenerated with the new surface.

## [1.4.15] - 2026-07-10

### Fixed

- The theme toggle now turns and swells on hover on every page, the playful twist that until now only the WHMCS Emoji Compatibility Guide showed. All pages always shared the same hover rule, but a more specific button rule was overriding its transform with the standard key lift on the other tools. The toggle's hover and press rules now outrank the tactile key rules everywhere.
- Hovers and tooltips respond during the theme crossfade again. The crossfade overlay intercepts pointer input by default, which deadened the page, most noticeably the toggle's own hover twist and tooltip, for half a second after every theme switch. The live page underneath now stays interactive while the fade plays, matching how immediate the toggle felt before the fade shipped.

## [1.4.14] - 2026-07-10

### Fixed

- Tooltip arrows are visible again. The arrow is a bordered square whose colored wedge sat entirely behind the tooltip bubble, which paints later and shares the same ink color, so the bubble swallowed the arrow and nothing bridged the gap to the button. The arrow now sits with its tip in the gap, 4px off the button, and its base tucked one pixel under the bubble edge, painting above the bubble so the two read as a single speech-bubble shape. Both variants are fixed, the standard bubble above a button and the theme toggle's bubble below it.

## [1.4.13] - 2026-07-10

### Fixed

- The theme crossfade no longer stutters on phones. The browser's default crossfade blends the old and new page snapshots with a plus-lighter blend inside an isolated compositing group, which means two full-screen render passes every frame. Desktop GPUs absorb that, phone GPUs drop frames. The new page now sits fully opaque underneath while the old snapshot simply fades out above it, which reads identically on an opaque page and costs a single alpha layer. Decorative drift animations also pause for the half second the fade runs, freeing GPU headroom on mobile without any visible freeze.

## [1.4.12] - 2026-07-10

### Fixed

- Text no longer flashes and re-settles mid fade when switching between light and dark mode. Text color inherits, so during the old per-element fade every element kept re-easing its parent's already animating color, which made type lag behind the page and snap late. The switch now crossfades the whole page as a single composited snapshot through the View Transitions API, so text and background move together in one smooth pass. The theme toggle is excluded, so its sun and moon morph still plays live. Browsers without view transitions fall back to fading backgrounds, borders and shadows only, with text changing in one clean step.

## [1.4.11] - 2026-07-10

### Fixed

- The inline code chip inside alerts no longer renders as a dead gray block in light mode. Its 35% black wash was tuned for dark backgrounds; over the light pink alert it read as mud. In light mode the chip is now a crisp near-white card with a hairline red keyline, so the decoded payload stands out cleanly.

### Changed

- Switching themes now fades the whole page between night and day over half a second instead of snapping instantly, which could startle or dazzle, especially dark to light at night. The fade covers colors only (backgrounds, text, borders, shadows, SVG fills), and the theme toggle is excluded so its sun and moon morph keeps its own spring timing.

## [1.4.10] - 2026-07-10

### Fixed

- The theme toggle now shows the crescent moon on phones. The previous build morphed the mark by animating SVG geometry (the circle's radius and the mask position) from CSS, which desktop browsers support but iOS Safari does not apply, so dark mode on a phone showed a plain dot instead of a moon. The switch is rebuilt on opacity and transform only, the sun spins away as a true crescent path spins in, which every mobile browser animates. Same look on desktop, now correct everywhere.

## [1.4.9] - 2026-07-10

### Changed

- The theme toggle is redesigned from an emoji swap into a morphing mark. One vector drawing plays the whole switch: the sun's core grows into the moon while a masked bite slides in to carve the crescent, the eight rays spring away with an overshoot, and the mark tilts to seat the crescent, all reversed when switching back. The moon is brand chartreuse at night and the sun is warm amber by day, the round button trades the key edge for a soft brand halo on hover, and a tooltip appears below it saying which mode a click will switch to, on hover and keyboard focus only, never on touch. The morph is disabled under reduced-motion preferences.
- The README preview is regenerated.

## [1.4.8] - 2026-07-10

### Fixed

- The back-to-top button no longer casts a heavy black smudge in light mode. Its shadow was a single wide dark-theme blur that was never re-tuned for a cream background. Each theme now gets a layered shadow of its own: a tight warm contact shadow plus a soft chartreuse halo in light mode, and a grounded contact shadow with a gentle chartreuse under-glow in dark, with matching hover and pressed variants.

## [1.4.7] - 2026-07-10

### Changed

- Removed the pulsing status dot from the privacy pill. The animated dot has become one of the most recognizable template cliches on the web, and it was redundant next to the lock icon that already carries the meaning. The pill now leads with the lock alone, with its padding evened out.
- The README preview is regenerated.

## [1.4.6] - 2026-07-10

### Added

- Tactile depth across the interface. Every button is now built like a physical key: a hard edge shadow beneath it, a soft ambient shadow, and a hairline top bevel. Hovering lifts the key slightly, and pressing travels it down while the edge collapses underneath, a real press you can feel. Primary buttons carry a chartreuse edge and glow, secondary buttons use a warm brand-brown edge in light mode and a deep neutral one in dark, disabled buttons stay flat since a dead control should not look pressable, and the movement is disabled under reduced-motion preferences while the shadow feedback remains. Cards gain a quiet layered elevation per theme.
- The README preview is regenerated.

## [1.4.5] - 2026-07-10

### Fixed

- The menu's hover state no longer turns gray, and no longer sticks. Hovering used a gray panel tone that clashed with the brand language, and on phones a tap glued that gray pill to the last-tapped item because touch browsers keep a sticky hover. Hover styling now only applies on devices with a real pointer and uses a faint chartreuse brand tint, while the active item keeps the stronger chartreuse wash and always wins when it is both hovered and active.
- The active menu item now also carries `aria-current`, so screen readers hear which section you are in, kept in sync with the highlight by the same scroll logic.

## [1.4.4] - 2026-07-10

### Changed

- Light mode brings the brand home. The signature chartreuse #abcf37 button with dark ink text, the same button dark mode has always had, is now the primary action in light mode too, and chartreuse drives the accent washes, the menu band, the page glow, and the decorative scene. The airy cream background and crisp white cards return, links use a fresh deep green that passes AA on every chartreuse wash, and the verdict colors return to the vivid set with bright washes. Every rendered text pair measures 4.5:1 or better on the live page (the brand button measures above 10:1), and the dark theme is untouched.
- The README preview is regenerated for the new palette.

## [1.4.3] - 2026-07-10

### Changed

- Light mode now uses the studio palette chosen from design references: sand background #EEE3CF, warm ivory cards, coral #FE6E54 primary buttons with dark ink text (mirroring dark mode's dark-on-chartreuse buttons), a deep coral accent for links and highlights, sage #93A86C washes with the dark green #375554 as success text, a pale gold #FCDB99 wash under warning pills, teal #40A5A0 washes with indigo #363D6E as info text, and a coral, sage, and teal decorative scene. Every rendered text pair measures 4.5:1 or better on the live page, and the dark theme is untouched.
- The README preview is regenerated for the new palette.

## [1.4.2] - 2026-07-10

### Changed

- Light mode is redesigned around a warm editorial palette inspired by premium product sites: terracotta coral becomes the accent for buttons, links, and highlights, the success wash turns sage, the danger red deepens toward crimson so it stays clearly apart from the coral, type warms one step browner, the menu band turns soft sage, and the decorative scene (orbs, spheres, cube wireframes) moves to coral, sage, and warm brown. The cream background and the whole dark theme are untouched, and every rendered text pair measures 4.5:1 or better on the live page.
- The README preview is regenerated for the new light palette.

## [1.4.1] - 2026-07-10

### Fixed

- Restored the suite's visual identity that the previous release had trimmed: the ambient background scene with its orbs and spheres, the original header headline and voice, the hero illustration theming, and the light and dark split-screen README preview. The functional, accessibility, security, and test improvements from that release are all kept.

### Changed

- Light mode's palette is rebuilt around fresh hues instead of darkened earth tones. The accent is now a vivid deep green, success is emerald, the warning orange is clear instead of brown, and the red is brighter. Chip and pill washes are tinted from bright brand colors rather than from the dark text colors, so they read as lively pastels instead of a gray film, and the light-mode decorative constants (page glow, cube wireframes, spheres) moved from olive to brand chartreuse. Every rendered text pair was re-measured at 4.5:1 or better on the live page; dark mode is untouched.
- The README preview is regenerated to show the new light palette beside dark mode.

## [1.4.0] - 2026-07-10

### Added

- Mongolian free variation selector four (`U+180F`) is now included in the published ruleset.
- Static site checks now verify local assets, internal anchors, structured metadata, and explicit accessible names for interactive controls.
- Added `SECURITY.md`, a private advisory link, and monthly Dependabot checks for GitHub Actions.
- CI now tests Node.js 22, 24, and 26 on Linux, macOS, and Windows with pinned action revisions and syntax checks.
- Added `robots.txt`, `sitemap.xml`, and Open Graph and Twitter metadata.

### Changed

- Inspector findings can be focused from the keyboard, buttons meet a 44-pixel minimum touch height, and reduced-motion preferences now cover scripted scrolling and the inline illustration.
- Public copy now distinguishes character findings from authorship claims and documents browser, confusables, variation-sequence, clipboard, and large-input limits.
- Removed gradient and blurred sphere decorations; the background now uses geometric outlines and stars.

### Fixed

- Cleaning no longer collapses intentional pairs of ordinary spaces in otherwise clean text.
- Emoji, CJK, and Mongolian variation selectors are preserved only when they directly follow a compatible base, so duplicate or misplaced selectors are removed.
- Malformed tag runs after a black flag can no longer pass as subdivision flag data.
- The browser UI reuses one analysis result and omits the unmarked remainder of oversized inspector previews, reducing duplicate work and preventing hidden direction controls beyond the preview cap from affecting the display.
- Copy failures now select the cleaned output and prompt manual copying instead of showing success.

## [1.3.2] - 2026-07-10

### Added

- Continuous integration now runs the cleaner test suite and checks that the generated rules JSON is current.

### Fixed

- A zero-width joiner is no longer preserved just because it touches one emoji. It now has to sit between two emoji neighbors to count as a real emoji sequence, so cases like `😀(zwj)x`, `x(zwj)😀`, and doubled joiners between emoji are cleaned instead of treated as legitimate emoji internals.

## [1.3.1] - 2026-07-09

### Fixed

- The inspector now renders at most 20,000 finding markers. Counts and cleaned output still cover the complete input.

## [1.3.0] - 2026-07-09

### Added

- Added detections for Unicode line separators (`U+2028`, `U+2029`), `NEL` (`U+0085`), combining grapheme joiner (`U+034F`), object replacement character (`U+FFFC`), braille pattern blank (`U+2800`), and Mongolian free variation selectors (`U+180B..U+180D`).
- Added preservation rules for ideographic spaces beside CJK characters and no-break spaces beside French punctuation. Narrow no-break spaces in time-like contexts are still normalized.
- Added a Content Security Policy with `connect-src 'none'`.

### Fixed

- Only a valid subdivision flag sequence is preserved after a black flag; malformed tag runs are decoded and cleaned as tag payloads.
- A zero-width joiner between digits is no longer mistaken for an emoji join, and is removed.
- Modifier lookaround is capped to prevent quadratic scanning. A regression test covers a 30,000-character modifier run.

### Changed

- Accessibility: the paste box has a real label and the cleaned-text box an accessible name.
- 30 tests, up from 21.

## [1.2.5] - 2026-07-09

### Changed

- Updated light-mode accent, status, button, chip, and muted-text colors to improve contrast. Dark mode is unchanged.

## [1.2.4] - 2026-07-09

### Added

- The inline hero illustration now follows the light-theme color tokens. Dark mode is unchanged.

## [1.2.3] - 2026-07-09

### Fixed

- Menu highlighting now follows the last section above the reading line under the sticky header, including the final section at the bottom of the page.

## [1.2.2] - 2026-07-09

### Changed

- Moved the menu to a wrapping row below the brand bar. Section jumps now measure the sticky header height.

## [1.2.1] - 2026-07-09

### Fixed

- On screens below 720 pixels, menu items wrap into a centered row instead of using horizontal scrolling. Desktop keeps a single sticky row.

## [1.2.0] - 2026-07-09

### Added

- Added a CSS background scene with geometric shapes, stars, pointer and scroll parallax, theme variants, a small-screen cutoff, and a reduced-motion state.
- Sticky navigation bar with brand, section links that highlight as you scroll, and smooth anchor scrolling.
- Light and dark mode toggle, persisted across visits, honoring the system preference on first visit, with a ?theme= URL override.
- Animated header illustration in the suite's mini-window style, hidden on small screens to keep mobile content-first.
- Scroll-to-top button that appears after scrolling.
- Emoji accents on section headings.

### Changed (motion)

- Added CSS entrance and hover motion with a reduced-motion state.
- Removed textarea autofocus so the page no longer loads scrolled past the header.

### Fixed

- The Paste button now requests clipboard access directly on iPhone and iPad. If access is declined, the input is focused and the cleaner runs after a manual paste. Empty clipboards report an empty state.
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
- `?demo` URL parameter that loads a representative sample.

[1.8.2]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.8.2
[1.8.1]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.8.1
[1.8.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.8.0
[1.7.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.7.0
[1.6.1]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.6.1
[1.6.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.6.0
[1.5.3]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.5.3
[1.5.2]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.5.2
[1.5.1]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.5.1
[1.5.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.5.0
[1.4.60]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.60
[1.4.59]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.59
[1.4.58]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.58
[1.4.57]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.57
[1.4.56]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.56
[1.4.55]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.55
[1.4.54]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.54
[1.4.53]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.53
[1.4.52]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.52
[1.4.51]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.51
[1.4.50]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.50
[1.4.49]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.49
[1.4.48]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.48
[1.4.47]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.47
[1.4.46]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.46
[1.4.45]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.45
[1.4.44]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.44
[1.4.43]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.43
[1.4.42]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.42
[1.4.41]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.41
[1.4.40]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.40
[1.4.39]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.39
[1.4.38]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.38
[1.4.37]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.37
[1.4.36]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.36
[1.4.35]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.35
[1.4.34]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.34
[1.4.33]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.33
[1.4.32]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.32
[1.4.31]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.31
[1.4.30]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.30
[1.4.29]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.29
[1.4.28]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.28
[1.4.27]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.27
[1.4.26]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.26
[1.4.25]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.25
[1.4.24]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.24
[1.4.23]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.23
[1.4.22]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.22
[1.4.21]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.21
[1.4.20]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.20
[1.4.19]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.19
[1.4.18]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.18
[1.4.17]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.17
[1.4.16]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.16
[1.4.15]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.15
[1.4.14]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.14
[1.4.13]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.13
[1.4.12]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.12
[1.4.11]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.11
[1.4.10]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.10
[1.4.9]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.9
[1.4.8]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.8
[1.4.7]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.7
[1.4.6]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.6
[1.4.5]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.5
[1.4.4]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.4
[1.4.3]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.3
[1.4.2]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.2
[1.4.1]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.1
[1.4.0]: https://github.com/JaydenYoonZK/ai-paste-cleaner/releases/tag/v1.4.0
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
