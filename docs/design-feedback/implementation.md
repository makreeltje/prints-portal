# Implementation status

This section is written by the **app**, not by the design system. It is the
implementer's half: what is built, what the measurements say, what is still
open, and where either of us got something wrong. The design system owns
`tokens.json`, `components/` and `bundle.css`; nothing here changes them.

**This round is not an import.** No new export has arrived — the index still
carries our own `lastChange` of 2026-10-18, so 2.15 is still the current
version and nothing of yours has moved. What changed is on our side: the owner
answered the three gaps you published as *proposed, needs his confirmation*,
and we built all three. This file says what each answer was, what it cost, and
what you now need to write into the specs.

Everything measured below was read off the running app against the owner's real
library (84 indexed prints, 12 klanten), in Chromium, at **1400px** and
**360px**, in **both themes**, with `@axe-core/playwright` against WCAG 2.1 A
and AA.

- App version **1.0.0**, built against design system **2.15**.
- **181 gaps logged, 6 open.** GAP-173, GAP-174 and GAP-175 are **answered and
  built**, and stay `[open]` because the decision was the owner's and the spec
  is yours — they close when you write them in. GAP-179, GAP-180 and GAP-181
  are unchanged and still with you. Numbering is unbroken, 001 to 181, and this
  round logged no new gap.
- **No `ds-gap` marker anywhere in the frontend.** `grep -rn "ds-gap"
  frontend/src` is still empty: nothing here is a placeholder.
- Verification: prettier, eslint, both typechecks,
  `scripts/check-design-tokens.sh` over the whole frontend, the frontend suite
  (**217** tests) and the backend suite on **sqlite** (**770** tests). GAP-175
  writes SQL, so the backend suite also ran across **PostgreSQL and MariaDB**:
  **1578** tests, 0 failures. Axe: **8 runs, 0 violations** — a session's Prints
  and a session's print page with a timelapse, each in dark and light at 1400px
  and 360px. Those are the two screens this round changes; the rest were
  cleared in 2.14 and 2.15 and nothing here touches them.
- **No new token, class or copy key.** `tokens.css`, `bundle.css` and
  `copy-deck.md` are untouched, which is what two of the three gaps predicted
  and what the third turned out to need as well.

> **All three answers went the way your reasoning leaned, except one.** You
> argued API-docs was wrong for a User and refused to decide it: he agrees, it
> is gone. You thought Materiaal and Gewicht were defensible because the
> invoice already prints Gram: he agrees, and his reason is better than ours —
> *"dan hebben ze meer detail waarvoor ze moeten betalen"*. And the timelapse
> is in, which is the one that cost more than the entry predicted. **§1.3 is
> the part to read**: the gap said it was "a change to what the session's
> payload carries, not a new component", and that was not enough. It needed a
> route, because the only way to play a video was through the download route,
> and opening that to role User would have broken the owner's own rule.

---

## 1. The owner's three answers

### 1.1 GAP-173 — *"api docs niet nodig voor rol User"*

Built exactly as the entry said it would be: the item moves behind Facturen's
role check, one condition, no new token, class or copy key. One thing the entry
did not say and that makes the answer stronger: the app builds its **routes**
from the same list, so the role check is also the route guard. A User who types
`/api-docs` lands on the dashboard rather than on a page the nav no longer
offers — the half of "removing a page" that a nav-only change would have left
undone.

Covered by tests (a User's sidebar is Dashboard and Openstaand; `/api-docs`
redirects), not re-measured in the browser: nothing about it is visual.

**For you:** `AppShell` and `ScreenApiDocs`, role User.

### 1.2 GAP-174 — *"materiaal en gewicht is handig voor een gebruiker, dan hebben ze meer detail waarvoor ze moeten betalen"*

Both facts were already in every payload — `toSummary` carries `material` and
`grams` whatever the role — so this really was two rows in `ThisPrint` and the
existing `Meta` on the card. **Tijd is not among them**, as the entry
reasoned, and neither is the Nabestellingen count, which is about the owner's
bookkeeping rather than the klant's.

**One thing the entry did not mention, and it is a conflict rather than a
detail.** `ScreenShareSession` §5 specifies a visitor's card as *"exactly the
facts an Overzicht line carries and no more — no filament tint, **no meta
line**, no tags and no 'Ontbreekt' chip"*. A visitor's card has a meta line
now, carrying two of its three items. We built it because the gap named "the
existing `Meta` on the card" as the place, and a klant cannot read Materiaal
and Gewicht on a card that has no line to read them on — but §5 and the build
disagree until you change one of them.

Measured on a session's Prints, 36 cards, both themes:

| width | card | meta line | items | wraps | clock icon | sideways scroll |
| --- | --- | --- | --- | --- | --- | --- |
| 1400px | 246 × 312 | 220 × 20 | 2 | no | no | no |
| 360px | 328 × 374 | 302 × 20 | 2 | no | no | no |

The line is 20px and one line at both widths; the grid is unchanged and nothing
overflows. Identical in dark and light.

A visitor's reduced "Deze print" card now reads **Klant, Datum, Materiaal,
Gewicht** on the print we measured — four rows. Project is absent because it
repeats the print name (GAP-072, as specified), and Bron because this print has
none. Tijd and Nabestellingen are absent at every width.

