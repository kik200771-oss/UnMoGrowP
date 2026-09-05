# UnMoGrowP Customer Onboarding - Quick Start Guide

**Time to Production**: 15 minutes ⚡
**Difficulty**: Easy 🟢
**Status**: Production Ready ✅

---

## 🚀 Deploy in 3 Steps

### Step 1: Configure Environment (2 minutes)

```bash
# Navigate to project
cd /path/to/attribution

# Copy environment template
cp deployment/production.env.template .env

# Generate secrets
openssl rand -base64 32  # For POSTGRES_PASSWORD
openssl rand -base64 32  # For CLICKHOUSE_PASSWORD
openssl rand -base64 64  # For JWT_SECRET

# Edit .env and replace all CHANGEME values
nano .env
```

### Step 2: Deploy Platform (10 minutes)

```bash
# Run one-click deployment
./deployment/one-click-deploy.sh

# Wait for deployment to complete (~15 minutes)
# All services will start automatically
```

### Step 3: Validate Deployment (3 minutes)

```bash
# Run integration tests
./deployment/validate-integration.sh

# Expected output: 100% pass rate ✅
```

---

## 🎉 You're Ready!

### Access Your Platform

**Customer Success API**:
```bash
http://localhost:8084
```

**Monitoring Dashboards**:
- Grafana: http://localhost:3000 (admin/[your-password])
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686

---

## 👥 Create Your First Customer

```bash
# Run customer creation wizard
./tools/scripts/create-pilot-customer.sh

# Follow interactive prompts:
# 1. Company Name
# 2. Contact Name
# 3. Contact Email
# 4. Current Provider (optional)
# 5. Event Volume (optional)

# Output: Customer created in pilot-customers/ directory
```

---

## 📊 Monitor Customer Success

### View Week 1 Targets

```bash
curl http://localhost:8084/v1/success/targets | jq
```

### View Weekly Summary

```bash
curl http://localhost:8084/v1/success/weekly | jq
```

### Open Grafana Dashboard

```bash
# Navigate to:
http://localhost:3000/d/customer-success
```

---

## 🔧 Common Commands

### Check System Health

```bash
# All services
docker ps

# Customer API
curl http://localhost:8084/health

# Prometheus
curl http://localhost:9090/-/healthy

# Grafana
curl http://localhost:3000/api/health
```

### View Logs

```bash
# All services
docker-compose logs -f

# Customer API only
docker logs attribution-customer-success -f

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services

```bash
# All services
docker-compose restart

# Customer services only
docker-compose -f deployment/docker-compose.customer.yml restart

# Single service
docker-compose restart attribution-customer-success
```

### Create Backup

```bash
# Create encrypted backup
./deployment/backup-and-restore.sh backup

# Backups stored in: /var/backups/unmogrowp/
# Retention: 30 days
```

---

## 🆘 Troubleshooting

### Services Won't Start

```bash
# Check Docker
sudo systemctl status docker

# Check ports
lsof -i :8080
lsof -i :5432

# Restart Docker
sudo systemctl restart docker
docker-compose up -d
```

### Database Connection Error

```bash
# Check PostgreSQL
docker exec attribution-postgres pg_isready

# Restart database
docker-compose restart postgres

# Check credentials in .env
grep POSTGRES_PASSWORD .env
```

### API Not Responding

```bash
# Check service
curl http://localhost:8084/health

# View logs
docker logs attribution-customer-success --tail=50

# Restart service
docker-compose -f deployment/docker-compose.customer.yml restart
```

---

## 📚 Full Documentation

For detailed information, see:

- **Complete Guide**: [deployment/README.md](./README.md)
- **Security Guide**: [deployment/security-hardening.yml](./security-hardening.yml)
- **Sprint Summary**: [deployment/WEEK1_SPRINT_SUMMARY.md](./WEEK1_SPRINT_SUMMARY.md)
- **Status Report**: [deployment/DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)

---

## 🎯 Week 1 Targets

| Metric | Target | Status |
|--------|--------|--------|
| Deploy Customer API | ✅ | Complete |
| Automate Onboarding | ✅ | Complete |
| 5-Customer Capacity | ✅ | Ready |
| Security Hardening | ✅ | Complete |
| Monitoring Active | ✅ | Complete |

---

## 🚀 Next Steps

1. **Create 5 Pilot Customers**
   ```bash
   # Run script 5 times
   ./tools/scripts/create-pilot-customer.sh
   ```

2. **Monitor Their Success**
   ```bash
   # Open Grafana
   http://localhost:3000/d/customer-success
   ```

3. **Track Week 1 Progress**
   ```bash
   # Check targets
   curl http://localhost:8084/v1/success/targets | jq
   ```

---

## 💡 Pro Tips

### Development Mode

```bash
# Start only required services
docker-compose up -d postgres redis clickhouse

# Run services locally for development
go run services/metrics/customer-success-tracker.go
```

### Production Mode

```bash
# Full deployment with all services
NODE_ENV=production ./deployment/one-click-deploy.sh

# Enable automated backups
crontab -e
# Add: 0 2 * * * /path/to/attribution/deployment/backup-and-restore.sh backup
```

### Testing Mode

```bash
# Dry run (no actual deployment)
DRY_RUN=true ./deployment/one-click-deploy.sh

# Skip tests for faster deployment
SKIP_TESTS=true ./deployment/one-click-deploy.sh
```

---

## 📞 Support

**Questions?** See [deployment/README.md](./README.md) for comprehensive documentation.

**Issues?** Check troubleshooting section above or deployment logs:
```bash
tail -f logs/deployment/one_click_deploy_*.log
```

---

**Total Time**: 15 minutes
**Difficulty**: Easy
**Result**: Production-Ready Platform ✅

🎉 **Happy Deploying!** 🎉
