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

- App version **1.0.0**, built against design system **2.15**.
- **181 gaps logged, 6 open**: GAP-173, GAP-174 and GAP-175 (your three
  *proposed, needs your confirmation*, deliberately **not built**), GAP-179
  (PaymentPanel still specifies a state 2.15 made unreachable) and **GAP-180**
  and **GAP-181**, two things 2.15 claims that the browser disagrees with.
  Numbering is unbroken, 001 to 181.
- **No `ds-gap` marker anywhere in the frontend.** `grep -rn "ds-gap"
  frontend/src` is empty: GAP-169's placeholder came off with its rule.
- Verification for this round: prettier, eslint, both typechecks,
  `scripts/check-design-tokens.sh` over the whole frontend, the frontend suite
  (**214** tests) and the backend suite on **sqlite** (**763** tests, 0
  failures — the sweep across PostgreSQL and MariaDB is CI's now, and nothing
  this round writes SQL). Axe: **28 runs, 0 violations** — the session's
  Overzicht, its Prints and one print, role User's Overzicht and one print,
  and the operator's Overzicht and print detail, each in dark and light at
  1400px and 360px. Those are the screens this round touched plus the screens
  that render a component it changed; the untouched ones were cleared in 2.14.
- `node scripts/check-design-export.mjs` passes. It verified **2** of the 11
  class claims, because 2.15's claim line wraps exactly as 2.14's did; the
  other nine selectors were checked by hand against `bundle.css`, and so was
  "no `--border` left on `.pp-seg` or `.pp-modelbtn`" (two `var(--border-strong)`
  and no `var(--border)` across every rule naming either class), "no class
  removed and nothing renamed" (the class-name sets differ by exactly
  `.pp-guestexit`) and "no copy key added, changed or removed"
  (`copy-deck.md` is byte-identical).

> **2.15 landed, and the two things that did not land are both in `bundle.css`
> rather than in a decision.** GAP-166, GAP-167, GAP-168, GAP-169, GAP-170,
> GAP-176 and GAP-178 are built or verified as drawn. **GAP-172 is half
> resolved and GAP-177 is three-quarters**, and neither can be seen without
> the browser: the guest head is one height up to 29 characters of studio name
> and 32px taller from 30, because a flex container wraps before it shrinks
> (GAP-180); and the phone drawer's links are `.pp-drawer a`, which none of the
> three new focus-visible selectors matches, so they still draw Chromium's own
> ring at 2.86:1 in dark (GAP-181). Both have a one-declaration fix, measured
> here before being proposed.
>
> **GAP-169 is answered and the owner's complaint is gone.** The track reads
> as a set at a glance, and the ARIA stayed where you put it.
>
> **One thing to look at that is not a gap:** after GAP-176, nothing on the
> operator's print page names the project folder on **any** of the 84 prints —
> because the breadcrumb applies the same comparison. §4.5.

---

## 1. GAP-169 — the track, built, and the placeholder gone

Your CSS did all of it; the app's share was subtraction and a comment. The
`.pp-guestnav a` border rule and its `ds-gap: GAP-169` marker are out of
`frontend/src/styles/app.css`, and the markup needed nothing — it was already
`<nav aria-label="Hoofdmenu">` with two `NavLink`s that set
`aria-current="page"`.

Measured in a real session, both themes:

| | desktop 1400px | phone 360px |
|---|---|---|
| track box | 221 × 42 | 328 × 50 |
| item boxes | 121 × 36 and 91 × 36 | **160 × 44** and 160 × 44 |
| track border | `1px solid #6b749c` dark / `#6f7a96` light | the same |
| track ground | `surface-2` | `surface-2` |
| radius / padding | 999px / 2px | 999px / 2px |
| current item | `rgba(122,162,247,0.14)` + `text-strong` | the same |

So the nav line is **+6px** and the two halves are **160px each inside a 328px
track**, which is exactly what you predicted. `anyButton` is false,
`role="tablist"` appears nowhere on the page, neither item carries
`aria-pressed` or a `role`, and both are `<a>`. **The blessing held in the
build**: the look is borrowed and the semantics are not.

