NabestellingDialog creates a Nabestelling: the owner ticks which files (or 3MF plates) belong to it and how often each is printed in this order.

**Anatomy.** Dialog (`pp-dialog`, 440px; a bottom sheet at 480px and below) with title "Nabestelling maken", the intro "Kies de bestanden voor deze nabestelling en hoe vaak ze worden geprint.", then two groups of `.pp-pick` rows: **Nog niet in een bestelling** (new files, ticked by default) and **Eerder besteld** (files that are already in another order; the same file may be reprinted, so it can be ticked again). A `.pp-pick` row is a checkbox, the file name (mono, ellipsis) and the NumberInput "Aantal keer geprint" (1 or more; the input is only active when the row is ticked). Footer: Annuleren and the primary "Nabestelling maken". With nothing ticked the button is `aria-disabled` and a `unpaid` alert "Kies minstens één bestand." appears. The new order gets the next number and the date of today. Files stay in the same project folder. **Delete:** a small ConfirmDialog "Nabestelling {n} verwijderen?" (`pp-dialog sm`, danger button) with the sentence "De bestanden gaan terug naar "Niet in een bestelling". De nabestelling heeft geen betaling of afschrijving."

**Tokens.** Dialog, FormField, NumberInput, Checkbox, Alert tokens. Classes `pp-pick`, `pp-qty`.

**States.** Default, nothing ticked (error), saving (spinner), failed (inline alert), delete confirmation.

**Accessibility.** `role="dialog"`, focus on the first checkbox; the group labels are headings of their group (`role="group"` with `aria-labelledby`); each quantity field has an `aria-label`; Esc cancels.

**Dutch copy.** Nabestelling maken | Kies de bestanden voor deze nabestelling en hoe vaak ze worden geprint. | Nog niet in een bestelling | Eerder besteld | Aantal keer geprint | Kies minstens één bestand. | Nabestelling {n} verwijderen? | De bestanden gaan terug naar "Niet in een bestelling". De nabestelling heeft geen betaling of afschrijving.
