# Deployment checklist — agribizframework.com

Practical verification list. Check items off as they're genuinely confirmed
— not as a formality. See `docs/DEPLOYMENT.md` for the commands behind each
item and `docs/PRODUCTION_ARCHITECTURE.md` for why the architecture looks
like this.

**Status: verified live against the actual running deployment on
2026-08-24** (not just "the script ran without error" — every item below was
independently checked against the real server/site).

## Prerequisites

- [x] DNS configured (`agribizframework.com`, `www.agribizframework.com` ->
      `66.29.139.201`) — verified via public DNS (8.8.8.8) and via
      `deploy/check-production.sh`'s DNS section.
- [x] Server reachable via SSH — key-based auth working, password auth
      disabled (verified: a password-auth attempt was actively rejected).

## Server preparation

- [x] `deploy/setup-server.sh` run successfully (no errors, ended with the
      summary block, DB password generated).
- [x] Required packages installed: nginx, git, python3.12 (3.12.13),
      PostgreSQL 16.14, Node.js 20.20.2, firewalld, fail2ban.
- [x] 2GB swap file active (`swapon --show`) — actually exercised under
      real memory pressure during the `next build` step (peaked around
      525MB swap used) without an OOM kill.
- [x] `agribiz` system user exists, no login shell; application services
      confirmed running as this user (`systemctl show -p User`).
- [x] PostgreSQL initialised, loopback auth is `scram-sha-256`.
- [x] Database `agribiz_prod` and role `agribiz_prod` created; role is
      login + `CREATEDB` only, not superuser.
- [x] Firewall open for `http`, `https`, `ssh` only — verified via
      `firewall-cmd --list-services` (`dhcpv6-client http https ssh`) and
      `ss -tulpn` (PostgreSQL/Gunicorn/Node all bound to `127.0.0.1` only).
      A stray `cockpit` firewall rule from the base VPS image (package
      itself was never installed, so this was inert) was found and removed
      during the security review.
- [x] `fail2ban` active for sshd — confirmed actively logging real
      brute-force attempts against this public IP (7 failed attempts logged
      before any hardening completed).
- [x] SELinux `httpd_can_network_connect` boolean set (AlmaLinux ships
      SELinux enforcing by default; without this nginx cannot proxy to the
      app servers at all).
- [x] nginx installed and running.

## Application deployment

- [x] Code present at `/srv/agribiz/backend` and `/srv/agribiz/frontend`.
- [x] `backend/.env` created from `deploy/env-templates/backend.env.production`,
      all placeholders filled with real generated values (`DJANGO_SECRET_KEY`
      and `JWT_SIGNING_KEY` generated separately, confirmed distinct),
      permissions `600`, owned by `agribiz`.
