SegmentedControl toggles between two to four exclusive views, mainly Kaarten and Lijst on the dashboard.

**Anatomy.** Pill track (`surface-2`) with buttons; selected segment is a `surface` pill with `shadow-sm`. Icons plus labels; labels collapse to icons at 480px and below (keep `aria-label`).

**Tokens.** `surface-2`, `surface`, `text-strong`, `muted`, `radius-pill`, `shadow-sm`.

**States.** Default, hover, selected, focus-visible, disabled.

**Accessibility.** Group is `role="group"` with `aria-label`; each button uses `aria-pressed`. The choice is remembered per user.

**Dutch copy.** Kaarten, Lijst, "Weergave".
