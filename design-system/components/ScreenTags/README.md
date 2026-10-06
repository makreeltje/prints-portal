Tags (`/tags`) lists every tag with its colour and print count, and lets Admins and Editors rename, recolour, create and delete tags. Users do not see the page or its nav item.

**Anatomy.** **Header:** `<h1>` "Tags" and primary "Tag maken". **List** (`.pp-tagrow` in a card): TagChip, count "{n} prints", icon buttons "bewerken" (pencil) and "verwijderen" (trash). **Edit row** (`.pp-tagrow.edit`, in place): FormField "Naam" (max 64 characters), palette `.pp-pal` (10 colours plus "Geen kleur"), "Opslaan" and "Annuleren". Errors: "Deze tag bestaat al." (case-insensitive) and "Een tag mag maximaal 64 tekens hebben." Deleting asks the ConfirmDialog "Tag verwijderen?" and removes the tag from every print. Empty state: "Nog geen tags." with the create button. **Phone:** one column; the count wraps under the chip; controls 44px.

**Tokens.** `surface`, `border`, `tag-*`, Button, FormField, TagChip tokens. Classes: `pp-tagrow`, `pp-pal`.

**States.** Default, editing, name exists, too long, deleting (dialog), empty, saving.

**Accessibility.** Icon buttons carry `aria-label`; the palette is a `radiogroup` with `aria-checked`; errors are linked with `aria-describedby`; chip text uses `#141a33` or `#ffffff` per contrast.

**Dutch copy.** Tags | Tag maken | Tag bewerken | Tag verwijderen? | Naam | Kleur | Geen kleur | Opslaan | Annuleren | Deze tag bestaat al. | Een tag mag maximaal 64 tekens hebben. | Nog geen tags.
