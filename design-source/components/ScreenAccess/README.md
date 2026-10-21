Toegang (`/access`, admin only) grants each user access to klant folders.

**Anatomy.** Page title and the AccessMatrix (users as rows, klanten as columns, sticky first column and header, column and row bulk toggles in a menu). Admin and Editor rows show disabled, checked boxes, "· Admin" or "· Editor" after the name and the note "Admin en Editor hebben altijd toegang." (Editors see every klant; only User rows can be changed; no grants are ever stored for Editors) Changes save immediately per cell with a brief tint; failures roll back with a toast. **Phone (480px and below):** table and cards are both in the DOM in the wrappers `pp-only-wide` and `pp-only-phone`; one card per user with a checkbox list of klanten (Admin and Editor cards are disabled and checked). Access to a klant removes the 403 page for that user; a user without access gets "Geen toegang tot deze klant" when opening a link.

**Tokens.** AccessMatrix tokens, Card, Checkbox.

**States.** Loading, default, saving cell, error (revert + toast), empty (no users besides you).

**Accessibility.** See AccessMatrix.

**Dutch copy.** Toegang | Gebruiker | Admin en Editor hebben altijd toegang. | Alles selecteren | Niets selecteren

**1.7.** (2026-10-07) **Empty state (GAP-058).** With no User accounts the page shows the help line and the EmptyState of AccessMatrix instead of the matrix; see AccessMatrix. States line: loading, default, saving cell, error (revert and toast), empty (no accounts with the role User).

**2.0.** (2026-10-08) **GAP-098 and GAP-099**, both in AccessMatrix: the cell that holds an open column or row menu carries `has-pop` so the menu paints over the sticky user column, and the user name is `text` with `cursor: default` because it opens nothing. The preview draws the page at 1360px with the leftmost column menu open over the sticky column, which is the case that was broken.

**To measure (owner):** after the change, the left edge of the open panel and the right edge of the sticky column at 1360px again — I expect the full 140px panel to be visible and the items to read "Alles selecteren". If any of it is still cut off, the scroll box *is* clipping it and the answer is a different one (a portal), so tell me and I will redesign it.
