AccessMatrix grants each user access to customer folders; users are rows, klanten are columns.

**Anatomy.** Table with sticky first column and sticky header inside a scroll container. Each cell is a Checkbox (44px hit area). Column and row headers have a "Alles/Niets" bulk toggle in their menu. At 480px and below it switches to one card per user with a list of klant checkboxes. Admins and Editors have all access: their rows show disabled, checked boxes, "· Admin" or "· Editor" after the name, and the note "Admin en Editor hebben altijd toegang." Only User rows can be changed.

**Tokens.** `surface`, `surface-2`, `border`, checkbox tokens.

**States.** Default, saving (cell busy), saved (brief tint), error (revert and toast), Admin or Editor row (disabled, checked).

**Accessibility.** `<th scope="col">`/`scope="row"`; each checkbox has a label "<gebruiker>: <klant>"; arrow keys move between cells.

**Dutch copy.** Toegang | Gebruiker | Alles selecteren | Niets selecteren | Admin en Editor hebben altijd toegang.

**1.7.** (2026-10-07) **Empty state (GAP-058, resolved as built).** When no account has the role User, the matrix is not drawn (a single Admin row with every box checked and disabled reads as broken). It is replaced by the EmptyState: title **"Nog geen gebruikers om toegang te geven"**, sentence **"Alleen Admins en Editors bestaan nu; zij zien altijd elke klant."** and the link "Naar Gebruikers" (`pp-link`). The help line `access.allAccessRoles` ("Admin en Editor hebben altijd toegang.") stays above it. Copy keys `access.empty.title`, `access.empty.body`, `access.empty.link`. Same on phone: the EmptyState takes the width of the page, no cards are drawn. Accessibility: the title is a heading, the link is a real link, the illustration is `aria-hidden`.

**2.0.** (2026-10-08) **The column menu is painted over by the sticky column (GAP-098, resolved).** Measured at 1360px: the leftmost column menu spans x=364–504 while the sticky user column ends at x=410, so 46px of the panel disappeared and the items read "s selecteren". The scroll box does not clip it and `z-popover` (30) is far above `z-raised` (1) — which is the point: **a z-index is only compared inside its own stacking context.** The popover's z-index is compared against its sibling cells' contents, while the sticky cell, being positioned with a z-index of its own, wins over the whole unpositioned cell the popover lives in. Raising the popover cannot help; the **cell** has to be raised.

Rule, and it holds for any sticky table: **the cell that holds an open popover carries the class `has-pop` while it is open.** `.pp-matrix th.has-pop,.pp-matrix td.has-pop{z-index:var(--z-popover)}` (a body cell also gets `position:relative`; a `thead th` is already sticky, so it only needs the z-index). The app adds the class when it opens the menu and removes it when it closes — it still chooses no number, only a class, as README's stacking rule requires. The menu then paints over the sticky user column, which is what a menu should do.

The row menus on the sticky first column need the same class; so does any future popover inside `.pp-scroll` on a table with sticky cells.

**Accessible name of the column menu.** "Kolomacties voor {klant}" (key `access.colMenu`), so two menus on one screen are told apart; the items stay "Alles selecteren" and "Niets selecteren".

**The user name is not a target (GAP-099, merged into GAP-091 and resolved there).** The first column was `text-strong` at weight 500, which in every table in this system means "this cell opens something" (`.pp-table td.name`). It opens nothing. It is now `color: var(--text)` with `cursor: default` and no hover; the row's menu button is the only control in the cell. The rule is in README under *Targets*.

**Dutch copy (new).** Kolomacties voor {klant}
