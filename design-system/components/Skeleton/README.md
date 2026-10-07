Skeleton holds the layout while data loads; match the shape of the content it replaces.

**Anatomy.** Rounded blocks in `skeleton` with a slow opacity pulse. Provide card, row and text-line variants at the same size as the real content so nothing jumps.

**Tokens.** `skeleton`, `radius-sm`, `surface`.

**States.** Pulsing; static under `prefers-reduced-motion`. Show after 200ms of waiting, remove as soon as data arrives.

**Accessibility.** Container carries `aria-busy="true"`; skeleton blocks are `aria-hidden`; announce "Laden…" with a visually hidden status.

**Dutch copy.** "Prints laden…"

**Inline values (1.5).** Placeholders use `pp-skel` with the heights `pp-h12`, `pp-h14`, `pp-h16` and the width as the data property `--w` (class `pp-vw`); the thumbnail uses `pp-ratio-43 pp-r0`.
