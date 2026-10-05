# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- Design system v1.1.
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
  `CORS_ORIGINS`. Screens: login, Gebruikers (list, role, remove) and Toegang (access matrix).
  Local users sign in with an e-mail address or a name; a password set by an Admin is temporary
  and must be replaced at the next sign-in; everyone can change their own password
  (`POST /api/auth/password`).

### Changed

- The app now needs `SESSION_SECRET`, and `ADMIN_EMAIL`/`ADMIN_PASSWORD` until a first Admin
  exists; it refuses to start without them outside development.
- Every `/api` path needs a signed-in user unless it is explicitly public.

- CI actions moved to versions that run on Node 24.
