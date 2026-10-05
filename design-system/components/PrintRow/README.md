PrintRow is one print in the list view: the same data as PrintCard, compact, in a table with a sticky header and selection.

**Anatomy.** Columns: checkbox, Naam (+ klant/project), Materiaal (swatch + material), Tijd, Gewicht, Prijs, Status, Tags. Numbers are right-aligned with tabular figures and units. The table scrolls inside `.pp-scroll.edge` with an edge shadow when it overflows; the header (`surface-2`) stays sticky. **Deels betaald:** the Prijs cell shows the remaining amount over "Nog € 6,89 open". **Niet factureren:** the Prijs cell reads "Kosten € x,xx" in `muted` and the badge Niet factureren shows. **Verwijderd:** muted row text, badge Verwijderd and an inline "Herstellen" button in the Status cell. At 480px and below each row becomes a stacked PrintCard-like block. At 1440px and wider add Spoel and Datum columns.

**Tokens.** `surface`, `surface-2`, `border`, `primary-tint-soft` (hover), `primary-tint` (selected), `muted`.

**States.** Default, hover, selected, focus-visible (row link), live update flash, archived and deleted (muted text), partial, niet factureren.

**Accessibility.** `<table>` with `<th scope="col">`; header checkbox selects all (indeterminate for partial); the row name is the link.

**Dutch copy.** Naam, Materiaal, Tijd, Gewicht, Prijs, Status, Tags, Herstellen, Nog {bedrag} open.
