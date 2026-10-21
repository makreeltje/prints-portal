Print detail (`/prints/:id`) shows one print: identity and status, the 3D model, its files, the cost breakdown and the payment panel.

**Anatomy.** **Header:** breadcrumb (klant; the project only when it differs from the print name, GAP-072), name as `<h1>`, the payment or billing badge, the missing-files chip (`pp-lacks`), tags, and the "⋯" OverflowMenu. **Desktop (901px and up):** the media row `pp-pdtop` (left Viewer3D with the media strip, right the card "Deze print"), then the print's file list `pp-pdfiles`, then the OrderSections. **Phone:** one column, viewer first, then "Deze print", the orders, "Nabestelling maken" and the file list last. The full order is under **2.0** below, which supersedes *Placement (1.5)* and the *Orders (1.4)* order. **Variants:** *Gearchiveerd* (info alert; files gone from disk, model and downloads unavailable, price and payment stay editable); *Verwijderd* (admin only, unpaid-tinted alert with Herstellen); *Kosten ontbreken* (warning alert with Aanpassen; the suggestion button is disabled); *Vergrendeld* (badge "Op factuur {nummer}" and an info alert; price field disabled); *Niet factureren* (cost shown as "Kosten", PaymentPanel replaced by its note); *Rol User* (name, price and status only; no cost, breakdown, notes or file controls).

**Tokens.** `bg`, `surface`, `border`, CostBreakdown, PaymentPanel, AssetListItem, Viewer3D tokens.

**States.** Loading (Skeleton), default, archived, deleted, missing cost, locked, niet factureren, user role, saving, error.

**Accessibility.** One `<h1>`; each card has a heading; admin-only controls are not rendered for other roles; destructive actions confirm.

**Dutch copy.** Bestanden | Spoel voor de hele print | Bestanden en slots met een eigen spoel gaan hierboven voor. | Gearchiveerd. | Verwijderd op {datum}. | Kosten ontbreken. | Op factuur {nummer}. | Je ziet alleen prijs en status.

**Orders (1.4).** Below the viewer the page lists the orders as OrderSection blocks, newest first ("Nabestelling 2 · 6 okt 2026", "Bestelling 1"); settled orders are closed. Each order has its own files with "Aantal keer geprint", CostBreakdown and PaymentPanel, so a print with one order looks like before (one open section). Files that are in no order appear in an `info` alert "{n} nieuw bestand(en) staan in geen bestelling. Voeg het toe aan een nabestelling." with the button "Nabestelling maken", which opens NabestellingDialog; the same button sits below the list. Deleting the print ("Verwijderen") still hides the whole print with all its orders. The role User sees none of this: name, price, status, thumbnail, 3D model and tags only *(the tags clause is superseded by 2.15, GAP-166: role User sees no tags)*; the price is the sum over all orders.

**Placement (1.5)** *(superseded by 2.0)*. Order of the page with orders: header, Viewer3D (full width), the card "Spoel voor de hele print" (`pp-card pp-sec`, full width, with SpoolPicker and the help "Bestanden en slots met een eigen spoel gaan hierboven voor." — the spool belongs to the print, not to one order), the `info` alert for files in no order, the card **"Nog niet in een bestelling"** (AssetListItem rows with the badge "Niet in een bestelling"), then the OrderSections, newest first, and "Nabestelling maken". Files that never count (STL, video, PDF, links) have no order; they are listed in the Bestanden card of Bestelling 1 so they can still be downloaded. The date in an OrderSection header is the order date: the modification time of the newest counted G-code in that order, else the date the order was created; the invoice Datum and the Van / Tot en met filter use the same date.

**1.6.** (2026-10-07) **Locked orders (GAP-048).** "Spoel voor de hele print" leaves orders that are on a final invoice untouched and says so in its result message; see OrderSection. The help line `pay.lockedHelp` is shown once per locked order, not once per control.

