# Scripts Directory

Utility scripts for UnMoGrowP Attribution Platform development and maintenance.

---

## 📜 Available Scripts

### 🚀 setup.sh
**Purpose**: Initial project setup automation

**What it does**:
- Checks all prerequisites (Node.js, Bun, Go, Docker)
- Creates `.env` files from examples
- Installs all dependencies
- Starts Docker infrastructure

**Usage**:
```bash
./scripts/setup.sh
```

**When to use**: First time setting up the project on a new machine

---

### 🏥 health-check.sh
**Purpose**: Verify all services are running correctly

**What it checks**:
- Frontend (port 5173)
- API (port 3001)
- Go Backend (port 8080)
- PostgreSQL container
- ClickHouse container
- Kafka container
- Redis container

**Usage**:
```bash
./scripts/health-check.sh
```

**Exit codes**:
- `0` - All services healthy
- `1` - One or more services have issues

**When to use**:
- After starting services
- Debugging issues
- CI/CD health checks

---

### 🧪 test-api.sh
**Purpose**: Comprehensive API endpoint testing

**What it tests**:
- Health & info endpoints
- Authentication (login, Google OAuth, logout)
- Dashboard (stats, charts)
- Attribution (event tracking)
- Apps management

**Usage**:
```bash
./scripts/test-api.sh
```

**Output**: Pass/fail for each endpoint with HTTP status codes

**When to use**:
- After making API changes
- Before committing
- Regression testing

---

### 💾 backup.sh
**Purpose**: Create backups of databases and configuration

**What it backs up**:
- PostgreSQL database (full dump)
- ClickHouse databases list
- Environment files (.env)
- Documentation state (CURRENT_STATUS.md, TODO.md)
- Git metadata (branch, commit, status)

**Usage**:
```bash
./scripts/backup.sh
```

**Output**: Compressed tarball in `backups/` directory

**Backup retention**: Keeps last 10 backups automatically

**When to use**:
- Before major changes
- Before migrations
- Daily backups (can be automated)

**Restore**:
```bash
# Extract
tar -xzf backups/unmogrowp_backup_TIMESTAMP.tar.gz -C backups

# Restore PostgreSQL
docker exec -i attribution-postgres psql -U postgres < backups/unmogrowp_backup_TIMESTAMP/postgres.sql

# Restore .env files manually
```

---

### 🧹 clean.sh
**Purpose**: Remove build artifacts and caches

**What it cleans**:
- Frontend: `.svelte-kit`, `build`, `.vite` cache
- API: `dist`, cache
- Backend: `bin`, `tmp`
- Node modules caches
- Log files
- OS specific files (`.DS_Store`, `Thumbs.db`)
- Legacy Next.js artifacts

**Usage**:
```bash
./scripts/clean.sh
```

**Warning**: Requires confirmation before proceeding

**When to use**:
- Before fresh rebuild
- Troubleshooting build issues
- Disk space cleanup

---

## 🔧 Making Scripts Executable

On Linux/Mac, make scripts executable:

```bash
chmod +x scripts/*.sh
```

On Windows, use Git Bash or WSL to run these scripts.

---

## 🎯 Quick Reference

### Daily Development
```bash
./scripts/health-check.sh  # Check if everything is running
./scripts/test-api.sh      # Test API after changes
```

### Initial Setup
```bash
./scripts/setup.sh         # First time setup
```

### Maintenance
```bash
./scripts/backup.sh        # Create backup
./scripts/clean.sh         # Clean build artifacts
```

---

## 📝 Script Standards

All scripts follow these conventions:

1. **Shebang**: `#!/bin/bash`
2. **Error handling**: `set -e` (exit on error)
3. **Output**: Clear, colored messages with emojis
4. **Exit codes**: `0` for success, `1` for failure
5. **Documentation**: Header comment explaining purpose

---

## 🤝 Adding New Scripts

When adding new utility scripts:

1. Create script in `scripts/` directory
2. Add shebang: `#!/bin/bash`
3. Add header comment explaining purpose
4. Make executable: `chmod +x scripts/your-script.sh`
5. Update this README with documentation
6. Consider adding to `Makefile` for easy access

**Example**:
```bash
#!/bin/bash

# UnMoGrowP Attribution Platform - Your Script Name
# Brief description of what it does

set -e

echo "🎯 Your Script"
echo "=============="
# Your script logic here
```

---

## 🐛 Troubleshooting

### Script won't run
```bash
# Make executable
chmod +x scripts/script-name.sh

# Use bash explicitly
bash scripts/script-name.sh
```

### Docker commands fail
```bash
# Check Docker is running
docker ps

# Start Docker
# (OS-specific command)
```

### Permission denied on files
```bash
# Run with sudo (Linux/Mac)
sudo ./scripts/script-name.sh
```

---

## 📞 Questions?

- Check main [README.md](../README.md)
- Check [CONTRIBUTING.md](../CONTRIBUTING.md)
- Check [docs/CURRENT_STATUS.md](../docs/CURRENT_STATUS.md)

---

**Last Updated**: 2025-10-21
