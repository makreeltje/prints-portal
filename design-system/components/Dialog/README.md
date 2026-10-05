Dialog is a modal window for a focused task such as creating a Deel-link or exporting a Factuur.

**Anatomy.** Scrim (`overlay`), panel (`surface`, `radius-xl`, `shadow-lg`, max 440px; 560px for forms), header with title and close button, body, footer with actions right-aligned (primary last). At 480px and below it becomes a full-height sheet pinned to the bottom.

**Tokens.** `overlay`, `surface`, `border`, `shadow-lg`, `radius-xl`, `space-5`, `heading-lg`.

**States.** Opening and closing fade with `motion-base`; body scrolls inside the panel; loading state disables the footer buttons and shows a spinner on the primary one.

**Accessibility.** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` the title; trap focus; Esc closes (unless a request is running); return focus to the trigger; lock page scroll.

**Dutch copy.** Deel-link maken, Label, Verloopt, Maken, Annuleren.
