AccessMatrix grants each user access to customer folders; users are rows, klanten are columns.

**Anatomy.** Table with sticky first column and sticky header inside a scroll container. Each cell is a Checkbox (44px hit area). Column and row headers have a "Alles/Niets" bulk toggle in their menu. At 480px and below it switches to one card per user with a list of klant checkboxes. Admins have all access and show disabled checked boxes with the note "Admin heeft altijd toegang".

**Tokens.** `surface`, `surface-2`, `border`, checkbox tokens.

**States.** Default, saving (cell busy), saved (brief tint), error (revert and toast), admin row (disabled).

**Accessibility.** `<th scope="col">`/`scope="row"`; each checkbox has a label "<gebruiker>: <klant>"; arrow keys move between cells.

**Dutch copy.** Toegang | Gebruiker | Alles selecteren | Niets selecteren | Admin heeft altijd toegang.
