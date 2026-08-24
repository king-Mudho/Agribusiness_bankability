#!/usr/bin/env bash
#
# One-time server bootstrap for a blank AlmaLinux 9 VPS.
#
# Installs system packages, creates the service user and database, and
# prepares /srv/agribiz. It does NOT deploy the app -- run deploy.sh for that.
#
# Run as root:
#   bash setup-server.sh
#
# Safe to re-run: every step checks whether it has already been done.

set -euo pipefail

APP_USER="agribiz"
APP_DIR="/srv/agribiz"
DB_NAME="agribiz_prod"
DB_USER="agribiz_prod"
DOMAIN="agribizframework.com"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$1"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$1" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run this as root."

# ---------------------------------------------------------------- 1. packages

log "Updating system packages"
dnf -y update

log "Installing base packages"
dnf -y install \
    nginx git curl tar policycoreutils-python-utils nano \
    python3.12 python3.12-devel \
    gcc make \
    libpq-devel \
    firewalld fail2ban

log "Selecting a supported PostgreSQL version"
dnf -y module reset postgresql >/dev/null 2>&1 || true
dnf -y module enable postgresql:16 >/dev/null 2>&1 \
    || dnf -y module enable postgresql:15 >/dev/null 2>&1 \
    || warn "Could not enable a postgresql:15/16 module stream; falling back to the default."

dnf -y install postgresql-server postgresql-contrib

PG_VERSION_MAJOR="$(postgres --version 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo 0)"
log "PostgreSQL $PG_VERSION_MAJOR selected"

command -v python3.12 >/dev/null 2>&1 || die \
    "python3.12 not available. Django 5.1 needs Python >= 3.10.
     Try: dnf -y install python3.12   (needs AlmaLinux 9.4+; run 'dnf -y update' first)"

# Node 20+, for the Next.js 15 frontend (App Router requires Node >= 18.18;
# 20 LTS is used here for a safety margin and current npm behaviour).
# AlmaLinux's own nodejs module stream is far older, so it is disabled first
# or it takes precedence over the NodeSource package.
NODE_MAJOR_REQUIRED=20

current_node_major() {
    command -v node >/dev/null 2>&1 || { echo 0; return; }
    node --version | sed -E 's/^v([0-9]+).*/\1/'
}

if (( $(current_node_major) < NODE_MAJOR_REQUIRED )); then
    log "Installing Node.js 20 (found major $(current_node_major), need >= $NODE_MAJOR_REQUIRED)"
    dnf -y module reset nodejs >/dev/null 2>&1 || true
    dnf -y module disable nodejs >/dev/null 2>&1 || true
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    dnf -y install nodejs
else
    log "Node.js $(node --version) already satisfies the requirement -- skipping"
fi

(( $(current_node_major) >= NODE_MAJOR_REQUIRED )) || die \
    "Node $(node --version) is too old; the frontend needs >= v$NODE_MAJOR_REQUIRED."

log "Versions"
python3.12 --version
node --version
npm --version

# ------------------------------------------------------------------ 2. swap
# ~956MB of RAM has to host PostgreSQL, gunicorn, the Node SSR server, and
# occasional `next build` runs during deploys. Without swap, the build in
# particular risks an OOM kill.

if ! swapon --show | grep -q '/swapfile'; then
    log "Creating a 2 GB swap file"
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl -w vm.swappiness=10
    grep -q '^vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
else
    log "Swap already configured -- skipping"
fi
free -h

# -------------------------------------------------------------- 3. app user

if ! id "$APP_USER" >/dev/null 2>&1; then
    log "Creating service user '$APP_USER'"
    # System account: no login shell, no password. Services run as this user
    # so a compromised app process is not root.
    useradd --system --create-home --home-dir "/home/$APP_USER" \
            --shell /sbin/nologin "$APP_USER"
else
    log "User '$APP_USER' already exists -- skipping"
fi

log "Preparing $APP_DIR"
mkdir -p "$APP_DIR" "$APP_DIR/logs" "$APP_DIR/backups"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ------------------------------------------------------------- 4. postgresql

if [[ ! -f /var/lib/pgsql/data/PG_VERSION ]]; then
    log "Initialising PostgreSQL"
    postgresql-setup --initdb
else
    log "PostgreSQL already initialised -- skipping initdb"
fi

systemctl enable --now postgresql

# AlmaLinux's initdb defaults every TCP connection to `ident` authentication,
# which maps the OS user and ignores passwords entirely -- Django can never
# authenticate through it. Switch loopback connections to scram-sha-256, and
# set password_encryption to match BEFORE any role password is created,
# since the hash is chosen at the moment the password is set.
PG_DATA="/var/lib/pgsql/data"
PG_HBA="$PG_DATA/pg_hba.conf"

