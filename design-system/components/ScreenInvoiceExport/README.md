The invoice export dialog creates a Concept download or a final invoice for one klant; the share page has a reduced version.

**Anatomy.** **Editors:** dialog "Factuur maken voor {klant}": two DatePickers (Van, Tot en met), the checkbox "Alleen openstaand", a preview card with Regels, Totaal, Betaald and Openstaand (no VAT anywhere), and a `warning` alert that names the prints left out because they have no customer price. A full invoice includes paid prints; with "Alleen openstaand" only unpaid and partially paid lines appear (partial lines show the remainder in the document). Footer: Annuleren, secondary "Concept downloaden" (unnumbered PDF titled "Concept"), primary "Definitief maken" (opens the ConfirmDialog that names klant, number of prints and amount; creates the numbered invoice YYYY-NNN, stores PDF and snapshot and locks the lines). **Share-page visitors:** only the checkbox "Alleen openstaand" and the button "Download overzicht" (PDF "Overzicht", customer price only). **Phone:** full-height sheet, buttons stacked and full width with the primary first. The dialog is not available for klanten that are niet factureren.

**Tokens.** Dialog, DatePicker, Checkbox, Alert tokens; `surface-2` for the preview card.

**States.** Default, no lines (primary buttons disabled with the help "Geen regels in deze periode."), all prints without price, generating (spinner), error.

**Accessibility.** `role="dialog"`; the preview card is `aria-live="polite"` and updates as the filters change; excluded prints are listed as text.

**Dutch copy.** Factuur maken voor {klant} | Van | Tot en met | Alleen openstaand | Voorbeeld | Regels | Totaal | Betaald | Openstaand | {n} prints zonder verkoopprijs zijn weggelaten: {namen}. | Concept downloaden | Definitief maken | Overzicht downloaden | Download overzicht | Geen regels in deze periode.
