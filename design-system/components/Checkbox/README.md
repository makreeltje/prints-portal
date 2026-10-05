Checkbox toggles one option or selects a row; it is custom-styled but keeps a real `<input type="checkbox">`.

**Anatomy.** 20px box (`radius-sm`, `border-strong` outline), check or dash mark in `on-primary` on a `primary` fill, label to the right. The whole label is the hit area (44px tall on phones).

**Tokens.** `surface`, `border-strong`, `primary`, `on-primary`, `focus-ring`.

**States.** Unchecked, checked, indeterminate (select-all with a partial selection), hover, focus-visible, disabled.

**Accessibility.** Native input, so `Space` toggles. Select-all needs `aria-label="Alles selecteren"` and the indeterminate property set from script.

**Dutch copy.** Alles selecteren, Selecteer print, Alleen openstaand.
