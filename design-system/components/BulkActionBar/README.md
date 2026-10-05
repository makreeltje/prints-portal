BulkActionBar appears when one or more prints are selected and offers actions for all of them.

**Anatomy.** Elevated bar (`surface`, `border-strong`, `shadow-lg`) with the count ("3 geselecteerd", 600), then buttons: Spoel toewijzen, Prijs instellen, Markeer als betaald, Tags (secondary) and Verwijderen (danger), plus a close button. Sticks to the bottom of the viewport at 480px and below; actions collapse into a "Acties" menu there. Destructive and mark-all actions open a ConfirmDialog naming the count.

**Tokens.** `surface`, `border-strong`, `shadow-lg`, `radius-lg`, button tokens.

**States.** Hidden (nothing selected), visible, busy (buttons disabled, spinner on the running action), error (toast and the selection stays).

**Accessibility.** Container is `role="region"` with `aria-label="Acties voor selectie"`; count is `aria-live="polite"`; Esc clears the selection.

**Dutch copy.** 3 geselecteerd | Spoel toewijzen | Prijs instellen | Markeer als betaald | Tags | Verwijderen | Selectie wissen
