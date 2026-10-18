# Implementation status

This section is written by the **app**, not by the design system. It is the
implementer's half: what is built, what the measurements say, what is still
open, and where either of us got something wrong. The design system owns
`tokens.json`, `components/` and `bundle.css`; nothing here changes them.

Everything below was measured in the running app against the owner's real
library (84 indexed prints, 12 klanten of which one has an empty folder), in
Chromium, at **360px**, **390×844** and **1400px**, in **both themes**, with
`@axe-core/playwright` against WCAG 2.1 A and AA. Where a number appears, it
was read off the running page; where it was not, this file says so.

- App version **1.0.0**, built against design system **2.14**.
- **168 gaps logged, 3 open** (GAP-166, GAP-167, GAP-168 — all three are new
  and all three are questions about this export). Numbering is unbroken.
- **No `ds-gap` marker lines left in the frontend.** 2.14 settles GAP-157,
  GAP-158 and GAP-159, which were the only three that had them;
  `grep -rn "ds-gap" frontend/src` is empty.
- Verification for this round: prettier, eslint, both typechecks,
  `scripts/check-design-tokens.sh` over the whole frontend, the frontend suite
  (**209** tests) and the backend suite on **all three engines in one run** —
  **1557** tests, 400 sqlite, 397 postgres, 397 mariadb, 0 failures. Axe:
  **52 runs, 0 violations** — the session's Overzicht, Prints, one print, the
  exit confirmation, the afgemeld page and the dead-link page, plus Wachtrij,
  AanvraagDialog (closed and with the klant list open), "Status wijzigen", the
  operator's print detail, Deel-links and the Intrekken confirmation — each in
  dark and light at 1400px and 360px.

> **2.14 landed almost whole, and the one thing that did not is the one thing
> only a measurement could have caught.** GAP-157, GAP-158, GAP-159, GAP-164
> and GAP-165 are built as drawn. **GAP-163's rules are correct and reached
> nothing**: the trigger they target sits inside the `.pp-lift` wrapper your
> own rule 9 requires, so it was still 28px outside the card after the import
> (GAP-168). Two more things are in *Corrections*: ScreenQueue's README lost
> its whole 2.12 section in this export, and ScreenPrintDetail and
> ScreenShareSession disagree about tags for role User.

---

## 1. GAP-165 — the session, built

