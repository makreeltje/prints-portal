ConfirmDialog confirms a destructive or irreversible action and always names the object.

**Anatomy.** A small Dialog (`pp-dialog sm`, 380px; the plain `pp-dialog` is 440px): question title that names the object, one sentence on the consequence, Annuleren (secondary, initial focus) and the confirm button. Destructive actions use `pp-btn-danger-solid` and an alert icon; non-destructive but irreversible steps ("Definitief maken") use the primary button and name customer, number of prints and amount. Used for: print verwijderen, Deel-link intrekken, Gebruiker verwijderen ("Deze gebruiker kan daarna niet meer inloggen."), Klant verwijderen ("Alle {count} prints van deze klant worden verborgen. De financiële gegevens blijven bewaard en een beheerder kan de klant herstellen."), Tag verwijderen ("De tag wordt van {count} prints verwijderd. De prints zelf blijven bestaan."), Alles als betaald, Betaling ongedaan maken, Afschrijving ongedaan maken, Definitief maken, Creditnota maken.

**Tokens.** Dialog tokens plus `unpaid`, `unpaid-tint`, `primary`.

**States.** Default and loading (confirm shows a spinner, both buttons disabled). On failure close nothing; show an inline error alert in the body.

**Accessibility.** `role="alertdialog"` for destructive confirms, initial focus on the safe button (Annuleren), description linked with `aria-describedby`.

**Dutch copy.** Print 'Bloembak clips' verwijderen? | Verwijderen verbergt de print, maar bewaart de financiële gegevens. | Afschrijving ongedaan maken? | De afgeschreven € 6,89 van 'Bloembak clips' staat daarna weer open. | Betaling ongedaan maken? | Definitief maken? | Je maakt een factuur voor Koen met 5 prints, totaal € 47,56. De factuur krijgt nummer 2026-008 en de regels worden vergrendeld. | Gebruiker 'helper' verwijderen? | Deze gebruiker kan daarna niet meer inloggen. | Klant 'Koen' verwijderen? | Alle 12 prints van deze klant worden verborgen. De financiële gegevens blijven bewaard en een beheerder kan de klant herstellen. | Tag 'cadeau' verwijderen? | De tag wordt van 3 prints verwijderd. De prints zelf blijven bestaan.

**1.4.** The copy deck (`copy-deck.md`) is the only source for these texts; the examples in this README are copied from it. New confirmations: Nabestelling {n} verwijderen? (see NabestellingDialog), Printer '{naam}' verwijderen? ("De stroomkosten van prints op deze printer worden daarna niet meer meegerekend.").
