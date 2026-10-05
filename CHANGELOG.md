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
- Design system v1.1.
