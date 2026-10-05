PrintRow is one print in the list view: the same data as PrintCard, compact, in a table with a sticky header and selection.

**Anatomy.** Columns: checkbox, Naam (+ klant/project), Materiaal (swatch + material), Tijd, Gewicht, Prijs, Status, Tags. Numbers are right-aligned with tabular figures and units. The table scrolls inside `.pp-scroll` with an edge shadow when it overflows (`.edge`); the header (`surface-2`) stays sticky. At 480px and below each row becomes a stacked PrintCard-like block. At 1440px and wider add Spoel and Datum columns.

**Tokens.** `surface`, `surface-2`, `border`, `primary-tint-soft` (hover), `primary-tint` (selected), `muted`.

**States.** Default, hover, selected, focus-visible (row link), live update flash, archived (muted text).

**Accessibility.** `<table>` with `<th scope="col">`; header checkbox selects all (indeterminate for partial); the row name is the link.

**Dutch copy.** Naam, Materiaal, Tijd, Gewicht, Prijs, Status, Tags.
