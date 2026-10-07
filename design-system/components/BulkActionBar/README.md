BulkActionBar appears when one or more prints are selected and offers actions for all of them.

**Anatomy.** Elevated bar (`surface`, `border-strong`, `shadow-lg`) with the count ("3 geselecteerd", 600), then buttons: Spoel toewijzen, Prijs instellen, Markeer als betaald, Tags (secondary) and Verwijderen (danger), plus a close button. Sticks to the bottom of the viewport at 480px and below; actions collapse into a "Acties" menu there. Destructive and mark-all actions open a ConfirmDialog naming the count.

**Tokens.** `surface`, `border-strong`, `shadow-lg`, `radius-lg`, button tokens.

**States.** Hidden (nothing selected), visible, busy (buttons disabled, spinner on the running action), error (toast and the selection stays).

**Accessibility.** Container is `role="region"` with `aria-label="Acties voor selectie"`; count is `aria-live="polite"`; Esc clears the selection.

**Dutch copy.** 3 geselecteerd | Spoel toewijzen | Prijs instellen | Markeer als betaald | Tags | Verwijderen | Selectie wissen

**1.4.** "Spoel toewijzen" opens the spool dialog and "Prijs instellen" the price dialog (see BulkDialogs); "Tags" opens the tag editor popover with tri-state rows (all, some or none of the selected prints carry the tag); results per print follow the same pattern as BulkDialogs (toast plus alert with reasons).

**Menu (1.5).** The "Acties" menu on phones opens as a bottom sheet even when the anchor has `.up`.

**1.9.** (2026-10-07) **Sticky at every width (GAP-069, resolved).** The bar sticks to the bottom of the viewport on every width, not only at 480px and below: `position: sticky; bottom: var(--space-4)` with `z-index: var(--z-sticky)` on tablet and desktop (it floats 16px above the bottom edge, keeping its `shadow-lg` and `border-strong`), and flush to the bottom with rounded top corners at 480px and below as before. It sits as the last child of the page content, so it ends where the list ends and never covers the footer. Selecting a print at the top of a 2700px dashboard keeps the actions in sight. It is hidden when nothing is selected. Dialogs and drawers (`z-overlay`) cover it.
