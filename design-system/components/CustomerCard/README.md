CustomerCard summarises one klant on the dashboard (desktop and tablet): name, number of prints, what is still open and the invoice shortcut. Admins and Editors can delete the whole klant.

**Anatomy.** `div.pp-card.pp-cust` in `.pp-custs` (auto-fill grid): `.hd` with the name and `.end` (`.cnt` "{n} prints" plus a ghost icon button "Klant verwijderen"), then either `.amt` (open amount and "openstaand") or `.cnt` "Alles betaald" (or a "Niet factureren" badge), then `.acts` with "Factuur". Clicking the card filters the dashboard to this klant. **Deleted** (`.is-deleted`, only for Admins with "Toon verwijderde"): dimmed, a Verwijderd badge and a secondary "Herstellen" button. Deleting asks the ConfirmDialog "Klant verwijderen?" (danger) and hides all prints of the klant; restoring brings them back. The card is shown with `pp-only-wide`; phones use CustomerChips.

**Tokens.** `surface`, `border`, `radius-lg`, `space-*`, `muted`, `text-sm`, Badge and Button tokens.

**States.** Default, hover, selected (filter active: `.pp-cust.is-selected`, or any card that contains a name button with `aria-pressed="true"`; `primary` border and `primary-tint-soft` ground), deleted, no billing, all paid.

**Accessibility.** The delete button has `aria-label="Klant verwijderen"`; the card name is a button that sets the filter; deleted cards stay readable (45% opacity only dims decoration, text keeps contrast).

**Dutch copy.** Klant verwijderen | Herstellen | Alles betaald | openstaand | Factuur | {n, plural, one {# print} other {# prints}}

**1.5.** The name is a real button (`pp-cust-name`, `aria-pressed`) that sets the filter; the "Factuur" button stays `pp-only-wide` because phones get the same action in the CustomerChips toolbar.

**1.9.** (2026-10-07) **The whole tile is the control (GAP-070, confirmed) and delete moves into a menu (GAP-075, resolved).** The klant's name button (`pp-cust-name`, `aria-pressed` = this klant is the active filter) is stretched over the whole tile with a `::after` (inset 0), so the amount and the white space filter too; the name stays a real `<button>`, one tab stop, with a name that reads "Joey, 12 prints". States: **rest** (as before), **hover** (`border-strong` border, pointer cursor), **focus-visible** (the 2px `focus-ring` outline is drawn around the *tile*), **pressed / selected** (`primary` border and `primary-tint-soft`, the existing `.is-selected` look). The tile's own controls (Factuur, the "⋯" menu) sit above the hit area (`z-index:1`) so they never filter. **Delete** is no longer an icon beside the name: the tile's `.end` group holds the print count and the OverflowMenu ("Factuur maken", divider, "Klant verwijderen" in `unpaid`); ConfirmDialog stays; ten delete icons are gone from the fold. A deleted klant (Admin, "Toon verwijderde") keeps its dashed look and the menu holds "Herstellen". Dutch copy (new): Meer acties | Factuur maken.
