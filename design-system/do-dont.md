# Do and don't

**Do**
- Show status before anything else; pair every status colour with an icon and a word.
- Set money and weights with tabular figures, right-aligned, with units and the Dutch format (`€ 11,89`, `87 g`, `1 u 20 min`).
- Keep chrome neutral (`bg`, `surface`, `surface-2`); let spool colours carry the colour.
- Use `border-strong` for anything that identifies a control, `border` only for decoration.
- Name the object in every destructive confirmation and say what is kept.
- Disable an action while its request runs, show a spinner in the button, and roll back with an error toast on failure.
- Keep the Dutch vocabulary from the README; add new terms to `copy-deck.md`.
- Test every new screen at 360px, 900px and 1440px in both themes, by keyboard.

**Do (added in 1.1)**
- Show a partial payment as Deels betaald with the remaining amount; Afschrijven only covers the remainder.
- Show cost only ("Kosten") for klanten that are niet factureren; never a price, payment or invoice. Their Deel-link lists prints only.
- Give every document a plain-text status word so it survives black-and-white printing.
- Hide controls a role cannot use instead of disabling them (User never sees cost or notes).

**Don't**
- Don't use `paid` and `unpaid` as the only difference between two things.
- Don't put text on a tag or spool colour without choosing `#141a33` or `#ffffff` by contrast.
- Don't show internal cost, margins or markup on the share page or the invoice.
- Don't scroll the page horizontally; scroll wide tables inside their own container.
- Don't remove focus outlines or shrink touch targets under 44px on phones.
- Don't add decoration, gradients or illustrations to the operator UI; the filament is the decoration.
- Don't use red or green text alone to signal money going up or down.
- Don't move scroll position or focus when a live update arrives; flash the changed item instead.
- Don't add VAT, BTW or KvK anywhere in the UI or documents.
- Don't number a Concept invoice or a Herinnering, and don't show internal cost on an Overzicht.

**Do (added in 1.2)**
- Write line heights with the `leading-*` tokens and page structure with the shell classes; never type a raw pixel value in the app.
- Give icon-only items (rail, icon buttons) an accessible name and a tooltip that also shows on keyboard focus.
- Show "Verloopt niet" for links without expiry and leave the expiry notice off the share page.
- Disable and check every Admin and Editor row in Toegang; only User rows have grants.

**Don't (added in 1.2)**
- Don't set a `.phone` class in the app; use the media queries.
- Don't show amounts, payment status or PDF buttons on the share page of a niet-factureren klant.
- Don't leave a temporary password in place: force "Nieuw wachtwoord kiezen" at the first sign-in.

## Added in 1.3

- **Do** dim deleted (45%) and archived (60%) prints only through `.is-deleted` and `.is-archived` on `.pp-thumb`, `.pp-card` and `.pp-row`; the text keeps its contrast. **Don't** set `opacity` on a whole card or row.
- **Do** use `pp-chips` with `aria-pressed` on phones and customer cards (`pp-only-wide`) elsewhere. **Don't** show both at once.
- **Do** confirm deleting a klant or a tag with the destructive ConfirmDialog and name the number of prints. **Don't** delete without it.
- **Do** pick tag colours from the ten `tag-*` tokens through `data-c` (or "Geen kleur"). **Don't** invent hexes; `--tag` and `--tag-ink` inline are data for legacy colours only.
- **Do** show an existing tag when a typed name matches in another case. **Don't** offer "Tag maken" for it.
- **Do** keep layout in `bundle.css` classes. **Don't** put `style=""` with layout values in app screens; only `--c1`, `--tag` and `--tag-ink` are allowed as data.
- **Do** hide the Tags page from the User role; Users see tags read-only on the print.

## Added in 1.4