The head heights that follow from it are measurement 1 (§3.1): **127px at
360px and 67px at 1400px**, where 2.14 measured 121 and 61.

---

## 2. What else is built

### 2.1 GAP-170 — the payment is a header line, and the card is gone

For role User **and** a visitor the status badge and the amount sit beside the
`<h1>` in one `span.pp-row.pp-gap-2`, as ScreenShareSession's preview draws
them, and `pp-card pp-pay` is not rendered for `!canManage` at all. The
operator's PaymentPanel is untouched. Numbers in §3.3.

Two consequences we took rather than left half-done, both stated so you can
overrule them:

- **The reduced body is now `pp-pdtop`.** It was a `pp-detail` grid whose
  second column held the payment card. With the card gone that grid has one
  empty cell, so the body is the `pp-pdtop` media row 2.14 actually specifies:
  the viewer and the reduced card side by side, "Deze print" last.
- **The `.pp-tags` badge row is not drawn when it would be empty.** For a
  visitor it now holds nothing at all, and an empty flex child still costs the
  column its `space-2`; on a page measured against an 844px fold that is 8px
  of nothing. It is still drawn for the operator, and for a signed-in User
  when the print is archived or deleted (the record badge is the one thing that
  can still be in it — your 2.14 list of removals for that role names tags,
  `pp-lacks` and the "⋯" menu, not the record badge, so we left it).

What died with it: **PaymentPanel's `role === 'User'` branch and its `visitor`
prop** are now unreachable, so they are gone rather than left behind a role
check — and **`pay.userNote` is a copy key with no render site anywhere in the
app**. The deck is not ours to edit, so the key stays in `nl.ts`. That leaves
PaymentPanel's README specifying a state no screen can reach: **GAP-179**, §4.3.

### 2.2 GAP-166 — no tags for role User, anywhere

Built, and against our own proposal — see *Corrections*, §4.1. Role User's
print page is now exactly a visitor's. Measured on the real library, role User
against the operator, at both widths:

| | role User | operator |
|---|---|---|
| chips in the print header | 0 | drawn (0 in this library, because he uses none) |
| chips on a card | 0 | drawn |
| Tags column in the list view | **no header, no cells** | header present |
| "Tags" picker in the FilterBar | **not rendered** | rendered |
| "Tags" fieldset in the phone filter sheet | **absent** | present, 5 chips |

Two choices inside that, both deliberate:

- **The control is not rendered, not disabled or empty.** README *Roles* says
  never render a control a role cannot use. An operator who has defined no tags
  yet still gets the disabled "Tags" button, so that behaviour is untouched —
  the switch is a separate `showTags` flag, not an empty `tags` array.
- **`tag=` is dropped from the URL filter for a non-operator**, exactly as
  `verwijderd=1` has been dropped for a non-Admin since 1.3. Otherwise a User
  who was sent a link with `?tag=…` would have an active filter with nothing on
  screen to explain the count.

`showTags` is a separate prop from `reduced` on purpose: a signed-in User's
card keeps its meta line, because whether a klant ever reads Materiaal and
Gewicht is **GAP-174**, which you have left open.

### 2.3 GAP-172 — the exit button, built; the head, half

The markup obligation is built at every width: the button carries
`.pp-guestexit` and its label lives in `<span class="lbl">Sessie
afsluiten</span>`, so the accessible name is identical on the phone and on the
desktop and the words are hidden rather than dropped. Measured at 360px the
button is a **44 × 44** square with the label box at 0 width; at 1400px it is
150px wide with the words visible. The brand already held the whole studio
name in the DOM, so the ellipsis costs a screen reader nothing. A test asserts
the class and the span's text, because an `aria-label` that only exists on the
phone would pass a glance and fail a reader.

**The head is not one height at every name length.** That is GAP-180 and the
numbers are in §3.2.

### 2.4 GAP-178 — a session's Prints is not paged

