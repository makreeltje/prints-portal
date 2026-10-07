CustomerChips replaces the customer cards on phones: one horizontally scrolling row of filter chips, followed by a toolbar for the selected klant.

**Anatomy.** `div.pp-chips[role=group][aria-label="Klanten"]` with `button.pp-chip[aria-pressed]` per klant (name plus `.n` print count); "Alle klanten" first. Exactly one chip is pressed. Below it `.pp-toolbar`: the print count and, for Admin and Editor and only while one klant is selected, the ghost button "Klant verwijderen". Chips are 44px high; the row scrolls without a visible scrollbar and the page itself never scrolls sideways.

**Tokens.** `surface`, `surface-2`, `primary-tint`, `border`, `primary`, `radius-pill`, `space-*`, `focus-ring`.

**States.** Default, pressed, hover, focus-visible, overflowing row.

**Accessibility.** Native buttons with `aria-pressed`; the group is labelled "Klanten"; focus ring is 2px `focus-ring`.

**Dutch copy.** Alle klanten | Klant verwijderen | {n, plural, one {# print} other {# prints}}

**Deleted klant (1.4).** With "Toon verwijderde" an Admin also gets the deleted klanten as chips (`.pp-chip.is-deleted`: `muted` text, dashed border). While a deleted klant is selected the toolbar shows the Verwijderd badge and the secondary button "Herstellen" instead of "Klant verwijderen"; restoring brings the klant and its prints back. Editors never see deleted klanten.

**Factuur on phones (1.5).** While one klant is selected the toolbar shows the secondary "Factuur" button (receipt icon, `pp-btn-secondary pp-btn-sm`) next to "Klant verwijderen"; it opens the invoice export dialog as a sheet (see ScreenInvoiceExport). It is hidden for klanten that are niet factureren and for the role User; with "Alle klanten" selected there is no Factuur button because an invoice is made for one klant.
