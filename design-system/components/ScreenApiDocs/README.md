API-docs (`/api-docs`) is the app frame around the embedded Swagger UI.

**Anatomy.** Standard page header "API-docs" and one card that holds the Swagger UI iframe or container with the full remaining height. The Swagger styles are overridden with the tokens: `surface` ground, `border` rules, `text`/`text-strong` text, method badges in the tint colours (GET `info`, POST `paid`, PUT `warning`, DELETE `unpaid`), `font-mono` for paths and `primary` for the Authorize button. The theme follows the app theme. The operations shown here are illustrative; the real list comes from the API. **Phone:** the card fills the width; paths wrap.

**Tokens.** `surface`, `surface-2`, `border`, `font-mono`, badge tokens.

**States.** Loading (Skeleton), loaded, error ("API-docs konden niet worden geladen" with Opnieuw proberen).

**Accessibility.** The embedded UI keeps its own semantics; the frame has a title "API-docs".

**Dutch copy.** API-docs | API-docs konden niet worden geladen.

**1.6.** (2026-10-07) **Inline values removed.** Classes replace every `style`: `.pp-api-head` (title row: `space-3` padding and gap, `surface-2`, bottom rule), `.pp-api-row` (operation row: `space-2` by `space-3` padding, `space-3` gap, bottom rule except the last row, no wrap on desktop) and `.pp-method` (method badge: 72px minimum so GET, PUT, POST and DELETE line up, centred, `font-mono`). The old row padding of 10px is now `space-2` (8px); the old 56px badge width grew to 72px so DELETE no longer pushes the path. **Phone.** At 480px and below a row wraps: badge and path on the first line, the description (`pp-push` reset) on the second. **Loading.** Skeleton rows with `aria-busy="true"` and a visually hidden "Laden…". **Error.** `.pp-state.is-inline` inside the card: "API-docs konden niet worden geladen", "De Swagger UI kon niet worden opgehaald. Probeer het opnieuw." and the button "Opnieuw proberen". **Tablet.** The card fills the width of the content column; operation rows stay on one line from 601px.
