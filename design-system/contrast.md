# Contrast report

WCAG 2 contrast ratios, computed from the token values. Text needs 4.5:1; control borders, focus rings and chart marks need 3:1.

**Read the Ground column.** Every pair is measured over one ground (`bg`, `surface`, `surface-2`, or a fill). A pair is only approved over the ground in its row. Translucent tokens (`primary-tint-soft`, `primary-tint`, `primary-tint-strong`, `paid-tint`, `unpaid-tint`, `warning-tint`, `info-tint`) are composited over their ground, so the same token gives a different ratio on every ground: they are approved only over the grounds listed in the table *Translucent tokens over every ground* below. Using one over any other ground needs a new measurement here first.

| Theme | Use | Pair | Ground | Ratio | Needed | Result |
|---|---|---|---|---|---|---|
| dark | text | `text` on `bg` | `bg` | 11.71 | 4.5 | pass |
| dark | text | `text-strong` on `bg` | `bg` | 16.08 | 4.5 | pass |
| dark | text | `muted` on `bg` | `bg` | 7.56 | 4.5 | pass |
| dark | text | `primary` on `bg` | `bg` | 7.50 | 4.5 | pass |
| dark | text | `paid` on `bg` | `bg` | 10.34 | 4.5 | pass |
| dark | text | `unpaid` on `bg` | `bg` | 7.14 | 4.5 | pass |
| dark | text | `warning` on `bg` | `bg` | 11.99 | 4.5 | pass |
| dark | text | `info` on `bg` | `bg` | 11.02 | 4.5 | pass |
| dark | control border | `border-strong` on `bg` | `bg` | 4.14 | 3 | pass |
| dark | focus ring | `focus-ring` on `bg` | `bg` | 9.57 | 3 | pass |
| dark | text | `text` on `surface` | `surface` | 10.59 | 4.5 | pass |
| dark | text | `text-strong` on `surface` | `surface` | 14.55 | 4.5 | pass |
| dark | text | `muted` on `surface` | `surface` | 6.84 | 4.5 | pass |
| dark | text | `primary` on `surface` | `surface` | 6.79 | 4.5 | pass |
| dark | text | `paid` on `surface` | `surface` | 9.35 | 4.5 | pass |
| dark | text | `unpaid` on `surface` | `surface` | 6.46 | 4.5 | pass |
| dark | text | `warning` on `surface` | `surface` | 10.84 | 4.5 | pass |
| dark | text | `info` on `surface` | `surface` | 9.96 | 4.5 | pass |
| dark | control border | `border-strong` on `surface` | `surface` | 3.75 | 3 | pass |
| dark | focus ring | `focus-ring` on `surface` | `surface` | 8.65 | 3 | pass |
| dark | text | `text` on `surface-2` | `surface-2` | 9.38 | 4.5 | pass |
| dark | text | `text-strong` on `surface-2` | `surface-2` | 12.88 | 4.5 | pass |
| dark | text | `muted` on `surface-2` | `surface-2` | 6.06 | 4.5 | pass |
| dark | text | `primary` on `surface-2` | `surface-2` | 6.01 | 4.5 | pass |
| dark | text | `paid` on `surface-2` | `surface-2` | 8.28 | 4.5 | pass |
| dark | text | `unpaid` on `surface-2` | `surface-2` | 5.72 | 4.5 | pass |
| dark | text | `warning` on `surface-2` | `surface-2` | 9.60 | 4.5 | pass |
| dark | text | `info` on `surface-2` | `surface-2` | 8.82 | 4.5 | pass |
| dark | control border | `border-strong` on `surface-2` | `surface-2` | 3.32 | 3 | pass |
| dark | focus ring | `focus-ring` on `surface-2` | `surface-2` | 7.66 | 3 | pass |
| dark | text | `on-primary` on `primary` | `primary` | 7.50 | 4.5 | pass |
| dark | text | `on-primary` on `primary-hover` | `primary-hover` | 9.57 | 4.5 | pass |
| dark | badge text | `paid` on `paid-tint` | `surface` | 6.98 | 4.5 | pass |
| dark | badge text | `unpaid` on `unpaid-tint` | `surface` | 5.19 | 4.5 | pass |
| dark | badge text | `warning` on `warning-tint` | `surface` | 7.89 | 4.5 | pass |
| dark | badge text | `info` on `info-tint` | `surface` | 7.34 | 4.5 | pass |
| dark | text | `text` on `primary-tint` | `surface` | 8.31 | 4.5 | pass |
| dark | text | `primary` on `primary-tint` | `surface` | 5.33 | 4.5 | pass |
| dark | text | `text` on `primary-tint-strong` | `surface` | 7.09 | 4.5 | pass |
| dark | text | `primary` on `primary-tint-strong` | `surface` | 4.55 | 4.5 | pass |
| light | text | `text` on `bg` | `bg` | 11.71 | 4.5 | pass |
| light | text | `text-strong` on `bg` | `bg` | 15.84 | 4.5 | pass |
| light | text | `muted` on `bg` | `bg` | 5.57 | 4.5 | pass |
| light | text | `primary` on `bg` | `bg` | 5.66 | 4.5 | pass |
| light | text | `paid` on `bg` | `bg` | 6.09 | 4.5 | pass |
| light | text | `unpaid` on `bg` | `bg` | 5.71 | 4.5 | pass |
| light | text | `warning` on `bg` | `bg` | 5.65 | 4.5 | pass |
| light | text | `info` on `bg` | `bg` | 5.98 | 4.5 | pass |
| light | control border | `border-strong` on `bg` | `bg` | 3.96 | 3 | pass |
| light | focus ring | `focus-ring` on `bg` | `bg` | 7.23 | 3 | pass |
| light | text | `text` on `surface` | `surface` | 12.67 | 4.5 | pass |
| light | text | `text-strong` on `surface` | `surface` | 17.14 | 4.5 | pass |
| light | text | `muted` on `surface` | `surface` | 6.03 | 4.5 | pass |
| light | text | `primary` on `surface` | `surface` | 6.12 | 4.5 | pass |
| light | text | `paid` on `surface` | `surface` | 6.59 | 4.5 | pass |
| light | text | `unpaid` on `surface` | `surface` | 6.18 | 4.5 | pass |
| light | text | `warning` on `surface` | `surface` | 6.11 | 4.5 | pass |
| light | text | `info` on `surface` | `surface` | 6.47 | 4.5 | pass |
| light | control border | `border-strong` on `surface` | `surface` | 4.29 | 3 | pass |
| light | focus ring | `focus-ring` on `surface` | `surface` | 7.82 | 3 | pass |
| light | text | `text` on `surface-2` | `surface-2` | 10.89 | 4.5 | pass |
| light | text | `text-strong` on `surface-2` | `surface-2` | 14.74 | 4.5 | pass |
| light | text | `muted` on `surface-2` | `surface-2` | 5.18 | 4.5 | pass |
| light | text | `primary` on `surface-2` | `surface-2` | 5.27 | 4.5 | pass |
| light | text | `paid` on `surface-2` | `surface-2` | 5.66 | 4.5 | pass |
| light | text | `unpaid` on `surface-2` | `surface-2` | 5.31 | 4.5 | pass |
| light | text | `warning` on `surface-2` | `surface-2` | 5.26 | 4.5 | pass |
| light | text | `info` on `surface-2` | `surface-2` | 5.57 | 4.5 | pass |
| light | control border | `border-strong` on `surface-2` | `surface-2` | 3.69 | 3 | pass |
| light | focus ring | `focus-ring` on `surface-2` | `surface-2` | 6.72 | 3 | pass |
| light | text | `on-primary` on `primary` | `primary` | 6.12 | 4.5 | pass |
| light | text | `on-primary` on `primary-hover` | `primary-hover` | 7.82 | 4.5 | pass |
| light | badge text | `paid` on `paid-tint` | `surface` | 5.33 | 4.5 | pass |
| light | badge text | `unpaid` on `unpaid-tint` | `surface` | 4.93 | 4.5 | pass |
| light | badge text | `warning` on `warning-tint` | `surface` | 4.98 | 4.5 | pass |
| light | badge text | `info` on `info-tint` | `surface` | 5.23 | 4.5 | pass |
| light | text | `text` on `primary-tint` | `surface` | 10.35 | 4.5 | pass |
| light | text | `primary` on `primary-tint` | `surface` | 5.00 | 4.5 | pass |
| light | text | `text` on `primary-tint-strong` | `surface` | 9.44 | 4.5 | pass |
| light | text | `primary` on `primary-tint-strong` | `surface` | 4.56 | 4.5 | pass |
| dark | chart mark | `viz-1` on `surface` | `surface` | 6.79 | 3 | pass |
| dark | chart mark | `viz-2` on `surface` | `surface` | 7.94 | 3 | pass |
| dark | chart mark | `viz-3` on `surface` | `surface` | 7.39 | 3 | pass |
| dark | chart mark | `viz-4` on `surface` | `surface` | 7.25 | 3 | pass |
| dark | chart mark | `viz-5` on `surface` | `surface` | 7.00 | 3 | pass |
| light | chart mark | `viz-1` on `surface` | `surface` | 6.12 | 3 | pass |
| light | chart mark | `viz-2` on `surface` | `surface` | 5.11 | 3 | pass |
| light | chart mark | `viz-3` on `surface` | `surface` | 6.47 | 3 | pass |
| light | chart mark | `viz-4` on `surface` | `surface` | 5.87 | 3 | pass |
| light | chart mark | `viz-5` on `surface` | `surface` | 5.34 | 3 | pass |
| dark | neutral badge and "slicer" hint text | `muted` on `surface-2` | `surface-2` | 6.06 | 4.5 | pass |
| dark | remaining amount line | `unpaid` on `surface` | `surface` | 6.46 | 4.5 | pass |
| dark | duplicate hint line | `warning` on `surface` | `surface` | 10.84 | 4.5 | pass |
| dark | document and info text | `info` on `bg` | `bg` | 11.02 | 4.5 | pass |
| dark | "Verloopt niet" in ShareLinkRow, link label on the not-billed share page | `muted` on `surface` | `surface` | 6.84 | 4.5 | pass |
| dark | tooltip text (pp-tip), rail and bubble | `bg` on `text-strong` | `text-strong` | 16.08 | 4.5 | pass |
| dark | drawer links and auth card text | `text` on `surface` | `surface` | 10.59 | 4.5 | pass |
| dark | muted row text on hover (deleted and archived rows) | `muted` on `primary-tint-soft` | `primary-tint-soft` | 6.01 | 4.5 | pass |
| dark | selected customer chip (aria-pressed) | `info` on `info-tint` | `info-tint` | 7.34 | 4.5 | pass |
| dark | selected customer card (pp-cust.is-selected) | `text` on `primary-tint-soft` | `primary-tint-soft` | 9.30 | 4.5 | pass |
| dark | count and amount label on a selected customer card | `muted` on `primary-tint-soft` | `primary-tint-soft` | 6.01 | 4.5 | pass |
| dark | reindex progress bar on its track (non-text 3:1) | `primary` on `surface-2` | `surface-2` | 6.01 | 3.0 | pass |
| dark | selected card border and order section accent (non-text 3:1) | `primary` on `surface` | `surface` | 6.79 | 3.0 | pass |
| dark | OverflowMenu: destructive item on hover (1.9) | `unpaid` on `primary-tint-soft` | `primary-tint-soft` | 5.68 | 4.5 | pass |
| dark | OverflowMenu item on hover, selected ModelPicker button, Openstaand group summary on hover (1.9) | `text-strong` on `primary-tint-soft` | `primary-tint-soft` | 12.78 | 4.5 | pass |
| dark | Openstaand: print count in an open group summary (1.9) | `muted` on `surface-2` | `surface-2` | 6.06 | 4.5 | pass |
| dark | CostBreakdown: missing-input line (pp-missing, 1.9) | `text` on `surface-2` | `surface-2` | 9.38 | 4.5 | pass |
| dark | CostBreakdown: warning icon on the missing-input line (non-text 3:1, 1.9) | `warning` on `surface-2` | `surface-2` | 9.60 | 3.0 | pass |
| dark | Deel-links dialog: duplicate-label warning icon (non-text 3:1, 1.9) | `warning` on `surface` | `surface` | 10.84 | 3.0 | pass |
| dark | VideoPlayer: error frame border (non-text 3:1, 1.9) | `unpaid` on `surface` | `surface` | 6.46 | 3.0 | pass |
| light | neutral badge and "slicer" hint text | `muted` on `surface-2` | `surface-2` | 5.18 | 4.5 | pass |
| light | remaining amount line | `unpaid` on `surface` | `surface` | 6.18 | 4.5 | pass |
| light | duplicate hint line | `warning` on `surface` | `surface` | 6.11 | 4.5 | pass |
| light | document and info text | `info` on `bg` | `bg` | 5.98 | 4.5 | pass |
| light | "Verloopt niet" in ShareLinkRow, link label on the not-billed share page | `muted` on `surface` | `surface` | 6.03 | 4.5 | pass |
| light | tooltip text (pp-tip), rail and bubble | `bg` on `text-strong` | `text-strong` | 15.84 | 4.5 | pass |
| light | drawer links and auth card text | `text` on `surface` | `surface` | 12.67 | 4.5 | pass |
| light | muted row text on hover (deleted and archived rows) | `muted` on `primary-tint-soft` | `primary-tint-soft` | 5.39 | 4.5 | pass |
| light | selected customer chip (aria-pressed) | `info` on `info-tint` | `info-tint` | 5.23 | 4.5 | pass |
| light | selected customer card (pp-cust.is-selected) | `text` on `primary-tint-soft` | `primary-tint-soft` | 11.32 | 4.5 | pass |
| light | count and amount label on a selected customer card | `muted` on `primary-tint-soft` | `primary-tint-soft` | 5.39 | 4.5 | pass |
| light | reindex progress bar on its track (non-text 3:1) | `primary` on `surface-2` | `surface-2` | 5.27 | 3.0 | pass |
| light | selected card border and order section accent (non-text 3:1) | `primary` on `surface` | `surface` | 6.12 | 3.0 | pass |
| light | OverflowMenu: destructive item on hover (1.9) | `unpaid` on `primary-tint-soft` | `primary-tint-soft` | 5.52 | 4.5 | pass |
| light | OverflowMenu item on hover, selected ModelPicker button, Openstaand group summary on hover (1.9) | `text-strong` on `primary-tint-soft` | `primary-tint-soft` | 15.31 | 4.5 | pass |
| light | Openstaand: print count in an open group summary (1.9) | `muted` on `surface-2` | `surface-2` | 5.18 | 4.5 | pass |
| light | CostBreakdown: missing-input line (pp-missing, 1.9) | `text` on `surface-2` | `surface-2` | 10.89 | 4.5 | pass |
| light | CostBreakdown: warning icon on the missing-input line (non-text 3:1, 1.9) | `warning` on `surface-2` | `surface-2` | 5.26 | 3.0 | pass |
| light | Deel-links dialog: duplicate-label warning icon (non-text 3:1, 1.9) | `warning` on `surface` | `surface` | 6.11 | 3.0 | pass |
| light | VideoPlayer: error frame border (non-text 3:1, 1.9) | `unpaid` on `surface` | `surface` | 6.18 | 3.0 | pass |
| both | tag chip text on palette colour | `#141a33` on `tag-rose` | `tag-rose` | 6.48 | 4.5 | pass |
| both | tag chip text on palette colour | `#141a33` on `tag-orange` | `tag-orange` | 8.43 | 4.5 | pass |
| both | tag chip text on palette colour | `#141a33` on `tag-amber` | `tag-amber` | 10.87 | 4.5 | pass |
| both | tag chip text on palette colour | `#141a33` on `tag-lime` | `tag-lime` | 9.38 | 4.5 | pass |
| both | tag chip text on palette colour | `#141a33` on `tag-teal` | `tag-teal` | 10.29 | 4.5 | pass |
| both | tag chip text on palette colour | `#141a33` on `tag-sky` | `tag-sky` | 9.99 | 4.5 | pass |
| both | tag chip text on palette colour | `#141a33` on `tag-blue` | `tag-blue` | 6.81 | 4.5 | pass |
| both | tag chip text on palette colour | `#141a33` on `tag-violet` | `tag-violet` | 7.41 | 4.5 | pass |
| both | tag chip text on palette colour | `#141a33` on `tag-lilac` | `tag-lilac` | 8.86 | 4.5 | pass |
| both | tag chip text on palette colour | `#141a33` on `tag-grey` | `tag-grey` | 8.12 | 4.5 | pass |
| light (PDF) | document text | `paper ink` on `paper` | `paper` | 17.14 | 4.5 | pass |
| light (PDF) | document text | `paper ink-2 (footer)` on `paper` | `paper` | 12.67 | 4.5 | pass |
| light (PDF) | document text | `paper muted (labels)` on `paper` | `paper` | 6.03 | 4.5 | pass |