**1.9.** (2026-10-07) **Header and viewer (GAP-064, 075; resolved).** **Verwijderen leaves the header (GAP-075):** the red button is replaced by the "⋯" OverflowMenu in the top right (items: *Herstellen* for an Admin on a deleted print, and *Verwijderen* in `unpaid`, always last); ConfirmDialog stays. The freed spot is left empty on purpose; the badge stays beside the tags. **Viewer (GAP-064):** Viewer3D is capped at 560px wide (420px high at 4:3, 270px on a 360px phone); a print without a model shows the 72px "no model" strip instead of a 4:3 box, so price, payment and files start at once. Several models: ModelPicker under the frame (GAP-086). **Phone order:** with a model the viewer is still first (270px), without one the strip is first; then payment, files and costs as before. **Missing cost (GAP-073, 076):** the cost card says "Onvolledig" and names the input; the payment panel keeps "Kosten ontbreken…" (see CostBreakdown, PaymentPanel). **Real size:** drawn at 1360px (viewer 560x420, cost and payment in the right column within about 420px of the top) and at 360px (with and without a model). **To measure (owner):** the y-position of the price field at 1360x900 and 390x844 after this change (aim: visible without scrolling, with a model on desktop and without a model on a phone).

**2.0.** (2026-10-08) **The screen decided as one question (GAP-094, 095, 096, 097; all resolved).** The page had three problems that are one problem: the viewer was capped at 560px and left half of a 1360px row empty, every order repeated the print's whole file list, and the timelapse was buried in that list while the model got a viewer. The rule behind the answer: **what belongs to the print is shown once, at print level; an order shows only what it bills.**

**Order of the page (901px and up).**

1. **Header** as in Anatomy, one row, unchanged except for the missing-files chip.
2. **`pp-pdtop`** — a two-column media row. **Left:** Viewer3D (`pp-viewer fluid`, still capped at 560px) with, under it, the caption and the **media strip** (ModelPicker) that now holds every model *and* the timelapse. **Right:** the card **"Deze print"** (`pp-card pp-sec`): a `pp-kv tight` list (Klant, Project, Datum, Materiaal, Tijd, Gewicht, Bestellingen), then the SpoolPicker trigger **"Spoel voor de hele print"** with its help line, then the missing-files line when something is missing. Nothing in this card repeats PaymentPanel: no price, no payment, no status — those belong to an order. The right column takes the width the viewer does not, so the dead space of 1.9 is gone.
3. **`pp-pdfiles`** — one card **"Bestanden"**, full width, the print's whole inventory: every file once (AssetListItem), with downloads, duplicate hints, the per-file spool when a file has one, and in the meta line **which order counts it** (`span.ord`: "Telt in Bestelling 1", "Telt in Nabestelling 2", or the `warning` badge "Niet in een bestelling"). This card is where "Nog niet in een bestelling" used to be a card of its own; that card is gone, its rows are these rows with the badge. The `info` alert "{n} nieuw bestand(en)…" with "Nabestelling maken" stays, above this card.
4. **`pp-orders`** — the OrderSections, newest first. An order holds three sections: **"In deze bestelling"** (only the items this order bills, with "Aantal keer geprint", "Telt niet mee in kosten" and the slot spools — these stay per order, because a locked order keeps its own spools and counts), **"Totaalkosten"** and **"Betaling"**. The STL, the video, the PDF and the links are *not* in an order any more; they live in the print's file list only. See OrderSection.
5. **`pp-pdnew`** — "Nabestelling maken".

**Phone and tablet (900px and below).** One column. The viewer stays first (270px at 360px; without a model the 72px strip), then "Deze print", then the orders, then "Nabestelling maken", then the file list — `pp-pdfiles` and `pp-pdnew` carry a flex `order` so the long inventory cannot push the price field off the screen. Inside an order at 900px and below the sections run **Betaling, Totaalkosten, In deze bestelling**, for the same reason; the hairline that divides them moves to the section that is now second.

**The media strip (GAP-096, accepted in a changed form).** Your proposal was "put the timelapse in the model picker so the viewer area carries every picture of the print" — taken, with one change: a timelapse is not a model, so the strip button for it is the neutral `surface-2` ground with a play glyph and the duration, never a poster frame (GAP-089: nothing in the container can make one), and choosing it replaces the 4:3 viewer with the 16:9 VideoPlayer in place, at the same maximum width. The group is labelled "Modellen en timelapse" when both exist, "Modellen" with models only, and a print with one model and one timelapse therefore has a two-button strip where 1.9 had none. 60% of prints have a timelapse, so this is the common case, not the long one.

**Variants.** Unchanged, with: *Gearchiveerd* — the strip is not drawn (no files on disk); *Rol User* — no file list at all, so `pp-pdfiles` is absent and the media row's right-hand card holds only Klant, Project and Datum; *Vergrendeld* — the lock help line sits inside "In deze bestelling", once per order, as in 1.6.

**Dutch copy (new).** Deze print | Bestanden | In deze bestelling | Telt in {bestelling} | Modellen en timelapse | Timelapse | Timelapse: {bestandsnaam} | Ontbreekt: {types}

