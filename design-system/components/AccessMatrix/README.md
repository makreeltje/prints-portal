AccessMatrix grants each user access to customer folders; users are rows, klanten are columns.

**Anatomy.** Table with sticky first column and sticky header inside a scroll container. Each cell is a Checkbox (44px hit area). Column and row headers have a "Alles/Niets" bulk toggle in their menu. At 480px and below it switches to one card per user with a list of klant checkboxes. Admins and Editors have all access: their rows show disabled, checked boxes, "· Admin" or "· Editor" after the name, and the note "Admin en Editor hebben altijd toegang." Only User rows can be changed.

**Tokens.** `surface`, `surface-2`, `border`, checkbox tokens.

**States.** Default, saving (cell busy), saved (brief tint), error (revert and toast), Admin or Editor row (disabled, checked).

**Accessibility.** `<th scope="col">`/`scope="row"`; each checkbox has a label "<gebruiker>: <klant>"; arrow keys move between cells.

**Dutch copy.** Toegang | Gebruiker | Alles selecteren | Niets selecteren | Admin en Editor hebben altijd toegang.

**1.7.** (2026-10-07) **Empty state (GAP-058, resolved as built).** When no account has the role User, the matrix is not drawn (a single Admin row with every box checked and disabled reads as broken). It is replaced by the EmptyState: title **"Nog geen gebruikers om toegang te geven"**, sentence **"Alleen Admins en Editors bestaan nu; zij zien altijd elke klant."** and the link "Naar Gebruikers" (`pp-link`). The help line `access.allAccessRoles` ("Admin en Editor hebben altijd toegang.") stays above it. Copy keys `access.empty.title`, `access.empty.body`, `access.empty.link`. Same on phone: the EmptyState takes the width of the page, no cards are drawn. Accessibility: the title is a heading, the link is a real link, the illustration is `aria-hidden`.
