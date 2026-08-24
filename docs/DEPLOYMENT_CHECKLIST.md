# Deployment checklist — agribizframework.com

Practical verification list. Check items off as they're genuinely confirmed
— not as a formality. See `docs/DEPLOYMENT.md` for the commands behind each
item and `docs/PRODUCTION_ARCHITECTURE.md` for why the architecture looks
like this.

## Prerequisites

- [x] DNS configured (`agribizframework.com`, `www.agribizframework.com` ->
      `66.29.139.201`) — verified via public DNS (8.8.8.8).
- [x] Server reachable via SSH — key-based auth working, password auth
      disabled.

## Server preparation

- [ ] `deploy/setup-server.sh` run successfully (no errors, ended with the
      summary block).
- [ ] Required packages installed: nginx, git, python3.12, PostgreSQL 15/16,
      Node.js 20+, firewalld, fail2ban.
- [ ] 2GB swap file active (`swapon --show`).
- [ ] `agribiz` system user exists, no login shell.
- [ ] PostgreSQL initialised, loopback auth is `scram-sha-256` (not the
      AlmaLinux default `ident`).
- [ ] Database `agribiz_prod` and role `agribiz_prod` created; role is
      login + `CREATEDB` only, not superuser.
- [ ] Firewall open for `http`, `https`, `ssh` only —
      PostgreSQL/Gunicorn/Node confirmed NOT externally reachable
      (`firewall-cmd --list-services`; `ss -tulpn` shows 5432/8000/3000 on
      `127.0.0.1` only).
- [ ] `fail2ban` active for sshd.
- [ ] SELinux `httpd_can_network_connect` boolean set (if SELinux is
      enforcing).
- [ ] nginx installed and running (no site config yet at this point).

## Application deployment

- [ ] Code present at `/srv/agribiz/backend` and `/srv/agribiz/frontend`.
- [ ] `backend/.env` created from `deploy/env-templates/backend.env.production`,
      all `REPLACE_WITH_*` placeholders filled with real generated values,
      permissions `600`, owned by `agribiz`.
- [ ] `frontend/.env` created from `deploy/env-templates/frontend.env.production`.
- [ ] `python manage.py check --deploy` passes with no unaddressed warnings.
- [ ] Database migrations applied successfully.
- [ ] `seed_abi_v01` run (or explicitly deferred — see
      `docs/DEPLOYMENT.md` § Database for the seed-data decision).
- [ ] Django static files collected (`staticfiles/` populated).
- [ ] Frontend build succeeded, produced
      `.next/standalone/server.js`.
- [ ] Frontend release assembled under `frontend/releases/<timestamp>/` and
      `frontend/current` symlinked to it.
- [ ] `agribiz-backend` systemd service running
      (`systemctl status agribiz-backend`).
- [ ] `agribiz-frontend` systemd service running.
- [ ] `agribiz-backend` responds on `127.0.0.1:8000` directly.
- [ ] `agribiz-frontend` responds on `127.0.0.1:3000` directly.

## Nginx / SSL

- [ ] `nginx/agribizframework.conf` installed to
      `/etc/nginx/conf.d/agribizframework.conf`.
- [ ] `nginx -t` passes.
- [ ] HTTP (`:80`) responds, including directly by IP
      (`curl -H "Host: agribizframework.com" http://66.29.139.201/`).
- [ ] `certbot --nginx -d agribizframework.com -d www.agribizframework.com --redirect`
      run successfully.
- [ ] HTTPS (`:443`) responds with a valid certificate covering both
      `agribizframework.com` and `www.agribizframework.com`.
- [ ] HTTP redirects to HTTPS (`curl -I http://agribizframework.com/` shows
      a 301/308 to `https://`).
- [ ] `certbot renew --dry-run` succeeds.
- [ ] `certbot-renew.timer` is active
      (`systemctl status certbot-renew.timer`).

## Application-level checks (production URL, not localhost)

- [ ] `https://agribizframework.com/` loads the homepage.
- [ ] `https://agribizframework.com/demo` loads the GigaFood Africa sponsor
      page.
- [ ] `https://agribizframework.com/api/v1/frameworks/0.1/` returns the
      full framework definition (200, JSON).
- [ ] `https://agribizframework.com/django-admin/` is reachable (login
      form, not a 500).
- [ ] A full assessment can be completed end to end through the live site
      (intake -> consent -> 24 questions -> gates -> submit -> results),
      and the score shown matches what the API itself returns for that
      assessment.
- [ ] JWT login works for an internal role (Analyst/Researcher/Admin) —
      test against `/api/v1/auth/token/`.
- [ ] A database write succeeds (e.g. submitting the assessment above
      actually persists — reload the results page and confirm the same
      score).
- [ ] PDF/CSV report generation and download work.
- [ ] No unexpected errors in `journalctl -u agribiz-backend` /
      `agribiz-frontend` from the checks above.

## Backup / rollback

- [ ] `deploy/backup.sh` runs successfully and produces a
      `.sql.gz` file under `/srv/agribiz/backups/`.
- [ ] `deploy/rollback.sh` frontend-only rollback tested at least once (even
      just to confirm the release-symlink swap mechanics work).
- [ ] Rollback procedure documented and understood
      (`docs/DEPLOYMENT.md` § Rollback procedure).

## Security review

- [ ] `DEBUG=False` confirmed in the live environment.
- [ ] No secrets committed to git (`git log -p -- '*.env'` empty; only
      `.env.example` / `*.env.production` templates tracked).
- [ ] `.env` file permissions are `600`, owned by the app user.
- [ ] SSH password authentication disabled; key-only.
- [ ] Firewall confirmed minimal (see "Server preparation" above).
- [ ] PostgreSQL not reachable from outside the server.
- [ ] Redis — not applicable, not installed (app doesn't use it).
- [ ] Security headers present on responses (`X-Content-Type-Options`,
      `X-Frame-Options`, `Referrer-Policy` — see `nginx/agribizframework.conf`).
- [ ] `SECURE_PROXY_SSL_HEADER` and `CSRF_TRUSTED_ORIGINS` set correctly
      (verified indirectly by the Django admin login working over HTTPS).
- [ ] Application services (`agribiz-backend`, `agribiz-frontend`) run as
      the non-root `agribiz` user, confirmed via `systemctl show -p User`.
- [ ] Directory listing disabled (default nginx behaviour; not explicitly
      enabled anywhere in `nginx/agribizframework.conf`).
- [ ] No stray world-writable files under `/srv/agribiz`.

## Sign-off

Only mark this complete once every box above reflects something actually
tested on the live server — not something assumed from the deployment
scripts having run without error. See the final deployment report for
which of these were verified during the initial deployment versus which
remain open.
