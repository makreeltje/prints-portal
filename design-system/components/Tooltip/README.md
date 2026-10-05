Tooltip explains an icon-only button or a disabled action in one short line.

**Anatomy.** Inverted bubble (`text-strong` ground with `bg` text), 12px text, max 240px, appears after 400ms on hover and immediately on keyboard focus, never contains links or buttons.

**Tokens.** `text-strong`, `bg`, `shadow-md`, `radius-sm`.

**States.** Hidden, visible; dismiss with Esc.

**Accessibility.** Trigger gets `aria-describedby` pointing at the `role="tooltip"` bubble; never the only place an essential instruction lives.

**Dutch copy.** "Downloaden", "Telt niet mee in kosten", "Voeg eerst een printerprofiel toe voor stroomkosten."
