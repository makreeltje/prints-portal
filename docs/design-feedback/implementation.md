# Implementation status

This section is written by the **app**, not by the design system. It is the
implementer's half of the conversation: what is built, what the measurements
say, what is still open, and where we got something wrong. The design system
owns `tokens.json`, `components/` and `bundle.css`; nothing here changes them.

Everything below was measured in the running app against a real library (83
prints, 10 klanten, about two years of history), not reasoned about.

- App version **1.0.0**, built against design system **1.9**.
- **104 gaps logged, 19 open.** Numbering is unbroken; nothing is hidden.
- v1.9 is implemented: 24 of its 26 gaps, with GAP-071 and GAP-072 left where
  the export left them, which was "proposed".

## What has happened since the last update

The owner used the app and walked through every screen of v1.9. That produced
**thirteen new gaps (GAP-091 to GAP-103)**, two decisions, and one bug found
while drawing a logo (GAP-104). Two things were fixed outright rather than
logged: the password message below, and a test that failed for an hour every
night because its fixtures read the wall clock.

## Open gaps, grouped

### Still waiting from v1.9

- **GAP-071** — the dark tint. The `--mix` floor ships and cannot reach 3:1;
  the full table is below. Needs a direction, not a number.
- **GAP-072** — the card subtitle. Marked *proposed* by v1.9, so the share page
  follows it and the card does not. Needs a yes or no.
- **GAP-088** — two specs still show the internal link label: DocOverview, and
  ScreenSharePage contradicting itself inside one file.

### Decided by the owner, now waiting on the spec

- **GAP-089** — **no video decoder** in the container image. The poster-frame
  thumbnail should come out of VideoPlayer rather than be built. Two prints of
  83 are video-only.
- **GAP-090** — instead of a poster, the owner wants to see at a glance which
  files a print **lacks**, as small icons on the tile. Two of its questions are
  already settled by measurement, below.

### From the walkthrough

Reading, selecting and hit areas: **GAP-091** (the tile looks selectable but
only its checkbox selects), **GAP-092** (a klant chip sets name and count in
the same weight), **GAP-093** (in the list only the title opens a print, in the
grid the whole card does), **GAP-099** (a user's name in Toegang looks
interactive and is not).