**To measure (owner):** the y-position of the price field at 1360×900 and 390×844 after this change (the 1.9 request, still open, and this round moves the field again), and whether the right-hand card at 1360px is taller or shorter than the viewer beside it — if it is much shorter the row has dead space again and I would move the newest order's Betaling into it.

**2.1.** (2026-10-08) **This page is where the legend is written (GAP-106).** The card and the row show the missing-file **icons**; the print detail shows the **worded chip** `pp-lacks has-text` ("Ontbreekt: G-code, 3MF, STL") in the header badge row, and the "Deze print" card keeps the full sentence under its facts. So a slashed `file-code` on a tile is learnable in one place, which was my strongest objection to icons and is now answered rather than argued. Nothing else on the screen changes.


**2.3.** (2026-10-08) **One order of the page at every width, and the price before the inventory (GAP-117, confirmed as built).**

2.0 put the file list third on desktop, ahead of the orders, and last on the phone. Measured on an ordinary print at desktop: the page is 1892px, the list **585px — 31% of it** — starting at y=652, while the orders did not start until y=1257. Every visit scrolled past the whole inventory to reach the price. The phone layout had already been given the other order for exactly this reason in 2.0, and two orders for one page was the mistake: a rule that is right at 360px is not wrong at 1360px.

**The order of the page, now the same at every width:** header; `pp-pdtop` (viewer and media strip left, "Deze print" right — one column below 901px); `pp-orders`, newest first; `pp-pdnew` ("Nabestelling maken"); and `pp-pdfiles` last — the `info` alert for files in no order and the "Bestanden" card, which is one wrapper and moves as one. The owner's reorder is built and is confirmed; what 2.3 adds is writing it down as one order instead of two, so nothing has to be kept in step. The flex `order` overrides on `.pp-main>.pp-pdfiles` and `.pp-main>.pp-pdnew` now agree with the DOM order and are redundant; they stay in `bundle.css` so an older build does not reflow, and they will go in 3.0.

**The system rule behind it, so the next screen does not have to ask:** *a card that something important follows is capped; the last card on a page is as long as its content.* A long list costs nothing when nothing is behind it.

**Rejected, all three, and each for its own reason:**

- **A collapsible "Bestanden".** A disclosure buys back scroll on the page's own subject — the files are what a print *is* here — and charges a click for it on every visit. Nothing is behind the list to protect any more, which is exactly when a disclosure has nothing to earn. (The implementer argued this; I agree with it, and it is now a decision rather than an argument.)
- **Folding the list into "Deze print".** That card is deliberately facts without controls: Klant, Project, Datum, Materiaal, Tijd, Gewicht, Bestellingen. The file list is downloads, per-file spools, counts and an order badge per row. Putting them together makes one card with two jobs and destroys the only place on the page you can read without worrying what you might change.
- **Capping the list's height with its own scroll.** Proposed by me in another form and not built, correctly. Files per print: median **5**, 17 prints over ten, largest **48** — so the cap would do nothing for most prints and, where it fired, would trap a scroll inside a card, hide rows from the browser's own find, and cut the list off at a height nobody asked for. Last on the page, it may be 48 rows long.

Nothing else on the screen changes. The "Deze print" card gains the one line the spool control owes it (`spool.wholePrint.applies`, GAP-115).

**2.11.** (2026-10-17) **Bron and Notitie on the print (GAP-152).** The card **"Deze print"** gains
the two fields that say where a print came from and what still has to be made. Both belong to the
print as a whole — not to an order — which is why they sit here and not in an OrderSection.

- **Bron** is a `pp-kv tight` row (`dt` "Bron") whose `dd` holds `div.pp-srcs`: one `span.pp-src`
  per link, each with the `external-link` glyph, the host as `a.pp-link`, and `span.pp-hintchip`
  "uit de map" on the entries the indexer read out of a `.url` file in the folder. Typed and found
  sit side by side with no precedence; the typed one comes first and is the only editable one. Full
  spec: **PrintSource**.
- **Notitie** is `div.pp-note` at the foot of the card, under the facts and under the spool
  control, with the line "Alleen voor jou. Niet zichtbaar op de deel-link." Full spec:
  **PrintNote**.