The whole `.pp-more` block is gone from that page: no "Meer laden", no "{shown}
van {total} prints", no "Alle prints geladen". The list comes from a new
`fetchAllPrints`, which **loops** in chunks of the server's own
`MAX_PAGE_SIZE` (100) rather than asking for one large page, so a klant who one
day passes the ceiling gets their whole list instead of a silent truncation; on
this library it is **one request**, `limit=100`. The unpaged result has its own
query key, because it is a different shape under the same `['prints']` prefix
that live events invalidate.

**You asked what becomes dead: nothing does.** `common.loadMore`,
`common.count` and `common.allLoaded` are all still rendered by the operator's
dashboard, which is unchanged; `common.count` also by the FilterBar's summary
line. `.pp-more` is still used there. No component prop fell out of use. The
scroll this buys is measurement 4 (§3.4).

### 2.5 GAP-168 — `pp-minw-0` is off the wrapper

`.pp-lift { min-width: 0 }` is the right owner and the utility came off the
spool trigger's wrapper. Re-measured at 360px on the print whose row holds the
35-character spool name, as you asked:

| | 360px | 1400px |
|---|---|---|
| trigger | 270px wide, right edge **12px inside** the card | 310px, 273px inside |
| `.pp-lift` computed `min-width` | `0px` | `0px` |
| card | `clientWidth` 326 = `scrollWidth` 326 | 628 = 628 |
| page scrolls sideways | no (`scrollWidth` 360 = `clientWidth` 360) | no |

Identical to the 2.14 measurement that had `pp-minw-0` on it, so **the fix
survived the handover**. And because the declaration now sits on `.pp-lift`
itself, it reaches every window-placed wrapper in the system — so we checked
that none of them collapsed: **12 `.pp-lift` wrappers** across the Overzicht
(10 OverflowMenus, 20–60px) and the print detail (a 36px menu and the trigger),
at both widths, all with computed `min-width: 0px` and **none** under 8px in
either dimension. Deel-links and Openstaand have no `.pp-lift` at these widths.

`pp-minw-0` still appears twice in the frontend, on Openstaand's stat cards,
where it is a published utility doing its own documented job. It is on no
`.pp-lift` any more.

### 2.6 GAP-176 — the operator's Project row

One condition for every role: the `canManage ||` disjunct is gone, so a single
`squashName` comparison decides. Checked both ways in the suite and on the real
library. The consequence is in §4.5, and it is the one thing this round does to
a screen he uses daily without his having asked.

### 2.7 GAP-167 and GAP-177 — nothing to build

GAP-167 is README only: the `## 2.12` section is back in ScreenQueue's README
(55 lines added, 4 removed, and the four are the *Tokens* sentence being
replaced by its 2.12 wording). The app changed nothing in 2.14 and was right
not to; the summary still renders `queue.ofWhichWithoutFiles` as the second
muted line of `.ttl` with `.amt` empty, and the test still asserts it. Thank
you for saying you read our `4572c99` copy — that is the kind of disclosure
that makes a restoration checkable.

GAP-177 is CSS only and it is ours to verify. Three of the four places are
right; the drawer is GAP-181. Numbers in §3.5.

---

## 3. The six measurements

### 3.1 The guest head's two heights with the track

| | 2.14 | 2.15 | you expected |
|---|---|---|---|
| 360px | 121px | **127px** | ~127px |
| 1400px | 61px | **67px** | ~67px |

Exactly +6px in both, identical in both themes, and nothing else in the head
grew: the nav line is 50px at 360px (44 + 2 + 2 + 1 + 1) and 42px at 1400px
(36 + 6), the brand is still one line at the owner's name, and nothing scrolls
sideways (`scrollWidth` 360 = `clientWidth` 360). **Your arithmetic was the
whole of it.**

### 3.2 The five studio-name lengths, and the ellipsis threshold

Not one height. Brand text set in the DOM, 360px, identical in both themes:

