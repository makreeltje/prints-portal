FilterBar narrows the dashboard by klant, tags, free text and view type.

**Anatomy.** One row on desktop, wrapping on tablet, stacked at 480px and below: klant Select, tag multi-select (popover with checkboxes), SearchField (grows), SegmentedControl (Kaarten/Lijst), "Filters wissen" ghost button (visible only when a filter is active). Active tags appear as removable TagChips below with the line "Toont prints met alle gekozen tags (EN)". Result count updates live.

**Tokens.** `surface`, `border`, `muted`, `radius-lg`, `space-2`/`space-3`.

**States.** Default, filters active, no results (EmptyState below), loading (controls stay enabled, list shows Skeleton).

**Accessibility.** `role="search"` region; chip removal announces "<tag> verwijderd uit filter"; the tag filter states AND semantics in text, not only in the tooltip.

**Dutch copy.** Alle klanten | Tags | Zoek op naam, klant of tag | Kaarten | Lijst | Filters wissen | Toont prints met alle gekozen tags (EN) | 12 van 61 prints

**Stacking (1.4).** The "Tags" popover sits in `.pp-anchor` and floats above the print cards (`z-popover`); no page needs its own z-index.
