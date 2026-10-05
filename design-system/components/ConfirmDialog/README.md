ConfirmDialog confirms a destructive or irreversible action and always names the object.

**Anatomy.** A small Dialog: question title that names the object, one sentence on the consequence, Annuleren (secondary, initial focus) and the confirm button. Destructive actions use `pp-btn-danger-solid` and an alert icon; non-destructive but irreversible steps ("Definitief maken") use the primary button and name customer, number of prints and amount. Used for: print verwijderen, Deel-link intrekken, Gebruiker verwijderen, Alles als betaald, Betaling ongedaan maken, Afschrijving ongedaan maken, Definitief maken, Creditnota maken.

**Tokens.** Dialog tokens plus `unpaid`, `unpaid-tint`, `primary`.

**States.** Default and loading (confirm shows a spinner, both buttons disabled). On failure close nothing; show an inline error alert in the body.

**Accessibility.** `role="alertdialog"` for destructive confirms, initial focus on the safe button (Annuleren), description linked with `aria-describedby`.

**Dutch copy.** Print 'Babybox locks' verwijderen? | Verwijderen verbergt de print, maar bewaart de financiële gegevens. | Afschrijving ongedaan maken? | De afgeschreven € 6,89 van 'Babybox locks' staat daarna weer open. | Betaling ongedaan maken? | Definitief maken? | Je maakt een factuur voor Joey met 5 prints, totaal € 47,56. De factuur krijgt nummer 2026-008 en de regels worden vergrendeld.
