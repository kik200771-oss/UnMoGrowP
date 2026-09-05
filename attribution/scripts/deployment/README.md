# 🚀 UnMoGrowP Deployment Scripts

Automated deployment and operations scripts for the UnMoGrowP Attribution Platform.

## 📋 Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy-staging.sh` | Deploy to staging environment | Development testing |
| `deploy-production.sh` | Blue-green production deployment | Production releases |
| `rollback.sh` | Emergency rollback utility | Production incidents |
| `health-check.sh` | System health monitoring | Operations monitoring |

---

## 🔧 Prerequisites

### Required Tools
- **kubectl** - Kubernetes CLI
- **curl** - HTTP client
- **jq** - JSON processor (optional, for detailed output)
- **bc** - Calculator (for numeric comparisons)

### Environment Setup
```bash
# Make scripts executable
chmod +x scripts/deployment/*.sh

# Verify prerequisites
kubectl version --client
curl --version
```

### Required Secrets
Configure these secrets in your CI/CD environment:

```bash
# Kubernetes configurations
STAGING_KUBECONFIG    # Base64 encoded staging kubeconfig
PROD_KUBECONFIG       # Base64 encoded production kubeconfig

# Notification
SLACK_WEBHOOK_URL     # Slack webhook for notifications (optional)
```

---

## 📦 Script Details

### 1. deploy-staging.sh

**Purpose:** Automated staging deployment with validation

**Features:**
- Kubernetes manifest deployment
- Health checks with retries
- Integration test execution
- Automatic rollback on failure

**Usage:**
```bash
# Basic staging deployment
./scripts/deployment/deploy-staging.sh

# With verbose output
VERBOSE=true ./scripts/deployment/deploy-staging.sh
```

**Exit Codes:**
- `0` - Deployment successful
- `1` - Deployment failed
- `2` - Health checks failed

---

### 2. deploy-production.sh

**Purpose:** Blue-green production deployment with comprehensive validation

**Features:**
- Pre-deployment validation
- Blue-green deployment strategy
- Comprehensive health checks (8 different checks)
- Post-deployment monitoring
- Automatic backup before deployment
- Slack notifications
- Emergency rollback capability

**Usage:**
```bash
# Production deployment (requires confirmation)
./scripts/deployment/deploy-production.sh

# Check deployment status
kubectl get deployments -n production
```

**Validation Steps:**
1. ✅ Prerequisites validation
2. ✅ Current production health check
3. ✅ Deployment backup creation
4. ✅ Blue-green deployment
5. ✅ Comprehensive health validation
6. ✅ Post-deployment monitoring

**Health Checks:**
- Basic health endpoint
- API Gateway health
- Database connectivity
- Redis connectivity
- ML API health
- Authentication test
- Event ingestion test
- Performance test

---

### 3. rollback.sh

**Purpose:** Emergency rollback utility for production incidents

**Features:**
- Multi-step rollback (1-10 revisions)
- Pre-rollback status display
- Confirmation prompts (can be forced)
- Post-rollback validation
- Backup creation before rollback
- Slack notifications

**Usage:**
```bash
# Rollback production by 1 step (default)
./scripts/deployment/rollback.sh

# Rollback staging by 2 steps
./scripts/deployment/rollback.sh -e staging -s 2

# Force rollback without confirmation
./scripts/deployment/rollback.sh -f

# Get help
./scripts/deployment/rollback.sh -h
```

**Options:**
- `-e, --environment ENV` - Environment (production, staging)
- `-s, --steps NUM` - Number of rollback steps (1-10)
- `-f, --force` - Skip confirmation prompts
- `-h, --help` - Show help

**Safety Features:**
- Mandatory confirmation for production rollbacks
- Backup creation before rollback
- Rollback target validation
- Post-rollback health verification

---

### 4. health-check.sh

**Purpose:** Comprehensive system health monitoring

**Features:**
- Multi-level health checks
- Performance monitoring
- Kubernetes cluster validation
- Continuous monitoring mode
- JSON output format
- Prometheus metrics integration

**Usage:**
```bash
# Basic health check for production
./scripts/deployment/health-check.sh

# Detailed health check for staging
./scripts/deployment/health-check.sh -e staging -d

# Continuous monitoring every 60 seconds
./scripts/deployment/health-check.sh -c -i 60

# JSON output for automation
./scripts/deployment/health-check.sh -f json

# Get help
./scripts/deployment/health-check.sh -h
```

**Check Categories:**
1. **Basic Health (5 checks)**
   - Frontend accessibility
   - API health endpoint
   - Database connectivity
   - Redis connectivity
   - ML API health

2. **Performance (2 checks)**
   - API response time
   - Frontend load time

3. **Kubernetes (3 checks)**
   - Pod status
   - Service endpoints
   - Deployment readiness

4. **Monitoring (2 checks)**
   - Prometheus accessibility
   - Grafana accessibility

**Output Formats:**
- **Text** (default) - Human-readable colored output
- **JSON** - Machine-readable structured output

---

## 🔄 CI/CD Integration

### GitHub Actions Usage

