# Implementation plan

Status: **draft, awaiting approval** (updated for design system v1.1). This file records the decisions taken during the clarification rounds and the milestone plan. It is a developer document (English). It will be kept up to date as milestones land.

---

## 1. Decisions

References like §6 point to the original build brief; A1–H6 and C1–C3 to the clarification rounds.

### Product and business rules

| Topic | Decision |
|---|---|
| Soft delete (§2.5) | `status = Deleted` hidden by one global filter. Admin-only "show deleted" filter on the dashboard; restore mirrors delete: one print, one project or one whole customer. Delete applies per record; a new project under a "deleted" customer shows up. |
| Archived (§2.4) | Folder gone → Archived (assets removed, financials kept). Folder back → same record becomes Indexed. Archived prints show on the dashboard (filterable), in Openstaand and on invoices with a `Gearchiveerd` badge. |
| Write-off (§5.4) | Explicit `writtenOffAt`, `writtenOffBy`, `writtenOffAmount`, optional reason. Partially paid → only the remainder. Undo: Admin only, with confirmation. Written-off lines leave Openstaand and do not appear on the share page or new invoices. On a final invoice they are corrected with a credit note. |
| Undo paid (§5.3) | Yes, Admin only, with confirmation; record who and when. |
| Partial payment | `amountPaid < price` stays open for the remainder (UI: GAP-004). A payment can be at most the open remainder; more is refused (owner, M6). |
| Repeat orders (owner, M6) | A print (project folder) has one or more orders. Order 1 always exists. An order holds items (a G-code or 3MF plate with its own times printed for that order; the same file may be in several orders), its own sale price, payments, write-off and, from M7, its own invoice line. New files join the newest order while it has no sale price, payment or write-off; otherwise they stay "not in an order" until the owner makes a Nabestelling and ticks them in. Files stay in the same project folder. With several orders the dashboard shows the least settled status; the detail page lists every order. Multi-order screens wait for the design system (GAP-035): stacked sections per order, newest first, settled ones collapsed. A Nabestelling can be deleted (Admin and Editor) while it has no payment, write-off or invoice; order 1 never (owner, 2026-10-06; the API comes with the v1.4 screens). |
| Undo paid (owner, M6) | "Betaling ongedaan maken" reverses the most recent active payment of that order (Admin only); undone payments stay in the history with who and when. |
| Mark paid | Requires an amount; pre-filled with the customer price when there is one. |
| Days open | From the final invoice date if any, else from when the sale price was set, else `discoveredAt`. |
| VAT | Dropped completely (hobby, not a business): no VAT toggle, rate, VAT number or KvK. |
| Invoice numbering (§6) | Persisted `YYYY-NNN`, reset yearly, assigned only at "Definitief maken". Concepts are unnumbered. Finalising stores the PDF and a data snapshot on `/data` and locks the lines (sale price and grams). A print can be on at most one final invoice; finalising only takes prints not yet on one, earlier lines are listed for information only. Credit notes: negative invoice referencing the original, same sequence, created by Admins only, for the whole invoice or chosen lines (v1.1). A credited print becomes Afgeschreven for the credited amount, with the credit note as reason (C3); this is the only correction route after finalising. Reminders and share-page PDFs get no number; share-page PDFs are titled "Overzicht". Concept PDFs are not stored. The Facturen register is visible to Admin and Editor. |
| Invoice content | Date column = print date (mtime of the most recent counted G-code); the date-range filter uses the same date. Prints without a customer price are left out and the export dialog lists them. Full invoices include paid prints marked Betaald, totals show total, paid and remaining. Company details: name, address, IBAN, optional contact; from admin settings only. |
| "Niet factureren" | Per-customer flag. Cost is tracked and shown; no sale price, no payment panel, never in Openstaand, invoices or share-page invoices. Share link allowed, showing the print list only without amounts (C1; v1.1 says otherwise, GAP-013). |
| Share-link expiry | Optional: Over 7 / 30 / 90 dagen or Nooit (C2; v1.1 has no Nooit, GAP-014). |
| Roles (§9.4) | Editors see all customers; only Users need per-customer grants. Users see customer price and status only: no internal cost, breakdown or notes. |