**This makes "Deze print" the card of the print's own things, not a card of facts only.** 2.3
rejected folding the file list into it on the ground that it is "facts without controls", which was
already not quite true — the SpoolPicker trigger has been in it since 1.5. The honest rule is the
one 2.0 wrote: *what belongs to the print is shown once, at print level.* A bron and a note are
exactly that, and both are one field each, read far more often than written. What 2.3 refused is
still refused: the file list, with its downloads, counts and order badges, stays its own card.

**Empty and read-only.** No bron: no "Bron" row, and a ghost button "Bron toevoegen" for an Admin
or Editor. No note: no empty frame, and "Notitie toevoegen" for the same roles. **Role User** sees
the bron (the klant sees it too, on the share page) and **never** the note — the 1.1 rule "User
never sees cost or notes" has its first literal field. On an archived print both still show: they
are records, not files, and nothing about them needs the disk.

**Phone.** Both are full width inside the card, which keeps its place in the one page order
(header, `pp-pdtop`, orders, "Nabestelling maken", files). Neither field moves the price field,
which the 1.9 and 2.0 measurements are still waiting on.

**2.14.** (2026-10-18) **The reduced "Deze print" card, drawn at last (GAP-158, the owner's decision; and it is now load-bearing).** 2.0 wrote one clause for role User — *"the media row's right-hand card holds only Klant, Project and Datum"* — and 2.11 added that a User sees the **bron** and never the note. The app built the card from those two sentences and marked it `ds-gap`. GAP-165 makes that card the main screen of every klant who opens a deel-link, so it gets an anatomy instead of a clause.

**The card, role User and share session.** `section.pp-card.pp-sec` with `<h2>` "Deze print" and one `dl.pp-kv.tight`, in this order:

| row | shown |
|---|---|
| **Klant** | always |
| **Project** | only when it differs from the print name, case and spaces ignored (GAP-072) |
| **Datum** | always |
| **Materiaal** | when the record has one (2.16, GAP-174) |
| **Gewicht** | when the record has one (2.16, GAP-174) |
| **Bron** | only when the print has one: `div.pp-srcs` with PrintSource's entries, read-only, **no chip** and no folder name — the klant has no use for the library's shape, which is the share page's rule since 2.11 |

**And nothing else.** No Tijd and no Bestellingen (2.16 added Materiaal and Gewicht, GAP-174; this sentence named them because they were still a proposal); **no SpoolPicker trigger and no spool row at all** — the spool is a cost input, nothing here can override it, and a spool's name is the owner's stock, which changes under a print that is finished; **no `pp-note`** (the 1.1 rule, literal since 2.11); **no missing-files line and no `pp-lacks` chip** — "Ontbreekt: 3MF" is a fact about the owner's folder and reads to a klant as if something is wrong with their print.

**A card of two or three rows is still a card, not a frame.** The shortest honest case — a print whose project equals its name, with no bron — is Klant and Datum. That is two facts beside a viewer, and it is what the page has to say; padding it out with the cost inputs would be inventing content for a layout.

**The rest of the page for role User and for a visitor.** Header with the breadcrumb (klant, and the project when it differs), the name as `<h1>`, the payment badge — **no tags, no `pp-lacks`, no "⋯" menu**. Then `pp-pdtop`: the viewer with the media strip (models **and the timelapse** since 2.16, GAP-175) and this card. Then the payment as a **state**: a `pp-card pp-pay` with `<h3>` "Betaling", the status badge and the amount, and nothing else — no fields, no history, no write-off, and **no payment instruction** (paying per print does not exist in this system; the Overzicht is where the amount is the total). **No `pp-pdfiles`** at all, as 2.0 already said. A print with several orders shows one badge and the summed price, as 1.4 specified for this role.

**Both themes, phone and desktop.** `pp-pdtop` is one column below 901px with the viewer first, exactly as for an operator; no new class and no new colour pair.

**Proposed, needs the owner's confirmation (do not build).** *(Answered: he said yes. See 2.16 — the two rows are in the card and this paragraph is superseded.)* **Materiaal** and **Gewicht** as two more `pp-kv` rows, and the same two facts as the card's meta line in a visitor's print card. The invoice already prints Gram, so this is defensible — and it is a decision about what a klant reads, which is his. **Tijd stays out either way**: machine time is the one input on that list a klant cannot check and the one that only means something next to a cost.

**2.15.** (2026-10-18) **Three decisions about this page, one of them a contradiction of my own making.**

**No tags for role User either (GAP-166, resolved).** 2.14's section above says "no tags" for role
User *and* a visitor; ScreenShareSession 2.14 published the same question as a proposal and named
1.4 as standing, so the export said two things at once and the app built only the half they agreed
on. **The strict half wins: role User and a visitor see no tags, anywhere** — not in this header,
not on a print card, not as a filter. The fact that settles it is the owner's own answer to GAP-129:
**he does not use tags at all.** A tag is his filing word for his own reasons, the tag system stays
in the app because he has not asked for it to go, and nothing in it is addressed to a klant. So the
clause in *Orders (1.4)* — "name, price, status, thumbnail, 3D model **and tags** only" — is
**superseded**, and role User's print page is now exactly the visitor's. That is the point: one
reduced form, not two that drift.

**The payment is a line in the header, and its card is gone for this role (GAP-170, resolved).**
Measured by the app on a visitor's print at 390×844: the viewer ends at 506, the media strip at 686,
"Deze print" at 853 (9px past the fold) and the **whole** `pp-card pp-pay` card sits at 873–971,
with its badge 89px below the fold — while the status is *already* on screen at y=201, in the header
badge row. A card that repeats a visible fact and adds one number is not worth 98px below the fold.

So for **role User and a visitor**, the header badge row carries both: the status badge and the
amount, as `<div class="pp-ph"><h1>…</h1><span class="pp-row pp-gap-2"><span class="pp-badge
unpaid">…Open</span><span class="pp-money pp-text-xl">€ 24,50</span></span></div>` — the badge and
the amount wrapped together so they stay one pair when `.pp-ph` wraps at 360px. **`pp-pay` is not
rendered for this role at all:** no `<h3>` "Betaling", no second badge, no amount twice. Nothing
else moves, so a visitor's print page is now header, `pp-pdtop` (viewer and media strip, the reduced
card), and nothing after it — which also means "Deze print" is the last card on the page and 2.3's
rule applies to it: *the last card on a page is as long as its content.*

