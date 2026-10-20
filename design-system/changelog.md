# Changelog 2.17

**A name sweep is only as good as the list it is given, and 2.16's list was four strings against a
library of ninety-six.** The implementer scanned all 162 files of 2.16 against the owner's actual
folders on disk — twelve klanten and eighty-four projects, a check neither of us can do from the
names alone — and three real strings were still in the export: a project name used as a fixture
print in six files, a project name used as the worked example inside an argument about file-name
truncation, and a fixture print name whose **first fifteen characters match a sixteen-character
real folder**, which the owner has decided to treat as a leak rather than a coincidence. All three
are replaced here, and **no new name enters the system**: both replacements are strings this export
already carried and that the same scan cleared, and the prose example becomes this library's own
case instead of an invented product. 2.17 changes nothing else by design — every decision in 2.16
stands, and three of them are confirmed below. Version 2.16 follows below.

| GAP | About | Decision | Status |
|---|---|---|---|
| — | A real project name used as a fixture print in `PrintCard`, `ScreenDashboard`, `ScreenOutstanding`, `PrintRow`, `BulkDialogs` and `TextInput` (13 occurrences, 6 files) | **Replaced by `Vitrinekast inzet`**, a print name this system already used in `PrintSource`, `ScreenQueue` and `PrintNote` and that the library scan cleared. Same length, so no layout moves; the derived second card ("… onderstuk links") follows it | **resolved** |
| — | A real project name as the worked example in the argument against reading a version out of a file name (`AssetListItem` 2.6, and the GAP-133 row of the 2.9 changelog) | **The example becomes `Bloembak clip corner 22`** — three sizes of one part whose trailing number is a **width**, which a regex over names reads as three versions. It is the same argument on this library's own files instead of an invented product, and the approved print name is its root | **resolved** |
| — | A fixture print name whose first 15 characters reproduce a 16-character real folder exactly (38 occurrences, 11 files; the invoice line description in `DocInvoice`) | **Replaced by `Kabelgoot bureau`**, also already in this export and cleared. The owner's call was to treat a near-miss as a leak, and the rule this sets is the right one: **a fixture name does not have to match a real folder to be a problem; it has to be close enough that a reader would think it did** | **resolved** |
| — | `Algemeen` as the klant that used to carry the owner's own name (2.16) | Verified against the library by the implementer: it is not a folder there | **confirmed as built** |
| GAP-182 | May the `Map` row replace the conditional `Project` row on the operator's "Deze print"? | The owner agrees. It was the one thing 2.16 changed rather than added, and it stays as designed | **confirmed as built** |
| — | How many of the 121 timelapses are `.mkv` (asked in 1.9, 2.0 and 2.16) | **Measured: 2 of 121** — 119 `.mp4` (98%), 2 `.mkv` (1%), in 50 folders. The unsupported state is the exception it was specified as, so `video.unsupported.title` keeps its words and conversion on upload is not urgent. Written into VideoPlayer 2.17, where the cost is also recorded: for a klant those two files have no download to fall back on | **confirmed as built** |

## New and changed

- **Tokens:** none. `tokens.json` `version` is **2.17**. No token added, renamed, changed or removed.
- **Classes:** none. No class is added, changed, renamed or removed; `bundle.css` is **byte-identical to 2.16**.
- **Copy:** none. No key is added, changed, retired or removed.
- **Components changed (fixture names only):** BulkDialogs, DocInvoice, DocOverview, DocReminder,
  OutstandingGroup, PrintCard, PrintRow, ScreenDashboard, ScreenInvoices, ScreenOutstanding,
  ScreenSharePage, ScreenShareSession, TextInput (previews), AssetListItem (README, the prose
  example). **VideoPlayer (README)** gains the measured `.mkv` answer — the only content change in
  this version.
- **Pages changed:** `changelog.md` (this entry and the GAP-133 example), `README.md` (the version
  note), `tokens.json`.
- **Breaking changes: none.** Nothing an app imports changes: no token, class or key moves, and the
  only strings that change are fixture data inside previews.

## The rule this round leaves behind

Three sweeps have now been run on these names and each found what the previous one was not told to
look for. The reason is structural, so it is worth writing down rather than apologising for again:
**this system cannot check a name against the owner's library, and the app can.** So the division
is fixed from here:

1. **A fixture name in this system is either already in the export or checked before it ships.** If
   a round needs a new one, the design system names the exact strings it wants and the implementer
   runs them against the library first. Inventing a plausible Dutch object name is the one thing
   that cannot be made safe from here.
2. **Near-misses count.** A string that shares fifteen of sixteen characters with a real folder is
   treated as a real name, because a reader cannot tell the difference and the owner should not
   have to argue about it.
3. **The sweep is the whole tree, not the previews.** Prose examples inside an argument are the
   ones that survive a sweep, because nobody greps a paragraph for a product name. Both strings
   that survived 2.16's sweep in prose were in exactly that position.

# Changelog 2.16