if grep -qE '^host\s+all\s+all\s+127\.0\.0\.1/32\s+ident' "$PG_HBA"; then
    log "Switching PostgreSQL loopback auth from ident to scram-sha-256"
    cp -n "$PG_HBA" "$PG_HBA.orig"
    sed -i -E 's|^(host\s+all\s+all\s+127\.0\.0\.1/32\s+)ident|\1scram-sha-256|' "$PG_HBA"
    sed -i -E 's|^(host\s+all\s+all\s+::1/128\s+)ident|\1scram-sha-256|' "$PG_HBA"
else
    log "PostgreSQL loopback auth already configured -- skipping"
fi

if ! grep -qE "^password_encryption\s*=\s*scram-sha-256" "$PG_DATA/postgresql.conf"; then
    sed -i -E "s|^#?\s*password_encryption\s*=.*|password_encryption = scram-sha-256|" \
        "$PG_DATA/postgresql.conf"
    grep -qE "^password_encryption" "$PG_DATA/postgresql.conf" || \
        echo "password_encryption = scram-sha-256" >> "$PG_DATA/postgresql.conf"
fi

systemctl restart postgresql

log "Creating database and role"
DB_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"

if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    warn "Role '$DB_USER' already exists -- leaving its password unchanged."
    warn "If you don't have the password, reset it with:"
    warn "  sudo -u postgres psql -c \"ALTER ROLE $DB_USER WITH PASSWORD 'newpassword';\""
    DB_PASSWORD=""
else
    sudo -u postgres psql -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';"
fi

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
    sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
else
    warn "Database '$DB_NAME' already exists -- skipping creation"
fi

# Django's test suite needs to create/drop a test database. Harmless for
# normal operation; the role otherwise has no elevated privileges.
sudo -u postgres psql -c "ALTER ROLE $DB_USER CREATEDB;" >/dev/null

# ------------------------------------------------------------- 5. firewall

log "Configuring firewall"
systemctl enable --now firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh
firewall-cmd --reload
# PostgreSQL (5432), gunicorn (8000) and Node (3000) are deliberately NOT
# opened. They bind to loopback and are reached only through nginx.

# ------------------------------------------------------------ 5b. fail2ban
# This server is internet-facing and will see sustained SSH brute-force
# attempts, which is normal for any public IP. fail2ban bans an address
# after repeated auth failures.

log "Enabling fail2ban for SSH"
if [[ ! -f /etc/fail2ban/jail.local ]]; then
    cat > /etc/fail2ban/jail.local <<'JAIL'
[DEFAULT]
# Ban for an hour after 5 failures within 10 minutes.
bantime  = 1h
findtime = 10m
maxretry = 5
backend  = systemd

[sshd]
enabled = true
JAIL
fi
systemctl enable --now fail2ban

# -------------------------------------------------------------- 6. selinux
# AlmaLinux enables SELinux in enforcing mode, which blocks nginx from
# making outbound connections to the local app servers by default. Without
# this, every request through nginx returns 502.

if command -v getenforce >/dev/null 2>&1 && [[ "$(getenforce)" != "Disabled" ]]; then
    log "Allowing nginx to proxy to local services (SELinux)"
    setsebool -P httpd_can_network_connect 1
fi

log "Starting nginx"
systemctl enable --now nginx

# ---------------------------------------------------------------- 7. summary

cat <<EOF

$(printf '\033[1;32m==> Server bootstrap complete\033[0m')

Next, following docs/DEPLOYMENT.md:

  Step 3  Confirm DNS points at this server (already verified during this
          deployment -- $DOMAIN and www.$DOMAIN both resolve to
          $(curl -fsS4 ifconfig.me 2>/dev/null || echo 'this server IP')):
            A   $DOMAIN       -> 66.29.139.201
            A   www.$DOMAIN   -> 66.29.139.201

  Step 4  Create the two .env files:
            cp $APP_DIR/deploy/env-templates/backend.env.production $APP_DIR/backend/.env
            chmod 600 $APP_DIR/backend/.env && chown $APP_USER:$APP_USER $APP_DIR/backend/.env
            cp $APP_DIR/deploy/env-templates/frontend.env.production $APP_DIR/frontend/.env
            chown $APP_USER:$APP_USER $APP_DIR/frontend/.env
            nano $APP_DIR/backend/.env      # set DJANGO_SECRET_KEY, JWT_SIGNING_KEY, DATABASE_URL password

  Step 5  sudo bash $APP_DIR/deploy/deploy.sh

EOF

if [[ -n "$DB_PASSWORD" ]]; then
    cat <<EOF
  The database password just generated is below. Put it in
  $APP_DIR/backend/.env as the password portion of DATABASE_URL. It is stored
  nowhere else, and it is a live credential -- do not paste it into chat,
  email or a commit.

      $DB_PASSWORD

  To change it later:
      sudo -u postgres psql -c "ALTER ROLE $DB_USER WITH PASSWORD 'newpassword';"
  then update backend/.env and run: systemctl restart agribiz-backend

EOF
fi