The print detail, which the owner still finds wrong: **GAP-094** (the model
picker shows file names where thumbnails would say more, and a Select above
six), **GAP-095** (a lot of empty space now the viewer is capped, so the order
of the page reads wrong), **GAP-096** (a timelapse is buried in the file list
while the model gets a viewer), **GAP-097** (every file is listed inside every
order, repeating the print's contents).

Elsewhere: **GAP-098** (a column menu in Toegang is painted over, measured
below), **GAP-100** (the password message, fixed with placeholder copy),
**GAP-101** (Instellingen and Tags leave most of their width empty),
**GAP-102** (API-docs still reads as a box in a box, after GAP-084),
**GAP-103** (the share page says what is owed and offers no way to pay),
**GAP-104** (an uploaded SVG logo silently loses its text).

**GAP-096 and GAP-097 are our suggestions, not the owner's**, offered because
they had no settled view: put the timelapse in the model picker so the viewer
area carries every picture of the print, and move the file list up to print
level so an order holds only what it bills. Both are proposals to accept or
replace.

## Measurements

### GAP-090, which files are missing (83 prints)

The owner's worry was that icons would make the tile busy. Flagging what is
**missing** is quiet; flagging what is **present** is not:

| icons on a tile | missing | present |
| --- | --- | --- |
| 0 | 70% | — |
| 1 | 24% | 4% |
| 2 | 4% | 8% |
| 3 | 2% | 51% |
| 4 | — | 37% |

Per type: no G-code **16%**, no STL **5%**, no 3MF **4%**. Every combination
that occurs: G-code alone 16%, STL alone 5%, 3MF alone 4%, G-code+3MF 2%,
G-code+3MF+STL 2%, G-code+STL 1%.

Two parts of the original idea were dropped **because** of measurement.
**Video** is out: it would have marked **40%** of tiles, and a timelapse is not
expected of every print. **"Incomplete 3MF"** is out: a proxy for unsliced
matched **92%**, since a downloaded project file is normally unsliced and the
G-code beside it carries the slice.

### GAP-098, the clipped menu in Toegang

At 1360px the leftmost column menu spans x=364 to x=504 while the sticky user
column ends at x=410, so **46px of the panel is covered** and the items read
"s selecteren". The scroll box does not clip it — the sticky cell paints over
it, although `z-popover` (30) sits well above `z-raised` (1).

### GAP-104, text in an uploaded SVG

The container ships **no fonts** (`/usr/share/fonts` absent, `fc-list` returns
0) and the rasteriser is given no font configuration. An SVG holding one
rectangle and one word rendered **1600 opaque pixels for the shape and 0 for
the text**. A studio uploading a normal logo would find its own name missing
from its invoices, with no warning.

### GAP-071, the dark tint (unchanged, repeated because it is still open)

| `--mix` | ground | darkest | lightest |
| --- | --- | --- | --- |
| 100% (default) | `rgb(0,0,0)` | 1.21 | 1.57 |
| 80% | `rgb(22,24,30)` | **1.02** | 1.33 |
| 60% | `rgb(44,49,60)` | 1.34 | **1.03** |
| 40% (the proposed floor) | `rgb(67,73,90)` | 1.94 | 1.49 |
| 25% | `rgb(83,92,112)` | 2.60 | 2.00 |

No single mix clears 3:1 at both ends, and at 80% and 60% the result is worse
than doing nothing.

### A logo now exists, and what it had to obey

This installation had no mark; one was drawn for it. Two constraints came out
of the app and are worth knowing, because they apply to any logo:

- The logo is shown in **both themes with no adaptation**, so one file must
  survive white and `#1a1b26`. `#5878d6` gives **4.14:1 and 4.13:1**. The
  system's own `primary` cannot do it: 6.12/2.79 in light, 2.52/6.79 in dark.
- The sidebar caps it at `--space-7`, **32px**, where a second line of type
  lands at about 4px. A tagline was drawn and removed after seeing it there.

## Fixed since the last update

- **GAP-100** — replacing a temporary password with the same one was refused
  correctly by the backend (`password_unchanged`) and shown as "Er ging iets
  mis", because the page mapped only `password_too_short`. The field now says
  to choose a different password, with placeholder copy marked
  `ds-gap: GAP-100` until the deck has wording.
- A sharing test failed for about an hour every night: its fixtures added an
  hour to `Date.now()`, so near midnight "morgen" became "vandaag". The suite
  no longer reads the wall clock.

## Deviations we chose, and why

- **GAP-066** — sorting and filtering by money reads the whole filtered set
  server-side rather than replicating payment logic in SQL across SQLite,
  PostgreSQL and MariaDB. It meets the requirement ("Geen prijs" answers *9 van
  9*) but scales with library size.
- **GAP-083** — the spec asks for `useBlocker`, which needs a data router; this
  app uses a plain `BrowserRouter`. In-app links are caught in the capture
  phase and the browser's own prompt covers closing the tab. **The back button
  is not caught.**
- **GAP-080** — thresholds exactly as specified, knowing 84% of open lines are
  over 90 days, so 7 of 10 klanten land in the top step.

## What would help most next

1. **GAP-096 and GAP-097** decide most of the print detail, which is the screen
   the owner still finds wrong after v1.9 reworked it. GAP-094 and GAP-095 fall
   out of whatever you choose there.
2. **GAP-071** — a direction. The ground alone cannot carry it.
3. **GAP-090** — the indicator is now unambiguous: three file types, 70% of
   tiles carrying nothing. It needs drawing, not deciding.
4. **GAP-088 and GAP-072** — the two left over from v1.9; both are one answer.
5. Keep asking for numbers. Three questions this round were settled by
   measuring instead of discussing, and two of them reversed the first instinct.
