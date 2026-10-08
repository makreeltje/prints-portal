CustomerChips replaces the customer cards on phones: one horizontally scrolling row of filter chips, followed by a toolbar for the selected klant.

**Anatomy.** `div.pp-chips[role=group][aria-label="Klanten"]` with `button.pp-chip[aria-pressed]` per klant (`span.nm` name, `span.n` print count, `span.amt` open amount); "Alle klanten" first. Exactly one chip is pressed. Below it `.pp-toolbar`: the print count and, for Admin and Editor and only while one klant is selected, the ghost button "Klant verwijderen". Chips are 44px high; the row scrolls without a visible scrollbar and the page itself never scrolls sideways.

**Tokens.** `surface`, `surface-2`, `primary-tint`, `border`, `primary`, `radius-pill`, `space-*`, `focus-ring`.

**States.** Default, pressed, hover, focus-visible, overflowing row.

**Accessibility.** Native buttons with `aria-pressed`; the group is labelled "Klanten"; focus ring is 2px `focus-ring`.

**Dutch copy.** Alle klanten | Klant verwijderen | {n, plural, one {# print} other {# prints}}

**Deleted klant (1.4).** With "Toon verwijderde" an Admin also gets the deleted klanten as chips (`.pp-chip.is-deleted`: `muted` text, dashed border). While a deleted klant is selected the toolbar shows the Verwijderd badge and the secondary button "Herstellen" instead of "Klant verwijderen"; restoring brings the klant and its prints back. Editors never see deleted klanten.

**Factuur on phones (1.5).** While one klant is selected the toolbar shows the secondary "Factuur" button (receipt icon, `pp-btn-secondary pp-btn-sm`) next to "Klant verwijderen"; it opens the invoice export dialog as a sheet (see ScreenInvoiceExport). It is hidden for klanten that are niet factureren and for the role User; with "Alle klanten" selected there is no Factuur button because an invoice is made for one klant.

**1.9.** (2026-10-07) **The klant strip is one row on every width (GAP-067, resolved; your decision).** `pp-strip` holds the existing chip row (`pp-chips`, one line, scrolls sideways) and, at its end, the button **"Overzicht"** (grid icon, `aria-haspopup="dialog"`, accessible name "Klantenoverzicht ({n} klanten)"). Height about 56px at any number of klanten (was about 350px at 10). A chip is: name, print count, and the open amount when there is one (`.amt`, regular weight); "Alle klanten" is the first chip and clears the filter. When the row overflows the app sets `is-overflow`, which fades the last 48px (`mask-image`) so the row visibly continues; the selected chip is scrolled into view (`scrollIntoView({inline:"nearest"})`) after a choice made in the overview. **Overzicht** opens a Dialog `pp-allcust` (max 920px, a bottom sheet at 480px and below) titled "Alle klanten", holding the full CustomerCard grid (tiles of at least 200px; the body scrolls, at most 70vh), so the per-klant totals and the Factuur action stay one click away; choosing a tile filters and closes the dialog. **Tablet and desktop** now show the chip row too (the card strip is gone from the page itself); **phone** unchanged. **Dutch copy (new).** Overzicht | Klantenoverzicht ({n} klanten) | Alle klanten (dialog title). **To measure (owner):** nothing for this part; with 30+ klanten the chip row is still one row.

**2.0.** (2026-10-08) **A chip has one name and two numbers (GAP-092, resolved).** The chip set the klant name, the print count and the open amount in the same weight, so the name did not read as the name. The parts are now marked up and ranked:

| part | markup | look |
|---|---|---|
| klant | `span.nm` | 600, `text-strong` (unpressed) or the chip's own ink (pressed) |
| print count | `span.n` | 400, a `·` separator before it (CSS `::before`) |
| open amount | `span.amt` | 400, tabular figures |

The chip's own ink changes from `muted` to `text`, so the name at 600 is `text-strong` on `surface-2` (14.74 light, 12.88 dark) and the numbers are `text` (10.89 / 9.38). A pressed chip keeps its `info` ink and `info-tint` ground and drops to weight 400, with the name at 600 in the same ink — hierarchy by weight and separator, **no new colour pair**, so nothing in the contrast report moves. A deleted chip keeps `muted` for the name as well.

Why not a second colour for the numbers: `muted` on `info-tint` over `surface-2` is not an approved pair (contrast.md), and a chip is three words long — weight and a separator are enough.
