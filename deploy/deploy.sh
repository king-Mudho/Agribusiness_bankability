#!/usr/bin/env bash
#
# Build and (re)start the application. Run for the first deploy and for
# every update afterwards.
#
#   sudo bash /srv/agribiz/deploy/deploy.sh
#
# What it does:
#   1. verifies environment and required files
#   2. backs up the database (skipped on a first deploy -- nothing to back up yet)
#   3. installs/updates Python dependencies, runs Django checks and migrations
#   4. collects Django static files
#   5. installs/updates Node dependencies, builds the frontend (standalone output)
#   6. assembles a new frontend release and keeps the last 3 for rollback
#   7. restarts both systemd services
#   8. validates nginx and reloads it
#   9. runs health checks against the real hostname (not 127.0.0.1 -- see
#      docs/PRODUCTION_ARCHITECTURE.md)
#  10. prints a summary
#
# Assumes setup-server.sh has already run, both .env files exist, and the
# code is already checked out at /srv/agribiz/{backend,frontend}.

set -euo pipefail

APP_USER="agribiz"
APP_DIR="/srv/agribiz"
BACKEND="$APP_DIR/backend"
FRONTEND="$APP_DIR/frontend"
FRONTEND_RELEASES="$FRONTEND/releases"
FRONTEND_CURRENT="$FRONTEND/current"
PYTHON="python3.12"
KEEP_RELEASES=3

# Public hostname, used only by the final nginx health check. It must be a
# name nginx actually serves: after certbot, requests carrying any other
# Host (127.0.0.1 included) hit certbot's redirect block and get a 404.
SITE_DOMAIN="${SITE_DOMAIN:-agribizframework.com}"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$1"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$1" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run this with sudo."
[[ -d "$BACKEND"  ]] || die "$BACKEND not found. Copy the code to $APP_DIR first."
[[ -d "$FRONTEND" ]] || die "$FRONTEND not found. Copy the code to $APP_DIR first."
[[ -f "$BACKEND/.env"  ]] || die "$BACKEND/.env is missing (see deploy/env-templates/)."
[[ -f "$FRONTEND/.env" ]] || die "$FRONTEND/.env is missing (see deploy/env-templates/)."

APP_HOME="$(getent passwd "$APP_USER" | cut -d: -f6)"
as_app() { sudo -u "$APP_USER" env "HOME=$APP_HOME" "PATH=$PATH" "$@"; }

# manage.py sets DJANGO_SETTINGS_MODULE=config.settings.dev as its own
# os.environ.setdefault() fallback, at import time -- before django-environ
# ever gets a chance to read backend/.env. Setting DJANGO_SETTINGS_MODULE
# only inside .env therefore has NO effect on which settings module gets
# selected; it must be a real process environment variable. This bit a real
# deploy: `manage.py check --deploy` silently ran against dev settings
# (DEBUG, SECURE_SSL_REDIRECT etc. never got prod.py's hardening) with no
# error, only warnings that are easy to miss. agribiz-backend.service sets
# this the same way, for the same reason.
as_app_django() {
    sudo -u "$APP_USER" env "HOME=$APP_HOME" "PATH=$PATH" \
        "DJANGO_SETTINGS_MODULE=config.settings.prod" "$@"
}

log "Fixing ownership"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ------------------------------------------------------------------ backup

if systemctl is-active --quiet postgresql && [[ -x "$APP_DIR/deploy/backup.sh" ]]; then
    log "Backing up the database before migrating"
    bash "$APP_DIR/deploy/backup.sh" || warn "Backup failed -- continuing, but you have no fresh restore point for this deploy."
else
    warn "Skipping backup (postgresql not active yet, or backup.sh missing) -- expected on a first deploy."
fi

# ------------------------------------------------------------------- backend

log "Installing Python dependencies"
if [[ ! -d "$BACKEND/venv" ]]; then
    as_app "$PYTHON" -m venv "$BACKEND/venv"
fi
as_app "$BACKEND/venv/bin/pip" install --quiet --upgrade pip
as_app "$BACKEND/venv/bin/pip" install --quiet -r "$BACKEND/requirements/prod.txt"

# systemd's ReadWritePaths= (agribiz-backend.service) requires every listed
# path to already exist -- if one doesn't, mount namespacing fails hard
# (status 226/NAMESPACE) and gunicorn never even starts, before it gets a
# chance to write anything itself.
as_app mkdir -p "$BACKEND/media" "$APP_DIR/logs"

log "Checking Django configuration"
( cd "$BACKEND" && as_app_django "$BACKEND/venv/bin/python" manage.py check --deploy ) || \
    die "Django checks failed -- fix backend/.env before continuing."

