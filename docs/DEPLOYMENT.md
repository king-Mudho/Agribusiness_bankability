# Deployment — agribizframework.com

Full walkthrough for deploying ABI to production. See also
`docs/PRODUCTION_ARCHITECTURE.md` (why the architecture looks like this) and
`docs/DEPLOYMENT_CHECKLIST.md` (a flat verification list).

## Server

| | |
|---|---|
| IP | `66.29.139.201` |
| OS | AlmaLinux 9 (confirmed 9.7, "Moss Jungle Cat") |
| Hostname | `server1.agribizframework.com` |
| RAM | ~956MB — see the swap/sizing notes throughout this doc |
| Disk | 20GB (17GB free at provisioning) |
| Provider | Namecheap VPS, Spark plan. The IP sits in Namecheap's `NAMEC-4` block (`66.29.128.0/19`, ARIN). Earlier versions of this doc said Contabo, which was wrong. |
| Access | SSH key only (root). Password authentication is disabled — see "Initial server setup" § SSH hardening. |

## Domain

`agribizframework.com` / `www.agribizframework.com`, both pointing at
`66.29.139.201`.

> **Domain note.** The rest of this repository's `docs/` describes the
> application's domain as `agribusinessbankability.com` (see `AGENTS.md`
> ground rule 8). This production deployment intentionally uses a different
> domain, `agribizframework.com`. Nothing in the application depends on which
> domain it's deployed under — every reference is environment-driven, never
> hardcoded — so this required no code changes, only different `.env`
> values. See `docs/PRODUCTION_ARCHITECTURE.md` § Domain note for the full
> explanation of why this is flagged rather than silently resolved.

## DNS

Required records, at whatever registrar/DNS provider manages
`agribizframework.com`:

```
Type: A     Host: @      Value: 66.29.139.201
Type: A     Host: www    Value: 66.29.139.201
```

**Status at the time of this deployment: already configured and
propagated.** Verified via public DNS (`8.8.8.8`):

```
$ nslookup agribizframework.com 8.8.8.8
Name:    agribizframework.com
Address:  66.29.139.201

$ nslookup www.agribizframework.com 8.8.8.8
Name:    www.agribizframework.com
Address:  66.29.139.201
```

If you're setting this up somewhere new and DNS isn't configured yet: add
the two records above, then wait for propagation (`dig agribizframework.com
+short`) before running certbot — the HTTP-01 challenge needs the domain to
actually resolve here.

## Initial server setup

### SSH access

