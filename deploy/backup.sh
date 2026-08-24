#!/usr/bin/env bash
#
# Back up the production PostgreSQL database.
#
#   sudo bash /srv/agribiz/deploy/backup.sh
#
# Writes a gzip-compressed pg_dump to /srv/agribiz/backups/, named with a
# timestamp, and prunes backups older than $RETENTION_DAYS. deploy.sh calls
# this automatically before running migrations; it's also safe (and a good
# idea) to run on its own via cron/systemd-timer for a regular backup
# cadence -- this script only handles local rotation, so also copy backups
# off this server periodically (see docs/DEPLOYMENT.md).

set -euo pipefail

DB_NAME="agribiz_prod"
BACKUP_DIR="/srv/agribiz/backups"
RETENTION_DAYS="${ABI_BACKUP_RETENTION_DAYS:-14}"

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$1"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$1" >&2; exit 1; }

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="$BACKUP_DIR/agribiz-$TIMESTAMP.sql.gz"

log "Backing up '$DB_NAME' to $OUT_FILE"
sudo -u postgres pg_dump "$DB_NAME" | gzip > "$OUT_FILE" || die "pg_dump failed"

SIZE="$(du -h "$OUT_FILE" | cut -f1)"
printf '    Backup written: %s (%s)\n' "$OUT_FILE" "$SIZE"

log "Pruning backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name 'agribiz-*.sql.gz' -mtime "+$RETENTION_DAYS" -print -delete

log "Current backups"
ls -lh "$BACKUP_DIR"/agribiz-*.sql.gz 2>/dev/null || echo "    (none yet)"