## Translucent tokens over every ground

Text colour on the composited token, over each of the three grounds. 'not approved' is below 4.5:1 and must not be used for text on that ground.

| Theme | Token | Text | on bg | on surface | on surface-2 | Approved over |
|---|---|---|---|---|---|---|
| dark | `primary-tint-soft` | `primary` | 6.77 pass | 5.96 pass | 5.25 pass | bg, surface, surface-2 |
| dark | `primary-tint-soft` | `text` | 10.56 pass | 9.30 pass | 8.19 pass | bg, surface, surface-2 |
| dark | `primary-tint-soft` | `muted` | 6.82 pass | 6.01 pass | 5.29 pass | bg, surface, surface-2 |
| dark | `primary-tint` | `primary` | 6.08 pass | 5.33 pass | 4.68 pass | bg, surface, surface-2 |
| dark | `primary-tint` | `text` | 9.48 pass | 8.31 pass | 7.29 pass | bg, surface, surface-2 |
| dark | `primary-tint` | `muted` | 6.13 pass | 5.37 pass | 4.71 pass | bg, surface, surface-2 |
| dark | `primary-tint-strong` | `primary` | 5.16 pass | 4.55 pass | 4.05 not approved | bg, surface |
| dark | `primary-tint-strong` | `text` | 8.05 pass | 7.09 pass | 6.32 pass | bg, surface, surface-2 |
| dark | `paid-tint` | `paid` | 7.91 pass | 6.98 pass | 6.12 pass | bg, surface, surface-2 |
| dark | `paid-tint` | `text` | 8.96 pass | 7.91 pass | 6.92 pass | bg, surface, surface-2 |
| dark | `unpaid-tint` | `unpaid` | 5.89 pass | 5.19 pass | 4.60 pass | bg, surface, surface-2 |
| dark | `unpaid-tint` | `text` | 9.65 pass | 8.51 pass | 7.54 pass | bg, surface, surface-2 |
| dark | `warning-tint` | `warning` | 8.95 pass | 7.89 pass | 6.88 pass | bg, surface, surface-2 |
| dark | `warning-tint` | `text` | 8.73 pass | 7.70 pass | 6.72 pass | bg, surface, surface-2 |
| dark | `info-tint` | `info` | 8.31 pass | 7.34 pass | 6.39 pass | bg, surface, surface-2 |
| dark | `info-tint` | `text` | 8.83 pass | 7.80 pass | 6.79 pass | bg, surface, surface-2 |
| light | `primary-tint-soft` | `primary` | 5.08 pass | 5.47 pass | 4.73 pass | bg, surface, surface-2 |
| light | `primary-tint-soft` | `text` | 10.51 pass | 11.32 pass | 9.77 pass | bg, surface, surface-2 |
| light | `primary-tint-soft` | `muted` | 5.00 pass | 5.39 pass | 4.65 pass | bg, surface, surface-2 |
| light | `primary-tint` | `primary` | 4.64 pass | 5.00 pass | 4.34 not approved | bg, surface |
| light | `primary-tint` | `text` | 9.59 pass | 10.35 pass | 8.98 pass | bg, surface, surface-2 |
| light | `primary-tint` | `muted` | 4.57 pass | 4.92 pass | 4.27 not approved | bg, surface |
| light | `primary-tint-strong` | `primary` | 4.26 not approved | 4.56 pass | 3.98 not approved | surface |
| light | `primary-tint-strong` | `text` | 8.81 pass | 9.44 pass | 8.23 pass | bg, surface, surface-2 |
| light | `paid-tint` | `paid` | 4.94 pass | 5.33 pass | 4.66 pass | bg, surface, surface-2 |
| light | `paid-tint` | `text` | 9.50 pass | 10.26 pass | 8.95 pass | bg, surface, surface-2 |
| light | `unpaid-tint` | `unpaid` | 4.60 pass | 4.93 pass | 4.29 not approved | bg, surface |
| light | `unpaid-tint` | `text` | 9.43 pass | 10.10 pass | 8.80 pass | bg, surface, surface-2 |
| light | `warning-tint` | `warning` | 4.63 pass | 4.98 pass | 4.32 not approved | bg, surface |
| light | `warning-tint` | `text` | 9.59 pass | 10.33 pass | 8.95 pass | bg, surface, surface-2 |
| light | `info-tint` | `info` | 4.85 pass | 5.23 pass | 4.54 pass | bg, surface, surface-2 |
| light | `info-tint` | `text` | 9.50 pass | 10.23 pass | 8.88 pass | bg, surface, surface-2 |