### Files and parsing

| Topic | Decision |
|---|---|
| Slicers | OrcaSlicer now; Creality Print 5.1 for older prints. |
| G-code metadata | Read head and tail windows (default 64 KB each). Grams: `total filament used [g]` if present, else the sum of the per-slot `filament used [g]` values; never both; never the `[mm]`/`[cm3]` lines. Time: comment wins over file name. Printer: `printer_model` comment. Thumbnails: embedded PNG blocks. |
| File-name rule | `<part>_<material>_<time>.gcode`, tolerant of copy suffixes after the time (`_2`, ` copy 2`, ` - Copy`, `(1)`, ` 2`, `-2`, …). Videos: `<prefix>_<part>_<material>_<time>.gcode_<dd-MM-yyyy>_<HH>h<mm>[ (n)].mp4|mkv`; other video names are listed, and pure Unix-timestamp names give a recording date. |
| 3MF | A plate counts for cost only if the 3MF has slice data (Bambu/Orca `slice_info` weight/prediction, or embedded `Metadata/plate_N.gcode`) **and** the project has no counted loose G-code; otherwise auto-excluded (reason shown, user can flip). Each sliced plate is its own line (exclude, slots, times printed). |
| Multi-colour | Per-slot usage rows (slot, grams, slicer colour, slicer material, optional spool and price). Material cost = Σ slots grams × price/kg. Slicer slot colour tints thumbnails when no spool is assigned. |
| Times printed | Per G-code/plate count, default 1, multiplies grams, time and cost. |
| Duplicates | Same project + same size + identical slicer metadata → "Mogelijk dubbel" warning, also for existing copies. Existing copies still count once each. |
| Auto-exclude | Duplicate-3MF rule above; files under configurable subfolder names (`Nog te printen`, `Test`). User can always flip. |
| Subfolders | Everything below `customer/project/` belongs to that project's record; the subfolder path is shown. `Deurstop v2/Spirit Island` is project "Deurstop v2". |
| Ignored | Dot files and dot folders (`.thumbs`, `.thumbnails`, `.DS_Store`, `._*`), `__MACOSX`, `Thumbs.db`, `desktop.ini`, `*.part`, `~$*`, Nextcloud temporary-upload files. Configurable. |
| Asset types | §2.2, case-insensitive extensions. `.step` and `.cxprj` are Other; a `.cxprj` plate image is the last-resort thumbnail. |
| Thumbnail order | Embedded G-code PNG → 3MF plate image → server-rendered STL → `.cxprj` image → none. |
| Timelapses | Display only (owner, after M2): listed with the recording date from the name when present; never linked to G-code and never used for cost, print date or times printed. No file-date fallback. The `Nog te printen` rule stays; the owner moves or flips files themselves. |
| Printer profiles | Edited in Settings (`AppSetting`): key, display name, aliases (e.g. `Creality K1 Max`, `K1 Max`), video prefixes, watts. Seeded with the K1 family. Longest alias match first. Electricity printer comes from G-code `printer_model`, never from a video prefix. |
| Projects without G-code/3MF | Shown with "Kosten ontbreken". |

### Cost

| Topic | Decision |
|---|---|
| Price per kg | Spoolman snapshot > manual (print, file or slot) > default per material (Settings, "Geschat"). Slicer `filament_cost` is ignored. |
| Spoolman | v0.27.0. Price/kg = spool price ÷ spool initial filament weight, else filament price. Field names verified against that version before implementing. Snapshot at assignment. |
| Manual overrides | Editors can override grams and print time per print ("Handmatig") for incomplete legacy projects. |
| Wattage, tariff | Settings (`AppSetting`); env values only seed the first start. |
| Rounding | Money 2 decimals away from zero; energy 3 decimals. |

### Auth and security

