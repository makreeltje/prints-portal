# Security

What the portal protects, how, and what is known to be imperfect. The app is
meant to run on a home network or behind a reverse proxy with HTTPS, with a
handful of accounts and one public surface: the Deel-links.

## How access is decided

- Every `/api` route needs a signed-in user unless it is explicitly public, so
  a new endpoint is never reachable by accident. The public ones are sign-in,
  the OIDC redirects and the Deel-link pages.
- **One module decides which klant a person may see** (`auth/access.ts`), and
  every list, detail, download and live event goes through it. The WebSocket
  hub filters each event by the viewer's scope and re-reads that scope when
  grants change, so a revoked grant takes effect on open tabs.
- Roles and sessions are described in [AUTH.md](AUTH.md).

## The measures in place

| Area         | What is done                                                                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Passwords    | argon2id, with a per-address rate limit on sign-in.                                                                                                                         |
| Sessions     | 32 random bytes, stored as an HMAC, compared in constant time; `httpOnly`, `SameSite=Lax`, `Secure` over HTTPS; 60 minutes idle, 12 hours absolute.                         |
| CSRF         | Every changing request needs the session's token in `X-CSRF-Token`; the cookie's `SameSite` alone is not relied on.                                                         |
| WebSocket    | The `Origin` must be this site or an allowed origin, so another site cannot open a socket with the visitor's cookie.                                                        |
| File serving | A path is resolved against the prints root and checked with `realpath`, so a symbolic link pointing outside is refused. Downloads are served from the file's own directory. |
| Database     | Kysely builds every query; no string interpolation.                                                                                                                         |
| Deel-links   | 32 random bytes; only the SHA-256 is stored. Unknown, malformed, expired and revoked links get the same answer. Rate-limited per address.                                   |
| Logo upload  | Admin only, 1 MB, PNG or SVG. An SVG is rasterised to PNG and only the PNG is stored and served; the renderer cannot fetch anything the SVG refers to.                      |
| Errors       | An unexpected failure is logged in full and answered with the status alone, so internals do not reach the browser.                                                          |
| Logs         | Deel-link tokens and OIDC authorization codes are masked in the request log.                                                                                                |

## Known and accepted

### Seven low-severity advisories in the API docs renderer

`npm audit` reports seven low-severity advisories. All seven trace to one
package, `@ai-sdk/provider-utils`, pulled in by `@scalar/agent-chat`, which is
a hard dependency of the renderer on `/api-docs`.

They are left as they are, deliberately:

- The advisory class is uncontrolled resource consumption, in **browser code**,
  in a lazily loaded chunk on an Admin-only page. Nothing server-side is
  reachable through it.
- It sits in Scalar's AI assistant, which the app **switches off**
  (`agent: { disabled: true }`). The page contacts no host outside the
  instance; that is verified in the browser with request interception.
- The only fix npm offers is downgrading the renderer by a major version,
  which is a worse trade than the advisory. Pinning the transitive dependency
  forward through `overrides` was tried at the root, in nested form, in the
  workspace and with the lockfile removed; npm 11.9 reads the override and
  does not apply it.

Revisit when Scalar updates its own dependency.

### Not covered

- No audit trail of who changed what, beyond who created or undid a payment.
- No two-factor authentication for local accounts; use OIDC where that matters.
- No encryption at rest. The data folder holds invoice PDFs and snapshots with
  customer names and amounts; protect it like any other backup.

## Reporting a problem

This is a personal, self-hosted project. Open an issue, or for something
sensitive, contact the repository owner directly rather than filing publicly.
