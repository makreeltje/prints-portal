PrintRow is one print in the list view: the same data as PrintCard, compact, in a table with a sticky header and selection.

**Anatomy.** Columns: checkbox, Naam (+ klant/project), Materiaal (swatch + material), Tijd, Gewicht, Prijs, Status, Tags. Numbers are right-aligned with tabular figures and units. The table scrolls inside `.pp-scroll.edge` with an edge shadow when it overflows; the header (`surface-2`) stays sticky. **Deels betaald:** the Prijs cell shows the remaining amount over "Nog € 6,89 open". **Niet factureren:** the Prijs cell reads "Kosten € x,xx" in `muted` and the badge Niet factureren shows. **Verwijderd:** muted row text, badge Verwijderd and an inline "Herstellen" button in the Status cell. At 480px and below each row becomes a stacked PrintCard-like block. At 1440px and wider add Spoel and Datum columns.

**Tokens.** `surface`, `surface-2`, `border`, `primary-tint-soft` (hover), `primary-tint` (selected), `muted`.

**States.** Default, hover, selected, focus-visible (row link), live update flash, archived and deleted (muted text), partial, niet factureren.

**Accessibility.** `<table>` with `<th scope="col">`; header checkbox selects all (indeterminate for partial); the row name is the link.

**Dutch copy.** Naam, Materiaal, Tijd, Gewicht, Prijs, Status, Tags, Herstellen, Nog {bedrag} open.

**Orders (1.4).** Price is the sum over all orders with "Nog € x open" under it, status is the least settled order, and the sub line adds "{n} bestellingen".

**1.9.** (2026-10-07) **Thumbnail column (GAP-068, resolved).** A new first data column after the checkbox, header cell `th.img` with the hidden label "Voorbeeld": a **40px square** `pp-thumb sm` (`radius-sm`) with the same ground as the card thumbnail (the filament tint with the GAP-071 floor, or the neutral `surface-2` ground and a box icon when there is no preview). Decorative: `alt=""`, the row's name is the link. The column is 56px wide (40px plus `space-3`). Row height grows from about 52px to 56px. **Phone** (480px and below): the stacked row block becomes a two-column block: the 40px thumbnail left, name and klant right, as in the card view; the other fields follow below. Lazy-loaded; rows keep their height without an image. A print whose thumbnail is a video frame uses the neutral ground with the play badge (VideoPlayer). **Dutch copy (new).** Voorbeeld (hidden header).