| Topic | Decision |
|---|---|
| Session | httpOnly, Secure, SameSite=Lax cookie + CSRF protection. Server runs the OIDC code + PKCE flow (confidential client) and issues the same cookie for local and OIDC users. 60 min idle sliding, 12 h absolute. |
| OIDC testing | Mock provider in CI; Authentik verified manually by the owner. |

### Operations

| Topic | Decision |
|---|---|
| Databases | SQLite (default), PostgreSQL, MariaDB/MySQL via one `DATABASE_URL`; all three in the CI test matrix. No MongoDB. |
| Configuration | Plain env vars (H6); no local override file; business settings in the DB. |
| Image | `ghcr.io/makreeltje/prints-portal`, `linux/amd64` + `linux/arm64`, published from CI on every green push to `main` with tags `<package.json version>-<run number>`, `sha-<commit>` and `latest` (owner decision during M1). |
| Host | i5-8400 under Proxmox (LXC), prints root on the same disk inside a Nextcloud data folder. |
| Time zone | Europe/Amsterdam for display and days open; UTC stored. |
| License | Private repository. |
| Old app | No import, do not use the old repository. |
| Git | One PR per milestone from the session branch. |

### Design system

| Topic | Decision |
|---|---|
| Version | v1.1 imported. Screens and documents are `components/Screen*`, `components/AppShell` and `components/Doc*`; tablet and wide layouts are specified in text only. |
| Screens | Built together with the milestone that delivers their API (see §4). |
| PDFs | Built from `DocInvoice`, `DocReminder` and `DocOverview`; no placeholder needed. |
| Adopted from v1.1 | Undo paid Admin only; manual price disabled when Spoolman supplies one; duplicate warning as visible text; no VAT anywhere. |
| Open gaps | GAP-013 (Deel-link for niet-factureren klanten), GAP-014 (Nooit as expiry). Only those UI parts wait. |

---

## 2. Stack

| Part | Choice |
|---|---|
| Runtime / API | Node.js (current LTS), Fastify, TypeBox schemas, `@fastify/swagger` + one UI at `/api-docs` |
| Database | Kysely + Kysely migrations; `better-sqlite3`, `pg`, `mysql2` |
| Auth | `argon2` (argon2id), `openid-client`, `@fastify/cookie`, `@fastify/csrf-protection`, `@fastify/rate-limit` |
| Real-time | `@fastify/websocket` |
| Files | `chokidar` (watcher), `yauzl` (streaming zip for 3MF), `fast-xml-parser` |
| PDF | PDFKit |
| STL thumbnails | Own software rasteriser in TypeScript → PNG via `pngjs` |
| Frontend | React, Vite, TypeScript, React Router, TanStack Query, `lucide-react`, three.js (lazy chunk) |
| Quality | Vitest, Testing Library, ESLint flat config + `typescript-eslint` strict, Prettier, `tsc --noEmit` |
| Logging | pino (structured JSON to stdout) |

Each dependency's licence is checked when it is added and listed in `docs/ARCHITECTURE.md`.

### Configuration (env)

`PRINTS_ROOT`, `DATA_DIR` (default `/data`), `PORT` (default `8080`), `PUBLIC_URL`, `DATABASE_URL` (default `sqlite:///data/prints-portal.db`), `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_ADMIN_GROUP`, `SPOOLMAN_URL`, `TRUSTED_PROXIES`, `CORS_ORIGINS`, `INDEX_ON_STARTUP`, `WATCH_ENABLED`, `WATCH_DEBOUNCE_MS`, `RATE_LIMIT_LOGIN`, `RATE_LIMIT_SHARE`, `LOG_LEVEL`, `TZ`. Seed-only: `ELECTRICITY_TARIFF_EUR_PER_KWH`. Final list and defaults are documented in `docs/CONFIGURATION.md`.

---

## 3. Repository layout