These scripts are integrated into the main CI/CD pipeline (`.github/workflows/ci.yml`):

```yaml
# Staging deployment
deploy-staging:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to staging
      run: ./scripts/deployment/deploy-staging.sh

# Production deployment
deploy-production:
  runs-on: ubuntu-latest
  environment: production
  steps:
    - name: Deploy to production
      run: ./scripts/deployment/deploy-production.sh

# Emergency rollback
rollback:
  if: github.event_name == 'workflow_dispatch'
  runs-on: ubuntu-latest
  steps:
    - name: Execute rollback
      run: ./scripts/deployment/rollback.sh -f
```

### Manual Deployment

For manual deployments outside of CI/CD:

```bash
# 1. Deploy to staging first
./scripts/deployment/deploy-staging.sh

# 2. Verify staging health
./scripts/deployment/health-check.sh -e staging -d

# 3. Deploy to production (requires confirmation)
./scripts/deployment/deploy-production.sh

# 4. Monitor production health
./scripts/deployment/health-check.sh -c -i 30
```

---

## 🔍 Monitoring and Alerting

### Health Check Automation

**Continuous Monitoring:**
```bash
# Start monitoring in background
nohup ./scripts/deployment/health-check.sh -c -i 30 > health.log 2>&1 &

# Check logs
tail -f health.log
```

**Automated Alerting:**
```bash
# JSON output for monitoring systems
./scripts/deployment/health-check.sh -f json | jq '.overall_status'

# Exit codes for alerting
if ! ./scripts/deployment/health-check.sh; then
    echo "ALERT: Health check failed!"
fi
```

### Prometheus Integration

Health metrics are exposed to Prometheus for dashboard visualization:

- **Basic health score** - `/health` endpoints
- **Response times** - API performance metrics
- **Error rates** - HTTP 5xx responses
- **Resource usage** - CPU, memory, disk

---

## 📊 Troubleshooting

### Common Issues

**1. Health Check Failures**
```bash
# Check detailed health status
./scripts/deployment/health-check.sh -e production -d

# Check Kubernetes pod status
kubectl get pods -n production

# Check recent events
kubectl get events -n production --sort-by='.lastTimestamp'
```

**2. Deployment Failures**
```bash
# Check deployment status
kubectl get deployments -n production -o wide

# Check pod logs
kubectl logs -n production deployment/api-gateway

# Manual rollback if needed
./scripts/deployment/rollback.sh -e production -s 1
```

**3. Performance Issues**
```bash
# Check response times
./scripts/deployment/health-check.sh | grep "response time"

# Check resource usage
kubectl top pods -n production

# Check Prometheus metrics
curl http://prometheus.attribution.platform/api/v1/query?query=up
```

### Emergency Procedures

**Complete System Failure:**
1. Check overall system health
2. Identify failing components
3. Execute emergency rollback
4. Verify rollback success
5. Investigate root cause

```bash
# 1. Quick health assessment
./scripts/deployment/health-check.sh -f json | jq '.overall_status'

# 2. Emergency rollback
./scripts/deployment/rollback.sh -f

# 3. Verify recovery
./scripts/deployment/health-check.sh -d
```

---

## 🔐 Security Considerations

### Access Control
- Scripts require Kubernetes cluster access
- Production deployments require manual approval
- Rollback operations are logged and audited

### Secrets Management
- No secrets stored in scripts
- Environment variables for sensitive data
- Kubernetes secrets for application configuration

### Audit Trail
- All operations are logged with timestamps
- Slack notifications for deployment events
- Backup creation before destructive operations

---

## 📈 Performance Characteristics

### Deployment Times
- **Staging deployment:** ~2-3 minutes
- **Production deployment:** ~5-8 minutes
- **Emergency rollback:** ~1-2 minutes

### Health Check Performance
- **Basic checks:** ~10-15 seconds
- **Detailed checks:** ~30-45 seconds
- **Continuous monitoring:** Configurable interval

### Resource Requirements
- **CPU:** Minimal (bash scripts)
- **Memory:** <100MB
- **Network:** HTTP requests to endpoints

---

## 🚀 Best Practices

### Deployment Workflow
1. **Always test in staging first**
2. **Verify health before production deployment**
3. **Monitor post-deployment metrics**
4. **Keep rollback plan ready**

### Monitoring Strategy
1. **Continuous health monitoring**
2. **Alerting on critical failures**
3. **Regular performance baseline updates**
4. **Post-incident reviews**

### Emergency Response
1. **Quick assessment with health checks**
2. **Immediate rollback if necessary**
3. **Root cause analysis**
4. **Process improvement**

---

## 📝 Contributing

When modifying deployment scripts:

1. **Test thoroughly in staging**
2. **Update documentation**
3. **Add appropriate error handling**
4. **Include logging for debugging**
5. **Follow existing script patterns**

### Script Development Guidelines
- Use `set -euo pipefail` for safety
- Implement comprehensive error handling
- Add colored output for readability
- Include usage instructions
- Test all code paths

---

**🎯 Ready for enterprise-grade deployments!** 🚀