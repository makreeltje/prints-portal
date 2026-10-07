TokenReveal shows the full Deel-link URL exactly once, right after it is created.

**Anatomy.** Dialog body with a `success` alert ("Deel-link gemaakt"), the URL in a `mono` box with a Kopiëren button (changes to "Gekopieerd" with a check for 2 seconds), a hint "Deel via WhatsApp of mail", and a prominent `warning` alert: "Deze link zie je maar één keer. Kopieer hem nu." Closing without copying asks for confirmation.

**Tokens.** `surface-2`, `border-strong`, `font-mono`, `warning-tint`, `paid-tint`.

**States.** Default, copied, copy failed (select the text and say "Selecteer en kopieer handmatig").

**Accessibility.** URL box is a focusable, selectable `<code>`; copy result announced via `role="status"`; warning is text plus icon.

**Dutch copy.** Deel-link gemaakt | Kopiëren | Gekopieerd | Deel via WhatsApp of mail | Deze link zie je maar één keer. Kopieer hem nu.

**1.6.** (2026-10-07) **Close without copying (GAP-050), confirmed as built.** Closing the dialog with Sluiten, Esc or the backdrop before "Kopiëren" has succeeded opens a ConfirmDialog (`pp-dialog sm`, `role="alertdialog"`, title `aria-labelledby`, body `aria-describedby`) titled **"Sluiten zonder kopiëren?"** with the body **"Je ziet deze link daarna niet meer. Je kunt hem wel intrekken en een nieuwe maken."** and the buttons **"Terug"** (secondary, focused first, returns to the token) and **"Sluiten"** (primary, not destructive: the link stays valid, it is only no longer visible). Once the copy succeeded, or a manual copy was chosen, closing needs no confirmation. Copy keys: `share.closeUncopied`, `share.closeUncopiedBody`, `common.back`. Dark and light follow the ConfirmDialog tokens; at 360px the footer buttons stack (Sluiten above Terug).