- **Do** open popovers inside `.pp-anchor`; they float at `z-popover`. **Don't** write a `z-index` in the app; use the tokens `z-raised`, `z-sticky`, `z-popover`, `z-tooltip`, `z-overlay` through the classes.
- **Do** show one OrderSection per order, newest first, settled ones closed. **Don't** add a price, payment or write-off outside an order.
- **Do** put new files that are in no order under "Niet in een bestelling". **Don't** count them in any price or cost.
- **Do** refuse a payment above the open remainder and keep undone payments in the history. **Don't** delete history lines.
- **Do** report every bulk action per print (toast plus list of reasons). **Don't** stop the whole action because one print fails.
- **Do** use the width, gap and weight helpers (`pp-w-*`, `pp-gap-*`, `pp-fw-*`). **Don't** copy `style` attributes from previews; only the data properties `--c1`, `--c2`, `--v`, `--tag` and `--tag-ink` are inline.

- **Do** open a calendar as `.pp-pop.pp-calpop` in a `.pp-anchor`; on phones it becomes a bottom sheet. **Don't** build a separate date widget.
- **Don't** let a dialog footer grow beyond 440px: let it wrap, primary action on its own row.

- **Do** explain a locked control with one visible `pp-help` line and `aria-describedby`. **Don't** put the reason in a tooltip only.
- **Don't** show € 0,00 totals when nothing has a price: leave the totals out.

- **Do** check the Ground column in `contrast.md` before using a translucent token: it is approved only over the grounds listed. **Don't** assume "passes on `surface`" holds on `surface-2`.
- **Do** map a third-party UI kit through CSS variables onto our tokens (`.pp-scalar`). **Don't** let a literal colour, font or radius of the kit survive.

- **Do** check the Ground column in `contrast.md` before using a translucent token: it is approved only over the grounds listed. **Don't** assume "passes on `surface`" holds on `surface-2`.
- **Do** map a third-party UI kit through CSS variables onto our tokens (`.pp-scalar`). **Don't** let a literal colour, font or radius of the kit survive.

- **Do** give a translucent chip an opaque `surface` base when it can sit inside a tinted row. **Don't** assume its ground is `surface`.
- **Do** make a region that a third-party renderer leaves scrollable a focusable, labelled region (`role="region"` on a generic element only). **Don't** put `role="region"` on a `ul`.

- **Do** let a list that grows have a cap: collapse groups, scroll a row, show "Toon alle {n}". **Don't** render every row of every group at once.
- **Do** keep the destructive action behind the "⋯" menu with a ConfirmDialog. **Don't** put a red button beside the heading or a delete icon on every tile.
- **Do** make a whole tile the control when its job is to filter (one `button`, the controls inside above it). **Don't** make only the name clickable.
- **Do** floor the thumbnail tint with `--mix` for dark filaments. **Don't** tint the customer-facing share page: it uses the neutral `surface-2` ground.
- **Do** name the missing input in a cost warning and link to the setting. **Don't** report the same condition twice in the same words.

**Do (added in 2.3)**
- Show the value a control would override, and name where it came from with a `pp-hintchip`; keep the empty placeholder for the case where nothing is in force.
- Place a floating panel from the window (`.at`) whenever anything above its trigger clips or scrolls, and reset the edges that form does not use.
- Let the last block on a page be as long as its content; cap a block only when something important follows it.
- Draw separation around a picture with a token (`.pp-art`), in the page, where it can read the theme.

**Don't (added in 2.3)**
- Don't bake a colour that depends on the theme into an image, and don't rewrite a picture you did not make.
- Don't put a window-placed panel inside a `.pp-anchor`; use `.pp-lift` when the thing you actually need is to sit above a stretched card or row link.
- Don't put a `transform`, `filter` or `backdrop-filter` on an ancestor of a trigger: it becomes the containing block of the fixed panel and clips it again.
- Don't give one page two orders of blocks, one for the phone and one for the desktop.
- Don't fetch the thing a picker picks between in order to label the picker.

## Added in 2.8

