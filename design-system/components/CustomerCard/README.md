CustomerCard summarises one klant on the dashboard (desktop and tablet): name, number of prints, what is still open and the invoice shortcut. Admins and Editors can delete the whole klant.

**Anatomy.** `div.pp-card.pp-cust` in `.pp-custs` (auto-fill grid): `.hd` with the name and `.end` (`.cnt` "{n} prints" plus a ghost icon button "Klant verwijderen"), then either `.amt` (open amount and "openstaand") or `.cnt` "Alles betaald" (or a "Niet factureren" badge), then `.acts` with "Factuur". Clicking the card filters the dashboard to this klant. **Deleted** (`.is-deleted`, only for Admins with "Toon verwijderde"): dimmed, a Verwijderd badge and a secondary "Herstellen" button. Deleting asks the ConfirmDialog "Klant verwijderen?" (danger) and hides all prints of the klant; restoring brings them back. The card is shown with `pp-only-wide`; phones use CustomerChips.

**Tokens.** `surface`, `border`, `radius-lg`, `space-*`, `muted`, `text-sm`, Badge and Button tokens.

**States.** Default, hover, selected (filter active: `.pp-cust.is-selected`, or any card that contains a name button with `aria-pressed="true"`; `primary` border and `primary-tint-soft` ground), deleted, no billing, all paid.

**Accessibility.** The delete button has `aria-label="Klant verwijderen"`; the card name is a button that sets the filter; deleted cards stay readable (45% opacity only dims decoration, text keeps contrast).

**Dutch copy.** Klant verwijderen | Herstellen | Alles betaald | openstaand | Factuur | {n, plural, one {# print} other {# prints}}
