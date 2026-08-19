#!/usr/bin/env bash
#
# /srv/story/bin/backup.sh
#
# Nightly, via story-backup.timer. Same shape as wedding's: a local set with
# rotation, then an offsite push.
set -euo pipefail

ROOT=/srv/story
DEST=/var/backups/story
KEEP_DAYS=14
STAMP=$(date -u +%Y%m%dT%H%M%S)

set -a; . "$ROOT/shared/env"; set +a

mkdir -p "$DEST"

# --single-transaction so the dump is consistent without locking the app out,
# which matters because InnoDB is the only engine in use here.
echo "==> dumping database"
mysqldump \
  --host="${DB_HOST}" --port="${DB_PORT}" \
  --user="${DB_USER}" --password="${DB_PASSWORD}" \
  --single-transaction --quick --routines --events \
  "${DB_NAME}" | gzip -9 > "$DEST/db-$STAMP.sql.gz"

echo "==> archiving uploads"
# -C so paths in the archive are relative, making a restore a plain extract into
# shared/ rather than a game of stripping components.
tar -czf "$DEST/uploads-$STAMP.tar.gz" -C "$ROOT/shared" uploads

# The database is useless without ENCRYPTION_KEY: love letters are AES-256-GCM
# and the key is not stored anywhere in the dump. Backing up the environment file
# alongside is what makes this a restorable backup rather than an unreadable one.
#
# It contains live secrets, so it is 600 and must be treated as sensitive
# wherever it is copied.
echo "==> copying environment (contains ENCRYPTION_KEY — the dump cannot be read without it)"
install -m 600 "$ROOT/shared/env" "$DEST/env-$STAMP"

echo "==> pruning local sets older than $KEEP_DAYS days"
find "$DEST" -maxdepth 1 -type f -mtime +$KEEP_DAYS -delete

# Offsite. Inert until `rclone config` creates a remote literally named
# story-offsite, so this script is complete rather than half-written, and no
# credential had to pass through anyone else's hands to get here.
if rclone listremotes 2>/dev/null | grep -qx 'story-offsite:'; then
  echo "==> pushing offsite"
  rclone copy "$DEST" story-offsite:story-backups \
    --include "db-$STAMP.sql.gz" \
    --include "uploads-$STAMP.tar.gz" \
    --include "env-$STAMP"
else
  echo "==> offsite push skipped: no 'story-offsite' rclone remote configured"
  echo "    Run: rclone config   (as the story user) to enable it."
fi

echo "==> backup $STAMP complete"
