SpoolPicker chooses a spool from Spoolman by material, colour, vendor or price per kg; it fits inside a narrow table cell.

**Anatomy.** Trigger (swatch + name + chevron, 160px minimum) opens a Popover (320px; full-width sheet at 480px and below) with a search field and a listbox. Each option: swatch, name (500), "materiaal · leverancier" (`muted`), price per kg right-aligned. The selected option is `primary-tint`; the keyboard-active option has a 2px `focus-ring` outline. Last option "Geen spoel". Empty state: "Geen spoelen gevonden" with a link to Spoolman.

**Tokens.** `surface`, `border`, `shadow-md`, `primary-tint`, `primary-tint-soft`, `focus-ring`, `muted`.

**States.** Closed, open, option hover/active/selected, searching, empty, Spoolman unreachable (warning alert in the popover, manual entry offered).

**Accessibility.** Combobox pattern: input `role="combobox"` with `aria-controls`/`aria-activedescendant`; ArrowUp/Down move, Enter selects, Esc closes and returns focus to the trigger; typing filters immediately.

**Dutch copy.** Kies een spoel | Zoek op materiaal, kleur of leverancier | Geen spoelen gevonden | €/kg | Geen spoel

**Inline values (1.4).** The trigger uses `pp-minw-200 pp-start`; spool colours stay data (`--c1`, `--c2`).

**Where the panel goes (2.2, GAP-112).** This is the component the bug was measured on: 320x302 with 30 spools, opened at y=831 in a 900px window, 233px of it below the fold. The placement rule is Popover's, in full, and it is not optional — side, `--pp-pop-max`, sheet under 240px of room. The listbox is the scroll region: it keeps 240px as the height it prefers and shrinks below it when the panel is capped, so the search field stays visible and the page never scrolls to reveal the list; that is what the owner was missing when all they could see was the search field.