| studio name | head height | brand box | ellipsis engaged | rows in the head |
|---|---|---|---|---|
| 16 chars | **127px** | 138px | no | 2 |
| 20 chars | **127px** | 179px | no | 2 |
| 24 chars | 127px | 218px | no | 2 |
| **29 chars** | 127px | 262px | no | 2 |
| **30 chars** | **159px** | 273px | no | **3** |
| 33 chars | 159px | 299px | no | 3 |
| **37 chars** | 159px | 328px | **yes** | 3 |
| 48 chars | 159px | 328px | yes | 3 |

**The character count you asked for is two counts, and they are in the wrong
order.** The head stops being one height at **30** characters; the ellipsis
only starts at **37**. In between, the brand is a single unellipsised line that
is too wide to share the row, so the exit button drops to a row of its own and
the head is 159px.

The cause is flexbox, not your rules. `.pp-guesthead` is `flex-wrap: wrap` and
`.pp-guesthead > .pp-brand` is `flex: 0 1 auto` with `min-width: 0`, so the
brand's **hypothetical main size is its full content width** — and a flex
container *wraps before it shrinks*. Once brand + 16px gap + 44px button passes
the 328px content box, the line wraps and the brand is never shrunk, so
`text-overflow` has nothing to cut.

Two counts, not one, also because a character count is only meaningful next to
the glyphs it was measured with: in the same sweep the threshold is **16
characters** of `W` and **58** of `i`. The 30 above is for a real Dutch company
name in `--font-sans`.

**One declaration fixes it, and we measured it before proposing it.** With
`.pp-guesthead > .pp-brand { flex: 1 1 0 }` patched into the phone block, the
head is **127px at every length from 16 to 80 characters**, the brand box is a
constant 268px, the ellipsis engages from **30** characters, and the button
stays on the first row throughout. Logged as **GAP-180**; not built, because a
flex basis on your selector is a visual decision and the head is not broken,
only taller than the export says.

This is still a real improvement: 2.14 was 121 / 153 / 177 at three thresholds,
2.15 is 127 / 159 at one, and the threshold moved from about 20 characters to
30. The owner's own name is 16 characters, so **he will not see this** — which
is the case GAP-172 exists to catch.

### 3.3 A visitor's print page at 390×844 after GAP-170

One print of the largest klant, 390×844, identical in both themes:

| | top | bottom |
|---|---|---|
| guest head | 0 | 127 |
| breadcrumb | 143 | 163 |
| `<h1>` | 171 | 199 |
| **the amount beside the `<h1>`** | **211** | 239 |
| the badge in that pair | 215 | 235 |
| viewer | 255 | 524 |
| media strip | 560 | 708 |
| "Deze print" | 728 | **879** |
| `pp-card pp-pay` | **not rendered** | — |
| `.pp-tags` row | **not rendered** | — |

Page height **895px** against a fold of 844. The amount is at **y=211**, above
the fold at both widths, said **once** on the page (`.pp-money` count: 1), and
"Deze print" is the last card. 2.14's page was **987px** with the card at
873–971, so the round removed **92px** and brought the only number on the page
140px up.

**Two honest deltas from what you expected.** You said "around 860": it is
**895**, 35px more. And "Deze print" now loses its last **35px** below the
fold where in 2.14 it lost 9 — not because anything below it grew, but because
everything above it did: the head is +6px and the header block is +8px (the
`.pp-text-xl` amount makes the `.pp-ph` row 28px where `.pp-tags` was 20px),
and this print's card is 151px. Nothing is clipped and nothing scrolls
sideways; the card's last rows are a scroll away, as a last card may be.

### 3.4 The largest klant's Prints with no page boundary

The distribution is unchanged: **36, 23, 10, 4, 2, 2, 2, 2, 1, 1, 1, 0** over
12 klanten, 84 prints. 36 cards at 360px:

| | |
|---|---|
| requests for the list | **1**, `limit=100` |
| cards rendered | 36 |
| page height | **13 311px** |
| that in phone screens (844px) | **15.8** |
| one page of 24 would have been | 8 875px, **10.5** screens |
| thumbnails | all 36 `loading="lazy"`; **11** fetched before any scroll, 36 by the bottom |
| wheel steps of 700px to the bottom | 18 |
| "Meer laden" / count line / `.pp-more` | none |
| sideways scroll | none |

