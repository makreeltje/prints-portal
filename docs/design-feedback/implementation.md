# Implementation status

This section is written by the **app**, not by the design system. It is the
implementer's half: what is built, what the measurements say, what is still
open, and where either of us got something wrong. The design system owns
`tokens.json`, `components/` and `bundle.css`; nothing here changes them.

Everything below was measured in the running app against the owner's real
library (84 prints, 11 klanten, about two years of history), in Chromium, at a
**360px** and a **1400px** viewport, in **both themes**, with
`@axe-core/playwright` against WCAG 2.1 A and AA. Where a number appears, it
was read off the running page or the rendered preview; where it was not, this
file says so.

- App version **1.0.0**, built against design system **2.11**.
- **156 gaps logged, 10 open.** Numbering is unbroken.
- Every round from 2.0 to 2.11 is imported; the export checker confirms every
  class and copy key each changelog claims.
- Two `ds-gap` markers remain in the frontend, both for gaps that are still
  open and both approved by the owner: GAP-146 and GAP-147.

> **2.11 arrived in two pieces, by the owner's decision.** This round built the
> copy changes and the phone fix. **GAP-152 — the bron and the notitie,
> PrintSource and PrintNote — is not built at all.** Its spec, its four classes
> and its thirteen copy keys are imported and checked; no field, no component
> and no `.url` reading exists yet. GAP-152 therefore stays `[open]` in the gap
> log. A heading there flips when the code exists, not when the spec does.

---

## 2.11, part one: what is built

### GAP-148 and GAP-149 — the group summary's age badge · **built, both screens**

`outstanding.oldestDays` is imported and rendered in the `.age` slot of every
group summary on **Openstaand** and on **Wachtrij**. The tile label keeps
`outstanding.oldest`. One key for both screens, as 2.11 decided against
`queue.oldest`.

Measured at 1400px: an Openstaand group that read **"752 dagen open"** now
reads **"oudste 752 dagen"**. On Wachtrij the slot was empty before this round
and now carries **"alles van vandaag"** for a group whose oldest request
arrived today and **"oudste 1 dag"** for one day old. The zero arm reads well
in the app; it does not look like an error, which was the thing you were unsure
about.

One implementation note you could not know: **Wachtrij's rows are sorted
fileless-first, not by age** (2.10's own rule), so the group's oldest is the
maximum over the rows rather than the first of them.

### GAP-150 — "0 dagen geleden gevraagd" · **built**

`queue.waiting` and `status.daysOpen` are re-imported with their new arms, byte
for byte as the deck has them. Measured: a request entered today reads
**"vandaag gevraagd"**, one entered yesterday **"1 dag geleden gevraagd"**, a
line open since this morning **"sinds vandaag open"**, and an Openstaand line
one day old **"1 dag open"** where it used to read "1 dagen open".

### GAP-151 — the 90px name · **built, and it is the import**

`.pp-line`'s three bands came with `bundle.css`, so there was nothing to write.
Re-measured at the same 360px viewport where the 90px was found:

| | 2.10 | 2.11 |
|---|---|---|
| Wachtrij, name block | **90px** | **294px** |
| Wachtrij, age badge | 192px, same band as the name | 144–176px, own band |
| Openstaand, name block | 155px | **294px** |
| page `scrollWidth` vs `clientWidth` | 360 / 360 | 360 / 360 |

Both screens fold identically, the actions keep the third band, and nothing
scrolls sideways. **Your 62px-of-spare calculation holds**: with the figure in
the second band at 43px and a 12px gap, a 196px badge still fits.

### Everything else

`api.loadErrorBody` needed no change — see *Corrections*. Axe is **clean in all
eight combinations** (two screens × two widths × two themes), no violation at
any level.

---

## The measurements 2.11 asked for

**1. Do the new preview twins make any existing phone frame look wrong?**

No. The seven affected previews were rendered from the export with `tokens.css`
and `bundle.css` and inspected programmatically: **no element collapsed to zero
and no document overflowed its viewport**, in either theme. The twinned
selectors that actually appear in a published phone frame are `.pp-line`
(ScreenQueue, ScreenOutstanding, PrintSource, PrintNote), `.pp-order > summary`
(OrderSection, ScreenPrintDetail), `.pp-printer .fields` (ScreenSettings) and
`.pp-tagrow` (ScreenTags). **`.pp-cols-2`, `.pp-pick` and `.pp-slot` are in no
phone frame at all**, exactly as you said. The twins also produce the same
geometry as the app's media query: `.pp-line` in ScreenQueue's phone frame
measures `minmax(0,1fr) auto` with the badge at column 1 / row 2, which is what
the app draws at a 360px viewport.

**The twins are preview-only and cannot reach the app.** `pp-device` does not
occur anywhere in `frontend/src` — grepped for the identifier, not for a
pattern around it.

**But one frame does now look wrong, and it is a real bug, not a wrong twin.**
See GAP-155 below: the `.age` badges inside ScreenQueue's phone frames overflow
their boxes (115px box, 138px content for "oudste 118 dagen"; 140px for "alles
van vandaag"). The same thing happens in the app. **This is the twin doing its
job** — the frame showed the desktop grid until this round, so nobody could see
it.

**2. `api.loadErrorBody` and `invoice.omitted`: which string does the app show?**

**Both are correct, and the duplicate-row fault never reached this app.**

- `api.loadErrorBody` holds **"De documentatie kon niet worden opgehaald.
  Probeer het opnieuw."** — your 1.7 string, with *Swagger* removed. It is
  rendered in one place, `ApiDocsPage.tsx:131`.
- `invoice.omitted` holds **2.9's plural forms**, "{count, plural, one {# print
  zonder verkoopprijs is weggelaten} other {…}}: {names}.". "1 prints … zijn
  weggelaten" does not render.

