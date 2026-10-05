Toegang (`/access`, admin only) grants each user access to klant folders.

**Anatomy.** Page title and the AccessMatrix (users as rows, klanten as columns, sticky first column and header, column and row bulk toggles in a menu). Admin and Editor rows show disabled, checked boxes, "· Admin" or "· Editor" after the name and the note "Admin en Editor hebben altijd toegang." (Editors see every klant; only User rows can be changed; no grants are ever stored for Editors) Changes save immediately per cell with a brief tint; failures roll back with a toast. **Phone (480px and below):** table and cards are both in the DOM in the wrappers `pp-only-wide` and `pp-only-phone`; one card per user with a checkbox list of klanten (Admin and Editor cards are disabled and checked). Access to a klant removes the 403 page for that user; a user without access gets "Geen toegang tot deze klant" when opening a link.

**Tokens.** AccessMatrix tokens, Card, Checkbox.

**States.** Loading, default, saving cell, error (revert + toast), empty (no users besides you).

**Accessibility.** See AccessMatrix.

**Dutch copy.** Toegang | Gebruiker | Admin en Editor hebben altijd toegang. | Alles selecteren | Niets selecteren
