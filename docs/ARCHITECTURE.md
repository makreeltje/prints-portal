# Architecture

One Node process serves the API and the built frontend. It reads a prints
folder it never writes to, keeps everything it derives in its own database,
and tells open browsers about changes over a WebSocket.

```
prints folder ──▶ scanner ──▶ indexer ──▶ database ──▶ API ──▶ SPA
   (read-only)      watcher                  │                  ▲
                                             └── realtime hub ──┘
```

## Backend (`backend/src`)

| Folder        | What lives there                                                                                                                                                                                                                                                                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config/`     | `config.ts` reads and checks every environment variable at start-up; `data-dir.ts` prepares `DATA_DIR`.                                                                                                                                                                                                                                                    |
| `core/`       | Pure logic with no I/O: `gcode.ts` and `threemf.ts` (slicer metadata), `cost.ts` and `pricing.ts` (cost and customer price), `file-names.ts`, `files.ts`, `duplicates.ts`, `printers.ts`, `money.ts`, `duration.ts`, `format.ts` and `time.ts` (nl-NL), `paths.ts` (containment), `secrets.ts`, `tags.ts`, plus `error-handler.ts` and `log-redaction.ts`. |
| `db/`         | `schema.ts` (the table types), `connection.ts`, `database-url.ts`, `migrate.ts` and `migrations/`. Kysely throughout, one schema for SQLite, PostgreSQL and MariaDB.                                                                                                                                                                                       |
| `indexing/`   | `scanner.ts` walks the folder, `read-asset.ts` parses one file, `indexer.ts` keeps the database in step, `watcher.ts` reacts to changes with a quiet period per print, `recompute.ts` refreshes derived values.                                                                                                                                            |
| `prints/`     | `queries.ts` (list and detail, access applied), `routes.ts`, `mutations.ts`, `files.ts` (downloads with range support), `types.ts`.                                                                                                                                                                                                                        |
| `finance/`    | Costs (`costs.ts`, `spools.ts`, `spoolman.ts`), money state (`state.ts`, `read.ts`, `orders.ts`), mutations (`mutations.ts`), invoices (`invoices.ts`, `billing.ts`, `outstanding.ts`, `pdf.ts`), settings and the routes for all of it.                                                                                                                   |
| `sharing/`    | `links.ts` (tokens), `overview.ts` (what a Deel-link shows), `routes.ts` (the public endpoints).                                                                                                                                                                                                                                                           |
| `auth/`       | `guard.ts` (the one place that decides who may call what), `sessions.ts`, `passwords.ts` (argon2id), `oidc.ts`, `access.ts` (customer scope), `users.ts`, `bootstrap.ts`.                                                                                                                                                                                  |
| `realtime/`   | `hub.ts` keeps the open sockets and filters every event by the viewer's scope; `routes.ts` is the WebSocket endpoint.                                                                                                                                                                                                                                      |
| `thumbnails/` | `service.ts` picks the best image and caches it per print and colour; `stl.ts` renders an STL when there is nothing else.                                                                                                                                                                                                                                  |
| `docs/`       | `openapi.ts` and `route-docs.ts` generate the OpenAPI document from the route schemas.                                                                                                                                                                                                                                                                     |
| `health/`     | `health.ts` behind `/healthz`.                                                                                                                                                                                                                                                                                                                             |
| `cli/`        | `inspect.ts` prints what the parsers read from any file or folder.                                                                                                                                                                                                                                                                                         |

### Two rules the code keeps in one place

- **Who sees which klant** is `auth/access.ts`. Admins and Editors see every
  klant; a User sees the granted folders. Every list, detail, download and
  live event goes through it, including the WebSocket hub, which re-reads a
  viewer's scope when grants change.
- **Which file may be served** is `core/paths.ts`. A client-supplied path is
  resolved against the prints root and checked with `realpath`, so a symbolic
  link pointing outside is refused as well.

## Frontend (`frontend/src`)

React with Vite, `@tanstack/react-query` for server state, `react-router` for
pages. No state library: the server is the state.

| Folder       | What lives there                                                                  |
| ------------ | --------------------------------------------------------------------------------- |
| `shell/`     | `AppShell.tsx` (sidebar, phone bars, drawer), `navigation.ts`, `logo.ts`.         |
| `prints/`    | Dashboard, print detail, viewer, tags, filters, and `live.tsx` for the WebSocket. |
| `finance/`   | Costs, payments, invoices, Openstaand, settings.                                  |
| `sharing/`   | Deel-links, the one-time link reveal, and the public share page.                  |
| `pages/`     | Users, access, API docs, and the system states.                                   |
| `i18n/nl.ts` | Every Dutch string; the UI holds no literal text.                                 |
| `theme/`     | Systeem, Licht, Donker, remembered per browser.                                   |

The design system in `design-system/` is imported directly: `tokens.css` and
`components/bundle.css` are never copied into the frontend, and
`scripts/check-design-tokens.sh` fails the build if a raw colour, length,
shadow or font appears in the app's own styles.

## Data model

18 tables. The ones that carry meaning:

- `print_records` → `print_assets` → `print_lines` → `line_slots`: a print,
  its files, the printable pieces in them (a G-code file or one plate of a
  3MF), and the filament slots each piece uses.
- `print_orders` → `order_items`: a print's first order and any Nabestelling,
  and which pieces belong to which order. Money hangs off the order:
  `payments`, the write-off fields, and `invoice_id` once it is invoiced.
- `invoices` → `invoice_lines`: final invoices and credit notes, sharing one
  per-year number sequence. A finalised invoice also stores its PDF and a JSON
  snapshot under `DATA_DIR/invoices`, so what was sent can always be shown
  again, whatever changes later.
- `customers` holds the per-klant "niet factureren" flag; `customer_access`
  holds the grants; `share_links` holds the hash of each Deel-link.
- `users`, `sessions`, `tags`, `print_tags`, `app_settings`, `line_overrides`.

Amounts are integer cents everywhere in the database and in the API.

## Decisions worth knowing

- **The prints folder is the truth.** The database is derived: delete it and a
  reindex rebuilds everything except money, which lives only in the database.
- **A print is a project folder**, so deleting a print and deleting a project
  are the same action. Deleting hides a print and keeps its financials.
- **Finalising an invoice pins the price** and locks the order; corrections go
  through a credit note rather than an edit.
- **Nothing is deleted outright.** Prints and klanten are hidden, payments and
  write-offs are undone by an Admin rather than erased.

## Dependencies

Backend: `fastify` with `@fastify/cookie`, `cors`, `rate-limit`, `send`,
`static`, `swagger` and `websocket`; `kysely` with `better-sqlite3`, `pg` and
`mysql2`; `@node-rs/argon2` (password hashing); `openid-client` (OIDC);
`chokidar` (file watching); `pdfkit` (PDF); `@resvg/resvg-js` (SVG to PNG);
`pngjs` and `yauzl` (thumbnails, 3MF).

Frontend: `react`, `react-dom`, `react-router`, `@tanstack/react-query`,
`lucide-react` (the icon set the design system names), `three` (the 3D
viewer), `@scalar/api-reference-react` (the API docs page).

Development only: `playwright-core` (Apache-2.0, checked 2026-10-20) drives the system
Chromium for `npm run screenshots`; it downloads no browser and is not in the image.

Licences: MIT throughout, except `lucide-react` (ISC), `@resvg/resvg-js`
(MPL-2.0) and the development-only `playwright-core` (Apache-2.0). MPL-2.0 is file-level copyleft: using the library unchanged in a
larger work is fine, and only changes to its own files would have to be
published.
