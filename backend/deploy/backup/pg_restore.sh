#!/usr/bin/env bash
# Restore a PostgreSQL backup produced by pg_backup.sh, per
# docs/20_DEPLOYMENT_ARCHITECTURE.md § Backups & recovery ("a demonstration
# event is a bad time to discover backups don't restore" -- test this
# script against a scratch database before you need it for real).
#
# Usage: ./pg_restore.sh /srv/abi/backups/abi-20260101T020000Z.sql.gz
#
# Restores into the database named in DATABASE_URL. The target database is
# dropped and recreated -- this is destructive, confirm before running
# against anything but a scratch/staging database.

set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set (see backend/.env)}"
BACKUP_FILE="${1:?Usage: pg_restore.sh <path-to-backup.sql.gz>}"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE" >&2
    exit 1
fi

read -r -p "This will DROP and recreate the database in DATABASE_URL. Continue? [y/N] " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Aborted."
    exit 1
fi

DB_NAME="$(python3 -c "import sys, urllib.parse as u; print(u.urlparse(sys.argv[1]).path.lstrip('/'))" "$DATABASE_URL")"

dropdb --if-exists "$DB_NAME"
createdb "$DB_NAME"
gunzip -c "$BACKUP_FILE" | psql --dbname="$DATABASE_URL" --quiet

echo "Restored $BACKUP_FILE into $DB_NAME. Run 'python manage.py migrate --check' to confirm schema matches the codebase."
