PaymentPanel sets the Verkoopprijs and records payment, partial payment and write-off for one print.

**Anatomy.** Card titled "Betaling". **Open:** NumberInput "Verkoopprijs" (`€` prefix) with the "voorgesteld" hint until saved, the buttons "Voorstel uit marge (400%)" and Opslaan, then "Betaald bedrag" (defaults to the remaining amount) and the primary "Markeer als betaald". An amount below the remaining amount registers a partial payment. **Deels betaald:** badge, total price, "Betaald € 5,00 van € 11,89", the `pp-remaining` line "Nog € 6,89 open", a short payment history (date, amount), then the amount field and the actions Markeer als betaald and Afschrijven (the write-off covers the remainder). **Betaald:** badge, amount, "Betaald op {datum}", history; Admins also get the ghost button "Betaling ongedaan maken" (ConfirmDialog). **Afgeschreven:** badge, and a definition list with Betaald, Afgeschreven, Datum, Door and Reden; Admins get "Afschrijving ongedaan maken" (ConfirmDialog). A write-off after a partial payment keeps both amounts visible. **Niet factureren:** the whole panel is replaced by the info note "Deze klant wordt niet gefactureerd." and the cost ("Kosten"). **Rol User:** ~~read-only badge and customer price, no inputs, no history~~ — **withdrawn in 2.16 (GAP-179): this panel is not rendered for role User or a visitor at all.** **Vergrendeld:** when the print is on a final invoice the badge "Op factuur {nummer}" shows, the price field is disabled with the help text, and payment stays possible. **Kosten ontbreken:** the suggestion button is disabled with a tooltip.

**Tokens.** `surface`, `border`, `heading-lg`, `paid`, `unpaid`, `info`, `warning`, `*-tint`, button and input tokens.

**States.** Open with suggestion, open with saved price, saving, partial, paid, written off, niet factureren, locked, missing cost, error (inline alert, values kept). *(The "user (read-only)" state is gone: 2.16, GAP-179.)*

**Accessibility.** Each input has a label; the suggestion result and the remaining amount are announced with `aria-live="polite"`; undo and write-off always open a ConfirmDialog; admin-only actions are not rendered for other roles.

**Dutch copy.** Betaling | Verkoopprijs | Voorstel uit marge ({markup}%) | Opslaan | Betaald bedrag | Markeer als betaald | Betaald € {bedrag} van € {totaal} | Nog {bedrag} open | Betaald op {datum} | Betaling ongedaan maken | Afschrijven | Afschrijving ongedaan maken | Reden | Deze klant wordt niet gefactureerd. | Kosten | Staat op een definitieve factuur en kan niet meer worden gewijzigd.

**Rules (1.4).** A payment can be at most the open remainder of the order; a higher amount is refused with the field error "Een betaling kan niet hoger zijn dan het openstaande bedrag ({bedrag})." and the button stays `aria-disabled`. "Betaling ongedaan maken" (Admin only) reverses the **most recent** payment of this order and says which one ("Maakt de laatste betaling ({bedrag}) ongedaan."). Undone payments stay in the history, struck through, with a line "Ongedaan gemaakt door {naam} op {datum}." Inside an order (see OrderSection) the panel belongs to that order and every amount is that order's.

**Inline values (1.4).** The panel no longer needs inline styles: sizes and layout come from `pp-pay`, `pp-kv narrow`, `pp-between`, `pp-text-xl`, `pp-text-sm`, `pp-self-start` and `pp-plain`.

**Locked by an invoice (1.5).** Finalising an invoice fixes the price: a "Voorstel uit marge" becomes the order's Verkoopprijs, and from then on the price, cost adjustments and "Aantal keer geprint" are locked ("Op factuur {nummer}"); payments and write-offs still work. A credit note (Admin) writes off the credited amount only up to what is still open; what was paid stays paid, because refunds are not tracked. The payment reference for a final invoice is its number; a Concept and a Herinnering use the klant name.

**Text classes (1.5).** `pp-text-lg`, `pp-text-xl`, `pp-text-2xl` and `pp-text-3xl` exist in `bundle.css` (font size and line height from the matching tokens), so the amount renders at `text-xl` / `leading-xl`.

**1.6.** (2026-10-07) **Locked state covers the whole order (GAP-048).** Besides the disabled price field, the lock also applies to "Aanpassen" (CostBreakdown), "Aantal keer geprint", "Telt niet mee in kosten" and the spool pickers (AssetListItem). The reason is one visible help line, linked with `aria-describedby`; it is never a tooltip alone.

**1.9.** (2026-10-07) **One warning for missing costs (GAP-073, resolved).** The sentence "Kosten ontbreken. Het voorstel uit marge is niet beschikbaar." in this panel is the **official** one: it states the consequence (no suggestion) and the "Voorstel uit marge" button stays disabled. The cost card above it shows only "Onvolledig" and names the missing input (see CostBreakdown), so the same condition is not reported twice in the same words. In the single-column order (phone, tablet) the two sit apart by the files section and no longer stack.

**2.14.** (2026-10-18) *(Superseded by 2.16, GAP-179: role User and a visitor get no panel at all. Kept because the distinction it drew — what may be said to a klant — is still the rule.)* **The User state has two forms, and the preview was saying something the deck does not carry (GAP-158, GAP-165).**

- **Role User with an account:** badge, customer price, and the line `pay.userNote` **"Je ziet alleen prijs en status."** — addressed to someone who logged in and might expect to edit.
- **A visitor in a share session:** badge and customer price, **no note line**. "Je ziet alleen prijs en status" tells a klant that something is being withheld from them, which is both true and none of their business; the share page has never said it, and a session is not the place to start.

Neither form has fields, history, "Markeer als betaald", "Afschrijven" or an undo, and neither carries a payment instruction: the IBAN, the amount and the reference live in the "Betalen" block on the Overzicht, where the amount is the total (ScreenSharePage).

**And a correction to this component's own preview.** Its *Rol User* card read **"Dit is een overzicht; wijzigen kan een editor."** — a sentence in no deck row, which is exactly the fault 2.12 wrote a rule about and 2.13 caught in ScreenSettings. The card now shows `pay.userNote`, the string the deck has carried since 1.4. No copy key is added or changed.

**2.16.** (2026-10-20) **The *Rol User* state is struck, not edited (GAP-179, resolved).**

2.15 took the whole payment card off a visitor's print page (**GAP-170**): for role User and a visitor the status badge and the amount are **one line in the header badge row**, and `pp-card pp-pay` is not rendered. This README was still describing a User form of this panel in three places — the anatomy, the states list and the 2.14 section — so the export carried a component state that no screen may draw. **All three are marked in place**; nothing is rewritten, because the reasoning in 2.14 about what may be said to a klant is still the rule that keeps the header line wordless.

**`pay.userNote` is retired (and that is the word: retired, not removed).** "Je ziet alleen prijs en status." was the User form's only line and the User form was its only caller, so after GAP-170 the key renders nowhere. It **stays in `copy-deck.md`** under *Retired*, with its string intact, so nothing breaks in an app that still ships it and nobody re-invents the sentence under a new name; **the app should stop rendering it**. If a read-only payment form ever comes back for an account holder, this key is the one it uses.

**What is unchanged:** everything an operator sees. Open, saving, partial, paid, written off, niet factureren, locked and missing-cost are exactly as 1.9 through 2.14 specify them, and so is every rule about amounts, undo and write-off. This gap is a deletion of a role's state, not a change to a panel.

**The preview** loses its two reduced cards and gains the thing that replaced them: the header row with the badge and the amount, labelled as what a klant and a role User actually get. **No token, class or key is removed.**