**Our answer: take it, and here is the part you have not seen.** The page is
**15.8 phone screens**, which sounds alarming until you notice the boundary was
only ever saving **5.3** of them: a page of 24 is already 10.5 screens, so the
tap was buying a third of the scroll, not most of it. The klant's question is
*is my print done*, the answer is the first card, and the thumbnails stay lazy
— eleven images for a page of 36, so the cost is layout and not bandwidth.

The one thing we would say plainly: at 346px per card this list has no
landmarks. If a klant ever does hunt for an older print, scrolling 13 000px
past 36 identical-looking cards is worse than one tap would have been — and
that is the case GAP-171 refused a control for, on a distribution we agree
with. Our read is that 36 is fine and 60 is where this stops being true, which
is the same number you put on GAP-171.

### 3.5 Keyboard focus on every nav link

Reached by **pressing Tab** (focused the previous focusable element, then one
Tab), so `:focus-visible` genuinely applies, and then read off the **rendered
pixels** on a scanline through the middle of the link — not inferred from the
tokens. Every run reported `focus-visible: true`.

| place | computed outline | offset | reads against |
|---|---|---|---|
| sidebar, current (tinted) | `2px solid` `--focus-ring` | **+2px** | 8.65 dark / 7.82 light vs the `bg` gap; 6.82 / 6.39 vs the tint |
| sidebar, other item | `2px solid` `--focus-ring` | +2px | 8.65 / 7.82 vs `surface` |
| bottom bar, current | `2px solid` `--focus-ring` | **−2px** | 8.65 / 7.82 vs `surface` |
| bottom bar, other item | `2px solid` `--focus-ring` | −2px | 8.65 / 7.82 |
| **guest track, current (tinted)** | `2px solid` `--focus-ring` | **−2px** | **6.02 dark / 5.54 light** vs that item's own tint, and 7.66 / 6.72 vs the track just outside it |
| guest track, other item | `2px solid` `--focus-ring` | −2px | 7.66 / 6.72 vs `surface-2` |
| **phone drawer, both items** | **`1px auto rgb(0,95,204)`** | **1px** | **2.86 dark** / 5.98 light — the browser's own ring |

**The answer to the question you asked: yes.** Inside the track the ring reads
on the tinted current item at **6.02:1 in dark and 5.54:1 in light** against
that item's own ground, and 7.66 / 6.72 against the track on its other side —
so it is bounded by a passing contrast on both edges, and it is no quieter than
on the other item. The pixel run for the current item in dark, left to right,
is `#1a1b26` (the bar) · `#6b749c` (the track's edge) · `#232535` × 2 (the
track's 2px padding) · **`#9bb8fa` × 2 (the ring)** · `#2f3650` (the item's
tint) — the ring is two whole pixels of the token, inside the track, not a
blend.

**And the one that is not: the phone drawer.** Its links are `.pp-drawer a`,
which is none of the three selectors 2.15 added, so they still draw Chromium's
ring at 2.86:1 against `surface` in dark. AppShell 2.15's own sentence says "a
sidebar **or drawer** link". Logged as **GAP-181** with a one-rule fix.

### 3.6 Still owed: how often a Wachtrij group has no "waarvan" line

Answered, and the answer is small enough to be worth saying out loud: **right
now, one of the two groups on the screen.** The queue holds 6 rows in 2 groups;
*Nog niet besloten* has 3 rows of which **1** is fileless, so it carries the
line, and *Mee bezig* has 3 rows and **0** fileless, so it carries none.

The structural answer behind that snapshot: the only way a row becomes fileless
is AanvraagDialog, and a request stops being fileless the moment its folder
exists — which normally happens before he starts working on it. So *Mee bezig*
is the group that will usually have no "waarvan" line, and *Nog niet besloten*
the group that usually does. We cannot give you a frequency over time: the app
keeps no history of queue states, so anything beyond today's reading would be
a guess, and we would rather say so.

---

## 4. Corrections

### 4.1 GAP-166: our proposal was wrong, and your reason was better than ours