- **Do** name, in the README, the element a scoping class sits on and the descendants its rules require, whenever a class in `bundle.css` is written as a descendant selector (`.pp-allcust .pp-body`, `.pp-allcust .pp-custs`). **Don't** leave the host to be inferred from the preview: a scoping class on the wrong element does part of its job silently, with no error and no visual clue that the rest is missing (CustomerChips, GAP-130).
- **Do** give a status its own group in StatusBadge when it is not about money owed. **Don't** put a request lifecycle in the payment group, and never show a price nobody agreed to pay in `unpaid` ink (StatusBadge, GAP-126).
- **Do** show the date beside an **asserted** stage — one a person set, that nothing can re-check. **Don't** draw an undated stage board: observed facts refresh themselves, asserted ones go stale in silence (`README.md` rule 1).
- **Do** read a record with no files as a line of text. **Don't** draw it as a PrintCard or borrow the "no preview" thumbnail for it: that glyph means *this print has no picture*, not *this job has no files* (`README.md` rule 2).
- **Do** keep tags for properties — things a print **is**. **Don't** model a stage as a tag: the editor's checkboxes and the filter's AND make every invalid combination representable, which is the one thing a state machine is for (TagChip, GAP-121).
- **Do** label a figure with where it came from: the files, or something a person typed. **Don't** reason from an absence in a dataset before establishing what that dataset holds — "84 orders, all number 1" came from a database with nothing hand-entered in it and nearly retired a live feature (`README.md` rule 6, `changelog.md` 2.8).
- **Do** draw a direction between two files only from a fact that is observed or recorded. **Don't** read a version out of a file name and act on it — reordering, collapsing or marking one "current": the mark sits in the middle of a long name, which is the zone this system cannot read, and `v10` sorts before `v9` (`README.md` rule 5, AssetListItem, GAP-132/133).
- **Do** state a sweep's ceiling as well as its floors when a rule grows a value: two floors do not bound a sweep, and a stem grown to `W - 1 - HEAD_FLOOR` plus an extension is longer than its own window. **Don't** leave an implementer to derive the bound (`README.md` *Typography*, ModelPicker, GAP-135).
- **Do** say whether a figure is *as specified* or *as rendered*, and name the buckets a split actually has. **Don't** quote a count from a re-implementation of a rule as though the build produced it, and don't derive one bucket by subtracting another — `55 - 36 = 19` hid a third bucket and the measured answer was 16 (`README.md` rule 6, GAP-136).

## Added in 2.9

