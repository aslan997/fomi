# Part A — Design Specification

Reference: [`docs/reference/part-a-mockup.png`](reference/part-a-mockup.png) (1374×671 screenshot, app frame ≈1355px wide).
Measurements were taken from the screenshot and scaled ×1.06 to a 1440px desktop viewport. Colors were sampled with a 3×3 average.

## Observed (from the mockup)

| Region | Observation | Implemented value |
| --- | --- | --- |
| Page | Warm off-white surface | `#FCFAF8` |
| Header | ~90px tall; logo far left; icon nav centered; utility pills right | `h-[92px]`, `px-[52px]` |
| Logo | Heavy black geometric "F" | Inline SVG, 26px tall |
| Nav indicator | Pale track (~410×7) above icons with coral active segment (~58px) | track `#F6E9E4`, active `#D9876C` |
| Nav icons | 5 dark glyphs: home, image, video, wand, folder, ~86px apart | 20px icons |
| Utility pills | "Gallery", "Support": icon + light-grey 11px label on faint pill | `#F7F1EE` bg, `#6E6764` text (see deviations) |
| Theme toggle | Faint crescent moon in faint circle | 28px circle |
| Avatar | Round photo, ~24px | 28px |
| History strip | Rounded bar (r≈14) spanning content width, ~90px tall, faint warm bg and border; feed scrolls beneath it | `#F9F3F0`, border `#F1E6E1` |
| History tile | White square with "History" (bold, grey-700) / "View All" (9px grey) | 72×72, r=8 |
| Divider | Small white vertical pill between tile and thumbnails | 6×28 |
| Thumbnails | ~72px squares, r≈7, 16px gap, fade at right edge | `mask-image` fade |
| Composer panel | 272px wide, r≈20, soft blush surface | `#F8EDE8`, border `#F1E1DA` |
| Mode switch | White pill track; active segment blush; 10px grey labels | track `#fff`, active `#F3E1DA` |
| Prompt box | White, 1.5px dark border, r≈16, soft drop shadow, ~170px tall | `#2B2B2B` border |
| Generate | Coral pill inside prompt box bottom-right, sparkle icon, white 15px label | `#E39C85` |
| Option chips | 3 white pills: "# Images", "1:1", "Model: **Name**", each with chevron in faint circle | 10.5px text |
| Disclosures | Full-width white pills "Advance", "Styles"; centered 14px label; chevron in faint rounded square at right | h=36 |
| Prompt card | 248px wide, r≈16, blush `#F5EBE7`, 11px grey-700 text with relaxed leading, "Model" white mini button bottom-right | top-aligned with its image row |
| Image grid | 4 portrait tiles per row, ratio ≈178:255, r≈8, 14px gap; 24px between rows | `aspect-[178/255]` |
| Type | Geometric sans with single-storey feel → Poppins | `next/font` Poppins 400/500/600/700 |

## Inferred (behavior not visible in a static image)

- The feed is chronological (newest at bottom, chat-style) and opens scrolled to the latest generation, matching the mockup's scrolled state.
- The history strip is a newest-first index of all generations; selecting a thumbnail scrolls the feed to that generation.
- Nav: Home = all creations, Image / Video = filter by output type (and switch composer mode), Folder = saved (favorited) items. The wand (editing tools) is outside assessment scope and is shown disabled with an explanation.
- "Gallery" opens a grid of all outputs; "Support" opens help + keyboard shortcuts + demo controls (simulate error / empty result).
- Moon toggles a dark theme. Avatar opens an account menu with mock credit balance.
- "Model" on a prompt card opens the generation details (model, ratio, seed, style) with "Reuse settings" and "Copy prompt".
- Option chips open a custom listbox (`components/ui/Select.js`) with previews: ratio shapes, result-count glyphs and model descriptions.

## Deliberate deviations from the mockup

| What | Mockup | Implemented | Why |
| --- | --- | --- | --- |
| Muted labels ("Gallery", "View All", inactive "Video") | ≈`#8C8582` | `#6E6764` | Sampled grey was 3.2–3.6:1; darkened to pass WCAG AA (4.5:1). Barely visible difference. |
| Generate button | White on `#E39C85` | Unchanged | Kept for fidelity (2.2:1). The single documented contrast exception; excluded by name in the axe test. Coral buttons that are *not* in the mockup use dark text (≈7:1). |
| Generate with an empty prompt | Button looks enabled | Still looks enabled; pressing it shows an inline hint and focuses the prompt | Matches the mockup's full-strength button while avoiding a silent no-op. |
| Image tiles | Same woman in every tile | Different redhead portraits | Generated imagery wasn't available; licensed stock can't supply one model 8×. |
| Feed order < 1024px | — | Newest first | The composer stacks above the feed on small screens, so new results stay next to it. |

## Responsive plan

| Range | Layout |
| --- | --- |
| ≥1280 | As mockup: composer column · prompt card · 4-col grid |
| 1024–1279 | Composer column; prompt card stacks above a 4-col grid |
| 640–1023 | Composer becomes full-width block above feed (newest-first); 4-col grid; header keeps a tighter icon nav |
| <640 | Header: logo + utilities; icon nav moves to a fixed bottom tab bar; 2-col grid; history strip scrolls horizontally |