We proposed treating ScreenShareSession's sentence as governing, "because it is
the one that *knows* it is deciding something" — which would have kept 1.4's
tags for role User. That reasoning was about which **document** to believe, and
you answered with a **fact**: the owner does not use tags at all (GAP-129), so
there was never a case in this library where his filing word helps a klant and
nothing was left to ask him. We have built your answer. Worth recording that
the rule we were reaching for — prefer the file that knows it is deciding — is
still a decent tie-breaker; it just loses to a fact about the data.

### 4.2 Our `--border` numbers, and the one you took that we did not

You recomputed 1.37 dark / 1.42 light for `border` and 3.75 / 4.29 for
`border-strong` independently and got ours. Agreed, and the measurement in §3.5
is consistent with both.

The number we did **not** take is the one that decided the shape: a
`border-strong` hairline around **each** item draws at **2.94:1** against the
current item's own tint on the inside. We measured the placeholder's outer edge
and reported the pair that passes; we never measured its inner edge against the
tint it sits on. That is the same class of mistake as GAP-055 — measuring the
case that is easy to reach instead of the case that fails — and it is now the
check we run on any boundary that has a different ground on each side. Thank
you for taking it.

### 4.3 GAP-179: PaymentPanel still specifies a state 2.15 made unreachable

Two files in the same export disagree. ScreenPrintDetail 2.15 says "`pp-pay` is
**not rendered for this role at all**" and ScreenShareSession 2.15 repeats it;
PaymentPanel's *Anatomy* still lists "**Rol User:** read-only badge and customer
price, no inputs, no history", and its 2.14 section still specifies that state
in two forms with `pay.userNote` for the signed-in half. 2.15 says "the operator
keeps PaymentPanel exactly as it is", which keeps the state in the spec while
removing every screen that can reach it.

Nothing is blocked — the direction is not in doubt — so we built GAP-170 and
removed the dead branch rather than leaving it behind a role check. What we
would like is the *Rol User* paragraphs marked **superseded by 2.15, GAP-170**
in place, the way you marked 1.4's tags clause, and one sentence on whether
`pay.userNote` is retired from the deck or kept. It is a key with no render
site, and we have not touched the deck.

### 4.4 GAP-180 and GAP-181 are corrections to this export, not to a decision

Both are above (§3.2, §3.5). We separate them from the decisions on purpose:
every judgement 2.15 made is one we would make again, and these two are rules
that do not reach the elements their own README names — the same shape as
GAP-163 and GAP-168 last round, which is why they are new ids and not reopened
ones.

### 4.5 GAP-176: after this change nothing on the operator's print page names the project folder

Built exactly as specified, and here is the thing that looks off. You wrote
that "the breadcrumb has had this comparison since 1.9", which is true — and it
is the same comparison, so it hides the project on the same prints. Measured
over the whole library: **84 of 84 prints have a project folder, and 0 of 84
have one that differs from the print's name.** So after GAP-176 the Project row
is drawn on **none** of them, and the breadcrumb — which applies the same
comparison — reads the klant alone on all 84 as well. The folder level the
indexer actually reads therefore has no representation anywhere on the
operator's print page, for any print in this library. Checked on one print's
card: the rows are Klant and Bestellingen, and the breadcrumb has no separator
in it.

We are not asking you to revert it — a row that repeats the `<h1>` 84 times is
not a fact, and you said as much. We are saying that your own offer applies:
*"if he liked that row as a check that a print is filed in the right project
folder, say so and it comes back — with the folder named, which is at least a
different fact."* On this library that is the only form in which the project
could come back at all, because the comparison that removed it also removes it
from the breadcrumb. If you want it, the honest shape is probably a row that
names the **path** rather than the project.

One precision note while we are here: our `squashName` strips **every**
non-letter and non-digit, not only case and spaces, so `Bloembak clips` and
`Bloembak-clips` compare equal. That is the 1.9 breadcrumb implementation of
GAP-072 and it is now shared by this card; it is slightly broader than "case
and spaces ignored" as 2.15 words it. If you meant the narrower comparison,
that is one line and a question, not a build.

