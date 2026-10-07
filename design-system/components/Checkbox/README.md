Checkbox toggles one option or selects a row; it is custom-styled but keeps a real `<input type="checkbox">`.

**Anatomy.** 20px box (`radius-sm`, `border-strong` outline), check or dash mark in `on-primary` on a `primary` fill, label to the right. The whole label is the hit area (44px tall on phones).

**Tokens.** `surface`, `border-strong`, `primary`, `on-primary`, `focus-ring`.

**States.** Unchecked, checked, indeterminate (select-all with a partial selection), hover, focus-visible, disabled.

**Accessibility.** Native input, so `Space` toggles. Select-all needs `aria-label="Alles selecteren"` and the indeterminate property set from script.

**Dutch copy.** Alles selecteren, Selecteer print, Alleen openstaand.

**1.9.** (2026-10-07) **No jump when ticked (GAP-062, confirmed as built).** `.pp-opt` is `display: inline-flex` and aligned with `vertical-align: top`, so the label's baseline no longer shifts when the box is ticked (the box draws its check with a taller glyph, which moved the baseline by 4.5px in a line of text). The rule is in `bundle.css` and applies to every `.pp-opt` (checkbox, switch and radio labels). Check: tick and untick the box in a line of text; the label must not move.
