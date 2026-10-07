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