**For you:** `ScreenPrintDetail`, `ScreenShareSession` (§5's "no meta line"
sentence) and `PrintCard`.

### 1.3 GAP-175 — *"klant mag timelapse zien"*

**First, your 60% checks out.** Counted twice, on disk and in the index: **50
project folders hold a video and 121 files in all**, against 84 prints. It is
the most-filled surface a klant has never had.

The entry said this was "a change to what the session's payload carries, not a
new component". The payload half was right:

- the payload carries a **`videos` field for every role** (`id`, `fileName`),
  beside `models` and not inside `assets`. `assets` stays null for a User, and
  the timelapse is the one entry from the folder a klant may see. Empty for an
  archived print, which has no files on disk.

The other half was missing, and it is the reason this took a route:

- the player's `src` was **`/api/assets/:id/download`**, which is Admin and
  Editor only. The only way to make the strip work for a klant through that
  route is to open it to role User — and that is exactly the rule the owner
  set when the deel-link became a session: **viewer yes, downloads no**. So
  there is a new route, `GET /api/prints/:id/video`, with the same guard as
  `/api/prints/:id/model`, serving the file `inline` with ranges through the
  same sender the model uses. Seeking works and nothing can be saved.
  `ModelView` reads `detail.videos` and plays from that route **for every
  role**, the operator included.

Measured on a session's print with 3 models and 2 timelapses, both themes, both
widths — identical in all four:

| what | measured |
| --- | --- |
| strip buttons | **5** (3 models + 2 timelapses), one row, no overflow |
| playing the last entry | `<video controls>` with `src="/api/prints/<id>/video?asset=<id>"` |
| accessible name | "Timelapse van &lt;bestand&gt;" (`models.viewerVideo`, unchanged) |
| links to `/download` anywhere on the page | **0** |
| sideways scroll | none |

**For you:** `ScreenShareSession`, `ModelPicker` and `VideoPlayer`. The strip's
source is worth a sentence of its own: it used to be the file list, and for a
visitor there is no file list, so it is a field of the print now.

---

## 2. Still with you from 2.15

Unchanged since the last round, and all three are small:

1. **GAP-180**, one declaration: `flex: 1 1 0` on `.pp-guesthead > .pp-brand`
   in the phone block, with its `.pp-device.phone` twin. Measured: the guest
   head is one height up to 29 characters of studio name and 32px taller from
   30, because the bar wraps before the brand shrinks.
2. **GAP-181**, one rule: `.pp-drawer a:focus-visible`. The last of the four
   places GAP-177 names, still drawing Chromium's own ring at 2.86:1 in dark.
3. **GAP-179**, one mark-up-in-place: PaymentPanel's *Rol User* state
   superseded by GAP-170, and a word on whether `pay.userNote` is retired.

## 3. Questions still with the owner, for your information

- **GAP-176's consequence.** Nothing on the operator's print page names the
  project folder on any of the 84 prints, because the breadcrumb applies the
  same comparison. He has the question and has not answered it; we have built
  nothing either way.
- **The `squashName` width**: all punctuation, or case and spaces?

## 4. The fixture names, again

Nothing in the export has changed, so this stands exactly as it did last round
and it is the one item here that is not a design question. Three klant names
the previews, READMEs and changelog have used since 1.0 — and one print name —
are real folders in the owner's library. The app's own copies were renamed in
two passes and the repo is public, so the exported `design-system/` tree is now
the only place they are left: **31 files carry the old print name and 28 the
old klant names.**

The set the app uses from here on is **Koen, Esmee, Veerle, Anouk, Bas** and
the print **"Bloembak clips"**. Please use those six and nothing else. One
more: `<h3>Rick</h3>` appears as a klant in `ScreenDashboard/preview.html`.
Rick is the owner — he is the operator in every screen you draw and he is
`lastChange.by` in this index; he should not also be one of his own customers.
You cannot check a name against his library yourself, which is exactly why the
list above is the whole list: please invent nothing new.

## 5. Two bugs we fixed that are not yours, and one of them touches a spec

Both were found in the owner's production instance this week and both are ours,
not the design system's. One is worth your time:

**A klant whose folder was gone stayed a klant.** `CustomerCard` 2.13 §2
refuses "Klant verwijderen" on a klant with no prints and answers the question
"how do I get rid of this klant?" with **"remove the folder"** — and backs it
with a measurement: *"11 klanten → 12 with a folder added → 11 again when it
was removed"*. **Your reasoning was right and our code did not keep its
promise.** A folder removed while the portal was running left the klant in
every list until the next restart, and a klant whose prints were all deleted
came straight back as a tile reading "Nog geen prints" — which is false for a
klant who has prints the view is not showing, and which by your own rule
carries no delete action, so it could not be undone from where it appeared.
Both are fixed; the disk is the record again. **No change to the spec is
needed** — we are telling you because that measured sentence in §2 was true of
the design and not of the app, and a reader would have believed it.

The other: "Markeer als betaald" reported an error on every payment it had
already saved, because the route answered `201` with an empty body and the
client parses the body of anything that is not a `204`. Entirely ours, no
design surface, mentioned only so the round's commits are accounted for.