log "Running database migrations"
( cd "$BACKEND" && as_app_django "$BACKEND/venv/bin/python" manage.py migrate --noinput )

log "Collecting Django static files"
as_app mkdir -p "$BACKEND/staticfiles"
( cd "$BACKEND" && as_app_django "$BACKEND/venv/bin/python" manage.py collectstatic --noinput --clear )

# ------------------------------------------------------------------ frontend

log "Checking Node version"
NODE_MAJOR="$(node --version 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || echo 0)"
if (( NODE_MAJOR < 20 )); then
    die "Node $(node --version 2>/dev/null || echo 'not installed') is too old.
     The frontend requires Node >= 20. Re-run setup-server.sh."
fi

log "Installing Node dependencies"
if ! ( cd "$FRONTEND" && as_app npm ci --no-audit --no-fund ); then
    warn "npm ci failed -- falling back to 'npm install'."
    warn "This usually means package-lock.json was generated by a different npm major version."
    ( cd "$FRONTEND" && as_app npm install --no-audit --no-fund )
fi

log "Building the frontend (this is the memory-hungry step)"
( cd "$FRONTEND" && as_app npm run build )

[[ -f "$FRONTEND/.next/standalone/server.js" ]] || \
    die "Build did not produce .next/standalone/server.js -- check next.config.ts has output: \"standalone\"."

log "Assembling frontend release"
RELEASE_ID="$(date +%Y%m%d%H%M%S)"
RELEASE_DIR="$FRONTEND_RELEASES/$RELEASE_ID"
mkdir -p "$RELEASE_DIR"

# Standalone output does not include static assets or public/ on its own --
# this is the documented Next.js standalone deployment pattern, not
# something specific to this app.
cp -r "$FRONTEND/.next/standalone/." "$RELEASE_DIR/"
mkdir -p "$RELEASE_DIR/.next"
cp -r "$FRONTEND/.next/static" "$RELEASE_DIR/.next/static"
[[ -d "$FRONTEND/public" ]] && cp -r "$FRONTEND/public" "$RELEASE_DIR/public"
cp "$FRONTEND/.env" "$RELEASE_DIR/.env"
chown -R "$APP_USER:$APP_USER" "$RELEASE_DIR"

ln -sfn "$RELEASE_DIR" "$FRONTEND_CURRENT"
chown -h "$APP_USER:$APP_USER" "$FRONTEND_CURRENT"

log "Pruning old releases (keeping last $KEEP_RELEASES)"
# ls -1 sorted by name works here because RELEASE_ID is a sortable timestamp.
mapfile -t old_releases < <(ls -1 "$FRONTEND_RELEASES" 2>/dev/null | sort -r | tail -n +$((KEEP_RELEASES + 1)))
for old in "${old_releases[@]:-}"; do
    [[ -n "$old" ]] && rm -rf "${FRONTEND_RELEASES:?}/$old"
done

# --------------------------------------------------------------- services

log "Installing systemd units"
install -m 644 "$APP_DIR/systemd/agribiz-backend.service"  /etc/systemd/system/
install -m 644 "$APP_DIR/systemd/agribiz-frontend.service" /etc/systemd/system/
systemctl daemon-reload

log "Restarting services"
systemctl enable agribiz-backend agribiz-frontend >/dev/null 2>&1 || true
systemctl restart agribiz-backend
systemctl restart agribiz-frontend

# ------------------------------------------------------------------- nginx
#
# Once certbot has run, the installed config is no longer the plain base
# template in this repo -- certbot --nginx --redirect rewrites it in place
# to add the :443 server block, the certificate paths and the redirect (see
# docs/PRODUCTION_ARCHITECTURE.md "The 127.0.0.1 lesson"). Blindly
# reinstalling the repo's base template on every deploy would silently
# destroy that block and take HTTPS down -- this happened for real during
# this deployment's own second run. So: only install the template outright
# on a first deploy (no site config present yet, or one without a
# certbot-managed block); after that, just validate whatever's live and
# leave it alone. If nginx/agribizframework.conf changes and needs to reach
# the server, that's a deliberate, separate step (copy it in, then re-run
# `certbot --nginx -d ... --redirect` to regenerate the HTTPS block on top
# of it) -- not something that should happen implicitly on every deploy.

NGINX_CONF=/etc/nginx/conf.d/agribizframework.conf
if [[ -f "$NGINX_CONF" ]] && grep -q "managed by Certbot" "$NGINX_CONF"; then
    log "nginx config already certbot-managed -- validating in place, not overwriting"
    nginx -t || die "The currently installed nginx config is invalid. If you changed
     nginx/agribizframework.conf and need it applied, see docs/DEPLOYMENT.md
     § Nginx for the (deliberate, separate) reinstall + re-certbot steps."