**The operator keeps PaymentPanel exactly as it is.** This is a reduction of a role's page, not a
change to the payment panel: an order's Betaling section, its fields, history and write-off are
untouched. And the pairing itself is not new to the klant — the Overzicht's own lines have shown
`€ 24,50` beside a status badge (`pp-share-amt`) since 1.0, so the print page now says it the same
way the screen they landed on says it.

**The operator's "Deze print" stops repeating the print's name (GAP-176, resolved).** The app
measured what GAP-158 implied and did not say: `squashName(project) !== squashName(name)` is **false
for 84 of 84 prints** in the owner's library, so the reduced card was right to hide the row — and the
**operator's** card still draws Project unconditionally, repeating the `<h1>` 84 times out of 84. The
same comparison applies here: **Project is a row only when it differs from the print name, case and
spaces ignored (GAP-072), for every role.** GAP-095 specified this card before GAP-072 existed; it is
one condition, not a per-role rule, and a fact that is identical to the heading above it is not a
fact. The breadcrumb's own rule is unchanged (it has had this comparison since 1.9).

**Both themes, phone and desktop.** No new class, no new token, no new colour pair: `.pp-ph`,
`.pp-row`, `.pp-gap-2`, `.pp-badge`, `.pp-money` and `.pp-text-xl` all exist, and `text-strong` on
`bg` is in the report. **No copy key changes** — `pay.title` stays for the operator's panel.

**2.16.** (2026-10-20) **Three answers from the owner and one new row: what a klant reads, and where a print lives on disk.**

