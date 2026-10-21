FilterBar narrows the dashboard by klant, tags, free text and view type.

**Anatomy.** One row on desktop, wrapping on tablet, stacked at 480px and below: klant Select, tag multi-select (popover with checkboxes), SearchField (grows), SegmentedControl (Kaarten/Lijst), "Filters wissen" ghost button (visible only when a filter is active). Active tags appear as removable TagChips below with the line "Toont prints met alle gekozen tags (EN)". Result count updates live.

**Tokens.** `surface`, `border`, `muted`, `radius-lg`, `space-2`/`space-3`.

**States.** Default, filters active, no results (EmptyState below), loading (controls stay enabled, list shows Skeleton).

**Accessibility.** `role="search"` region; chip removal announces "<tag> verwijderd uit filter"; the tag filter states AND semantics in text, not only in the tooltip.

**Dutch copy.** Alle klanten | Tags | Zoek op naam, klant of tag | Kaarten | Lijst | Filters wissen | Toont prints met alle gekozen tags (EN) | 12 van 61 prints

**Stacking (1.4).** The "Tags" popover sits in `.pp-anchor` and floats above the print cards (`z-popover`); no page needs its own z-index.

**1.9.** (2026-10-07) **Sort and status (GAP-066, resolved).** Two Selects join the bar after Klant: **Sorteren** (default "Nieuwste eerst") and **Status** (default "Alle statussen"). Sort options: Nieuwste eerst | Oudste eerst | Prijs: hoog naar laag | Prijs: laag naar hoog | Klant: A tot Z. "Nieuwste" is by date of the print; price sorts put prints without a price last in both directions; klant ties break on newest. Status options: Alle statussen | Geen prijs | Open | Betaald | Afgeschreven | Onvolledige kosten (one at a time; "Open" includes partly paid, as in Openstaand; "Afgeschreven" is a written-off order; "Onvolledige kosten" is the cost state "Onvolledig"). Both are sent to the server with the klant, tag and search filters (the list is paged, so sorting and filtering must not happen on the loaded 24 only) and kept in the URL, so a view can be shared and the back button restores it. Changing either resets the list to its first page and moves focus nowhere (the count line below updates through `aria-live="polite"`: "9 van 83 prints"). A non-default Status counts as an active filter ("Filters wissen" appears and clears it; Sorteren is not a filter and stays). **Layout.** Desktop: both Selects at 170px in the bar; tablet: they wrap with the others; **phone** (480px and below): the two Selects share a line (each `flex: 1 1 140px`), under the search box and above the view toggle. Select labels are visible only as the selected text; the accessible names are "Sorteren" and "Status". Empty result: the existing EmptyState "Geen prints gevonden" with "Filters wissen". **Dutch copy (new).** Sorteren | Status | Alle statussen | Geen prijs | Open | Betaald | Afgeschreven | Onvolledige kosten | Nieuwste eerst | Oudste eerst | Prijs: hoog naar laag | Prijs: laag naar hoog | Klant: A tot Z.
