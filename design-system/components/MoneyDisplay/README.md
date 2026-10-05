MoneyDisplay renders every euro amount: tabular figures, Dutch format `€ 1.234,56`, right-aligned in tables.

**Anatomy.** Amount in 600 `text-strong`; optional struck-through original (`muted`) before it; optional "voorgesteld" hint chip (`info`); optional remaining line "Nog € 6,89 open" (`unpaid`, 12px) below a partially paid amount, with the full price shown as "van € 11,89" in `muted`. Format with `Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR"})`; negative amounts (credit notes) read `€ -11,89`, with a minus sign and never red alone.

**Tokens.** `text-strong`, `muted`, `unpaid`, `info`, `info-tint`, `radius-sm`.

**States.** Normal, with original, suggested, remaining (partial payment), negative, missing ("Prijs volgt" on the share page, "Geen prijs" badge in the operator UI), cost only ("Kosten" label for customers that are niet factureren).

**Accessibility.** Strikethrough text is wrapped in `<s>` and followed by a visually hidden "was". Units and symbols are never separated from the number on wrapping.

**Dutch copy.** € 11,89 | € 14,50 → € 11,89 | € 11,89 voorgesteld | van € 11,89, Nog € 6,89 open | € -11,89 | Prijs volgt | Kosten € 2,30
