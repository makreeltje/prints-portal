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
- Show cost only ("Kosten") for klanten that are niet factureren; never a price, payment or invoice.
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
