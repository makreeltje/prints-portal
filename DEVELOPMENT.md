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
# The paths must be absolute: npm runs the backend from backend/, so a relative
# path would resolve against that folder instead of the repository root.
NODE_ENV=development DATA_DIR="$PWD/.local/data" PRINTS_ROOT="$PWD/.local/prints" npm run dev:backend

# Terminal 2: Vite dev server on :5173, proxies /api and /healthz to :8080
npm run dev:frontend
```

`.local/` is git-ignored, so it is also the place to put a real prints folder to
develop against.

## Checks

```bash
npm run verify        # format check, lint, typecheck, tests, design-system checker
npm run format        # apply Prettier
npm run build         # frontend, then backend
```

`scripts/check-design-tokens.sh` also runs after every Claude Code edit and in CI. It resolves paths
relative to the current directory, so run it from the repository root.

## Screenshots

```bash
PRINTS_ROOT=/opt/prints-fixtures npm run screenshots
```

Starts the backend (development mode, a throw-away `DATA_DIR`) and the Vite dev server, signs in
as the development Admin and writes 20 PNGs, `<screen>-<light|dark>-<phone|desktop>.png`, for
dashboard, printdetail (the first print the API returns), wachtrij, facturen and instellingen.
Phone is 390x844, desktop 1440x900. The browser is the system Chromium; `npm ci` downloads none.

| Variable                                                | Default                               | What it does                                                           |
| ------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `PRINTS_ROOT`                                           | `.local/prints`                       | Prints folder the backend indexes.                                     |
| `DATA_DIR`                                              | a temporary folder                    | Backend data folder. A temporary one is removed afterwards.            |
| `SCREENSHOTS_DIR`                                       | `.local/screenshots`                  | Output folder.                                                         |
| `CHROMIUM_PATH`                                         | `/usr/bin/chromium`                   | Browser executable.                                                    |
| `BASE_URL`                                              | unset                                 | Use this running app instead of starting one (no servers are started). |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`                         | `admin@localhost`, `development-only` | Sign-in used.                                                          |
| `SCREENSHOTS_BACKEND_PORT`, `SCREENSHOTS_FRONTEND_PORT` | `18080`, `15173`                      | Ports for the servers the script starts.                               |

The screenshots show real customer names when `PRINTS_ROOT` is a real folder. `.local/` is
git-ignored: never commit them, attach them to a PR or upload them anywhere.

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
npm run inspect -- "/path/to/3D prints/Koen/Bloembak clips"
docker exec prints-portal node backend/dist/cli/inspect.js "/prints/Koen/Bloembak clips"
```

Folders are walked with the same ignore rules as the indexer.

## Docker

```bash
docker build -t prints-portal .
cp .env.example .env   # set PRINTS_ROOT, SESSION_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD
docker compose up
```

Without `NODE_ENV=development` the container refuses to start with a missing or
placeholder `SESSION_SECRET`, and, while no Admin exists, without a usable
`ADMIN_EMAIL`/`ADMIN_PASSWORD`. With `NODE_ENV=development` (as in "Run locally"
above) the first Admin is `admin@localhost` / `development-only` unless `ADMIN_*` are set.

## Publishing

Every push to `main` that passes CI publishes a multi-arch image (`linux/amd64`, `linux/arm64`) to
GitHub Packages as `ghcr.io/makreeltje/prints-portal` with three tags:

- `<version>-<run number>`, e.g. `0.1.0-42`, where the version comes from the root `package.json`
  (bump it for bigger steps);
- `sha-<short commit>`;
- `latest`.

Pull requests only build and health-check the image; they never push.

## Configuration

Every setting, its default and what it does: [docs/CONFIGURATION.md](docs/CONFIGURATION.md).
The app checks them all at start-up and refuses to start while one is wrong,
listing every problem at once.

For development the useful ones are `NODE_ENV=development` (a generated
session secret and a development Admin), `DATA_DIR`, `PRINTS_ROOT` and
`SPOOLMAN_URL`.

## Where the rest is written down

|                                              |                                                           |
| -------------------------------------------- | --------------------------------------------------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Module map, data model, the decisions behind them.        |
| [docs/AUTH.md](docs/AUTH.md)                 | Roles, sessions, CSRF, OIDC.                              |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)     | Docker, reverse proxies, databases, backups, upgrades.    |
| [docs/SECURITY.md](docs/SECURITY.md)         | What is protected and what is known to be imperfect.      |
| [docs/USAGE.md](docs/USAGE.md)               | The Dutch user guide.                                     |
| [docs/PLAN.md](docs/PLAN.md)                 | The milestone plan and the decisions taken per milestone. |
