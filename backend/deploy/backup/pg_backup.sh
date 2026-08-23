#!/usr/bin/env bash
# Daily PostgreSQL backup for the ABI backend, per
# docs/20_DEPLOYMENT_ARCHITECTURE.md § Backups & recovery.
#
# Install as a daily cron/systemd-timer job, e.g.:
#   0 2 * * * /srv/abi/backend/deploy/backup/pg_backup.sh >> /var/log/abi-backup.log 2>&1
#
# Reads connection details from DATABASE_URL in the environment (same
# variable the Django app uses) so there is only one place to configure it.

set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set (see backend/.env)}"
BACKUP_DIR="${ABI_BACKUP_DIR:-/srv/abi/backups}"
RETENTION_DAYS="${ABI_BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$BACKUP_DIR"

OUT_FILE="$BACKUP_DIR/abi-${TIMESTAMP}.sql.gz"
pg_dump --dbname="$DATABASE_URL" --format=plain --no-owner --no-privileges | gzip > "$OUT_FILE"

echo "Backup written to $OUT_FILE"

# Prune backups older than the retention window. Off-site copy (e.g. to
# object storage) should be handled by whatever backs this directory up --
# docs/20_DEPLOYMENT_ARCHITECTURE.md requires backups stored off the
# application server, not just pruned locally.
find "$BACKUP_DIR" -name 'abi-*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete
