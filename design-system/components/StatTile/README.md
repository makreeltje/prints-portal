StatTile shows one headline number with its label, used on Openstaand and the Dashboard.

**Anatomy.** Card with a large figure (`heading-3xl`, tabular), a label (`muted`) and an optional detail line. Figures with units keep the unit in the figure ("€ 142,38", "3 klanten", "16 dagen"). Tiles sit in a responsive grid, two across at 480px and below.

**Tokens.** `surface`, `border`, `text-strong`, `muted`, `radius-lg`, `space-4`.

**States.** Default, loading (Skeleton figure), warning (the figure gets a warning icon when the oldest item is over 30 days).

**Accessibility.** Tile is a `<dl>`-style label/value pair; the label is read first.

**Dutch copy.** Totaal openstaand | Aantal klanten | Oudste openstaande print | € 142,38 | 3 klanten | 16 dagen
