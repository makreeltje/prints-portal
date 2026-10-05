CostBreakdown explains how the Totaalkosten of a print are built from Materiaal and Stroom, with the source of every value.

**Anatomy.** Table with columns Post, Berekening, Bron, Bedrag. Rows: Materiaal (grams × €/kg), Stroom (time × W × tarief → kWh → €), Totaalkosten (bold, top border). Per-asset sub-rows are indented. Source is a small neutral badge: Spoolman, Handmatig, Geschat. A missing input shows a `warning` alert above the table with an action, and the affected row shows "—" instead of a number; the total says "Onvolledig".

**Tokens.** `surface-2` (head), `border`, `border-strong` (total rule), `muted`, `warning`, `warning-tint`, `info`.

**States.** Complete, missing printerprofiel (Stroom "—", alert), missing spool (Materiaal "—"), loading (Skeleton rows).

**Accessibility.** Real `<table>`; amounts right-aligned with tabular figures; the warning is `role="status"`; the calculation text is visible, not hidden in a tooltip.

**Dutch copy.** Materiaal | 87 g × € 22,50/kg | Spoolman | € 2,18 | Stroom | 1 u 20 min × 350 W = 0,47 kWh | Geschat | € 0,12 | Totaalkosten | € 2,30 | Geen printerprofiel, stroomkosten ontbreken.
