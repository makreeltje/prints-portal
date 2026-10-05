TokenReveal shows the full Deel-link URL exactly once, right after it is created.

**Anatomy.** Dialog body with a `success` alert ("Deel-link gemaakt"), the URL in a `mono` box with a Kopiëren button (changes to "Gekopieerd" with a check for 2 seconds), a hint "Deel via WhatsApp of mail", and a prominent `warning` alert: "Deze link zie je maar één keer. Kopieer hem nu." Closing without copying asks for confirmation.

**Tokens.** `surface-2`, `border-strong`, `font-mono`, `warning-tint`, `paid-tint`.

**States.** Default, copied, copy failed (select the text and say "Selecteer en kopieer handmatig").

**Accessibility.** URL box is a focusable, selectable `<code>`; copy result announced via `role="status"`; warning is text plus icon.

**Dutch copy.** Deel-link gemaakt | Kopiëren | Gekopieerd | Deel via WhatsApp of mail | Deze link zie je maar één keer. Kopieer hem nu.
