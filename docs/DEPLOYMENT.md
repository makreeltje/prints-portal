# Deployment

The portal is one container. It needs a folder with your prints (read-only),
a volume for its own data, and a reverse proxy in front of it for HTTPS.

## Docker Compose

```bash
cp .env.example .env     # fill in PRINTS_ROOT, SESSION_SECRET, ADMIN_*
docker compose up -d
```

`docker-compose.yml` mounts `PRINTS_ROOT` at `/prints` **read-only** and keeps
everything the app writes in the named volume `data`. Every setting in
[CONFIGURATION.md](CONFIGURATION.md) is passed through from `.env`; an empty
value counts as unset.

The image is published to `ghcr.io/makreeltje/prints-portal` on every green
push to `main`, tagged with the version, the commit and `latest`.

## Preview instance (Node, no Docker)

A preview runs the newest `main` straight from a checkout, on **test data** (fictitious customers, built from the gcode files in `backend/test/fixtures`) and with local sign-in. It is a systemd **user** service, so no root is needed except once for lingering. It is meant for looking at the app on the LAN, not for real prints.

Everything lives in `~/prints-portal-preview` (override with `PREVIEW_HOME`): `app/` (the checkout), `data/` (SQLite and other app data), `prints/` (the test data) and `preview.env` (mode 600, with a generated `SESSION_SECRET` and the admin sign-in `ADMIN_EMAIL`/`ADMIN_PASSWORD`). The port is 8080 (`PORT`).

```bash
# once, as root, so the service starts at boot and survives logging out
loginctl enable-linger <user>

# first time: checkout, build, test data, env file, enable and start the service
curl -fsSL https://raw.githubusercontent.com/makreeltje/prints-portal/main/scripts/preview/preview.sh | bash -s install

# update to the newest main (one command)
~/prints-portal-preview/app/scripts/preview/preview.sh update

# stop and remove the service (the data stays; delete ~/prints-portal-preview to remove it too)
~/prints-portal-preview/app/scripts/preview/preview.sh uninstall
```

Day to day: `systemctl --user status|restart|stop prints-portal-preview` and `journalctl --user -u prints-portal-preview`.

## Behind a reverse proxy

Three things matter: forward the `X-Forwarded-*` headers, allow the WebSocket
upgrade on `/api/live`, and set `TRUSTED_PROXIES` so the app believes those
headers. Without the upgrade the app still works, but the dashboard stops
updating by itself and the Live dot shows as reconnecting.

Set in `.env`:

```
PUBLIC_URL=https://prints.example.com
TRUSTED_PROXIES=uniquelocal
```

`uniquelocal` covers the private ranges Docker uses; a specific network such
as `172.18.0.0/16` is tighter.

### Caddy

Caddy upgrades WebSockets and sets the forwarded headers by itself:

```caddy
prints.example.com {
    reverse_proxy prints-portal:8080
}
```

### Traefik

With labels on the service in `docker-compose.yml`:

```yaml
labels:
  - traefik.enable=true
  - traefik.http.routers.prints.rule=Host(`prints.example.com`)
  - traefik.http.routers.prints.entrypoints=websecure
  - traefik.http.routers.prints.tls.certresolver=le
  - traefik.http.services.prints.loadbalancer.server.port=8080
```

Traefik handles the upgrade and the forwarded headers on its own.

### Nginx

Nginx needs the upgrade spelled out:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 443 ssl http2;
    server_name prints.example.com;

    # TLS certificate directives here.

    client_max_body_size 4m;   # the logo upload is capped at 1 MB

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 1h;   # keeps the live connection open
    }
}
```

## PostgreSQL or MariaDB

SQLite on the data volume is the default and is enough for one workshop. For
an existing database server, set `DATABASE_URL` and give the app its own
database and user:

```yaml
DATABASE_URL: postgres://prints_portal:<password>@db:5432/prints_portal
# or
DATABASE_URL: mysql://prints_portal:<password>@db:3306/prints_portal
```

Migrations run at start-up on all three, and the app refuses to start if one
fails. There is no built-in migration **between** database engines: starting
on another engine means indexing the prints folder again and re-entering the
settings, so choose before you put real invoices in.

MariaDB needs `utf8mb4`; the tables are created with `utf8mb4_bin`.

## Backups

Back up **`DATA_DIR`** (the `data` volume). It holds:

- the database, when you use SQLite;
- `invoices/` — the stored PDF and a JSON snapshot of every final invoice and
  credit note, which is the part you cannot recreate;
- `branding/logo.png`;
- `thumbnails/` — a cache, recreated on demand.

The prints folder is yours and is never written to, so back it up as you
already do. With PostgreSQL or MariaDB, back the database up separately.

A simple copy while the app runs is fine for the files. For SQLite, stop the
container or use `sqlite3 prints-portal.db ".backup out.db"` so you do not
copy a database mid-write.

Restoring is the reverse: put the volume back, start the container. The index
rebuilds itself from the prints folder if anything is missing.

## Upgrading

```bash
docker compose pull
docker compose up -d
```

Migrations run automatically at start-up. Back up the data volume first; there
is no automatic downgrade, so going back a version means restoring the backup.

Watch the first start after an upgrade:

```bash
docker compose logs -f prints-portal
```

`database migrated` lists the migrations that ran; `prints portal started`
means it is up. The app exits with every problem listed if a setting is wrong.

## Health

`GET /healthz` returns the state of the database and the prints folder, and
answers `503` when either is down, so it works as a container healthcheck
(the image already has one) or an uptime probe. It needs no sign-in.

## If file changes are not picked up

Some network shares and container setups do not deliver file events. Set
`WATCH_POLLING=true` (and `WATCH_POLL_INTERVAL_MS` if five seconds is too
often). **Opnieuw indexeren** in Instellingen always does a full scan.
