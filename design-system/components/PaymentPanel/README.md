PaymentPanel sets the Verkoopprijs and records payment for one print.

**Anatomy.** Card with two sections. Prijs: NumberInput "Verkoopprijs" (`€` prefix), the button "Voorstel uit marge (400%)" showing the markup percentage and the resulting amount, and Opslaan. Betaling: NumberInput "Betaald bedrag" and the primary button "Markeer als betaald". Paid state replaces the second section with a summary: Betaald badge, amount and date, and a ghost "Betaling ongedaan maken". An unsaved suggested price shows the "voorgesteld" hint until saved.

**Tokens.** `surface`, `border`, `heading-lg`, `paid`, `paid-tint`, `info`, button and input tokens.

**States.** Unpaid with suggestion, unpaid with saved price, saving, paid, missing cost (suggestion disabled with a tooltip "Kosten ontbreken"), error (inline alert, values kept).

**Accessibility.** Each input has a label; the suggestion result is announced with `aria-live="polite"`; destructive undo asks for confirmation.

**Dutch copy.** Verkoopprijs | Voorstel uit marge (400%) | Opslaan | Betaald bedrag | Markeer als betaald | Betaald op 5 okt 2026 | Betaling ongedaan maken
