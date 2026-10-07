# Implementation status

This section is written by the **app**, not by the design system. It is the
implementer's half of the conversation: what is built, what the measurements
say, what is still open, and where we got something wrong. The design system
owns `tokens.json`, `components/` and `bundle.css`; nothing here changes them.

Everything below was measured in the running app against a real library (83
prints, 10 klanten, about two years of history), not reasoned about.

- App version **1.0.0**, built against design system **1.9**.
- 89 gaps logged, **4 open**. Numbering is unbroken; nothing is hidden.
- `scripts/check-design-export.mjs` reads an export against its own changelog.
  On 1.9 it is clean: all 33 classes it claims are in `bundle.css`, and the
  gaps it leaves unsettled are named below rather than quietly implemented.

## Open gaps, and what is really built

### GAP-071 — a dark filament tint swallows the model

**The `--mix` floor does ship**; an earlier note of ours said it did not, and
that was our mistake (a grep that missed `--mix` inside `var(--mix,100%)`).
What is true is that the mechanism cannot reach 3:1, and between 100% and 40%
it makes things worse. Measured on a black-filament thumbnail, the model's
darkest and lightest pixels against their ground:

| `--mix` | ground | darkest | lightest |
| --- | --- | --- | --- |
| 100% (default) | `rgb(0,0,0)` | 1.21 | 1.57 |
| 80% | `rgb(22,24,30)` | **1.02** | 1.33 |
| 60% | `rgb(44,49,60)` | 1.34 | **1.03** |
| 40% (the proposed floor) | `rgb(67,73,90)` | 1.94 | 1.49 |
| 25% | `rgb(83,92,112)` | 2.60 | 2.00 |

The model image holds a *range* of luminances, so a ground moving through that
range collides with part of it: at 80% it matches the darkest pixels, at 60%
the lightest. No single mix clears 3:1 at both ends, and the best value
measured is already past the proposed floor.

Two further facts. A thumbnail is often a **slicer preview**, which the slicer
renders in the filament colour itself, so the dark thing is the image, not the
ground behind it. And our STL renders deliberately use a light neutral grey
(`236,238,244`) for exactly this reason, so they are not the problem case.

The app also cannot set `--mix` yet: the kit's `check-design-tokens.sh` allows
only `--tag`, `--tag-ink`, `--c1`, `--c2` inline. 1.9 calls `--mix` a new
allowed inline data property, so that list needs extending — we have not
touched the checker, since there is nothing to let through until the approach
changes.

**What would help:** a decision, not a number. Separating the model from the
ground (the inset ring is a start; an outline or shadow would not depend on
the tint at all), or a neutral ground for dark filaments with the colour shown
as a swatch, or a stated lower target for a photographic preview.

### GAP-072 — the card subtitle repeats the print's name

1.9 marks this **proposed, needs your confirmation**, and your own
breaking-changes note says "(GAP-072, if confirmed)". We briefly recorded it as
resolved, which was wrong, and only half of it is built:

- **share page** — follows the proposal (the date alone when the project
  equals the print name), marked `ds-gap: GAP-072` and reversible.
- **card and list** — unchanged; still always "klant / project". This was the
  original finding, so it is the half that matters most.

Waiting on your confirmation before the card changes.

### GAP-088 — two specs still show the internal link label

1.9 resolves GAP-077 with "The link label is internal and no longer appears on
the page, in the PDF title or in the tab title". Two anatomy paragraphs were
not updated to match:

- **DocOverview**: 'Title "Overzicht", the sub-line is the link label.'
- **ScreenSharePage contradicts itself inside one file**: its own Anatomy still
  says 'Top: studio name or logo, heading "Overzicht voor {klant}", the link
  label and the expiry notice.'

The klant downloads that PDF, so we have left the label out of it entirely and
the sub-line is empty, marked `ds-gap: GAP-088`. Please say what belongs there
instead, and reconcile the two paragraphs.

### GAP-089 — a video-only print cannot show a poster frame

VideoPlayer is built and plays real timelapses. The other half of the spec
makes the poster frame the *thumbnail* of a video-only print, and thumbnails
are rendered by our backend, which has no video decoder (it renders PNG, reads
3MF previews, rasterises STL; its only media library is `@resvg/resvg-js`).
Adding one grows the container image, which is the owner's decision rather than
a design one. Small in practice: 2 prints of 83 are video-only.

## The measurements 1.9 asked for

**GAP-080, days-open distribution** (75 open lines):

| age | lines | share |
| --- | --- | --- |
| ≤30 | 5 | 7% |
| 31–90 | 7 | 9% |
| 91–180 | 8 | 11% |
| 181–365 | 14 | 19% |
| 366–730 | 37 | 49% |
| >730 | 4 | 5% |

Median 502 days, oldest 741. The 30/90 thresholds put **84% in the top step**,
so 7 of 10 klanten land there and the escalation barely discriminates.
**90/365** would give 16% / 30% / 54%. We implemented 30/90 as specified; the
caveat is that this library carries an unusual backlog, so thresholds tuned to
it may not suit a fresh install — they may belong in settings.

**GAP-086, models per print:** 81 of 83 prints have at least one model, and
**74 (89%) have more than one**. Median 3, largest 29. The Select above six is
therefore the normal sight, not an edge case.

**GAP-085, video:** only **2 prints are video-only**, but there are **119
`.mp4`** files across the library. Just **2 `.mkv`**, so the unsupported-
container path is nearly dead code.

**GAP-064, where the price field sits** after the 560px cap:

| | viewer | price field | page |
| --- | --- | --- | --- |
| 1360×900, with a model | 560×420 | y=936 | 1339px (was 2679) |
| 1360×900, no model | the 72px strip | y=588 | 900px |
| 390×844, with a model | 358×269 | y=1433 | 1627px |

A large improvement. Worth knowing: with a model the price field is still
**36px below** a 900px fold.

## Deviations we chose, and why

- **GAP-066** — sorting and filtering by money reads the whole filtered set
  server-side instead of replicating payment logic in SQL across SQLite,
  PostgreSQL and MariaDB. It meets the requirement ("Geen prijs" answers *9 van
  9*, not 9 of the 24 on screen) and the common date-sorted case stays in the
  database, but it scales with library size.
- **GAP-083** — the spec asks for `useBlocker`, which needs a React Router data
  router; this app uses a plain `BrowserRouter`. In-app links are caught in the
  capture phase instead and the browser's own prompt covers closing the tab.
  **The back button is not caught.**
- **GAP-080** — thresholds implemented exactly as specified, with the
  distribution above as the caveat.

## Corrections to things we told you

1. We reported the `--mix` floor missing from 1.9. It ships; our grep missed
   it. The export checker exists so this does not recur.
2. We recorded GAP-072 as resolved when 1.9 marks it proposed. Now open again,
   with the built half named.

Both were caught by our own tooling and are written down here rather than
quietly fixed.

## What would help most next

1. A direction for **GAP-071** — the ground alone cannot carry it.
2. **GAP-088**: what the Overzicht sub-line holds, and the two paragraphs
   reconciled.
3. Confirm or change **GAP-072** for the card and list.
4. When a gap needs a number, ask for it. Anything in the app can be measured
   on real data, and a guess from either side has cost us a round twice now.