else
    log "Installing nginx config (first deploy -- no certbot block yet)"
    install -m 644 "$APP_DIR/nginx/agribizframework.conf" "$NGINX_CONF"
    nginx -t || die "nginx config is invalid -- not reloading. Fix nginx/agribizframework.conf and re-run."
    systemctl reload nginx 2>/dev/null || systemctl start nginx
    warn "This is a fresh nginx config with no HTTPS block yet. Run certbot now:"
    warn "  certbot --nginx -d agribizframework.com -d www.agribizframework.com --redirect"
fi

# Catch-all that refuses HTTPS for any hostname not served above (see the
# header of nginx/00-default-reject.conf: without it, any other domain whose
# DNS points at this IP got the app served under its name, and Google
# indexed it there). certbot never edits this file, so unlike the site
# config it is safe to install on every deploy. If nginx rejects it, take it
# back out so the live config stays valid.
DEFAULT_REJECT_CONF=/etc/nginx/conf.d/00-default-reject.conf
if ! cmp -s "$APP_DIR/nginx/00-default-reject.conf" "$DEFAULT_REJECT_CONF"; then
    log "Installing nginx catch-all for unknown hostnames"
    install -m 644 "$APP_DIR/nginx/00-default-reject.conf" "$DEFAULT_REJECT_CONF"
    if ! nginx -t; then
        rm -f "$DEFAULT_REJECT_CONF"
        die "nginx rejected nginx/00-default-reject.conf -- removed it again, live config unchanged."
    fi
    systemctl reload nginx 2>/dev/null || true
fi

# ------------------------------------------------------------------- verify

log "Verifying"
sleep 4

# check <label> <expected-status> <curl args...>
check() {
    local name="$1" expected="$2"
    shift 2
    local code
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$@" 2>/dev/null || echo 000)"
    if [[ "$code" == "$expected" ]]; then
        printf '    \033[1;32mok\033[0m   %-28s %s\n' "$name" "$code"
    else
        printf '    \033[1;31mFAIL\033[0m %-28s got %s, expected %s\n' "$name" "$code" "$expected"
        return 1
    fi
}

failed=0
# Gunicorn is checked with the same Host and X-Forwarded-Proto headers nginx
# actually sends -- without them, DJANGO_ALLOWED_HOSTS rejects a bare
# "Host: 127.0.0.1" with 400, and SECURE_SSL_REDIRECT (prod.py) 301s a
# request it can't tell arrived over HTTPS. Both are correct behaviour, not
# bugs; the check has to match what a real request through nginx looks like.
check "backend (gunicorn)"  200 \
    -H "Host: $SITE_DOMAIN" -H "X-Forwarded-Proto: https" \
    "http://127.0.0.1:8000/api/v1/frameworks/" || failed=1
check "frontend (node ssr)" 200 "http://127.0.0.1:3000/"                  || failed=1

# Check nginx the way a real visitor reaches it: with the site's own Host
# name. Requesting http://127.0.0.1/ does NOT work once certbot has run --
# see docs/PRODUCTION_ARCHITECTURE.md "The 127.0.0.1 lesson".
if systemctl is-active --quiet nginx; then
    if curl -sSk --resolve "$SITE_DOMAIN:443:127.0.0.1" -o /dev/null \
            --max-time 10 "https://$SITE_DOMAIN/" 2>/dev/null; then
        check "through nginx (https)" 200 \
            -k --resolve "$SITE_DOMAIN:443:127.0.0.1" "https://$SITE_DOMAIN/" || failed=1
    else
        check "through nginx (http)" 200 \
            -H "Host: $SITE_DOMAIN" "http://127.0.0.1/" || failed=1
    fi
else
    printf '    \033[1;33mskip\033[0m through nginx (nginx not running yet)\n'
fi

if (( failed )); then
    cat <<'EOF'

Something is not answering. Check the logs:
    sudo journalctl -u agribiz-backend  -n 50 --no-pager
    sudo journalctl -u agribiz-frontend -n 50 --no-pager
    sudo tail -n 50 /var/log/nginx/agribiz-error.log

To roll back to the previous release: sudo bash /srv/agribiz/deploy/rollback.sh
EOF
    exit 1
fi

log "$(printf '\033[1;32mDeploy complete\033[0m')"
printf '    Release: %s\n' "$RELEASE_ID"
systemctl --no-pager --lines=0 status agribiz-backend agribiz-frontend | grep -E 'agribiz-|Active:'
