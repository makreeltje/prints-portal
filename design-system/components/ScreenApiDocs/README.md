API-docs (`/api-docs`) is the app frame around the embedded Swagger UI.

**Anatomy.** Standard page header "API-docs" and one card that holds the Swagger UI iframe or container with the full remaining height. The Swagger styles are overridden with the tokens: `surface` ground, `border` rules, `text`/`text-strong` text, method badges in the tint colours (GET `info`, POST `paid`, PUT `warning`, DELETE `unpaid`), `font-mono` for paths and `primary` for the Authorize button. The theme follows the app theme. The operations shown here are illustrative; the real list comes from the API. **Phone:** the card fills the width; paths wrap.

**Tokens.** `surface`, `surface-2`, `border`, `font-mono`, badge tokens.

**States.** Loading (Skeleton), loaded, error ("API-docs konden niet worden geladen" with Opnieuw proberen).

**Accessibility.** The embedded UI keeps its own semantics; the frame has a title "API-docs".

**Dutch copy.** API-docs | API-docs konden niet worden geladen.
