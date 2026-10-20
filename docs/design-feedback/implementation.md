# Implementation status

This section is written by the **app**, not by the design system. It is the
implementer's half: what is built, what the measurements say, what is still
open, and where either of us got something wrong. The design system owns
`tokens.json`, `components/` and `bundle.css`; nothing here changes them.

**This round is an import and a pile of answers.** 2.16 and 2.17 are both in
the repo, everything they resolved is built or verified, and the six
`To measure (owner)` requests still standing in the specs are answered below —
some of them asked since 1.9. One of the answers is not the one you wanted.

Everything was read off the running app against the owner's real library (84
indexed prints, 12 klanten), in Chromium, in **both themes**, with
`@axe-core/playwright` against WCAG 2.1 A and AA.

- App version **1.0.0**, built against design system **2.17**.
- **182 gaps logged, 0 open.** Every one of GAP-173, GAP-174, GAP-175,
  GAP-179, GAP-180, GAP-181 and GAP-182 closed with 2.16. This is the first
  round since the log began with nothing open on either side.
- **No `ds-gap` marker anywhere in the frontend**, and none was needed.
- Verification: prettier, eslint, both typechecks,
  `scripts/check-design-tokens.sh`, the frontend suite (**218** tests) and the
  backend suite on **sqlite** (**770** tests). No SQL changed this round, so
  the three-engine run was CI's. Axe: **4 runs, 0 violations** on the
  operator's print page, the screen this round changes.
- **One new class and two new keys arrived with the export and are now used:**
  `.pp-path`, `print.folder`, `print.folder.none`. No token moved —
  `tokens.json` at 2.17 is byte-identical to 2.15 apart from `version`.

---

## 1. What landed

**GAP-182 is built.** `Map` is the last row of the operator's "Deze print":
one mono path, `muted` separator, drawn on every print that has a folder
including the 84 of 84 whose project squashes equal to the print name. No
project folder gives the klant folder alone; no folder at all gives
`print.folder.none` in `muted` rather than in `.pp-path`, because that is a
sentence. Archived and deleted prints keep it. It replaces the conditional
`Project` row **on the operator's card only**; the reduced card and the
breadcrumb are untouched. Measured on his library, both themes: the row is
last, `ui-monospace`, value `text-strong` and separator `muted`; the card is
552px at 1400px and 328px at 360px with **no sideways scroll**, and a long
path wraps inside its own column exactly as 2.16 predicted.

**GAP-180 and GAP-181 came with `bundle.css` and were verified, not built.** A
phone-drawer link now draws `2px solid var(--focus-ring)` at offset 2px where
it drew Chromium's own `1px auto rgb(0, 95, 204)` at **2.86:1 in dark**. The
guest brand computes `flex: 1 1 0px` with `text-overflow: ellipsis`, the brand
box is **268px** and the head **127px** — your number. Said plainly: that is at
a 16-character studio name. **We did not test 80 characters**, because that
means writing to the owner's settings, so the top of your measured range is
still yours and not ours.

**One obligation in 2.16 we had missed, now built.** VideoPlayer 2.16 says role
User and a visitor get `video.error.title` and `video.unsupported.title`
**without** their `.body` lines, both of which read "Download het bestand…".
They did not; both lines rendered for every role. A klant was being told to do
the one thing that role cannot. Fixed, with a test, and an operator still gets
both.

**And one thing of ours that your table caught.** `ScreenPrintDetail`'s row
table says the reduced card is Klant, Project, Datum, Materiaal, Gewicht,
**Bron last**. We had drawn Bron straight after Datum ever since GAP-174 added
the two new rows — we put them after Bron instead of before it. The 2.16 export
states the order outright, which is how we found it. Corrected; two tests that
asserted our order rather than yours were rewritten.

---

## 2. The six standing measurements, answered

### 2.1 ModelPicker — models per print, and what the renderer makes

Across all 84 prints, **379 model files**:

| | |
| --- | --- |
| largest number of models on one print | **29** |
| median | **3** |
| prints with no model at all | **2** |
| prints with both models and a timelapse | **48** of 84 |

The distribution is heavily front-loaded — 50 of 84 prints have three models
or fewer, and 2 models is the single commonest case at 31 prints — but the
tail is long and thin: one print each at 13, 16, 20, 25 and 29. **So the strip
has to survive 29 and be unremarkable at 2.** On your question of whether to
wrap above some count: a strip that wrapped above 7 would wrap for 7 prints
out of 84.

**Your renderer question has a clean answer: one PNG per model file.** 379
models, **379 pictures**, and there is no print where some models have one and
others do not — every model on every print has its own. The per-print branch of
the spec is never taken here.

### 2.2 ScreenPrintDetail — the price field, and the dead space

This is the answer you will not like, and it has been open since 1.9.

| | 1360 × 900 | 390 × 844 |
| --- | --- | --- |
| top of the price field, from the top of the page | **1088px** | **1555px** |
| field height | 36px | 44px |
| **visible without scrolling** | **no** | **no** |
| how far below the fold | 188px | 711px |

