PrintCard is one print in the grid view: thumbnail, identity, key numbers, status and tags.

**Anatomy.** Thumbnail (4:3, server-rendered PNG tinted with the spool colour; see the tint rule under SpoolSwatch; or a "Geen voorbeeld" fallback), selection checkbox top-left on a `surface` chip, name (600), "klant / project" (`muted`), meta line (materiaal, print time with clock icon, grams), tags, then the price block on the left and the status badge on the right. Fluid width 220–320px; the grid uses `repeat(auto-fill, minmax(240px, 1fr))`, one column at 480px and below. **Deels betaald:** price block shows the remaining amount with the `pp-remaining` line, badge Deels betaald. **Niet factureren:** the price block shows "Kosten € x,xx" and the badge Niet factureren replaces the payment badge. **Verwijderd** (admin filter "Toon verwijderde"): thumbnail at 45% opacity, badge Verwijderd and a secondary small button "Herstellen" (one print; projects and customers have Herstellen in their header). **Gearchiveerd:** badge Gearchiveerd, thumbnail at 60% opacity. **Op factuur:** a locked print also shows the info badge "Op factuur {nummer}" in the tag row. **Mogelijk dubbel** appears only on the detail page.

**Tokens.** `surface`, `border`, `primary-tint-soft`/`primary` (selected), `primary-tint-strong` (live flash), `shadow-sm` (hover), `radius-lg`, `space-3`.

**States.** Default, hover, focus-visible (card link), selected, live update (1.6s flash, no layout shift), missing data, partial, niet factureren, archived, deleted.

**Accessibility.** The card is a link to the detail page with the name as accessible text; the checkbox and Herstellen are separate controls. Status is text plus icon.

**Dutch copy.** Babybox locks | Joey · Babybox locks | PLA · 1 u 20 min · 87 g | € 11,89 | Betaald / Open / Deels betaald | Nog € 6,89 open | Kosten | Niet factureren | Verwijderd | Herstellen | Gearchiveerd | Geen voorbeeld
