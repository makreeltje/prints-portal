CostBreakdown explains how the Totaalkosten of a print are built from Materiaal and Stroom, with the source of every value.

**Anatomy.** Header row with the title and an "Aanpassen" ghost button (editors; opens CostOverrideDialog). Table columns Post, Berekening, Bron, Bedrag. Rows: Materiaal, then one sub-row per counted file and, for multi-colour files, one deeper sub-row per slot ("Slot 2 · 1,65 g × € 24,00/kg"); Stroom; Totaalkosten (bold, top rule). Times printed multiplies the calculation text: "2 × 87 g × € 22,50/kg". Source is a neutral badge: Spoolman, Handmatig, Geschat. A missing input shows a `warning` alert above the table and "—" in the affected row; the total reads "Onvolledig". Excluded files are listed once as a muted line "Niet meegeteld: 2 bestanden" with the reasons in the asset list. For a customer that is niet factureren the title reads "Kosten" and no price or margin appears. Users with the User role never see this table.

**Tokens.** `surface-2` (head), `border`, `border-strong` (total rule), `muted`, `warning`, `warning-tint`, `info`.

**States.** Complete, missing printerprofiel, missing spool, manual override (Handmatig badge), loading (Skeleton rows).

**Accessibility.** Real `<table>`; amounts right-aligned with tabular figures; the warning is `role="status"`; the calculation text is visible, not hidden in a tooltip; sub-rows use `aria-level` or indentation plus a visually hidden "onderdeel van".

**Dutch copy.** Materiaal | 2 × 87 g × € 22,50/kg | Spoolman | € 3,92 | Slot 2 · 1,65 g × € 24,00/kg | Stroom | 1,05 kWh × € 0,25/kWh | Geschat | € 0,26 | Totaalkosten | € 4,26 | Aanpassen | Niet meegeteld: 2 bestanden | Geen printerprofiel, stroomkosten ontbreken.

**Inline values (1.4).** Slot rows indent through `tr.slot td:first-child` (`space-9`, 48px); no inline padding remains. Inside an order the breakdown covers that order's items only.

**1.6.** (2026-10-07) **Locked order (GAP-048), confirmed.** On an order that is on a final invoice the "Aanpassen" button is not rendered (cost adjustments are locked, the server refuses them); the badge "Op factuur {nummer}" takes its place in the header, and the OrderSection shows the shared help line "Staat op een definitieve factuur en kan niet meer worden gewijzigd." The table itself stays readable and unchanged.