Measured on a print that has a model and an order, so the viewer is drawn and
the field exists. **The 1.9 aim — "visible without scrolling, with a model on
desktop and without a model on a phone" — is not met at either size**, and 2.0
moved the field again without the measurement ever being taken. On the phone it
is not close: the field is nearly two screens down.

**The dead space, same screen, 1360px:** viewer **560 × 420**, the right-hand
card **377** high. The card is **43px shorter** than the viewer — about 10%.
That is not the gaping hole 1.9 had, so by your own test ("if it is much
shorter … I would move the newest order's Betaling into it") the answer is
*no, leave it*. But those two numbers sit badly together: the row beside the
viewer has 43px to spare while the thing the owner actually reaches for is
188px below the fold. **We are not proposing the move** — that is your call and
Betaling is a whole component — but the price field is worth a round of its
own.

### 2.3 ScreenTags — how many tags

**5.** Above your threshold of 4, so the three-column grid stands and the
560px cap is not needed. For context the owner has said he does not use tags;
five is what a library of 84 prints accumulated anyway.

### 2.4 ScreenSharePage — the IBAN and the "Betalen" block

**The IBAN is empty in Bedrijfsgegevens**, so by your own condition this is
**not an app bug** and there is no gap to log. Verified end to end rather than
inferred: a live share link whose klant has an open amount shows "Openstaand"
and a total, and the page carries **no "Betalen" block and no IBAN anywhere**.
The block is absent because the condition says it should be. If he ever fills
the field in, the question becomes live again and we will re-measure.

### 2.5 ScreenAccess — is the panel still clipped

**No, it is not.** At 1360px, with a header menu open:

| | |
| --- | --- |
| panel left edge | 334px |
| panel width | **140px** — the full panel |
| panel right edge | 474px |
| right edge of the sticky column | 380px |
| horizontal page scroll | **0** |

The panel overhangs the sticky column by 94px and nothing is cut off, and the
items read "Alles selecteren" as you expected. **Your fix works; the portal you
held in reserve is not needed.**

### 2.6 VideoPlayer — video-only prints, and `.mkv`

**2 prints of 84 have a video and no model**, which is the thumbnail rule's
whole population, and it matches the "two of 83" you recorded in 2.0 — the
library grew by one print and neither of the two changed. The `.mkv` half you
already closed in 2.17 from our count (**2 of 121**, 119 `.mp4`); this is the
other half of the same entry and it can be struck with it.

---

## 3. The names, and the rule that actually worked

**The repo is clean.** A scan of all **481** tracked files against **93** real
names taken from the owner's library — 12 klant folders and 84 project folders,
read off disk rather than from any list — returns **zero** customer and project
names. That is the first time it has been true.

It took three sweeps to get here and the first two both worked from a list of
names someone had written down. Both missed things, because a list cannot
contain what nobody knew was there: 2.16 swept four names and left three, one
of which was not in a preview at all but in **prose**, inside your argument
about the file-name truncation regex. The method that worked is the obvious one
in hindsight — compare against the library itself.

**Two leaks were ours, not yours**, and they are fixed in the same pass: a real
project folder name hard-coded as a G-code fixture in the backend tests, in an
exact and an underscored form, and the 15-of-16 near-miss in two frontend
suites where it was spelled with different capitalisation. Neither had anything
to do with the design system and no import would ever have found them.

What remains in the repo is the owner's own first name, in 20 files, in none of
them as a klant: the operator in your previews, his login field, "afgeschreven
door". That is the repo's git author and it is already public.

**The working rule from here, which you wrote and we agree with:** a fixture
name is either already in the export or checked against the library before it
ships. You cannot run that check and we can, in seconds. Name the exact strings
and we will run them. Your five candidates for next time —
`Plantenhanger`, `Deurstopper`, `Muurbeugel`, `Pennenbak`, `Lampvoet` — are all
**clear**, as are `Vitrinekast inzet`, `Kabelgoot bureau` and `Algemeen`, which
2.17 already uses.

**One you flagged and we checked: `Cup holder v2` stays.** It shares a
10-character run with a real folder, but that is 59% of that folder's name
against the 94% of the one you replaced, and it is a generic English object
name any print library would hold. The owner's call was to leave it.

---

## 4. What is open

**Nothing is blocked, on either side.** No gap is open, nothing is waiting on a
decision, and there is no placeholder in the frontend.

Two things we are carrying, neither urgent and neither yours:

1. **`VideoPlayer.tsx` still plays through the download route** in the
   operator's file-list dialog. 2.16 says that form is unchanged, and it works
   — but there are now two ways to play the same file through two routes, and
   the new one can do everything the old one can. That is cleanup, not a bug,
   and we will do it when it stops being the only thing in a branch.
2. **`pay.userNote` is retired and unrendered**, as 2.16 asks. The key is still
   in `nl.ts`; nothing reads it and no check objects.

And one for you, carried from §2.2: **the price field**. Everything else in
this round is an answer or a closed gap; that one is a measurement that failed
its own aim twice, and it is the field the owner reaches for most.
