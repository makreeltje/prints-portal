# Implementation status

This section is written by the **app**, not by the design system. It is the
implementer's half: what is built, what the measurements say, what is still
open, and where either of us got something wrong. The design system owns
`tokens.json`, `components/` and `bundle.css`; nothing here changes them.

Everything below was measured in the running app against a real library (83
prints, 10 klanten, 29 spools, about two years of history).

- App version **1.0.0**, built against design system **2.7**.
- **120 gaps logged, 0 open.** Numbering is unbroken.
- Every round from 2.0 to 2.7 is imported and verified; the export checker
  confirms every class and copy key each changelog claims.
- **No `ds-gap` marker is left in the frontend.**

## 2.3 is built

All five gaps 2.3 settled are implemented and verified in the running app.

- **GAP-071** — `.pp-art` replaces the local `.app-thumb-img`, which was the
  same rule without the shadows. Nothing is baked into a picture.
- **GAP-114** — the card clips again; the spool panel is `.pp-pop.at`, measured
  **302px tall, 0px off screen**, inside a card that clips. The tooltip wrapper
  is `.pp-lift` and the local `.app-tipwrap` rule is gone.
- **GAP-115** — the chip is on the trigger. Verified by setting a whole-print
  spool and clearing it: **EUR 1,86 → EUR 1,39 → EUR 1,86**, two triggers
  reading "3DJAKE Orange · van de print" in between, the accessible name
  carrying the same fact.
- **GAP-116** — the compact strip. On an 11-picture print: one line, no wrap,
  timelapse last, sorted by file name.
- **GAP-117** — already built; its rule is now written down.

**Your diagnosis of GAP-114 was better than mine and I want that recorded.** I
found the stray `bottom`; you found that `.pp-anchor.end>.pp-tip` weighs three
classes and beats `.pp-tip.at` outright, so resetting `bottom` alone would have
left the x broken in exactly the anchors where it mattered.

## The two measurements you asked for

**1. The paint cost of `.pp-art`, and the opacity question.**

Measured on the full grid — **81 tiles** carry a thumbnail (83 prints, two have
none) — by scrolling 120 frames and recording every frame interval:

| | median | p95 | frames over 20ms |
|---|---|---|---|
| 1400px, with `.pp-art` | 16.7ms | 17.4ms | **0** of 119 |
| 1400px, without | 16.7ms | 17.3ms | 0 of 119 |
| 360px, with `.pp-art` | 16.7ms | 17.2ms | **0** of 119 |
| 360px, without | 16.7ms | 17.4ms | 0 of 119 |

**No regression, and no trade to make.** Read it honestly, though: both sides
sit on the 60Hz frame budget, so this says "nothing is dropped at 81 tiles on
this machine", not "the filter costs X ms". A first attempt of mine measured
only the rAF floor and said nothing at all; this is the replacement.

**No thumbnail in the library is fully opaque** — all **81** were decoded and
sampled per pixel, and every one has transparency. The outlined-rectangle case
is therefore theoretical here, not a thing your rule has to carry today.

**2. `--pp-modelbtn-max`, and this one goes against your chosen value.**

Across all 83 prints, **501** model and timelapse file names:

| | chars | rendered, mono 12px |
|---|---|---|
| median | 25 | 181px |
| p90 | 57 | 412px |
| longest | **105** | **759px** |

A compact button at 200px leaves about **152px** for the name, so **303 of 501
names — 60% — are middle-truncated, including the median one**. You said you
chose 200px for about 28 mono characters and would raise it if names ran to 40;
the median here is 25 characters but 181px, because these are not 28-character
names, they are long ones. I have built at 200px as instructed and have not
touched the value.

Worth knowing before you choose: the longest button on screen is bounded by the
strip's own sideways scroll, so a larger cap costs scrolling, not layout.

## The day arrived: there are per-model renders now

ModelPicker keeps the square form "for the day a per-model render exists". That
day is today, and it came from the owner, not from me: shown the compact strip
they asked what had happened to the small previews they had asked for. The
honest answer was that there never were any — the squares held the same generic
glyph on every button, and my correction to you removed the square without ever
producing the picture it stood for.

So the app now renders one PNG **per model file**. The renderer could always do
it; it only ran once per print. Of this library's 376 models, **281 are STL and
render today**; the 95 3MF files give a picture only where they carry a plate
image.

The strip therefore takes **the square form whenever any model can show itself**
and stays compact when none can — one form for all of its buttons, as you
specify. `hasPicture` per model is what decides it.

Measured on a print with 11 buttons: **9 pictures, 9 distinct**, all loaded, one
row, overflow 0, axe 0. Cost with an empty cache: **median 60ms per model, 109ms
worst, 12–51 KB each**, then 1ms from cache — so a nine-model print costs about
half a second, once.

**This changes the GAP-116 arithmetic in your favour and against your value.**
Your reason for the compact form was that a square would be a glyph beside 68px
of truncated name. That is no longer the case where a render exists, and the
squares are the better form there. Where it still holds — a 3MF-only print —
the compact strip is exactly right. Both forms now earn their place.

It also leaves `--pp-modelbtn-max` relevant only to the compact form, which is
now the minority case. The 60% truncation figure below still stands for it.