Both were compared **byte for byte** against the deck's row, not read by eye.
The reason is that the import is done by hand, reading the newest "Added in X"
section first — so a stale duplicate above a newer row was skipped rather than
taken. The premise "your importer takes the first occurrence" is not true of
this app. The de-duplication is still right, because it stops the *next*
importer getting it wrong; it just was not shipping a wrong string here.

**3. Which day-count keys are imported, and which call site renders each?**

This settles GAP-154 in one pass. Each row was found by grepping for the key
itself across the whole frontend.

| key | in `nl.ts` | call sites | can it render "1 dagen"? |
|---|---|---|---|
| `share.expiresIn` | **no** | **none** | dead copy — never imported |
| `overview.expiryNotice` | yes | `SharePage.tsx:167` | **no** — reached only from 2 days up |
| `share.expiresToday` | yes | `SharePage.tsx:164` | n/a |
| `share.expiresTomorrow` | yes | `SharePage.tsx:166` | n/a |
| `date.daysOne` | yes | `ShareLinksPage.tsx:162` | n/a |
| `date.daysOther` | yes | `ShareLinksPage.tsx:162`, `:428` | **no** — the branch handles 1; the dropdown offers 7, 30, 90 only |
| `outstanding.groupMeta` | yes | `OutstandingPage.tsx:177` | **yes** |

So: **`share.expiresIn` is dead** and the row can go. `overview.expiryNotice`
and the `date.days*` pair need no plural — the 1.6 pair you suspected might own
those cases does own them, in code, in a three-way branch.

**`outstanding.groupMeta` is the opposite of your guess: it is alive and it is
the one with the bug.** It is not dead copy; 1.9 did not replace it. It renders
as the `.ttl` block's second line, *under* the klant name and *beside* the
`.age` badge, on every group. Read off the page: a klant with one line one day
old shows **"1 prints · oudste 1 dagen open"** — two faults in six words.

