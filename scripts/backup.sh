#!/bin/bash
# HAKKIVEDA — DB + static files backup. Run: bash scripts/backup.sh
set -e
TS=$(date +%Y%m%d_%H%M%S)
OUT="${1:-./hakkiveda_backup_$TS}"
mkdir -p "$OUT"
echo "→ Dumping MongoDB to $OUT/mongo.archive.gz"
mongodump --uri="${MONGO_URL:-mongodb://localhost:27017}" --db="${DB_NAME:-hakkiveda_db}" --archive="$OUT/mongo.archive.gz" --gzip
echo "→ Archiving static files"
tar -czf "$OUT/static.tar.gz" -C /app/backend static 2>/dev/null || echo "  (no static dir)"
cp /app/backend/.env "$OUT/backend.env.bak" 2>/dev/null || true
cp /app/frontend/.env "$OUT/frontend.env.bak" 2>/dev/null || true
echo "✅ Backup complete: $OUT"
ls -lh "$OUT"
