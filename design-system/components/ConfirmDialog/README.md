ConfirmDialog confirms a destructive or irreversible action and always names the object.

**Anatomy.** A small Dialog: alert icon, question title that names the object, one sentence on the consequence, Annuleren (secondary, initial focus) and the confirm button in `pp-btn-danger-solid`. Non-destructive confirms use the primary button.

**Tokens.** Dialog tokens plus `unpaid`, `unpaid-tint`.

**States.** Default and loading (confirm shows a spinner, both buttons disabled). On failure close nothing, show an inline error alert in the body.

**Accessibility.** `role="alertdialog"`, initial focus on the safe button (Annuleren), description linked with `aria-describedby`.

**Dutch copy.** Print 'Babybox locks' verwijderen? | Verwijderen verbergt de print, maar bewaart de financiële gegevens. | Deel-link 'Q2 overzicht' intrekken? | Alles als betaald markeren voor Joey (12 prints)? | Afschrijven (€ 11,89)?
