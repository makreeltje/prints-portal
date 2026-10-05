PrintCard is one print in the grid view: thumbnail, identity, key numbers, status and tags.

**Anatomy.** Thumbnail (4:3, server-rendered PNG tinted with the spool colour, or a "Geen voorbeeld" fallback), selection checkbox top-left on a `surface` chip, name (600), "klant / project" (`muted`), meta line (materiaal, print time with clock icon, grams), tags, then price on the left and the status badge on the right. Width is fluid between 220px and 320px; the grid uses `repeat(auto-fill, minmax(240px, 1fr))` with `space-4` gaps, one column at 480px and below.

**Tokens.** `surface`, `border`, `primary-tint-soft`/`primary` (selected), `primary-tint-strong` (live flash), `shadow-sm` (hover), `radius-lg`, `space-3`.

**States.** Default, hover, focus-visible (card link), selected (`primary` border and soft tint), live update (1.6s background flash, no layout shift), missing data (warning badge instead of price), archived (thumbnail at 60% opacity).

**Accessibility.** The card is a link to the detail page with the name as accessible text; the checkbox is separate and does not navigate. Status is text plus icon.

**Dutch copy.** Babybox locks | Joey · Babybox locks | PLA · 1 u 20 min · 87 g | € 11,89 | Betaald / Open | Geen voorbeeld
