# prints-portal

A self-hosted portal for 3D prints. Point it at the folder you already keep
your prints in; it indexes what is there, works out what each print cost in
filament and electricity, tracks what a klant owes, makes invoices, and gives
each klant a read-only link to their own prints.

It reads your prints folder and never writes to it.

## What it does

- **Indexes** a `klant/project` folder tree, reading gram and print time from
  OrcaSlicer, Creality Print and Bambu Studio files (`.gcode`, `.3mf`), with
  thumbnails and an STL viewer.
- **Costs** every print from the spool you used and your electricity tariff,
  with [Spoolman](https://github.com/Donkie/Spoolman) if you run it.
- **Prices and payments** per order, including partial payments, write-offs
  and a Nabestelling on an existing print.
- **Invoices** with a per-year number, a stored PDF, credit notes, reminders,
  and an Openstaand overview.
- **Deel-links**: a page a klant opens without an account, showing only their
  own prints, prices and status.
- Dutch interface, light and dark, built for a phone as much as a desktop.

## Getting started

```bash
cp .env.example .env     # set PRINTS_ROOT, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d
```

Then open the address you set as `PUBLIC_URL` and sign in with `ADMIN_EMAIL`.

The image is published at `ghcr.io/makreeltje/prints-portal`.

## Documentation

|                                           |                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------- |
| [USAGE.md](docs/USAGE.md)                 | Daily use, in Dutch: folders, costs, invoices, Deel-links.          |
| [CONFIGURATION.md](docs/CONFIGURATION.md) | Every setting, its default and what it does.                        |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md)       | Docker, reverse proxies, PostgreSQL or MariaDB, backups, upgrading. |
| [AUTH.md](docs/AUTH.md)                   | Roles, sessions, local accounts and OIDC with Authentik.            |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)   | How it is put together and why.                                     |
| [SECURITY.md](docs/SECURITY.md)           | What is protected, how, and what is known to be imperfect.          |
| [DEVELOPMENT.md](DEVELOPMENT.md)          | Running it locally, tests, the checks.                              |
| [CHANGELOG.md](CHANGELOG.md)              | What changed per version.                                           |

## Requirements

Docker, a folder of prints, and somewhere to run it. SQLite is the default and
needs nothing else; PostgreSQL and MariaDB are supported for an existing
database server.
