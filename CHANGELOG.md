# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-07

### Added

- Project skeleton: npm workspaces for the Fastify backend and the React frontend, TypeScript,
  ESLint, Prettier and Vitest.
- `/healthz` with database and prints-root checks (503 when the database is down).
- SQLite, PostgreSQL and MariaDB/MySQL connections selected by `DATABASE_URL`.
- App shell from the design system (sidebar; tablet rail, phone bars and drawer as a temporary
  placeholder for GAP-015) and theme switch (Systeem, Licht, Donker).
- Docker image (non-root, healthcheck), `docker-compose.yml`, `.env.example` and CI.
- Image published to GitHub Packages on every green push to `main`, tagged
  `<package.json version>-<run number>`, `sha-<commit>` and `latest`.
- Design system v1.1, then v1.2 (responsive app shell from the design system, line-height
  tokens, sign-in and user-management states).
- Parsing and costing core (M2): G-code comments from OrcaSlicer and Creality Print 5/6
  (grams per slot, print time, printer, thumbnails) read from the head and tail only; 3MF plates
  from embedded G-code or slice data; file-name rules including copy suffixes and timelapse
  names; ignore rules; printer profiles with aliases; cost per slot with Spoolman, manual and
  default prices; customer price; duplicate detection; nl-NL formats; path containment;
  weak-secret checks.
- `inspect` command that prints what the parsers read from any file or folder.
- Print index (M3): database schema and migrations (run at startup; the app stops if one fails) on
  SQLite, PostgreSQL and MariaDB; indexer that keeps prints, files, plates and filament slots in
  step with the prints folder, parses only changed files, keeps user decisions, archives prints
  whose folder disappeared, never revives deleted prints, applies the "Nog te printen"/"Test" and
  "3MF next to G-code" exclusions, flags possible duplicates and keeps totals; full scan at startup
  and a file watcher with a quiet period per print; warning when the data folder is not writable.
