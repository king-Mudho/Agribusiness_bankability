#!/usr/bin/env bash
#
# Roll back to the previous frontend release and/or a previous backend
# commit. Does NOT touch the database by default -- database rollback is a
# separate, explicit, confirmed step (see --restore-db below) because
# restoring a backup discards every write made since it was taken.
#
# Usage:
#   sudo bash /srv/agribiz/deploy/rollback.sh                    # frontend only
#   sudo bash /srv/agribiz/deploy/rollback.sh --backend <git-sha> # + backend code
#   sudo bash /srv/agribiz/deploy/rollback.sh --restore-db /srv/agribiz/backups/agribiz-<ts>.sql.gz
#
# What this does NOT do: automatically reverse a Django migration. If the
# release being rolled back to ran a migration that the current code
# depends on, code rollback alone is not enough -- restore the matching
# database backup too, or write and run a reverse migration by hand.

set -euo pipefail

APP_USER="agribiz"
APP_DIR="/srv/agribiz"
BACKEND="$APP_DIR/backend"
FRONTEND="$APP_DIR/frontend"
DB_NAME="agribiz_prod"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$1"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$1"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$1" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run this with sudo."

BACKEND_SHA=""
RESTORE_DB=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --backend)    BACKEND_SHA="$2"; shift 2 ;;
        --restore-db) RESTORE_DB="$2"; shift 2 ;;
        *) die "Unknown argument: $1" ;;
    esac
done

# --------------------------------------------------------- frontend rollback

log "Rolling back frontend to the previous release"
CURRENT_TARGET="$(readlink -f "$FRONTEND/current" || true)"
mapfile -t releases < <(ls -1 "$FRONTEND/releases" 2>/dev/null | sort -r)

if [[ ${#releases[@]} -lt 2 ]]; then
    warn "Fewer than 2 releases exist under $FRONTEND/releases -- nothing to roll back to."
else
    PREVIOUS=""
    for r in "${releases[@]}"; do
        if [[ "$FRONTEND/releases/$r" != "$CURRENT_TARGET" ]]; then
            PREVIOUS="$r"
            break
        fi
    done
    if [[ -z "$PREVIOUS" ]]; then
        warn "Could not determine the previous release -- leaving 'current' untouched."
    else
        log "Switching current -> $PREVIOUS"
        ln -sfn "$FRONTEND/releases/$PREVIOUS" "$FRONTEND/current"
        chown -h "$APP_USER:$APP_USER" "$FRONTEND/current"
        systemctl restart agribiz-frontend
        printf '    Frontend now serving release: %s\n' "$PREVIOUS"
    fi
fi

# ---------------------------------------------------------- backend rollback

if [[ -n "$BACKEND_SHA" ]]; then
    log "Rolling back backend code to $BACKEND_SHA"
    [[ -d "$BACKEND/.git" ]] || die "$BACKEND is not a git checkout -- cannot roll back by commit."
    CURRENT_SHA="$(cd "$BACKEND" && git rev-parse HEAD)"
    printf '    Current commit:  %s\n' "$CURRENT_SHA"
    printf '    Rolling back to: %s\n' "$BACKEND_SHA"
    ( cd "$BACKEND" && git checkout "$BACKEND_SHA" -- . )
    sudo -u "$APP_USER" "$BACKEND/venv/bin/pip" install --quiet -r "$BACKEND/requirements/prod.txt"
    warn "Migrations are NOT automatically reversed. If the release you're rolling back"
    warn "away from ran a migration this commit doesn't expect, restore a matching"
    warn "database backup too (--restore-db), or write a reverse migration by hand."
    systemctl restart agribiz-backend
fi

# --------------------------------------------------------------- db restore

if [[ -n "$RESTORE_DB" ]]; then
    [[ -f "$RESTORE_DB" ]] || die "Backup file not found: $RESTORE_DB"

    echo
    printf '\033[1;31mThis will DROP and RECREATE %s from:\033[0m\n' "$DB_NAME"
    printf '    %s\n' "$RESTORE_DB"
    printf 'Every write to the database since that backup was taken will be LOST.\n'
    read -r -p "Type the database name ($DB_NAME) to confirm: " CONFIRM
    [[ "$CONFIRM" == "$DB_NAME" ]] || die "Confirmation did not match -- aborting, nothing was touched."

    log "Stopping the backend so nothing writes during restore"
    systemctl stop agribiz-backend

    log "Restoring $DB_NAME from $RESTORE_DB"
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${DB_NAME}_restoring;" >/dev/null
    sudo -u postgres createdb -O agribiz_prod "${DB_NAME}_restoring"
    gunzip -c "$RESTORE_DB" | sudo -u postgres psql -d "${DB_NAME}_restoring" >/dev/null
    sudo -u postgres psql -c "ALTER DATABASE $DB_NAME RENAME TO ${DB_NAME}_pre_restore_$(date +%s);"
    sudo -u postgres psql -c "ALTER DATABASE ${DB_NAME}_restoring RENAME TO $DB_NAME;"

    log "Restarting backend"
    systemctl start agribiz-backend
    printf '    Restored. The pre-restore database was kept as %s_pre_restore_<timestamp>\n' "$DB_NAME"
    printf '    rather than dropped -- remove it manually once the restore is confirmed good.\n'
fi

log "Rollback steps complete. Verify with: bash /srv/agribiz/deploy/check-production.sh"