This deployment was bootstrapped from a provider-issued (Namecheap) temporary root
password. That password was used exactly once, to install an SSH key, and
is no longer valid — **SSH password authentication is disabled** on this
server (`PasswordAuthentication no` in `/etc/ssh/sshd_config`; verified by
attempting a password login and confirming it's rejected). Root login is
permitted only with a key (`PermitRootLogin prohibit-password`).

To connect:

```bash
ssh -i ~/.ssh/id_ed25519_agribizframework root@66.29.139.201
```

If you need to add another admin's key, append their public key to
`/root/.ssh/authorized_keys` (mode `600`, directory mode `700`).

**If SSH access is ever lost** (key lost, `sshd_config` misconfigured):
use the out-of-band console (VNC) in Namecheap's VPS management panel
(Namecheap account → Hosting List → this VPS). It works independently of
SSH; use it to fix `/etc/ssh/sshd_config` and restart `sshd`.

> **Shared IP history.** Namecheap reuses VPS addresses. `66.29.139.201`
> most likely belonged to another customer before this server (provisioned
> around 23 Aug 2026). An unrelated domain, `codmtracker.com` (registered
> at Namecheap on 3 Mar 2026), still points here. That is why
> `nginx/00-default-reject.conf` exists (see § Nginx → Unknown hostnames).

### Server bootstrap

```bash
scp -r deploy nginx systemd root@agribizframework.com:/tmp/agribiz-deploy-infra
ssh root@agribizframework.com
mkdir -p /srv/agribiz && cp -r /tmp/agribiz-deploy-infra/* /srv/agribiz/ 2>/dev/null || true
# (deploy.sh expects deploy/, nginx/, systemd/ directly under /srv/agribiz —
#  see "Application deployment" below for the full directory layout.)
sudo bash /srv/agribiz/deploy/setup-server.sh
```

This installs and configures (see `deploy/setup-server.sh` for the exact
commands and the reasoning behind each):

- System packages: `nginx git curl tar policycoreutils-python-utils nano python3.12 python3.12-devel gcc make libpq-devel firewalld fail2ban`
- PostgreSQL (module stream 16, falling back to 15), initialised with
  `scram-sha-256` password auth (AlmaLinux's default `ident` auth cannot
  authenticate Django's database user at all)
- Node.js 20 (NodeSource; AlmaLinux's own `nodejs` module stream is too old
  for Next.js 15)
- A 2GB swap file (`~956MB` physical RAM is not enough headroom for a
  `next build` on its own)
- A dedicated `agribiz` system user (no login shell, no password) — both
  application services run as this user, never as root
- `firewalld`, opened for `http`, `https`, `ssh` only — PostgreSQL,
  Gunicorn (`:8000`) and Node (`:3000`) all bind to loopback and are never
  exposed externally
- `fail2ban` for SSH (this server is already seeing brute-force attempts
  from the public internet — normal for any public IP, and worth banning)
- The SELinux boolean `httpd_can_network_connect`, without which nginx
  cannot proxy to the local app servers at all (every request would 502)
- `nginx`, started and enabled (no site config installed yet — that happens
  in `deploy.sh`)

Do not install anything not listed above — Redis and Celery in particular
are deliberately absent; the application doesn't use them
(`backend/config/settings/base.py:149`).

## Application deployment

Directory layout on the server:

```
/srv/agribiz/
├── backend/            # this repo's backend/, plus venv/, staticfiles/, media/, .env
├── frontend/
│   ├── (this repo's frontend/ source, plus .env — build happens here)
│   ├── releases/<timestamp>/   # assembled standalone builds, kept: last 3
│   └── current -> releases/<timestamp>/   # symlink, what agribiz-frontend.service actually runs
├── deploy/              # this repo's deploy/
├── nginx/               # this repo's nginx/
├── systemd/             # this repo's systemd/
├── logs/
└── backups/             # pg_dump output from deploy/backup.sh
```

Get the code onto the server (choose one):

```bash
# Option A: git clone directly on the server (needs the repo to be pushed somewhere reachable)
sudo -u agribiz git clone <repo-url> /srv/agribiz/backend-tmp
# then split backend/ and frontend/ subtrees into /srv/agribiz/backend and /srv/agribiz/frontend,
# or clone the whole repo and point deploy.sh's BACKEND/FRONTEND paths at the subdirectories.

# Option B: rsync from your workstation
rsync -az --exclude .git --exclude node_modules --exclude .next --exclude .venv \
  ./backend/  root@agribizframework.com:/srv/agribiz/backend/
rsync -az --exclude .git --exclude node_modules --exclude .next \
  ./frontend/ root@agribizframework.com:/srv/agribiz/frontend/
rsync -az ./deploy/  root@agribizframework.com:/srv/agribiz/deploy/
rsync -az ./nginx/   root@agribizframework.com:/srv/agribiz/nginx/
rsync -az ./systemd/ root@agribizframework.com:/srv/agribiz/systemd/
```

Then:

```bash
ssh root@agribizframework.com
sudo -u agribiz cp /srv/agribiz/deploy/env-templates/backend.env.production  /srv/agribiz/backend/.env
sudo -u agribiz cp /srv/agribiz/deploy/env-templates/frontend.env.production /srv/agribiz/frontend/.env
sudo chmod 600 /srv/agribiz/backend/.env
sudo nano /srv/agribiz/backend/.env   # fill in DJANGO_SECRET_KEY, JWT_SIGNING_KEY, DATABASE_URL password

sudo bash /srv/agribiz/deploy/deploy.sh
```

`deploy.sh` (see `deploy/README.md` for the full description) backs up the
database, installs dependencies, runs Django checks and migrations, collects
static files, builds the frontend, assembles a new release, restarts both
systemd services, installs and validates the nginx config, and runs health
checks against `127.0.0.1:8000`, `127.0.0.1:3000`, and — once nginx is up —
the real hostname.

## Environment variables

See `docs/21_ENVIRONMENT_CONFIGURATION.md` for what each variable means, and
`deploy/env-templates/*.env.production` for the production values (with
placeholder secrets — never commit the filled-in files).

Every secret (`DJANGO_SECRET_KEY`, `JWT_SIGNING_KEY`, the database password)
must be generated fresh for this deployment, not reused from any other
environment. Generate with:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

The database password is generated automatically by `setup-server.sh` and
printed once at the end of its output.

## Database

Created by `setup-server.sh`: database `agribiz_prod`, role `agribiz_prod`
(login + `CREATEDB` only — not a superuser), password auth over
`scram-sha-256`, reachable only on loopback.

Migrations run as part of every `deploy.sh` run. If running by hand,
`DJANGO_SETTINGS_MODULE` must be exported explicitly — `manage.py` sets its
own dev-settings fallback at import time, before `.env` is ever read, so
having it only inside `.env` does not select prod settings for an ad-hoc
CLI invocation (the `agribiz-backend` systemd service is unaffected — its
`EnvironmentFile=` directive loads `.env` as real process environment
variables before Python even starts):

```bash
cd /srv/agribiz/backend
sudo -u agribiz env DJANGO_SETTINGS_MODULE=config.settings.prod \
    venv/bin/python manage.py migrate --noinput
```

**Seed/demo data:** `manage.py seed_abi_v01` seeds `FrameworkVersion 0.1`
(the six dimensions, 24 questions, five gates, five bands — required for the
app to function at all) **and** two demo enterprises (Maundurahuku,
Zvemuchando) used by the wizard's "Load Demo Firm" buttons. The framework
seed is required in production. The two demo enterprises are fabricated
example data, not real respondent data — whether to include them in this
specific production deployment (e.g. for demoing at
`agribizframework.com/demo`, mirroring the GigaFood Africa booth use case)
versus keeping production clean of any non-real records is a product
decision, not a technical one. Default: run the full command, since the
`/demo` page's "Load Demo Firm" buttons are part of the documented
functionality and are meaningless without the two seeded enterprises.

```bash
cd /srv/agribiz/backend
sudo -u agribiz env DJANGO_SETTINGS_MODULE=config.settings.prod \
    venv/bin/python manage.py seed_abi_v01
```

## Nginx

Config: `nginx/agribizframework.conf`, installed by `deploy.sh` to
`/etc/nginx/conf.d/agribizframework.conf`. One `:80` server block only —
see `docs/PRODUCTION_ARCHITECTURE.md` "The 127.0.0.1 lesson" for why a
hand-written `:443` block is not added here.

```bash
sudo nginx -t                 # validate syntax before ever reloading
sudo systemctl reload nginx   # deploy.sh does this automatically
```

### Unknown hostnames (catch-all)

`nginx/00-default-reject.conf` is installed by `deploy.sh` on every run to
`/etc/nginx/conf.d/00-default-reject.conf`. It is the `default_server` on
`:443` and refuses the TLS handshake (`ssl_reject_handshake on`) for any
hostname not named in a `server_name`. certbot never edits it.

Why it exists: an unrelated domain (`codmtracker.com`) had DNS pointing at
this server's IP. With certbot's `:443` block as the only HTTPS server, nginx
served the ABI app under that name. Google indexed it there and listed it
ahead of agribizframework.com. Visitors saw "Not secure" (wrong certificate),
and the assessment page hung because its API calls went cross-origin.

The frontend also sets a canonical URL on `/` and `/demo`, and serves
`/robots.txt` and `/sitemap.xml`, all built from `NEXT_PUBLIC_APP_DOMAIN`.

Check after deploying (expect a handshake failure for the foreign name and
200 for the real one):

```bash
curl -sI --resolve codmtracker.com:443:127.0.0.1 https://codmtracker.com/          # should fail
curl -sI --resolve agribizframework.com:443:127.0.0.1 https://agribizframework.com/  # 200
curl -s https://agribizframework.com/robots.txt
```

### Google Search Console

**Status: set up on 17 Nov 2026.**

| Item | State |
|---|---|
| Property | `agribizframework.com`, Domain type (covers http/https, `www` and every subdomain) |
| Owner account | The Mudhotech Google account (ask the project owner for access) |
| Verification | DNS TXT record at Namecheap: Host `@`, value `google-site-verification=…` |
| Sitemap | `https://agribizframework.com/sitemap.xml`, accepted with 2 pages |
| Indexing requested | `https://agribizframework.com/` and `https://agribizframework.com/demo` |

On 17 Nov 2026 both pages showed "URL is not on Google" (never indexed
before), and the Live Test reported "URL is available to Google". Indexing
normally follows within days to about two weeks.

**Do not delete the `google-site-verification` TXT record** in Namecheap →
Domain List → agribizframework.com → Advanced DNS. Google re-checks it
periodically, and removing it drops the verification. It sits alongside the
SPF TXT record (`v=spf1 include:spf.efwd.registrar-servers.com ~all`); both
must stay.

To check progress, search `site:agribizframework.com`, or in Search Console
use URL Inspection on the home page and look for "URL is on Google".
Re-requesting indexing does not move a page up the crawl queue.

If DNS ever moves away from Namecheap, copy the TXT record to the new
provider before switching nameservers.

## SSL

```bash
sudo dnf -y install certbot python3-certbot-nginx
sudo certbot --nginx -d agribizframework.com -d www.agribizframework.com --redirect
```

This issues the certificate **and** rewrites
`/etc/nginx/conf.d/agribizframework.conf` to add the `:443` server block,
the certificate paths, and the HTTP→HTTPS redirect on the existing `:80`
block. Do not write that block by hand.

Verify:

```bash
sudo certbot certificates
curl --resolve agribizframework.com:443:127.0.0.1 https://agribizframework.com/ -I
```

Renewal is automatic via the `certbot-renew.timer` systemd timer that the
`certbot` package installs. Confirm it's active and test the renewal path
without actually renewing:

```bash
systemctl status certbot-renew.timer
sudo certbot renew --dry-run
```

## Services

| systemd unit | What | Logs |
|---|---|---|
| `agribiz-backend` | Django API via Gunicorn (`127.0.0.1:8000`) | `journalctl -u agribiz-backend` |
| `agribiz-frontend` | Next.js standalone SSR (`127.0.0.1:3000`) | `journalctl -u agribiz-frontend` |
| `nginx` | Reverse proxy, TLS termination, static files | `/var/log/nginx/agribiz-{access,error}.log` |
| `postgresql` | Database | `journalctl -u postgresql` |
| `certbot-renew.timer` | Scheduled certificate renewal | `journalctl -u certbot-renew` |
| `fail2ban` | SSH brute-force protection | `journalctl -u fail2ban`, `fail2ban-client status sshd` |

### Restart commands

```bash
sudo systemctl restart agribiz-backend
sudo systemctl restart agribiz-frontend
sudo systemctl reload  nginx     # config change, no dropped connections
sudo systemctl restart nginx     # if reload isn't enough
sudo systemctl restart postgresql
```

### Logs

```bash
sudo journalctl -u agribiz-backend  -n 100 --no-pager
sudo journalctl -u agribiz-frontend -n 100 --no-pager
sudo journalctl -u agribiz-backend  -f          # follow live
sudo tail -n 100 /var/log/nginx/agribiz-error.log
sudo tail -n 100 /var/log/nginx/agribiz-access.log
```

## Update procedure

```bash
# pull/copy new code into /srv/agribiz/backend and /srv/agribiz/frontend
sudo bash /srv/agribiz/deploy/deploy.sh
```

`deploy.sh` backs up the database before migrating, so every update has a
fresh restore point automatically. Verify afterward:

```bash
bash /srv/agribiz/deploy/check-production.sh
```

## Rollback procedure

See `deploy/README.md` § Rollback for full command reference. Summary:

```bash
sudo bash /srv/agribiz/deploy/rollback.sh                        # frontend to previous release
sudo bash /srv/agribiz/deploy/rollback.sh --backend <git-sha>     # + backend code to a commit
sudo bash /srv/agribiz/deploy/rollback.sh --restore-db <backup-file>  # + database (destructive, confirmed interactively)
```

This deployment does not provide zero-downtime rollback — services restart
during both `deploy.sh` and `rollback.sh`, causing a brief interruption (a
few seconds, based on the health-check timing in both scripts).

## Troubleshooting

**502 Bad Gateway from nginx.**
Almost always one of: the backend/frontend service isn't running
(`systemctl status agribiz-backend agribiz-frontend`), or SELinux is
blocking the proxy connection (`getenforce`, then
`setsebool -P httpd_can_network_connect 1` if enforcing and not yet set —
see `setup-server.sh` step 6).

**`curl http://127.0.0.1/` returns 404 after certbot has run.**
Expected, not a bug — see `docs/PRODUCTION_ARCHITECTURE.md` "The 127.0.0.1
lesson". Test with the real hostname:
`curl --resolve agribizframework.com:443:127.0.0.1 https://agribizframework.com/`.

**Django admin login redirects back to the login form / CSRF error.**
Check `CSRF_TRUSTED_ORIGINS` in `backend/.env` includes
`https://agribizframework.com` (with scheme) and that
`config/settings/prod.py`'s `SECURE_PROXY_SSL_HEADER` is in place — without
it Django never recognises the proxied request as HTTPS and
`SECURE_SSL_REDIRECT` loops forever.

**`gunicorn` fails to start / `agribiz-backend` unit fails.**
`journalctl -u agribiz-backend -n 50` first. Common causes: `.env` missing
or unreadable (must be owned by `agribiz`, mode `600`), `DJANGO_SECRET_KEY`
unset (prod.py raises `RuntimeError` deliberately), or the database
unreachable (`DATABASE_URL` password wrong, or `postgresql.service` down).

**Next.js frontend 502s but `agribiz-frontend` shows active.**
Confirm the `current` symlink actually points somewhere valid:
`ls -la /srv/agribiz/frontend/current` — if a deploy was interrupted
mid-release-swap, it can point at a partial directory. Re-run `deploy.sh`.

**Out of memory during `npm run build`.**
Confirm swap is active: `swapon --show`. If the swap file is missing
(shouldn't happen if `setup-server.sh` ran successfully), re-run it — that
step is idempotent.

**`npm ci` fails with a lockfile/npm-version mismatch.**
`deploy.sh` falls back to `npm install` automatically and prints a warning.
The build is still verified by the health checks at the end either way; fix
the lockfile mismatch (regenerate `package-lock.json` with the npm version
actually installed on the server) when convenient, not urgently.

**Certificate renewal fails.**
`sudo certbot renew --dry-run` reproduces the failure without touching the
live certificate. Most common cause on this setup: the `:80` block was
edited by hand and no longer matches what certbot expects — restore it from
`nginx/agribizframework.conf` in this repo and re-run
`certbot --nginx -d agribizframework.com -d www.agribizframework.com --redirect`.
