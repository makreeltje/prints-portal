ErrorState tells the user that loading failed and offers a retry; it never shows raw server errors.

**Anatomy.** Panel in `unpaid-tint` with an alert icon, title, one sentence of cause and a primary "Opnieuw proberen" button. A technical detail line (`mono`, collapsed) is optional for admins.

**Tokens.** `unpaid`, `unpaid-tint`, `text-strong`, `radius-lg`.

**States.** Default and retrying (button spinner, aria-busy).

**Accessibility.** `role="alert"` when it replaces content; focus moves to the heading.

**Dutch copy.** Er ging iets mis | We konden de prints niet laden. Probeer het opnieuw. [Opnieuw proberen] | Geen toegang tot deze klant.