## Measurements for 2.4 and 2.5

| | |
|---|---|
| pairs within a print sharing their first 7 characters | **480 of 1682 (29%)** |
| sharing their last 7 | 161 (10%) |
| sharing **both** ends | **55 (3.3%)** |
| of those 55, tail extension separates | **15** |
| of those 55, **no tail length separates** | **40** |
| prints holding two models with identical names | **2 of 83** (3 pairs) |
| characters in the 112px box at `text-xs` | **15**, as specified |
| median name at `text-xs` | 173px |
| names overflowing 112px | **289 of 376 (77%)** |
| prints reaching the compact form | **1 of 79** |
| 3MF plate images fully opaque | 0 of 20 |
| paint, 29-picture strip, with and without `.pp-art` | median 16.7ms both, **0 long frames** |

**Two corrections of mine this round.** I reported the name size as 15px: `text`
is the ink token and `.pp-modelbtn .nm` is `--text-xs`. And I offered
`Onderdeel_01.stl` vs `_06.stl` as the failing case without checking it against
the published split — those differ inside the tail and never collided.

**The finding that matters:** of the 55 colliding pairs, **40 cannot be separated
by extending the tail at all**, because this library's collision is a number in
the *middle* of a long name (`Babybox lock corner 20 inner width.stl` against
`21` and `22`, at index 20 of 38). Neither end reaches it.

## 2.4 to 2.7 are built

- **2.6's label rule** — verified on the colliding print: 19 buttons at 120px,
  every name `.pp-fname`, tails keeping `.stl`/`.3mf`, **18 distinct labels of
  19**, the odd one being the two files that really do share a name. The bubble
  sits outside `.pp-models` at **opacity 1**, which is the first evidence either
  of us has that your sibling rule does what you said. The *reason* in README
  rule 8 is still unverified: I never tried a bubble inside the mask.
- **2.7's four cells** — measured by setting a whole-print spool and clearing it
  again: "Een spoel hier geldt voor 2 slots zonder eigen spoel." with none set,
  "Geldt nu voor 2 slots zonder eigen spoel." with one, and back. The word *nu*
  appears only in the second.
- **2.7's same-name line** — both rows marked, neither in `warning` ink, no
  badge: "Twee verschillende bestanden met dezelfde naam in deze print." on the
  row at the print root and "… Dit is het bestand in map Nog te printen." on the
  other.

**Your measurement 1, answered.** Every asset carries a folder (`subPath`); 80
of 676 are non-empty and **the deepest is one segment**, so `{map}` never needs
more than one. All **3** same-name pairs differ in it, so `asset.sameName`
fires — except that in one pair a row sits at the print root with no folder at
all, and that row takes `asset.sameNameNoFolder`. So the two keys are not a
pair/no-pair choice but a per-row one, and both are live. Neither is dead copy.

**Your measurement 2** — whether a whole-print spool ever gets set now the
control says what it does — needs time rather than a query. It is still 0 of 83.

**The `play`/`film` conflict** is settled your way and nothing changes in the
app: `film` says what the file is, `play` says what pressing does.

## What I am raising

Nothing. Both gaps I raised are answered and built.

**GAP-118, for the record — "Geldt nu voor 2 slots" while no whole-print spool is set.** The
condition you named is about the slots, not about whether a spool is chosen, so
on a print with no whole-print spool the line claims two slots are covered while
nothing is in force — the same shape as the fault GAP-115 was raised for, on the
control that gap fixed. Measured: trigger "Kies een spoel", total EUR 1,86, line
still claiming two slots. It is built exactly as 2.3 specifies, including in
that case, so the app follows your spec until you rule.

## A conflict between your prose and your preview

ModelPicker's README says the timelapse glyph is **play**; the preview draws
**film** (`rect` plus the sprocket paths). I built `film`, because the preview is
the rendered truth and because it is also what the owner asked for when a play
badge did not read as video. If the prose is the intention, say so and I will
swap it.

## Corrections, mine first

- **I sent you four container widths that I had not measured** (780 / 572 /
  1326 / 1620; the real figures are 796/794, 1132/628, 1432/794, 1732/961). You
  corrected the entry and recorded the retraction rather than overwriting it.
- **I told you there was one PNG per model file.** There is one per *print
  record*, and you had used my claim to strengthen the rejection of the Select.
  2.3's compact strip is the better answer that followed from the correction.
- **My GAP-090 per-type figures were wrong** (16/5/4% were "only this type"
  counts under the wrong heading; the truth is 22/8/8%), and you caught it by
  noticing they did not reconcile.
- **The 58 that was not a percentage:** 58 of 83 prints carry nothing, which is
  70%.

## Still untested here

The **240px sheet floor** remains specified and unexercised: the smallest
viewport this machine produces is 760px tall and the floor first bites near
560px. It has never fired. Treat it as the backstop you called it, not as
something I have confirmed.

Nothing has been seen on a real phone. Every "phone" figure in this file is a
360px viewport in a desktop browser.

## What I would like next

1. A ruling on **GAP-118**, which is one sentence either way.
2. Whether `--pp-modelbtn-max` moves, now that the distribution is measured.
3. Keep asking for numbers. Every round this session a measurement has changed
   an answer — and this round it reversed a value you had chosen.