---

## 5. Deviations we chose, with what they cost

1. **`pp-pdtop` instead of `pp-detail` for the reduced body** (§2.1). Your
   2.14 text specifies `pp-pdtop`; the app had built a two-column `pp-detail`
   with the payment card in the second column, so removing the card made the
   grid the wrong shape rather than a shape with one less card in it. Cost: on
   a desktop the reduced card now sits **beside** the viewer instead of under
   it. On a phone nothing moves — both are one column — and the phone is where
   this screen lives.
2. **`.pp-tags` is not rendered when empty** (§2.1). Costs the page 8px it was
   spending on nothing, and means a visitor's print page has one fewer element
   than the operator's rather than one empty one.
3. **`fetchAllPrints` loops instead of asking for one page of 100** (§2.4).
   Costs one extra request for a klant past 100 prints, which no klant is;
   buys that such a klant sees their whole list instead of a silently truncated
   one. The alternative — `limit=100` and trust it — would have been a silent
   bug the day it mattered.
4. **`showTags` as its own prop, not `reduced`** (§2.2). Reusing `reduced` for
   role User would have removed Materiaal and Gewicht from a signed-in User's
   card, which is **GAP-174** and yours to decide. Cost: one more boolean on
   two components.
5. **`tag=` dropped from a non-operator's URL filter** (§2.2). Strictly more
   than "no tags as a filter" asks for. Cost: a role User who somehow has a
   tag-filtered URL gets the unfiltered list instead of a filtered one with no
   visible cause. We think that is the right side to err on, and it matches
   what 1.3 already does for `verwijderd=1`.
6. **GAP-180 and GAP-181 are not built.** Both are one declaration in
   `bundle.css`. We measured the fix for GAP-180 rather than guessing at it,
   and then stopped: a flex basis and a focus ring are visual values on your
   selectors. Cost: a studio with a name past 29 characters has a 159px head,
   and a keyboard user on a phone sees Chromium's ring in the drawer, until the
   next export.

---

## 6. What would help most next

1. **GAP-180**, one declaration: `flex: 1 1 0` on `.pp-guesthead > .pp-brand`
   in the phone block, with its `.pp-device.phone` twin. It is measured and it
   makes GAP-172's claim true at every name length.
2. **GAP-181**, one rule: `.pp-drawer a:focus-visible`. It is the last of the
   four places GAP-177 names, and the only one still under 3:1.
3. **GAP-179**, one mark-up-in-place: PaymentPanel's *Rol User* state
   superseded, and a word on `pay.userNote`.
4. **GAP-173, GAP-174 and GAP-175** — the owner's three. None is built and none
   will be until he answers; numbering them was the right call, and they are in
   our register now with his decision as the only thing missing.
5. **GAP-176's consequence** (§4.5): whether the project comes back as a path
   row on the operator's card, now that nothing on that page names the folder.
6. **The `squashName` width** (§4.5): all punctuation, or case and spaces?
7. **The 13 311px Prints page** (§3.4). We think it is fine and we would rather
   you knew the number than trusted our judgement about it. If 36 ever becomes
   60, GAP-171 is the entry to reopen and the trade reverses.
8. **Your previews' fixture names, and this one is not a design question.**
   Three of the klant names the previews, the READMEs and the changelog have
   used since 1.0 — and one print name — turn out to be real folders in the
   owner's library. Nobody checked them when they were chosen; the app's own
   copies have been renamed and the repo is public, so the exported
   `design-system/` tree is now the only place they are left. The set the app
   uses from here on is **Koen, Esmee, Veerle, Anouk, Bas** and the print
   **"Bloembak clips"**, and we would like the export to use the same six and
   nothing else. One more: `<h3>Rick</h3>` appears as a klant in
   `ScreenDashboard/preview.html`. Rick is the owner — he is the operator in
   every screen you draw, and he is `lastChange.by` in the index; he should not
   also be one of his own customers. You cannot verify a name against his
   library yourself, which is exactly why the list above is the whole list:
   please invent nothing new.
