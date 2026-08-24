# Deployment tooling

Scripts and configuration for deploying ABI to production at
`https://agribizframework.com` on a blank AlmaLinux 9 VPS. Full narrative
walkthrough: `docs/DEPLOYMENT.md`. Architecture and rationale:
`docs/PRODUCTION_ARCHITECTURE.md`. Pre/post-deploy verification list:
`docs/DEPLOYMENT_CHECKLIST.md`.

| File | Purpose | Run as |
|---|---|---|
| `setup-server.sh` | One-time server bootstrap: packages, swap, service user, PostgreSQL, firewall, fail2ban, SELinux, nginx. Idempotent. | root, on the server |
| `deploy.sh` | Build and (re)start the app. Run for the first deploy and every update after. Backs up the database first, runs migrations, builds the frontend, restarts services, validates and reloads nginx, runs health checks. | root, on the server |
| `backup.sh` | `pg_dump` the production database to `/srv/agribiz/backups/`, gzip-compressed, prunes anything older than `ABI_BACKUP_RETENTION_DAYS` (default 14). Called automatically by `deploy.sh`; also fine to run from cron for a regular cadence. | root, on the server |
| `rollback.sh` | Switch the frontend back to the previous release, optionally roll back the backend to a given git commit, optionally (with explicit confirmation) restore a database backup. | root, on the server |
| `check-production.sh` | External-facing health check: DNS, HTTP redirect, HTTPS, certificate, homepage, API, `/demo`, `/django-admin/`, and (when run on the server) systemd unit status. Uses the real hostname throughout — never a bare `127.0.0.1` request. | anywhere with internet access |
| `gunicorn.conf.py` | Gunicorn configuration for the Django API, sized for the ~956MB RAM VPS. | loaded by `agribiz-backend.service` |
| `env-templates/` | Production `.env` templates (placeholder secrets) for both components. | copied into place during initial setup |

Related files elsewhere in the repo (installed onto the server by `deploy.sh`,
not run directly):

- `nginx/agribizframework.conf` -> `/etc/nginx/conf.d/agribizframework.conf`
- `systemd/agribiz-backend.service` -> `/etc/systemd/system/`
- `systemd/agribiz-frontend.service` -> `/etc/systemd/system/`

## First deployment, in order

1. `sudo bash deploy/setup-server.sh` — installs everything and prints the
   generated database password once.
2. Copy the code to `/srv/agribiz/{backend,frontend}` (git clone or rsync).
3. Fill in the two `.env` files from `deploy/env-templates/` (see the
   summary `setup-server.sh` prints at the end, and `docs/DEPLOYMENT.md`).
4. `sudo bash deploy/deploy.sh` — builds and starts both services.
5. `sudo certbot --nginx -d agribizframework.com -d www.agribizframework.com --redirect`
   — issues the certificate and rewrites the nginx config's `:80` block to
   redirect to a new `:443` block. **Do not hand-write an HTTPS server
   block** — see `docs/PRODUCTION_ARCHITECTURE.md` "The 127.0.0.1 lesson"
   for why.
6. `bash deploy/check-production.sh` — verify everything end to end.

## Every deployment after the first

```bash
cd /srv/agribiz/backend  && git pull   # or however new code arrives
cd /srv/agribiz/frontend && git pull
sudo bash /srv/agribiz/deploy/deploy.sh
```

## Rollback

```bash
sudo bash /srv/agribiz/deploy/rollback.sh                       # frontend only
sudo bash /srv/agribiz/deploy/rollback.sh --backend <git-sha>    # + backend code
sudo bash /srv/agribiz/deploy/rollback.sh --restore-db /srv/agribiz/backups/agribiz-<timestamp>.sql.gz
```

Database restore requires typing the database name to confirm — it is
destructive (every write since that backup was taken is lost) and the script
will not proceed without that confirmation.
