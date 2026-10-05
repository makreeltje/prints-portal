Login (`/login`) offers local e-mail and password and, when configured, "Inloggen met Authentik" (OIDC).

**Anatomy.** Single centred card (max 380px, `surface`, `radius-lg`) on `bg`: studio name or logo, heading "Inloggen", FormFields E-mailadres and Wachtwoord, primary button "Inloggen" (full width), a "of" divider and the secondary button "Inloggen met Authentik". Only the methods that are configured are rendered: with OIDC only, the form is replaced by the Authentik button; with local only, the divider and Authentik button are omitted. **Errors:** wrong credentials show an `unpaid` alert above the form and keep the e-mail address; HTTP 429 shows a `warning` alert with a clock icon and disables the submit button until the minute has passed. On phones the card is full width with `space-4` margins and 44px controls.

**Tokens.** `bg`, `surface`, `border`, Button, FormField, Toast/Alert tokens.

**States.** Default, submitting (spinner), wrong credentials, too many attempts, Authentik redirecting ("Doorsturen naar Authentik…").

**Accessibility.** Autofocus the e-mail field; errors use `role="alert"`; the password field has `autocomplete="current-password"`; Enter submits.

**Dutch copy.** Inloggen | E-mailadres | Wachtwoord | of | Inloggen met Authentik | Verkeerd e-mailadres of wachtwoord. | Te veel pogingen, probeer het over een minuut opnieuw. | Doorsturen naar Authentik…