All five parts are built and the backend half (PR #46) is now driven by a UI.

**The shell.** `div.pp-app.guest > header.pp-guesthead + main.pp-main`, with
`div.pp-brand` (the uploaded logo, else the company name, else "3D Prints
Portal"), `nav.pp-guestnav[aria-label]` with **Overzicht** (`list`) and
**Prints** (`layout-dashboard`), and the ghost "Sessie afsluiten" (`log-out`).
No avatar, no role name, no theme control, no "Uitloggen", no LiveIndicator,
no offline bar, no drawer, no rail, no bottom bar. `aria-current="page"` marks
the open screen; the skip link stays.

**One thing the drawings could not know.** `sessions.destroy()` only deleted
from the `sessions` table, so "Sessie afsluiten" would have cleared the cookie
and left the session alive on the server. It now clears `share_sessions` too,
with a test that logs out, gets 401 on the next request, and then re-enters
with the same link — because the link is a key, not a one-shot.

**The routes keep the token in the URL** — `/share/:token`,
`/share/:token/prints`, `/share/:token/prints/:id`. The session cookie is what
the API trusts, but the URL is the visitor's only credential: a reload, a
bookmark or a link forwarded inside a family group chat has to carry it. The
card links and the nav are built from that base, so nothing in a session can
navigate out of it by accident.

**The visitor's Prints** is ScreenDashboard with the klant axis removed, and
the reduction is asserted rather than described: no FilterBar, no klant strip,
no selection, no bulk bar, no tags, no filament tint, no meta line, no
"Ontbreekt" chip. What is left is the thumbnail, the name, the subtitle, the
price and the status badge.

**The visitor's print page** is the User variant: breadcrumb, `<h1>`, the
payment badge, the viewer with the media strip, the reduced "Deze print" card,
and the payment as a state. **Models only, and it is the data that guarantees
it:** a visitor's `GET /api/prints/:id` returns `assets: null`, and the strip's
videos are built from `assets`, so there is no timelapse to show. We did not
build your proposal; we checked that we were not building it by accident.

**The endings.** A dead link is `share.notFound` + `share.askNew` on the 1.6
page, drawn without the shell, at the visitor's next action — in practice the
next request answering 401 because the backend re-reads the link. Closing the
session yourself is `session.ended.*` on its own page, with no button.
Intrekken now carries `share.revoke.body`.

**"Download overzicht" works for a visitor**, with a backend test that asks for
`/api/share/:token/overview.pdf` from inside a session and checks for 200 and
`application/pdf`. We read your first warning.

**No tags for a visitor**, your second warning: 0 `.pp-tag` nodes on the
visitor's Prints and on the visitor's print page. See *Corrections* for what
we did about role User, where your two files disagree.

---

## 2. The four measurements

### 2.1 The largest klant has 36 prints, not seven

12 klanten, 84 prints. The counts, largest first: **36, 23, 10, 4, 2, 2, 2, 2,
1, 1, 1, 0.** The average is seven and the largest is **36** — five times the
number the "no FilterBar" decision was taken against, and the second klant has
23. The empty folder you expected is there too.

What that looks like in the built screen: the visitor's Prints loads 24 cards
and says "24 van 36 prints" with a "Meer laden" button, because the page size
is 24. So the largest klant's session already needs one deliberate click to see
their oldest prints, and has no way to search for one.

**We did not add the search field.** You wrote "if one klant has thirty, the
visitor gets the search field — and nothing else from the bar"; that is your
decision to confirm, with the real number in front of you. If you want it, say
so and it is one control.

### 2.2 Which other controls the card clips at 360px: none — the trigger was the only victim

Measured on the print whose order row carries the 35-character spool name, at
360px, for **every** control in **every** file row's `.acts`, with the fix in
place:

| control | width | right edge vs the card's | note |
|---|---|---|---|
| `label.pp-qty` ("Aantal keer geprint") | 191px | **91px inside** | the widest after the trigger |
| `label.pp-opt.sm` ("Telt niet mee in kosten") | 188px | 94px inside | |
| `span.pp-lift` (the spool trigger) | 270px | **12px inside** | was 28px *outside* |
| `span.end` (the chevron slot) | 44px | 12px inside | |
| `button`/`a.pp-btn-icon` (the Bestanden card) | 44px | 183–239px inside | |

The card itself now measures `clientWidth` **326** = `scrollWidth` **326** (it
was 326 against 358 in 2.13), and the page does not scroll sideways
(`scrollWidth` 360 = `clientWidth` 360). **Nothing else in the band is
clipped**: the trigger was not the widest victim, it was the only one. At
1400px the trigger is 310px, the 200px floor holds, and the whole name shows.

### 2.3 The guest head at 360px: the tabs hold, the exit button does not

The brand's text was set in the DOM and the layout measured, so this is the
layout's answer and not the owner's data. Identical in both themes:

| studio name | head height | brand | tabs on one line | "Sessie afsluiten" on line 1 | sideways scroll |
|---|---|---|---|---|---|
| 16 chars | **121px** | 135px, 1 line | yes, 162px each at 44px | **yes** | no |
| 20 chars | **153px** | 179px, 1 line | yes | **no** | no |
| 30 chars | 153px | 273px, 1 line | yes | no | no |
| 33 chars | 153px | 302px, 1 line | yes | no | no |
| 48 chars | **177px** | 328px, **2 lines** | yes | no | no |

**Your claim holds for the owner and fails from about twenty characters.** His
studio name is 16 characters, so his head is 121px with the exit button beside
the brand, exactly as you drew it. At 20 characters the brand's
`margin-right: auto` takes the whole first line — the exit button needs 150px
of a 328px content width — and the button drops to a line of its own, making
the head 153px. At 48 characters the brand wraps as well and the head is 177px,
a fifth of a 844px phone viewport before any content.

Everything else you asked about is right at every length: the two tabs stay on
one line as equal 162px tabs at the 44px tap floor, the nav keeps its own
full-width line, and nothing scrolls sideways. The company name has no length
limit in this app short of 200 characters, so this is a real case, not a
pathological one.

### 2.4 The visitor's print page at 390×844: the payment badge is below the fold

One print of the largest klant, 390×844, dark:

| | top | bottom |
|---|---|---|
| guest head | 0 | 121 |
| breadcrumb | 137 | 157 |
| `<h1>` | 165 | 193 |
| payment badge (header) | 201 | 221 |
| viewer | 237 | **506** |
| media strip | 538 | 686 |
| "Deze print" | 702 | **853** |
| "Betaling" card | 873 | **971** |
| the badge inside it | 933 | 953 |

The fold is at 844 and the page is 987px tall. So: the viewer is fully above
the fold, **"Deze print" loses its last 9px**, and the **whole payment card is
below the fold**, with its badge 89px under it. You said you would rather move
it than defend it — here is the number. Note that the status *is* visible above
the fold, in the header badge row at y=201; what is below is the card that
repeats it with the amount.

---

## 3. GAP-163 — the fix is right and it reached nothing (GAP-168)

This is the one to read twice.

The markup obligation is built: the trigger's name is
`span.nm.pp-fname.sans` with `.a` and `.b`, the app splits the string, and
`.b` is the **last word**, as you specified. Our trigger carries **both**
`.pp-spoolbtn` and `.pp-minw-200`, so both of your new selectors match it.

**After the import, at 360px, the trigger was still 28px outside the card.**
Not 32 — 28, because the name block changed — but outside, under a heading
that says resolved.

The cause is not the class, it is the **wrapper**. Since 2.13 the trigger sits
inside `span.pp-lift`, because rule 9 says a window-placed panel needs a
lifted, non-anchoring wrapper. `.pp-lift` is the flex item inside `.acts`;
`.pp-lift{position:relative;z-index:var(--z-raised)}` sets no `min-width`, so
it keeps its content width, and `max-width: 100%` on the child resolves against
that wrapper rather than against the row. Your sentence — "both class names the
trigger is built with are covered, so the fix does not depend on which one the
app wrote" — was about the right risk and missed the one that mattered.

**What we built, and it is not a placeholder:** `pp-minw-0` on the wrapper,
which is your own published utility doing its documented job. With it the
trigger is 270px, ends 12px inside the card, and the card stops overflowing
(§2.2). The alternative is one more selector in your file —
`.pp-asset .acts > .pp-lift{min-width:0}` — or a sentence in Popover's rule 9
saying `.pp-lift` carries `min-width: 0` wherever it is a flex item, which
would settle the whole class of this bug. GAP-168 is open for that choice.

---

## 4. GAP-157, GAP-158, GAP-159 — built as drawn

**AanvraagDialog** is built to the five fields in your order, with the
combobox, the klant who is not a folder yet as the **last** option, the two
radios defaulting to *Nog niet besloten*, the optional bron and notitie, the
form-dialog backdrop rule, and a failure that keeps everything typed. Walked
through in the running app at 390px: a new klant typed from scratch, status
*Mee bezig*, a bron and a note; the toast says "Aanvraag toegevoegd." and the
row appears in its group with both meta lines. **One deviation**: bron and
notitie are still written with their own `PUT /api/prints/:id/source` and
`/note` after `POST /api/requests`, rather than as fields of one route. They
are fields of a print and a request is a print; the cost is that a failure
between the two calls leaves a request without its link, which the dialog's
"everything you typed is still here" state covers because pressing Toevoegen
again recreates it. Say the word and we make it one route.

**GAP-159 reverses what we shipped the day before, and that is fine.** The
third row action is gone, with its copy key and its test. "Status wijzigen" is
a dialog now: four radios on a row with files, and on a fileless row the two
queue states, `queue.statusHelp.fileless`, and a ghost "Aanvraag verwijderen"
under a hairline with a ConfirmDialog that names the request. Deleting needed
`DELETE /api/requests/:id`, which refuses anything whose `origin` is not
`request`.

**Your reason for refusing the other two values is now a test rather than an
argument.** `backend/test/prints/queue-api.test.ts` creates a request, clears
its state through the bulk route, and asserts it is in **no** list: not in the
queue, not in `/api/prints`. The leak you described is real and reproducible on
all three databases.

**GAP-158, diffed before the marker came off**, as you asked. Three
differences between what the owner's decision produced and the anatomy:

1. the card showed **Project unconditionally**. GAP-072's comparison was in the
   breadcrumb and not here. Now it is `squashName(project) !== squashName(name)`
   — and in this library that condition is **false for 84 of 84 prints**, so a
   klant was reading a row that repeated the print's name every single time.
   Worth knowing: the operator's card still shows it (GAP-095 specifies that
   one and 2.14 spoke only for the reduced card), so that row repeats the name
   84 times on his page too. Your call, not ours.
2. the card showed the **missing-files line** and the header the **`pp-lacks`
   chip**. Both are gone for role User and for a visitor.
3. the title was `b.pp-strong`. The reduced card now has the `<h2>` your README
   and ScreenShareSession's preview both draw; the operator's card keeps the
   bold span its own preview still shows.

Of the largest klant's 24 visible prints, the card renders as `Klant · Datum`
on 18 and `Klant · Datum · Bron` on 6. Your "a card of two rows is still a
card" is the common case here, not the edge case.

**GAP-164 is confirmed with nothing to do.** `settings.payLink.noIban` is
defined once and read at exactly the two call sites the gap names;
`settings.customer.payLink.only` appears nowhere in the app. One leftover on
your side: ScreenSharePage's **line 40** still carries the withdrawn key in its
2.0.1 prose, and only the appended 2.14 section withdraws it.

---

## 5. Corrections

**ScreenQueue's README lost its whole 2.12 section in this export (GAP-167).**
It is the only file in the export with deletions — 38 added, 47 removed, while
every other file is purely additive and `bundle.css` adds 58 lines and removes
none. Gone: the `## 2.12` section, and with it three sentences reverted to
their 2.11 wording. The README now says the group summary's **`.amt` slot**
carries `queue.ofWhichWithoutFiles`, which is what GAP-155 measured away (181px
in `.amt` left the heading 109px at 360px); it drops GAP-156's note that
`bundle.css` finally makes 44px row actions true; and it drops 2.12's rule
against an `aria-label` repeating the summary's own text. The changelog says
"Breaking changes: none" and "nothing is removed", and `bundle.css` still
carries every 2.12 declaration — so the stylesheet and this README now
disagree. **We changed nothing in the app**: the sentence stays the second
muted line of `.ttl` with `.amt` empty, and the queue test asserts it.

**ScreenPrintDetail 2.14 and ScreenShareSession 2.14 disagree about tags for
role User (GAP-166).** ScreenPrintDetail says "no tags" for role User *and* a
visitor, in the section that resolves GAP-158. ScreenShareSession lists tags
under *What the owner still decides*, calls it proposed, names 1.4 as the
standing answer and says "no tags **in a share session**" until he answers. We
built the half they agree on (a visitor sees none) and left role User as 1.4
has it. This is GAP-088's shape again: a gap settled in one README and
contradicted in another, in the same export.

**One of our own, from this round.** Splitting the trigger's name into `.a` and
`.b` broke its accessible name: name computation joins element children without
the space that lives inside them, so "Creality Rainbow Wild Blossom Hyper" was
announced as one word. Your own answer was already in the system — ModelPicker
labels its split file names explicitly — so the trigger now carries an
`aria-label` built from its own visible words, the archived chip included.
Worth a sentence in SpoolPicker: **a split name needs an explicit label.**

---

## 6. What would help most next

1. **GAP-168**, in one line: name `.pp-lift` in the GAP-163 rules, or give it
   `min-width: 0` in rule 9. Until then the fix works here through a utility
   class on a wrapper, which is a thing a future reader will not expect.
2. **GAP-167**, ScreenQueue's 2.12 section back. It is the only part of this
   export that contradicts shipped, measured and tested behaviour.
3. **GAP-166**, one sentence about tags for role User, so that the two files
   stop saying different things.
4. **The payment card below the fold** on a visitor's print page (§2.4) — your
   call on the order, with the numbers in front of you.
5. **The search field for the visitor's Prints** (§2.1). The largest klant has
   36 prints and the screen pages at 24; we did not add it on our own.
6. **The guest head at 20 characters and up** (§2.3), where the exit button
   leaves the first line and the head grows to 153px. Fine for this owner,
   wrong for the general claim.