```
backend/                 Fastify API (TypeScript)
  src/
    config/              env parsing and validation, weak-secret checks
    core/                pure logic: parsing, cost, pricing, paths, tags, money (no I/O)
    db/                  Kysely setup, dialect selection, migrations, global filters
    indexing/            scanner, file classifier, metadata extraction, indexer, watcher
    auth/                sessions, CSRF, local login, OIDC, bootstrap admin, access service
    api/                 route modules per endpoint group
    realtime/            WebSocket hub and the shared broadcast helper
    financials/          recalculation, payments, write-offs, Spoolman client
    invoices/            invoice model, numbering, PDF rendering, snapshots
    thumbnails/          extraction, STL rasteriser, disk cache
  test/                  unit, integration (fastify.inject), fixtures
frontend/                React SPA (TypeScript); DS_SRC_DIR = frontend/src
  src/
    components/          one-to-one implementations of design-system components (pp- classes)
    api/                 typed client, CSRF/401 interceptors
    hooks/               auth, real-time, queries
    i18n/                nl.ts: every user-facing string (copy deck keys first)
docs/                    PLAN, ARCHITECTURE, CONFIGURATION, AUTH, DEPLOYMENT, USAGE
Dockerfile, docker-compose.yml, .env.example, CHANGELOG.md, DEVELOPMENT.md
```

---

## 4. Milestones

Every milestone ends with: format, lint, type check, all tests (all three databases where relevant), `scripts/check-design-tokens.sh` once `frontend/src` exists, a commit per logical change, a PR, and a short summary (what was built, how to try it, what is open).

### M1: Skeleton
- **Scope:** npm workspaces (`backend`, `frontend`); TypeScript strict; ESLint, Prettier, Vitest in both; Fastify app with config loading, pino, `/healthz` (DB, prints root; Spoolman added in M6); React + Vite app importing `design-system/tokens.css` and `components/bundle.css` directly, with AppShell (sidebar, rail, top/bottom bar, drawer), routing and theme switch (system/light/dark per browser); Dockerfile (multi-stage, non-root, `HEALTHCHECK` with `node`); `docker-compose.yml` (`${PRINTS_ROOT:?…}`, read-only mount, named `/data` volume, commented OIDC/Spoolman/proxy examples); `.env.example` with obvious placeholders; CI (backend lint/type/test; frontend lint/type/test/build; design-system job already present; Docker build).
- **Tests:** config parsing; `/healthz` 200/503; one frontend smoke test.
- **Verify:** `npm ci && npm test`; `docker compose up` → `curl :8080/healthz`; `docker inspect` shows the healthcheck passing; the empty AppShell renders in light and dark, phone and desktop.

