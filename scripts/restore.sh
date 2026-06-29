#!/bin/bash
# HAKKIVEDA — Restore from backup. Run: bash scripts/restore.sh ./hakkiveda_backup_XXXX
set -e
SRC="${1:?Usage: bash restore.sh <backup_dir>}"
echo "→ Restoring MongoDB from $SRC/mongo.archive.gz"
mongorestore --uri="${MONGO_URL:-mongodb://localhost:27017}" --archive="$SRC/mongo.archive.gz" --gzip --drop
echo "→ Restoring static files"
tar -xzf "$SRC/static.tar.gz" -C /app/backend 2>/dev/null || echo "  (skipped)"
echo "✅ Restore complete. Don't forget to copy backend.env.bak → /app/backend/.env"
