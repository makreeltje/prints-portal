# Sign-in, roles and access

Everything under `/api` needs a signed-in user unless a route is explicitly
public, so a new endpoint is never reachable by accident. The three public
ones are the sign-in endpoints, the OIDC redirects, and the Deel-link pages a
klant opens.

## Roles

| Role       | Sees                              | May change                                                                                       |
| ---------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Admin**  | everything                        | everything, plus roles, access, credit notes, restoring deleted prints and klanten, and the logo |
| **Editor** | every klant                       | prints, costs, prices, payments, invoices and Deel-links                                         |
| **User**   | only the klanten an Admin granted | nothing; the app is read-only for them                                                           |

Admins and Editors always see every klant; a User sees the folders granted
under **Toegang** and nothing else. That rule lives in one place in the code,
and every query, download and live update goes through it.

A User sees a print's name, status, thumbnail, 3D model and tags, plus the
customer price. They never see cost, margin, notes or file lists.

## Sessions

- A sign-in creates a server-side session and sets `pp_session`: `httpOnly`,
  `SameSite=Lax`, and `Secure` whenever the request arrived over HTTPS
  (directly or through a proxy named in `TRUSTED_PROXIES`).
- Sessions end after **60 minutes** of inactivity, and after **12 hours** in
  any case.
- Changing requests (anything but `GET`, `HEAD`, `OPTIONS`) must also send the
  session's CSRF token in the `X-CSRF-Token` header. The cookie's `SameSite`
  alone is not relied on.
- Signing out, a role change or a removed account closes the live connection
  as well.

## Local accounts

Without OIDC the portal uses local accounts.

- `ADMIN_EMAIL` and `ADMIN_PASSWORD` create the **first Admin**, only while no
  Admin exists. They are ignored afterwards and never reset a password.
- Passwords are hashed with **argon2id** and checked against a per-address
  rate limit (`RATE_LIMIT_LOGIN`, five attempts a minute by default).
- An Admin creates further accounts under **Gebruikers** and can set a
  temporary password; the person must replace it before they can use the app.
- People sign in with their name **or** e-mail address.

## OIDC (Authentik and others)

Setting all four `OIDC_*` variables switches local sign-in off and sends
everyone to the identity provider. The steps below use
[Authentik](https://goauthentik.io); any OpenID Connect provider that sends
`email` and `groups` works the same way.

### In Authentik

1. **Provider:** create an _OAuth2/OpenID Provider_.
   - Client type: **Confidential**.
   - Redirect URI (strict): `https://<portal address>/api/auth/oidc/callback`.
     Scheme, host and port must match `PUBLIC_URL` exactly.
   - Scopes: the defaults `openid`, `email` and `profile`, which is exactly
     what the portal asks for. Authentik's default `profile` mapping also
     sends the `groups` claim.
   - Signing key: any key (RS256).
2. **Application:** create one, link it to the provider, and note its slug.
3. **Admin group:** create a group (for example `prints-admins`) and add the
   people who should be Admin.
4. Every user needs an **e-mail address**; the portal identifies people by it
   and refuses a sign-in without one.

### In the portal's environment

```yaml
PUBLIC_URL: https://prints.example.com
OIDC_ISSUER: https://auth.example.com/application/o/prints-portal/
OIDC_CLIENT_ID: <Client ID from the provider>
OIDC_CLIENT_SECRET: <Client Secret from the provider>
OIDC_ADMIN_GROUP: prints-admins
```

The sign-in uses the authorization code flow with **PKCE**, and the state and
nonce are checked on the way back. The short-lived flow cookie is signed and
`httpOnly`.

### Roles from the provider

- Members of `OIDC_ADMIN_GROUP` become **Admin** at every sign-in.
- Someone removed from that group drops back to **User** at their next
  sign-in, unless an Admin gave them a role by hand.
- Everyone else starts as **User** and sees only what an Admin grants.

### When it does not work

- The app refuses to start when only some of the four variables are set, or
  when `PUBLIC_URL` is missing while OIDC is on.
- `<OIDC_ISSUER>.well-known/openid-configuration` should return JSON in a
  browser. A trailing slash in the issuer matters.
- Behind a reverse proxy, set `TRUSTED_PROXIES`, or the redirect is built
  over `http` and the provider refuses it.

## Deel-links

A Deel-link is a read-only page for one klant that needs no sign-in.

- The link holds 32 random bytes. Only its **SHA-256 is stored**, so the
  database cannot hand out working links, and the app shows the full link
  exactly once, right after creating it.
- It expires after 7, 30 or 90 days, or never, and can be revoked at any time.
- An unknown, malformed, expired or revoked link all get the **same** page, so
  a visitor cannot tell them apart.
- The page shows the customer price and status per order, never cost, margin,
  grams, file names or any other klant.
- Public requests are rate-limited per address (`RATE_LIMIT_SHARE`), and the
  token is masked in the server log.
