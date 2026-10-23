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

`docker compose up -d` also starts a `backup` service (same image, own
container). Every night it writes a backup of:

- the SQLite database, made with SQLite's online backup, so it is consistent
  while the app keeps writing, and checked with `integrity_check`;
- `DATA_DIR` without the database files: `invoices/` (the stored PDF and JSON
  snapshot of every final invoice and credit note, the part you cannot
  recreate) and `branding/logo.png`. `thumbnails/` is a cache and is skipped.

The prints folder is yours and is never written to, so back it up as you
already do.

### Install

1. Choose a folder for the backups, preferably on **another disk** than the
   Docker volume, and give it to the app user (uid 1000):

   ```bash
   mkdir -p /srv/prints-portal-backups
   chown 1000:1000 /srv/prints-portal-backups
   ```

2. Set it in `.env` (the default is `./backups` next to `docker-compose.yml`):

   ```
   BACKUP_DIR=/srv/prints-portal-backups
   ```

3. `docker compose up -d`. The service makes a first backup when it starts if
   there is none from the last day, then one every day at `BACKUP_TIME`.

   ```bash
   docker compose logs backup        # "backup created: …"
   docker compose exec backup node backend/dist/cli/backup.js list
   ```

The backup is a plain folder per run, `prints-portal-<UTC date and time>`,
holding `manifest.json`, `database/` and `data/`. Copy `BACKUP_DIR` to
another machine or cloud storage with the tool you already use (rsync, restic,
rclone): a backup on the same disk does not survive that disk.

### Schedule and retention

| Variable              | Default     | What it does                                                   |
| --------------------- | ----------- | -------------------------------------------------------------- |
| `BACKUP_DIR`          | `./backups` | Host folder for the backups (`/backups` inside the container). |
| `BACKUP_TIME`         | `03:00`     | Time of day, 24-hour clock in `TZ`.                            |
| `BACKUP_KEEP_DAILY`   | `7`         | Newest backup of each of the last 7 days.                      |
| `BACKUP_KEEP_WEEKLY`  | `4`         | Newest backup of each of the last 4 weeks.                     |
| `BACKUP_KEEP_MONTHLY` | `6`         | Newest backup of each of the last 6 months.                    |

A backup that any of the three rules keeps stays; the rest is removed after
each run. With the defaults that is about 17 backups. Folders in `BACKUP_DIR`
that are not backups are never touched. The service reports **unhealthy** in
`docker compose ps` when the newest backup is more than 36 hours old.

The backup folder must not be inside `DATA_DIR`. A backup holds customer names
and amounts: protect it like the data itself.

### PostgreSQL or MariaDB

The service copies the files only; its log says so. Dump the database
yourself, from a cron job on the host, into the same place:

```bash
docker compose exec -T db pg_dump -U prints_portal prints_portal | gzip > prints_portal-$(date +%F).sql.gz
```

### Run one now, or without the service

```bash
docker compose exec backup node backend/dist/cli/backup.js run
```

### Restore

A restore never overwrites: it writes into an empty folder, you check it, and
then you switch over. It was tested this way on a copy (see the pull request
that added it), not on production.

1. Pick a backup:

   ```bash
   docker compose exec backup node backend/dist/cli/backup.js list
   ```

2. Stop the app, so nothing writes while you swap the data:

   ```bash
   docker compose stop prints-portal backup
   ```

3. Restore into an empty volume. Using a named volume `data_restored` and the
   backup folder from step 1:

   ```bash
   docker volume create prints-portal_data_restored
   docker run --rm \
     -v prints-portal_data_restored:/data \
     -v "$BACKUP_DIR":/backups:ro \
     ghcr.io/makreeltje/prints-portal:latest \
     node backend/dist/cli/backup.js restore prints-portal-20261023T030000Z /data
   ```

   A new volume mounted at `/data` gets the app user as owner. (With a bind
   mount for the data, restore into a new empty host folder the same way, and
   make it yours with `chown -R 1000:1000`.) The command stops
   with an error if the target is not empty.

4. Check it before you switch: point a throw-away container at the restored
   volume, or look at the files:

   ```bash
   docker run --rm -v prints-portal_data_restored:/d alpine ls -l /d /d/invoices
   ```

5. Switch: in `docker-compose.yml` replace the `data` volume with the restored
   one (or move the old volume aside and fill `data` from the restored one),
   then start again:

   ```bash
   docker compose up -d
   docker compose logs -f prints-portal   # "prints portal started"
   ```

6. Keep the old volume until you have looked at a few invoices in the app.

After a restore the index also catches up with the prints folder by itself.
For PostgreSQL or MariaDB, restore the database dump with the tools of that
engine and `invoices/` from the backup into the data volume.

## Upgrading

```bash
docker compose pull
docker compose up -d
```

Migrations run automatically at start-up. Take a backup first (`docker compose exec backup node backend/dist/cli/backup.js run`); there
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