- **Do** treat a location another system owns as read-only in principle. **Don't** offer a control, empty state or help line that promises to put a file where the operator will look for it: `/prints` is Nextcloud-synced, and a folder written behind Nextcloud's back reaches no device at all (`README.md` rule 7, GAP-128/137).
- **Do** make absence a **value** in a picker — "Geen spoel", "Geen kleur", "Geen status" as the last option — because a value must be able to go back: a klant can change their mind about one print (the owner's reason, and the load-bearing one). **Don't** add a separate clear or remove action: clearing is then a different kind of act from setting, the bulk report needs two shapes, and something destructive-looking is offered for an act that destroys nothing (BulkDialogs, GAP-138).
- **Do** name what a document leaves out, with its reason, on **the surface where the operator creates or reviews it**. **Don't** satisfy "excluded from the total" by silence — silence is the one state the operator cannot verify — and **don't** put those exclusions on the customer's copy: not the Concept PDF, the invoice, the Overzicht or the share page (ScreenInvoiceExport, GAP-139, narrowed by GAP-142).
- **Do** give each exclusion its own sentence and its own ink when the reasons differ: a missing input is a `warning` with something to do, a decision already taken is a `muted` `.pp-reason` line with nothing to do. **Don't** render two reasons through one sentence in one tone — a print quoted and refused was announced as having no sale price, in orange (ScreenInvoiceExport, GAP-140).
- **Do** give every counted sentence an ICU plural and cap any name list it embeds: five names, then "en {count} andere". **Don't** ship "1 prints … zijn weggelaten" or a sentence that can list eighty-three names in a 560px dialog (GAP-141).

## Added in 2.11

- **Do** write a phone rule twice: inside `@media (max-width:480px)` for the app and as
  `.pp-device.phone <selector>` for the preview frame. **Don't** trust a phone frame that has no
  twin — it is a 360px container at desktop viewport width, so the media query never fires and the
  frame shows the desktop layout (`README.md` *Responsive*, GAP-151).
- **Do** measure a row's widest cell against the narrowest screen before giving it `1fr auto`: a
  192px badge in a 326px row leaves a three-word name 90px and three lines. **Don't** fix it by
  shortening the words that carry the meaning — send the long cell to its own band instead
  (GAP-151).
- **Do** keep one key per row in `copy-deck.md`, carrying its current value, and record a change in
  prose. **Don't** re-list a changed key as a second row: the importer takes the first occurrence,
  so a duplicate silently ships the string a later round replaced (GAP-148).
- **Do** give a counted sentence a **zero** arm as well as a plural, and say the day where zero
  means today ("vandaag gevraagd", "sinds vandaag open"). **Don't** ship "0 dagen geleden gevraagd"
  for the state that is the most common one on the screen (GAP-150).
- **Do** let a typed value and an observed one stand side by side, each saying where it came from,
  when both are true: a typed bron never overwrites a `.url` in the folder, as a typed price never
  overwrites measured grams. **Don't** invent a precedence rule for something that was never a
  single value (GAP-152, PrintSource).
- **Do** read a job's kind from a second **observation** — a link exists, a note was written — and
  show the observation itself. **Don't** turn it into a state, a badge, a sort or a word like "nog
  te ontwerpen": a print without a bron is not a design job, and a note may say "in zwart printen"
  (GAP-152, `README.md` rule 6, and GAP-143, which refused this once already).
- **Do** say beside an internal field that it is internal, every time it is shown ("Alleen voor
  jou. Niet zichtbaar op de deel-link."). **Don't** leave "internal" to a role check nobody can
  see from the screen (GAP-152, PrintNote).

## Added in 2.12

- **Do** give a slot a type and keep to it: `.ttl` carries the name and what a group *is*, `.age`
  the age badge, `.amt` a **figure**. **Don't** put a sentence in a figure slot — an `auto` track
  sized by prose is shared with the row above it, so a 181px sentence left a two-word heading 109px
  and two lines on a phone, two rounds before anybody noticed (GAP-155, OutstandingGroup).
- **Do** measure a fix against the half of the bug nobody removed: holding back the badge that
  collided removed the overprint and **left** the squeeze, which is what chose between three
  proposals. **Don't** accept the first explanation that makes a symptom disappear (GAP-155).
- **Do** give a pill `justify-self: start` when it sits in a `1fr` column, and write the same
  declaration on every rule that places the same kind of thing. **Don't** let two rules about one
  kind of element disagree: `.pp-line > .pp-badge` had it and `.pp-ogrp > summary .age` did not, so
  124px of text painted inside a 223px tinted pill on one screen only (GAP-155).
- **Do** keep a size variant to text and padding. **Don't** let it carry a smaller touch target:
  `.pp-btn-sm` pinned `min-height: 32px` as a literal and so ignored the 44px floor this file has
  stated since 1.2, in nearly every row of the app, where no automated check can see it — WCAG
  2.2's target rule stops at 24px (GAP-156, Button).
- **Do** read a proposed `max()` before taking it: `max(32px, var(--pp-tap))` is **36px** on the
  desktop, because that is what the token is outside the phone query, and it would have abolished
  the small button everywhere. **Don't** express two states of a token as a maximum — put the rule
  where the token changes (GAP-156).
- **Do** let a row's actions wrap when they do not fit: two buttons needing 308px of a 294px band
  is the band's answer, not the buttons'. **Don't** set `pp-nowrap` on `.pp-line .acts` (GAP-156).
- **Do** give every string the app renders a key in `copy-deck.md`, the `aria-label`s included: a
  string the deck does not carry is a string nobody proofreads — 1.9 wrote a group's accessible
  name in prose, the app wrote it without plurals, and a screen reader said "1 prints, oudste 1
  dagen" (GAP-154, `outstanding.groupLabel`).
- **Do** let one element own a fact. **Don't** state the age in a badge *and* in the line beside it:
  two strings that must agree about one number, computed in two places, disagree the first time a
  threshold changes (GAP-154, `outstanding.groupMeta`).
- **Do** remove a key the app has measured dead rather than correct it — `share.expiresIn` was
  absent from `nl.ts` with zero call sites, and pluralizing it would have made the deck look better
  and the app no better. **Don't** delete one on a guess: the same round's guess about
  `outstanding.groupMeta` was wrong in the other direction (GAP-154).
- **Do** remember that a `.pp-device.phone` frame still inherits the **desktop** `--pp-tap` and
  `--pp-control-h` (36px), because `:root`'s media query cannot fire inside a container: a phone
  frame draws 36px controls where the app draws 44px. 2.12 twins only `.pp-btn-sm`, with a literal,
  because `min-height` cannot push a frame sideways. **Don't** twin the two tokens on the frame
  until the phone frames have been re-rendered and measured — it widens `.pp-btn-icon` and the
  palette buttons in every one of them (proposed for 2.13).

## Added in 2.13

- **Do** give the part of a layout whose size is the owner's **data** a row or a line of its own: a
  section that lists records takes `span-2`, a band of value controls takes a line under the name.
  **Don't** let it share a track with the part that has to be read — a 1580px Printers card beside a
  194px Algemeen left 1402px of nothing, and a 609px controls band clipped a file name to 240px for
  a single-line shape it never drew (GAP-101, GAP-111).
- **Do** make a layout rule impossible to break in the CSS when you can: a track of
  `max(320px, 50% - var(--space-2))` cannot produce a third column, at any width. **Don't** write
  "never three" in a README above an `auto-fit` that makes three from 992px up — prose does not
  bind, and the CSS wins every time (GAP-101).
- **Do** name every cell a grid places, the first one included: `.lead` beside `.body` and `.acts`.
  **Don't** leave one unnamed — the slot with no class was the slot no rule could place, and it was
  the one that drew a 20px icon 44px below its own file name (GAP-111).
- **Do** order a band so that **at most one control's width is data, and it is the last one**, with
  the icon buttons in an `.end` group pinned to the row's right edge. **Don't** right-align a band
  and expect rows to agree: only the right edge is fixed then, and in a library whose spool names
  happen to be the same length it looks correct until a customer's screenshot arrives (GAP-111).
- **Do** render a window-placed panel as a child of the **nearest open `<dialog>`, else `<body>`**,
  and manage its focus instead of relying on DOM order. **Don't** trust `z-index` inside a
  `.pp-lift` — it is a stacking context, so `z-popover` is compared only with its own siblings — and
  **don't** portal to the body from inside a modal: a `<dialog>` paints in the top layer, measured
  at 0 of 11 menus clear (GAP-146, Popover rule 9).
- **Do** let a `pp-hintchip` qualify the value it sits on: where it came from, or whether it is
  still current ("archief"). **Don't** give it something that needs doing — that is a `warning`
  badge with a reason line — or something that changes money, which is a value in a cell of its own;
  and never let the chip be the only carrier of the fact (GAP-161, SpoolPicker).
- **Do** give a count a zero arm that says the word, in the key that already owns the count:
  `customers.printCount` reads "Nog geen prints" at 0. **Don't** add a second key for the empty
  case — two strings that must agree about one number are two strings that will disagree (GAP-162).
- **Do** drop a control whose act has no object, and drop the menu with it when nothing is left: a
  klant with no prints is offered neither Factuur nor Klant verwijderen. **Don't** keep a
  destructive-looking item because "it deletes zero prints anyway" — here it would also disagree
  with the folder on disk, which is the record (GAP-162, `README.md` rule 7).
- **Do** put a label beside its control and the **explanation** in the section, once. **Don't**
  repeat a two-sentence help line under every row of a list: twelve copies of one sentence are not
  twelve facts, and they were 384px of a settings page (GAP-101).
- **Do** decide a dialog's backdrop click **by kind** — shows-only closes, a form does not, a
  ConfirmDialog never does — and do nothing visible when it is refused. **Don't** key it on state
  ("the form is still untouched"): a dialog that sometimes closes on a backdrop click teaches
  nothing (GAP-147, Dialog).
- **Do** key every string **this design system** invents, in the same round that invents it: 2.0.1
  specified four Betaallink strings in prose, put none in `copy-deck.md` and none in its preview,
  and the app built them from the README. **Don't** assume the rule from 2.12 is about the app
  (GAP-101, `copy-deck.md` *Added in 2.13*).

