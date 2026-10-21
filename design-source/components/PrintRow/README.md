PrintRow is one print in the list view: the same data as PrintCard, compact, in a table with a sticky header and selection.

**Anatomy.** Columns: checkbox, Naam (+ klant/project), Materiaal (swatch + material), Tijd, Gewicht, Prijs, Status, Tags. Numbers are right-aligned with tabular figures and units. The table scrolls inside `.pp-scroll.edge` with an edge shadow when it overflows; the header (`surface-2`) stays sticky. **Deels betaald:** the Prijs cell shows the remaining amount over "Nog € 6,89 open". **Niet factureren:** the Prijs cell reads "Kosten € x,xx" in `muted` and the badge Niet factureren shows. **Verwijderd:** muted row text, badge Verwijderd and an inline "Herstellen" button in the Status cell. At 480px and below each row becomes a stacked PrintCard-like block. At 1440px and wider add Spoel and Datum columns.

**Tokens.** `surface`, `surface-2`, `border`, `primary-tint-soft` (hover), `primary-tint` (selected), `muted`.

**States.** Default, hover, selected, focus-visible (row link), live update flash, archived and deleted (muted text), partial, niet factureren.

**Accessibility.** `<table>` with `<th scope="col">`; header checkbox selects all (indeterminate for partial); the row name is the link and the only one (see 2.0).

**Dutch copy.** Naam, Materiaal, Tijd, Gewicht, Prijs, Status, Tags, Herstellen, Nog {bedrag} open.

**Orders (1.4).** Price is the sum over all orders with "Nog € x open" under it, status is the least settled order, and the sub line adds "{n} bestellingen".

**1.9.** (2026-10-07) **Thumbnail column (GAP-068, resolved).** A new first data column after the checkbox, header cell `th.img` with the hidden label "Voorbeeld": a **40px square** `pp-thumb sm` (`radius-sm`) with the same ground as the card thumbnail (`surface-2` in both themes since 2.0; a box icon when there is no preview). Decorative: `alt=""`, the row's name is the link. The column is 56px wide (40px plus `space-3`). Row height grows from about 52px to 56px. **Phone** (480px and below): the stacked row block becomes a two-column block: the 40px thumbnail left, name and klant right, as in the card view; the other fields follow below. Lazy-loaded; rows keep their height without an image. A print whose thumbnail is a video frame uses the neutral ground with the play badge (VideoPlayer). **Dutch copy (new).** Voorbeeld (hidden header).

**2.0.** (2026-10-08) **The whole row opens the print (GAP-093, merged into GAP-091 and resolved there).** In the grid the whole tile opens a print; in the list only the title did. Same rule, same behaviour: the name stays the one link and gets the class **`pp-rowlink`**, whose `::after` stretches over the row (`.pp-table tbody tr{position:relative}`). The row's hover is the existing `tr:hover td` tint; focus draws the ring on the row (`tr:has(.pp-rowlink:focus-visible)`), not inside the cell. Checkbox, "Herstellen" and any menu sit above the stretched link (`z-index:1`) and keep their own hit area, as the klant tile has since 1.9. **An app that would rather not depend on `position:relative` on a `<tr>`** may instead delegate a click anywhere in the row to the name link; the result and the accessibility are the same, and there is still exactly one target.

**Missing files (GAP-090).** `span.pp-lacks` in the **Status** cell, under the status badge, absent when nothing is missing. At 1440px and wider it sits beside the badge. On the phone block it follows the badge line. Text and rules: PrintCard.

**Thumbnail (GAP-071).** The 40px square is the neutral `surface-2` ground with the outlined render; **no filament bar** at this size (the Materiaal cell already carries the SpoolSwatch). The class `tinted` stays on the element and now only says "this print has a known filament colour".

**Dutch copy (new).** Ontbreekt: {types}

**2.1.** (2026-10-08) **Missing files are icons here too (GAP-106).** The Status cell carries `span.pp-lacks` with the 16px slashed type icons, under the status badge (beside it at 1440px and wider), absent when nothing is missing. No pill, no word: the row has less width than a card, and the worded form lives on the print detail. The group is `role="img"` with the full Dutch sentence as its `aria-label` and `title`. Rules, contrast and the slash construction: PrintCard.