- Sign-in and access (M4): server-side sessions in an httpOnly cookie (60 minutes idle, 12 hours at
  most) with CSRF protection; local login with argon2id and a per-address rate limit; OIDC sign-in
  (e.g. Authentik) with PKCE, where members of `OIDC_ADMIN_GROUP` become Admin and local login is
  switched off; first Admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD`; roles Admin, Editor and User;
  Admins manage roles, remove users and grant Users access per customer; `TRUSTED_PROXIES` and
  `CORS_ORIGINS`. Screens: login (with "Nieuw wachtwoord kiezen"), Gebruikers (create, role,
  reset password, remove), Toegang (access matrix) and the 403 state.
  Local users sign in with an e-mail address or a name; a password set by an Admin is temporary
  and must be replaced at the next sign-in; everyone can change their own password
  (`POST /api/auth/password`).
- Prints (M5): dashboard with customer cards, filters (klant, tags with AND, search, archived,
  deleted for Admins), card and list views, "Meer laden", empty states and live updates; print
  detail with the 3D viewer (STL or 3MF), file list (sizes, grams, times printed, duplicates,
  exclusion reasons, plates and slots, downloads) and delete; Admins restore prints and customers.
  API for prints, customers, tags, thumbnails (embedded image, 3MF image, server-rendered STL,
  .cxprj image; cached on the data volume), model files and downloads with Range; WebSocket
  `/api/live` with per-customer subscriptions; Admin re-index.
- Financials (M6): costs per print from the files, spools and settings (Spoolman v0.27.0 with
  snapshots at assignment, manual €/kg per file or slot, "Kosten aanpassen", times printed and
  exclusions; recalculated on every change), sale price with the markup suggestion, partial
  payments, write-offs, undo for Admins, "niet factureren" per klant, repeat orders inside a
  print (API; the screens follow the design system), bulk actions with a result per print, and
  the Instellingen page (re-index, theme, Standaardmarge, company details, klanten, Spoolman).
- Design system v1.3: "Klant verwijderen" on customer cards and on phones (customer chips),
  the tag editor on the print detail page, the Tags page (`/tags`) to create, rename, recolour
  and delete tags, a fullscreen button on the 3D viewer, dimmed deleted and archived prints and a
  flash on list rows that change live.
- Invoices and Openstaand (M7): Openstaand per klant with days open, "Alles als betaald",
  per-line payment and write-off, reminder PDF (read-only for Users, their own klanten); invoice
  export dialog with preview, concept PDF and "Definitief maken" (yearly numbers shared with
  credit notes, stored PDF and snapshot, prices locked, "Op factuur {nummer}"); Facturen register
  with downloads and credit notes (Admin); tagged A4 PDFs; company logo upload (PNG or SVG,
  stored as PNG).
- Design system v1.4: one section per order on the print detail (Nabestelling maken and
  verwijderen, files in no order), sums over orders on cards and rows, bulk dialogs "Spoel
  toewijzen" and "Prijs instellen" with a reason per print, Stroomtarief, Materiaalprijzen and
  Printers in Instellingen, floating popovers, the selected klant card, deleted klant chips and
  Dutch palette names.
- Design system v1.5: Van / Tot en met in the invoice export (DatePicker with a calendar and typed
  `d-m-jjjj`) and a refusal while Bedrijfsgegevens has no name or IBAN; an amount dialog for
  "Markeer als betaald" in Openstaand; Factuur on phones; "Spoel voor de hele print" back on the
  print detail; the locked price on a final invoice; the uploaded logo in the sidebar, phone top
  bar and drawer (every signed-in role can read it); the payment sentence on PDFs follows the IBAN
  and what is still open.
- Documentation (M10): README, a Dutch user guide (`docs/USAGE.md`), every setting with its
  default (`docs/CONFIGURATION.md`), roles and sign-in (`docs/AUTH.md`), Docker, reverse proxies,
  databases, backups and upgrades (`docs/DEPLOYMENT.md`), how it is put together
  (`docs/ARCHITECTURE.md`) and what is protected (`docs/SECURITY.md`).
- Frontend polish (M9): an OpenAPI document generated from the route schemas and served at
  `/api/openapi.json`, and an `/api-docs` screen that renders it with Scalar in the app's own
  theme, without its AI assistant or platform tools and without contacting anything outside the
  instance; a warning bar while the live connection is down; a first-run page that shows the
  klant/project folder convention; an empty state on Toegang when no account has the role User;
  and an accessibility pass over every screen in both themes (WCAG 2.1 AA).
- Deel-links (M8): Admins create read-only links per klant (Over 7, 30 or 90 dagen, or Nooit), see
  the link once and can revoke it; only a hash of the token is stored. The share page needs no
  sign-in and shows one line per order with the customer price, status and totals, "Alleen
  openstaand" and an "Overzicht" PDF; a niet-factureren klant sees the print list only. Unknown,
  expired and revoked links get the same page. `RATE_LIMIT_SHARE` (default 60 per minute) limits
  the public endpoints.

### Security

- Deel-link tokens and OIDC authorization codes are masked in the request log. The token is the
  only credential a share page has, and it was written to the log in plaintext on every public
  request, so a log file handed over access until the link expired or was revoked.
- An unexpected failure is answered with the status alone instead of the thrown error's message,
  which used to reach the browser. Schema validation and the deliberate 4xx bodies are unchanged.
- Accessibility pass over every screen (WCAG 2.1 AA), which also fixed keyboard access to the
  scrollable tables.

### Changed

- The app now needs `SESSION_SECRET`, and `ADMIN_EMAIL`/`ADMIN_PASSWORD` until a first Admin
  exists; it refuses to start without them outside development.
- Every `/api` path needs a signed-in user unless it is explicitly public.
- Tag colours are one of ten palette colours (or none); colours chosen freely before still show.

- CI actions moved to versions that run on Node 24.