It now also says the age **twice**: that meta line and the badge 20px away say
nearly the same thing in different words ("oudste 1 dagen open" / "oudste 1
dag"), which is new this round because the badge's wording changed toward it.
Our proposal is to drop the age clause from the meta line and leave it the
count, since the badge beside it already carries the age — but it is yours to
decide.

**A fifth string with the same fault, not in your table:**
`outstanding.groupLabel` — "{customer}, {count} prints, oudste {days} dagen,
{amount}" — is the `aria-label` of every Openstaand group summary
(`OutstandingPage.tsx:167`). No plural, so a screen reader hears "1 prints,
oudste 1 dagen" on the same component whose visible badge this round fixed.

**4. How many of the 15 `.url` files parse, and does any point at something
that is not a model page?**

Walked the owner's real tree. **16 `.url` files in 15 klant/project folders** —
your 15 folders is right; one folder holds two.

- **16 of 16 parse** to an `http(s)` URL from a `URL=` line. None is empty,
  unreadable or a non-http scheme. The chip "uit de map" is not making a
  promise the folder breaks.
- Hosts: **printables.com 9, makerworld.com 3, thingiverse.com 3**, and one
  `files.printables.com`.
- **15 of 16 point at a model page.** The sixteenth points at
  `files.printables.com/media/prints/…/other_files/…` — a **direct file
  download**, not a page. So the answer to your question is yes, one of them,
  and PrintSource will show a link that downloads rather than opens a page.
- Six of the model-page URLs deep-link to the page's *Files* tab (`/files`),
  and two carry a fragment or a query (`#profileId-…`, `?from=search`). Those
  are still model pages; worth knowing if you intend to show a cleaned host
  rather than the whole URL.

This is a measurement about part two, which is not built. It is here because
you asked for it and the answer did not need the feature.

**5. Still standing from 2.10.**

- **Whether design jobs dominate the queue (GAP-143's overturning
  measurement):** not answerable yet. The queue holds too few rows at this
  moment to split meaningfully, and the distinction lives in the owner's head
  until GAP-152 is built — which is part of why he asked for it. **Ask again
  once PrintSource ships**; a bron will make the split observable rather than
  reported.
- **The age thresholds on a queue row (GAP-145):** still unmeasured, and still
  carrying 30/90 borrowed from money. Unchanged this round.

---

## Corrections

**Ours, found by your checker.** None this round.

**Ours, found by our own verification.** The gap log's GAP-149 entry proposed a
`queue.oldest` key. You refused it and you were right: the slot and the words
are identical on both screens, so it would have been GAP-148 again under a new
name. Nothing was built from the proposal.

**Yours — three claims in 2.11 that do not hold here.**

1. **"Your importer takes the first occurrence."** Not true of this app; see
   measurement 2. `api.loadErrorBody` and `invoice.omitted` are both the newer
   string. No live bug, and nothing was changed on their account.
2. **"`outstanding.groupMeta` looks dead since 1.9."** It is alive, rendered in
   one place, and carries the very fault the round was about. See measurement
   3.
3. **"a `=0` arm your formatter already supports, since 2.9's keys use ICU
   plurals."** It did not. 2.9's keys use `one`/`other`, and this app's
   formatter matched a form name with `\w+` — which `=0` is not. An exact arm
   would have been parsed away silently and the `other` arm rendered, so
   `queue.waiting` would still have said "0 dagen geleden gevraagd" after the
   import: the exact string GAP-150 was raised about, now looking fixed in the
   deck. The formatter was extended to read `=N` and prefer it over
   `one`/`other`, with a test per arm of all three strings. **This is the kind
   of claim worth not making about our half** — the deck is yours, the renderer
   is ours, and only we can say what it supports.

---

## Deviations we chose, and what they cost

- **The badge ships although GAP-155 is open.** 2.11 resolved GAP-148 and
  GAP-149, and the badge is correct at every width above 480px; withholding it
  would leave two settled gaps unimplemented and re-create GAP-149. The cost is
  that at 360px Wachtrij's summary overprints two strings by 10px until GAP-155
  is settled. It can be held back on a word from the owner.
- **`.pp-line > .pp-badge` does not match on Openstaand's lines.** That
  screen's badge shares a wrapper (`span.pp-row.pp-gap-1`) with the *Gearchiveerd*
  StatusBadge, which has been true since 1.9. Measured at 360px: the wrapper
  lands in column 1, row 2 anyway — but by grid auto-placement, not by your
  selector. It is correct today and fragile tomorrow. If you want the selector
  to be the guarantee, OutstandingGroup should name the wrapper.
- **`outstanding.groupLabel` was left unchanged**, although it has the plural
  fault described above. It is not in 2.11's table and we do not change copy
  you have not changed.
- **GAP-152 built not at all** rather than partly. A half-built bron would have
  put a link on a row without the print-detail and share-page halves that make
  it coherent.

---

## The ten open gaps, and what is actually built for each

| gap | what is built | waiting on |
|---|---|---|
| **GAP-129** tags as two stages at once | nothing; tags unchanged | a measurement over the real library |
| **GAP-144** "geprint, nog niet geleverd" | nothing, deliberately — no state exists | the owner's flow decision |
| **GAP-145** queue age thresholds | the three steps, with **30/90 borrowed from money** and marked unmeasured in the code | a measurement |
| **GAP-146** menu under the Factuur button | **placeholder, owner-approved:** `.pp-pop.at` portalled into the nearest open `<dialog>`, marked `ds-gap`. 11 of 11 menus clear over a 575-point grid | Popover's general rule |
| **GAP-147** backdrop click closes a dialog | **placeholder, owner-approved:** a backdrop click closes a dialog with no `onSubmit` that is not an `alert`, marked `ds-gap` | the per-dialog-kind rule |
| **GAP-152** bron and notitie | **nothing.** Spec, classes and copy imported and checked | part two of this round |
| **GAP-153** phone rules without a twin | n/a — preview-only | answered above; four rules still untwinned by your choice |
| **GAP-154** day-count strings | nothing changed | answered above; `outstanding.groupMeta` and `outstanding.groupLabel` need you |
| **GAP-155** summary badge overlaps at 360px | the badge, which is what overlaps | a rule for `.pp-ogrp > summary`'s second band |
| **GAP-156** row actions at 360px | nothing; both are `bundle.css` | `.pp-btn-sm` against the 44px floor |

### GAP-155, in numbers, because it is this round's own doing

`.pp-ogrp > summary`'s phone rule (1.9) pairs `.age` with `.amt`. That was
designed for Openstaand, where `.amt` is money. **ScreenQueue puts a sentence
there** — "waarvan {n} zonder bestanden", which is 2.10's own design and the
README says so. The slot was empty until this round, so the two never met.

At 360px, on the group that carries both:

- `.amt` takes **181px** of the `auto` column; the `1fr` column is left
  **109px**.
- the badge needs **130px** (`clientWidth` 107 against `scrollWidth` 130).
- its painted text runs to **x=160**; the `.amt` text starts at **x=150** — the
  two strings **overprint by 10px**.
- because `.amt` sizes that column for both rows, the group's `h3` is squeezed
  to 109px too, so "Nog niet besloten" wraps to two lines.

**Openstaand is unaffected**, measured over all eleven groups: the badge's text
ends at x≈161 and the money starts at x≈253 or later. Every one is clear.

**A second thing in the same rule, which is older.** `.pp-ogrp > summary .age`
has no `justify-self`, so the badge box fills its column: on Openstaand at
360px, "oudste 752 dagen" paints 124px of text inside a **223px** tinted pill.
Nothing overlaps, so it has never been reported — but 2.11's own new rule,
`.pp-line > .pp-badge`, *does* carry `justify-self: start`. The two rules
disagree about the same kind of thing.

---

## What would help most next

1. **GAP-155**, because it is the only thing this round made worse, and because
   the fix is probably the one you just wrote one level down: three bands for
   `.pp-ogrp > summary` on the phone, so a group folds like its lines.
2. **GAP-152's go-ahead for part two** — the spec is complete enough to build
   from and the `.url` measurement above is the last unknown in it.
3. **`outstanding.groupMeta`**, which is a live wording bug on the busiest
   screen in the app and now says the age twice. One key, one decision.
4. **GAP-156's 44px question**, because `.pp-btn-sm` is in nearly every row of
   the app and `do-dont` has called 44px a hard floor since 1.2. Whichever way
   it goes, it should be written down once rather than discovered per screen.
5. **The two measurements we still owe you** — whether design jobs dominate the
   queue, and the age thresholds. Both need the owner, and the first probably
   needs part two shipped first.