## Translucent token inside a translucent row

A badge or chip tint composited over a row that is itself tinted (row hover, selected row) over `surface`. This is the ground the lists of the app can produce. **Since 1.8 status badges and `pp-hint` chips carry an opaque `surface` base under their tint, so their ground is `surface` in every row state and the ratios of the first table apply (4.9 to 5.3 in light, 5.9 to 9 in dark).** The table below shows what the nested composite would give without that base and is the reason for it; a nested pair is approved only if it passes here.

| Theme | Token | Row state (row ground) | Own colour text | `text` |
|---|---|---|---|---|
| dark | `paid-tint` | row hover (`primary-tint-soft` over `surface`) | 6.04 pass | 6.84 pass |
| dark | `unpaid-tint` | row hover (`primary-tint-soft` over `surface`) | 4.57 pass | 7.49 pass |
| dark | `warning-tint` | row hover (`primary-tint-soft` over `surface`) | 6.82 pass | 6.66 pass |
| dark | `info-tint` | row hover (`primary-tint-soft` over `surface`) | 6.34 pass | 6.73 pass |
| dark | `paid-tint` | selected row (`primary-tint` over `surface`) | 5.42 pass | 6.13 pass |
| dark | `unpaid-tint` | selected row (`primary-tint` over `surface`) | 4.12 not approved | 6.74 pass |
| dark | `warning-tint` | selected row (`primary-tint` over `surface`) | 6.12 pass | 5.98 pass |
| dark | `info-tint` | selected row (`primary-tint` over `surface`) | 5.67 pass | 6.03 pass |
| light | `paid-tint` | row hover (`primary-tint-soft` over `surface`) | 4.81 pass | 9.24 pass |
| light | `unpaid-tint` | row hover (`primary-tint-soft` over `surface`) | 4.44 not approved | 9.11 pass |
| light | `warning-tint` | row hover (`primary-tint-soft` over `surface`) | 4.49 not approved | 9.31 pass |
| light | `info-tint` | row hover (`primary-tint-soft` over `surface`) | 4.72 pass | 9.24 pass |
| light | `paid-tint` | selected row (`primary-tint` over `surface`) | 4.41 not approved | 8.49 pass |
| light | `unpaid-tint` | selected row (`primary-tint` over `surface`) | 4.10 not approved | 8.40 pass |
| light | `warning-tint` | selected row (`primary-tint` over `surface`) | 4.12 not approved | 8.54 pass |
| light | `info-tint` | selected row (`primary-tint` over `surface`) | 4.33 not approved | 8.47 pass |

