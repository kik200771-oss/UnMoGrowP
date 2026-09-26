#!/bin/bash

# UnMoGrowP Attribution Platform - Backup Script
# Creates backup of databases and configuration

set -e

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="unmogrowp_backup_$TIMESTAMP"

echo "💾 UnMoGrowP Backup Script"
echo "=========================="
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

echo "📦 Creating backup: $BACKUP_NAME"
echo ""

# Backup PostgreSQL
echo "→ Backing up PostgreSQL..."
docker exec attribution-postgres pg_dumpall -U postgres > "$BACKUP_DIR/$BACKUP_NAME/postgres.sql"
echo "✅ PostgreSQL backup complete"

# Backup ClickHouse (if possible)
echo "→ Backing up ClickHouse..."
# Note: ClickHouse backup requires more complex setup, this is simplified
docker exec attribution-clickhouse clickhouse-client --query "SHOW DATABASES" > "$BACKUP_DIR/$BACKUP_NAME/clickhouse_databases.txt" || echo "⚠️  ClickHouse backup skipped (container may not be named 'attribution-clickhouse')"

# Backup environment files
echo "→ Backing up environment files..."
cp frontend/.env "$BACKUP_DIR/$BACKUP_NAME/frontend.env" 2>/dev/null || echo "⚠️  frontend/.env not found"
cp api/.env "$BACKUP_DIR/$BACKUP_NAME/api.env" 2>/dev/null || echo "⚠️  api/.env not found"
cp backend/.env "$BACKUP_DIR/$BACKUP_NAME/backend.env" 2>/dev/null || echo "⚠️  backend/.env not found"
echo "✅ Environment files backed up"

# Backup documentation state
echo "→ Backing up documentation state..."
cp docs/CURRENT_STATUS.md "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || echo "⚠️  CURRENT_STATUS.md not found"
cp docs/TODO.md "$BACKUP_DIR/$BACKUP_NAME/" 2>/dev/null || echo "⚠️  TODO.md not found"
echo "✅ Documentation backed up"

# Create metadata file
echo "→ Creating backup metadata..."
cat > "$BACKUP_DIR/$BACKUP_NAME/metadata.txt" <<EOF
Backup Date: $(date)
Git Branch: $(git branch --show-current 2>/dev/null || echo "unknown")
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
Git Status: $(git status --short 2>/dev/null || echo "unknown")
Docker Containers: $(docker ps --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "unknown")
EOF
echo "✅ Metadata created"

# Compress backup
echo ""
echo "📦 Compressing backup..."
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"
cd ..

BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | cut -f1)

echo ""
echo "✅ Backup complete!"
echo ""
echo "📊 Backup Details:"
echo "  Location: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "  Size: $BACKUP_SIZE"
echo ""
echo "💡 To restore:"
echo "  1. Extract: tar -xzf $BACKUP_DIR/$BACKUP_NAME.tar.gz -C $BACKUP_DIR"
echo "  2. Restore PostgreSQL: docker exec -i attribution-postgres psql -U postgres < $BACKUP_DIR/$BACKUP_NAME/postgres.sql"
echo "  3. Restore .env files manually"
echo ""

# Cleanup old backups (keep last 10)
echo "🧹 Cleaning up old backups (keeping last 10)..."
ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm
echo "✅ Cleanup complete"
echo ""