- [x] `frontend/.env` created from `deploy/env-templates/frontend.env.production`.
- [x] `python manage.py check --deploy` passes with no unaddressed warnings
      (only the pre-existing, harmless drf-spectacular schema-naming notices
      remain; every `security.W0xx` warning is gone once the correct prod
      settings module is actually active — see "Fixed during this
      deployment" below).
- [x] Database migrations applied successfully.
- [x] `seed_abi_v01` run — `FrameworkVersion 0.1` and both demo enterprises
      confirmed present via a live `/api/v1/frameworks/0.1/` request and a
      live "Load Demo Firm" call.
- [x] Django static files collected (163 files copied to `staticfiles/`).
- [x] Frontend build succeeded, produced `.next/standalone/server.js`
      (route table matches the local build exactly).
- [x] Frontend release assembled under `frontend/releases/<timestamp>/` and
      `frontend/current` symlinked to it.
- [x] `agribiz-backend` systemd service running.
- [x] `agribiz-frontend` systemd service running.
- [x] `agribiz-backend` responds on `127.0.0.1:8000` directly (with the
      Host/X-Forwarded-Proto headers nginx actually sends — see
      `docs/DEPLOYMENT.md` § Troubleshooting for why a bare
      `curl 127.0.0.1:8000` isn't the right test here).
- [x] `agribiz-frontend` responds on `127.0.0.1:3000` directly.

## Nginx / SSL

- [x] `nginx/agribizframework.conf` installed to
      `/etc/nginx/conf.d/agribizframework.conf`.
- [x] `nginx -t` passes.
- [x] HTTP (`:80`) responds, including directly by IP with the correct Host
      header.
- [x] `certbot --nginx -d agribizframework.com -d www.agribizframework.com --redirect`
      run successfully; certificate issued and deployed.
- [x] HTTPS (`:443`) responds with a valid certificate covering both
      `agribizframework.com` and `www.agribizframework.com` (verified via
      `openssl s_client`, subject `CN=agribizframework.com`, valid through
      2026-11-22).
- [x] HTTP redirects to HTTPS (`301`, `Location: https://...`, confirmed via
      `deploy/check-production.sh`).
- [x] `certbot renew --dry-run` succeeds — "Congratulations, all simulated
      renewals succeeded."
- [x] `certbot-renew.timer` is active. **Found during this deployment: the
      timer was `enabled` (persists across reboots) but not actually
      `start`ed for the current boot session** — `dnf install`ing certbot
      does not appear to start it immediately. Fixed with
      `systemctl start certbot-renew.timer`; confirmed scheduled
      (`systemctl list-timers` showed a real next-run time afterward).

## Application-level checks (production URL, not localhost)

- [x] `https://agribizframework.com/` loads the homepage — verified via
      browser, zero console errors.
- [x] `https://agribizframework.com/demo` loads the GigaFood Africa sponsor
      page.
- [x] `https://agribizframework.com/api/v1/frameworks/0.1/` returns the
      full framework definition (200, JSON).
- [x] `https://agribizframework.com/django-admin/` is reachable (login form,
      not a 500) **and a full login was tested end to end** (temporary test
      superuser, deleted after verification) — landed correctly on
      `/django-admin/` post-login, admin index listed every registered
      model across all twelve apps, static CSS/JS/icons all loaded (200).
      This surfaced and confirmed the fix for a real bug — see "Fixed during
      this deployment" below.
- [x] A full assessment can be completed end to end through the live site:
      used the "Load Demo Firm" API for Maundurahuku, then loaded
      `/results/<id>` in a real browser tab against the live HTTPS site —
      score (58/100, Developing Bankability), dimension breakdown, gates,
      action plan and financing pathways all rendered correctly and matched
      the API response exactly, zero console errors.
- [x] JWT login works for an internal role — tested against
      `/api/v1/auth/token/` with a temporary test user (deleted after).
- [x] A database write succeeds — the Load Demo Firm assessment and its
      results persisted and were re-readable via a fresh `GET` afterward.
- [x] PDF/CSV report generation and download work — generated a real PDF via
      `POST /api/v1/reports/`, downloaded it, confirmed valid `%PDF-1.4`
      magic bytes.
- [x] No unexpected errors in `journalctl -u agribiz-backend` /
      `agribiz-frontend` from the checks above (only the errors already
      documented and fixed during this same deployment — see below).

## Backup / rollback

- [x] `deploy/backup.sh` runs successfully and produces a `.sql.gz` file
      under `/srv/agribiz/backups/` — exercised automatically twice already
      (once per `deploy.sh` run) with real, growing content as the seeded
      data was added.
- [x] `deploy/rollback.sh` tested — with only one frontend release present,
      it correctly detected that and warned rather than doing anything
      unsafe ("Fewer than 2 releases exist... nothing to roll back to"),
      confirming the safety guard itself works. A genuine release-to-release
      swap needs a second deploy to exist first; a second `deploy.sh` run
      was performed for this reason (also serving as the idempotency check
      below) — see the final report for whether that swap was verified too.
- [x] Rollback procedure documented and understood
      (`docs/DEPLOYMENT.md` § Rollback procedure).

## Security review

- [x] `DEBUG=False` confirmed directly against the live Django settings
      object (not inferred from env var content) — printed `False`.
- [x] No secrets committed to git — only `.env.example` and
      `deploy/env-templates/*.env.production` (placeholder values) are
      tracked; verified no `.env` files are present in `git status`/history
      for this deployment work.
- [x] `.env` file permissions are `600`, owned by `agribiz`.
- [x] SSH password authentication disabled; key-only (actively verified by
      attempting and being rejected).
- [x] Firewall confirmed minimal — see "Server preparation" above,
      including the cockpit-rule removal.
- [x] PostgreSQL not reachable from outside the server (`127.0.0.1`/`::1`
      only, confirmed via `ss -tulpn`).
- [x] Redis — not applicable, not installed (app doesn't use it).
- [x] Security headers present on responses (`X-Content-Type-Options`,
      `X-Frame-Options`, `Referrer-Policy`).
- [x] `SECURE_PROXY_SSL_HEADER` and `CSRF_TRUSTED_ORIGINS` set correctly —
      verified directly (not just indirectly): the Django admin login POST,
      which requires a passing CSRF origin check over HTTPS through the
      proxy, succeeded.
- [x] Application services (`agribiz-backend`, `agribiz-frontend`) run as
      the non-root `agribiz` user, confirmed via `systemctl show -p User`.
- [x] Directory listing disabled (default nginx behaviour; not explicitly
      enabled anywhere in `nginx/agribizframework.conf`).
- [x] No stray world-writable files under `/srv/agribiz`
      (`find ... -perm -o+w` returned nothing).

## Fixed during this deployment

Real problems found only by actually running the deployment end to end, not
caught by local testing/review beforehand:

1. **`DJANGO_SETTINGS_MODULE` inside `.env` had no effect on ad-hoc `manage.py`
   invocations.** `manage.py` calls `os.environ.setdefault("DJANGO_SETTINGS_MODULE",
   "config.settings.dev")` before `.env` is ever read, so the first `deploy.sh`
   run silently applied dev settings throughout (`check --deploy` showed every
   `security.W0xx` warning `config/settings/prod.py` is supposed to fix). Fixed
   by exporting it as a real process environment variable for every ad-hoc CLI
   invocation in `deploy.sh` (`as_app_django` wrapper) and in `docs/DEPLOYMENT.md`'s
   manual command examples. The systemd service itself was never affected — its
   `EnvironmentFile=` directive loads `.env` as real environment variables before
   Python even starts.
2. **`collectstatic` failed with a permission error.** `deploy.sh` created
   `backend/staticfiles/` as root before handing off to the `agribiz` user;
   fixed by creating it (and `backend/media/`) as the app user.
3. **`agribiz-backend.service` failed to start entirely** (`status
   226/NAMESPACE`) because its `ReadWritePaths=` listed
   `backend/media/`, which didn't exist yet — systemd's mount namespacing
   requires every listed path to already exist. Fixed by creating it in
   `deploy.sh` before the first service restart.
4. **The backend health check in `deploy.sh` itself returned 400/301**
   against a bare `curl 127.0.0.1:8000` — correct behaviour (`ALLOWED_HOSTS`
   rejecting an unrecognised Host header, `SECURE_SSL_REDIRECT` redirecting
   an apparently-insecure request), not a bug, but the check needed the same
   `Host`/`X-Forwarded-Proto` headers nginx actually sends. Fixed.
5. **`/django-admin/` 404'd after login**, traced to a genuine architecture
   collision: the frontend already owns `/admin` (its own "Internal /
   researcher tools" page), which collides with Django's conventional
   `admin.site.urls` mount point. The first fix attempt (rewriting
   `/django-admin/` → `/admin/` at the nginx layer) was itself broken —
   Django generates login-redirect/admin URLs using the path it *thinks*
   it's mounted at, so the rewrite left Django redirecting to `/admin/...`,
   which nginx then routed to the frontend, producing a Next.js 404 instead
   of a login form. Properly fixed by mounting the admin at `django-admin/`
   directly in `backend/config/urls.py` (a one-line, documented,
   infrastructure-driven change — not something documented as a fixed
   contract anywhere in `docs/`) and using a plain, unrewritten nginx proxy.
   Verified with a full login (temporary superuser, deleted after): correct
   post-login redirect, all twelve apps' models listed, all static
   assets loaded.
6. **`check-production.sh`'s DNS check used `python3`**, which doesn't exist
   on this Windows workstation (only `python` does) — a portability bug in
   the check script itself, not a real DNS problem (confirmed separately via
   `nslookup`). Fixed with an `nslookup` fallback (parsed carefully to skip
   the DNS *server's* own address, which a naive parse would have grabbed
   instead of the resolved host's) plus a `python3`-or-`python` fallback.
7. **`certbot-renew.timer` wasn't actually active** despite being `enabled`
   — see "Nginx / SSL" above. Started explicitly.
8. **A stale `cockpit` firewall rule** from the base VPS image — see
   "Server preparation" above. Removed.

## Sign-off

Every item above reflects something actually tested against the live
`https://agribizframework.com` deployment on 2026-08-24, not assumed from a
script exiting `0`. See the final deployment report for the full summary and
anything still open.
