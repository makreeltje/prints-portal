MoneyDisplay renders every euro amount: tabular figures, Dutch format `€ 1.234,56`, right-aligned in tables.

**Anatomy.** Amount in 600 `text-strong`; optional struck-through original (`muted`) before it; optional "voorgesteld" hint chip (`info`). Format with `Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR"})` and keep the space after the symbol. Negative amounts use a minus sign, never red alone.

**Tokens.** `text-strong`, `muted`, `info`, `info-tint`, `radius-sm`.

**States.** Normal, with original (discount or corrected price), suggested (not yet saved), missing ("Prijs volgt" on the share page, "Geen prijs" badge in the operator UI).

**Accessibility.** Strikethrough text is wrapped in `<s>` and followed by a visually hidden "was". Units and symbols are never separated from the number on wrapping.

**Dutch copy.** € 11,89 | € 14,50 → € 11,89 | € 11,89 voorgesteld | Prijs volgt
