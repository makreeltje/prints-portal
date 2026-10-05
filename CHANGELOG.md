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

### Changed

- CI actions moved to versions that run on Node 24.
