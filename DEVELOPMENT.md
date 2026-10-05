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

## Docker

```bash
docker build -t prints-portal .
PRINTS_ROOT=/path/to/prints docker compose up
```

## Configuration

| Variable       | Default                                | Meaning                                                      |
| -------------- | -------------------------------------- | ------------------------------------------------------------ |
| `PORT`         | `8080`                                 | HTTP port                                                    |
| `HOST`         | `0.0.0.0`                              | Bind address                                                 |
| `DATA_DIR`     | `/data`                                | Database and app data                                        |
| `PRINTS_ROOT`  | `/prints`                              | Read-only prints folder                                      |
| `DATABASE_URL` | `sqlite://<DATA_DIR>/prints-portal.db` | `sqlite://…`, `postgres://…`, `mysql://…` or `mariadb://…`   |
| `LOG_LEVEL`    | `info`                                 | `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent` |
| `STATIC_DIR`   | `frontend/dist` next to the backend    | Built SPA; API only when missing                             |
| `NODE_ENV`     | `production`                           | `development` or `test` relax production-only checks         |

The full reference arrives in `docs/CONFIGURATION.md` with the documentation milestone.
