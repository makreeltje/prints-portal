# prints-portal

A self-hosted portal for 3D prints: it indexes a prints folder, tracks costs, payments and invoices per klant, and shares prints with customers. Configuration, local development and Docker are described in [DEVELOPMENT.md](DEVELOPMENT.md).

## Sign-in with Authentik (OIDC)

Without OIDC the portal uses local accounts (`ADMIN_EMAIL` / `ADMIN_PASSWORD` create the first Admin). With all four `OIDC_*` variables set, local login turns off and everyone signs in through the identity provider. These steps use [Authentik](https://goauthentik.io); any OpenID Connect provider that sends `email` and `groups` works the same way.

### In Authentik

1. **Provider:** create an _OAuth2/OpenID Provider_.
   - Client type: **Confidential**.
   - Redirect URI (strict): `https://<portal address>/api/auth/oidc/callback`. Scheme, host and port must match `PUBLIC_URL` exactly.
   - Scopes: keep the defaults `openid`, `email` and `profile` (the portal asks for exactly these). Authentik's default `profile` mapping also sends the `groups` claim.
   - Signing key: any key (RS256).
2. **Application:** create one, link it to the provider and note its **slug** (for example `prints-portal`).
3. **Admin group:** create a group (for example `prints-admins`) and add the people who should be Admin.
4. Every user needs an **e-mail address** in Authentik; the portal identifies people by it and refuses a sign-in without one.

### In the portal's environment

```yaml
PUBLIC_URL: https://prints.example.com # the address people open; no path, no trailing slash
OIDC_ISSUER: https://auth.example.com/application/o/prints-portal/ # "OpenID Configuration Issuer" on the provider page
OIDC_CLIENT_ID: <Client ID from the provider>
OIDC_CLIENT_SECRET: <Client Secret from the provider>
OIDC_ADMIN_GROUP: prints-admins # exact group name
```

- The portal does not start when only some of the four `OIDC_*` variables are set, or when `PUBLIC_URL` is missing while OIDC is on.
- Check the issuer: `<OIDC_ISSUER>.well-known/openid-configuration` should return JSON in a browser.
- Behind a reverse proxy, also set `TRUSTED_PROXIES` (for example `uniquelocal`), so the session cookie is marked secure over HTTPS.

### Roles

- Members of `OIDC_ADMIN_GROUP` become **Admin** at every sign-in. Someone removed from the group goes back to **User** at the next sign-in, unless an Admin gave them a role by hand.
- Everyone else starts as **User** and sees only the klanten an Admin grants under **Toegang**. An Admin can make someone **Editor** under **Gebruikers**.