Rule: a translucent token is never nested inside another translucent ground except the combinations listed here; when an alpha changes, regenerate this report and read both tables.

Alpha values are the real ones from `tokens.css`: soft 0x14 (7.8%), tint 0x24 (14.1%), strong 0x38 dark and 0x33 light (21.9% and 20%), state tints 0x24. Until 1.6 the report used rounded alphas (.08, .14, .20); the ratios moved by hundredths and no verdict changed.

Added in 1.1: neutral badge, remaining-amount line, duplicate hint, and the three text colours used on the A4 documents (white paper, printed in black and white: status is always a word). Not checked here: `border` (decorative hairline, never the sole cue), `viz-seq-1`/`viz-seq-2` (fills that need labels or an outline), and anything painted over a user-chosen tag or spool colour (tag text flips between `#141a33` and `#ffffff` by luminance at runtime).

## Added in 2.3

**No new colour pair.** Both changes this round use pairs already measured above; they are listed here because they are new *uses*, and this report is read by use.

| Theme | Use | Pair | Ground | Ratio | Needed | Result |
|---|---|---|---|---|---|---|
| light | graphic boundary | `border-strong` outline of a thumbnail's silhouette (`.pp-art`) | `surface-2` | 3.69 | 3 | pass |
| dark | graphic boundary | `border-strong` outline of a thumbnail's silhouette (`.pp-art`) | `surface-2` | 3.32 | 3 | pass |
| light | chip border | `border-strong` dashed edge of `pp-hintchip` inside a secondary trigger | `surface` | 4.29 | 3 | pass |
| dark | chip border | `border-strong` dashed edge of `pp-hintchip` inside a secondary trigger | `surface` | 3.75 | 3 | pass |