### M2: Parsing and costing core (pure, no I/O)
- **Scope:** G-code head/tail parser (Orca and Creality Print formats, grams total-vs-slots, time, printer model, slot colours/materials, embedded thumbnails); file-name and video-name parsers with copy suffixes and timestamp names; 3MF metadata parser (slice_info plates, embedded plate G-code via streaming, plate images); asset classifier and ignore rules; printer registry (aliases, longest match, prefixes); cost calculator (slots, times printed, price precedence, electricity, manual overrides, rounding); customer-price function; tag name/colour normalisation and text-colour pick; path-containment helper; money/duration/date formatting for nl-NL; weak-secret checks.
- **Tests:** every parser rule (fixtures trimmed from the owner's files, neutral names, plus a synthetic Bambu 3MF); rounding, nulls and fallbacks; traversal, sibling prefix and absolute paths; registry matching (`K1 Max` vs `K1`); duplicate fingerprint.
- **Verify:** `npm test -w backend`; a small CLI `npm run inspect -- <file>` prints parsed metadata for any file.

- **Status:** done. nl-NL formatting lives in `backend/src/core/format.ts`; whether the frontend imports it or gets a shared package is decided in M5.

### M3: Data and indexing
- **Status:** done. Deviation: each milestone adds its own tables in a new migration (M3 has the print index only), instead of creating every table up front; the reindex endpoint moves to M5, behind admin auth.
- **Scope:** schema and migrations (records, assets, plates, slot usages, financials incl. write-off and payment audit fields, tags, users, access, share links, settings, customer settings, invoices, invoice lines, invoice sequence, sessions); dialect selection from `DATABASE_URL`; global "not deleted" query helper; scanner; indexer (upsert, archive/unarchive, soft-delete skip, auto-exclusions, duplicate flags, aggregates); watcher with per-project debounce; startup full scan; startup warning for a non-writable data dir.
- **Tests:** migrations on SQLite/Postgres/MariaDB; soft delete surviving re-index; archive and return; subfolder handling; ignore rules; auto-exclude rules; debounce behaviour with a temp directory.
- **Verify:** point `PRINTS_ROOT` at a test tree and watch the log; inspect the SQLite file.

### M4: Auth and access
- **Status:** in review. Deviations: CSRF uses a per-session token in the `X-CSRF-Token` header instead of `@fastify/csrf-protection`; argon2id comes from `@node-rs/argon2` (prebuilt for amd64 and arm64); the session cookie is `Secure` whenever the request arrived over HTTPS (directly or via a trusted proxy), so plain-HTTP LAN access keeps working; `PUBLIC_URL` must be an origin without a path; `OIDC_ADMIN_GROUP` is required with OIDC; an OIDC sign-in takes over an existing account with the same e-mail address. Owner answers to the design system's questions (2026-10-05): local users sign in with an e-mail address or a name (GAP-018); on phones the role is a native select in the card (GAP-020); "Wachtwoord resetten" lets the Admin type a temporary password, and a temporary password (new user or reset) must be replaced at the next sign-in (GAP-019); the missing sizes become tokens plus classes (GAP-016/017). The backend for GAP-018 and GAP-019 is built (`login` column, `must_change_password`, `POST /api/auth/password`); the screens wait for v1.2. Design system v1.2 resolved GAP-013 to GAP-022 and is implemented here (login identifier and states, "Nieuw wachtwoord kiezen", create and reset dialogs, Editor rows, responsive AppShell from bundle.css, 403 state). The current password is optional on `POST /api/auth/password` only while the password is temporary, because the v1.2 card does not ask for it. v1.2.1 resolved GAP-023: Gebruikers and Toegang show one card per user at 480px and below (`pp-only-wide` / `pp-only-phone`), and the login card has `space-4` margins on phones. No design gaps are open. The 403 page is built and is used from M5, when customer pages exist.
- **Scope:** sessions (cookie, CSRF, sliding/absolute expiry, persisted on `/data` or DB); local login with argon2id and rate limit; OIDC code + PKCE with group → Admin mapping; local login disabled when OIDC is configured; bootstrap admin with weak-secret checks; roles; one access service; user management; access matrix; trusted proxies and CORS. Screens: ScreenLogin, ScreenUsers, ScreenAccess (AccessMatrix), the 403 state from ScreenSystemStates.
- **Tests:** authorisation matrix (anonymous/User/Editor/Admin × every endpoint group so far); login 429; OIDC against a mock provider; weak-secret startup failures; forwarded headers only from configured proxies.
- **Verify:** log in locally; with a mock or real Authentik, log in via OIDC.

### M5: Prints API, thumbnails and real-time
- **Status:** in review. Owner decisions: Admins and Editors delete prints and customers and manage tags; only Admins restore; Users see name, status, thumbnail, 3D model and tags, no files or downloads. A project folder is one print here, so print and project delete are the same action. Deviations: the print colour is drawn behind the image by the design system (`.pp-thumb.tinted`), so the server serves embedded slicer images unchanged and renders STLs light grey; the thumbnail cache is keyed by source file only. Formatting rules are mirrored in `frontend/src/i18n/format.ts` (tested on both sides) instead of a shared package. Downloads use `@fastify/send` (Range, ETag). Design system v1.3 resolved GAP-024 to GAP-028 and is implemented here: dimmed deleted/archived thumbnails and muted rows, the row flash, CustomerCard with "Klant verwijderen" and CustomerChips on phones, the TagEditor popover (bottom sheet on phones), the Tags page (`/tags`, Admin and Editor) with the ten-colour palette, and the viewer's fullscreen button. Tag colours are palette keys since v1.3; free colours stored before still render. Open gaps found while implementing v1.3: GAP-029 (no stacking level for popovers: the FilterBar Tags popover is partly covered by the cards, and the TagEditor opens in the page flow above 480px; owner chose to wait for the design system), GAP-030 (CustomerCard selected look, restoring a klant on phones), GAP-031 (Dutch names for palette colours), GAP-032 (README and copy deck differ; the app follows the copy deck). The detail page stays one column, with the viewer at its default width, until M6 adds the right-hand column. Selection, bulk bar, prices and the right-hand detail column come with M6.
- **Scope:** list (filters: customer, tags AND, search, archived, admin "show deleted"; pagination), detail, assets, download/stream with range, thumbnails (order in §1, tint by spool or slicer colour, disk cache keyed by print × colour), STL rasteriser, delete/restore (print, project, customer), tags CRUD, reindex endpoint, WebSocket hub with per-customer subscriptions and the shared broadcast helper. Screens: ScreenDashboard (cards/list, filters, Toon verwijderde, Gearchiveerd tonen), ScreenPrintDetail (header, Viewer3D lazy, AssetListItem with slots/plates/duplicates, tag editor, delete), with their components, API client and auth hooks.
- **Tests:** endpoint × role; range requests; path containment on every file endpoint; subscription access checks; broadcast payload shape; component tests.
- **Verify:** `curl` the API; open the component preview route.

### M6: Financials and Spoolman
- **Status:** in review. Built: Spoolman client (cache, timeout, status; spool or filament price per kg, verified against v0.27.0 `models.py`), spool assignment per print, file, plate or slot (snapshot), manual €/kg, "Kosten aanpassen" per order, times printed per order item, exclusion toggles, recalculation on every change (archived prints keep their last costs), sale price with "Voorstel uit marge", partial payments (at most the open remainder), undo of the last payment and of a write-off (Admin), write-off of the remainder, "niet factureren", Nabestelling API, bulk API with per-print results, settings API, `/api/calculate`. UI: SpoolPicker, SpoolSwatch, CostBreakdown, CostOverrideDialog (order level), PaymentPanel, WriteOffDialog, BulkActionBar (Markeer als betaald, Tags, Verwijderen), prices and payment badges on cards and rows, openstaand on customer cards, Instellingen. Deviations: money is stored in integer cents; the reindex button waits for the result (`wait: true`) instead of showing a progress bar (GAP-036); nullable request fields use JSON-schema type unions because Fastify's type coercion turned `null` into 0 or false inside `anyOf`. Waiting for the design system: GAP-033 (printer, tariff and material sections), GAP-034 (bulk spool and price dialogs), GAP-035 (several orders), GAP-036 (sizes without tokens), GAP-029 (floating popovers; the SpoolPicker opens in the page flow too).
- **Scope:** Spoolman client (cache, timeout, status), field mapping verified against v0.27.0; spool assignment per slot (snapshot); manual price per kg; manual grams/time overrides; times printed; exclusion toggles; recalculation on every change; sale price; markup suggestion; payments (partial, undo for Admin); write-off (partial, undo for Admin); "niet factureren" flag; bulk actions with per-item results; Settings API (printer profiles, tariff, material defaults, markup, company details); calculate endpoint. UI: SpoolPicker, SpoolSwatch, CostBreakdown, CostOverrideDialog, PaymentPanel, WriteOffDialog, BulkActionBar on the dashboard and print detail; ScreenSettings (reindex, theme, Prijzen, Bedrijfsgegevens, Klanten/Niet factureren, Spoolman status, printer profiles, material defaults).
- **Tests:** cost math through the API; recalculation triggers; write-off/payment rules; bulk results; Spoolman mocked (timeout, down → hidden, never broken); component tests for spool picker, payment panel, cost breakdown, bulk bar.
- **Verify:** with your Spoolman URL, assign a spool and see the breakdown.
- **Owner decisions (2026-10-06):** orders inside a print (see "Repeat orders"); undo reverses the last payment; overpayment is refused; printer profiles, tariff and material defaults get an API now and their Instellingen sections wait for the design system (GAP-033); the bulk dialogs "Spoel toewijzen" and "Prijs instellen" wait for the design system (GAP-034), their API is built.

### M7: Invoices and Outstanding
- **Owner decisions (2026-10-06):** an invoice line is one order (order 1 shows the print name, a Nabestelling "{print} (nabestelling {n})"); an order's date is the modification time of the newest counted G-code in that order, else its creation date (Datum column and the Van / Tot en met filter); the payment reference is the invoice number (Concept: the klant name; Herinnering: the klant name). Backend first; the screens follow design system v1.4 in the same PR. Confirmed after the backend: a credit note writes off the credited amount only up to what is still open (paid stays paid, refunds are not tracked); days open count from the invoice date, else the sale price date, else the order date; the reminder reference is the klant name; PDFs use built-in Helvetica (WinAnsi characters only). Openstaand is visible to Users read-only, limited to the klanten they were granted (owner decision 2026-10-07). The uploaded logo replaces the studio name in the AppShell too (owner decision 2026-10-07; built from design system v1.5).
- **Scope:** Openstaand API (groups, oldest days, totals; mark one/all paid; write-off); concept invoice PDF; "Definitief maken" with transactional per-year numbering, stored PDF and JSON snapshot, line locking; credit notes; invoice register API; reminder PDF; company settings and logo upload (PNG/SVG, size limit, SVG sanitised); PDF layouts from DocInvoice (Factuur, Concept, Creditnota) and DocReminder. Screens: ScreenOutstanding, ScreenInvoiceExport, ScreenInvoices (finalise and credit-note dialogs).
- **Tests:** numbering (sequence, yearly reset, concurrent finalise), locking, one-final-invoice rule, credit note totals, excluded-without-price list, niet-factureren exclusion, safe ASCII file names, PDF text content checks.
- **Verify:** download a concept and a final invoice; finalise twice and see the second refuse already-invoiced prints.
- **Status:** in review. Built: Openstaand API and screen (Users read their own klanten), invoice preview, concept PDF, finalising with per-year numbering shared with credit notes (retried on a unique conflict, so concurrent finalising gets distinct numbers and one invoice per order), stored PDF and JSON snapshot under `DATA_DIR/invoices`, price pinning and order locking, credit notes (Admin) that write off what was still open, reminder PDF, Facturen register, logo upload (`DATA_DIR/branding/logo.png`; an SVG is rasterised with resvg and never served), tagged PDFs with PDFKit. Design system v1.4 is imported and GAP-029 to GAP-036 are implemented, including `DELETE /api/orders/:id` for a Nabestelling and `GET /api/settings/markup` for Editors. Deviations: the PDFs use built-in Helvetica (WinAnsi only); the reindex still waits instead of showing progress (the indexer reports no progress yet). Design system v1.5 is imported and resolves GAP-037 to GAP-046 (period filter with the DatePicker, Openstaand amount dialog, Factuur on phones, whole-print spool card, locked price, logo in the AppShell, payment sentence rules, text sizes, footer wrap, `.up` popovers on phones). Open design gaps, both built as temporary placeholders from existing classes by owner decision (2026-10-07, marked `ds-gap`): GAP-047 (a calendar button in the DatePicker field, as the README asks; the preview has only a decorative icon) and GAP-048 (locked look for Aantal keer geprint, the toggle, slot spools and Aanpassen on an order on a final invoice, with one visible reason line).

### M8: Share links
- **Scope:** admin CRUD (32 random bytes base64url, SHA-256 stored, shown once), public share API (customer price only, Prijs volgt, written-off and deleted hidden), public "Overzicht" PDF (only-unpaid toggle; everything else fixed server-side), identical 404 for unknown/expired/revoked, rate limit. PDF layout from DocOverview. Screens: ScreenShareLinks, ScreenSharePage; the niet-factureren variant and the Nooit option wait for GAP-013/GAP-014.
- **Owner decisions (2026-10-07):** the public share endpoints (page data, Overzicht PDF, logo) allow 60 requests per minute per IP address, configurable with `RATE_LIMIT_SHARE`; archived prints are shown (written-off and deleted ones stay hidden); the share page lists one line per order, like the Overzicht PDF, Openstaand and invoices; the page header shows the logo, else the company name from Bedrijfsgegevens, else "3D Prints Portal"; the Overzicht PDF leaves out the "Geldig tot" row for a link without expiry (GAP-049). GAP-013 and GAP-014 were resolved in v1.2, so the niet-factureren variant and Nooit are built in this milestone.
- **Tests:** create/list without token/revoke/expire → 404; raw cost never in share responses; extra invoice parameters ignored; 429.
- **Verify:** create a link and open it in a private window.
- **Status:** in review. Built: migration 0006 (`share_links`, SHA-256 of the token only), Admin API (create with the token and URL in the response only, list, revoke), public `GET /api/share/:token` (one line per order, customer price only, archived prints shown, written-off orders and deleted prints hidden, niet-factureren klant without amounts), Overzicht PDF, logo for the share page, the same 404 for unknown, malformed, expired and revoked tokens (and for a klant whose prints are all deleted), `RATE_LIMIT_SHARE`; screens ScreenShareLinks with TokenReveal and ScreenSharePage (billed, niet-factureren, gone). The link URL uses `PUBLIC_URL`, else the address the Admin used. Open design gaps: GAP-049 (Geldig tot for Nooit; owner chose to leave the row out), GAP-050 and GAP-051 (placeholders approved: close-without-copying confirmation, 0 and 1 day wording), GAP-052 (row columns shift without Intrekken; built as specified).

### M9: Frontend polish
- **Scope:** ScreenSystemStates (error, offline, first run), ScreenApiDocs (`/api-docs` with session injection), tablet and wide layouts from the text specs, empty/loading/error states on every screen, accessibility pass, side-by-side check of every screen against its spec in light/dark × phone/desktop, any open gaps resolved by a newer export.
- **Owner decisions (2026-10-07):** `/api-docs` renders the OpenAPI document with **Scalar** instead of the embedded Swagger UI the design system specifies (GAP-056); the owner prefers the approach of github.com/connorgallopo/tracearr. Scalar runs with `theme: 'none'` and its CSS variables mapped onto our tokens, its AI assistant and platform tools switched off, and it is loaded only with the page.
- **Status:** in review. Built: the OpenAPI document generated from the route schemas (`/api/openapi.json`, Dutch summary and one of six tags per endpoint from a single table, with a test that fails on an undocumented route); ScreenApiDocs with Scalar; ScreenSystemStates offline bar and first-run page with the folder diagram; the Toegang empty state; an accessibility pass over every screen in both themes (axe-core, WCAG 2.1 A and AA: 3 violations found, 0 left); every screen compared at 360, 768 and 1280px in light and dark, with no horizontal overflow and no page errors. Open design gaps: GAP-054 (`.pp-lockhelp` does not wrap on phones), GAP-056 (Scalar instead of Swagger UI), GAP-057 (first-run diagram wraps instead of scrolling) and GAP-058 (ScreenAccess empty state), the last three built as owner-approved placeholders. GAP-055 was withdrawn as a mistaken report.

### M10: Docs, security review, release
- **Scope:** README, USAGE (Dutch), CONFIGURATION, AUTH, DEPLOYMENT (Caddy/Traefik/Nginx with WebSocket upgrade, backups, Postgres/MariaDB, Authentik confidential-client setup, upgrades), ARCHITECTURE (checked against real class names), DEVELOPMENT, CHANGELOG; full security review of the diff and fixes; set the `package.json` version to `1.0.0` (images are already published from `main` since M1).

---

## 5. Known risks

- **Real data:** fixtures are trimmed from a sample; other customers' files may hold new variants. The inspect CLI (M2) lets the owner check any file before a full index.
- **inotify in LXC + Docker:** expected to work on a local disk; if events go missing, a polling fallback is added behind a setting.
- **Spoolman v0.27.0:** fields are verified against that version's API before M6 code is written.
- **Screens:** tablet and wide layouts are described in text, not drawn; where the text is ambiguous I log a gap instead of guessing.
