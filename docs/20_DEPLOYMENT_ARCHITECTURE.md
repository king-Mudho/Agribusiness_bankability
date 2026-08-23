# 20 — Deployment architecture

## Topology

```
Domain: agribusinessbankability.com
        │
        ▼
   Nginx (reverse proxy, HTTPS via Let's Encrypt/Certbot)
        │
        ├──────────────► Next.js frontend
        │                 (built + served, e.g. `next start` under a process manager,
        │                  or static export behind Nginx if fully static routes allow)
        │
        └──────────────► Django REST API
                            (Gunicorn or Uvicorn workers)
                               │
                               ▼
                          PostgreSQL
```

## Process management

- Django: Gunicorn (WSGI) or Uvicorn workers behind Nginx, managed by `systemd` (a
  `abi-backend.service` unit) or an equivalent process supervisor.
- Next.js: run the production build under a process manager (PM2, or a `systemd`
  `abi-frontend.service` unit) — do not run `next dev` in production.
- PostgreSQL: managed service or a `systemd`-managed local instance with scheduled
  `pg_dump` backups (daily, retained per available disk).

## Nginx responsibilities

- Terminate TLS (Certbot-issued certificate for `agribusinessbankability.com` and
  `www.agribusinessbankability.com`).
- Route `/api/` and `/api/schema/`/`/api/docs/` to the Django backend.
- Route everything else to the Next.js frontend.
- Serve/cache static assets with sensible cache headers; do not cache API responses.
- Redirect all HTTP to HTTPS.

## Environments

For the Agricultural Show demo, a single production environment is sufficient — a
separate staging environment is not required for v0.1, but keep `dev`/`prod` Django
settings split (`08_BACKEND_ARCHITECTURE.md`) so local development never accidentally
runs with production settings.

## Backups & recovery

- Daily PostgreSQL dump, stored off the application server.
- Document the restore procedure in `backend/README.md` (not just implied) — a
  demonstration event is a bad time to discover backups don't restore.

## Rollout checklist for the live demo

1. Confirm HTTPS is valid for `agribusinessbankability.com`.
2. Confirm `24_SEED_DATA.md` demo enterprises (Maundurahuku, Zvemuchando) are loaded and
   the "Load Demo Firm" flow works end to end.
3. Confirm offline mode works on a real mobile device with connectivity toggled off.
4. Confirm PDF/CSV export works.
5. Confirm the aggregate dashboard renders with at least the seeded demo data.
