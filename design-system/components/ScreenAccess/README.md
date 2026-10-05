Toegang (`/access`, admin only) grants each user access to klant folders.

**Anatomy.** Page title and the AccessMatrix (users as rows, klanten as columns, sticky first column and header, column and row bulk toggles in a menu). Admins show disabled checked boxes and the note "Admin heeft altijd toegang." Changes save immediately per cell with a brief tint; failures roll back with a toast. **Phone:** one card per user with a checkbox list of klanten. Access to a klant removes the 403 page for that user; a user without access gets "Geen toegang tot deze klant" when opening a link.

**Tokens.** AccessMatrix tokens, Card, Checkbox.

**States.** Loading, default, saving cell, error (revert + toast), empty (no users besides you).

**Accessibility.** See AccessMatrix.

**Dutch copy.** Toegang | Gebruiker | Admin heeft altijd toegang. | Alles selecteren | Niets selecteren
