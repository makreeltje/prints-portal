# Development

Developer documentation (English). User documentation is in Dutch in `README.md` and `docs/`.

## Requirements

- Node.js 24 (see `.nvmrc`; 22.12 or newer works)
- Docker, only for building or running the image

## Layout

```
backend/         Fastify API (TypeScript), serves the built SPA in production
frontend/        React SPA (TypeScript, Vite); design-system checker scans frontend/src
design-system/   read-only export of the design system (see CLAUDE.md)
scripts/         check-design-tokens.sh
docs/            plan and documentation
```

## Run locally without Docker

```bash
npm ci
mkdir -p .local/data .local/prints

# Terminal 1: API on :8080 (NODE_ENV=development keeps development conveniences on)
NODE_ENV=development DATA_DIR=.local/data PRINTS_ROOT=.local/prints npm run dev:backend

# Terminal 2: Vite dev server on :5173, proxies /api and /healthz to :8080
npm run dev:frontend
```

`.local/` is git-ignored.

## Checks

```bash
npm run verify        # format check, lint, typecheck, tests, design-system checker
npm run format        # apply Prettier
npm run build         # frontend, then backend
```

`scripts/check-design-tokens.sh` also runs after every Claude Code edit and in CI. It resolves paths
relative to the current directory, so run it from the repository root.

## Database tests

Database tests always run on SQLite. Set `TEST_POSTGRES_URL` and/or `TEST_MYSQL_URL` to run them on
PostgreSQL and MariaDB too (CI does both):

```bash
docker run -d --name pp-pg -e POSTGRES_USER=pp -e POSTGRES_PASSWORD=pp -e POSTGRES_DB=pp -p 15432:5432 postgres:17-alpine
docker run -d --name pp-maria -e MARIADB_ROOT_PASSWORD=pp -e MARIADB_USER=pp -e MARIADB_PASSWORD=pp \
  -e MARIADB_DATABASE=pp -p 13306:3306 mariadb:11
TEST_POSTGRES_URL=postgres://pp:pp@127.0.0.1:15432/pp TEST_MYSQL_URL=mysql://pp:pp@127.0.0.1:13306/pp npm test -w backend
```

The tests drop and recreate the schema, so never point them at a database you care about.

## Inspect print files

The parsers can be run on any file or folder, which prints one JSON object per file with what
the app reads from it (name, slicer comments, slots, plates, thumbnails):

```bash
npm run inspect -- "/path/to/3D prints/Joey/Babybox locks"
docker exec prints-portal node backend/dist/cli/inspect.js "/prints/Joey/Babybox locks"
```

Folders are walked with the same ignore rules as the indexer.

## Docker

```bash
docker build -t prints-portal .
PRINTS_ROOT=/path/to/prints docker compose up
```

## Publishing

Every push to `main` that passes CI publishes a multi-arch image (`linux/amd64`, `linux/arm64`) to
GitHub Packages as `ghcr.io/makreeltje/prints-portal` with three tags:

- `<version>-<run number>`, e.g. `0.1.0-42`, where the version comes from the root `package.json`
  (bump it for bigger steps);
- `sha-<short commit>`;
- `latest`.

Pull requests only build and health-check the image; they never push.

## Configuration

| Variable                 | Default                                | Meaning                                                           |
| ------------------------ | -------------------------------------- | ----------------------------------------------------------------- |
| `PORT`                   | `8080`                                 | HTTP port                                                         |
| `HOST`                   | `0.0.0.0`                              | Bind address                                                      |
| `DATA_DIR`               | `/data`                                | Database and app data                                             |
| `PRINTS_ROOT`            | `/prints`                              | Read-only prints folder                                           |
| `DATABASE_URL`           | `sqlite://<DATA_DIR>/prints-portal.db` | `sqlite://…`, `postgres://…`, `mysql://…` or `mariadb://…`        |
| `LOG_LEVEL`              | `info`                                 | `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`      |
| `STATIC_DIR`             | `frontend/dist` next to the backend    | Built SPA; API only when missing                                  |
| `NODE_ENV`               | `production`                           | `development` or `test` relax production-only checks              |
| `INDEX_ON_STARTUP`       | `true`                                 | Full scan of the prints folder when the app starts                |
| `WATCH_ENABLED`          | `true`                                 | Re-index prints when files change                                 |
| `WATCH_DEBOUNCE_MS`      | `2000`                                 | Quiet period per print before it is re-indexed                    |
| `WATCH_POLLING`          | `false`                                | Poll instead of file-system events (mounts without change events) |
| `WATCH_POLL_INTERVAL_MS` | `5000`                                 | Poll interval when `WATCH_POLLING` is on                          |

The full reference arrives in `docs/CONFIGURATION.md` with the documentation milestone.
