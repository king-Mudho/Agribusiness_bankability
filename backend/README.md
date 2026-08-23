# ABI backend

Django 5 + Django REST Framework API for the Agribusiness Bankability Index (ABI) Demo
v0.1 -- a research prototype, not a production lending system. See the repository root
`AGENTS.md` and `docs/` for the full specification.

## Local development

```bash
python -m venv .venv
.venv/Scripts/activate            # Windows: .venv\Scripts\activate
pip install -r requirements/dev.txt
cp .env.example .env               # then edit DATABASE_URL, DJANGO_SETTINGS_MODULE=config.settings.dev, etc.
python manage.py migrate
python manage.py seed_abi_v01      # seeds FrameworkVersion 0.1 + demo enterprises
python manage.py runserver
```

A local PostgreSQL instance is required (see `docs/04_TECH_STACK.md`). For a quick local
database:

```bash
docker run -d --name abi-postgres \
  -e POSTGRES_USER=abi_user -e POSTGRES_PASSWORD=devpassword -e POSTGRES_DB=abi_dev \
  -p 5432:5432 postgres:15
```

## Tests

```bash
pytest
```

## Deployment

Configs live under `deploy/` (kept inside `backend/` per the two-top-level-folder rule
in `docs/03_SYSTEM_ARCHITECTURE.md`):

| File | Purpose |
|---|---|
| `deploy/nginx/agribusinessbankability.conf` | Nginx site config: TLS termination, HTTP->HTTPS redirect, `/api/` and `/admin/` -> backend, everything else -> the Next.js frontend (see `frontend/deploy/systemd/abi-frontend.service`). |
| `deploy/systemd/abi-backend.service` | Gunicorn-managed Django service unit. |
| `deploy/backup/pg_backup.sh` | Daily `pg_dump` backup, gzip-compressed, pruned by `ABI_BACKUP_RETENTION_DAYS` (default 14). |
| `deploy/backup/pg_restore.sh` | Restore procedure -- drops and recreates the target database from a backup file. |

See `docs/20_DEPLOYMENT_ARCHITECTURE.md` for the full topology.

### Backup & restore procedure

Backups run daily via `deploy/backup/pg_backup.sh` (wire it into cron or a systemd timer)
and must be copied off the application server -- the script only handles local rotation.

To restore:

```bash
./deploy/backup/pg_restore.sh /path/to/abi-<timestamp>.sql.gz
python manage.py migrate --check   # confirm the restored schema matches the codebase
```

**This procedure has been verified**: a real backup taken from a seeded database was
restored into a scratch database and its row counts (e.g. `frameworks_dimension`)
confirmed to match the source exactly. Re-run this verification after any schema change
that isn't a pure additive migration, and periodically in general -- per
`docs/20_DEPLOYMENT_ARCHITECTURE.md`, a live demo is a bad time to discover backups
don't restore.

### Rollout checklist (docs/20_DEPLOYMENT_ARCHITECTURE.md)

Before the Agricultural Show demo, confirm on the deployed environment:

1. HTTPS is valid for `agribusinessbankability.com` (Certbot-issued, auto-renewing).
2. `python manage.py seed_abi_v01` has been run and "Load Demo Firm" works for both
   Maundurahuku and Zvemuchando (`POST /api/v1/assessments/load-demo/`).
3. Offline mode works on a real mobile device with connectivity toggled off (production
   build only -- the PWA service worker is disabled in `next dev`).
4. PDF/CSV export works (`POST /api/v1/reports/`, `GET /api/v1/reports/{id}/download/`).
5. The aggregate dashboard (`/dashboard`, Research/Lender view) renders with the seeded
   demo data for an Analyst/Researcher/Admin account.

## Environment variables

See `.env.example` and `docs/21_ENVIRONMENT_CONFIGURATION.md`. Never commit a real
`.env`.
