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
