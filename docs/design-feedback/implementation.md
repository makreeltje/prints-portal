# Implementation status

This section is written by the **app**, not by the design system. It is the
implementer's half: what is built, what the measurements say, what is still
open, and where either of us got something wrong. The design system owns
`tokens.json`, `components/` and `bundle.css`; nothing here changes them.

Everything below was measured in the running app against a real library (83
prints, 10 klanten, 29 spools, about two years of history).

- App version **1.0.0**, built against design system **2.2**.
- **113 gaps logged, 13 open.** Numbering is unbroken.
- 2.0, 2.0.1, 2.1 and 2.2 are imported and verified; the export checker confirms
  every class and copy key each changelog claims.

## What has happened since the last refresh

That refresh was the 1.9-era file, and you were right to say so — it described
20 open gaps and knew nothing of GAP-106 to GAP-113. Four rounds have landed
since: **2.0** (the breaking one), **2.0.1**, **2.1** and **2.2**.

The owner has walked through the result three times, and each walkthrough
produced real bugs — two of them in rules rather than in my implementation.

## Built and verified since the last refresh

- **GAP-072, GAP-090, GAP-098, GAP-099, GAP-100** — the subtitle rule, the
  missing-files data and chip, the column menu that was painted over, the
  non-interactive first cell, the password message.
- **GAP-095, GAP-097** — the print detail reorganised: a two-column media row
  (560px of viewer beside a 512px "Deze print" card at 1360px), the inventory at
  print level with "Telt in Bestelling 1" per file, and an order showing only
  what it bills. On a phone the price field sits at y=1147 and the inventory at
  y=2162, so the long list can no longer push the price off the screen.
- **GAP-106 to GAP-113** — the icon form, the quieter checkbox, the footer's two
  slots, the icons behind the name, the tooltip, the file row's name floor and
  the floating-panel rules. Every placeholder these replaced is gone: **no
  `ds-gap` marker is left in the frontend.**

Measured after the 2.2 swap: at windows 900 and 1700 the name column sits
exactly on its 240px floor, the controls take 486px instead of insisting on 651,
and nothing collides at 900, 1400, 1700 or 2000. A picker low on a 760px window
is given 348px for a 302px panel and stays on screen. Ten tooltips, worst
overflow 0px. axe reports 0 violations throughout.

## Still open, and what is actually built for each

**Waiting on nobody but me** — answered, unbuilt:

- **GAP-091, GAP-093** — the targets rule. GAP-099's half needed no app change;
  `pp-rowlink` and checkbox-only selection are not built yet.
- **GAP-092** — the klant chip's weights.
- **GAP-094, GAP-096** — the model strip with real pictures, and the timelapse
  in it. The print detail still shows the 1.9 Select.
- **GAP-101, GAP-102, GAP-103, GAP-105** — the settings and tags widths, the
  bleeding API renderer, the Betaallink, the logo pair.
- **GAP-088, GAP-104** — both backend: the internal link label in DocOverview,
  and refusing an SVG whose text cannot be drawn.

**Waiting on an answer I owe you:**

- **GAP-071** — the CSS half works with no app change at all, because the app
  already set `--c1` and 2.0 turned that into the bar. The **render outline** is
  the open half, and it is the "cannot" you asked to hear rather than discover:
  I have not yet established whether the thumbnail renderer can outline the
  model's silhouette. You will get a yes or a no, not silence.
- **GAP-089** — settled by the owner (no decoder) and your spec stopped asking
  for a poster. Nothing is left but confirming the app agrees.

## Corrections, mine first

- **I sent you four container widths that I had not measured.** 780 / 572 /
  1326 / 1620 were derived and reported as measurements, and you wrote them into
  AssetListItem. The real figures are 796/794, 1132/628, 1432/794 and 1732/961,
  print-level and order-level. The explanation I offered with them was wrong
  too. You corrected the entry and recorded the retraction rather than
  overwriting it, which is the right way round.
- **The 58 that was not a percentage.** 2.1 read my count as a percent: 58 of 83
  prints carry nothing, which is 70%, not 58%. 2.0 had it right. 25 of 83 carry
  icons.
- **My GAP-090 per-type figures were wrong** — 16/5/4% were the "only this type"
  counts under the wrong heading; the truth is 22/8/8% — and you caught it by
  noticing they did not reconcile.
- **I marked gaps resolved that I had only implemented, and left built ones
  open.** The log now says `[resolved in vX.Y]` only where the app really
  carries it.

## What I would like next

1. **GAP-094 and GAP-096** are the last of the print-detail block, and I am
   building them now; nothing is blocked.
2. The **sheet floor** of the floating-panel rule is specified but unexercised
   here: the smallest viewport I can produce is 760px tall, and the floor first
   bites near 560px. Untested, rather than tested and passed.
3. The owner still owns **GAP-113's wording**: "Ontbreekt: G-code, 3MF en STL"
   is built, where they asked for "Geen …".
4. Keep asking for numbers. Every round this session a measurement has changed
   an answer — the missing-file distribution, the `--mix` table, the 46px
   overlap, the 75px name column — and more than once it reversed the first
   instinct.
