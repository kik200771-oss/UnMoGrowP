# Automation Setup Guide

Guide for setting up automated tasks (backups, monitoring, etc.)

---

## 📅 Automated Backups

### Setup (Linux/Mac)

1. **Make script executable:**
```bash
chmod +x scripts/cron-backup.sh
```

2. **Update configuration:**
Edit `scripts/cron-backup.sh` and update:
- `PROJECT_DIR` - Path to your project
- `BACKUP_DIR` - Where to store backups
- `RETENTION_DAYS` - How long to keep backups (default: 30 days)

3. **Add to crontab:**
```bash
crontab -e
```

Add one of these lines:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/attribution/scripts/cron-backup.sh >> /var/log/unmogrowp-backup.log 2>&1

# Every 6 hours
0 */6 * * * /path/to/attribution/scripts/cron-backup.sh >> /var/log/unmogrowp-backup.log 2>&1

# Weekly on Sunday at 3 AM
0 3 * * 0 /path/to/attribution/scripts/cron-backup.sh >> /var/log/unmogrowp-backup.log 2>&1
```

4. **Verify cron job:**
```bash
crontab -l
```

5. **Test manually:**
```bash
bash scripts/cron-backup.sh
```

### Setup (Windows)

1. **Open Task Scheduler:**
- Press `Win + R`, type `taskschd.msc`, press Enter

2. **Create Basic Task:**
- Click "Create Basic Task"
- Name: "UnMoGrowP Backup"
- Description: "Automated database backup"

3. **Set Trigger:**
- Choose frequency (Daily, Weekly, etc.)
- Set time (e.g., 2:00 AM)

4. **Set Action:**
- Action: "Start a program"
- Program: `C:\Program Files\Git\bin\bash.exe`
- Arguments: `/c/path/to/attribution/scripts/cron-backup.sh`
- Start in: `C:\path\to\attribution`

5. **Test:**
- Right-click task → "Run"

---

## 📊 Monitoring & Alerts

### Using health-check.sh

Setup continuous monitoring:

**Linux/Mac (cron):**
```bash
# Check health every 5 minutes
*/5 * * * * /path/to/attribution/scripts/health-check.sh || echo "Health check failed" | mail -s "UnMoGrowP Alert" admin@example.com
```

**Docker health checks:**
Already configured in `config/docker-compose.yml`:
- ClickHouse
- PostgreSQL
- Redis
- Zookeeper
- Kafka
- Kafka UI

View health status:
```bash
docker compose -f config/docker-compose.yml ps
```

---

## 🔄 Automated Testing

### GitHub Actions

Already configured in `.github/workflows/ci.yml`

Runs automatically on:
- Push to `main` or `feature/migrate-to-svelte`
- Pull requests to `main`

Tests:
- ✅ Frontend build & type check
- ✅ API build
- ✅ Go backend build & tests
- ✅ Linting & formatting
- ✅ Docker Compose validation
- ✅ Security scan (Trivy)

---

## 📦 Automated Deployments

### GitHub Actions Deploy

Configured in `.github/workflows/deploy.yml`

Triggers:
- Push to `main` → Deploy to **staging**
- Push tag `v*` → Deploy to **production**

Example:
```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0
```

---

## 🔄 Automated Dependency Updates

### Dependabot Configuration

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # Frontend (npm)
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  # API (npm)
  - package-ecosystem: "npm"
    directory: "/api"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  # Backend (Go)
  - package-ecosystem: "gomod"
    directory: "/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

Or use **Renovate** (alternative):

Create `renovate.json`:
```json
{
  "extends": ["config:base"],
  "schedule": ["after 10pm every weekday"],
  "packageRules": [
    {
      "updateTypes": ["minor", "patch"],
      "automerge": true
    }
  ]
}
```

---

## 📧 Notification Setup

### Slack Notifications

Add webhook URL to your scripts:

```bash
# In cron-backup.sh
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
curl -X POST "$SLACK_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d '{"text":"✅ Backup completed"}'
```

### Email Notifications

Configure mail on Linux:

```bash
# Install mail utility
sudo apt-get install mailutils

# Send email
echo "Backup completed" | mail -s "UnMoGrowP Backup" admin@example.com
```

### Discord Notifications

```bash
DISCORD_WEBHOOK="https://discord.com/api/webhooks/YOUR/WEBHOOK"
curl -X POST "$DISCORD_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d '{"content":"✅ Backup completed"}'
```

---

## 🔧 Maintenance Scripts

### Auto-cleanup old logs

Add to crontab:
```bash
# Clean logs older than 30 days, every Sunday at 4 AM
0 4 * * 0 find /var/log/unmogrowp-*.log -mtime +30 -delete
```

### Auto-restart services on failure

Docker Compose already configured with `restart: unless-stopped` for all services.

Manual systemd service (Linux):

Create `/etc/systemd/system/unmogrowp-frontend.service`:
```ini
[Unit]
Description=UnMoGrowP Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/attribution/frontend
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable unmogrowp-frontend
sudo systemctl start unmogrowp-frontend
```

---

## 📊 Monitoring Dashboard

### Using Docker Stats

```bash
# Real-time stats
docker stats

# Export to file
docker stats --no-stream > /var/log/docker-stats.log
```

### Prometheus + Grafana (Advanced)

1. Add to `docker-compose.yml`:
```yaml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
```

2. Configure Prometheus (`config/prometheus.yml`)
3. Import Grafana dashboards

---

## ✅ Checklist

After setup, verify:

- [ ] Automated backups running (check cron logs)
- [ ] GitHub Actions CI/CD working (check Actions tab)
- [ ] Docker health checks enabled (check `docker ps`)
- [ ] Notifications configured (test manually)
- [ ] Log rotation setup
- [ ] Monitoring dashboard accessible

---

## 📞 Troubleshooting

### Cron not running
```bash
# Check cron service
sudo systemctl status cron

# Check cron logs
grep CRON /var/log/syslog

# Test cron job manually
bash scripts/cron-backup.sh
```

### Health checks failing
```bash
# Check service logs
docker compose -f config/docker-compose.yml logs [service-name]

# Restart unhealthy services
docker compose -f config/docker-compose.yml restart [service-name]
```

### GitHub Actions failing
- Check Actions tab in GitHub repository
- Review logs for each failed job
- Verify secrets are configured (Settings → Secrets)

---

**Last Updated:** 2025-10-21
