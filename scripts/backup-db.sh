#!/usr/bin/env bash
#
# Database backup script for Supabase PostgreSQL.
# Run nightly via cron or GitHub Actions.
#
# Required env vars:
#   SUPABASE_DB_URL  — postgres://user:pass@host:port/dbname
#   BACKUP_DIR       — local directory for backup files (default: ./backups)
#   BACKUP_RETAIN_DAYS — how many days to keep (default: 30)
#
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-30}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILENAME="findyouruni_${TIMESTAMP}.sql.gz"

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "ERROR: SUPABASE_DB_URL is not set" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "Starting backup at $(date)..."
pg_dump "$SUPABASE_DB_URL" \
  --no-owner \
  --no-privileges \
  --format=plain \
  --exclude-schema=auth \
  --exclude-schema=storage \
  --exclude-schema=realtime \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "Backup complete: ${FILENAME} (${SIZE})"

# Prune old backups
DELETED=0
find "$BACKUP_DIR" -name "findyouruni_*.sql.gz" -mtime "+${RETAIN_DAYS}" -delete -print | while read -r f; do
  DELETED=$((DELETED + 1))
  echo "Pruned: $f"
done
echo "Retained backups: $(find "$BACKUP_DIR" -name "findyouruni_*.sql.gz" | wc -l | tr -d ' ')"
echo "Done."
