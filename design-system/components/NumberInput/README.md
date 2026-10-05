NumberInput is a decimal field with a fixed unit attached: `€`, `g`, `%`, `W`.

**Anatomy.** `.pp-affix` wrapping an `.pp-input` (right-aligned, tabular figures) and a `.pp-suffix` unit cell; add `.pre` to put the unit (for `€`) before the value. Use `inputmode="decimal"` and accept a comma or a point; display with the Dutch decimal comma.

**Tokens.** Same as TextInput plus `surface-2` and `muted` for the unit cell.

**States.** Default, hover, focus, error (out of range or not a number), disabled.

**Accessibility.** Put the unit in the label too ("Verkoopprijs in euro") so screen readers hear it; the visual suffix is `aria-hidden`.

**Dutch copy.** Verkoopprijs, Betaald bedrag, Gewicht, Marge. Error: "Vul een bedrag in, bijvoorbeeld 11,89."
