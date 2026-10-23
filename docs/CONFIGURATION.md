# Configuration

Every setting is an environment variable. The app reads them once at start-up,
checks them all, and **refuses to start** while any of them is wrong, listing
every problem at once rather than failing on the first. An empty value counts
as unset, so a variable you do not use can stay in `.env` as an empty line.

Copy `.env.example` to `.env` and fill in what you need;
`docker-compose.yml` passes all of these through.

## Required

| Variable         | Default   | What it does                                                                                                                              |
| ---------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `PRINTS_ROOT`    | `/prints` | The folder with `<klant>/<project>/…` subfolders. Mounted **read-only**; the app never writes there.                                      |
| `SESSION_SECRET` | —         | Keys the session cookie. At least 32 characters; generate with `openssl rand -base64 48`. The app refuses the `.env.example` placeholder. |

Outside development the app also refuses to start without a way to sign in:
either `ADMIN_EMAIL` and `ADMIN_PASSWORD`, or all four `OIDC_*` variables.

## Storage and network

| Variable          | Default                           | What it does                                                                                                                                                                                                                   |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATA_DIR`        | `/data`                           | Everything the app writes: database (SQLite), thumbnails, invoice PDFs and snapshots, the uploaded logo. Back this up.                                                                                                         |
| `DATABASE_URL`    | `sqlite:///data/prints-portal.db` | `sqlite://…`, `postgres://user:password@host:5432/db` or `mysql://user:password@host:3306/db` (MariaDB too).                                                                                                                   |
| `PORT`            | `8080`                            | Port inside the container. Whole number, 1–65535.                                                                                                                                                                              |
| `HOST`            | `0.0.0.0`                         | Address to bind.                                                                                                                                                                                                               |
| `PUBLIC_URL`      | —                                 | The address people open, without a path or trailing slash. Required with OIDC (it forms the redirect) and used as the base of Deel-link URLs.                                                                                  |
| `TRUSTED_PROXIES` | —                                 | Comma-separated addresses or CIDRs whose `X-Forwarded-*` headers are believed, for example `uniquelocal` or `172.18.0.0/16`. Without it, HTTPS behind a proxy is not recognised and the session cookie is not marked `Secure`. |
| `CORS_ORIGINS`    | —                                 | Other origins that may call the API with cookies. Rarely needed.                                                                                                                                                               |
| `STATIC_DIR`      | the built frontend                | Where the built SPA lives. Only useful in development.                                                                                                                                                                         |

## Sign-in

See [AUTH.md](AUTH.md) for how roles and sessions work.

| Variable             | Default | What it does                                                                                                                 |
| -------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN_EMAIL`        | —       | First Admin, created only while no Admin exists. Must be an e-mail address.                                                  |
| `ADMIN_PASSWORD`     | —       | Its password; at least 12 characters and not the placeholder. Ignored once the Admin exists, and it never resets a password. |
| `OIDC_ISSUER`        | —       | For example `https://auth.example.com/application/o/prints-portal/`.                                                         |
| `OIDC_CLIENT_ID`     | —       | From the provider.                                                                                                           |
| `OIDC_CLIENT_SECRET` | —       | From the provider; the client is confidential.                                                                               |
| `OIDC_ADMIN_GROUP`   | —       | Members of this group become Admin at every sign-in.                                                                         |
| `RATE_LIMIT_LOGIN`   | `5`     | Sign-in attempts per minute per address. 1–1000.                                                                             |
| `RATE_LIMIT_SHARE`   | `60`    | Requests per minute per address on the public share page, its PDF and its logo. 1–1000.                                      |

Set **all four** `OIDC_*` variables or none: a partial set is refused. With
OIDC on, local sign-in is switched off.

## Indexing

| Variable                 | Default | What it does                                                                                             |
| ------------------------ | ------- | -------------------------------------------------------------------------------------------------------- |
| `INDEX_ON_STARTUP`       | `true`  | Scan the whole prints folder when the app starts.                                                        |
| `WATCH_ENABLED`          | `true`  | Watch the folder and index changes as they happen.                                                       |
| `WATCH_DEBOUNCE_MS`      | `2000`  | Quiet period per print before a change is indexed, so a copy in progress is not read halfway.            |
| `WATCH_POLLING`          | `false` | Set to `true` when file events do not arrive, which happens on some network shares and container setups. |
| `WATCH_POLL_INTERVAL_MS` | `5000`  | How often to look, with polling on.                                                                      |

## Spoolman and costs

| Variable                         | Default | What it does                                                                                                                         |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `SPOOLMAN_URL`                   | —       | For example `http://spoolman:7912`. Empty hides every spool feature. Tested against Spoolman v0.27.0.                                |
| `SPOOLMAN_TIMEOUT_MS`            | `3000`  | How long to wait for Spoolman before giving up.                                                                                      |
| `ELECTRICITY_TARIFF_EUR_PER_KWH` | —       | Seeds the tariff **on the first start only**; after that it is a setting in the app. A number between 0 and 10; a comma is accepted. |

## Backups

Read by the `backup` service only (see [DEPLOYMENT.md](DEPLOYMENT.md#backups)), not by the app.

| Variable                                                         | Default       | What it does                                              |
| ---------------------------------------------------------------- | ------------- | --------------------------------------------------------- |
| `BACKUP_DIR`                                                     | `./backups`   | Host folder for the backups. Not inside `DATA_DIR`.       |
| `BACKUP_TIME`                                                    | `03:00`       | Time of day for the daily backup, in `TZ`.                |
| `BACKUP_KEEP_DAILY`, `BACKUP_KEEP_WEEKLY`, `BACKUP_KEEP_MONTHLY` | `7`, `4`, `6` | How many days, weeks and months keep their newest backup. |

## Logging and time

| Variable    | Default                   | What it does                                                                                                      |
| ----------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `LOG_LEVEL` | `info`                    | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`.                                                   |
| `TZ`        | `Europe/Amsterdam`        | Set in `docker-compose.yml`. Dates in the app are computed in Europe/Amsterdam regardless.                        |
| `NODE_ENV`  | `production` in the image | `development` turns on conveniences (a generated session secret, a development Admin) that are refused otherwise. |

Deel-link tokens and OIDC authorization codes are masked in the request log,
so a log file does not hand over access to a klant's prints.

## Checking a configuration

The app prints every problem it found and exits:

```
$ docker compose up
prints-portal  | SESSION_SECRET must be at least 32 characters
prints-portal  | ADMIN_EMAIL must be an e-mail address (got "admin")
```

A warning instead of a refusal means the app started but something is worth
knowing, for example a data folder that is not writable.