**Materiaal and Gewicht are in the reduced card (GAP-174, resolved — the owner's answer, and his reason is better than mine).** He said *"materiaal en gewicht is handig voor een gebruiker, dan hebben ze meer detail waarvoor ze moeten betalen"*. 2.14's proposal is built: the `dl.pp-kv.tight` of the reduced card is now **Klant, Project (only when it differs from the name), Datum, Materiaal, Gewicht, Bron (when there is one)**, in that order — the two new rows sit after Datum, so the card still opens with who and when. The shortest honest case is no longer two rows but four, which does not change the rule that a short card is a card.

- **Tijd stays out**, as 2.14 reasoned: machine time is the one input on that list a klant cannot check and it only means something next to a cost.
- **Bestellingen stays out** too, and for a sharper reason than "it was not proposed": the count is the owner's bookkeeping. A klant reads one print and one amount, which is what GAP-170 put in the header.
- **No new row for a missing value.** No material and no grams on the record: no row, as for Project and Bron. A klant is never shown "—".
- **No new token, class or copy key**: `Materiaal` and `Gewicht` are the operator card's own labels and have been in the deck since 1.0.

**The timelapse is in the media strip for every role (GAP-175, resolved — the owner's answer, and it cost a route).** *"klant mag timelapse zien."* The visitor's and role User's `pp-pdtop` now holds the same strip the operator has: **the models and the timelapse**, one control, ModelPicker's own anatomy. The group label follows ModelPicker's rule ("Modellen en timelapse", "Timelapse" for a video-only print).

- **Where the strip's entries come from changes, and this is the sentence that matters.** For an operator the strip was read off the file list; a visitor has no file list at all (2.0: no `pp-pdfiles` for this role), so the timelapse is **a field of the print** in the payload beside the models, for every role. The strip no longer depends on a card that this role does not get.
- **Playing is not downloading.** The player streams the file for viewing, with ranges so seeking works, and the print page of this role contains **no download link anywhere** — the owner's rule for a deel-link is viewer yes, downloads no, and the player must not be the hole in it. (The app found this the hard way: the only route that served the bytes was the download route, so it built a view-only one. The design's part is the rule; the route is theirs.)
- **The threshold is still a threshold.** A visitor who can watch a video can save its bytes from the network tab, exactly as §1 of ScreenShareSession says of the model. Nothing in the copy claims otherwise.
- **An archived print has no files on disk, so it has no strip** — unchanged, and it is now one rule for models and the timelapse together.

**Where the print lives on disk is back, as a path (GAP-182, resolved — the owner asked for it after GAP-176 took the last mention away).** GAP-176 removed a row labelled *Project* whose value was the `<h1>` again on 84 of 84 prints. It stays removed and it stays right. What he wants back is a different fact — *which folder is this?* — and a different shape.

- **The operator's "Deze print" gains a row `Map`**, the **last** row of the `dl.pp-kv.tight` (after Bestellingen, before the spool control): one value, `<dd><span class="pp-path">Koen<span class="sep"> / </span>Bloembak clips</span></dd>` — the klant folder, a `muted` separator and the project folder, in mono. **New class `.pp-path`**, new key `print.folder` ("Map").
- **One path, not two facts.** It is an address: he reads it to find the folder, and two labelled rows would make him reassemble it. It is text, selectable, **no copy button and no link** — the card is facts, and the portal has never pretended it can open his file manager.
- **It is drawn on every print that has a folder, including the 84 of 84 whose tail equals the print name.** This is the whole question GAP-176 turned on, and the answer is different here because the value is different. The row GAP-176 removed repeated the heading under a label that promised another fact; this row carries the klant level and the **literal spelling** of both folders, which is what you need on disk — the comparison that hides Project is a *squashed* one (case, spaces and punctuation ignored, GAP-072), so `Bloembak clips` and a folder called `bloembak_clips` squash equal and read differently. A row that is only there on some prints is also a row you have to look for; this one is always in the same place.
- **So the `Map` row replaces the conditional `Project` row on the operator's card.** Two rows about where a print lives is the fault GAP-176 was about, and the path carries the project name whenever there is one. **GAP-176's rule is unchanged where it still applies:** the reduced card (role User and a visitor) keeps its conditional **Project** row, and the breadcrumb keeps the comparison it has had since 1.9.
- **No project folder:** the value is the klant folder alone (`Koen`) — the print's files sit directly in the klant's folder and the path says so. **No folder at all** (a request typed in AanvraagDialog, which creates nothing on disk): the row reads `print.folder.none` **"Nog geen map"** in `muted`, not in mono — it is a sentence, not a path.
- **An archived or deleted print keeps the row.** The path is a record of where the print was filed, like Bron and Notitie (2.11); it does not need the disk to be true.
- **Role User and a visitor never see it.** The library's shape is the workshop's, which is why the reduced card already refuses the folder name in Bron (2.14) and why a klant's empty state talks about prints and not about folders (ScreenShareSession §5). This is the operator's fact.
- **Phone.** `.pp-kv.tight` is `1fr auto`; `.pp-path` carries `overflow-wrap: anywhere`, so at 360px a long path wraps inside its own column instead of widening the card. `Koen / Bloembak clips` is one line at that width; `Koen / Nog te ontwerpen kastje voor de meterkast` is two.
- **No new colour pair:** `text-strong` and `muted` on `surface` are both in `contrast.md`.

**Dutch copy (new).** Map | Nog geen map

**Both themes, phone and desktop.** One new class (`.pp-path`), two new keys, no new token and no new colour pair.