**Why the outline exists, in ratios.** The picture itself cannot be made to pass. Measured in the running app on the server-rendered thumbnails, which are neutral grey: the **lightest pixel of a render is 1.16:1 on light `surface-2`** and the **darkest is 1.68:1 on dark `surface-2`**. A fixed ground and arbitrary picture content have no guaranteed contrast in either direction, so no ground and no tint can fix it — only a boundary drawn in a token can, and `.pp-art` draws it from the picture's own alpha channel in both themes.

**What 2.0 did and 2.3 withdrew.** 2.0 baked `#6f7a96` — the *light* `border-strong` value — into the server-rendered PNG, which measured 3.69:1 on light `surface-2` and 3.53:1 on dark. Both pass, but one ink for two grounds passes by luck: nothing in the system guarantees that a value chosen for one theme clears the other, and a baked value cannot be changed without re-encoding the library. The two rows above are the token's own values, which is what this report is for.

**The chip inside the trigger (GAP-115).** `pp-hintchip` keeps its own `surface-2` ground and `muted` text (4.5:1 or more on `surface-2`, in the tables above) when it moves inside a `.pp-btn-secondary` trigger; the trigger's ground is `surface`, so the chip's dashed `border-strong` edge is measured against `surface` instead of `surface-2`. Both values are above, and both pass.