**Three questions this system published as proposals came back answered, and the one that looked
smallest cost a route.** The owner said no to API-docs for role User, yes to Materiaal and Gewicht
for a klant (*"dan hebben ze meer detail waarvoor ze moeten betalen"* — a better reason than the
one the proposal gave), and yes to the timelapse. The third carried two corrections with it: a
visitor's media strip cannot be read off a file list the role does not get, so its entries are a
field of the print for every role; and the only route that served those bytes was the download
route, so viewing had to be separated from downloading rather than the rule bent. GAP-174 also
settled a contradiction of our own making — §5 of ScreenShareSession said a visitor's card has *no
meta line* while the same export proposed putting two facts on it; the sentence is withdrawn.
**One thing is designed from scratch:** where a print lives on disk comes back to the operator's
page as a **path** (**GAP-182**), which is a different fact from the row GAP-176 removed and is
shaped like one. Three small ones close with it, and the previews, the READMEs and this file stop
carrying four names that are real folders in the owner's library. Version 2.15 follows below.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-173 | Role User's nav still offers API-docs | **Behind the same role check as Facturen — and the check is the route guard, not only the menu.** The app builds its routes from the same list, so `/api-docs` sends a User to the dashboard instead of leaving a page that is hidden but reachable. A role's page is removed or it is not; "removed from the nav" is not a third state. Role User's nav is Dashboard and Openstaand | **resolved** |
| GAP-174 | Materiaal and Gewicht for a klant — and `ScreenShareSession` §5 says a visitor's card has "no meta line" while the same export proposes putting them on it | **The line stays, the sentence goes.** A klant's card carries `.pp-meta` with **two items, Materiaal and Gewicht**, and the reduced "Deze print" gains the same two rows after Datum. **Tijd stays out** (a klant cannot check machine time and it only means something next to a cost) and so does the order count (the owner's bookkeeping; GAP-170 already gives this role one amount). The rule §5 was reaching for survives in a better form: a klant's card carries what a klant is paying for and nothing about the workshop | **resolved** |
| GAP-175 | The timelapse in a visitor's media strip | **In, for every role, as one control — and two things the entry did not foresee are now spec.** (1) The strip's entries are **a field of the print, not the file list**: this role has no files card, so a strip read off one would be empty for exactly the role the owner just opened it to. (2) **Viewing is not downloading:** the video is served inline and seekable and a visitor's print page carries no download affordance anywhere, which is why the app's new view-only route is the right shape and opening the download route to role User would not have been. The network-tab threshold of ScreenShareSession §1 is unchanged and no copy claims the file is protected | **resolved** |
| GAP-176 | (not reopened) | **Stays resolved and stays built.** GAP-182 is a different row with a different value; what changes on the operator's card is that the conditional *Project* row is replaced by the path, because two rows about where a print lives is the fault GAP-176 was about | **merged into GAP-182** |
| GAP-179 | PaymentPanel still specifies a *Rol User* state that GAP-170 took off the page, and `pay.userNote` has no caller | **Struck in place in three spots** (anatomy, states list, the 2.14 section), nothing rewritten — 2.14's reasoning about what may be said to a klant is still the rule that keeps the header line wordless. **`pay.userNote` is retired, not removed:** it stays in `copy-deck.md` with its string under *Retired in 2.16* so nothing breaks and nobody re-invents the sentence; the app should stop rendering it. The operator's panel is untouched | **resolved** |
| GAP-180 | The guest head is one height up to 29 characters of studio name and 32px taller from 30: the bar wraps before the brand shrinks | **`flex: 1 1 0` on `.pp-guesthead > .pp-brand` in the phone block, with its `.pp-device.phone` twin.** 2.15 gave the brand its ellipsis and never made it the item that gives way, so a content-width item with `margin-right:auto` took the whole first line and pushed the exit button down. One declaration finishes what GAP-172 wrote | **resolved** |
| GAP-181 | `.pp-drawer a:focus-visible` is the last of the four places GAP-177 names, still drawing Chromium's own ring at 2.86:1 in dark | **The rule is written: `outline: 2px solid var(--focus-ring)` at a 2px offset**, the sidebar's form, because the drawer has `space-2` of side padding and an outset ring is not clipped. GAP-177 said "the sidebar, the drawer, the bottom bar and the guest head" and shipped three selectors; this is the fourth, and it is the whole menu on a phone | **resolved** |
| GAP-182 | The owner wants the project folder back on the operator's print page, as a path | **A row `Map` at the foot of "Deze print": one mono string, `klant / project`, `muted` separator, new class `.pp-path`, new key `print.folder`.** One path, not two facts — it is an address he reads to find the folder. **Always drawn when the print has a folder, including the 84 of 84 whose tail equals the print name**, because the value is not the heading again: it carries the klant level and the **literal spelling** of both folders, where the comparison that hides *Project* is a squashed one (case, spaces and punctuation ignored). Text, selectable, **no copy button and no link**. No project folder: the klant folder alone. No folder at all (a typed request): `print.folder.none` **"Nog geen map"** in `muted`, not in mono. **Role User and a visitor never see it** — the library's shape is the workshop's. It **replaces** the conditional *Project* row on this card | **resolved** |
| — | **The fixture names** (the app's §4, asked three rounds running, no gap id) | **Done, and it is the whole tree, not the previews only.** Three klant names and one print name that are real folders in the owner's library are replaced everywhere in `project/` — in previews, READMEs, the copy deck, this changelog and `README.md`'s *Sample values* — by **Koen, Esmee, Veerle** and **Bloembak clips**; **62 files**. The owner's own name is no longer one of his own customers either: the klant called "Rick" becomes **Algemeen**, a folder name this system already uses as the fourth column of AccessMatrix, so no new name enters the system and ScreenAccess and AccessMatrix now agree. `Anouk` and `Bas` were already in use and stay | **resolved** |
| — | A klant whose folder was gone stayed a klant (the app's §5; `CustomerCard` 2.13 §2) | **No spec change, as the round says.** The measured sentence was true of the design and not of the app, and the app is fixed. Recorded here so the next reader of §2 knows the sentence was checked rather than assumed | **confirmed as built** |

## New and changed

- **Tokens:** none. `tokens.json` `version` is **2.16**. No token added, renamed, changed or
  removed, and no `usage` string is touched.
- **New classes** `.pp-path` (and `.pp-path .sep`). **Changed classes** (all in `bundle.css`):
  `.pp-guesthead > .pp-brand` in the phone block and its `.pp-device.phone` twin (`flex: 1 1 0`),
  `.pp-drawer a:focus-visible` (new rule). **No class is removed and nothing is renamed.** The
  classes the new markup uses and that already existed: `.pp-kv.tight`, `.pp-meta`, `.pp-models`,
  `.pp-modelbtn`, `.pp-modelbtn.video`, `.pp-model-cap`, `.pp-fname`, `.pp-ph`, `.pp-badge`,
  `.pp-money`, `.pp-text-xl`.
- **Copy** `print.folder` ("Map"), `print.folder.none` ("Nog geen map") — both added to
  `copy-deck.md` under *Added in 2.16*. **Retired:** `pay.userNote`, kept in the deck with its
  string under *Retired in 2.16*; it is not removed and nothing is renamed.
- **Components changed:** ScreenPrintDetail (README, preview), ScreenShareSession (README,
  preview), PrintCard (README), ModelPicker (README), VideoPlayer (README), AppShell (README),
  ScreenApiDocs (README), PaymentPanel (README, preview).
- **Screens changed:** the operator's print page ("Deze print" loses the *Project* row and gains
  `Map`); a visitor's and role User's print page (two more facts in the card, the timelapse in the
  strip); a visitor's Prints (a two-item meta line on every card); role User's nav and routes (no
  API-docs); the phone's guest head (one height at every name) and the phone drawer (a visible
  focus ring).
- **Pages changed:** `README.md` (*Roles*, *Sample values*, the version note), `copy-deck.md`,
  `changelog.md`, `tokens.json`, and 62 files for the fixture names.
- **Contrast report: no new pair, so `contrast.md` is unchanged.** `.pp-path` is `text-strong` on
  `surface` with a `muted` separator, and both pairs are already in the report (6.84 / 6.03 for
  `muted`; `text-strong` on `surface` well above it). The focus ring on `surface` is in it too.
- **Breaking changes: none.** No token, class or key is removed or renamed. Six obligations are
  added to the app, and it has already built the first three: put API-docs behind the role check
  **and the route guard**; render Materiaal and Gewicht for role User and a visitor (card meta line
  and "Deze print"); render the timelapse in the strip from the print's own field and never a
  download link for that role; **stop rendering `pay.userNote`**; add `flex: 1 1 0` and the drawer's
  focus rule from `bundle.css`; and draw the `Map` row — which also means **removing** the
  conditional *Project* row from the operator's "Deze print".

## The one that was designed rather than written down: GAP-182

GAP-176 removed a row labelled *Project* whose value was the `<h1>` again on 84 of 84 prints, and
it took with it the last mention of where a print lives on disk. That was the right removal and the
wrong consequence, which is a normal way for a system to be wrong: the row was answering a question
("which folder is this?") in a form that could not answer it.

**Why a path and not two facts.** He reads it to find the folder. A labelled *Klant* row and a
labelled *Project* row make him reassemble the address himself, and the card already has a *Klant*
row for the other purpose. One value, one label, mono — the family this system has used for file
names, G-code names and paths since 1.0, so it reads as an address rather than as a sentence.

**Why it is drawn even when the tail equals the name.** This is the question the whole gap turns
on, and the answer is not the same as GAP-176's because the value is not the same. The comparison
that hides *Project* is `squashName`, which the owner confirmed ignores case, spaces **and**
punctuation: `Bloembak clips` and a folder called `bloembak_clips` are "equal" to it and are two
different strings on disk. The path is the only place in the portal where the literal spelling of
both folders is readable, and a row that appears on some prints is a row you have to look for.

**Why the klant never sees it.** The reduced card already refuses the folder name inside Bron
(2.14), the klant's empty state was written so a klant is not told about folders
(`session.prints.emptyBody`, 2.14), and `queue.add.customerHelp` says the portal reads `/prints`
and never writes it. The tree is the workshop's shape. A klant reads a print.

**What I did not do.** No copy button on the row (the card is facts; a control there is a third
job for it), no link (the portal cannot open his file manager and should not pretend), and no path
on the card, the row or the queue — the subtitle there is `klant / project` already and has been
since GAP-072.

# Changelog 2.15

**The owner used the thing and found the one fault no measurement was looking for**, and it turned
out to be a sentence this system has carried since 1.0 rather than a mistake in building it. He
walked the merged deel-link session, passed the Overzicht, the Prints list and a print, and stopped
at the head bar: *"het is niet duidelijk genoeg dat je ook naar prints kan gaan"*. It was built
exactly as ScreenShareSession 2.14 specified — `primary-tint`/`text-strong` on the item with
`aria-current="page"`, the pair `.pp-nav a[aria-current=page]` has used since 1.0 — and that pair
dresses **only the destination you are already on**. In a sidebar that is enough; in a bar of two
items it leaves the screen the visitor has never seen with no ink at all. **The nav is a track
now**, both items inside one `border-strong` boundary, and the pill idiom is borrowed **without**
its ARIA: these are routes, so they stay links. Ten more gaps come with it, one of them the
system-wide question the app attached to it: `--border` cannot draw a boundary that carries meaning,
in this head bar or anywhere else. Version 2.14 follows below.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-166 | ScreenPrintDetail says "no tags" for role User while ScreenShareSession publishes the same question as a proposal and names 1.4 as standing | **The strict half wins: role User sees no tags, anywhere** — not in a print's header, not on a card, not as a filter. The owner's own answer to GAP-129 settles it (he does not use tags at all), so there is no case in this library where his filing word helps a klant. 1.4's "name, price, status, thumbnail, 3D model **and tags** only" is superseded and marked so in place, and role User's print page is now exactly a visitor's — one reduced form instead of two that drift | **resolved** |
| GAP-167 | ScreenQueue's README lost its whole `## 2.12` section in the 2.14 export, with three sentences reverted to their 2.11 wording, while `bundle.css` kept every 2.12 declaration | **Restored, verbatim, and 2.11's shape was not right after all.** The `.ttl` block's second muted line with an empty `.amt` (GAP-155), 44px row actions made true in `bundle.css` (GAP-156), and the rule against an `aria-label` that repeats the summary's own visible text are all back, plus the *Tokens* sentence that claimed no CSS change. The app changed nothing and was right not to | **resolved** |
| GAP-168 | 2.14's GAP-163 rules are correct and reach nothing: the trigger sits in the `.pp-lift` wrapper rule 9 requires, which sets no `min-width`, so `max-width: 100%` resolved against a content-width flex item — 28px outside the card after the import | **`.pp-lift { min-width: 0 }`, one declaration on the wrapper.** Not a fourth selector naming `.pp-lift` in the GAP-163 rules: *every* window-placed panel in this system has a `.pp-lift` wrapper by rule 9, so they all had the same hidden floor. The app's `pp-minw-0` on the wrapper was the right fix with the wrong owner and **can come off** | **resolved** |
| GAP-169 | The guest head marks where the visitor is and never that the other screen exists; built to spec, found by the owner, on the one screen whose user visits once | **Shape 1's clarity with 1.0's ink: `.pp-guestnav` is a pill track** (`surface-2`, `radius-pill`, `1px solid var(--border-strong)`, 2px padding) holding both items, the current one a `primary-tint` pill. **The links stay links** — `<nav aria-label>` with `<a aria-current="page">`, never `aria-pressed`, `role="group"` or `role="tablist"`: that is the blessing the app asked for and it is explicit in three files. `.pp-seg` is **not** reused (its `surface` selected pill would vanish into a `surface` head bar), `.pp-tabs` is rejected (an underline plus `muted` text is 2.14's defect with a thinner line), and the approved outline-on-both placeholder can go — measured, its hairline is 2.94:1 against the current item's own tint in dark | **resolved** |
| GAP-170 | The whole payment card is below the fold on a visitor's print page at 390×844, badge 89px under it, while the status is already on screen at y=201 | **The payment becomes one line in the header badge row** — status badge plus amount, wrapped together so they stay a pair when `.pp-ph` wraps — and `pp-card pp-pay` is **not rendered for role User or a visitor**. The card repeated a visible fact and added one number for 98px below the fold. The operator's PaymentPanel is untouched, and the pairing is the one the Overzicht's own lines have used since 1.0 | **resolved** |
| GAP-171 | Does a visitor's Prints need a search field now that the largest klant has 36 prints and the screen pages at 24? | **Rejected (the distribution, not the maximum, decides a permanent control).** My 2.14 conditional fired on 36 — and eleven of the twelve klanten have ten prints or fewer, so the field would be chrome in eleven sessions of twelve, which is what the "no FilterBar" decision refused on this screen. It would also search the owner's folder names, which a klant has never seen. Newest first answers *is my print done* without a control. Overturned by a klant list past about 60 prints, or by a klant asking him where a print is | **rejected (chrome for eleven of twelve klanten; the words searched are the owner's, not the klant's)** |
| GAP-172 | The guest head is 121px at a 16-character studio name, 153px from about 20 (the exit button leaves the first line) and 177px at 48 (the brand wraps too) | **At 480px and below the head is one height at every name length.** The brand keeps one line and ellipsises when it must — the full name stays in the DOM, so nothing is lost to a screen reader, and a long name is drawn whole by uploading a logo — and the exit button becomes icon-only, `--pp-tap` square, named by its own visually hidden `<span class="lbl">`, the way the icon rail has named its footer buttons since 1.0. The ConfirmDialog still says the act in words. Above 480px nothing changes | **resolved** |
| GAP-173 | Role User's nav still offers API-docs (2.14 raised it as a proposal with no id) | Numbered so it can be tracked, and **still the owner's**. My opinion is unchanged — a klant has nothing to call — but ScreenApiDocs is explicit that the page needs no credential because *"de documentatie gebruikt je sessie"*, so a User's own session works on it, which is a reason he may have meant to give it. **Do not build it** | **proposed, needs your confirmation** |
| GAP-174 | Materiaal and Gewicht in a visitor's "Deze print" card and card meta line | Numbered, unchanged, **his call**: it is a decision about what a klant reads. The invoice already prints Gram, so it is defensible; *Tijd* stays out either way. **Do not build it** | **proposed, needs your confirmation** |
| GAP-175 | The timelapse in a visitor's media strip | Numbered, unchanged, **his call**: 60% of prints have one and it is a film of the klant's own print, but it is also a surface no customer has ever had, and the network-tab threshold applies to it as to the model. Until he says yes: models only, which the app has now made true in the data rather than in the view. **Do not build it** | **proposed, needs your confirmation** |
| GAP-176 | The operator's "Deze print" card draws Project unconditionally, repeating the `<h1>` on 84 of 84 prints in this library | **One condition for every role: Project is a row only when it differs from the print name, case and spaces ignored (GAP-072).** GAP-095 specified this card before GAP-072 existed; a fact identical to the heading above it is not a fact. The reduced card already had it (GAP-158), and the breadcrumb has had it since 1.9 | **resolved** |
| GAP-177 | `.pp-nav a`, `.pp-bottomnav a` and `.pp-guestnav a` are plain links and appear in none of `bundle.css`'s focus-visible selectors, so the shell's only keyboard cue was the browser's own ring | **The ring is the token's on every nav link**: `2px solid var(--focus-ring)` at a 2px offset in the sidebar and drawer, `-2px` inside the bottom bar and inside the guest nav's track, where an outset ring is clipped by the bar's edge. `tokens.json` has said "every interactive element" since 1.0 and these were the exception — and a missing focus ring is the one thing axe cannot report | **resolved** |
| GAP-178 | A session's Prints pages at 24 while the Overzicht one tap away lists every print of the klant | **The page boundary goes: a visitor's Prints renders the klant's whole list**, newest first, with no "Meer laden" and no "{shown} van {total} prints". ScreenShareSession's own rule is that the two screens never disagree about which print is the last one, and a page size of 24 against a klant with 36 is exactly that disagreement. One klant's prints are a bounded set; if the Overzicht ever has to be paged, both get it in the same round. The operator's dashboard is unchanged | **resolved** |
| — | **`--border` for boundaries that carry meaning** (the app's §7.2, no gap id of its own; decided inside GAP-169 and system-wide) | **Both tokens keep their values and their names. The rule gets a name and three selectors change.** `border` is a hairline between content and content (1.37:1 dark, 1.42:1 light on `surface` — a divider has no ratio to meet); `border-strong` is every boundary that identifies a control, its extent or one of its states (3:1 or more on all three grounds, both themes). The test is what the line is doing, not what the element is called. Changed: **`.pp-seg`** (track), **`.pp-modelbtn`** (resting edge, with its hover cue moved to `surface-2`), and the guest nav, which 2.14 built with `border`. **Not changed, deliberately:** `.pp-tabs`' rail (a divider; the selected tab is `primary` text and a 2px `primary` underline), `.pp-badge.neutral`, `.pp-progress`, `.pp-cust`, `.pp-order`/`.pp-ogrp` summaries, `.pp-viewer`, `.pp-video`, `.pp-plate`, `.pp-share-thumb`, `.pp-scroll`, `.pp-filters` and every card, dialog, popover, divider and chrome edge | **resolved** |

## New and changed

- **Tokens:** none. `tokens.json` `version` is **2.15**. No token added, renamed, changed or
  removed. Two `usage` strings are rewritten — `border` and `border-strong` — because the rule they
  carried was an example list (*"input, checkbox, radio, toggle"*) and two controls outside that list
  were drawing their only boundary in `border`.
- **New classes** `.pp-guestexit`. **Changed classes** (all in `bundle.css`): `.pp-guestnav` (the
  track), `.pp-guestnav a` (centred, `radius-pill`, equal halves at phone width),
  `.pp-guestnav a:focus-visible` (new rule), `.pp-guesthead > .pp-brand` (one line at 480px and
  below), `.pp-seg` (`border-strong`), `.pp-modelbtn` (`border-strong`), `.pp-modelbtn:hover`
  (ground instead of border), `.pp-lift` (`min-width: 0`), `.pp-nav a:focus-visible` and
  `.pp-bottomnav a:focus-visible` (new rules). Every phone rule has its `.pp-device.phone` twin, as
  2.11 requires. **No class is removed and nothing is renamed.**
- **Copy:** none. No key is added, changed or removed, so `copy-deck.md` has no *Added in 2.15*
  section. "Sessie afsluiten" keeps its key and its words; what changes on the phone is that the
  words are visually hidden inside the button instead of being dropped.
- **Components changed:** AppShell (README, preview), ScreenShareSession (README, preview),
  ScreenPrintDetail (README), ScreenDashboard (README), ScreenQueue (README — the restoration),
  SegmentedControl (README), Tabs (README), ModelPicker (README), Popover (README), SpoolPicker
  (README), ScreenSharePage (README — one key name).
- **Screens changed:** the guest head bar in every frame that draws it (the nav is a track, the exit
  button carries `.pp-guestexit` and a `.lbl`); a visitor's print page (the payment is a header line
  and the "Betaling" card is gone); a visitor's Prints (no page boundary); role User's print page
  (no tags); the operator's "Deze print" (Project only when it differs).
- **Pages changed:** `README.md` (*Colour*, *Roles*, two rules, the version note), `do-dont.md`,
  `contrast.md`, `changelog.md`, `tokens.json`.
- **Contrast report:** one new ground pair (`text-strong` on `primary-tint` over `surface-2`: 10.02
  dark, 12.16 light) plus the rows that record what `border` measures, what the three moved
  boundaries measure, and what the placeholder outline measured. All pass; the only value under 3:1
  in the section is the placeholder's, which is why it is not the shape that shipped.
- **Breaking changes: none.** No token, class or key is removed or renamed. Five obligations are
  added to the app: give the exit button `.pp-guestexit` and a `<span class="lbl">`; stop rendering
  `pp-pay` for role User and a visitor and put the amount beside the header badge; stop rendering
  tags for role User; drop the page boundary on a session's Prints; and apply the Project comparison
  on the operator's "Deze print". Two things come **off**: the `ds-gap: GAP-169` marker with its
  outline, and `pp-minw-0` from the spool trigger's wrapper.

## GAP-169: why a track, and why it is not a SegmentedControl

The app offered the owner three shapes and he took the dullest as a placeholder, which was the right
way round: a placeholder should be the one you least mind living with. The shape that ships is the
first one, with one change.

**What the defect actually is.** Not "the current item is too quiet" — the current item is the only
thing that is loud. The visitor sees one filled pill reading "Overzicht" and the word "Prints" in
body text beside it, between a brand and a ghost button, and reads the pill as a **heading for the
page**. Nothing in the bar says *there are two of these*. That is why raising the other item's
contrast would not have fixed it either: the fault is that the **set** is invisible, not that one
member is.

**So the track is the fix and the filled pill is the detail.** One boundary around both items makes
them the same kind of thing and bounds the set; the tint inside it says which one you are on. That
is exactly what `.pp-seg` is for — "two to four exclusive views, pick one" — and it is what the app
called the clearest of the three.

**One change from `.pp-seg`, and it is about this surface.** A segmented control marks its selection
with a `surface` pill on a `surface-2` track. The guest head's own ground **is** `surface`, so that
pill would be the same colour as the bar it sits in and the selection would be left to `shadow-sm`.
The current item therefore keeps 1.0's current-page pair, `primary-tint` with `text-strong` — which
also keeps the whole session on colours the report already approves, with one new composite
(`text-strong` on a tint over `surface-2`, 10.02 / 12.16).

**And the ARIA does not travel.** The app wrote *"we are not reusing a button pattern for navigation
on our own"* and that instinct is the one worth writing into the system: a pill track is a visual
idiom, `aria-pressed` is a claim about what the control is. These two items change the URL, so they
are links with `aria-current="page"` inside one `<nav aria-label="Hoofdmenu">`. No `role="group"`, no
`role="tablist"`, no `<button>` that navigates. They also keep their own class, `.pp-guestnav`,
rather than borrowing `.pp-seg`'s — one CSS block each, so a future change to the dashboard's view
switch cannot silently restyle a klant's navigation.

**The placeholder's own number, which decided the last detail.** An outline around **each** item
puts that hairline against the current item's `primary-tint` ground on the inside: **2.94:1 in dark**
(3.50 light), under the 3:1 the same argument used to reject `--border`. Its outer edge is on
`surface` and passes, so it was not a failure — but a shape that needs one border instead of two,
with both of its edges clear in both themes, is the better answer on the numbers as well as on the
drawing.

## The `--border` question, answered once

The app asked for a system-wide decision rather than a per-component one, and it is right that this
is bigger than the head bar. The answer is not a new token and not a new value:

**`border` is a divider. `border-strong` is a boundary that carries meaning.** A divider has no
contrast requirement — 1.4.11 is about the information a boundary carries, and a line between a
table row and the next one carries none. The moment a line is the only thing telling you where a
control is, how far it reaches, or which state it is in, it needs 3:1 and takes `border-strong`.

**Why two selectors were wrong and are now fixed.** `.pp-seg`'s track was the only thing bounding
that control: its selected segment is `surface` on `surface-2`, two grounds **1.13:1** apart, so with
a 1.4:1 track the control had no perceivable edge at all and the selection rested entirely on text
colour and a shadow. `.pp-modelbtn` is an `aria-pressed` button on its own `surface` ground whose
resting edge was that same hairline; its hover cue *was* `border-strong`, which is now its resting
state, so hover moves to the ground (`surface-2`, the hover `.pp-btn-secondary` has had since 1.0)
and the three states stay three.

**Why `.pp-tabs` is deliberately not in that list.** Its `border-bottom` divides the tab row from the
panel under it, and the component's state is drawn in `primary` — a 2px underline and the label's
colour, 6.79 dark / 5.66 light on `surface`. Remove the rail and you can still see which tab is
selected; remove `.pp-seg`'s track and you cannot see that there is a control. That is the test, and
it is now in `README.md` *Colour*, in `do-dont.md` and in both tokens' `usage`, so the next reader
does not have to re-derive it from an example list.

**Everything else that uses `border` stays**, and the list is in the table above so you can grep for
it rather than guess: cards, dialogs, popovers, alerts, panels, row and cell dividers, the page
chrome's edges, media frames, the neutral badge, the progress rail, the klant tile (whose control is
the heading link inside it), and the `<details>` summaries of an order and a group (whose control is
the heading and the chevron).

## What I rejected

- **The search field for a visitor's Prints** (GAP-171), on the distribution rather than the
  maximum: eleven of twelve klanten have ten prints or fewer.
- **`.pp-tabs` for the guest nav**, and `.pp-seg` reused literally: the first is 2.14's defect with a
  thinner line, the second puts a `surface` pill on a `surface` bar.
- **Keeping the outline-on-both placeholder**, whose inner edge is 2.94:1 in dark against the current
  item's own tint.
- **A fourth selector naming `.pp-lift` in the GAP-163 rules** (GAP-168): it would have fixed the
  spool trigger and left the same floor under every other panel wrapper in the system.
- **Changing `--border`'s value, or renaming either token.** The values are right for what they are;
  what was wrong was two selectors and a rule written as a list of examples. Raising `--border`
  would have put a heavier hairline on every card, table row and divider in the app to fix two
  controls.
- **Tags for role User** (GAP-166), and with it my own 2.14 proposal to keep the question open: the
  owner answered the underlying question in GAP-129 and there was nothing left to ask him.

## What I want measured

1. **The guest head's two heights with the track in place**, at 360px and 1400px, both themes: I
   expect about **127px** and **67px** where you measured 121px and 61px, because the track adds 1px
   of border and 2px of padding on each side of the nav's own line. If it is more than that,
   something else in the head is growing and I want to know before it is called a design.
2. **The head at your five studio-name lengths again** (16, 20, 30, 33, 48 characters) at 360px: it
   should now be **one** height at all five, with the brand on one line and the exit button a
   `--pp-tap` square. And the character count at which the ellipsis starts, which I have not
   computed.
3. **A visitor's print page at 390×844 after GAP-170**: the y of the amount beside the `<h1>`, and
   the page height now that the card is gone. The fold is 844; I expect the whole page to end around
   860 and "Deze print" to be the last thing on it.
4. **The largest klant's Prints with no page boundary**: 36 cards at 360px — the page height, whether
   the thumbnails still load lazily, and whether anything about it feels worse than one "Meer laden".
   This is the one decision this round that trades a click for a scroll, and the scroll is the part I
   have not seen.
5. **Keyboard focus on every nav link** in the sidebar, the drawer, the bottom bar and the guest
   track, both themes, after GAP-177 — specifically whether the `-2px` ring inside the track is
   clearly visible on the current (tinted) item as well as on the other one.
6. **Still owed, unchanged:** whether design jobs dominate the queue (GAP-143's overturning
   measurement), the age thresholds on a queue row (GAP-145, still 30/90 borrowed from money), and
   how often a Wachtrij group carries no "waarvan" line at all.

## Where I was unsure

- **The ellipsis on a studio's name.** On the phone a long company name is now cut, and a company
  name is not a label — it is the only thing on that screen that says who made the print. The
  alternatives were a head that is 177px on a 844px phone, or two lines at some name lengths and one
  at others, which is the thing 2.12 refused for a different reason (*one block order, phone and
  desktop*). I took the fixed head and said out loud that the logo is how a long name is drawn whole.
  If the owner disagrees, the rule is one media query.
- **The icon-only exit button.** Hiding words is something this system does in the icon rail and
  nowhere a klant goes, and this is the first time a visitor meets an unlabelled control. It is
  `log-out`, it is the only button in the head, and it opens a ConfirmDialog that spells the act out
  before anything happens — but if a klant ever closes a session by accident, this is where it
  happened and I would rather hear that than defend it.
- **Removing the "Betaling" card for a visitor** rather than moving it above "Deze print". Moving it
  keeps a heading that says the word "Betaling", which has some value on a page about money; it also
  keeps a card whose content is two facts, one of which was already in the header. I took the
  removal because the Overzicht is where paying happens and this page's job is the print — but the
  amount is now the only thing on this page that is about money, and if that reads as thin on a real
  phone, the card comes back above the card of facts and not below it.
- **Giving ids to things that were proposals.** GAP-173, GAP-174 and GAP-175 are numbered here and
  deliberately **not** decided, so they can be tracked instead of being rediscovered every round.
  If your register wants its own numbering for those, renumber them and tell me; what matters is that
  they stop being four nameless paragraphs.
- **GAP-176, the operator's Project row.** I decided it on your measurement (84 of 84) and on
  GAP-072's rule, and it is the one change this round that touches a screen the owner uses daily
  without him having asked. It removes a row that repeats the page's own title; if he liked that row
  as a check that a print is filed in the right project folder, say so and it comes back — with the
  folder named, which is at least a different fact.

# Changelog 2.14

**A deel-link stopped being a page you send and became a key, and that is one decision with five
designs hanging off it.** The owner used a share link and said *"leuk, maar niet wat ik had
verwacht"*: he expected the klant to **walk through the portal**, not to read "een karig overzicht
van zijn prints". The portal already does what he expected — role **User** has been read-only by
construction since 1.1, no cost and no notes — so the only thing between the klant and his
expectation was a login. A valid token now mints an anonymous read-only session for one klant, the
visitor uses the **real** screens, and this round draws the five things that did not exist: the
shell for someone with no account, what the nav offers, where the link's own facts live, what
happens when the link dies mid-visit, and what becomes of the page he was sending. Four of those
five are mostly **subtraction**, which is the point: a second audience should cost one shell, not a
second portal. Beside it, three carried-over gaps are settled, one of them by refusing the shape the
app had to improvise. Version 2.13 follows below.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-157 | The "Aanvraag toevoegen" dialog has no anatomy, and two published components say it carries their fields | **Drawn, after two postponements that were one too many.** New component **AanvraagDialog**: Naam (focus), **Klant as a combobox that accepts a klant who is not a folder yet**, Status (the two queue states, default *Nog niet besloten*), and the optional **Bron** and **Notitie** that PrintSource and PrintNote have pointed here since 2.11. **No Project** (a folder level the indexer reads — a name typed here has to keep agreeing with a folder nobody has made), **no price** (a quote is not a thing this system has), and **no "Niet doorgegaan" / "Geen status" at birth** (a fileless record with either is in no list on any screen). A form dialog, so no backdrop close; failure keeps everything typed | **resolved** |
| GAP-158 | No reduced "Deze print" card for role User; the shape the app built is undesigned | **Anatomy instead of a clause**, and GAP-165 makes it a klant's main screen. `pp-kv tight`: **Klant · Project (only when it differs) · Datum · Bron (when there is one, read-only, no chip)**. No spool row, no note, no missing-files line, no `pp-lacks`, no "⋯", no file list; the payment is a **state** (badge and amount), not a form. A card of two rows is still a card | **resolved** |
| GAP-159 | "Geen status" as the ending; the app had to improvise a third action on a queue row drawn with two | **The third button is refused and the ending is written down.** Absence is a **value**, not an operation (GAP-138, the owner's own decision, and `do-dont.md`'s own line). "Status wijzigen" offers four values on a row **with files**; on a row **with no files** it offers the two queue states plus the ghost **"Aanvraag verwijderen"** below a hairline, because this page is the only place a fileless record appears and the other two values would leave it alive in the database and absent from every screen | **resolved** |
| GAP-163 | The spool trigger clipped 32px by `.pp-card.pp-flush` at 360px, measured and logged, not patched | **The 200px floor is lifted at 480px and below and the name takes the middle cut** this file already specified as the rule: `min-width: 0; max-width: 100%` inside a file row's band, the name wrapped in `span.nm.pp-fname sans` (`.a` the head, `.b` the **last word** — a spool is identified at both ends), the swatch, chip and chevron keeping their width. **Rejected:** wrapping the trigger to two lines (it undoes GAP-111's row agreement and makes a 44px target 68px) and scrolling the card's rows sideways (this system scrolls tables, not cards, and a scroll that hides a control is worse than a cut name) | **resolved** |
| GAP-164 | One sentence, two keys: `settings.payLink.noIban` in the deck, `settings.customer.payLink.only` in ScreenSharePage's prose | **The deck's key is the key.** The name in ScreenSharePage was never in `copy-deck.md` and is withdrawn from that file; the app has it right at both call sites and changes nothing. My mistake, and the second time this file has invented a key name in prose (GAP-088 was the first) | **resolved** |
| GAP-165 | A deel-link should let the klant into the portal — five things that do not exist | **All five decided.** (1) **The shell:** `.pp-app.guest`, a head bar with the studio, two destinations and "Sessie afsluiten"; no avatar, no role name, no theme control, no "Uitloggen", no live dot, no drawer, no rail, no bottom bar. (2) **The nav:** **Overzicht** and **Prints** — API-docs rejected (a klant has nothing to call) and **Openstaand rejected** (one klant's version of that question is the "Alleen openstaand" switch, next to the totals and the IBAN). (3) **The link's facts stay on the Overzicht; the persistent bar is rejected**, and the expiry notice becomes `warning` at 0 or 1 day. (4) **Mid-session death ends at the visitor's next action**, on the same single page every dead link shows — the 1.6 rule untouched — drawn **without** the shell; no timer, no countdown. (5) **ScreenSharePage survives as the session's landing screen**, minus the studio head that moved into the shell. New component **ScreenShareSession** holds the whole account | **resolved** |

## New and changed

- **Tokens:** none. `tokens.json` `version` is **2.14**. No token added, renamed, changed or removed.
- **New classes**, all in `components/bundle.css`, **fifteen selectors, nothing changed and nothing removed**:
  `.pp-app.guest`, `.pp-app.guest > .pp-main`, `.pp-guesthead`, `.pp-guesthead > .pp-brand`,
  `.pp-guesthead .pp-logo`, `.pp-guestnav`, `.pp-guestnav a`, `.pp-guestnav a:hover`,
  `.pp-guestnav a[aria-current=page]`, the phone rule `@media (max-width:480px){.pp-guestnav, .pp-guestnav a}`
  and its twin `.pp-device.phone .pp-guestnav`, `.pp-device.phone .pp-guestnav a` (GAP-165); and
  `.pp-fname.sans`, `.pp-spoolbtn > .nm`, the phone rule
  `@media (max-width:480px){.pp-asset .acts .pp-spoolbtn, .pp-asset .acts .pp-minw-200}` with its
  `> .pp-hintchip` pair, and the matching `.pp-device.phone …` twins (GAP-163).
  **No existing declaration is touched.** The GAP-163 rules name **both** class names a trigger is
  built with (`.pp-spoolbtn` in AssetListItem, `.pp-minw-200` in SpoolPicker's own preview), so the
  fix does not depend on which one the app wrote.
- **Copy:** **28 new keys**, none changed and none removed, all in `copy-deck.md` under *Added in 2.14*.
  `session.nav.overview`, `session.nav.prints`, `session.prints.title`, `session.prints.empty`,
  `session.prints.emptyBody`, `session.exit`, `session.exit.confirm`, `session.exit.confirmBody`,
  `session.exit.ok`, `session.ended.title`, `session.ended.body`, `share.revoke.body`,
  `queue.add.name`, `queue.add.namePlaceholder`, `queue.add.nameError`, `queue.add.customer`,
  `queue.add.customerPlaceholder`, `queue.add.customerNew`, `queue.add.customerHelp`,
  `queue.add.customerError`, `queue.add.status`, `queue.add.submit`, `queue.add.error`,
  `queue.added`, `queue.statusHelp.fileless`, `queue.remove`, `queue.remove.confirm`,
  `queue.remove.confirmBody`.
  **Reused rather than duplicated:** `queue.add` (the dialog's title and the button that opens it),
  `common.cancel`, `common.close`, `common.delete`, `queue.group.notDecided`,
  `queue.group.inProgress`, `customers.printCount` (the klant list's meta line, zero arm included),
  `print.source*`, `print.note*`, `share.notFound`, `share.askNew`, `share.expiresToday`,
  `share.expiresTomorrow`, `pay.userNote`, and **`bulk.statusNone`** for "Geen status" in the queue's
  picker — the name is wrong for that call site and a third key with the same three words would be
  worse; collapsing `bulk.statusNone` and `invoices.noStatus` into one `status.none` is a rename and
  therefore 3.0's, written down in the deck rather than done quietly.
- **New components:** **ScreenShareSession** (README + preview: the landing at 980px, the landing at
  360px on its last day, Prints at 360px, one print at 980px, the empty klant, and the two endings)
  and **AanvraagDialog** (README + preview: empty, the klant list open, a missing name, a failed
  save, saving, and the 360px sheet).
- **Components changed:** AppShell (README + preview), ScreenSharePage (README), ScreenShareLinks
  (README), ScreenDashboard (README), ScreenPrintDetail (README), PaymentPanel (README + preview),
  SpoolPicker (README), ScreenQueue (README).
- **Screens changed:** the share page keeps its column and loses its studio head to the shell; the
  dashboard and the print detail gain a visitor form; the queue's primary button finally has a
  dialog behind it.
- **Pages changed:** `README.md` (*Floating panels* — rule 9's focus contract scoped, *Three rules
  this round wrote down (2.14)*, *Roles*, the Iconography table gains `list`, *Versie 2.14*),
  `changelog.md`, `copy-deck.md`, `do-dont.md`, `tokens.json`.
- **Contrast report: no new pair, so `contrast.md` is unchanged.** Everything new is `surface` with a
  `border` rule, `primary-tint` under `text-strong` for the current nav item (the pair
  `.pp-nav a[aria-current=page]` has used since 1.0), and `warning` on `warning-tint` in a badge that
  already exists. The 2.13 under-3:1 row (the chip's dashed edge on a selected option in the dark
  theme) stays recorded and unchanged, as the app left it.
- **Breaking changes: none.** Three markup obligations are added: `div.pp-app.guest >
  header.pp-guesthead` with `nav.pp-guestnav` for a session (new markup, nothing replaced); the spool
  trigger's name wrapped in `span.nm.pp-fname sans` with `.a` and `.b` (the app splits the string, as
  it already does for file names); and `.pp-dialog` for AanvraagDialog, which is the dialog form the
  app already builds. Nothing is renamed, nothing is removed, and no existing markup becomes invalid.
- **What this costs:** a visitor's session is almost entirely existing screens, so the new CSS is
  about 1.1 KB. The one thing that grows is the system's surface area: there are now two shells in
  `bundle.css`, and the rule that keeps them from drifting is written in `README.md` — chrome belongs
  to the role, screens belong to the system.

## GAP-165: the five things, and why four of them are subtraction

**1. The shell.** AppShell's footer is an account: an avatar with a role, a theme cycle, "Uitloggen",
a live dot. A visitor has none of those and the URL is their credential. Rather than a second shell I
took the one that exists and replaced its chrome: `.pp-app.guest` is one head bar over the same
`main.pp-main`, so **every screen inside it is unchanged** — which is the only mechanism that keeps a
session from becoming the second portal the owner rejected.

The removals each have their own reason, and one of them is worth stating because it looks like a
feature: **no theme control.** A visitor's preference cannot survive the next tap on the same
WhatsApp link, and a control that forgets is worse than no control; the session follows the system
setting, which is what the share page has done since 1.0. **No LiveIndicator and no offline bar**
either: both exist to tell an operator whether what he is *working on* is current, and a visitor can
act on neither.

**There is a way out, and it is one item.** "Sessie afsluiten" drops the session, asks first
(ConfirmDialog) and lands on its own page. The case is real: deel-links are opened on borrowed phones
and in family group chats, and without this the only way to end a session is to clear the browser.
If the app would rather not build the endpoint now, this is the one piece that can be left out
without breaking anything else.

**2. The nav.** Two items, and two refusals. **API-docs** is the clearest case in this system of a
control a role cannot use: a klant has no token and no account. **Openstaand** is the interesting
one — it looks like it belongs, since a klant cares what is open. It does not: Openstaand answers
*which klanten owe me what, and how old is it*, a studio's question with a klant axis and age steps,
and one klant's version of it is the **"Alleen openstaand" switch** on their own overview, standing
next to the totals and the payment details. Two answers to one question, one of them worse, is how a
second portal starts.

**3. Where the link's facts live.** The app is right that a session has no obvious home for the
expiry notice and the "Betalen" block, and **the obvious home is the one it already has.** Both stay
on the Overzicht. A bar is rejected: neither fact changes what a visitor does on a print's page,
there is nothing to act on from there, and the "Betalen" block carries an **amount** that is only
correct beside the totals it belongs to. The arithmetic is GAP-101's: one sentence on four screens is
not four facts. The visitor meets the expiry notice on the screen they land on, every time they open
the link, which is the only moment it can change anything.

The one change: at **0 or 1 day** the notice is `warning` rather than `info`. Same strings
(`share.expiresToday`, `share.expiresTomorrow`), same clock glyph — the words carry it and the tint
reinforces.

**4. Expiry mid-session.** The rule that unknown, expired, malformed and revoked show one page stays
exactly as 1.6 wrote it, so nothing about a token can be learned by probing. That page is now also
the end of a session, drawn **without the shell** (a nav of dead links is worse than no nav), and it
appears at the visitor's **next action**. No timer: the page on screen was true when it loaded, the
visitor cannot change anything on it (it is read-only), and the portal does not know what clock the
device is on. A countdown is also a second fact about the link on every screen, which point 3 just
refused. **Revoking is the same ending**, and the operator is now told so in the Intrekken
confirmation (`share.revoke.body`) — an act whose consequence is invisible to him should at least be
stated to him.

**"Sessie afsluiten" gets its own page**, because it is not the same fact as a dead link: "Je bent
afgemeld van dit overzicht" with "Open de link opnieuw om je prints te bekijken." No button —
a button back in would need the token, and the point of the act is that the session no longer has
one.

**5. The overview page survives, and the app's instinct was right.** *"Stuur me even het
overzicht"* is a real request and the PDF hangs off it. It becomes the session's landing screen,
keeps its 560px column inside the guest `.pp-main`, and loses exactly one thing: the studio head,
which is now one line above it in the shell. The `<h1>` "Overzicht voor {klant}" stays and is the one
place a session says whose prints these are.

**And two reductions that follow from the session rather than from a gap.** The visitor's **Prints**
screen is the dashboard without its klant axis (no strip, no Factuur, no selection, no bulk bar, no
tags, no FilterBar, no filament tint on a card) and the visitor's **print page** is the User variant,
now drawn (GAP-158). Both are written where they belong — ScreenDashboard 2.14, ScreenPrintDetail
2.14 — with the full account in ScreenShareSession.

## GAP-163: the clip was never a text-overflow, and the measurement is what found it

The app measured exactly what 2.13 asked for and the answer closes the gap by itself: the trigger is
**314px** wide at 360px with `scrollWidth` equal to `clientWidth` — nothing truncates it — the row
offers about **302px**, and the only ancestor with an `overflow` is
`section.pp-card.pp-assetlist.pp-flush` (326 against 358). So the last **32px** of the name is
painted outside the card and `overflow: hidden` deletes it, which is why the page never scrolls
sideways and why it reads as a shortened name. **Two of my sentences from 2.13 are settled by it:**
"nothing in `bundle.css` truncates a trigger" was true, and "the band of GAP-111 removes the only
thing that was squeezing it" was **wrong** — true at 961px, and `.acts` has spanned the row below
760px since before that round.

The decision and the two rejections are in the table and in SpoolPicker 2.14. What I want to add
here is the general lesson, because it is the second clip this system has found the same way: **a
minimum and an ancestor's `overflow: hidden` together make a silent editorial decision about which
end of a string the viewer loses.** Nobody wrote "cut the colour off the spool name"; a 200px floor
and a radius-keeping clip wrote it together.

## The 44px band, decided on the app's number (GAP-111, confirmed as built)

The app measured the trade and asked me to decide it: at a 2000px window the band costs **+44px** on
each row whose controls used to fit beside the name, saves **12px** on each row that already wrapped,
and at **1400px — the owner's window — it changes nothing at all**, because an order's file list is
628px there, below the 760px container query. On his longest print that is +404px at 2000px and ±0 at
1400px.

**The band stays universal and GAP-111 stays as shipped.** It is already conditional in the only way
that matters: the container query makes it inert below 760px, so it costs nothing where it buys
nothing. Making it conditional on *context* instead would mean a class whose meaning depends on how
wide the window happens to be, which is the kind of data-dependent layout this system refused in
GAP-101. And the cost is paid by the **last card on the page** (2.3's rule: a long list costs nothing
when nothing is behind it), on the width where the page has the most room. If the owner looks at a
2000px window and dislikes it, that is a different conversation and I would rather have it about his
screen than about mine.

## Rejected this round

- **A persistent bar for the link's facts** (GAP-165) — one sentence on four screens that nobody can
  act on. The facts stay on the Overzicht.
- **Openstaand and API-docs in a visitor's nav** (GAP-165) — the first is a studio's question the
  "Alleen openstaand" switch already answers for one klant; the second is a control a klant cannot
  use.
- **A theme control for a visitor** (GAP-165) — a preference that cannot survive their next tap on
  the link.
- **A timer or a countdown for expiry** (GAP-165) — never yank a page out from under someone who is
  reading it, and never make the link's clock a second fact on every screen.
- **Wording that distinguishes expired from revoked** (GAP-165) — that distinction is the one thing
  the dead-link page exists to hide.
- **A third action on a queue row** (GAP-159) — absence is a value, not an operation.
- **"Geen status" and "Niet doorgegaan" for a fileless record** (GAP-159) — either would leave the
  record alive in the database and on no screen.
- **A Project field and a price field in "Aanvraag toevoegen"** (GAP-157) — a folder level that
  nothing can yet be compared against, and a quote this system has no concept of.
- **Wrapping the spool trigger to two lines, and a horizontally scrolling card** (GAP-163).
- **A third "Geen status" copy key** — `bulk.statusNone` is reused; the rename belongs to 3.0.

## What I need measured

None of these blocks anything in this export.

1. **The largest number of prints one klant has** (not the average). 84 prints over 12 klanten is
   about seven each, and that is why a visitor's Prints screen has no FilterBar. If one klant has
   thirty, the visitor gets the search field — and nothing else from the bar.
2. **Which other controls in a file row's band are clipped by the card at 360px** (GAP-163). The clip
   is the card's, not the trigger's, so the trigger may simply have been the widest victim: for each
   control in `.acts`, its right edge against the card's right edge, and `scrollWidth`/`clientWidth`
   on the card. If a second control is outside, say which and I will decide it with the same rule.
3. **The guest head at 360px with the longest studio name** in the running app: its height, whether
   the two nav tabs stay on one line, whether "Sessie afsluiten" stays on the first line, and that
   nothing scrolls sideways. I cannot render it; the frame in the preview is a container, and the
   twin is my claim about the media query, not proof of it.
4. **Whether a visitor's print page has anything below the fold at 390×844** — viewer, "Deze print",
   payment. If the payment badge is below the fold on a phone, the order of those three is wrong and
   I would rather move it than defend it.

## Not decided this round, and why

- **Materiaal and Gewicht for a klant** (ScreenPrintDetail 2.14, ScreenShareSession) — **proposed,
  needs the owner's confirmation.** The invoice already prints Gram, so it is defensible, but what a
  klant reads is his call. **Do not build it**; the card is complete without it.
- **The timelapse in a visitor's media strip** — **proposed, needs the owner's confirmation.** 60% of
  prints have one and it is a film of the klant's own print; it is also a surface no customer has ever
  had, and the same network-tab threshold applies as to the model. Until he says yes: **models only**.
- **Tags for role User** (1.4 says a User sees them; the share page never has) — **proposed, needs
  the owner's confirmation**, and it is a conflict in this system rather than a new idea. A tag is
  the owner's filing word ("cadeau" on a present). A session shows **no tags** either way.
- **API-docs in role User's nav** (AppShell 2.14) — **proposed, needs your confirmation.** I believe
  it is wrong for the same reason it is absent from a session, but a User is an account holder and may
  have been given the docs deliberately. **Do not build it yet.**
- **GAP-144** stays `[wontfix]` and **GAP-129**, **GAP-145** and **GAP-152** are closed by the owner
  or by the app, as `implementation.md` records.

## Where I was unsure

- **The two-item nav.** Two destinations is the smallest nav that is still a nav, and at 360px it
  draws two tabs across the width, which looks more like a tab bar than a menu. I think that is right
  for a visitor, and if the owner later wants Openstaand in there I would rather be told than guess —
  but adding it back means two answers to one question, so it should be a decision and not a drift.
- **"Sessie afsluiten".** I am confident the act should exist and much less confident anybody will
  press it. It is one button and one endpoint; if the app would rather wait, leave it out of the head
  entirely rather than render it disabled.
- **Whether the visitor's Prints screen needs its own sort control.** I gave it the Overzicht's order
  (newest first) and no control at all. On seven prints that is obviously right and on thirty it may
  not be, which is why measurement 1 exists.
- **AanvraagDialog's field order.** Naam before Klant, because the row it creates reads name-then-klant
  and the name is the thing he was just told. If he finds himself choosing the klant first every time,
  that is a cheap swap and worth telling me about.
- **The guest head's layout at 360px.** `flex-wrap` with one `margin-right: auto` on the brand puts the
  exit button on the first line and the nav on its own; I cannot render it, so measurement 3.

# Changelog 2.13

**Two screens gave a column its max-content and left the rest to starve, and in both the starved
part was the thing the screen is for.** That is the app's own sentence and it is the round. The
owner said two things in four days of use — *"instellingen is echt walgelijk, dit heeft een
redesign nodig"* and *"dit geeft nog steeds een raar beeld in uitlijning"* — and they are one fault
in two places. Instellingen does it with sections: `align-items: start` in one grid, so a 1580px
Printers card put **1402px of nothing** beside a 194px Algemeen, in a layout that also made **three**
columns where 2.0's own prose says never three. AssetListItem does it with a row's three bands: the
controls reserved **609px** at max-content for a single-line shape they never draw, because they
wrap, while the file name was clipped to its **240px** floor to pay for it — and `align-items:
center` floated a 20px type icon **44px** below the file name it belongs to. Both are fixed by the
same move: **the part whose size is the owner's data stops sharing a track with the part that has to
be read.** Three smaller gaps are decided with them, one of them the rule behind three separate
patches. Version 2.12 follows below.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-101 | Instellingen: three columns against its own prose, and one grid row shared by a 194px card and a 1580px one | **Reopened, because 2.0's answer was wrong about the row.** Three columns are now impossible **by construction** — a track is `max(320px, 50% - space-2)`, at least 320px *and* at least half the row — and everything below 992px is unchanged. The row rule: a section that **lists records** takes the whole row (`Printers`, `Klanten`), the four fixed sections are **paired by what they are** (Algemeen · Spoolman / Prijzen · Bedrijfsgegevens), and the two lists sit last, longest last. The betaallink help line moves to the section, **once**. `column-count`, two app-filled column stacks and `align-items: stretch` are all **rejected** below. 2.0.1's four Betaallink strings are keyed at last | **resolved** |
| GAP-111 | The file row: a 20px icon 44px below its name, a controls band that reserves 609px and then wraps, and nothing lining up between rows | **Reopened; the 240px name floor stays and the fight it refereed is removed.** `.pp-asset` is `align-items: start`; the row's first cell is named **`.lead`** and is one line tall, so the icon sits on the first line (and `.pp-reason` aligns its icon to the first line too). An `.acts` that carries **value controls** takes **`.pp-asset.band`**: a line of its own under the name, left-aligned — so the name gets the row's full width and the band gets 738px for its 609px. Rows agree because the band is ordered **count · toggle · spool trigger · `.end`**: at most one control's width is data and it is the last one | **resolved** |
| GAP-146 | A panel inside `.pp-lift` paints under a later sibling; three components have taken the same placeholder one at a time | **The general rule, and it is the portal, not the z-index.** A window-placed panel is rendered as a child of the **nearest open `<dialog>`, else `<body>`** — never inside its trigger's wrapper (`README.md` *Floating panels* rule 9). `.pp-lift` keeps its `z-index` and joins the list of things that confine a panel. **Dropping `.pp-lift`'s z-index is rejected** below, and so is portalling to the body (measured: 0 of 11 menus clear). The cost is stated: Tab order cannot carry a portalled panel, so an `.at` panel is focus-managed. The three placeholders are now the specified behaviour and their markers can go | **resolved** |
| GAP-147 | A modal says Esc closes it and nothing about clicking outside | **By kind, not by state.** A dialog that holds nothing the viewer has typed closes on a backdrop click; one with a form does not; a **ConfirmDialog never does**, destructive or not. A dialog that refuses does nothing visible. "Close it while the form is untouched" is **rejected**: a dialog that sometimes closes teaches nothing. What the app built matches, so the marker can go | **resolved** |
| GAP-153 | `--pp-tap` and `--pp-control-h` are 36px inside a `.pp-device.phone` frame, where the app draws 44px | **The token twin you measured, carried.** `.pp-device.phone` sets both tokens to 44px, and the 16px input font gets its twin as well; `.pp-device.phone .pp-btn-sm` stops writing 44px as a literal and reads `--pp-tap`. `.pp-dialog.sheet` and `.pp-pop.at` stay untwinned **and always will be** — both are `position: fixed` against the window, and a 360px container is not a window | **resolved** |
| GAP-160 | `.pp-line > .pp-badge` does not reach Openstaand's badges; the band is right by auto-placement | **Name the wrapper, as you proposed.** New class **`.pp-badges`**, placed by the same declaration as `.pp-badge` in the phone rule and in its `.pp-device.phone` twin. One attribute changes on one screen and nothing moves on screen — the point is that the layout stops being an accident. **`:has()` is rejected**: it needs no markup and hides the dependency, which is the thing being reported | **resolved** |
| GAP-161 | May a *state* use `pp-hintchip`, and does the 200px trigger still hold? | **(a) Yes — the chip's definition was too narrow, not the use.** A `pp-hintchip` qualifies the value it sits on: where it came from, **or whether it is still current**. Bounds written down: never something that needs doing, never something that changes money, never the only carrier, and it travels to the trigger with the value. **(b) The 200px floor holds and nothing is capped** — it is a floor, the widest trigger in this library is 216px, and the band of GAP-111 removes the pressure that would have forced a cap. `spool.remaining` gets a zero arm: an empty spool reads **"leeg"**, not "0 g over". The reported ellipsis on a trigger is **not** produced by anything in `bundle.css`; measure where it comes from | **resolved** |
| GAP-162 | A klant with an empty folder renders "0 prints" and offers acts with no object | **The count says the word and the acts go.** `customers.printCount` gains `=0 {Nog geen prints}` — one key keeps the fact. No "Factuur", no "Factuur maken", **and no "Klant verwijderen"**: delete hides a klant *and its prints*, and with no prints the only object left is the **folder**, which the portal reads and never writes (rule 7). With both items gone the "⋯" is not rendered. **Rejected:** a `pp-hintchip` "nog geen prints" and sorting empty klanten last. The tile still filters, and the filter lands on `empty.customerNoPrints` | **resolved** |

## New and changed

- **Tokens:** none. `tokens.json` `version` is **2.13**. No token added, renamed, changed or
  removed. `--pp-tap` and `--pp-control-h` are unchanged; 2.13 only makes a preview frame read the
  values the phone query already sets.
- **New classes** `.pp-badges`, `.pp-setrow.cust`, `.pp-asset.band`, `.pp-asset > .lead`, `.pp-asset .acts > .end`.
  `.pp-badges` is a line's second band when it carries more than one badge; `.pp-setrow.cust` is a
  klant's row in Instellingen (name and toggle on one line, the Betaallink field across the row
  beneath); `.pp-asset.band` is a file row whose `.acts` carries value controls; `.lead` is the
  row's first cell (type icon or plate thumbnail); `.acts > .end` holds the trailing icon buttons,
  pinned to the row's right edge.
- **Changed classes**, all in `components/bundle.css`: `.pp-settings`, `.pp-asset`, `.pp-reason`, `.pp-line > .pp-badge`, `.pp-device.phone`, `.pp-device.phone .pp-input`, `.pp-device.phone .pp-select`, `.pp-device.phone .pp-btn-sm`.
  `.pp-settings` gets the track function that cannot fit a third column; `.pp-asset` takes
  `align-items: start`; `.pp-reason` takes `align-items: flex-start`; the `.pp-line > .pp-badge`
  phone rule and its `.pp-device.phone` twin now also name `.pp-line > .pp-badges`;
  `.pp-device.phone` sets `--pp-tap` and `--pp-control-h` to 44px; the input and select twins take
  the 16px phone font; `.pp-device.phone .pp-btn-sm` reads `var(--pp-tap)` instead of the literal
  44px. **Nine selectors.** Nothing is removed and no existing declaration is deleted.
- **Copy** `settings.payLink`, `settings.payLink.help`, `settings.payLink.added`, `settings.payLink.noIban`, `spool.remaining`, `spool.archived`, `spool.archived.title`, `empty.customerNoPrints.title`, `empty.customerNoPrints.body`, `customers.printCount`.
  The first nine are **new**, all in `copy-deck.md` under *Added in 2.13*; `customers.printCount` is
  **changed** (same key, same call sites, a `=0 {Nog geen prints}` arm).
- **Components changed:** ScreenSettings (README, preview), AssetListItem (README, preview),
  SpoolPicker (README, preview), CustomerCard (README, preview), OutstandingGroup (README,
  preview), Popover (README), OverflowMenu (README), Dialog (README).
- **Screens changed:** Instellingen — section order is now Algemeen · Spoolman / Prijzen ·
  Bedrijfsgegevens / Printers (span-2) / Klanten (span-2), Klanten draws the Betaallink field and
  the help line once, and the klant rows use `.pp-setrow.cust`.
- **Pages changed:** `README.md` (*Floating panels* rule 9, *Three rules this round wrote down
  (2.13)*, *Versie 2.13*), `changelog.md`, `copy-deck.md`, `do-dont.md`, `contrast.md`,
  `tokens.json`.
- **Contrast report:** **one new ground pair**, in `contrast.md` *Added in 2.13*: the chip's dashed
  `border-strong` edge inside a picker option, over `primary-tint-soft` and `primary-tint` — 3.83
  and 3.49 light, 3.31 and **2.95** dark. The one value under 3:1 is recorded rather than rounded
  up and nothing is changed for it; the same edge is 3.32 against the chip's own `surface-2`, which
  is the contour that makes it a chip, and the chip's text is `muted` on `surface-2` (5.18 / 6.06).
  No information lives in that hairline.
- **Breaking changes: none.** Five markup obligations are added and nothing is withdrawn: `.lead`
  on a file row's first cell; `band` on the file rows of an order; the band's children in the order
  *count, toggle, spool trigger,* then `<span class="end">` around the icon buttons; `.pp-badges`
  instead of `span.pp-row.pp-gap-1` on an Openstaand line that carries two badges; and
  `.pp-setrow.cust` plus one help line moved in Instellingen's Klanten section. Every one is an
  attribute or an order, not a rename.
- **What this costs in page height, which the owner is shown and decides:** an order's file rows
  gain a control line (about **44px**) at container widths where the band used to fit beside the
  name — and *lose* height at the measured 794px, where the band wraps to two lines today.
  Instellingen should get **shorter**, because Klanten at 532px and at 1080px is not the 2018px it
  is at 349px and twelve help lines leave the page. Both are measurements I do not have; see *What
  I need measured*.

## GAP-101: the column count was the smaller half

2.0 wrote *"One column up to 800px of content, two above it, never three — a settings field is read,
not scanned"* and shipped `repeat(auto-fit, minmax(320px, 1fr))` capped at 1080px. Three tracks of
320 with two 16px gaps is 992, which fits under 1080, so `auto-fit` made three. **The prose and the
CSS disagreed for thirteen versions and the CSS won every time.** That is the part I am least proud
of: a sentence in a README is not a rule, it is a hope. The fix is a track that cannot be a third of
a row — `max(320px, 50% - var(--space-2))` — and below 992px every width behaves exactly as it did.

**The hole was the real complaint, and three answers were available.**

- **`column-count: 2`, rejected.** It flows sections independently, which is what the app asked
  for, and it costs two things: the reading order becomes down-then-across (a settings page has an
  order, and ours is grouped by meaning), and the browser balances the columns, so where a section
  lands depends on how many printers the owner has today. A page whose structure moves with its
  data is the fault one level up.
- **Two explicit `1fr` stacks the app fills, rejected** for the second of those reasons alone: the
  app would have to decide the assignment, and the only honest way to decide it is by height.
- **`align-items: stretch`, rejected.** It makes the hole disappear by inflating a 194px card to
  1580px of empty `surface`. The emptiness was never the problem; a card of air is worse than air.

**Taken: the long sections stop sharing a row.** `span-2` was written in 2.0 as a permission ("any
section may take `span-2` when its content needs the width") and is now a **rule with a test**: a
section that draws **one card or row per thing the owner has** takes the whole row. Printers and
Klanten do; the other four hold a fixed set of fields. Prijzen's Materiaalprijzen table is the near
case and stays paired — a studio has a handful of filament types where Klanten has one row per
customer, for ever. And the four fixed sections are **paired by what they are**, which is also how
their heights pair: Algemeen with Spoolman (the system itself), Prijzen with Bedrijfsgegevens (the
studio). At the heights you measured, the two holes fall from 1402px and 1146px to roughly 50px and
170px.

**The betaallink help moves, and the rule behind it is small and general: a label belongs to its
control, an explanation belongs to the section.** Twelve copies of *"Een betaallink bevat vaak een
vast bedrag en een vervaldatum…"* are not twelve facts; they are one fact and eleven obstacles
between the owner and the next klant. The field's own label stays per klant, and so do
`settings.payLink.added` and `settings.payLink.noIban`, because each of those is about that klant.

**And a failure of mine that this round exposes.** ScreenSettings 2.0.1 specified the Betaallink in
prose, gave it four strings, and put **none of them in `copy-deck.md` and none of them in the
preview**. The app built the field from my prose — which is precisely what 2.12's rule was written
against (*a string the deck does not carry is a string nobody proofreads*), and I wrote that rule
for the app. The four keys are in the deck now and the field is drawn in the preview.

## GAP-111: the slot that had no name, and a band that lied about its width

Three faults, one cause, and the cause is that the row was described by two of its three cells.

**1. `.body` and `.acts` were named; the first cell was not.** No class means no rule, and
`align-items: center` centred a 20px glyph against a block 171px tall: the icon's middle at y=946
against the name's at y=902. The row is `align-items: start` now and the cell is `.lead`, a box one
`--leading-base` tall with its content centred *inside the box* — so a 20px icon sits on the first
line and a 40px plate thumbnail still centres on itself, with no magic number and no per-row
exception. `.pp-reason` gets `align-items: flex-start` for the same reason, which is where the
duplicate warning's triangle now sits: on the first of its three lines, not beside the middle one.

**2. The controls reserved the width of a layout they never drew.** `minmax(0, auto)` lets a track
take max-content, and `.acts` is `flex-wrap: wrap`: at the measured container of 794px the band
*insisted on* 609px and then wrapped to two lines anyway, while the name column sat on its 240px
floor. So the row paid 609px for a single-line shape and did not get one. **`.acts` has two forms
and the row says which**, because CSS cannot see what a band holds: icon buttons only (the print's
"Bestanden" card) keep the third column, and value controls (an order's "In deze bestelling") take
`.pp-asset.band` — a line of its own under the name block. At 794 that is a name block of about
738px and a band of 738px holding 609px **on one line**.

**3. Rows disagreed because the band was right-aligned.** Only the right edge was fixed, so "Aantal
keer geprint" landed at a different x in every row as soon as two spool names differed in length —
invisible in a library where they happen to match, which is why this needed the owner's screenshot.
The band's order is now **count · exclude toggle · spool trigger · `.end`**, and the general rule is
the one worth keeping: **a band lines up across rows when at most one control's width is data, and
it is the last one.** The first two carry fixed words, so they start at one x; the trigger starts at
one x and only its end moves; `.end` ends at one x. **Fixed widths for every control are rejected**
— the only data-width control is the spool trigger, and pinning it would mean truncating spool names
so that a toggle could line up. The cheaper rule is an ordering rule.

**Slot rows are deliberately untouched.** `.pp-slot` pushes its trigger to the row's right edge, so
slot triggers already end at one x, and nothing in a slot row has been measured as misaligned. One
rule per measured fault.

## GAP-146: a portal, not a z-index

The app's own account is the best part of this gap: *"A fixed box escapes clipping, not its
ancestors' stacking contexts — and `.pp-lift` is `position: relative; z-index: var(--z-raised)`, so
it traps a panel exactly as `.pp-anchor` does."* That sentence is now rule 9 and the three patches
become one specification.

**Dropping `z-index` from `.pp-lift` is the other available answer and I am rejecting it.** It does
work — with no stacking context the panel's `z-popover` competes globally — and it is one line
against a portal in three components. Two reasons:

1. **That z-index is what `.pp-lift` is for.** It puts a trigger above a stretched card or row link
   (`.pp-cust-name::after`, inset 0). Without it, whether the trigger is above the hit area depends
   on the DOM order of the trigger and the link, which differs per component and fails **silently**:
   the control still looks right and a press filters the dashboard instead. That is a worse bug than
   the one being fixed, and harder to see.
2. **It fixes only the wrapper we own.** A card with `overflow: hidden`, a `transform`, a `filter`
   or a `mask` above the trigger puts the panel back under or inside something, and the system has
   already met all four. A panel's placement is the panel's problem — the rule taken in 2.2 for the
   window and in 2.3 for clipping, extended once more.

**Portalling to the body is rejected by measurement, not by taste:** a modal `<dialog>` paints in
the top layer, so a panel outside it lands beneath the entire modal — 0 of 11 menus clear, against
11 of 11 for the nearest open `<dialog>`. The rule names the dialog because the grid of 575 points
per menu named it.

**The cost, said plainly:** a portalled panel is not next to its trigger in the DOM, so Tab order
cannot carry it, and Popover's old sentence ("put the panel right after its trigger") is impossible
in the `.at` form. An `.at` panel is therefore **focus-managed**: focus moves in on open and back on
close, Esc closes, focus leaving closes, and `aria-controls` + `aria-expanded` tie the two together.
OverflowMenu already worked this way; now every `.at` panel must.

## GAP-161: what a chip is for, now that it carries a state

The honest version of (a) is that the chip's **definition** was too narrow, not its use. I called it
provenance because its first three jobs were provenance. What it has always been is *quiet words
attached to a value, with no ink, no icon and nothing to do* — and "archief" is exactly that. The
boundary is what makes this safe to generalise: a chip may not carry **something that needs doing**
(a `warning` badge with a reason line), may not carry **something that changes money** (a value
belongs in a cell), is **never the only carrier** (the word is real text, the archived spools sort
last, the search finds them), and **travels with the value into the trigger**, as "van de print"
does. What is in force is shown with its qualification attached, or the row is lying by omission.

**"0 g over" → "leeg".** The owner noticed, and the deck has had the rule since 2.11: where zero
means a state rather than a measurement, say the word. Dutch sends 0 to `other`, so the arm is
explicit.

**(b) 200px holds, and nothing is capped.** `pp-minw-200` is a floor; a trigger grows with its
content and the widest in this library measured 216px. The longer option line lives in the 320px
panel and never reaches the trigger, and GAP-111's band removes the only thing that was squeezing
it. **On the clipped "Creality Skin Hype…": nothing in `bundle.css` truncates a trigger** —
`.pp-btn` is `white-space: nowrap` with no `overflow` and no `text-overflow`. Measure which element
clips (`scrollWidth` against `clientWidth`, and which ancestor carries the `overflow`). If it is an
app-side cap, remove it; if it is mine, log it and I will decide it with the markup in front of me.
If a trigger ever must truncate, the cut is in the **middle** — brand and material at the front,
colour at the end — but nothing in this export truncates one.

## GAP-162: an act with no object, and the one that looked harmless

"0 prints" is the zero arm, and that half is easy. The interesting half is **"Klant verwijderen"**,
which the app called harmless because it deletes zero prints. It is not offered, and the reason is
not tidiness:

- Delete in this app hides a klant **and its prints** and offers Herstellen. With no prints there is
  nothing in the portal to hide.
- The only object left is the **folder**, and the portal reads `/prints` and writes to it never
  (`README.md` rule 7 — the tree is Nextcloud's). A portal that hid the klant in its own database
  anyway would disagree with the disk at the next index, and GAP-162 exists precisely because the
  disk is the record.
- So the answer to "how do I get rid of this klant?" is *remove the folder*, which your own
  measurement already shows working: 12 klanten back to 11, print totals unmoved.

With both items gone the menu would be empty, so the "⋯" is not rendered: an overflow menu with
nothing in it is itself a control with no object. **Marking or sorting an empty klant is rejected.**
A `pp-hintchip` "nog geen prints" would say in a second device what the count already says (and the
chip qualifies a *value*, where here the count *is* the statement); sorting empty klanten last would
hide the klant the owner just made, which is the one he is looking for.

## What I rejected, in one list

- `column-count` and app-filled column stacks for Instellingen; `align-items: stretch` (GAP-101).
- Fixed widths for every control in a file row's band, which would truncate spool names so a toggle
  could line up (GAP-111).
- Dropping `z-index` from `.pp-lift`; portalling a panel to the body (GAP-146).
- A backdrop-click rule keyed on a form's state rather than the dialog's kind (GAP-147).
- `:has()` instead of naming the badge wrapper (GAP-160).
- A `pp-hintchip` "nog geen prints" on an empty klant tile, and sorting empty klanten apart
  (GAP-162).

## What I need measured

None of these blocks anything in this export; each decides whether the next round has work.

1. **Instellingen at 1400px after the import:** the computed number of columns (it must be 2 — the
   track function uses `max()` with a percentage, which I cannot render), the page height against
   today's 4040px, and the two remaining holes.
2. **A print detail's height at 1400px and 2000px, before and after the band**, per list: the order
   list should get shorter at container 794 and about 44px per row taller at 961.
3. **Where the spool trigger's ellipsis comes from** (GAP-161): `scrollWidth`/`clientWidth` on the
   trigger and the ancestor that carries the `overflow`.
4. **The phone frames after the token twin** (GAP-153): the frames get taller and `.pp-btn-icon`,
   `.pp-opt` and the palette buttons get wider. If a frame now clips or scrolls sideways, that is a
   preview to fix, not a reason to withdraw the twin.

## Not decided this round, and why

**GAP-158 and GAP-159 wait on the owner** and I have not pre-empted him; **GAP-129, GAP-144 and
GAP-145** need a measurement or a decision that is not mine; **GAP-152** is complete except for the
role User, which is GAP-158; **GAP-157** ("Aanvraag toevoegen" has no anatomy) is mine and is not in
this export — it is a screen, not a paragraph, and I would rather give it a round than a corner of
one. It stays open and the marker stays.

## Where I was unsure

- **The `.pp-settings` track function.** `repeat(auto-fit, minmax(max(320px, 50% - var(--space-2)),
  1fr))` is valid CSS and the arithmetic is exact (two tracks fill the row to the pixel), but I
  render nothing: if a browser treats the percentage differently than I expect, the grid falls back
  to today's behaviour — three columns — which is a graceful failure but not the fix. **Check the
  computed column count.**
- **Whether `.pp-asset.band` should have been decided by content rather than by a class.** It
  cannot be: CSS cannot see what a band holds, and the alternative (`:has(.pp-qty, .pp-opt,
  .pp-spoolbtn)`) hides the dependency exactly as `:has()` would in GAP-160, where I rejected it.
  A class it is, and the app has to set it on the right list.
- **The 44px cost per order row at wide containers.** I believe the trade is right — a readable file
  name and rows that line up, against one line of height on a page that is already long and whose
  file list is the last block. If the owner looks at it and disagrees, the band is one class and can
  be made conditional on the context rather than universal.
- **GAP-147's ConfirmDialog arm.** Never closing a confirmation on a backdrop click is the safe
  reading, and it is also the one that will annoy somebody who meant to dismiss a question. Esc and
  Annuleren are both there; if the owner finds it irritating in use, say so and I will look at it
  again rather than defend it.

# Changelog 2.12

Three gaps, all on the phone, all in `bundle.css` and one markup slot — and the round's own lesson
is that **a slot has a type**. 2.10 put a sentence where a figure goes; a sentence sizes a column,
a column is shared by the row above it, and nine months later a two-word heading had 109px. The
badge that 2.11 added only made the collision visible: holding the badge back removed the
overprint and left the squeeze, which is the measurement that decided this round. Version 2.11
follows below.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-154 | Four day-count strings with no plural, one of them possibly dead — and, measured, a fifth nobody had listed | **Per key, against the app's call-site measurement.** `outstanding.groupMeta` is the live bug and is now the **count alone**, pluralized: "{count, plural, one {# print} other {# prints}}" — the age belongs to the `.age` badge 20px away, which has the icon, the three steps and the zero arm, and which since 2.11 says it in better words. `outstanding.groupLabel` is **added to the deck** with plurals and with the age kept, because an accessible name names what is on screen. `share.expiresIn` is **removed** (measured dead: absent from `nl.ts`, zero call sites). `overview.expiryNotice` and `date.daysOne`/`date.daysOther` are **confirmed as built** — the app branches in code before a 1 can reach them. Pluralizing groupMeta's age clause instead is rejected below | **resolved** |
| GAP-155 | The queue summary's age badge overprints "waarvan {n} zonder bestanden" by 10px at 360px, and the group's `h3` is squeezed to 109px | **Proposal 3, and only proposal 3: the sentence leaves `.amt`.** It becomes the second muted line of the `.ttl` block on ScreenQueue; `.amt` stays in the markup and stays **empty** there, so the summary keeps its four tracks and the chevron keeps its own. Plus the older half: `.pp-ogrp > summary .age` gets `justify-self: start`, which `.pp-line > .pp-badge` has had since 2.11 — the two rules described the same thing and disagreed. **Proposals 1 and 2 are rejected** below. Openstaand's markup does not change; the badge can ship again on ScreenQueue | **resolved** |
| GAP-156 | A row's two actions need 308px of a 294px band at 360px, and `.pp-btn-sm` pins 32px where `do-dont` has called 44px a hard floor since 1.2 | **The floor wins, and the band wraps.** `.pp-btn-sm` takes `min-height: var(--pp-tap)` at 480px and below (44px there) and keeps 32px on the desktop: it is a **density** variant — smaller text and padding — never a smaller target. `.pp-line .acts` gets `flex-wrap: wrap` on the phone and the previews stop setting `pp-nowrap` on it. **An exemption for `.pp-btn-sm` is rejected**, and so is the proposed `max(32px, var(--pp-tap))`, which computes **36px on the desktop** and would have quietly abolished the small button everywhere | **resolved** |

## New and changed

- **Tokens:** none. `tokens.json` `version` is **2.12**. No token added, renamed, changed or
  removed; `--pp-tap` already had its 44px phone value (`:root`, since 1.2) and this round only
  makes one more rule read it.
- **New classes:** none. **Changed classes** (all in `bundle.css`, each with its
  `.pp-device.phone` twin, as 2.11 requires): `.pp-btn-sm` (phone `min-height`),
  `.pp-line .acts` (`flex-wrap: wrap` on the phone), `.pp-ogrp > summary .age`
  (`justify-self: start` on the phone). Three selectors, four declarations, seven lines including
  the twins. No class is removed and no existing declaration is deleted.
- **Copy** `outstanding.groupLabel` (**new**, in `copy-deck.md` under *Added in 2.12*),
  `outstanding.groupMeta` (**changed** value, same key, same call site), `share.expiresIn`
  (**row removed**, measured dead), `queue.ofWhichWithoutFiles` (**unchanged key, new slot** — the
  `.ttl` block's second line instead of `.amt`).
- **Components changed:** OutstandingGroup (README, preview), Button (README), ScreenQueue (README,
  preview), ScreenOutstanding (README, preview).
- **Screens changed:** ScreenQueue — the "waarvan" sentence moves into the title block in all six
  group summaries, `.amt` is an empty slot, `pp-nowrap` is gone from the row actions, and the frame
  labels say what they now show. ScreenOutstanding and OutstandingGroup — `pp-nowrap` gone from the
  row actions; nothing else, because their `.ttl` has drawn the count alone since 1.9.
- **Pages changed:** `changelog.md`, `copy-deck.md`, `do-dont.md`, `tokens.json`.
- **Contrast report:** unchanged, **no new pair.** Nothing gains a colour: the moved sentence keeps
  `muted` on the summary's `surface-2` ground (in the report at 4.5:1 or better in both themes,
  light and dark), the badge keeps its three age steps, and a button's `min-height` carries no ink.
- **Breaking changes: none.** Two obligations are added to the app — render
  `queue.ofWhichWithoutFiles` inside `.ttl` with an empty `.amt` beside the badge, and import the
  two copy changes — and one row leaves the deck that the app never imported. Nothing is renamed
  and nothing that was built is withdrawn.

## GAP-155: why proposal 3, now that the badge has been held back

I wrote three proposals and the owner's measurement chose between them. **Removing the badge
removed the overprint and left the squeeze**: "Nog niet besloten" still gets 109px and two lines,
while "Mee bezig" — whose group carries no sentence — gets 274px on one. So two things were wrong
and only one of them was the badge's:

1. the collision, which needed the badge to exist, and
2. the squeeze, which has been there since 2.10 and needs nothing but the sentence.

`.amt` is one `auto` track for **both rows** of the phone grid. A 181px sentence in it is a 181px
column, and the heading sits above that column. **Proposal 1 (three bands for the summary) was my
own favourite and is rejected:** it gives the sentence a row of its own and so fixes the collision,
but the sentence would still be the widest thing in a shared `auto` track at some other width, and
a group would then fold into three bands *because one screen puts prose in a money slot*. That is
a layout paying for a content mistake. **Proposal 2 is rejected as a fix** — 109px is still less
than the badge's 130px — but half of it was right and is in this round anyway: `justify-self:
start` on `.age` was missing, independently of everything else.

What the sentence actually is: a fact about **what the group contains**, like the count above it.
That is `.ttl`'s job. So `.ttl` carries the name and the facts, `.age` the age, `.amt` a figure —
and `.amt` on Wachtrij is **empty**, kept in the markup as `.pp-right` is kept empty on a row with
no price, so no CSS has to know which screen it is drawing. The heading gets 288px back at 360px,
the badge needs no room it does not have, and the two screens fold identically for the first time.

**The slot contract is written down in OutstandingGroup**, which is the component both screens
borrow, because it is the thing that was never stated: `.amt` is a figure and never a sentence.

## GAP-156: a size variant is not a target variant

`do-dont` has said since 1.2: *don't shrink a touch target under 44px on phones*. `:root` raises
`--pp-tap` to 44px at 480px. And `.pp-btn-sm` wrote `min-height: 32px` as a literal, so it was the
one control in the system that ignored both — in nearly every row of the app, on the page the owner
reaches *"van elke hoek, dus ook als ik bij iemand op bezoek ben, of als ik onderweg ben"*. It
passes axe, because WCAG 2.2's target rule stops at 24px; no automated check was ever going to find
it, which is exactly why it is written down once here rather than per screen.

**The exemption is rejected.** If `.pp-btn-sm` may be 32px on a phone, the floor means nothing —
every row action in this app is a `.pp-btn-sm`. What `pp-btn-sm` is *for* is density: `text-sm` and
`space-3` padding in a dense table. Density is text and padding; a target is a target. So on the
phone it keeps the small type and takes the ordinary tap height.

**The implementer's `min-height: max(32px, var(--pp-tap))` is rejected, and it is worth saying
why:** `--pp-tap` is **36px** outside the phone media query, so that expression is 36px on the
desktop and the small button stops existing — in every table, every row, every popover. The two
sizes are not a maximum; they are two states of one token, and the rule belongs where the token
changes.

The overflow is the same paragraph's other half: `.pp-row` wraps by default, the previews turned it
off with `pp-nowrap`, and nobody had measured two actions against a 294px band. `flex-wrap: wrap`
at 480px and below, and `pp-nowrap` off the row actions in all three previews that set it. A
fileless queue row's two actions now stack into two 44px lines on the phone. **That is a cost, not
a free fix** — a ten-row queue grows by about 48px per two-action row — and it is the right cost:
an action you cannot hit is worth no pixels at all.

## GAP-154: the age is the badge's, and a string with no key gets proofread by nobody

`outstanding.groupMeta` was "{count} prints · oudste {days} dagen open", which is **two faults and
a duplicate in six words**: no plural on either count, so one line one day old read "1 prints ·
oudste 1 dagen open"; and since 2.11 the `.age` badge 20px away says "oudste 1 dag" — the same fact
in a second vocabulary, on the busiest screen in the app.

**Pluralizing the age clause is rejected.** It would have fixed the grammar and kept the
duplication, and the duplication is the worse half: two strings that must agree about one number
and are computed in two places will disagree the first time a threshold or a rounding changes.
Only one of the two can own the age, and it is the badge — it has the clock, the warning and the
alert icon, the three age steps, and the `=0 {alles van vandaag}` arm. The meta line keeps what the
badge cannot say.

This is also **the design catching up with its own preview**: OutstandingGroup has drawn
"3 prints" in that slot since 1.9. The deck was the only place the age clause still lived.

**`outstanding.groupLabel` is added rather than corrected**, because the deck never had it. 1.9
specified the accessible name in prose — "Koen, 18 prints, oudste 741 dagen, € 640,12" — and gave
it no key, so the app wrote the sentence itself, without plurals, and a screen reader heard "1
prints, oudste 1 dagen" on the very component whose visible badge 2.11 had just fixed. **A string
the deck does not carry is a string nobody proofreads**, and that is the rule this round adds to
`do-dont`. Its day arms are `outstanding.oldestDays`' arms word for word; it **keeps** the age,
although the visible meta line loses it, because the badge is on screen and an accessible name
names what is on screen.

**`share.expiresIn` is removed rather than pluralized.** Absent from `nl.ts`, zero call sites,
measured key by key: the three strings that own those cases — `share.expiresToday`,
`share.expiresTomorrow`, `overview.expiryNotice` — are unchanged and already correct, the last one
because the app branches at two days. Giving a dead key a plural form would have made the deck
look more correct and the app no better. **`overview.expiryNotice` and `date.daysOne` /
`date.daysOther` are confirmed as built** and keep their 1.6 shape.

**Wachtrij's summary gets no label key, deliberately.** Its accessible name is now its own visible
text in DOM order — "Mee bezig, 6 aanvragen, waarvan 4 zonder bestanden, oudste 1 dag" — which is
the sentence ScreenQueue's *Accessibility* paragraph already asks for. A key would be a second copy
of a sentence the summary says out loud, and a second copy is a thing that drifts. Openstaand needs
one because its summary also carries an amount and 1.9 fixed the order of that name.

## What I rejected

- **GAP-155 proposal 1**, three bands for `.pp-ogrp > summary`: it rearranges the layout to
  accommodate prose in a figure slot, and leaves the sentence the widest thing in a shared track.
- **GAP-155 proposal 2 as a fix**: `justify-self: start` plus a `minmax` stops the stretch and not
  the collision (109px against 130px). Its missing-`justify-self` half ships anyway, on its own
  merit.
- **Pluralizing `outstanding.groupMeta`'s age clause** and keeping it: correct grammar, two sources
  of one number.
- **An exemption for `.pp-btn-sm` from the 44px floor**, and the `max(32px, var(--pp-tap))` form of
  the fix, which is 36px on the desktop.
- **Shortening "waarvan {n} zonder bestanden"** to fit the slot it was in. 2.11 refused to shorten
  the row badge for the same reason: the words are the design, the slot was the mistake.

## What I want measured

1. **ScreenQueue's group summary at 360px with the badge back:** the `h3`'s width (I expect about
   288px, where it was 109px), whether the `.ttl` block's three lines each stay on one line, and
   the summary's rendered height. This is the whole of GAP-155 and I have computed it, not seen it.
2. **A two-action queue row at 360px after the wrap:** the band's height and whether `scrollWidth`
   still equals `clientWidth` on both screens. And the page height of a ten-row queue before and
   after, so the owner can say whether 44px actions that stack are worth the scroll — if they are
   not, the answer is fewer actions per row, not shorter buttons.
3. **How often a Wachtrij group carries no "waarvan" line at all** (`0` fileless rows). The
   `.ttl` block is then two lines and the summary is shorter; I have drawn both, but the
   distribution decides which one is the normal sight.
4. **Still owed from 2.11, unchanged:** whether design jobs dominate the queue (GAP-143's
   overturning measurement, which probably needs part two shipped), and the age thresholds on a
   queue row (GAP-145, still carrying 30/90 borrowed from money).

## Where I was unsure

- **Three lines in a collapsed summary.** `.ttl` is now `h3` + count + "waarvan …" on the groups
  that have fileless rows, on the phone *and* the desktop (one block order — `do-dont`, 2.3). The
  alternative was joining the two muted strings with " · " into one line, which is prettier at
  980px and invents a separator the deck does not carry, and which wraps unpredictably at 360px. I
  chose the stacked form; if the owner finds it heavy at desktop width, the joiner is a one-line
  change in the app and in six preview summaries.
- **The empty `.amt`.** Keeping an empty slot in the markup is the cheapest way to hold the four
  tracks, and it matches `.pp-right` on a row with no price — but it is an element that exists for
  the grid's sake. The alternative, pinning the chevron to the last track in CSS, leaves a 12px gap
  where the empty track is. I took the markup.
- **`.pp-device.phone` does not carry the phone's `--pp-tap`.** The frames are a 360px container at
  desktop viewport width, so `:root`'s media query never fires inside them and **every** control in
  a phone preview draws 36px where the app draws 44px. I twinned only `.pp-btn-sm`, with a literal
  44px, because `min-height` cannot push a frame sideways. Twinning the two tokens on
  `.pp-device.phone` would be the complete fix and would also widen `.pp-btn-icon` and the palette
  buttons in every phone frame — **I propose it for 2.13 and I am not doing it blind.** It needs a
  render check of the phone frames first, which is measurement 2's neighbour and not part of
  GAP-156.
- **`.pp-line > .pp-badge` still does not match on Openstaand's lines**, as `implementation.md`
  reports: the badge shares a `span.pp-row.pp-gap-1` wrapper with the Gearchiveerd StatusBadge, and
  the band is correct today only by auto-placement. I have **not** fixed it this round — it is not
  one of the three gaps, and the fix is either a named wrapper class (new class, new markup on both
  screens) or a `:has()` selector. **Log it as its own gap and I will decide it with the markup in
  front of me.** It is my own 2.11 rule that is fragile, so I would rather it were numbered than
  quietly patched.

# Changelog 2.11

Four defects out of the running queue page, the owner's new feature, and **the first change to
`bundle.css` since 2.7**. Three of the four defects were words, and one of them was a key holding
two different strings — the shipped app has been reading "118 dagen open" where this system's own
preview says "oudste 118 dagen". The fourth was measured at 360px and could not be seen in the
preview that specified it, which is itself a hole in how this system draws phones and is closed
here. Version 2.10 follows below.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-148 | `outstanding.oldest` is two different strings in one deck: the StatTile label "Oudste openstaande print" and the badge "oudste {n} dagen" | **Split, and the class of fault closed.** The tile label keeps `outstanding.oldest`; the badge becomes **`outstanding.oldestDays`** "{days, plural, =0 {alles van vandaag} one {oudste # dag} other {oudste # dagen}}". You were right that this is a live wording bug and not deck tidiness — and it is **not the only one**: the deck held **twelve** duplicated keys, and `api.loadErrorBody` was a second contradiction ("De Swagger UI…" against "De documentatie…", the 1.7 rewording sitting behind the 1.6 row). The deck is now **one key, one row**, with the rule written at the top of the file, because your importer takes the first occurrence, so a duplicate row silently ships the string a later round replaced | **resolved** |
| GAP-149 | ScreenQueue's group summary draws an age badge with no `queue.*` key for it | **Answered by GAP-148, with one key rather than a new one.** The badge is one component's slot (`.pp-ogrp > summary > .age`), the words are identical on Openstaand and Wachtrij, and neither shortens on the phone, so a `queue.oldest` would be the same string under a second name — the thing GAP-148 exists to stop. `outstanding.oldestDays` serves both screens, as `outstanding.showAll` already does | **merged into GAP-148** |
| GAP-150 | `queue.waiting` renders "0 dagen geleden gevraagd" on the day a request is entered | **Resolved as you proposed, and the same fault fixed on the money side.** `queue.waiting` gains `=0 {vandaag gevraagd}`; the placeholder stays `count`, so no call site moves. **No `=1 {gisteren}` arm** — "1 dag geleden gevraagd" is correct Dutch and keeps one vocabulary across days 1, 2 and 3. **`status.daysOpen` is changed with it, unraised:** it had no plural at all, so it rendered "1 dagen open" and "0 dagen open" | **resolved** |
| GAP-151 | At 360px the badge takes 192px of a 326px row and the name column gets 90px | **Resolved with the row, not the words: `.pp-line` folds into three bands on the phone.** The name block spans both columns, the age badge and the figure share the second band (badge left, figure right — the shape `.pp-ogrp > summary` has had since 1.9), the actions keep the third. **Shortening the row copy is rejected:** "geleden gevraagd" is exactly what makes the badge a wait and not a debt, and it would leave the two screens' badges in different words at different widths. Your closing observation is the more valuable half and is **also resolved**: a phone frame is a 360px container at desktop viewport width, so every phone rule now needs a `.pp-device.phone` twin, which is a rule in `README.md` and eight twinned phone rules in `bundle.css` | **resolved** |
| GAP-152 | A print's **bron** (URL) and **notitie**: "alleen printen" against "zelf maken" | **Resolved as two fields on the print record and two new components, PrintSource and PrintNote — and deliberately not a state.** A bron is a second **observation** in GAP-143's spirit: a link means a model exists somewhere, so the job is a download. A note is the owner's own prose and the system makes **no** claim about it — no badge, no sort, no filter, no "nog te ontwerpen". Typed and found stand side by side with no precedence (chip "uit de map" only on the folder's entries); the klant sees the bron once per print on the share page and **never** the note; role User never sees the note. A row with neither is today's row, which is **69 of 84 prints** | **resolved** |
| GAP-153 | Eleven other phone rules had no preview twin; four still have none | **Seven more twinned (eight with `.pp-line`), four left out on purpose, and I want the app checked rather than guessing.** Twinned: `.pp-line`, `.pp-slot`, `.pp-asset.child`, `.pp-cols-2`, `.pp-printer .fields`, `.pp-pick` (+ `.pp-qty`), `.pp-tagrow` (+ `.cnt`), `.pp-order>summary` (+ `.ttl`, `.chev`, `.sum`). **Left without a twin:** the 44px tap floor and `--pp-control-h` on `:root`, the 16px input font, `.pp-dialog.sheet`, and `.pp-pop.at` — the first three change control metrics in *every* phone frame and the fourth is window-placed on purpose (2.3, rule 7), and I will not change twenty frames I cannot render | **needs your measurement** |
| GAP-154 | Three more day-count strings with no plural, and one that may be dead | **Not changed, because the answer depends on call sites I cannot see.** `share.expiresIn` "Over {days} dagen" and `overview.expiryNotice` would read "Over 1 dagen" — but `share.expiresTomorrow` and `share.expiresToday` exist for 1 and 0, and so do `date.daysOne` / `date.daysOther`, so one of those pairs may already own the case. `outstanding.groupMeta` "{count} prints · oudste {days} dagen open" looks dead since 1.9 split the summary into `.ttl` and `.age` | **needs your measurement** |

## New and changed

- **Tokens:** none. `tokens.json` `version` is **2.11**. No variable added, renamed or removed.
- **New classes** `.pp-srcs`, `.pp-src`, `.pp-note`, and the row modifier `.pp-reason.one` with its
  counter child `.n`. Their required descendants, documented in the component READMEs as 2.8's rule
  asks: `.pp-src > .pp-ico`, `.pp-src .pp-link` (the ellipsis lives on the link), `.pp-src
  .pp-hintchip`, `.pp-note .l`, `.pp-note p`, `.pp-reason.one > span`, `.pp-reason.one > .pp-link`.
- **Changed classes.** `.pp-line`'s phone rule is rewritten (three bands; `grid-template-columns:
  minmax(0,1fr) auto`, `row-gap: space-2`, `>:first-child` spanning, `.pp-badge` and `.pp-right` on
  row 2, `.acts` spanning) and gains a `.pp-device.phone` twin. Eight phone rules in all now have
  twins — thirteen selectors with their parts (listed
  under GAP-153); every twin repeats declarations that already existed, so **no app behaviour
  changes from them** — they change what five existing phone frames *show* — OrderSection's, ScreenPrintDetail's, AssetListItem's, ScreenSettings's and ScreenTags's, checked frame by frame — which is the point.
  **`bundle.css` is no longer byte-identical to 2.7**, for the first time in five rounds.
- **Copy — new:** `outstanding.oldestDays`, `print.source`, `print.source.add`,
  `print.source.placeholder`, `print.source.fromFolder`, `print.source.fromFolderAria`,
  `print.source.open`, `print.source.more`, `print.source.invalid`, `print.note`, `print.note.add`,
  `print.note.placeholder`, `print.note.internal` — thirteen, all in `copy-deck.md` under *Added in
  2.11*. **Changed:** `queue.waiting`, `status.daysOpen`, `api.loadErrorBody` (same keys, same
  placeholders). **Removed rows, no key removed:** the second `outstanding.oldest`, the second
  `invoice.omitted`, the second `cost.incomplete`, the second `api.loadErrorBody` and the whole
  duplicated *Added in 1.7* section. The deck now holds **544 rows and no duplicate key**.
- **New components:** **PrintSource** and **PrintNote** (README and preview each).
- **Components changed:** ScreenQueue (README and preview), ScreenOutstanding (README),
  OutstandingGroup (README), ScreenPrintDetail (README), ScreenSharePage (README).
- **Previews changed:** ScreenQueue gains a fifth frame — **the day a request arrives**, at 360px,
  with "vandaag gevraagd" on three rows and "alles van vandaag" in the summary — and its rows now
  draw a bron, a note, and four fileless rows with neither, which is the measured distribution. Its
  phone frames show the three-band row, because the twin makes them able to. PrintSource's preview
  draws typed, found, three-at-once, empty, editing, invalid, the row form, 360px and the share-page
  form; PrintNote's draws the note, empty, editing, saving, the row form on a fileless row **and on
  a row with files**, 360px, and the role that sees nothing.
- **Pages changed:** `README.md` (the version line, the twin rule under *Responsive*, two icons,
  *Versie 2.11*), `do-dont.md` (*Added in 2.11*), `copy-deck.md`, `changelog.md`, `tokens.json`.
- **Contrast report:** unchanged, **no new pair.** The bron link is `primary` on `surface` (6.12
  light / 6.79 dark), the note is `text` on `surface-2` (10.89 / 9.38) with `muted` for its label
  and help line (5.18 / 6.06), and the chip is the existing `.pp-hintchip`. Every one of those rows
  is already in `contrast.md`; nothing new is carried by colour alone.
- **Breaking changes: none**, and three obligations: render the summary badge from
  `outstanding.oldestDays` instead of falling back to `status.daysOpen`; re-import the three changed
  strings (two of which need a `=0` arm your formatter already supports, since 2.9's keys use ICU
  plurals); and read the two new print fields where the four screens above say so.

## GAP-148 is bigger than the key it was raised about

You raised one key. The deck had **twelve** duplicated keys, because every round since 1.4 recorded
a changed key by re-listing it in the new version's table and leaving the old row where it was.
Four of the twelve were harmless repetition and seven were the same value twice. Two were not:

- **`outstanding.oldest`** — label and badge, the one you found.
- **`api.loadErrorBody`** — "De Swagger UI kon niet worden opgehaald." (1.6) against "De
  documentatie kon niet worden opgehaald." (1.7). 1.7 deliberately took the word *Swagger* out, and
  since your importer takes the first occurrence, **the app has been showing the string 1.7
  replaced.** Please check that one in the running app after importing; I would also check
  `invoice.omitted`, whose 2.9 plural forms sat behind an older unpluralized row in the same way, so
  "1 prints … zijn weggelaten" may still be rendering despite 2.9 claiming it fixed.

There was also a whole *Added in 1.7* section duplicated word for word (nine rows), and
`changelog.md` has carried **two `# Changelog 1.7` headings** since that round — the same accident
in two files on the same day. The deck's duplicate section is removed; the changelog's double
heading is left, because a changelog records what happened and both of those rounds did.

**The rule, which is the actual fix:** one key, one row, in the section where the key was added,
carrying its current value; a change is recorded in prose. It is at the top of `copy-deck.md` and in
`do-dont.md`.

## Why the queue badge keeps its words, and the row changed instead

Your two options were to move the badge to its own row or to shorten the copy to "118 dagen". The
second is cheaper and it is the one I am refusing, for the reason GAP-149 and GAP-150 are about:
**these words are the design.** "118 dagen" in a queue is a number with no verb — it reads as a
debt, which is what the same badge means two screens away, and the one thing this page must not do
is look like Openstaand with different nouns. `status.daysOpen` already carries "open"; this badge
carries "gevraagd". Shortening it on the phone would also split the two screens' badges into
different vocabularies at different widths, which is the maintenance cost StatusBadge's own
shortening rule was written to contain (one word, every width).

**The three bands are not a new shape.** `.pp-ogrp > summary` has folded to exactly this since 1.9:
title block on row 1 across, `.age` bottom-left, `.amt` bottom-right. The row now matches the
summary above it, so a group and its lines fold the same way, and `.pp-line` keeps one rule for
both screens. At 360px: the name block gets the full 326px; the second band is a 192px badge and a
60px figure with a 12px gap, which fits with 62px spare — so the longest badge this system can
produce ("203 dagen geleden gevraagd", about 196px) still fits beside an amount.

## The preview could not show the bug, which is the part worth keeping

`.pp-device.phone` is a **container** 360px wide inside a page that is 1400px wide, so
`@media (max-width:480px)` never matches and the frame renders the desktop grid. Every "phone" frame
in this system has that property, and `bundle.css` has carried hand-written `.pp-device.phone`
twins since 1.2 for the app shell — the convention existed and `.pp-line` simply never got one. So
the frame that specified ScreenQueue's phone layout was showing a four-column row while the app drew
a two-column one, and no amount of looking at it would have found GAP-151.

Eight rules are twinned this round and four are left alone on purpose (GAP-153). What I cannot do is
verify them by eye: I write them, the page renders them. I checked which frames are affected
rather than guessing: **`.pp-asset.child`** reaches OrderSection's, AssetListItem's and
ScreenPrintDetail's phone frames, **`.pp-order > summary`** reaches OrderSection's and
ScreenPrintDetail's, **`.pp-printer .fields`** ScreenSettings's and **`.pp-tagrow`** ScreenTags's;
`.pp-cols-2`, `.pp-pick` and `.pp-slot` appear in no phone frame at all, so those three twins are
inert today and exist so the next frame is honest. **If one of those five frames now looks wrong,
that is either a twin I got wrong or a phone layout nobody had ever seen — tell me which and I will
fix the right one.** The four I left are the ones that change control *metrics*
(44px taps, 16px inputs) or placement (`.pp-dialog.sheet`, `.pp-pop.at`); twinning those would
reflow about twenty frames at once.

## GAP-152: a second observation, and the three things it must not become

The owner's distinction is real and 2.10 already refused to model it as a state. What makes this
version buildable is that **both halves are observations**, not classifications:

- A **bron** is "a link exists", and the indexer can find most of them without anyone typing: 15 of
  84 folders hold a `.url` file. So the fact arrives for free and stays true on its own.
- A **notitie** is "he wrote this down". The system renders the words and claims nothing about them.

Three things it is deliberately **not**:

1. **Not a job type.** No "zelf te maken" badge, no derived state, no sort. A note may say "in
   zwart printen"; an absent bron may mean he never kept the page. Naming an inference is the fault
   rule 6 exists for, and GAP-143 refused this exact inference three rounds ago.
2. **Not a precedence.** A typed bron and a `.url` in the folder are both true and both show, the
   way a typed price and measured grams do. The only folding is exact string equality, which is one
   fact written twice.
3. **Not a filter or a search field.** A note is prose the owner wrote for one row; indexing it
   would make it a tag, and 2.8 settled what tags are for.

**Where the klant is concerned, the two fields are opposites, by the owner's own decision:** the
bron appears on the share page, once per print, with no provenance chip and no folder name; the
note appears nowhere a customer can reach and not at all for role User. ScreenSharePage and
PrintNote both say so, before it can be forgotten.

**The 280-character cap on a note** is mine, not the owner's: the row shows one clamped line and the
card shows about three, and a field that can hold a paragraph promises a view that does not exist.
If he wants a paragraph, that is a different field and I would rather be told.

## What I rejected

- **Shortening the queue row's badge on the phone** ("118 dagen"). Reasons above.
- **A `queue.oldest` key** for the summary badge (GAP-149's proposal). Same slot, same words, same
  widths: a second name for one string is what GAP-148 is about.
- **A `=1 {gisteren gevraagd}` arm** for `queue.waiting`. Correct Dutch either way, and "gisteren"
  switches the badge's vocabulary twice in three days.
- **Changing `share.expiresIn`, `overview.expiryNotice` and `outstanding.groupMeta`** in the same
  sweep. They are wrong in the same way, but two existing key pairs may already cover their cases
  and one may be dead copy; guessing which would be inventing a measurement (GAP-154).
- **Twinning the four remaining phone rules** (tap floor, input font size, sheet dialog, `.pp-pop.at`).
- **A remove button for a bron or a note.** 2.9 settled that absence is a value: you empty the
  field and save.
- **Inferring "nog te ontwerpen"** from a note, and **a fourth state** for it. GAP-143 stands.

## What I want measured

1. **Do the new preview twins make any existing phone frame look wrong?** Five frames change:
   OrderSection's, ScreenPrintDetail's, AssetListItem's, ScreenSettings's and ScreenTags's — plus
   ScreenQueue's and ScreenOutstanding's from `.pp-line` itself, which is a real app change and not
   only a frame. A twin that is wrong is my bug; a phone layout that is ugly is a gap nobody could
   see before (GAP-153).
2. **`api.loadErrorBody`, and `invoice.omitted`.** Which string does the running app actually show
   for each? If it is the older one in either case, the duplicate-row fault has been shipping
   wording for several rounds and I would like that confirmed rather than assumed (GAP-148).
3. **Which of `share.expiresIn`, `overview.expiryNotice`, `outstanding.groupMeta`,
   `date.daysOne`/`date.daysOther` and `share.expiresToday`/`share.expiresTomorrow` are imported,
   and which call site renders each?** That decides GAP-154 in one pass.
4. **How many of the 15 `.url` files parse to a URL the app can show**, and whether any folder's
   `.url` points at something that is not a model page. If a third of them are junk, the chip "uit
   de map" is making a promise the folder does not keep.
5. **Still standing from 2.10:** whether design jobs dominate the queue (GAP-143's overturning
   measurement) and the age thresholds on a queue row (GAP-145). GAP-152 does not answer either —
   a bron tells you a job is a download, not how the ten rows split.

## Where I was unsure

- **"alles van vandaag"** for the summary badge at zero days. It is true (if the oldest is today,
  everything is), it fits the slot and it avoids "oudste 0 dagen", but it changes the sentence's
  shape rather than its number, and on Openstaand it sits beside money where "sinds vandaag open"
  is the line form. If it reads oddly in the app, "sinds vandaag" in both places is the fallback and
  it is one key.
- **Whether the bron belongs on a queue row at all**, rather than only on the print. It earns its
  place by telling a download from an evening at a glance, which is the gap; but it is the first
  link in a row of this system, and a row that is not itself a link now contains one.
- **Putting Bron and Notitie in "Deze print".** 2.3 called that card "facts without controls" while
  rejecting the file list, and this puts two writable fields in it. I think the honest rule is 2.0's
  (what belongs to the print is shown once, at print level) and that "facts without controls" was
  already untrue of a card holding the SpoolPicker — but it is a sentence of mine that I am
  overruling, and you should know that is what happened.
- **I have not rendered anything.** Every statement about how these frames look is reasoning over
  the CSS, not a screenshot: the three-band row, the eight twins and both new previews.
- **`project/implementation.md` in this artifact is stale** — it still describes the 2.7 round (app
  version 1.0.0 against design system 2.7, "120 gaps logged"). Everything I decided this round came
  from `DESIGN_GAPS.md`'s GAP-148 to GAP-152 instead. If that file is meant to be the hand-off, it
  did not carry this round's measurements; the gap entries did, and they were enough.

# Changelog 2.10

The queue is a page, on the owner's numbers rather than my instinct, and it is drawn. One new screen, one nav item, one real design question answered and one fourth state **rejected**. No new token, no new class, and `bundle.css` is byte-identical to 2.7 for the fifth round running — the page is built entirely from OutstandingGroup's form. Version 2.9 follows below.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-124 | The queue: page or a block on the dashboard | **A page, `/wachtrij`, and my instinct was wrong.** 2.8 set the threshold at about eight and said no screen gets a nav item for three rows. Measured: **about 4 open requests at a normal moment, regularly above 10** — and the state that costs him is not the steady one, it is *"die moet ik dan allemaal onthouden"*. Two collapsible groups keyed on the states that shipped in 2.9, built from `.pp-ogrp` unchanged, both open by default because at four to ten rows the value is seeing them all. No stat tiles and no expand-all toolbar (GAP-101's lesson), and the ten-row cap with "Toon alle {n} regels" is inherited. Full spec: **ScreenQueue** | **resolved** |
| GAP-143 | "Aanvragen die ik nog helemaal zelf moet designen" against "sliced and waiting for the printer": two groups, one list, or a distinction to refuse? | **One group, and the difference is drawn by whether files exist — not by a fourth state.** Both are *his turn*; the difference is how long it takes, not what kind of act it is. A fourth state would make him **assert** what the app can **observe** (the files appeared), and rule 1 says an asserted stage goes stale in silence while an observed one cannot. So fileless rows **sort first** inside `Mee bezig` with `queue.noFiles` on each, and the summary carries "waarvan {n} zonder bestanden" — the one figure that answers *how much of my own labour is queued*. The word is the **observation**, never the inference: a print can lack files because nothing was downloaded yet, not only because he must design it | **resolved** |
| GAP-143b | A fourth state `Nog te ontwerpen` | **Rejected**, with the measurement that overturns it named: **whether design jobs dominate.** At eight of ten the group heading carries almost everything, the sort does no work, and a group earns its place. At four of ten the sort and the count are enough | **rejected (an observable fact must not become a second assertion)** |
| GAP-123 | Where a fileless record lives | **Confirmed, and now live rather than hypothetical.** The owner chose **hand-linking** — requests reach him anywhere and he only ever makes folders on his laptop — so a record exists with no folder, and ScreenQueue is the **only** place it appears: not the dashboard grid or list, not "{shown} van {total} prints", not the klant count, not the print search. It joins all of them the moment it has files, with no special case | **confirmed as built** |
| GAP-128 | The matching mechanism | **The owner chose, and it is the option I ranked first for UI cost — for a reason neither of us had.** Not "fewest controls": **capture**. A request arrives while he is in someone's kitchen or on the road, and "empty folder first" would ask him there to do the one thing he only ever does at his laptop. "Aanvraag toevoegen" works in a phone browser with no folder. The UI consequence is one control, **"Bestanden koppelen"**, on the row that has none — and it links to a folder that exists; nothing creates one (rule 7) | **resolved** |
| GAP-144 | "Geprint, nog niet geleverd" — the owner's third bucket | **No state exists, so it gets no group, and I am not inventing one.** 2.8 also flagged it as the group nobody would ever clear. My reading is still that *delivered* wants asserting at the moment payment is recorded rather than as an action of its own, which is one fewer thing to remember — but that is a flow question for the owner and nothing is designed for it | **proposed, needs your confirmation** |
| GAP-145 | The age thresholds on a queue row | **Reused from ScreenOutstanding as a starting point and flagged as unmeasured:** neutral to 30 days, `warning` 31–90, `unpaid` over 90. Those were chosen for **money** ageing. A *request* sitting 30 days may already be bad — the owner says one can sit for weeks — so the escalation may be far too lenient here. The app picks the class, so the cut-offs move without a design change | **needs your measurement** |

## New and changed

- **Tokens:** none. `tokens.json` `version` is **2.10**.
- **New classes: none. Changed classes: none. `bundle.css` is byte-identical to 2.7.** ScreenQueue's preview uses **43 distinct classes and every one of them was checked against `bundle.css` by name** before publishing; all 43 exist. The page is `.pp-ogrp` (`summary > .ttl/.age/.amt/.chev`, `.pp-ogrp-list`, `.pp-ogrp-more`), `.pp-line`, `.pp-reason`, `.pp-badge`, `.pp-empty` and helpers — nothing invented.
- **Copy:** **new** `queue.title`, `queue.add`, `queue.group.notDecided`, `queue.group.inProgress`, `queue.groupMeta`, `queue.ofWhichWithoutFiles`, `queue.waiting`, `queue.noFiles`, `queue.linkFiles`, `queue.changeStatus`, `queue.empty`, `queue.emptyBody`, `nav.queue`. All in `copy-deck.md` under *Added in 2.10*. **Reused, not duplicated:** ScreenOutstanding's "Toon alle {n} regels". No key changed, none removed.
- **New component:** **ScreenQueue** (README and preview).
- **Components changed:** AppShell (README only — the nav item, and the phone bottom bar's fourth slot).
- **Previews changed:** ScreenQueue is new: 980px with ten requests across both groups and the fileless rows first; 360px with the same order; **the long case** — 23 in one group, ten rows then "Toon alle 23 regels"; and the empty state.
- **Pages changed:** `README.md` (the first line's version, *Versie 2.10*), `changelog.md`, `copy-deck.md`, `tokens.json`.
- **Contrast report:** unchanged, **no new pair.** `.pp-reason` is `muted` on `surface` and on the summary's `surface-2`; the three age badges are ScreenOutstanding's, already in the report.
- **Breaking changes: none.** One nav item is added and, **on the phone bottom bar only**, Facturen moves into "Meer" to keep the bar at four items. Facturen is unchanged everywhere else and keeps its drawer entry.

## Why the fileless distinction is not a state, at more length

This is the only decision in the round I could have got wrong in a way that would cost the owner work, so the reasoning is written out rather than asserted.

The two kinds of work are genuinely different: one is hours of his own labour with no file in existence, the other is a job waiting on a machine. The implementer was right not to assume it away. But "different" does not settle *where* the difference is expressed, and there were three places it could go: a fourth **state** he sets, a second **group** on the page, or an **observed mark** on the row.

- **A fourth state is the expensive one and it is wrong on this system's own rule.** He would have to move a job from "designing" to "ready to print" by hand — a second assertion for an event the indexer already sees. Rule 1 exists because an asserted fact is the only kind that can be silently stale: he would design something, the files would appear, and the board would still say he had not started. The observed form cannot be wrong that way; it is right the moment the files land, with nobody remembering anything.
- **A second group would be two cards over about five rows each**, and it hides the thing the page is for. The question "what is waiting on me" is answered by one group; "which of those have I not started" is answered by a sort and a count inside it. GAP-101 is the same lesson from the other side: structure in proportion to content.
- **The sort is load-bearing, not cosmetic.** Fileless rows first means the rows with nothing to show are the ones he sees first, which is the inversion of every other list in this app — and it is right here, because a row with a thumbnail and a price is already started.

**What I will not claim:** that this is obviously right. It rests on the assumption that design jobs are a minority of the queue, which is exactly the measurement nobody has. If they dominate, the group heading says "waarvan 8 zonder bestanden" of 10, the sort orders almost nothing, and the honest shape is two groups. That is GAP-143b's overturning condition and I would rather be told than guess twice.

## What I rejected

- **A fourth state `Nog te ontwerpen`** (GAP-143b), for the reasons above.
- **Inventing a "Geleverd" group** for a state the app does not have (GAP-144). A group whose state nobody can set is a box that fills with everything and empties never.
- **Stat tiles on this page.** Two tiles over four rows is GAP-101 with a different noun; the summaries carry every count there is.
- **An "Alles uitklappen" toolbar.** At two groups it is a control for nothing.
- **A fifth item in the phone bottom bar.** 72px apiece at 360px, and the bar becomes the widest thing on the page. Facturen moves into "Meer" instead, on frequency: the queue is daily, an invoice is periodic.
- **Repeating the group's state as a badge on its rows.** The heading is the state; the row carries what differs between rows.
- **Naming the inference.** "Nog geen bestanden", not "nog te ontwerpen", for a fact that is only ever *no files*.

## What I want measured

All of it the owner's, and all of it only available once the page exists — which is the honest order: the page is what produces the data that tunes it.

1. **Whether design jobs dominate the queue** (GAP-143b's overturning condition). The single most load-bearing unknown in this round.
2. **How the ten split across the two groups**, and whether `Nog niet besloten` is really a holding pen or just where everything starts.
3. **How long a request sits before he starts it**, which decides GAP-145's thresholds. 30 and 90 days came from money ageing and are very likely wrong for a request.
4. **Whether the queue is opened daily**, which is the premise of giving Wachtrij the phone bottom-bar slot over Facturen. If he never opens it on a phone, that trade was unnecessary and Facturen goes back.

## Where I was unsure

- **GAP-143 is the call I would most like checked**, and the preview is where to check it: look at the `Mee bezig` group with four of six rows carrying "Nog geen bestanden" and say whether that reads as one list or as two things crammed together.
- **Giving Wachtrij a bottom-bar slot at Facturen's expense.** It is a frequency argument about a page nobody has used yet. Reversible, and measurement 4 decides it.
- **Whether `Nog niet besloten` and `Mee bezig` are the right two groups**, or whether the queue should be one flat list sorted by age with the state as a badge. I chose groups because the state is the thing he sets and the thing he scans by; a flat list would make age the organising fact, which is a different page. At ten rows both work, and I may be designing for a structure the content does not need yet.
- **The empty state may be nearly unreachable.** If there is always something in the queue, "Niets in de wachtrij" is specified and never seen — recorded as that rather than pretended to be load-bearing, like 2.5's compact strip.

# Changelog 2.9

Step 1 of 2.8 is built, so 2.8 is spent and this is a round of its own. Three things: a mechanism in my own GAP-128 ranking turns out **not to work at all**, which is a correction and not a re-ranking; two of 2.8's proposals are **built and confirmed**; and two decisions the implementer made inside my spec are better than the spec and become it. One new rule, no new token, class or copy key, and no pixel. Version 2.8 follows below.

**Amended the same day, before 2.9 was imported, so `version` stays 2.9 and PR #33 can land against one number.** The answer to GAP-139's open copy question turned out to be worse than I guessed, and three rows are added below. **This supersedes the "Copy: none from me" line under *New and changed*:** there are three invoice keys now, one of them a change to a live key, and the request lifecycle's words are recorded in `copy-deck.md` at last. I also credited a decision to the wrong person and that is corrected throughout.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-140 | The declined order is named through `invoice.omitted` — "{count} prints **zonder verkoopprijs** zijn weggelaten" — in a `pp-alert warning` with `triangle-alert` | **The list splits: two conditions, two lines, two tones.** A print quoted at EUR 24,50 and refused was announced as having no sale price, in orange: the reason false and the ink claiming something to do on the one line whose point is that nothing is. The `warning` alert keeps **only** the missing-price exclusions (there is something to do: set a price, remake the invoice). The declined ones become a **`muted` `.pp-reason` line in the preview card**, under the `Regels` row it qualifies, **no alert, no border, no glyph** — GAP-120's ruling applied to the same shape of fault. Not `info` either: `info` explains or suggests, this states what the document contains. New key `invoice.omittedDeclined`, borrowing the badge's own words so the line and the badge speak one language | **resolved** |
| GAP-141 | Both exclusion lines: no plural form, and `{names}` unbounded | **ICU plurals and a cap of five.** "1 prints zonder verkoopprijs **zijn** weggelaten" renders today and n = 1 is the common case for that alert, so `invoice.omitted` **changes** (same key, correct grammar). And 83 price-less prints would list 83 names in one sentence in a 560px dialog: both lines name at most five, then `invoice.omittedMore` "en {count} andere". `do-dont.md` has required a cap on a growing list since 2.2 and this alert was exempt by oversight | **resolved** |
| GAP-142 | 2.9's own wording: "an amount left out of a document is named in **that document**" | **Narrowed, and the fault is mine.** Read literally it puts the operator's internal exclusions on a **customer invoice**. The rule is: **the surface where the operator creates or reviews a document names what it leaves out.** Neither line appears in the Concept PDF, the final invoice, the Overzicht or the share page — a customer needs no list of what they declined, and internal reasoning has been barred from customer-facing output since 1.0 | **resolved** |
| GAP-128 | "The app creates the folder" as a way for a record to meet its files | **Struck from the ranking: it is not a trade, it does not work.** The prints root is a **Nextcloud-synced folder**, and a folder written straight to disk behind Nextcloud's back is never indexed by it — a dead directory that syncs to no device, holding a record that exists on the server and nowhere else, with the owner's later files landing in a folder Nextcloud ignores. I had ranked it joint-first at zero UI cost; the UI cost was right and irrelevant. **Three options survive and the top is now one: hand-link once**, then *empty folder first* (made by the owner **through Nextcloud**, and still bound by GAP-122's record-of-origin constraint), then name matching | **rejected (the mechanism cannot work: Nextcloud owns the tree)** |
| GAP-137 | `/prints:ro` is about **ownership**, not only safety | **New rule 7.** Nextcloud owns that tree; anything written behind it is invisible to the person it was written for. So **no screen may offer to put a file where the operator will look for it** — no "create folder", no "save to the prints folder", no "export here", and no empty state that tells them the app will make a place for their files. The portal reads that tree and writes to it never. This generalises past the mount: wherever another system owns a location, the design treats it as **read-only in principle**, not as a permission that might be widened | **resolved** |
| GAP-127 | How a declined quote reads | **Built as specified and verified.** `Niet doorgegaan` with the neutral badge, the amount `muted` and prefixed "was" with **no strikethrough**, the date, and out of every total — measured: a declined order leaves Openstaand, EUR 299,82 → 299,65 → 299,82, and comes back. The three words are exactly as written. Nothing in the system changes | **confirmed as built** |
| GAP-131 | Setting a state from a selection | **Built: `Status instellen` beside `Prijs instellen`**, verified on three prints at once, axe 0, 1455 backend tests on three databases | **confirmed as built** |
| GAP-138 | "Geen status" as a fourth choice in the dialog rather than a separate clear action | **The implementer's call and it is right; it becomes the rule.** Absence is a **value**, not an operation: four radios, one of them "Geen status". A separate "Status wissen" would make clearing a different kind of act from setting, give the bulk report two shapes to explain, and offer a destructive-looking button for something that is not destructive. **It is also the precedent this system already set** — BulkDialogs' spool dialog has carried "Geen spoel" as the **last option in the list** since 1.4, not a remove button, and the Tags page has "Geen kleur" in the palette. I had not generalised it; it is generalised now | **resolved** |
| GAP-139 | A declined order is **named** in an invoice draft's exclusions instead of silently absent | **Better than my spec, and adopted.** 2.8 said only "excluded from every total", which is satisfied by saying nothing — and silence is exactly what the operator cannot check. **An amount left out of a document is named in that document, with its reason.** This too was already the system's habit and I failed to state it: ScreenInvoiceExport has carried a `warning` alert naming the prints left out for having no price since 1.0. **One thing to confirm: which string does it use?** If the declined order is listed under `{n} prints zonder verkoopprijs zijn weggelaten: {namen}.` that line is false of it — a declined order **has** a price; the reason it is out is that it was refused. A separate reason needs a separate sentence | **resolved**, with the copy key to confirm |

## New and changed

- **Tokens:** none. `tokens.json` `version` is **2.9**. No variable added, renamed or removed.
- **New classes: none. Changed classes: none. `bundle.css` is byte-identical to 2.7**, as it has been for three rounds.
- **Copy (replaces this round's first "none"):** **new** `invoice.omittedDeclined`, `invoice.omittedMore`; **changed** `invoice.omitted` (plural forms added — same key, same meaning). And the request lifecycle's words are in `copy-deck.md` at last, now that they are rendered and I have seen them verified: `status.notDecided`, `status.inProgress`, `status.notProceeded`, `status.notProceededOn`, `status.wasPrice`, `bulk.setStatus`, `bulk.statusNone`. **Those seven key names are mine and provisional** — I verified the text, not the identifiers, so if the app already uses different names the app's names win and I will align the deck. All under *Added in 2.9*. No key removed.
- **Components changed (README only, no preview):** StatusBadge, BulkDialogs, ScreenInvoiceExport.
- **No new class and no CSS change**, including for the new line: `.pp-reason` is `text-xs`/`leading-xs` in `muted` and has meant "a fact that needs nothing" since 2.7. `muted` on the preview card's `surface-2` is in `contrast.md` at 4.5:1 or better in both themes; **no new pair**.
- **Pages changed:** `README.md` (rule 7 under *What this portal may claim it knows*, the first line's version, *Versie 2.9*), `do-dont.md` (*Added in 2.9*), `changelog.md` (this section, plus a correction inside 2.8's GAP-128 passage), `tokens.json`.
- **Contrast report:** unchanged, no new pair.
- **Breaking changes: none.** One option is withdrawn from an advisory ranking and one rule is added; nothing built changes.

## Why GAP-128's third option is a correction and not a re-ranking

I ranked "the app creates the folder" level with hand-linking, at zero UI cost, and added an opinion I was not asked for: that I would not spend the read-only mount to save a UI problem worth one button. **The opinion was beside the point and the ranking was wrong on its own terms.** There is no trade, because there is no working version of the option: Nextcloud owns the prints tree, a directory created behind it is not indexed, and the result is a folder on the server that reaches none of the owner's devices — with a record pointing at it and the files he later drops in landing in a folder Nextcloud does not index. The interface would indeed have cost nothing. It would have cost nothing and not worked.

**What I take from it about my own half.** I costed three mechanisms by what they would do to the screens and treated the fourth as a policy question, because it was the one where I had an opinion. A mechanism I rank at all, I have to be able to say *works*; where I cannot, the honest entry is "not mine, and I do not know whether it is possible", which is what GAP-128's status says and what the two surviving entries now say explicitly.

## Rule 7, and why it is wider than this mount

`/prints:ro` had been described to me as a safety property — the app cannot damage 2.6 GB of real files — and I repeated that framing. The real reason is **ownership**: Nextcloud owns the tree and anything written behind its back is invisible to the person it was written for. A safety property can be weighed against a benefit. Ownership cannot: writing there does not produce a worse outcome, it produces **no** outcome, visible to nobody.

So the rule is about what a screen may *offer*, which is squarely mine: **no control, empty state or help line may tell the operator the app will put a file where they will find it.** The tempting places are exactly the ones a designer reaches for — an empty state offering to create the first folder, a "save here" beside a download, a queue row offering to make a home for a request that has none. All of them are now refused, and GAP-128's surviving options are the two that respect it: the owner makes the folder through Nextcloud, or the app never touches the folder at all.

**Generalised past this app:** where another system owns a location, treat it as read-only *in principle* rather than as a permission that might be widened later. A design that assumes a mount could be made writable has assumed the wrong thing about who the location belongs to.

## The two decisions I am adopting from the implementation

Both are cases where the spec was satisfiable by something worse, and the person building it chose better.

**"Geen status" as a value (GAP-138) — and the credit is the owner's, not the implementer's.** I attributed this to the person who built it; it was the **owner's** decision, and his reason is better than the one I gave: **a state must always be able to go back, because a klant can change their mind about one print.** That is a fact about his work, where mine was a fact about UI symmetry — and his is the one that makes the fourth option necessary rather than merely tidy. My own reasons still hold underneath it (clearing and setting become the same act with the same result shape, and nothing destructive-looking is offered for an act that destroys nothing), and the system had already decided it twice without my noticing: "Geen spoel" as the last option of the spool list since 1.4, "Geen kleur" in the tag palette.

**Naming the exclusion (GAP-139).** "Excluded from every total" is satisfied by silence, and silence is the one outcome the operator cannot verify. Naming it with its reason is the same instinct as rule 1 and as GAP-120: a document that is quietly incomplete is worse than one that says what it left out. Also already the habit here, since ScreenInvoiceExport has named price-less prints in a `warning` alert from the start.

**The one thing to check is the string.** A declined order excluded from an invoice is not a print *zonder verkoopprijs* — it has one. If it is being listed under that sentence the alert is now false about one of its own entries, which is the GAP-120 fault (a true notice carrying a reason that does not apply). Tell me which key it uses and, if it is the shared one, the new sentence is one line and I will write it.

## What I want measured

Nothing new. Everything open is the owner's: GAP-129, the queue's size, the matching mechanism from the **three** surviving options, and whether GAP-123 and GAP-124 get built at all.

## Where I was unsure

- **Whether this deserved a version of its own.** 2.8 is built, so its text is now history and I did not want to rewrite it to look as though it had always known about Nextcloud. The GAP-128 passage inside 2.8 carries a correction marker pointing here, and nothing else of 2.8 is touched.
- **Whether rule 7 overreaches — answered from the implementation side, and it does not.** It bit immediately: "an empty state offering to create the first folder" is what the implementer says they would have reached for while weighing the empty-folder option, and it would have failed silently until a folder did not sync on the owner's phone. The instance behind the rule is not the mount, it is *another system owns this tree*, which is not rare. I am recording that because I had logged the doubt and it deserves its answer in the same place.
- **I credited the "Geen status" decision to the wrong person** — it was the owner's, with a better reason than mine, and it is corrected above and in StatusBadge, BulkDialogs and `do-dont.md`. A design system's record of *who decided* is part of what it is for, and I got it wrong by assuming the person who told me a decision had made it.
- **Whether the declined line should be in the preview card at all** rather than a second, quieter alert. I chose the card because it already updates `aria-live="polite"` with the filters, which is exactly when this line changes, and because a second bordered block costs real room in a 560px dialog. A reasonable person would keep both exclusions adjacent so they read as one list with two reasons. I think that is the weaker option — one block cannot carry two tones, which is the whole of GAP-140 — but it is the call I am least certain of in this amendment.
- **Whether "resolved" is the right word for GAP-138 and GAP-139.** The app already does both; what changed is that the system now says so and says why. I used **resolved** rather than *confirmed as built* because the rules are new text in this export and the second one has a copy question still open — but a reasonable reader could call them both confirmations of someone else's good judgement, which is what they are.

# Changelog 2.8

No gap was raised this round. The owner asked whether the tag system earns its place, and the answer turned out to be a request lifecycle the portal does not model. **Nothing is drawn, no pixel changed, and the queue must not be built yet** — six rules are written down, four decisions are rejected outright, four are proposals the app must not build yet, and three measurements are still open — all three the owner's, because all of the implementer's came back and **four figures of mine were corrected in the process**, the last of them by a flag I had put on my own arithmetic before it was checked. One of the open questions is the owner's own and I am not answering it. Version 2.7 follows below.

**Amended the same day, before anything was imported. `version` stays 2.8** — nothing of this round reached the app, so this is the round corrected in place rather than a 2.9, and the implementer's `VERSION` does not move.

**I asked for measurement 5 and it is retracted, with the reason recorded rather than the question quietly dropped.** I asked whether any print had ever had an order with `number > 1`, and said that if nabestellingen never happen I would rather retire OrderSection's multi-order apparatus from 1.4. **Nabestellingen do happen** — the owner says repeat orders have been made on several prints. The "84 prints, 84 orders, all number 1" figure came from the **local build, whose database holds nothing hand-entered**: 0 prices, 0 payments, 0 spools of 215 slots, 0 invoices, 0 tags. So the figure was real about that database and meaningless about the library, and I had already been given evidence to the contrary without noticing it: BulkDialogs' own failure reasons have read "Nabestelling {n} is al betaald." since 1.4, which is this system designing for a case I then proposed to retire. **OrderSection keeps its weight, nothing is deprecated, and measurement 5 is unanswered rather than answered zero.** The retraction stands here instead of the question being edited away, as 2.2's four container widths do.

**The rule that follows, and it is the useful part (rule 6 in `README.md`).** A figure out of a database with nothing in it is not a measurement. This library yields **two classes** of number and they must be labelled: those derived from **the files themselves** — file names, the 3MF/STL split, the thumbnails, 84 prints, 215 slots, the 2 prints with no model files — which are real and have driven every decision from 2.3 to 2.7; and those derived from **anything a person typed** — prices, payments, spool assignments, invoices, tags, order numbers — which in the local build are all zero and say nothing at all. Every measurement this round asked for is in the second class. **And a third provenance appeared later in the round, which rule 6 now carries too:** the label-rule counts (55, 3, 16, 36) are counted by a re-implementation of this system's own spec, not by the shipped `fileLabel.ts` — the two disagreed three times on the residue, which is how the ceiling bug surfaced. A figure counted from a copy of the spec is **"as specified"** and may not be quoted as **"as rendered"**; here the two coincide only because the sweep never fires in this library. That is why the three that matter are now addressed to the **owner**, not to the implementer, who cannot reach them.

**The one thing I will not hedge on, because it is a fault today and not a feature request.** A print that was quoted and turned down is `noPrice`, which puts the `warning` badge **"Geen prijs"** on it. 2.7 wrote the rule eight days ago: *a warning is for something that needs doing; a fact that needs nothing gets plain ink.* That print needs nothing — it is finished, the customer said no. So the system is already breaking its own newest rule on a real record in the real library, with no new feature involved, and the `Geen prijs` filter already returns it as work to do. **That is why this is not scope creep.** It is also the whole answer to "do the tags earn their place": the tags are not noise, they are the operator routing around a badge that is wrong about his print.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-118 | "Geldt nu voor 2 slots zonder eigen spoel." while no whole-print spool is set | **Settled in 2.7 and verified in the app**: four cells, four strings, *nu* in one column only. The paragraph still asking for a ruling in `implementation.md` is **stale** — the same file measures all four cells rendering correctly two sections earlier. Nothing to do | **confirmed as built** |
| GAP-119 | Whether `--pp-modelbtn-max` moves now the name distribution is measured | **It already moved: 200px → 240px in 2.5, on your own figures** (median 25 chars / 181px, plus 52px of chrome = 233). It does not move again: p90 at 412px and the longest at 759px fit in no width that leaves the strip a picker, and 2.5 retired width as the lever. `implementation.md` still says "built at 200px … have not touched the value" — **verify which value the app has**; the file cannot both have imported 2.5 and be at 200px | **confirmed as built** |
| GAP-121 | Do the tags earn their place, now that the five production tags look like a state machine? | **Yes — as labels, and the rule for what a tag may be is written down.** A tag is a property; a label whose values are mutually exclusive and ordered is state and gets a status. The reason is mechanical and in this system: TagEditor's rows are checkboxes, FilterBar's tag filter is AND, tags have no order and carry no date, so `printing` + `done` on one print is representable and nothing refuses it. Of the owner's five, `gift` is a tag; `waiting`, `abandoned`, `printing`, `done` are stages. **Nothing to build** — no class, token, copy key or migration | **resolved** |
| GAP-122 | What shape a record with no files takes | **Not the shape of a record with files.** No PrintCard, no thumbnail well, no SpoolSwatch, no 40px `.pp-thumb`, and the "no preview" box icon is **not** reused — it means *this print has no picture*, not *this job has no files*, and one glyph may not carry both. It reads as a line of text: a `.pp-table` row or a stacked block. **Nothing to build today**; it is a refusal that binds whatever gets built | **resolved** |
| GAP-123 | Where a request lives before it has files | **Not on the dashboard.** Absent from the card grid, the list, "{shown} van {total} prints", the klant chip's count and the print search, because every one of those answers *what is in my library*. It appears there the moment it has files, with no special case. A *declined* print keeps its place — it has files | **proposed, needs your confirmation** |
| GAP-124 | The queue: what it shows, and page or block | **A list grouped by stage, not a grid; its own nav item "Wachtrij" if it is long, a block on the dashboard if it is short.** Which one is a measurement, not a preference — see below. Shape, grouping, the 90-row case and the empty case are specified below so the decision is not re-litigated | **proposed, needs your confirmation** |
| GAP-125 | Should the queue schedule — dates, priorities, drag-ordering, "when will this print" | **No.** One operator, one printer, 84 prints. A stage per job is the whole value; a planner is a second product with its own staleness problem, and every date in it would be an asserted fact nobody re-checks. Rejected now, before it is asked for, so the queue does not grow into one | **rejected (scheduling is a second product; a stage per job is the whole value)** |
| GAP-126 | Carrying the request lifecycle in the payment StatusBadge | **No.** That badge's payment group means *money owed* and the whole UI reads it that way; the completeness group means *an input is missing from a record*, which a declined quote is not. A request stage is its own group, neutral or `info`, never `paid`/`unpaid`/`warning` | **rejected (the payment group means money owed; a request stage is not money)** |
| GAP-127 | How a declined quote reads, since the owner wants the price kept — **widened**: it is one of **three** missing states, not one | **Neutral badge + `circle-x` + "Niet doorgegaan", the amount `muted` and prefixed "was", no strikethrough, out of every total, with the date.** Not the word *Afgewezen* (three letters from *Afgeschreven*, in the middle of a long word, in the same column). No new token and no new colour pair. **Widened below to the whole request group**: `Nog niet besloten` and `Mee bezig` in `info`, `Niet doorgegaan` in neutral — live states take the live ink, the settled negative one does not | **proposed, needs your confirmation** |
| GAP-128 | How a record created before its files meets those files | **Not mine to choose.** It is a data decision and the owner and implementer own it. What I can give is the UI cost of each of the four, below, and one constraint it must satisfy | **rejected (not ours: a data decision — UI costs given below)** |
| GAP-129 | Whether a tag set really does hold two stages at once in the real library | My central argument in GAP-121 is mechanical and I have not seen it happen. If **no** print carries two of the four stage tags, the argument is sound but theoretical, and I want that on the record rather than implied. **Production only** — the local build has 0 tags, so this is the owner's to answer, not the implementer's | **needs your measurement** |
| GAP-132 | Is **revision** — v1…v5 of one design, where the later supersedes the earlier — a fourth thing, or is it what *in progress* looks like? | **A fourth thing, and the answer is a rule rather than a feature.** It is not a stage: the three request states are about the **job**, revision is about the **files**, and a job sitting in `Mee bezig` is exactly where versions accumulate — so the stages do not cover it and do not conflict with it either. Supersession is the **third relation** between two files of one print and the only one carrying a direction. The rule: **a direction between two files may be drawn only where it is observed or recorded, never where it is read out of the file's name.** Nothing is drawn until it is recorded | **resolved** |
| GAP-133 | Making the model strip version-aware: v5 first, v1–v4 collapsed, one marked "huidige" | **No.** The direction would be inferred from the middle of a long file name — the exact zone 2.4–2.6 proved unreadable (`v10` sorts before `v9`; the `22` in `Bloembak clip corner 22` is a width, not a version) — off a figure its own author calls a regex. Hiding four buttons on that basis is GAP-115's fault with a worse consequence: the operator cannot reach a file. The sort stays the file name and every button stays an equal | **rejected (the direction would be inferred from the one zone of a name this system cannot read)** |
| GAP-134 | How much of 2.6's accepted residue is version pairs rather than distinct parts | **Zero of 55 — my hypothesis is falsified and 2.6 was right.** The pair that prompted it is two files with the byte-identical name (the GAP-120 case), not `v1` against `v2`; versions in this library never collide. 2.6's residue is exactly what 2.6 called it. **It strengthens GAP-132** rather than weakening it: supersession is a relation the label never meets, not a special case of one it does | **confirmed as built** |
| GAP-135 | The label rule had two floors and no ceiling, so a sweep derived from it can propose a tail longer than its own window | **The ceiling is stated as arithmetic, and the spec hole was mine.** The tail never exceeds `W - 1 - 2` characters **including the extension** — **12** at the strip's 15-character window — the head is `W - 1 - tail`, and the sweep runs over the tail from `extension + 3` up to 12 and back down to the bare extension (stem at most 8 for a four-character extension). 2.5 wrote the floors and not the bound, and an implementation grew the *stem* to `W - 1 - 2` and added the extension, proposing a 16-character tail in a 15-character box. Latent, not live, in this library; the code fix is the implementer's. Same shape of fault as GAP-130 | **resolved** |
| GAP-136 | The split I derived by subtraction, and what class of figure any of these counts are | **16 separated, not the 19 I derived — and the split is three buckets, not two: 55 = 3 byte-identical + 16 separated + 36 unreachable.** `55 - 36` counts the byte-identical pairs as separated; they are **neither**, because the rule never runs where there is nothing to tell apart. That is the rule's **domain**, not a failure of it, and it is now stated as such. Second half, and it is a rule: **a figure counted from a re-implementation of a spec is "as specified", not "as rendered"**, and may not be quoted as the latter | **resolved** |
| GAP-130 | `pp-allcust` on the wrong element in the app — and the spec that could not have told them | **The dialog's markup is named, which it never was.** `pp-allcust` goes on the same element as `pp-dialog`; `pp-custs` is the grid wrapper inside `.pp-body` and appeared in **no README in this system**, only in `bundle.css` and the preview. The app bug is the implementer's; the half of it that is a spec hole is mine, and this closes it | **resolved** |
| GAP-131 | The migration pass: the owner is about to set a state by hand on every print in the library, and he named **six** states while doing it | **The six are the specification, and three of them have no home: refused, undecided, in progress.** And the pass itself is the hardest case this design has: the cost of a fiddly state is multiplied by the whole backlog, so a state must be settable **from the list, on a selection, without opening the print** — `Status instellen` in BulkActionBar beside `Prijs instellen`. Scheduling stays rejected; this is not a planner, it is data entry he has to do once | **proposed, needs your confirmation** |

## New and changed

- **Tokens:** none. `tokens.json` `version` is **2.8**. No variable added, renamed or removed. Deliberately none: every distinction decided this round is carried by a word, an icon, ink weight or a refusal, and nothing here needs a hue.
- **New classes: none. Changed classes: none. `bundle.css` is byte-identical to 2.7.** Every class named in this round's prose already exists in it and was checked line by line: `.pp-dialog`, `.pp-allcust`, `.pp-body`, `.pp-custs`, `.pp-card`, `.pp-cust`, `.pp-badge`, `.pp-badge.neutral`, `.pp-table`, `.pp-rowlink`, `.pp-thumb`, `.pp-empty`, `.pp-reason`, `.pp-chip`. No preview changed, so no preview introduces one.
- **Copy:** none. The Dutch wording proposed for the declined quote and the request stages is in StatusBadge's prose and is **deliberately not in `copy-deck.md`**: the deck is the register of live copy, a key in it reads as an instruction to build, and the state it names does not exist. Confirm the direction and the keys go in with the version that builds it. This is the GAP-072 failure mode and I am not repeating it.
- **Components changed (README only, no preview):** TagChip, TagEditor, StatusBadge, ScreenDashboard, CustomerChips, BulkActionBar, AssetListItem, ModelPicker.
- **One figure in the brand book is corrected, not quietly replaced:** the blind zone holds **36** pairs, not the **40** stated since 2.6. `README.md`'s *Typography* rule, its *Versie 2.6* paragraph, ModelPicker and 2.6's own changelog section each carry the new figure and a note of where the wrong one came from. The decision it supported does not move.
- **Previews changed:** none.
- **Screens changed:** none. **No `ScreenQueue` exists in this system** and none is added; the queue below is prose in a changelog on purpose, so no import can mistake it for a spec.
- **Pages changed:** `README.md` (new section *What this portal may claim it knows (2.8)* with its five rules, *Versie 2.8*, and the first line's version, which still said 2.6), `do-dont.md` (*Added in 2.8*), `changelog.md`, `tokens.json`.
- **Contrast report:** unchanged, **no new pair.** Everything proposed uses `neutral` on `surface-2` and `muted` on `surface`/`surface-2`, both already in the report at 4.5:1 or better in both themes.
- **Breaking changes: none.** Nothing is withdrawn and the app gains no obligation it can act on today. What it gains is five refusals.

## The queue, specified far enough to be refused (GAP-124)

Proposed. **Do not build it.** It depends on GAP-123 and on a measurement.

**Page or block is a measurement, and this system has made this mistake before.** GAP-101 gave the Tags page a three-column grid for what turned out to be two tags, and the correction was mine to write. The queue has the same hazard: if the normal number of live jobs is three, a whole page with a nav item is the same error with a different noun, and the right answer is a block **above** the prints on the dashboard — which also puts it where he already looks. My threshold, chosen the way the six-tag threshold was: **a page from about eight live jobs, a dashboard block below that.** Measure before choosing.

**If it is a page:**

- **A list, never a grid.** The rows differ in which fields they even have; a tile grid is for comparable objects and these are not comparable. `.pp-table` on desktop, the stacked block at 480px and below, as PrintRow already does.
- **Grouped by stage, in a fixed order** — the three the owner named: *gevraagd, nog niet ontworpen* / *ontworpen, nog niet geprint* / *geprint, nog niet geleverd*. Newest first inside a group. Groups are **collapsible** and that is load-bearing, not polish: `do-dont.md` 2.2 already says a list that grows gets a cap.
- **The row:** the stage badge with its date where the stage is asserted, the klant, the name or the sentence the request was typed as, and the price in `muted` where nothing is owed yet. A 40px `.pp-thumb` **only where a render exists**, and no placeholder where one does not — the row simply starts at the text (GAP-122).
- **The long case is the third group, and it is the one that will break.** *Printed but not delivered* is the group nobody ever clears: he prints it, hands it over, and never comes back to the app to say so. At 90 rows it is the whole screen, and the first two groups — the ones he actually asked for — are below the fold. So that group is **collapsed by default and shows its count in the heading**, the other two open; and if it grows past about 40 it needs a second answer, probably "delivered" being asserted at the same moment payment is recorded rather than as its own action. That is a flow question for the owner, flagged now rather than discovered at 90 rows.
- **Empty:** per group, one `muted` line inside the group rather than an `EmptyState` panel each (three dashed panels stacked is noise). For the whole screen empty, the `.pp-empty` panel, once.
- **Phone at 360px:** the stacked block, groups collapsed except the first, 44px targets. Both themes, no new colour.

**What it must not show:** no dates it chose itself, no priority, no ordering by hand, no "expected" anything (GAP-125). And it does not read a tag to decide anything (GAP-121).

## GAP-128: the four mechanisms, and only their UI cost

The matching mechanism is yours and the owner's. Ranked by what each costs the operator UI, which is the part I can speak to:

1. **He links them by hand, once.** Cheapest from my side and it composes with everything above: the unlinked requests already have a home — they are the queue's first group — and the link is one control on one row. One honest action, no silent failure, no reconciliation screen.
2. ~~**The app creates the folder.**~~ **Struck in 2.9: this option does not work.** The prints root is a Nextcloud-synced folder, and a directory written behind Nextcloud's back is never indexed by it — a dead folder reaching none of the owner's devices. There is no trade here and never was; the reasoning below is left as written, including the opinion I was not asked for. *(What it said: no UI cost at all, nothing to design, and that I would not spend the read-only mount to save a UI problem worth one button. The UI cost was right and irrelevant. See 2.9, GAP-128 and rule 7.)*
3. **He makes an empty folder first.** The most expensive on *my* screens, and the cost is not obvious: those records become prints immediately, so they land in the card grid, in both counts, in every filter and in the print search with nothing in them — and an empty folder is indistinguishable from one whose files were deleted, so one card shape would have to mean two different facts, which GAP-122 forbids. **If this route is chosen, the app must store something that says "this record was born as a request", or rule 2 cannot be honoured.** That is the one place where a rule of mine constrains your data decision, and I would rather say it here than discover it in review.
4. **Name matching.** Worst from my side, and the reason is the failure mode rather than the work: a near-miss needs a reconciliation UI — an unmatched list, a review step, two records for one job — and reconciliation screens are used wrong and fail quietly. Everything above is designed to be read at a glance; this is the one option that needs a screen for reading carefully.

## What I rejected, with the reason

- **Scheduling in the queue** (GAP-125): a second product, and every date in it an asserted fact nobody re-checks.
- **The request lifecycle in the payment badge** (GAP-126): the payment group means money owed and the whole UI reads it that way.
- **`unpaid` ink on a declined quote**: it was never owed. `Afgeschreven` is `unpaid` because that money *was* owed; if a refused quote joins it, every openstaand-shaped surface in the app reads a debt that does not exist, and the operator's own figures go wrong in the direction that matters.
- **The word *Afgewezen***: three letters from *Afgeschreven*, differing in the **middle** of a long word, in the same column of the same list. This system spent 2.4, 2.5 and 2.6 on the fact that a difference in the middle of a string is the one the eye does not catch; writing that pair into the status column would be ignoring three rounds of its own work.
- **A strikethrough on the declined price**: MoneyDisplay's `<s>` means *replaced by that one*. This price was not replaced, it was refused.
- **Tags as the queue's grouping or filter** (GAP-121): the mechanics do not support it and reading a tag to decide what a screen shows is exactly the coupling tags were kept free of.
- **Adding the proposed copy keys to the deck** this round: see *Copy* above.
- **Rejecting the whole direction** — "the portal should stay a record of files that exist" — which was offered to me as a real answer. I am not taking it, for one reason that is not a preference: the `Geen prijs` badge is wrong on a declined print **today**, in the real library, with no new feature. "A record of files that exist" is a fine scope for the dashboard and an untenable one for a badge that claims work is outstanding. If the owner wants the smallest possible change, the smallest honest one is still a state that says "this one is finished and nobody is paying" — not nothing.

## The migration pass, which is now the design's hardest case (GAP-131)

The owner is about to go through **every print in production by hand** and set what is paid, what was ordered again, what was asked for and refused, what is unpaid, what was asked for and is still undecided, and what was asked for and he is still working on. That is not a hypothetical workflow; it is a migration he has to do, and those **six states are ones he named without prompting**, which makes them a specification rather than a guess.

Mapped against the app: *paid* is `paid`, *unpaid* is `open`, *ordered again* is a second order (which exists, see the retraction above). **Three have no home at all: refused, undecided, in progress.** So GAP-127 was too narrow — I specified the badge for one of three states and called it the declined case. The request group has three members:

| state | word (proposed) | icon (proposed) | ink |
|---|---|---|---|
| asked, nothing decided yet | **Nog niet besloten** | `circle-help` | `info` on `info-tint` |
| asked, being worked on | **Mee bezig** | `hammer` | `info` on `info-tint` |
| asked and refused | **Niet doorgegaan** | `circle-x` | neutral (`surface-2` + `border`) |

The split of ink is the decision worth keeping even if the words change: **a live state takes the live ink and a settled negative one does not.** `Niet doorgegaan` is finished and needs nothing, so it is neutral, exactly as `Gearchiveerd` is; the two open states are notices, which is what `info` has always been for. All three pairs are already in `contrast.md` — **no new token, no new colour pair, and nothing here needs a hue.** Both themes are covered because both grounds already are.

Two words I am least sure of: **"Nog niet besloten"** is three words where the status column is usually one, and **"Mee bezig"** is his phrasing where *"In bewerking"* is the standard Dutch UI term. `hammer` is the weakest icon of the three. The owner's own vocabulary should win all three, and none of them is in `copy-deck.md` yet.

**What the pass costs, and the one thing it changes structurally.** Every state specified here is one he will enter by hand across a whole library, so the cost of a state that is fiddly to set is multiplied by his backlog, and the cost of a *missing* state is that he stands in front of a print with nowhere to put it. That makes a per-print dialog the wrong primary path: setting a state must be possible **from the list, on a selection, without opening the print** — proposed as **`Status instellen`** in BulkActionBar beside `Prijs instellen`, following BulkDialogs' existing contract in full (one result per print, a toast "{ok} van {totaal} bijgewerkt", a `warning` alert listing the prints that could not change and why). Proposed, not specified: the dialog's own anatomy waits on the state machine being agreed.

This also argues **against** my own instinct on GAP-124. A migration pass needs a working surface that can be sorted and worked through; a block on the dashboard is a glance. I still think the block is right for the steady state afterwards, and I am no longer confident the two have the same answer. Do not settle it on a number neither of us has.

## Revision is a fourth thing, and the answer is a refusal (GAP-132, GAP-133)

Asked whether revision — model, print, let the user try it, change it, send a final one — is the same thing as the request lifecycle, my answer is **no, and the two do not compete.** The three request states are about **the job**: what has been asked, decided, worked on, refused. Revision is about **the files**: which of them replaced which. A job sitting in `Mee bezig` is precisely where versions accumulate, so the stages describe the job correctly while saying nothing at all about which file is current — and that is the gap, not a conflict. If it were only a stage, `Case_A_v1` through `v5` would still be five equals in the strip after the stage was set, which is exactly the complaint.

**So the system does have a position on a set of files where one supersedes the others, and the position is a rule plus a refusal.** The rule is in AssetListItem's 2.8 entry, with the three relations tabulated: **a direction between two files may be drawn only where the direction is observed or recorded — never where it is read out of the file's name.** "Mogelijk dubbel" passes it (identical bytes and an index order are observed, which is why that badge may mark the later file only). The 2.7 same-name line passes it by claiming no direction, because none is observable. Supersession fails it today, so **nothing is drawn** — no dimming, no "oud" badge, no grouping, no reordering, and the strip does not change (GAP-133).

**This is a refusal and not a feature, on purpose.** Three proposals in this round are already waiting on production counts the owner does not have yet, and a fourth would be noise. What the rule buys now is that nobody builds a version display off a file name later and calls it resolved, and that when the owner does want his revisions shown, the question is already framed: a recorded direction, dated and authored, drawn in the "Bestanden" card where files are read, not in the picker where they are chosen.

**Where I was wrong, and the measurement said so.** I suggested that part of 2.6's accepted residue might be version pairs — the same object at two ages, which no label should be asked to separate. **It is zero of 55.** The pair that prompted the idea has a byte-identical name, which is the GAP-120 case and not a version pair at all, and versions in this library sit in different prints or far enough apart in the name that they never collide. 2.6's reasoning stands untouched, and the version question turns out to be cleanly separate from it — which is the better outcome: supersession is a relation the label **never meets**, so GAP-132's refusal does not compete with the label rule at any point. I recorded a hypothesis as a re-reading of three rounds of work before it had a number. It took one query to falsify, and I should have framed it as the question it was.

## What I want measured — and who can answer it

The local build's database holds nothing hand-entered, so **the implementer cannot answer any of these.** They are the owner's, and the migration pass above will generate most of them as a by-product. Nothing in this round should be built before then.

1. **Do any prints carry two of the four stage tags at once** (`waiting`, `abandoned`, `printing`, `done`), and how many carry each? This tests **my own** central argument in GAP-121. The argument is mechanical and holds either way, but if the answer is zero I want it recorded as theoretical rather than left looking like evidence. **Owner, production.** (GAP-129)
2. **How many jobs sit in each of the three queue groups at a normal moment**, and how long does a request sit before it has files? This decides page versus dashboard block, and after the paragraph above I am genuinely unsure. **Owner, production, and the pass will produce it.**
3. **Of the jobs he calls refused, how many have a price set?** He wants the price kept; I would like to know there is one to keep. If most are priceless, the `muted` "was € 24,50" is dead copy and the badge carries it alone. **Owner, production.**
4. **Answered, and it retracts a claim of mine.** The 2 prints have **zero model files but not zero files**, and nothing in this library has no files at all — a record cannot exist without files, because the indexer is the only writer. So I was wrong to say GAP-122's rule is "live today": the collision it guards against, one card shape meaning both *born as a request* and *files deleted*, **cannot occur yet**. The rule stands as a constraint on whatever gets built; it is hypothetical, not live, and I overstated it.
5. **Answered: zero**, the residue corrected from 40 to **36**, and the separated count measured at **16** — not the 19 I derived (GAP-134, GAP-135, GAP-136). I flagged the 19 as subtraction and asked for it to be measured before anyone quoted it; it was wrong, for the exact reason the flag gave. **Nothing in this round is derived any more.**
6. **Retracted — see the amendment at the top of this round.** Nabestellingen do happen; OrderSection keeps its multi-order apparatus and nothing is deprecated. Left in place as a retraction rather than deleted.

## Where I was unsure, and you should check me

- **Whether the queue deserves a page at all.** I genuinely do not know, measurement 2 decides it, and the migration pass has weakened my instinct for the dashboard block rather than confirmed it: a pass needs a surface to work through, a steady state needs a glance, and those may not be the same object.
- **Whether "Niet doorgegaan" is the right Dutch.** I chose it over *Afgewezen* on a hazard I can defend, but it is three words where the rest of the status column is one, and the owner's own phrasing beats mine.
- **Whether a declined print should stay on the dashboard.** I said yes — it has files, it is in the library, and hiding a record because of its outcome is how a library starts lying. A reasonable person would filter it out by default, and that is a one-line change to the Status filter I have not made.
- **Whether every asserted stage can really show its date in a 40px row.** I believe it fits — `muted` 12px beside the badge, as `pp-remaining` already does under a price — but **I have not drawn it**, and "it fits" is exactly the kind of claim I have been corrected on in this project before. Treat rule 1's date requirement as sound in intent and unmeasured in layout.
- **How nearly I retired a live feature on a number from an empty database.** I asked for measurement 5 in a form that proposed the conclusion — "I would rather retire it than keep specifying it" — and the figure that prompted it was meaningless. The implementer caught it; I did not. The lesson is not only theirs: **I should have asked what the database contained before reasoning from what it did not.**
- **Whether `cadeau` / `gift` is really a tag.** I said it is a property, and it may not be: it decides whether money is asked for at all, which is closer to the klant-level *niet factureren* flag than to a label. If it is a billing state it does not belong in the tag system either, and then four of five tags being misplaced becomes five of five.
- **Whether rule 1 is overreach.** "A stage board with undated stages is not approved by this system" is a strong sentence about a screen that does not exist. I stand behind it and I note that I have given myself a rule to be held to rather than one to hold others to.
- **Boundary, stated plainly.** Mine and answered: what a screen may claim, the shape of a fileless record, which badge group a state belongs in, how a never-paid price reads, what a tag is for, the queue's form and placement. **Not mine and not answered:** the `OrderStatus` values, whether every print keeps getting an order, whether the indexer gains a sibling writer, whether `/prints` stays read-only, and how a detached record meets its folder. I have given UI costs and one constraint on the third-last of those and nothing else.

# Changelog 2.7

Two gaps, both one sentence of UI, and both of the same kind: a line that is true in the state somebody looked at and false in the state nobody did. Neither needs a token, a class or a pixel. Version 2.6 follows below.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-118 | "Geldt nu voor 2 slots zonder eigen spoel." while no whole-print spool is set — the condition names the slots, not whether a choice exists | **The line is keyed on both axes and all four cells get words.** The two present-tense lines are unchanged and may be rendered **only while a spool is set**; where none is, the line speaks about the control instead — `spool.wholePrint.wouldApply` "Een spoel hier geldt voor {n} slots zonder eigen spoel." and `spool.wholePrint.wouldApplyNone`. The word *nu* is the tell and now appears in one column only. **Silence is rejected** (see below), and so is one tenseless line | **resolved** |
| GAP-120 | The strip draws two buttons with the same picture and the same label, and the file list does not raise "Mogelijk dubbel" for them — measured `possibleDuplicate: null` on both rows | **Marked, but not as a duplicate and not in `warning`.** One `muted` `.pp-reason` line on **both** rows, each naming its own folder: `asset.sameName` "Twee verschillende bestanden met dezelfde naam. Dit is het bestand in map {map}.", with `asset.sameNameNoFolder` where the app has no folder. **Widening "Mogelijk dubbel" is rejected:** its hint tells you to delete one file and count the other twice, which for two real files drops one off the invoice. The strip gets no new words | **resolved** |

## New and changed

- **Tokens:** none. `tokens.json` `version` is **2.7**. No variable added, renamed or removed.
- **New classes: none. Changed classes: none. `bundle.css` is byte-identical to 2.6** — every class the two previews use was already there (`.pp-reason`, `.pp-help`, `.pp-row`, `.pp-items-start`, `.pp-w-420`, `.pp-card`, `.pp-p3`, `.pp-w-340`, `.pp-assetlist`, `.pp-flush`, `.pp-asset`, `.pp-spool`, `.pp-spoolbtn`, `.pp-qty`, `.pp-opt`, `.pp-switch`, `.pp-badge`, `.pp-mono`, `.pp-num`, `.pp-ico-20`), and both files were checked class by class against it.
- **Copy** `spool.wholePrint.wouldApply`, `spool.wholePrint.wouldApplyNone`, `asset.sameName`, `asset.sameNameNoFolder`, and `spool.wholePrint.help` — the last one **is not new text**: it is the help line the app has rendered under "Spoel voor de hele print" since 2.3, recorded in the deck for the first time. All five are in `copy-deck.md` under *Added in 2.7*. No key changed, no key removed.
- **Components changed:** SpoolPicker (README and preview), AssetListItem (README and preview), ModelPicker (README only — the 2.6 question is answered and one word is withdrawn).
- **Previews changed:** SpoolPicker — the whole-print control is drawn in **all four** cells of the grid, each with the trigger state that belongs to it, plus the n = 1 singular. AssetListItem — the measured STL pair at print level, a G-code pair with the order-level controls, the row in a 420px container, and the long case: one row both excluded and same-named (two reason lines, the exclusion first) with the no-folder fallback beneath it.
- **Pages changed:** `README.md` (*Two rules this round wrote down (2.7)*, *Versie 2.7*), `changelog.md`, `copy-deck.md`, `tokens.json`.
- **Contrast report:** unchanged, **no new pair.** Both lines are `muted` on `surface` (and on `surface-2` for a child or slot row), already in the report at 4.5:1 or better in both themes. Nothing new is colour-carried: the same-name line is deliberately *not* `warning`.
- **Breaking changes: none.** Two obligations are added to the app and nothing is withdrawn: pick one of four strings under the whole-print control instead of one of two, and draw one line per row of a same-name pair.

## GAP-118: why not silence, which was the obvious fix

The implementer's own reading was to show the line only while a spool is set, and it is the move I would expect. I am not taking it, for one reason that is measured: **83 of 83 prints in this library have no whole-print spool**, so silence would mean the line is almost never rendered. That line exists because the control had never looked like it did anything — that is what 2.3 says in SpoolPicker — so removing it in the state the whole library is in puts the control straight back to looking inert. The trigger's placeholder says there is no spool; it does not say that choosing one would move the total, and that is the fact the operator is missing.

The third option, one tenseless line ("Geldt voor {n} slots zonder eigen spoel.") in both states, is also rejected: it is true in both by being specific in neither, and the whole gap exists because a sentence about money was vague about when it applied.

**The fault was mine and it is the same fault twice.** GAP-115 was raised because a trigger showed its placeholder while an inherited spool was costing money; GAP-118 is the line I added in the same round, on the same control, claiming coverage while nothing was in force. In both cases I keyed a sentence on one axis of a two-axis state. The rule that follows is in `README.md`: write the grid before the sentence, and treat the word *nu* as a promise about the present.

## GAP-120: why the existing badge must not stretch to cover it

"Mogelijk dubbel" means **the same content**, and it carries advice: "Gebruik liever Aantal keer geprint" — delete one, count the other twice. For two distinct files that advice loses a file off the invoice. And `warning` ink says *something needs your attention*, where this condition needs nothing: two files with the same name in two folders is a fact about the library, not a fault. A badge whose hint is false in the case it was widened to cover is worse than no badge, so the badge keeps its meaning and the condition gets plain words.

**Both rows carry the line, each naming its own folder.** Neither file is the original, so marking one of the two would invent a culprit, and two rows naming their own folders are what actually tells the operator which is which. `{map}` is the shortest folder form relative to the print root that differs between the two; a path that differs always exists, because one directory cannot hold two files of the same name — only the app's *record* of it can be missing, which is what `asset.sameNameNoFolder` is for.

It is 3 pairs in 2 prints of 83: six muted lines in the whole library, in the one place the operator is already reading file names.

## What I rejected

- **Widening "Mogelijk dubbel"**, for the reason above: a true badge with false advice.
- **New words in the model strip.** A picker's label is for choosing; the sentence that explains a data condition belongs where the files are listed, one card below. 2.6's spec stands: two identical buttons, the bubble showing the same name twice, no special case.
- **Silence under the whole-print control** when no spool is set, and **one tenseless line** in both states. Reasons above.
- **A live region** for either line. Both change only as a result of the viewer's own action in that same control, or not at all.

## Not a numbered gap: the `play` / `film` conflict, settled

`implementation.md` reports that ModelPicker's prose calls the timelapse glyph `play` while the preview draws `film`, and that the app is built as `film`. **The preview is the intention, the word is withdrawn, and nothing in the app changes.** The system already draws the distinction and I broke it in one sentence: `film` is a type glyph and says *what the file is* (AssetListItem's video row has used it since 1.9); `play` is an action and only ever an action — the `Afspelen` button, and the `.pp-play` badge that sits on top of the well in the square form. Square button: film or picture in the well, play badge over it. Compact button: film alone. It has no GAP id because it was raised in prose; if you want it tracked, the number is yours to assign.

## What I want measured

1. **Does an asset record carry a folder for every model file, and do the 3 same-name pairs differ in it?** This decides which of `asset.sameName` and `asset.sameNameNoFolder` fires, and whether the folder form ever needs more than one path segment. It does **not** block the build — both forms are specified — but if the answer is "no folder at all", the richer line is dead copy and I would want to know.
2. **How often is a whole-print spool set, once the control stops looking inert?** 0 of 83 today is the measurement that drove this gap. If it is still 0 in a month, the right question is not this line but whether the control is in the wrong place.
3. **The 240px sheet floor** is still unexercised, as `implementation.md` says. Not a gap; recorded again so it does not quietly become a claim.

## Where I was unsure

- **Whether four strings is one too many.** The n = 0 cells cover a state nobody has reported seeing (every slot with its own spool *and* no print spool). I wrote words for all four because this gap exists precisely from a missing cell, but the fourth is reasoning, not evidence.
- **`asset.sameName`'s second sentence names a folder the operator may not recognise.** The print gathers files from more than one folder, but I do not know whether those folder names mean anything to them — the alternative would be naming the other file's path on each row, which says the same two things twice. If the folder names turn out to be noise, the fallback form is the better line for both rows and that is a one-key change.
- **Whether the same-name line belongs in the order section at all.** I put it in both contexts because the fact belongs to the file; a reasonable person would keep the print's "Bestanden" card as the only place and keep the order list clean. The measured pairs are STL and never appear in an order, so this half of the rule is unexercised in this library.
- **I did not re-verify `bundle.css`'s content beyond the class list.** I am telling you it is unchanged because I did not touch it, and the two previews only use classes I checked against the 2.6 file.

# Changelog 2.6

Three measurements, again before anything is built. Two of them change the rule I wrote yesterday and one of them falsifies a sentence in 2.4. The rule now grows **whichever end** reaches the difference, and where it still cannot reach — 40 of 1682 pairs, plus 3 that no rule can touch — the system **names the residue** instead of reaching further. Version 2.5 follows below.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-119 | The tail-only rule extends the wrong end for this library: the dominant collision is a number in the **middle** of a long name | **Both halves answered.** (1) The split grows whichever end reaches the difference — tail first, then head — against two floors: the extension always survives and the head keeps two characters. The one-end asymmetry had no justification and you were right to name it. (2) The window's **blind zone is specified**: at 15 characters a difference is reachable only at `d < 10` or `d >= len-12`, so every name over 22 characters has a middle no split reaches. 40 of 1682 pairs fall there and are **accepted deliberately**, with the picture, the fixed order, the caption and the bubble carrying the strip | **resolved** |
| GAP-119 | A premise under 2.4's rejection is false: two model files in one print can have byte-identical names | **The sentence is withdrawn, the conclusion stands on a better one.** The name does not stay because it is unique — it is not — but because it is the field the rest of the system quotes: the caption, the file list, the download, the invoice and the duplicate badge all speak in names, and a picture cannot be quoted. Two identical labels state a fact the operator needs; two unlabelled buttons state nothing. The bubble showing the same name twice is **confirmed as you intend to build it** and is now spec, so nobody special-cases it later | **resolved** |

## New and changed

- **Tokens:** none. `tokens.json` `version` is **2.6**. No variable changes.
- **Classes: none new, none changed. No CSS changed this round either** — 2.4, 2.5 and 2.6 are **one import**, and nothing from 2.4 or 2.5 is withdrawn except the one sentence named above.
- **Copy:** none.
- **Components changed:** ModelPicker (README and preview).
- **Previews changed:** ModelPicker, two blocks added, both of them cases the system does **not** solve: the `Bloembak clip corner 20/21/22` trio, one picture between them and three identical labels (`Bloembak…dth.stl`, and `Ba…er width.stl` at the longest tail), and a print holding the same file name twice with its bubble showing that name twice.
- **Pages changed:** `README.md` (*Typography* — the rule becomes symmetric and the blind zone is stated as a formula; the 2.4 rule's uniqueness premise corrected; *Versie 2.6*), `changelog.md`, `components/ModelPicker/README.md`, `components/ModelPicker/preview.html`, `tokens.json`.
- **Contrast report:** unchanged, no new pair.
- **Breaking changes: none.** Relative to 2.5 the app's obligation changes in one clause: grow whichever end reaches the difference, not only the tail.

## Why I accepted the 40 rather than reaching further

*(The figure is **36**, corrected in 2.8: the sweep behind the 40 was too narrow at the bottom and above the tail's ceiling at the top. The reasoning below is unaffected — it turns on "more than a handful", not on the exact count — and is left as written rather than rewritten around a better number.)*

I checked all three alternatives arithmetically instead of ranking them by feel.

- **Two lines (a 30-character window) does reach it.** The tail grows to 27, the blind zone closes for every name up to **52** characters, and the trio reads `Ba…k corner 20 inner width.stl`. I am not rejecting it as unworkable. It costs 16px of button height (140 → 156) and it costs the mechanism: `text-overflow` cannot cut a two-line box, so the app must insert the ellipsis and trust a character count — and that count is not trustworthy, because `--font-mono` is a fallback stack whose advances run from about 0.5em to 0.65em, so "15 characters" is ±2 depending on which monospace the OS supplies. Today CSS cuts at the real rendered width and that error is invisible; with an app-computed window it becomes an overflow or a gap. **This is the move if the owner calls those families unusable**, it is costed, and it is a 3.0-sized change to the mechanism.
- **A middle window does not fit.** `head…diff…tail` for the trio needs 5 + 1 + 2 + 1 + 7 = **16 characters** in a 15-character box, it needs a second ellipsis no CSS rule inserts, and it buys the middle by giving up either the family name or the extension — the thing GAP-119 was raised about.
- **Widening** to close the zone for a 38-character name needs **174px** (3.1 buttons per frame against 4.4) and p90 would need 243px. 2.5 retired width as the lever on your own figures and this does not bring it back.
- **What decided it:** the label's job in a picker is to let you choose, not to identify. Identification is one hover or one click away, and a click costs 60ms cold, 1ms cached, and is reversible. And the byte-identical pairs prove ambiguity cannot be eliminated at all — so the design has to be sound **with** ambiguous labels, and the right investment is making the ambiguity honest and recoverable rather than reducing it from 3.3% to 0.9%.

## What I rejected, and why

- **Re-splitting as the reader scrolls** to chase a difference the window cannot show. Labels that shuffle are worse than two labels that agree, so where the longest split still collides, nothing moves.
- **Treating the duplicate-name case as a truncation problem.** It is a data condition, and the system already has the words for it one card below: the `warning` badge "Mogelijk dubbel" and its hint in AssetListItem. The picker's only job there is not to lie.
- **Special-casing the bubble on duplicates**, which you had already decided against. Agreed and now specified.

## The one open question, and it is not about the strip

**Do those 3 duplicate-name pairs actually raise "Mogelijk dubbel" in the file list?** The badge is specified for a duplicate *file*; two files with the same name in different folders may or may not reach it. If they do, the picker needs no new words because the explanation already sits one card below the strip. If they do not, that is a gap worth logging on your side, and it belongs to AssetListItem, not ModelPicker.

## Where I was unsure

- **The head floor of two characters is still a guess**, now load-bearing in the symmetric rule: nobody has measured whether `Ba…` plus a long tail reads better than `Bloembak…` plus a short one. It only fires on a collision, so the cost of being wrong is bounded, but it is a preference stated as a rule.
- **Whether the 40 are concentrated or spread.** 40 pairs could be three families of six or twenty scattered pairs, and that changes how the owner will experience it. I did not ask, because it would not change the decision — but it would change how I would present it to them.
- **How often `d` lands in the head's new reach** (index 7 to 9), which is all the symmetric half of the rule buys over 2.5. I specified it because the asymmetry was unjustified rather than because it was measured to pay.

## Your correction about `implementation.md`, noted

Accepted: the repo copy has been current since 2.3 and the sync script only pulls, so the artifact kept the pre-2.3 file. Publishing it from the file in git is the right fix and it is the same lesson my refused publish taught me — the base matters more than the content. Nothing in my last three rounds depended on it; every number I used came from your messages.

# Changelog 2.5

All five of 2.4's measurements came back the same day, **before 2.4 was imported**, which is the cheapest moment to be wrong. Two of them bite. The square button **stays at 120px** and your own numbers are the reason; what moves is the **split**. Version 2.4 follows below.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-116 | Is 120px right, now that 90% of names still overflow it? | **Yes, and the measurement retires width as the lever.** 68px → 112px of name box is 65% more width for **6 points** of overflow (96% → 90%); the median name (25 characters, 181px) would need a **189px** button, 2.9 per 560px frame, and p90 (57) a **420px** one, 1.3 per frame. A picker that shows one button is not a picker, so the name is a fragment at every usable width and the question becomes *which part*, not *how much*. `--pp-modelbtn-max` governs **1** print of 79 and is kept, demoted and not re-tuned | **confirmed as built** |
| GAP-119 | 29% of within-print name pairs share their first 7 characters, so the visible head collides | **Extended, not reversed.** The default split (extension + 3 stem characters) is now a **starting point**: no two buttons in one strip may render the same label, and the app extends the tail one character at a time until they are distinct, head floor two characters plus the ellipsis, leaving the label alone where even the longest tail cannot separate two names. The rule is in `README.md` under *Typography*, because it is about truncated identifiers in a row, not about this strip | **resolved** |
| GAP-071 | The paint cost of `.pp-art`, enlarged by 2.4 onto the strip | **Closed.** 29 outlined pictures scrolled 120 frames: median 16.7ms with and without, p95 **17.4 vs 17.2**, 0 frames over 20ms either way, matching the 81-tile grid. The four-shadow ring stays everywhere and 2.3's reserve — a single blurred `drop-shadow(0 0 1px)` halo on the grid — is **withdrawn**, because it was conditional on a regression that did not happen and a blurred halo is partly transparent and no longer measures 3.69:1. Recorded with your caveat: nothing dropped **on this machine** is not the same as the filter being free | **resolved** |

## New and changed

- **Tokens:** none added, renamed or removed. `tokens.json` `version` is **2.5**. No variable changes: `--pp-modelbtn-w` stays 120px and `--pp-modelbtn-max` stays 240px.
- **Classes: none new, none changed. This round changes no CSS at all** — the uniqueness rule chooses where the string is cut, which is the app's half of `.pp-fname`; the cut itself is still `text-overflow` on `.a`.
- **Copy:** none.
- **Components changed:** ModelPicker (README and preview).
- **Previews changed:** ModelPicker, one block added — `Onderdeel_01_links.stl` through `_06_links.stl`, six buttons with one picture between them, whose default labels all read `Onderde…nks.stl` and whose extended labels read `Ond…1_links.stl`. It sits beside the `obj_2_…` block so the two collision shapes are next to each other: one where the head separates and one where only an extended tail does.
- **Pages changed:** `README.md` (version line, the tail-extension rule under *Typography*, the width figure added to *Two rules this round wrote down (2.4)*, a *Versie 2.5* entry), `changelog.md`, `components/ModelPicker/README.md`, `components/ModelPicker/preview.html`, `tokens.json`.
- **Contrast report:** unchanged, no new pair. Nothing changes colour.
- **Breaking changes: none.** One thing the app must now do that 2.4 did not ask for: compute the tail per strip rather than per name.

## What I corrected in your measurements

- **Measurement 2 was taken at the wrong size, and the invariant matters more than the figure.** You wrote "mono at `text` (15px), which is what 2.4 sets". `text` is the **ink** token (`#2b3150` / `#c0caf5`); the size `.pp-modelbtn` sets is `--text-xs`, **12px**. At 12px the 112px name box holds **15.47** monospace characters, which is the 7 + ellipsis + 7 this design is built on; at 15px it holds **12.38**, which leaves the head four characters and quietly breaks it. Your 217px median is 181px at `text-xs` — exactly the figure you measured for 2.4. The conclusion is unaffected: most names are fragments. **The invariant to build and check against: the name box holds 15 monospace characters at `text-xs`.** If it ever holds 12, the size is wrong, not the split.
- **Your worked example is not the failure case.** `Onderdeel_01.stl` against `Onderdeel_06.stl` differ **inside the tail**, which is the half the split always keeps: under 2.4 as published they already read `Onderde…_01.stl` and `Onderde…_06.stl`. The failure is the same family with anything *after* the number — `Onderdeel_01_links.stl` — and that one is real, which is why the rule changed. Worth separating, because the first case would have had me widening a button to fix something that was not broken.

## Why this exception is allowed when the other one was not

2.4 rejected "drop the name where the renders are identical" because *looks the same* is not computable: perceptual identity is not pixel identity, and a distance-0 rule calls two indistinguishable parts distinct. *Reads the same* is a different kind of claim — exact string equality, over a handful of strings in one strip, deterministic, no threshold, no perception, and checkable by looking at the strip. That line is the reusable part of this round, and it is written into `README.md` beside the rule: compare rendered text, never rendered pictures.

## What I rejected, and why

- **Widening the button again.** Your second measurement is the argument against it, not for it: 65% more width for 6 points. Every width that holds a median name turns the strip into two buttons and a scrollbar.
- **Two lines of name.** Two lines of 15 characters would hold the median (25) whole, which is the most tempting answer to "90% are fragments". But `.a`/`.b` cannot middle-truncate across two lines — a line clamp's own ellipsis eats the tail — so the app would have to insert the ellipsis and fix the window in characters, losing exactly the robustness the CSS cut buys under text zoom, a font fallback or a non-ASCII name; it still fails p90 and the longest name; and the button grows to 156px. If the uniqueness rule proves insufficient this is the next move, and it is a 3.0-sized change to the mechanism rather than a tweak.
- **Re-tuning `--pp-modelbtn-max`** on a form that one print of 79 reaches. Kept at 240px and recorded as *specified and nearly unexercised*, in the same words as Popover's sheet floor, so neither of us mistakes it for a tested path. Not deleted either: 95 of 376 files are 3MF and the renderer's coverage is a moving target.
- **Letting the strip re-split as you scroll** to chase a difference it cannot show. Where the longest tail still collides, the label stays put; labels that shuffle are worse than two labels that agree.

## What I need you to measure

- **The intersection, which is the number I actually wanted.** How many within-print pairs share their first 7 **and** their last 7 characters? That is the collision rate of the rendered label. 29% and 10% are the two margins; the truth is at most 10%, and it tells us how often the new rule fires rather than whether it is right.
- **How often the rule cannot separate a pair at all** — a difference beyond about 13 characters from the right *and* beyond 2 from the left. More than a handful and two lines comes back on the table.
- **The 112px overflow count at `text-xs`** (12px), so the record holds the figure the app renders.

## Where I was unsure

- **Whether to act on 29% at all before seeing the intersection.** I did, because the uniqueness rule is correct at any collision rate and costs a per-strip pass over a handful of strings; the intersection only decides how often it does anything. If it comes back at 1%, the rule stays and is simply quiet.
- **The head floor of two characters** is a guess at where a head stops being worth anything. Nobody has measured whether `Ond…` plus a long tail reads better than `Onderde…` plus a short one.
- **I have still not seen a render**, so the premise under the whole GAP-119 answer — that near-identical parts are indistinguishable at 112px — remains inference from your figures.

## What I think is wrong in `implementation.md`

**Your correction is itself wrong, and in a way you will want to check.** You wrote that the artifact's `implementation.md` is current as of 2.3 and already carries 118 logged / 1 open, the per-model renders and GAP-094/096 as built. At the current version (`1791535412-ca6e`) it is **byte-identical to what I read at the start of this round** — sha256 `09896b20…`, 5,407 bytes — and it says "built against design system **2.2**", "**113 gaps logged, 13 open**", GAP-094 and GAP-096 unbuilt with "the print detail still shows the 1.9 Select", and GAP-071's render outline still open. **Your refresh did not land in the artifact.** No version between 2.3's publish and mine carried it either, so it was not overwritten by me — I never write that file. Worth finding out where it went before you refresh again with these five figures, or that refresh will go the same way.

# Changelog 2.4

One gap, arriving with the owner's counter-proposal against the implementer's recommendation — and the thing 2.3's spec was waiting for has happened: **there are per-model renders now.** 281 of 376 model files render (every STL; a 3MF only where it carries a plate image), median 60ms cold, 1ms cached, 12–51 KB each. That brings back the square form 2.3 kept "for the day a per-model render exists", answers 2.3's open measurement, and exposes a conflict inside my own files. Version 2.3 follows below.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-094 | The strip should show a picture per model, not the same glyph on every button | One PNG per model file is exactly what the gap asked for and the app now serves it; the square form it feeds is the one 2.0 specified and 2.3 kept. 2.4 changes that square's size and its name, not its anatomy. (2.3's changelog already noted that `implementation.md` wrongly lists this gap as unbuilt with "the print detail still shows the 1.9 Select"; that is still the case) | **confirmed as built** |
| GAP-116 | One form or two, now that both have a reason — and how wide the name may be | The two forms and the switch rule — **any** button with a picture ⇒ every button square, none ⇒ all compact, never a mixed row — are **confirmed as built**, and the implementer is right that 2.3's reason for the compact form now holds exactly where no render exists and nowhere else. What changes is the two numbers: the square becomes `--pp-modelbtn-w` **120px** (112px of picture, 112px of name) because it holds a real render instead of a glyph, and `--pp-modelbtn-max` goes **200px → 240px** on your measurement — 200px was a value I chose, 240px holds the median name (25 characters, 181px) whole | **resolved** |
| GAP-119 | `.pp-modelbtn .nm` cuts the name at the end, against my own brand book, and 96% of names do not fit | Both halves mine. **The direction:** `.pp-fname` middle-truncates a file name in both forms (`.a` head shrinks, `.b` = the extension plus the three stem characters before the dot) and the name is mono `text-xs` in `text` ink, `text-strong` when selected. Middle is not a convention here, it is the only direction that survives both measured families — names that differ at the start (`obj_2_…`/`obj_7_…`) and names that differ at the end (`Onderdeel_01`/`_03`). **The width:** 112px, 15 characters. **Reading it in full:** `.pp-tip.at` with the whole name, only while the name is truncated, `aria-hidden` because it *is* the button's name, on hover and on focus. **The owner's "drop the name where a button has a picture" is rejected** — reason below | **resolved** |
| GAP-071 | The paint cost of `.pp-art`, the half still open from 2.3 | Not decided here, and 2.4 **enlarges** it: a per-model render carries `.pp-art` like any other picture this app made, so a print detail can now hold up to 34 outlined pictures beside the 83 on the dashboard. The rule itself needs nothing from the renderer, which is the render half of GAP-071 answered for the strip. The paint measurement 2.3 asked for should now be taken on the strip as well | **needs your measurement** |

## New and changed

- **Tokens:** none added, renamed or removed. `tokens.json` `version` is **2.4**. One new `bundle.css` variable, next to `--pp-name-min` and `--pp-modelbtn-max`, not a token: **`--pp-modelbtn-w` (120px)**, the square model button's width. **Changed:** `--pp-modelbtn-max` 200px → **240px**. No new inline data property: the bubble uses 2.2's `--pp-tip-x`/`--pp-tip-y`.
- **New classes** `.pp-fname` (with `.pp-fname>.a` and `.pp-fname>.b`), `.pp-modelbtn .nm.pp-fname`, `.pp-models.compact .pp-modelbtn .nm.pp-fname`, `.pp-modelbtn[aria-pressed=true] .nm`, `.pp-device.pane` (a 600px preview frame, like `.pp-w-900`; not app markup).
- **Changed classes** `.pp-modelbtn` (`width:var(--pp-modelbtn-w)` instead of `76px`), `.pp-modelbtn .nm` (`color:var(--text)` — it is the identifier now, not meta), `.pp-modelbtn .pp-thumb` (`overflow:hidden`, so a render's corners follow `radius-sm`).
- **Reused unchanged:** `.pp-art` on a per-model render (the page draws the outline from the picture's own alpha, the renderer bakes nothing — 2.3's rule, applied), `.pp-tip.at`, `.pp-thumb`, `.pp-play`, `.pp-models`, `.pp-models.is-overflow`, `.pp-model-cap`, `.pp-device .pp-tip.at`. `.pp-models.wrap` stays deprecated and still goes in 3.0. `.pp-asset .fn` is untouched: it already carries `.pp-fname`'s declarations and may take the class too, with no visual change.
- **Copy:** none. No key added, changed or removed — the bubble carries a file name, which is data, and the video button's "Timelapse" is 2.3's. `copy-deck.md` has no *Added in 2.4* section and is not republished.
- **Components changed:** ModelPicker (README and preview). No other component file changes, but two rules they live under do: *Typography* now names `.pp-fname`, and *Floating panels* rule 8 adds `mask` to the properties that must not sit above a floating panel (AssetListItem, Tooltip and Popover are the readers of those two rules).
- **Previews changed:** ModelPicker, **rewritten** — the 2.3 preview drew the compact strip as the only live form and the square only as a specimen, which is now the wrong way round. 2.4 draws the median print (4 renders, fitting the frame without scrolling), the measured 11-button strip (9 pictures, one 3MF glyph, the timelapse), the six-button print whose renders are **pixel-identical** (the case the owner's proposal would blank), the bubble over a truncated name inside `.pp-device.pane`, the compact strip with a 59-character name and its bubble, the longest print at 34, the phone at 360px, loading, one model, video only. The pictures are inline silhouettes standing in for the PNGs, because the system ships no image files.
- **Pages changed:** `README.md` (version line, the `.pp-fname` rule under *Typography*, `mask` in *Floating panels* rule 8, a new section *Two rules this round wrote down (2.4)*, a *Versie 2.4* entry), `changelog.md`, `components/ModelPicker/README.md`, `components/bundle.css`, `tokens.json`.
- **Contrast report:** **no new colour pair**, so `contrast.md` is unchanged. Every pair 2.4 uses is already approved over the ground it sits on: the name unselected is `text` on `surface` (12.67 light / 10.59 dark), selected `text-strong` on `primary-tint-soft` over `surface` (15.31 / 12.78), the glyph and picture well `muted` on `surface-2` (5.39 / 6.06, against 3:1 for an icon), the render's outline `border-strong` on `surface-2` (3.69 / 3.32, against 3:1), the selected border `primary` on `surface` (5.47 / 6.79, against 3:1), the bubble the existing `.pp-tip` (`bg` on `text-strong`, 15.84 / 16.08), and the focus ring untouched.
- **Breaking changes: none.** No token, class or copy key is renamed or removed, and a button built to the 2.3 markup still renders — it just keeps the end truncation this round is fixing. Two things the app must now do that it did not before: **split the file name into `.a` and `.b`** inside `.nm` and put `pp-fname` on that element, and **mount the name bubble outside `.pp-models`** with `--pp-tip-x`/`--pp-tip-y`, only while the name is truncated.

## What I rejected, and why

- **Dropping the name where a button has a picture** (the owner's proposal, and the implementer asked me to weigh it rather than take their recommendation). The owner is right about 66 of the 74 prints with two or more pictures, and right that a fragment without an extension can be worse than nothing. The reason it is still no: **the file system guarantees the name is unique inside a print, and nothing guarantees that of a render.** The exception cannot be keyed on identical renders either, because perceptual identity is not pixel identity — two parts differing by two millimetres make two pictures at distance 1 that nobody can separate at 112px, and a rule keyed on distance 0 calls them distinct and hides both names. This library is full of those families (`Onderdeel_01`…`_06`, `Pen_kort`/`Pen_lang`, `Hoekstuk_01`…`_03`), and the 8 prints with distance-0 pairs are exactly what a picker exists for. What I take from the proposal is its measurement: the picture carries most of the load now, so the name no longer has to be **complete** — it has to keep its two ends. That is what changed instead.
- **End truncation, which is what was built.** It loses the extension first, on the one screen that mixes STL with 3MF, and it loses the tail, the half that separates an enumerated family. It also contradicted `README.md`, the compact form's own spec and `.pp-asset .fn` on the same screen. My hole, in both forms — the square form's name was not even mono.
- **Letting the caption follow the hovered button** instead of the selected one. Cheaper than a bubble, but it moves the words 100px away from the thing being pointed at, it lies about what is selected, and on touch it does nothing at all.
- **A second, smaller square at 480px and below.** One width at every breakpoint: a picture button is not a 36/44px control, the strip scrolls on a phone exactly as it does on a desktop, and a narrower name on the smaller screen is the wrong way round.
- **Keeping 76px** now that the square holds a real render. 68px of picture is a thumbnail of a thumbnail and 68px of name is 9 mono characters against a 25-character median — which is how this gap was born.

## What the strip costs now, recorded rather than argued

At 120px a 560px frame shows **4.4 buttons** instead of 6.8, so the owner's one-scrolling-line strip scrolls about 50% further at the same count: the 34-button print is roughly 4,350px of row against 2,850px. The median print goes the other way — four buttons now fit entirely inside the frame (4×120 + 3×8 = 504), where 2.3's compact strip could already overflow on two long names. The caption stays the only sense of position in a long strip; that was the owner's trade in 2.3 and 2.4 does not reopen it.

## What I need you to measure

Each of these sits inside a decision that is otherwise settled. Build them as they stand.

- **The head length, which is the one judgement in 120px.** Within a single print, how many model names **share their first 7 characters** with another model in that print, and how many share their **last 7**? Seven is where your two failure families separate, which is reading rather than counting. If prefixes collide often (`obj_12_` against `obj_17_`, a `Onderdeel_` family of twelve) the head needs more characters and I will widen the button rather than have you widen it.
- **How often the compact form is reached now.** How many of the 83 prints have **no** model and no 3MF that can show itself. If it is a handful, `--pp-modelbtn-max` is nearly dead text and I would rather know that than keep sizing it.
- **How often a name is truncated at 112px.** The 96% was measured against a 68px box. This decides whether the bubble is the normal path or the exception, and the bubble is only mounted where a name is actually truncated.
- **Whether a 3MF plate image is the same kind of picture as a render.** A plate image comes from the slicer, a render comes from us. If a plate image has no alpha channel there is no silhouette for `.pp-art` to outline and the rule needs the second branch the thumbnails needed in 2.3. Which of the 95 3MF files carry a plate image, and are those images transparent?
- **GAP-071's paint cost, now also on the strip.** 2.3 asked for 83 outlined tiles against the same page without them; a print detail can now hold up to 34 outlined pictures of its own. Same question, one more place.

## Long cases drawn

The strip at **34** (33 renders and a timelapse) as one scrolling line with the fading edge and the focusable region; the measured **11-button** print with 9 pictures and two buttons that have none; the **six identical renders** whose names are the only difference, with the difference at the start of the name; a **59-character** name in the compact form and its bubble; the median 4; the phone at 360px; loading; one model; video only. The 70%-carry-nothing distribution has no bearing here, but the 96%-do-not-fit one does, and every name drawn is one that truncates except where the label says otherwise.

## Where I was unsure

Said plainly, because it is cheaper to be corrected than believed.

- **120px is a judgement with two measurements under it**, not a measured value. 15 characters is what 7 + ellipsis + 7 needs; the 7 comes from reading your two failure families, not from counting them. The first measurement above is the one that would move it, and I would rather move it than have it quietly wrong.
- **The bubble's mount point** assumes a `mask` behaves like a stacking context for a fixed descendant. That is how the engines behave and it is why the rule says sibling, but I did not measure it in this app. If a fixed bubble inside `.pp-models.is-overflow` turns out to render fine, the rule still stands (a sibling is simpler and cannot break) but the *reason* in `README.md` rule 8 should be corrected rather than kept.
- **`.pp-fname` is new; its declarations are not** — they are `.pp-asset .fn`'s, lifted. `.pp-asset` keeps its own copies in the file precisely so this lift cannot change an asset row. If anything about an asset row moved, that is my error and not an intended change.
- **The preview's pictures are inline SVG silhouettes** carrying `.pp-art`, where the app uses `<img class="pp-art">`. `object-fit: contain` does nothing on an inline SVG (`preserveAspectRatio` does the same job), so the preview shows the outline and the layout but not `object-fit`. If a real render is not square, check that case against the app rather than against the preview.
- **I have not seen the renders.** Everything about how they read at 112px — that near-identical parts are indistinguishable there, that a grey silhouette needs the `.pp-art` outline on `surface-2` — is inference from your figures and from the 2.3 thumbnails. If the renders turn out to carry enough contrast of their own that the outline is noise at 112px, say so and it comes off the model button while staying on the thumbnail.

## What I think is wrong in `implementation.md`

It is current as of 2.3, and the detail that came with this round supersedes it — the implementer said so themselves. The entries that will still be wrong after a refresh unless they are corrected: **GAP-094 and GAP-096 are listed as unbuilt** under *Waiting on nobody but me*, with "the print detail still shows the 1.9 Select", which both 2.3's correction and this round's per-model renders contradict; and the counts (**113 logged, 13 open**, built against design system **2.2**) are two rounds behind — 2.3's brief said 117 logged, and GAP-119 makes 119. Nothing in it is wrong about the app in a way that changed a decision here; the detail message carried every number I used.

# Changelog 2.3

Resolves GAP-114 to GAP-117 and the open half of GAP-071 — the five that were left of 117. Four of them arrived running on placeholders the owner had approved; three of those placeholders are right in substance and get a class or a rule instead of a local fix, one is replaced, and one gap is confirmed exactly as built. Version 2.2 follows below.

| GAP | About | Decision | Status |
|---|---|---|---|
| GAP-071 | The render outline, the open half: may it be drawn on every thumbnail, including the 79 we only pass through? | **No** — and the rule moves rather than narrows. 2.0's sentence covered **2 prints of 83**; we do not rewrite a picture we did not make. The thumbnails are PNGs with transparency, so the page draws the outline from the alpha channel instead: `.pp-art`, four 1px `border-strong` drop-shadows, **3.69:1 light / 3.32:1 dark on `surface-2`** against a 3:1 requirement, in both themes, with no server work. `border-strong`'s usage text loses "baked into the PNG". Nothing was built for this half, so nothing is undone | **resolved** |
| GAP-114 | Two faults in 2.2's floating panels: `.pp-tip.at` does not reset `bottom`, and a popover is clipped by its card | Both mine. `.pp-tip.at` now sets `right:auto;bottom:auto`, **and** the anchored rules are wrapped in `:where()` — `.pp-anchor.end>.pp-tip` weighed three classes and beat `.at` outright, so resetting `bottom` alone would have left the x broken. An `.at` panel may **not** sit inside a `.pp-anchor`; the anchor's other, quiet job gets its own name, `.pp-lift`. The popover gains the window-placed form the tooltip had: `.pp-pop.at`, with `--pp-pop-x`/`--pp-pop-y`. "A card must not clip an open panel" is **rejected** (reason below) | **resolved** |
| GAP-115 | A spool control states the opposite of the truth: "Kies een spoel" while the print's spool is costing the slot | The system rule, not a one-off: **a control shows the value in force and names where it came from.** The trigger reads *swatch + name + `pp-hintchip` "van de print"* in normal ink; the placeholder is only for the case where nothing is in force. The chip moves **onto** the trigger and out of the swatch cell beside it, because provenance belongs on the control that can override the value. The built wording "van de print: {naam}" is replaced: the name is the value, the chip is the provenance. The print-level control gains a line saying what it is doing now (`spool.wholePrint.applies`) | **resolved** |
| GAP-116 | The owner overruled 2.0.1: the strip scrolls sideways at any count rather than wrapping — plus the correction that there are no per-model renders and no durations | The scroll direction is **the owner's, and built**; `.pp-models.wrap` is deprecated, not removed. The correction is the bigger half: with one image per *print*, every square would carry the same glyph and 68px of truncated name, which is the state GAP-094 complained about. New `.pp-models.compact` puts the glyph beside the name and gives the name the width, one form for all of a strip's buttons, ordered by file name with the timelapse last. The square form stays specified for the day a per-model render exists. Browser-read durations are **rejected**; the duration leaves the spec | **resolved** |
| GAP-117 | The file list sits between the operator and the price: 585px of a 1892px page, orders not starting until y=1257 | The owner's reorder is right and is built; what 2.3 adds is writing it down as **one order of blocks at every width**, so a desktop order and a phone order cannot drift again. The collapsible list, folding it into "Deze print", and capping its height with its own scroll are all **rejected**, each for its own reason (below). The system rule behind it is in `README.md`: a card that something important follows is capped; the last card on a page is as long as its content | **confirmed as built** |

## New and changed

- **Tokens:** none added, renamed or removed. `tokens.json` `version` is **2.3**. One **usage text** changed: `border-strong` loses the sentence about an ink baked into the PNG and names `.pp-art` instead. New `bundle.css` variable, next to `--pp-name-min`: `--pp-modelbtn-max` (**200px**, a value I chose and have asked you to measure). New allowed **inline data properties**, set from a measurement and never from a chosen value: `--pp-pop-x`, `--pp-pop-y`.
- **New classes** `.pp-lift`, `.pp-pop.at` (with `.at.end`, `.at.up`, `.at.end.up` and `.at.sheet`), `.pp-picker.at`, `.pp-tagpop.at`, `.pp-art`, `.pp-models.compact`.
- **Changed classes** `.pp-tip.at` (`right:auto;bottom:auto` — the bug), `:where(.pp-anchor)>.pp-tip`, `:where(.pp-anchor.end)>.pp-tip`, `:where(.pp-anchor.down)>.pp-tip` (same declarations, no specificity of their own), `.pp-share-thumb` (`position:relative`, so a picture can be placed in it), `.pp-device .pp-tip.at` and `.pp-device .pp-pop.at` (in a preview the device frame is the window). **Deprecated, kept, scheduled for removal in 3.0:** `.pp-models.wrap` and `.pp-models.wrap.is-overflow` (never applied), and the now-redundant flex `order` overrides on `.pp-main>.pp-pdfiles` / `.pp-main>.pp-pdnew` (they agree with the DOM order from 2.3 on).
- **Copy** `asset.spoolFromPrint`, `asset.spoolFromPrint.aria`, `spool.wholePrint.applies`, `spool.wholePrint.appliesNone`, `models.groupVideo`, `models.video`, `models.videoCaption`, `models.videoName`, `models.videoViewer`. The five `models.*` keys were named by 2.0 and never entered the deck — the same oversight `print.lacks*` had — and are recorded with the 2.3 wording, which drops `{duur}` from the video button's accessible name. All nine are in `copy-deck.md` under *Added in 2.3*. No key removed; `models.select` is unused since 2.0 and kept until 3.0.
- **Components changed:** Tooltip, Popover, SpoolPicker, SpoolSwatch, AssetListItem, ModelPicker, PrintCard, ScreenPrintDetail.
- **Previews changed:** Tooltip (the `.at` form in a clipping card, `.at.end`, and `.pp-lift` under a stretched card link), Popover (`.pp-pop.at` escaping a `pp-card pp-flush`), SpoolPicker (the four trigger states side by side, and the print-level control with its new line), ModelPicker (**rewritten**: the compact strip at 4 and at 34, the timelapse without a duration, phone, loading, video-only, and the square form kept as a specimen), PrintCard (the outline demo: black and white filament, with and without `.pp-art`), AssetListItem (the slicer slot with its chip moved onto the trigger, plus an inherited slot), ScreenPrintDetail (the file list moved after the orders in all four frames, labels reworded).
- **Pages changed:** `README.md` (points 6–8 of *Floating panels*, the new section *Three rules this round wrote down*, the inline-data-property list, *Versie 2.3*), `copy-deck.md`, `contrast.md`, `do-dont.md`.
- **Contrast report:** no new colour pair; four new **uses** of measured pairs are listed under *Added in 2.3*, with the two picture-against-ground figures (1.16:1 and 1.68:1) that are the reason the outline exists at all.
- **Breaking changes: none.** No token, class or copy key is renamed or removed. Two things the app must now do that it did not before: set `--pp-pop-x`/`--pp-pop-y` and re-measure or close an `.at` panel on scroll, and put `.pp-art` on the picture inside a thumbnail. Four placeholders can go: the tooltip's non-anchor wrapper keeps its behaviour but gets `.pp-lift`; the card that stopped clipping while a panel was open goes back to clipping; the "van de print: {naam}" chip changes shape; `wrap` stays unapplied, now by rule.

## What I rejected, and why

- **Outlining a thumbnail we did not make.** The only reading of 2.0 that would have changed anything, and it is a bigger step than the sentence implied: decoding, drawing over and re-encoding 79 files to change how they look on our ground, keyed to an alpha boundary the slicer chose, and redone whenever the ink changes. The page can draw the same outline from the same alpha channel, in a token, in both themes. The owner was right to stop and ask.
- **"A card must not clip an open panel."** Cheaper exactly once — in the card where the bug was found — and after that an obligation on every card in the system, including the ones that clip deliberately: `.pp-flush` exists so a full-bleed table keeps the card's rounded corners. It also fails whenever a panel is taller than its card, which is the ordinary case for a 302px picker in a file row. A panel's placement is the panel's problem.
- **A collapsible "Bestanden", and folding it into "Deze print"** (GAP-117, both the owner's questions). A disclosure charges a click on the page's own subject and has nothing left to protect now that the price is above the list. "Deze print" is deliberately facts without controls; the file list is downloads, spools, counts and badges. One card with two jobs would cost the only place on that page you can read without worrying what you might change. The implementer argued this and I agree with it — it is now a decision rather than an argument.
- **Capping the file list's height with its own scroll.** My own earlier proposal, correctly not built. Median 5 files, 17 prints over ten, largest 48: the cap does nothing for most prints, and where it fires it traps a scroll inside a card, hides rows from the browser's own find, and cuts the list at a height nobody asked for. Last on the page, it may be 48 rows long.
- **Reading video durations in the browser** to label the strip. It would fetch every video to draw a picker — a picker must not download the things it is picking between. The duration leaves the spec; if the indexer ever reads one server-side, only a copy key changes.
- **The Select above n models stays rejected** (2.0, 2.0.1), but not for the reason 2.0.1 gave. "Real pictures beat a list of names" rested on the withdrawn per-model-render measurement. The reason that survives: a Select hides the set you are choosing from, the thing GAP-094 asked to see, and the strip's compact form is now itself a list of names — with the current choice, the count and the type all visible at once.

## What I need you to measure

Both are values inside decisions that are otherwise settled. Build them as they stand; do not pick a number yourself.

- **GAP-071, the paint cost.** The longest tile grid you can render (83 tiles, and the same page at 360px) with `.pp-art` on every thumbnail, against the same page without it: frame time, or a scroll-jank figure, whichever your tooling gives honestly. Four chained drop-shadows is cheap per element and I have not measured it at 83. If it regresses visibly, say so and I will put a single `drop-shadow(0 0 1px)` halo on the grid and keep the four-shadow ring on the detail page — do not make that trade yourself, because a blurred halo is partly transparent and no longer measures 3.69:1. And: **is any thumbnail in the library fully opaque?** That decides whether the outlined-rectangle case is real or theoretical.
- **GAP-116, the button width.** The **longest and median model file-name length** in the library, in characters, and how wide the longest renders in mono `text-xs`. `--pp-modelbtn-max` is 200px because that holds about 28 mono characters; it is chosen, not measured. If your names run to 40 characters I raise it.

## Long cases drawn

The media strip at **34** pictures (33 models and a timelapse) as one scrolling line with the fading edge and the focusable region, and at the median 4; the same strip at 360px; a print with only a timelapse. The thumbnail outline on a black and on a white filament, with and without `.pp-art`, on `surface-2`. The window-placed tooltip and popover inside cards that clip, the popover with `--pp-pop-max` at 260px. The print detail at 1280, 980 and twice at 360px, each with the file list last. The slot rows with all four spool states.

## What I think is wrong in `implementation.md`

It is a round behind — you said so — and the detail you sent supersedes it. Two things in it that will still be wrong after a refresh unless they are corrected: it says **113 gaps logged, 13 open**, where this round's brief says 117 logged and 5 open; and under *Waiting on an answer I owe you* it lists **GAP-094 and GAP-096 as unbuilt with "the print detail still shows the 1.9 Select"**, which the GAP-116 correction contradicts — the strip is built, with no Select and no per-model pictures. Also: ModelPicker's own 2.0.1 note claimed "the preview shows it that way" about the wrapped strip, and that claim was true of the preview but is now withdrawn with the rule; and GAP-089 is recorded as settled with nothing left to do, which 2.3 does not change.

# Changelog 2.2

Resolves GAP-109 to GAP-113, the five gaps of this round. Three arrived built as placeholders the owner approved; two are bugs in rules of mine, found by measurement. Version 1.9 follows below — **2.0 and 2.1 were never written into this file**; their record lives in the component READMEs (PrintCard, AssetListItem) and is summarised in `README.md` under *Versie 2.0 and 2.1*.

| Gap | About | Result |
|---|---|---|
| GAP-109 | Missing-file icons give a tagless card an extra line | **confirmed as built**: the icons belong at the end of the `h3`, in inline flow; `bundle.css` now carries the glue rule (`.pp-print h3 .pp-lacks`) so the app can drop its marker, and the preview draws it |
| GAP-110 | The tooltip has no placement and 400ms is too slow | **resolved**: `.pp-anchor>.pp-tip` (above, `.end`, `.down`) plus the window-placed `.pp-tip.at` for a trigger inside anything that clips or scrolls; no delay; `aria-hidden` on a bubble that repeats the name is **confirmed**, with the two-case rule written down and the `title` attribute dropped |
| GAP-111 | The file row's name column collapses and the badge overflows | **resolved**: `minmax(var(--pp-name-min),1fr)` for the name and `minmax(0,auto)` for the controls, `--pp-name-min: 240px`, `.ord` no longer `nowrap`. The proposed one-line override (`minmax(0,auto)` alone) is **rejected**: with a 1fr column whose minimum is 0 the free space goes to the controls first and the name collapses to nothing |
| GAP-112 | A popover near the bottom falls off the screen | **resolved**: side per axis (`.up`/`.end`), height capped by `--pp-pop-max` with the panel's own region scrolling, and the sheet form under 240px of room (`.pp-anchor.sheet`). Flip *and* cap, not one of them; the rule is in `README.md` under *Floating panels* and carries menus, the tag editor and the date picker |
| GAP-113 | The tooltip reads as a sentence where a phrase would do | **resolved**: one visible short form, `print.lacks` = "Ontbreekt: G-code, 3MF en STL", used in both the bubble and the print-detail chip; the full sentence stays as the accessible name (`print.lacks.aria`). The split the placeholder built is right; the wording is unified so there is not a third form of the same fact |

## New and changed

- **Tokens:** none added, renamed or removed. `tokens.json` `version` is **2.2**. The two new lengths are `bundle.css` variables, next to `--pp-tap` and `--pp-control-h`, not tokens: `--pp-name-min` (240px, the file row's name-column floor). New allowed **inline data properties**, which the app sets from a measurement and never from a chosen value: `--pp-pop-max`, `--pp-tip-x`, `--pp-tip-y`.
- **New classes** `.pp-anchor.sheet` (the sheet form at any width), `.pp-tip.at` (with `.at.end`, `.at.down`), `.pp-anchor.down>.pp-tip`, `.pp-w-900` (preview helper).
- **Changed classes** `.pp-anchor>.pp-pop` (flex column, `max-height: var(--pp-pop-max, …)`, `overflow-y: auto`, `overscroll-behavior: contain`; its children do not shrink), `.pp-anchor>.pp-picker` and `.pp-anchor>.pp-tagpop` (the panel does not scroll, the inner region does — which keeps its 240px as a preferred height and shrinks below it only when the panel is capped, so a panel with room is unchanged), `.pp-anchor>.pp-tip` and `.pp-anchor.end>.pp-tip` (placement, `z-tooltip`, never hoverable), `.pp-asset` (the 760px container form: name floor, yielding controls), `.pp-asset .acts` (`min-width: 0`), `.pp-asset .ord` (wraps), `.pp-print h3 .pp-lacks` (new rule).
- **Copy** `print.lacks` (changed: "Ontbreekt: {types}", joined with ", " and " en ", now the bubble *and* the chip), `print.lacks.aria`, `print.lacks.item`, `print.lacks.type.gcode`, `print.lacks.type.3mf`, `print.lacks.type.stl`. All six are in `copy-deck.md` under *Added in 2.2*; the first three were named in 2.0/2.1 and had never reached the deck. No key removed.
- **Components changed:** Popover, Tooltip, SpoolPicker, TagEditor, OverflowMenu, AssetListItem, PrintCard.
- **Previews changed:** Popover (flipped, capped with 30 spools, sheet), Tooltip (above, `.end`, `.down`, and a real description with `aria-describedby`), PrintCard (the icons behind the name on a tagless card, a 33-character name, the tag row keeping "Geen spoel", the short form in bubble and chip — and the stale `--mix` demo of 1.9 removed, two versions after `--mix` left the contract), AssetListItem (the duplicate row in a 900px and a 768px container).
- **Pages changed:** `README.md` (new section *Floating panels*, plus the missing 2.0/2.1 record), `copy-deck.md`, `do-dont.md`, `contrast.md` (two rows reworded: the `bg` on `text-strong` pair is the tooltip bubble as well as the rail tip — it was only labelled for the rail).
- **Contrast report:** no new colour pair. Nothing changes colour this round: the bubble is the existing `.pp-tip` (`bg` on `text-strong`, 15.84 light / 16.08 dark) and the icons keep the 2.1 figures (`warning` on `surface` 6.11/10.84, on `primary-tint-soft` 5.46/9.53, on `primary-tint` 4.99/8.52, against a 3:1 requirement).
- **Breaking changes:** none. No token or class is renamed or removed. Two things the app must now do that it did not before: set `--pp-pop-max` and the side modifiers on every anchored panel, and set `--pp-tip-x`/`--pp-tip-y` on a tooltip that uses `.at`. A panel that sets neither still cannot be drawn off-screen in the horizontal axis, but it can be below the fold — the backstop cap is the window height, not the room below the trigger.

## What I rejected, and why

- **`minmax(0,auto)` for the controls column alone** (GAP-111's one-line override). It makes the measured case worse: grid gives free space to the `auto`-max track before an `fr` track whose minimum is 0, so the name column goes to zero instead of 75px. The floor on the name column is the part that does the work.
- **The bare-icon legend without words anywhere** stays rejected from 2.0, and 2.1's answer to it stays: icons on the card and the row, words on the print detail. GAP-113 does not reopen it; it only shortens the words.
- **Making the missing-file icon group focusable** so its tooltip is keyboard-reachable. It is a graphic with a text alternative, not a control, and a tab stop on every card that is missing a file — inside a stretched card link — costs more than it gives. Its words are on the print detail, which is the path that teaches them anyway.
- **A hover delay of any size.** 400ms was in the spec because tooltips elsewhere repeat a visible label; this one is the only explanation of a glyph. A tooltip that costs nothing to show costs nothing to show by accident.

## What I need you to measure

*All four came back the same day and all four values hold — see the Addendum below; nothing in this list is outstanding.*

None of the five decisions waits on a number; these verify them, and if one comes back wrong I change the value rather than you inventing one.

- **GAP-111, the floor.** The min-content width of the widest thing that can sit in the name column with `nowrap`: every badge it can carry ("Mogelijk dubbel" 128px measured, "Niet in een bestelling", "Bestand ontbreekt", "Op factuur {nummer}") at your real data. If any exceeds **240px**, tell me the number and I raise `--pp-name-min`; do not raise it yourself.
- **GAP-111, the sweep.** The **container** width of `.pp-assetlist` at window widths 900, 1400, 1700 and 2000. Your sweep is over window widths and the rule is a container query; broken at 900 and 1700 but correct at 1400 and 2000 cannot be monotone in the container, so I would like to know what the container actually does at 1700.
- **GAP-112, the floor of 240px.** How often, and where, the sheet form is reached: the natural height of the tallest anchored panel in the app (the tag editor with every tag, the column menu in Toegang, the spool picker with 30 spools) and the smallest viewport height you see in practice. If nothing ever reaches the floor it is a backstop; if the tag editor reaches it on a laptop, I want to know.
- **GAP-109 / 2.1's figures.** How many of the 83 cards carry missing-file icons. 2.1 says 58% of tiles carry nothing, which makes about 35 cards; your GAP-109 measurement says 10 cards carry icons, all 10 without tags. Both cannot be right, and the second is the one the owner sees. I have not changed anything on the strength of either.

## Addendum, same version (2026-10-08, after 2.2 was implemented)

Your four measurements came back and all four values hold, so **the version stays 2.2**: no rule, class, token or copy key changes below, and bumping the number would make you re-import a prose correction. What changed is the record.

**Measurements, answered.**

1. **The name-column floor holds.** Widest `nowrap` badges in that column: "Mogelijk dubbel" 128px, "Niet in een bestelling" 151px, "Op factuur {nummer}" 134px, asset status badge 139px. All under 240px, so `--pp-name-min` stays at 240px. (Side note for some round: the spec names a "Bestand ontbreekt" badge the app does not have.)
2. **Container widths — answered twice, and the first answer was withdrawn.** The first set (780 / 572 / 1326 / 1620) was derived rather than measured and the implementer retracted it; the explanation that came with it is withdrawn too. **Measured**, print-level / order-level, because since 2.0 a print detail holds **two** `.pp-assetlist` containers: window 900 → 796 / 794, 1400 → 1132 / 628, 1700 → 1432 / 794, 2000 → 1732 / 961. The **order list** is the narrow one and the only one whose `.acts` measures 651px; the print-level row carries a download, about 36px. These figures close the loose end exactly: 794 − 24 − 24 − 20 − 651 = **75px**, the name column first reported, at windows 900 *and* 1700; 628 is below the breakpoint so 1400 was in the two-row form; 961 leaves 242px, two pixels clear of this gap's floor, which is why 2000 looked correct. The sweep was monotone all along — in a container nobody had measured. The implementer's verified 486px of controls corroborates 794 and rules out 780 (which would give 472px).
3. **The sheet floor is unexercised.** Panels measure 302px (30-spool picker), 136px (tag editor, two tags), 96px (column menu); on a 760px viewport a low picker is offered 348px, so parts 1 and 2 of the rule cover everything this machine can produce and part 3 would first bite near 560px of viewport height. It stays in as the backstop, and Popover's README now says plainly that it is specified rather than verified.
4. **The count conflict was 2.1's error, not a conflict.** 58 is a count: 58 of 83 prints carry nothing, 20 carry one type, 3 two, 2 three — so **70%** carry nothing and 25 of 83 carry icons, which is what 2.0 said. 2.1 wrote the count as a percent and sized the icon form against "58%". Corrected in PrintCard's README, where the per-type figures already reconciled with the counts (20×1 + 3×2 + 2×3 = 32 = 18 + 7 + 7). The "10 cards carry icons, all without tags" measurement is the icon-carrying cards among the 24 the dashboard's first page renders — a page, not a sample — and GAP-109's 2.2 note now says so.

**Corrected in my own files**, both reported by the implementer: `README.md` opened with "This is version 1.9" and now says 2.2, and the duplicated "## Versie 1.7" section is gone.

**Accepted without change:** the two hooks write the measurement onto the element instead of through React state. The contract is the modifiers and the two data properties; how the app gets them there is theirs, and refusing to render twice to reach the same pixels is right.

**The overflow risk my own fix creates, exercised.** Letting the controls track shrink means a control that cannot shrink will overflow it, and `.pp-spoolbtn` does not truncate. Measured on a print with spools assigned: 29 spools, longest name 35 characters, widest trigger 216px, zero rows overflowing at window 1700; and at the 760px breakpoint the controls track still gets 452px against a 216px widest control. Real in principle, unexercised rather than disproved. No gap logged for a number nobody can produce.

**Still the owner's to settle:** GAP-113's wording. "Ontbreekt: G-code, 3MF en STL" is built in both places; if they prefer "Geen G-code, 3MF en STL", both places change together and nothing else does.

## Long cases drawn

The duplicate file row in a 900px container (the width where the name column was 75px) and in a 768px one; the spool picker with 30 spools flipped above its trigger and again capped at 210px with the list scrolling and the search field in place; the same picker as a sheet; a tagless card with one icon, a three-icon card, a 33-character name with icons behind it, and a card whose tag row still carries "Geen spoel"; the tooltip above, right-hanging and below.

# Changelog 1.9

Resolves GAP-062 to GAP-087 (26 gaps from the walkthrough of app 1.0.0). Version 1.8 follows below.

| Gap | About | Result |
|---|---|---|
| GAP-062 | Checkbox hops 4.5px when ticked | **confirmed as built**: `vertical-align: top` on `.pp-opt` is now in `bundle.css` |
| GAP-063 | Sidebar footer unreachable on tall pages | **confirmed as built**: `.pp-app>.pp-side` is sticky, `100vh`, `overflow-y:auto`; the page scrollbar stays on the page |
| GAP-064 | Viewer 4:3 and 1090x830 | **resolved**: `.pp-viewer.fluid` caps at 560px (420px high); no model is `pp-viewer is-empty`, a 72px strip |
| GAP-065 | Theme control always a moon | **resolved**: icon shows the current state (monitor, sun, moon); accessible name names state and next state |
| GAP-066 | No sort and no status filter | **resolved**: Sorteren and Status Selects in FilterBar, server-side, in the URL |
| GAP-067 | Klant strip grows without limit | **resolved** (your decision): one scrollable chip row on all widths plus "Overzicht" dialog with the tiles; about 56px |
| GAP-068 | No thumbnail in the list view | **resolved**: 40px `pp-thumb sm` first column in PrintRow, rule for the phone block |
| GAP-069 | Bulk bar not sticky above 480px | **resolved**: sticky at every width (`bottom: space-4` floating, flush on phones) |
| GAP-070 | Only the klant name is clickable | **confirmed as built, whole tile** (stretched button, `aria-pressed`, controls above it) |
| GAP-071 | Dark tint swallows the model | **proposed, needs your measurement**: `--mix` floor towards `border-strong` (40% minimum); I need the model/ground ratio |
| GAP-072 | Subtitle repeats the print name | **proposed, needs your confirmation**: klant alone when the project equals the print name; share page shows the date |
| GAP-073 | "Kosten ontbreken" twice | **resolved**: PaymentPanel line is official; the cost card says "Onvolledig" and names the missing input |
| GAP-074 | Order block nests three cards | **resolved**: one order card, sections with hairlines; 360, 768 and 1280px drawn |
| GAP-075 | Verwijderen too prominent | **resolved** (your decision): OverflowMenu "⋯" on the print detail and the klant tile; ConfirmDialog stays |
| GAP-076 | Missing cost has no link to the setting | **resolved**: `pp-missing` line "Geen vermogen voor {printer}." with link; "Vermogen ontbreekt" badge in Printers |
| GAP-077 | Share page shows the internal label | **resolved** (your decision): label dropped, header studio, klant, expiry; dialog says it is internal |
| GAP-078 | Share page gives no payment instructions | **resolved** (your decision): "Betalen" block with IBAN, t.n.v., bedrag, kenmerk and contact, copy buttons |
| GAP-079 | No thumbnails on the share page | **resolved** (your decision): 48px neutral `surface-2` thumbnail per line, no tint |
| GAP-080 | Openstaand is one long list, age invisible | **resolved** (your decision): collapsed groups, age badge in three steps (30 and 90 days), max 10 lines then "Toon alle"; thresholds to be measured |
| GAP-081 | Deel-links cannot be filtered, duplicates | **resolved**: Actief / Inactief / Alle, numbered duplicate suffix, create warning; "shown once" line once per page (deviation) |
| GAP-082 | No payment status on invoices | **resolved**: Status column with Betaald / Open / Deels betaald / Afgeschreven, creditnota "—"; preview **rejected** (browser viewer) |
| GAP-083 | Settings saves without unsaved warning | **resolved** (your decision): per section, "Niet opgeslagen" marker, Opslaan only when dirty, leave confirmation |
| GAP-084 | Card around Scalar | **resolved**: no card; the renderer meets the page padding; rule point 5 for third-party renderers |
| GAP-085 | No video player or thumbnail | **resolved with a new component**: VideoPlayer (dialog, poster, states, mkv fallback), poster as thumbnail with play badge |
| GAP-086 | Only one model viewable | **resolved with a new component**: ModelPicker (strip up to 6, Select above, caption "Model n van m") |
| GAP-087 | Loss of connection announced twice | **resolved**: bar is the state, loss toast dropped, "Weer verbonden." toast kept |

## Decisions you made (asked in this round)
GAP-077 label is internal; GAP-078 payment block with IBAN, t.n.v., bedrag, kenmerk and contact; GAP-079 neutral thumbnail ground; GAP-063 sticky sidebar; GAP-080 collapsed groups and age steps; GAP-067 one scrollable chip row; GAP-075 overflow menu; GAP-083 per-section save with a changed state.

## Defaults I chose; please confirm or change
- **GAP-072** (shown as proposed): klant alone when the project equals the print name. It changes what the card's second line means.
- **GAP-070**: whole tile as the control; **GAP-073**: PaymentPanel's sentence is official; **GAP-087**: bar kept, loss toast dropped; **GAP-065**: icon shows the current state; **GAP-069**: sticky at every width.
- **GAP-066**: five sort options, six status options (the ones you listed), both server-side.
- **GAP-081**: "shown once" is one line on the page, not on every row (deviation). **GAP-082**: no in-app invoice preview.
- **GAP-064**: cap of 560px; **GAP-086**: strip up to 6 models, Select above that.

## What I need you to measure
- **GAP-080:** days-open distribution of the open lines (thresholds 30 and 90).
- **GAP-071:** the rendered model colour and the ground colour of a black and a dark-purple thumbnail after the change (aim 3:1).
- **GAP-086:** how many models a print holds (largest and median).
- **GAP-085:** how many prints are video-only, and how many videos are `.mkv`.
- **GAP-064:** the y-position of the price field at 1360x900 and 390x844.

## Long screens drawn at real size
Openstaand with 90 lines and 10 klanten (desktop and 360px, collapsed and one group open); the dashboard strip with 20 klanten at 1280 and 360px, plus the overview dialog with 20 tiles; the print detail at 360px with and without a model; the order block at 360, 768 and 1280px. Checked for horizontal overflow; the only flags are the known preview artefacts.

## New and changed
- **Tokens:** none added, renamed or removed. New allowed inline data property: `--mix` (thumbnail tint floor).
- **New components:** ModelPicker, VideoPlayer, OverflowMenu.
- **New classes:** `pp-sharepay`, `pp-sharepay-row`, `pp-share-lead`, `pp-share-thumb`, `pp-models`, `pp-modelbtn`, `pp-model-cap`, `pp-video`, `pp-play`, `pp-menu`, `pp-missing`, `pp-strip`, `pp-allcust`, `pp-ogrp` (with `-bar`, `-more`, `-list`), `pp-sl-tools`, `pp-sec-hd`, `pp-sec-ft`, `pp-theme`, `pp-warnico`, `pp-scrollframe`, helpers `pp-w-160`, `pp-w-720`, `pp-w-768`, `pp-w-1280`, modifiers `is-empty` (viewer), `poster` and `sm` (thumb), `is-overflow` (chips), `sel` (filter selects), `dup`.
- **Changed classes:** `.pp-viewer.fluid` (560px cap), `.pp-order` family (flattened cards, sections), `.pp-cust` and `.pp-cust-name` (whole tile), `.pp-bulk` (sticky at every width), `.pp-opt` (`vertical-align: top`), `.pp-app>.pp-side` (sticky), `.pp-thumb.tinted` (`--mix` floor, inset ring), `.pp-dialog h2` (`min-width: 0`).
- **Components changed:** ScreenSharePage, ScreenShareLinks, ShareLinkRow, Viewer3D, OrderSection, CostBreakdown, PaymentPanel, AssetListItem, ScreenPrintDetail, CustomerCard, CustomerChips, FilterBar, BulkActionBar, PrintRow, PrintCard, ScreenDashboard, AppShell, Checkbox, ScreenApiDocs, Toast, ScreenSystemStates, LiveIndicator, OutstandingGroup, ScreenOutstanding, ScreenInvoices, ScreenSettings.
- **Contrast report:** seven new pairs, 143 in all, 0 fail.
- **Copy deck:** "Added in 1.9" (about 90 keys); one removed (the loss toast).

## Breaking changes
- **Visual only, no renamed or removed names:** the viewer on the print detail shrinks from unbounded to 560px; cards inside an order are flattened by CSS; the dashboard no longer shows the klant card strip on the page (the tiles moved into the overview dialog) and the klant tile has no delete icon; a klant tile and a print have a changed second line (GAP-072, if confirmed); Openstaand groups are `<details>` and their group actions moved from the header into the body.
- **App changes needed:** the share-page header and PDF title drop the label; the loss-of-connection toast is removed.

---

# Changelog 1.8

Resolves GAP-060 and GAP-061. Version 1.7 follows below.

| Gap | Result |
|---|---|
| GAP-060 ScreenApiDocs: Scalar's endpoint list not reachable by keyboard on a phone | **confirmed as built, and generalised.** The app makes every scrollable-but-unfocusable region of the renderer a labelled, focusable region (`tabindex="0"`, `aria-label` = `api.title`), `role="region"` on generic elements only (never on a list), removed again when it stops scrolling. Written into the ScreenApiDocs README together with a four-point rule for screens drawn by a third-party renderer. Verified by the app at 360px; I have not run Scalar myself |
| GAP-061 Contrast report: translucent over translucent | **resolved.** `contrast.md` has a table *Translucent token inside a translucent row* (the four state tints over row hover and selected row, both themes) and a rule. The table shows that the nested composite would fall below AA in several light pairs (for example `unpaid` 4.10 on a selected row, 4.44 on a hovered row; `paid` 4.41 and `info` 4.33 on a selected row; dark `unpaid` 4.12 on a selected row), so badges now carry an opaque `surface` base: their ground is `surface` in every row state |

## Decisions
- **Badges on tinted rows (your choice):** the tint sits on an opaque `surface` base, so a badge on a hovered, selected or `surface-2` row is a slightly lighter pill and always measures like a badge on `surface` (4.93 to 5.33 light). This also settles the open v1.7 finding about light `unpaid` and `warning` badges over `surface-2` (4.29 and 4.32) without a token change.
- **Your app measurement and mine differ.** You measured 4.98 and 4.97 on a hovered row, because in the app the hover tint does not lie under the badge. The design system's own selected table row (`.pp-table tr.is-selected td`, `primary-tint`) does put the tint under a badge, and your measurement did not cover a selected row. The opaque base makes the result independent of that structure.
- **Region name:** `api.title` stays as the accessible name; `api.endpoints` ("Lijst met endpoints") is an optional improvement, not added.

## New and changed
- **Tokens:** none added or changed.
- **Changed classes:** `.pp-badge.paid/.unpaid/.warning/.info`, `.pp-hint` and the hint inside `.pp-money` (background is the tint over an opaque `surface` base; look: only on tinted grounds).
- **Contrast report:** new nested table and rule. 129 paired checks, 0 fail.
- **Components changed:** StatusBadge (preview with a selected row, README), ScreenApiDocs (README: GAP-060 and the third-party renderer rule).
- **Copy:** none (optional `api.endpoints`).

## Breaking changes
- None. Visible change: badges on a hovered, selected or `surface-2` row are a slightly lighter pill than before.

---

# Changelog 1.7

Resolves GAP-054 and GAP-056 to GAP-059. Version 1.6 follows below.

| Gap | Result |
|---|---|
| GAP-056 ScreenApiDocs: Swagger UI or Scalar | **resolved: Scalar is official, Swagger UI is dropped.** Scalar 0.9.78 with `theme: "none"`; the complete variable mapping (every one of the 102 declared variables plus the three `button-1` ones) is in the ScreenApiDocs README and shipped as `.pp-scalar` in `bundle.css`; preview of the themed result in both themes; the three unused Swagger classes are removed |
| GAP-059 Contrast report does not name the ground | **resolved:** `contrast.md` has a Ground column on every pair, a table *Translucent tokens over every ground* (7 tokens, 3 grounds, 2 themes) with the grounds each is approved over, and a rule at the top. Real alpha values are used |
| GAP-054 `.pp-lockhelp` does not wrap | **resolved:** `flex-wrap: wrap`; column layout at 480px and below; checked at 360px |
| GAP-057 First-run folder diagram wraps | **resolved:** `.pp-tree` is `nowrap`; it sits in `.pp-scroll` (focusable, labelled region); verified at 360px |
| GAP-058 ScreenAccess empty state | **confirmed as built:** EmptyState "Nog geen gebruikers om toegang te geven" with link "Naar Gebruikers"; previews desktop and phone |

## Decisions
- **Scalar mapping.** Colours: GET `info`, POST `paid`, PUT `warning`, DELETE `unpaid`; text `text-strong`, `text`, `muted`; grounds `surface`, `surface-2`, `bg`. Where I changed what the app built: `--scalar-background-accent` is `primary-tint-soft` (was `primary-tint`, which fails AA over `surface-2` in the light theme); `--scalar-background-alert` and `-danger` are `warning-tint` and `unpaid-tint` (they defaulted to solid orange and red); `button-1`, `-color` and `-hover` are mapped (primary buttons, not black or white); links follow `.pp-link`; borders are 1px; Scalar's 10px text becomes `text-xs` (12px); radius, text, leading and shadow follow our scales. Structural variables (header and address-bar height, brightness, tooltip padding, text-decoration colours, font weights) keep Scalar's value.
- **The dump list is incomplete.** The section "Still on a value of their own" of the Scalar dump leaves out `--scalar-button-1`, `--scalar-button-1-hover` and the literal heading, line-height, paragraph and size variables of the group "other". All of them are decided in the README mapping now. Regenerate the dump after a Scalar upgrade and compare.
- **Open question (new, from the matrix):** where do badges on `surface-2` occur in the app? If they do, the light `unpaid` and `warning` tokens need a slightly darker value, or those rows use `surface` instead.
- **Check in the app:** the callouts that use `--scalar-background-alert` and `-danger` (text colour on the tint) and the `Test request` button.

## New and changed
- **Tokens:** none added or changed.
- **Contrast report:** new column Ground, new table of translucent tokens over `bg`, `surface` and `surface-2`; alphas are the real ones from `tokens.css` (until 1.6 rounded: .08, .14, .20; no verdict changed). Not approved (below 4.5:1; light theme unless noted): `primary` on `primary-tint` over `surface-2` (4.34); `muted` on `primary-tint` over `surface-2` (4.27); `primary` on `primary-tint-strong` over `bg` (4.26) and `surface-2` (3.98), and in dark over `surface-2` (4.05); `unpaid` on `unpaid-tint` over `surface-2` (4.29); `warning` on `warning-tint` over `surface-2` (4.32). Everything else is approved over all three grounds. **New finding, not changed in 1.7:** the last two mean a light Open or missing-data badge is below AA when it sits on a `surface-2` ground (for example a hovered table row or a table header). Fixing it needs either darker `unpaid` and `warning` text colours in the light theme (a token change) or a rule that these badges never sit on `surface-2`; please decide (see the open question below). 129 paired checks, 0 fail.
- **New classes:** `.pp-scalar` (variable mapping), `.pp-sc`, `.pp-sc-side`, `.pp-sc-search`, `.pp-sc-grp`, `.pp-sc-main`, `.pp-sc-op`, `.pp-sc-m`, `.pp-sc-code`, `.pp-sc-note`, `.pp-sc-btn` (illustration of the themed renderer in the preview only).
- **Changed classes:** `.pp-lockhelp` (wrap, column at 480px), `.pp-tree` (nowrap, `width: max-content; min-width: 100%`).
- **Components and screens changed:** ScreenApiDocs (preview and README rewritten), AssetListItem, AccessMatrix, ScreenAccess, ScreenSystemStates.
- **Copy:** `access.empty.title`, `access.empty.body`, `access.empty.link`, `api.title`, `api.noLoginField`, `api.search`, `api.testRequest`, `api.loadErrorBody` (changed text: "De documentatie kon niet worden opgehaald. Probeer het opnieuw.").

## Breaking changes
- `.pp-api-head`, `.pp-api-row` and `.pp-method` are removed from `bundle.css` (added in 1.6 for the Swagger layout; unused in the app).
- The `ds-gap: GAP-056`, `GAP-057` and `GAP-058` markers can come out; GAP-056 can use `.pp-scalar` instead of the app's `.app-api` block.

---

# Changelog 1.7

Resolves GAP-054 and GAP-056 to GAP-059. Version 1.6 follows below.

| Gap | Result |
|---|---|
| GAP-056 ScreenApiDocs: Swagger UI or Scalar | **resolved: Scalar is official, Swagger UI is dropped.** Scalar 0.9.78 with `theme: "none"`; the complete variable mapping (every one of the 102 declared variables plus the three `button-1` ones) is in the ScreenApiDocs README and shipped as `.pp-scalar` in `bundle.css`; preview of the themed result in both themes; the three unused Swagger classes are removed |
| GAP-059 Contrast report does not name the ground | **resolved:** `contrast.md` has a Ground column on every pair, a table *Translucent tokens over every ground* (7 tokens, 3 grounds, 2 themes) with the grounds each is approved over, and a rule at the top. Real alpha values are used |
| GAP-054 `.pp-lockhelp` does not wrap | **resolved:** `flex-wrap: wrap`; column layout at 480px and below; checked at 360px |
| GAP-057 First-run folder diagram wraps | **resolved:** `.pp-tree` is `nowrap`; it sits in `.pp-scroll` (focusable, labelled region); verified at 360px |
| GAP-058 ScreenAccess empty state | **confirmed as built:** EmptyState "Nog geen gebruikers om toegang te geven" with link "Naar Gebruikers"; previews desktop and phone |

## Decisions
- **Scalar mapping.** Colours: GET `info`, POST `paid`, PUT `warning`, DELETE `unpaid`; text `text-strong`, `text`, `muted`; grounds `surface`, `surface-2`, `bg`. Where I changed what the app built: `--scalar-background-accent` is `primary-tint-soft` (was `primary-tint`, which fails AA over `surface-2` in the light theme); `--scalar-background-alert` and `-danger` are `warning-tint` and `unpaid-tint` (they defaulted to solid orange and red); `button-1`, `-color` and `-hover` are mapped (primary buttons, not black or white); links follow `.pp-link`; borders are 1px; Scalar's 10px text becomes `text-xs` (12px); radius, text, leading and shadow follow our scales. Structural variables (header and address-bar height, brightness, tooltip padding, text-decoration colours, font weights) keep Scalar's value.
- **The dump list is incomplete.** The section "Still on a value of their own" of the Scalar dump leaves out `--scalar-button-1`, `--scalar-button-1-hover` and the literal heading, line-height, paragraph and size variables of the group "other". All of them are decided in the README mapping now. Regenerate the dump after a Scalar upgrade and compare.
- **Check in the app:** the callouts that use `--scalar-background-alert` and `-danger` (text colour on the tint) and the `Test request` button.

## New and changed
- **Tokens:** none added or changed.
- **Contrast report:** new column Ground, new table of translucent tokens over `bg`, `surface` and `surface-2`; alphas are the real ones from `tokens.css` (until 1.6 rounded: .08, .14, .20; no verdict changed). Not approved: `primary` text on `primary-tint` over light `surface-2` (4.34) and over `primary-tint-strong` over `bg` and `surface-2`, and `muted` text on `primary-tint` over light `surface-2` (4.27). 129 paired checks, 0 fail.
- **New classes:** `.pp-scalar` (variable mapping), `.pp-sc`, `.pp-sc-side`, `.pp-sc-search`, `.pp-sc-grp`, `.pp-sc-main`, `.pp-sc-op`, `.pp-sc-m`, `.pp-sc-code`, `.pp-sc-note`, `.pp-sc-btn` (illustration of the themed renderer in the preview only).
- **Changed classes:** `.pp-lockhelp` (wrap, column at 480px), `.pp-tree` (nowrap, `width: max-content; min-width: 100%`).
- **Components and screens changed:** ScreenApiDocs (preview and README rewritten), AssetListItem, AccessMatrix, ScreenAccess, ScreenSystemStates.
- **Copy:** `access.empty.title`, `access.empty.body`, `access.empty.link`, `api.title`, `api.noLoginField`, `api.search`, `api.testRequest`, `api.loadErrorBody` (changed text: "De documentatie kon niet worden opgehaald. Probeer het opnieuw.").

## Breaking changes
- `.pp-api-head`, `.pp-api-row` and `.pp-method` are removed from `bundle.css` (added in 1.6 for the Swagger layout; unused in the app).
- The `ds-gap: GAP-056`, `GAP-057` and `GAP-058` markers can come out; GAP-056 can use `.pp-scalar` instead of the app's `.app-api` block.

---

# Changelog 1.6

Resolves GAP-047 to GAP-053 and cleans the two milestone 9 previews (ScreenSystemStates, ScreenApiDocs). Version 1.5 follows below.

| Gap | Result |
|---|---|
| GAP-053 Share page and PDF: totals read "€ 0,00" with no prices | resolved: with no priced line the totals card (page) and totals block (PDF) are left out; list, "Prijs volgt", footnote and "Download overzicht" stay; "Er staat niets open." wins with "Alleen openstaand" on; the PDF footer then has no payment instruction. Previews added to ScreenSharePage and DocOverview |
| GAP-052 ShareLinkRow columns shift without Intrekken | resolved: last column fixed at `--pp-share-act: 88px` (no subgrid), also at 900px and below |
| GAP-047 DatePicker calendar button | confirmed as built, specified: `.pp-iwrap>.pp-btn.r` ghost icon button, label "Kies een datum", click in the field does not open the calendar; previews of DatePicker and ScreenInvoiceExport now show the button |
| GAP-048 Locked order controls | confirmed as built (visible `pp-help` line with `aria-describedby` instead of a tooltip, as you reasoned); added decision: "Spoel voor de hele print" skips locked orders and names the reason; locked previews in AssetListItem and CostBreakdown, rules in OrderSection, PaymentPanel and ScreenPrintDetail |
| GAP-049 "Geldig tot" without expiry | confirmed as built: row left out; preview added |
| GAP-050 Close TokenReveal without copying | confirmed as built: ConfirmDialog "Sluiten zonder kopiëren?" with "Terug" and "Sluiten"; preview added |
| GAP-051 Day counts 0 and 1 | confirmed as built: ICU plurals and "Vandaag", "morgen"; previews in ShareLinkRow and ScreenSharePage |
| M9 inline values | resolved: no layout `style` is left in ScreenSystemStates and ScreenApiDocs (only the data property `--w`); loading and error states added |

## Decisions applied
- **Share page and PDF:** one line per order; archived prints stay; written-off orders and deleted prints never appear; header shows logo, else company name, else "3D Prints Portal"; a niet-factureren klant sees Print, Project and Datum only; all dead links show the same page; the Overzicht says "Dit is een overzicht, geen factuur." and adds payment instructions only while something is open (reference: klant name).
- **Link expiry:** 7, 30 or 90 dagen, or Nooit; no notice and no "Geldig tot" row for Nooit.
- **No prices:** totals omitted, not "Prijs volgt" amounts (your choice).
- **Locked order:** "Spoel voor de hele print" skips it (your choice).

## New and changed
- **Tokens:** none added or changed (129 contrast pairs, 0 fail; no new colour pair).
- **New classes:** `--pp-share-act` (variable on `.pp-share`), `pp-lockhelp`, `pp-qty-text`, `pp-api-head`, `pp-api-row`, `pp-method`, `pp-minh-180/420/560`, `pp-w-980`, `pp-w-520`, `pp-left-t`, `pp-tree`, `pp-indent-1` to `pp-indent-4`, `.pp-alert.banner`, `.pp-state.is-inline`, `.pp-iwrap>.pp-btn.r`.
- **Changed classes:** `.pp-share` grid columns (fixed last column); `.pp-share-amt .pp-muted` no longer wraps.
- **Components:** changed DatePicker, AssetListItem, CostBreakdown, OrderSection, PaymentPanel, TokenReveal, ShareLinkRow, ScreenSharePage, DocOverview, ScreenPrintDetail, ScreenInvoiceExport, ScreenSystemStates, ScreenApiDocs. No new components.
- **Copy:** `date.pick`, `share.closeUncopied`, `share.closeUncopiedBody`, `common.back`, `date.daysOne`, `date.daysOther`, `date.agoOne`, `share.expiresTomorrow`, `share.expiresToday`, `spool.wholePrintSkipped`, `api.loadError`.

## Breaking changes
- None. The ApiDocs operation row padding changes from 10px to `space-2` (8px) and the method badge from 56px to 72px minimum.
- The `ds-gap: GAP-0xx` markers in the app code can come out for GAP-047 to GAP-051.

---

# Changelog 1.5

Resolves GAP-037 to GAP-045 and removes the remaining inline values from the milestone 8 previews. Version 1.4 follows below.

| Gap | Result |
|---|---|
| GAP-043 DatePicker calendar classes | resolved: `.pp-cal`, `.pp-cal-hd`, `.pp-cal-ft`, `.pp-pop.pp-calpop` in `bundle.css`; new component DatePicker with README and preview (open, error, phone bottom sheet); the export dialog uses it |
| GAP-041 Per-line "Markeer als betaald" in Openstaand | resolved: dialog in ScreenOutstanding (amount, default the remainder); one line per order; a Nabestelling reads "{print} (nabestelling {n})", Bestelling 1 shows the print name |
| GAP-040 "Spoel voor de hele print" placement | resolved: ScreenPrintDetail and OrderSection READMEs and preview; "Nog niet in een bestelling" section for unassigned files; files that never count are marked |
| GAP-042 "Factuur" button on phones | resolved: CustomerChips toolbar; hidden for niet-factureren klanten (variant added) |
| GAP-037 Invoice footer | resolved (option "Voorstel overnemen"): "Definitief maken" is refused without name and IBAN (aria-disabled, hint with link to Instellingen; Concept still works without the payment sentence); "Deze factuur is volledig betaald." replaces the payment sentence when nothing is open |
| GAP-038 18 truncated READMEs | resolved: cause was a write helper that truncated the file before reading it; fixed and every README holds the full spec (anatomy, tokens, states, accessibility, Dutch copy) |
| GAP-039 `pp-text-lg/xl/2xl` undefined | resolved: defined, plus `pp-text-3xl` and `pp-gap-6` |
| GAP-044 `.pp-anchor.up` off screen on phones | resolved: on phones the sheet pins to the bottom; `.pp-device.phone .pp-anchor` is static so it anchors to the device |
| GAP-045 Three footer buttons overflow 440px | resolved: the footer wraps (primary on its own row); export dialog at 440px (`pp-dialog.sm`) and 360px phone stack verified |

## Decisions applied
- **Order date:** modification time of the newest counted G-code in the order, else the creation date; used for the Datum column, the Van/Tot en met filter and the OrderSection header.
- **Days open:** from the invoice date, else the date the Verkoopprijs was set, else the order date.
- **Payment reference:** final invoice uses its number; Concept and Herinnering use the klant name.
- **Finalising:** "Voorstel uit marge" becomes the order's Verkoopprijs; price, cost adjustments and "Aantal keer geprint" lock with "Op factuur {nummer}"; payments and write-offs still work.
- **Credit notes (Admin):** write off only what is still open; what was paid stays paid.
- **Role User:** Openstaand is read-only, no buttons, only granted klanten.
- **Logo:** PNG or SVG upload (max 1 MB), stored and served as PNG; it replaces the studio name in the AppShell sidebar, phone top bar and drawer (max height, alt text); the icon rail keeps the initial tile.
- **PDFs:** built-in Helvetica, Western European characters only. Reindex progress bar: unchanged.

## New and changed
- **Tokens:** none added or changed (129 contrast pairs, 0 fail).
- **Classes:** `pp-cal`, `pp-cal-hd`, `pp-cal-ft`, `pp-calpop`, `pp-logo`, `pp-viewer-sm`, `pp-text-lg/xl/2xl/3xl`, `pp-gap-6`, `pp-cust-name`, plus layout helpers that replace inline values in the share, document and skeleton previews.
- **Components:** DatePicker (new); changed: AppShell (logo), CustomerChips, CustomerCard, ScreenOutstanding, ScreenInvoiceExport, ScreenPrintDetail, OrderSection, DocInvoice, DocOverview, ScreenShareLinks, ScreenSharePage.
- **Previews:** `class="sel"` removed (state is `aria-selected`); `<style>` blocks removed from DocInvoice, DocOverview, DocReminder, PrintCard and Viewer3D (only the Cover keeps one).

## Breaking changes
- None. Class `pp-btn-focus` (a typo) is now `pp-focus`.

---

# Changelog 1.4

Resolves GAP-029 to GAP-036 and removes the inline values from the M6 and M7 previews. Version 1.3 follows below.

| Gap | Result |
|---|---|
| GAP-033 Instellingen: printers, tariff, material prices | resolved: Prijzen gets Stroomtarief and Materiaalprijzen; new section Printers (`pp-printer`); ScreenSettings desktop, errors, empty state and phone |
| GAP-029 No stacking level for popovers | resolved: stacking tokens `z-raised`, `z-sticky`, `z-popover`, `z-tooltip`, `z-overlay`; `.pp-pop` carries `z-popover`; `.pp-anchor` floats it |
| GAP-035 Several orders in one print (Nabestelling) | resolved: OrderSection, NabestellingDialog, "Niet in een bestelling" badge and hint, summed PrintCard/PrintRow, PaymentPanel rules, ScreenPrintDetail variant |
| GAP-034 Bulk dialogs "Spoel toewijzen" and "Prijs instellen" | resolved: BulkDialogs with the per-print result (toast plus alert with reasons); price goes on the newest order |
| GAP-036 Inline sizes in the M6 previews | resolved: classes and one token (`space-9`); no layout `style` is left in PaymentPanel, CostBreakdown, CostOverrideDialog, SpoolPicker, MoneyDisplay, ScreenSettings, ScreenOutstanding, ScreenInvoiceExport and ScreenInvoices |
| GAP-030 CustomerCard selected state; restore on phones | resolved: `.pp-cust.is-selected`; deleted chip `.pp-chip.is-deleted` and "Herstellen" in the toolbar |
| GAP-031 Palette colours announced in English | resolved: Dutch accessible names and keys `tags.colour.*` |
| GAP-032 ConfirmDialog README and copy deck differ | resolved: the README and preview now use the copy deck text |

## Decisions applied
- **Bulk price:** "Prijs instellen" always sets the price on the newest order of each selected print; a print whose newest order is paid, written off or invoiced fails with a reason, the others continue.
- **Orders on the detail page:** stacked sections, newest first, settled orders closed; same on phone and desktop.
- **Instellingen:** Stroomtarief and the Materiaalprijzen table under Prijzen, plus a separate section Printers.
- **Deleting a Nabestelling:** Admin and Editor, only without payment or write-off and not on an invoice; Bestelling 1 never; the files return to "Niet in een bestelling".

## New tokens
- `space-9` 48px (slot indent).
- Family `zIndex`: `z-raised` 1, `z-sticky` 10, `z-popover` 30, `z-tooltip` 40, `z-overlay` 50.
- Family `opacity`: `opacity-deleted` 0.45, `opacity-archived` 0.6, `opacity-disabled` 0.5.
- No colour token is new or changed. Contrast report: 129 pairs, 0 failures (new rows: selected customer card, progress bar on its track, selected card border).

## Changed tokens
None changed. The raw numbers in `bundle.css` now read the new tokens: z-index 10, 20 (tooltips, now `z-tooltip` 40), 50 and the matrix cells, and the opacity values 0.45, 0.6 and 0.5.

## New and changed classes in `components/bundle.css`
- **Stacking and popovers:** `.pp-anchor` (with `.end` and `.up`); `.pp-pop` now has `position:relative` and `z-index: var(--z-popover)`.
- **Orders:** `.pp-orders`, `.pp-order` (a `details` element, with `.ttl`, `.sum`, `.chev`, `.bd`, `.is-open-order`), `.pp-pick`, `.pp-results`.
- **Settings:** `.pp-printer`, `.pp-mprices`, `.pp-progress` with `.pp-bar` (width from the data property `--v`), `.pp-logo-box`, `.pp-setrow`, `.pp-kv.narrow`, `.pp-kv.tight`, `.pp-time`, `.pp-cols-2`, `.pp-cost tr.slot` and `.pp-slotname`.
- **States:** `.pp-cust.is-selected`, `.pp-chip.is-deleted`, `.pp-hint` (standalone), `.pp-scrim.sheetframe`.
- **Helpers:** `pp-m0`, `pp-fw-regular|medium|bold`, `pp-right`, `pp-grow`, `pp-minw-0`, `pp-minw-200`, `pp-self-start`, `pp-items-start`, `pp-items-center`, `pp-pushr`, `pp-info`, `pp-unpaid`, `pp-dim`, `pp-bg-2`, `pp-mb-1`, `pp-p3`, `pp-p4`, `pp-rel`, `pp-reset`, `pp-plain`, `pp-minh-64`, `pp-minh-700` and the fixed widths `pp-w-120|160|200|260|320|340|420|440|480|600` (all capped at 100% of the container). They already existed from before: `pp-between`, `pp-end`, `pp-start`, `pp-push`, `pp-nowrap`, `pp-fill`, `pp-gap-*`, `pp-text-*`, `pp-strong`.

## New components and screens
- **New components:** OrderSection, NabestellingDialog, BulkDialogs.
- **Changed components:** Popover (floating, `z-popover`), FilterBar and TagEditor (stacking notes), PaymentPanel (overpayment error, undone payments in the history), PrintCard and PrintRow (several orders), AssetListItem (not in an order), CustomerCard (selected), CustomerChips (deleted klant), ConfirmDialog (text from the copy deck, new confirmations), BulkActionBar (what the buttons open), CostBreakdown, CostOverrideDialog, SpoolPicker and MoneyDisplay (no inline values).
- **Changed screens:** ScreenSettings (Prijzen, Printers), ScreenPrintDetail (orders), ScreenDashboard (notes), ScreenTags (Dutch colour names), ScreenOutstanding, ScreenInvoiceExport, ScreenInvoices (no inline values).

## Inline audit (GAP-036)
In the nine listed previews and the new ones, every `style` attribute is gone except the data properties `--c1`, `--c2`, `--v`, `--tag` and `--tag-ink`. The values that had no token: slot indent 48px (`space-9`), the 110px label column (`pp-kv.narrow`), the two time inputs (`pp-time`), the reindex progress bar (`pp-progress`), the logo box (`pp-logo-box`), the Klanten rows (`pp-setrow`), the two-column Bedrijfsgegevens grid (`pp-cols-2`, one column on phones) and the Standaardmarge field (`pp-w-200`). Two values map to the nearest token: 6px gaps became `space-2` (8px) and 13px text became `text-sm` (13.5px).
Previews of other components still contain layout `style` attributes (for example the share page, API-docs and the loading skeletons); they are not part of the contract and will be cleaned in the next round if you want that.

## Breaking changes
- **Tooltip layer:** rail and nav tooltips moved from `z-index` 20 to `z-tooltip` (40); anything between 20 and 40 in the app now sits below them.
- **Popover markup:** `.pp-pop` now has `position:relative`. Floating popovers must sit in `.pp-anchor`; a `.pp-pop` placed elsewhere keeps its place in the page flow.
- **Print detail:** the page lists OrderSection blocks; a print with one order shows one open "Bestelling 1" section instead of a single Bestanden, costs and payment column.
- **PrintCard and PrintRow:** price, status and open amount are sums over the orders.
- **Copy:** `confirm.deleteTagBody` and the README example for `confirm.deleteCustomerBody` now match the copy deck (the deck text did not change).

---

# Changelog 1.3

Resolves GAP-024 to GAP-028 and removes inline values from the dashboard, print detail and asset list. Version 1.2.1 follows below.

| Gap | Result |
|---|---|
| GAP-024 Dimmed deleted and archived thumbnails, row flash, muted row text | resolved: `.is-deleted` (45%), `.is-archived` (60%), `.pp-row.flash` and `.pp-row .muted` in `bundle.css`; no inline opacity |
| GAP-025 Phone customer chip row | resolved: `.pp-chips` and `.pp-chip` with `aria-pressed`, component CustomerChips |
| GAP-026 Delete a whole klant | resolved: ghost icon button on CustomerCard, "Klant verwijderen" in the filtered phone view, destructive ConfirmDialog, deleted card with Herstellen; keys `customers.delete`, `confirm.deleteCustomer`, `confirm.deleteCustomerBody` |
| GAP-027 Tag editor and tag management | resolved: TagEditor popover (`.pp-tagpop`), palette `.pp-pal`, new page ScreenTags (Admin and Editor); keys `tags.*`, `confirm.deleteTag*`, `error.tagExists`, `error.tagTooLong` |
| GAP-028 Copy for fullscreen and print count | resolved: `viewer.fullscreen`, `viewer.exitFullscreen`, `customers.printCount` (ICU plural) |

## New and changed
- **Tokens (new, 10):** `tag-rose`, `tag-orange`, `tag-amber`, `tag-lime`, `tag-teal`, `tag-sky`, `tag-blue`, `tag-violet`, `tag-lilac`, `tag-grey`, per theme. Chip text `#141a33` or `#ffffff`; all new pairs pass WCAG 2.2 AA (121 pairs, 0 failures).
- **Classes (new):** `.pp-chips`, `.pp-chip`, `.pp-cust`, `.pp-custs`, `.pp-toolbar`, `.pp-tagpop`, `.pp-pal`, `.pp-tagrow`, `.pp-plate`, `.pp-detail`, `.pp-showcase`, `.pp-card-hd`, `.pp-viewer .full`, `.pp-viewer.fluid`, `[data-c=…]`, text, gap and layout utilities. **Changed:** thumbnails, cards and rows (`.is-deleted`, `.is-archived`, `.flash`).
- **Components (new):** CustomerCard, CustomerChips, TagEditor. **Changed:** PrintCard, PrintRow, AssetListItem (40px plate thumbnail), TagChip (`data-c`), Viewer3D (fullscreen), ConfirmDialog (klant, tag), AppShell (Tags nav item for Admin and Editor).
- **Screens (new):** ScreenTags, desktop and phone. **Changed:** ScreenDashboard, ScreenPrintDetail, User role view.
- **Audit:** inline values in the dashboard, print detail and asset list previews moved to classes. Remaining inline: `--c1`, `--tag`, `--tag-ink` (data) and `min-height` on preview devices (scaffolding, not for the app).

## Breaking changes
- Tag colours are now palette keys; an old free hex still renders through `--tag` and `--tag-ink` but is no longer offered in the editor.
- Print-detail delete and "Toon verwijderde" are role-gated as described in the README.
- The app can remove its temporary `ds-gap` styles for GAP-024 to GAP-028.

# Changelog 1.2.1

Patch release: resolves GAP-023. Version 1.2 follows below.

| Gap | Result |
|---|---|
| GAP-023 No class to swap a table for cards at 480px and below; login page padding stays 24px on phones | resolved: wrapper classes `pp-only-wide` and `pp-only-phone`, and `pp-center` pads the page with `space-4` (16px) at 480px and below |

- **How to use it:** put both layouts in the DOM, each in its own wrapper without a display of its own: `<div class="pp-only-wide">table</div>` and `<div class="pp-only-phone">cards</div>`. Above 480px only the first shows; at 480px and below only the second. The wide table keeps its own `pp-scroll` box as a fallback. The preview container `pp-device.phone` forces the same rules at a fixed width.
- **Screens changed:** Gebruikers and Toegang (table and cards in one DOM), Login (phone padding from the class instead of an inline value).
- **Tokens:** none new or changed. **Breaking changes:** none; the temporary `ds-gap: GAP-023` stylesheet in the app can be removed.
- **Not changed:** other tables (Facturen, Openstaand, print lists) keep their current phone behaviour; the swap classes are available for them.

---

# Changelog 1.2

Version 1.2 resolves GAP-013 to GAP-022 from the implementation of 1.1. Version 1.1 is kept below for history.

## Gap resolution

| Gap | Result |
|---|---|
| GAP-013 Deel-link for niet-factureren klanten | resolved: the disabled create dialog is gone; the Klant field shows the help "Deze klant wordt niet gefactureerd. De link toont alleen de printlijst, zonder bedragen." and Maken stays enabled; ScreenSharePage gets a not-billed variant (Print, Project, Datum only, intro "Hier zie je de prints die voor je gemaakt zijn.", no amounts, payment badges, totals or PDF button). DocOverview is unchanged: a niet-factureren klant has no Overzicht PDF |
| GAP-014 "Nooit" as expiry | resolved: fourth option Nooit with the help "De link blijft werken tot je hem intrekt."; ShareLinkRow shows "Verloopt niet" in `muted` (class `never`); the share page omits the expiry notice |
| GAP-015 AppShell has no responsive CSS | resolved: media queries at 900px (56px icon rail with tooltips) and 480px (top bar, bottom bar, `.pp-drawer`); phone rules exist as media queries, so the app never sets `.phone`; one DOM for every size; rail and drawer are drawn in the AppShell page |
| GAP-016 No line-height tokens or base typography | resolved: 8 `leading-*` tokens and a `body` rule in `bundle.css`; all raw line-heights in `bundle.css` now use the tokens |
| GAP-017 Raw sizes in login and system states | resolved: classes `pp-auth`, `pp-auth .or`, `pp-state`, `pp-state.wide`, `pp-iwrap.compact`, `pp-dialog.sm`; the 22px state heading is merged into `text-xl` / `leading-xl` (20/28), so no 22px token was added |
| GAP-018 Local sign-in by name or e-mail | resolved as proposed: field "E-mailadres of naam" (`type="text"`, `autocomplete="username"`), key `auth.identifier` |
| GAP-019 Choosing a password after a temporary one | resolved: new login-card state "Nieuw wachtwoord kiezen" (with errors) and a small dialog "Wachtwoord resetten voor '{naam}'" where the admin types the temporary password |
| GAP-020 "Rol wijzigen" on phones | resolved: the same native Select inside the card; the button and its copy are dropped |
| GAP-021 Editor rows in the access matrix | resolved: Editor rows look like Admin rows (disabled, checked, "· Editor"); note "Admin en Editor hebben altijd toegang."; phone cards show a disabled, checked list |
| GAP-022 Error copy for sign-in and users | resolved: `auth.oidcFailed`, `error.passwordTooShort`, `error.userExists`, `confirm.deleteUserBody`, all drawn in their screens |

## New tokens

`leading-xs` 16px, `leading-sm` 20px, `leading-base` 22px, `leading-md` 24px, `leading-lg` 26px, `leading-xl` 28px, `leading-2xl` 32px, `leading-3xl` 40px. They sit in the `fontSize` family of `tokens.json` (the format has no separate line-height family) and appear in `tokens.css` as `--leading-*`. No colour token is new or changed; the contrast report has 6 more rows (107 pairs, all pass).

## Changed tokens

None.

## New classes in `components/bundle.css`

`body` base rule, `pp-drawer-backdrop`, `pp-drawer`, `pp-auth` (with `.or`), `pp-state` (and `.wide`), `pp-iwrap.compact`, `pp-dialog.sm`, `pp-sr` (visually hidden), `pp-main > h1`, `pp-share .never`, plus the responsive rules for `pp-app`, `pp-side`, `pp-nav`, `pp-phone-top`, `pp-bottomnav`. The preview containers `pp-device.rail` and `pp-device.phone` force the same rules at a fixed width.

## New or changed components

- **AppShell:** responsive spec, DOM contract, icon rail, drawer.
- **ShareLinkRow:** "Verloopt niet" state.
- **AccessMatrix:** Editor rows, new note.
- **ConfirmDialog:** `pp-dialog sm`, delete-user confirmation with its consequence sentence.

## New or changed screens

- **ScreenLogin:** identifier field, Authentik-failed, session-ended and new-password states.
- **ScreenUsers:** compact role select, native select on phones, reset-password dialog, create-dialog errors, delete icon button.
- **ScreenShareLinks:** Nooit and not-billed creation, a link without expiry in the list.
- **ScreenSharePage:** not-billed variant, no expiry notice.
- **ScreenAccess:** Editor rows.
- **ScreenSystemStates:** classes instead of inline sizes (title 20px instead of 22px).
- **ScreenSettings:** README text about the Deel-link for niet-factureren klanten.

## Decisions applied

- **Credited prints:** a credited print becomes Afgeschreven. This is stated in the README rules; no new component was needed because the status already exists.
- **Sign-in rules:** Authentik admin group becomes Admin, a 60-minute idle and 12-hour session limit, 5 login attempts per minute, passwords of at least 12 characters and the last-Admin guard are recorded in README and the screen specs.

## Additions beyond the gaps

- An `info` notice "Je sessie is verlopen. Log opnieuw in." on the login card.
- A ghost button "Uitloggen" on the new-password card, so the user is never stuck.
- The user Esmee added to the sample data (a second User row).

## Breaking changes

- **Markup:** AppShell. Nav links need `<span class="lbl">` and `data-tip`, the brand needs `.ini` and `.full`, and on phones `header.pp-phone-top`, `nav.pp-bottomnav` and the drawer sit inside `.pp-app` instead of next to it. `.pp-phone-main` and the `.phone .pp-stats` rule still exist for compatibility but are no longer used.
- **Copy keys removed:** `share.noShareLink`, `share.notBilled`, `access.adminAlways` (use `access.allAccessRoles`), `auth.email` (use `auth.identifier`).
- **Copy key text changed:** `auth.wrong` is now "Verkeerd e-mailadres, naam of wachtwoord."
- **Visual:** state-page titles are 20px instead of 22px; dialogs with a maximum width of 400px or less now use the 380px `pp-dialog sm`, wider ones the 440px default.

## Known limits

- Many previews still contain inline `style` attributes for demo layout. They are not part of the contract; the app uses only tokens and the classes above. The inline values in login, state pages, role select and ConfirmDialog (GAP-017) are gone; a full audit of every preview is not done.
- Wide layouts (1440px and up) are specified in the README text, not drawn.

---

# Changelog 1.1

Version 1.1 resolves every open gap from the implementation of 1.0.

## Gap resolution

| Gap | Result |
|---|---|
| GAP-001 No screens, screen copy or invoice layout | resolved: 17 screen and document pages added (below), screen copy in each README and in `copy-deck.md` |
| GAP-002, GAP-003 | not in the list received; nothing done |
| GAP-004 No "partially paid" status | resolved: badge Deels betaald, remaining-amount line, PaymentPanel, OutstandingGroup, PrintCard, PrintRow, share page, documents |
| GAP-005 Per-slot filament usage | resolved: slot rows and slicer-colour swatch in AssetListItem; CostBreakdown slot sub-rows; tint fallback rule in SpoolSwatch |
| GAP-006 Aantal keer geprint | resolved: compact input in AssetListItem, "× n" in meta, "n × …" in CostBreakdown |
| GAP-007 Duplicate file warning | resolved: badge Mogelijk dubbel plus visible hint line (see deviations) |
| GAP-008 3MF plates as rows | resolved: child rows "Plaat n" with their own controls and slots |
| GAP-009 Manual price per kg, grams and time | resolved: new CostOverrideDialog opened by "Aanpassen" |
| GAP-010 Niet factureren customers | resolved: badge, "Kosten" display, PaymentPanel note, Instellingen toggle; no Deel-link for such klanten (your decision) |
| GAP-011 Write-off states | resolved: written-off PaymentPanel state, admin undo, new WriteOffDialog with optional reason |
| GAP-012 Invoice register, finalise, credit notes | resolved: new Facturen screen, finalise dialog, credit-note dialog, "Op factuur" badge and locked state |

No gap was rejected or merged. Decisions you made while resolving: Facturen is visible to Admin and Editor and only Admins create a Creditnota; a Creditnota covers the whole invoice or chosen lines; a klant that is niet factureren cannot get a Deel-link.

## New tokens

None. Every new state uses existing tokens. Version in `tokens.json` is now 1.1.

## Changed tokens

None. Values, names and the `tokens.css` fallback are unchanged.

## New components

- **AppShell** (Screens group): sidebar, icon rail, top bar, bottom bar and drawer.
- **CostOverrideDialog**: manual price per kg, weight and print time.
- **WriteOffDialog**: partial write-off with optional reason.

## Changed components

- **StatusBadge:** added Deels betaald, Niet factureren, Mogelijk dubbel, Op factuur {nummer}, Concept, Definitief, Creditnota; added the `pp-remaining` line.
- **MoneyDisplay:** remaining-amount and negative variants, "Kosten" label.
- **SpoolSwatch:** `.slicer` variant with the "slicer" hint chip; thumbnail tint rule.
- **AssetListItem:** times-printed input, slot rows, plate child rows, duplicate hint, automatic and manual exclusion with reason; layout now adapts to container width.
- **CostBreakdown:** header with Aanpassen, per-slot sub-rows, times-printed calculation text, "Niet meegeteld" line.
- **PaymentPanel:** states for partial, written off, niet factureren, rol User, locked by invoice, missing cost; admin-only undo actions.
- **OutstandingGroup:** partial line variant; totals are sums of remainders.
- **PrintCard, PrintRow:** partial, niet factureren, deleted (with Herstellen) variants.
- **ConfirmDialog:** finalise variant and the new undo and finalise copy.

## New screens and documents (group Screens)

ScreenLogin, AppShell, ScreenDashboard, ScreenPrintDetail, ScreenInvoiceExport, ScreenOutstanding, ScreenShareLinks, ScreenAccess, ScreenUsers, ScreenSettings, ScreenApiDocs, ScreenSharePage, ScreenInvoices (new page), ScreenSystemStates, DocInvoice (Factuur, Concept, Creditnota), DocReminder (Herinnering), DocOverview (Overzicht).

## Changed screens

None; there were no screens in 1.0.

## New files and copy

- `copy-deck.md`: about 150 new keys, grouped by area.
- `contrast.md`: 11 new rows (neutral badge text, remaining-amount line, duplicate hint, document text on white paper); all pass.
- `bundle.css`: classes `pp-slot`, `pp-hintchip`, `pp-qty`, `pp-reason`, `pp-remaining`, `pp-assetlist`, `pp-device`, `pp-app`, `pp-side`, `pp-nav`, `pp-main`, `pp-bottomnav`, `pp-paper` and layout helpers.
- README: roles, documents, screens, payment rules and the "no VAT" rule.

## Deviations from the proposals

- **GAP-007:** the explanation is a visible hint line instead of a tooltip, so it is readable on touch and by screen readers; the badge itself is as proposed.
- **GAP-009:** when Spoolman supplies the price per kg the price field is disabled with "Prijs komt uit Spoolman.", which follows the precedence you gave (Spoolman, then handmatig, then standaard per materiaal).
- **GAP-001:** screens are shown at desktop (980px) and phone (360px) widths, with both themes through the page's theme switch. Tablet and wide behaviour is specified in text under Responsive and AppShell, not drawn.
- **GAP-012:** concept PDFs are not stored, so the register lists only final invoices and credit notes.

## Breaking changes

- **Copy:** the vocabulary entry "BTW" is removed from the README; no token or component used it. Any implementation of a VAT toggle, rate, VAT number or KvK field from the brief must be removed.
- **Behaviour:** "Betaling ongedaan maken" is now Admin-only and always confirms.
- **Layout (AssetListItem):** `.pp-asset` is now a two-line grid by default and switches to one line inside a `.pp-assetlist` container that is 760px wide or more; `.pp-slot` is now a wrapping flex row. Consumers that copied the 1.0 three-column grid must wrap the list in `.pp-assetlist`.
- **Payment status:** a print with `0 < paid < price` now shows Deels betaald instead of Open, and counts only its remainder in Openstaand.
- **Invoice numbers:** only final invoices and credit notes are numbered; a Concept download and a Herinnering have no number.

## Notes

IBAN, address and e-mail on the documents are placeholders. The Swagger operations on the API-docs screen are illustrative.
