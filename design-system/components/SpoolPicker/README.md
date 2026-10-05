SpoolPicker chooses a spool from Spoolman by material, colour, vendor or price per kg; it fits inside a narrow table cell.

**Anatomy.** Trigger (swatch + name + chevron, 160px minimum) opens a Popover (320px; full-width sheet at 480px and below) with a search field and a listbox. Each option: swatch, name (500), "materiaal · leverancier" (`muted`), price per kg right-aligned. The selected option is `primary-tint`; the keyboard-active option has a 2px `focus-ring` outline. Last option "Geen spoel". Empty state: "Geen spoelen gevonden" with a link to Spoolman.

**Tokens.** `surface`, `border`, `shadow-md`, `primary-tint`, `primary-tint-soft`, `focus-ring`, `muted`.

**States.** Closed, open, option hover/active/selected, searching, empty, Spoolman unreachable (warning alert in the popover, manual entry offered).

**Accessibility.** Combobox pattern: input `role="combobox"` with `aria-controls`/`aria-activedescendant`; ArrowUp/Down move, Enter selects, Esc closes and returns focus to the trigger; typing filters immediately.

**Dutch copy.** Kies een spoel | Zoek op materiaal, kleur of leverancier | Geen spoelen gevonden | €/kg | Geen spoel
