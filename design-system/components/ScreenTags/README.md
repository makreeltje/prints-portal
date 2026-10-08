Tags (`/tags`) lists every tag with its colour and print count, and lets Admins and Editors rename, recolour, create and delete tags. Users do not see the page or its nav item.

**Anatomy.** **Header:** `<h1>` "Tags" and primary "Tag maken". **List** (`.pp-tagrow` inside `.pp-taggrid` in a `pp-card pp-flush`): TagChip, count "{n} prints", icon buttons "bewerken" (pencil) and "verwijderen" (trash). **Edit row** (`.pp-tagrow.edit`, in place): FormField "Naam" (max 64 characters), palette `.pp-pal` (10 colours plus "Geen kleur"), "Opslaan" and "Annuleren". Errors: "Deze tag bestaat al." (case-insensitive) and "Een tag mag maximaal 64 tekens hebben." Deleting asks the ConfirmDialog "Tag verwijderen?" and removes the tag from every print. Empty state: "Nog geen tags." with the create button. **Phone:** one column; the count wraps under the chip; controls 44px.

**Tokens.** `surface`, `border`, `tag-*`, Button, FormField, TagChip tokens. Classes: `pp-tagrow`, `pp-pal`.

**States.** Default, editing, name exists, too long, deleting (dialog), empty, saving.

**Accessibility.** Icon buttons carry `aria-label`; the palette is a `radiogroup` with `aria-checked`; errors are linked with `aria-describedby`; chip text uses `#141a33` or `#ffffff` per contrast.

**Dutch copy.** Tags | Tag maken | Tag bewerken | Tag verwijderen? | Naam | Kleur | Geen kleur | Opslaan | Annuleren | Deze tag bestaat al. | Een tag mag maximaal 64 tekens hebben. | Nog geen tags.

**2.0.** (2026-10-08) **The page used a tenth of its width (GAP-101, resolved).** One tag row is a chip, a count and two icon buttons — about 300px of content stretched across 1100px, eleven times.

The answer is not to stretch it further and not to leave it: **a page of short rows lays them out in columns up to a 1080px measure.** The list card (`pp-card pp-flush`, capped with `pp-w-1080`) holds `.pp-taggrid`: `repeat(auto-fill, minmax(300px, 1fr))`, so 1 column at 360px, 2 at 768px, 3 at 1080px and no more. Rows keep their bottom hairline and gain a right hairline; the grid's `margin-right:-1px` under the card's `overflow:hidden` clips the last column's, so the columns read as a divided table instead of a list with a stray line. The **edit row spans every column** (`grid-column:1/-1`) and loses its right hairline, so editing a tag never shifts its neighbours.

The same rule gives Instellingen its two columns; see ScreenSettings.

**To measure (owner):** how many tags the real library has. At 7 tags a three-column grid is two and a half rows, which is fine; at 2 tags it is one row with a gap, which is also fine. If the normal number is under 4 I would rather cap the card at 560px and leave the width empty on purpose — tell me the count and I will choose.
