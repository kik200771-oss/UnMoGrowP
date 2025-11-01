# 🔐 Secrets and Environment Variables Setup Guide

Complete guide for configuring secrets and environment variables for the UnMoGrowP Attribution Platform.

## 📋 Overview

This guide covers:
- GitHub Actions Secrets configuration
- Kubernetes secrets setup
- Local development environment
- Production deployment security

---

## 🔧 GitHub Actions Secrets

Configure these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### **Database Secrets**
```
POSTGRES_PASSWORD=your_secure_postgres_password_here
CLICKHOUSE_PASSWORD=your_secure_clickhouse_password_here
REDIS_PASSWORD=your_secure_redis_password_here
```

### **Kubernetes Configuration**
```
STAGING_KUBECONFIG=base64_encoded_staging_kubeconfig
PROD_KUBECONFIG=base64_encoded_production_kubeconfig
```

### **Container Registry**
```
DOCKER_REGISTRY_URL=registry.digitalocean.com/attribution-platform
DOCKER_REGISTRY_USERNAME=your_registry_username
DOCKER_REGISTRY_PASSWORD=your_registry_token
```

### **Security Keys**
```
JWT_SECRET=your_256_bit_jwt_secret_key_must_be_exactly_32_characters
API_KEY_SECRET=your_api_key_hashing_secret
ENCRYPTION_KEY=your_32_character_encryption_key
```

### **Third-party Integrations**
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SMTP_PASSWORD=your_smtp_password_for_notifications
```

### **Monitoring and Observability**
```
GRAFANA_PASSWORD=your_secure_grafana_admin_password
```

---

## ☸️ Kubernetes Secrets

Create Kubernetes secrets for each environment:

### **1. Database Secrets**

```bash
# PostgreSQL Secret
kubectl create secret generic postgres-secret \
  --from-literal=username=attribution \
  --from-literal=password=your_secure_postgres_password \
  --namespace=production

# ClickHouse Secret
kubectl create secret generic clickhouse-secret \
  --from-literal=username=attribution \
  --from-literal=password=your_secure_clickhouse_password \
  --namespace=production

# Redis Secret
kubectl create secret generic redis-secret \
  --from-literal=password=your_secure_redis_password \
  --namespace=production
```

### **2. Application Secrets**

```bash
# API Gateway Secrets
kubectl create secret generic api-gateway-secret \
  --from-literal=jwt-secret=your_256_bit_jwt_secret_key \
  --from-literal=api-key-secret=your_api_key_hashing_secret \
  --from-literal=encryption-key=your_32_character_encryption_key \
  --namespace=production

# ML Services Secrets
kubectl create secret generic ml-services-secret \
  --from-literal=model-encryption-key=your_ml_model_encryption_key \
  --from-literal=data-processing-key=your_data_processing_key \
  --namespace=production
```

### **3. TLS/SSL Certificates**

```bash
# SSL Certificate for HTTPS
kubectl create secret tls attribution-platform-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  --namespace=production
```

### **4. External Service Secrets**

```bash
# Email and Notifications
kubectl create secret generic external-services-secret \
  --from-literal=smtp-password=your_smtp_password \
  --from-literal=slack-webhook-url=your_slack_webhook_url \
  --from-literal=sendgrid-api-key=your_sendgrid_api_key \
  --namespace=production

# OAuth Configuration
kubectl create secret generic oauth-secret \
  --from-literal=google-client-id=your_google_client_id \
  --from-literal=google-client-secret=your_google_client_secret \
  --namespace=production
```

---

## 💻 Local Development Setup

### **1. Environment File**

Copy the example environment file and configure your local values:

```bash
cp .env.example .env
```

### **2. Generate Secure Keys**

Use these commands to generate secure keys:

```bash
# JWT Secret (256-bit)
openssl rand -hex 32

# Encryption Key (32 characters)
openssl rand -base64 32 | cut -c1-32

# API Key Secret
openssl rand -hex 24
```

### **3. Local Database Setup**

```bash
# Start local services with Docker Compose
docker-compose up -d postgres clickhouse redis

# Wait for services to be ready
docker-compose exec postgres pg_isready -U attribution
docker-compose exec clickhouse wget -q --spider http://localhost:8123/ping
docker-compose exec redis redis-cli ping
```

### **4. Environment Variable Loading**

For different development environments:

**Go Services:**
```go
// Use godotenv or similar
import "github.com/joho/godotenv"

func init() {
    godotenv.Load()
}
```

**Node.js/TypeScript Services:**
```javascript
// Use dotenv
import dotenv from 'dotenv';
dotenv.config();
```

**Python Services:**
```python
# Use python-dotenv
from dotenv import load_dotenv
load_dotenv()
```

---

## 🏭 Production Deployment

### **1. Environment-Specific Configurations**

Create separate configurations for each environment:

**Staging Environment (`k8s/staging/secrets.yaml`):**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: attribution-platform-secrets
  namespace: staging
type: Opaque
data:
  postgres-password: <base64-encoded-password>
  clickhouse-password: <base64-encoded-password>
  redis-password: <base64-encoded-password>
  jwt-secret: <base64-encoded-jwt-secret>
```

**Production Environment (`k8s/production/secrets.yaml`):**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: attribution-platform-secrets
  namespace: production
type: Opaque
data:
  postgres-password: <base64-encoded-password>
  clickhouse-password: <base64-encoded-password>
  redis-password: <base64-encoded-password>
  jwt-secret: <base64-encoded-jwt-secret>
```

### **2. ConfigMaps for Non-Sensitive Data**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: attribution-platform-config
  namespace: production
data:
  LOG_LEVEL: "info"
  METRICS_ENABLED: "true"
  KAFKA_BROKERS: "kafka:29092"
  PROMETHEUS_PORT: "9090"
```

### **3. Sealed Secrets (Recommended)**

For GitOps workflows, use Sealed Secrets to encrypt secrets in Git:

```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml

# Create sealed secret
echo -n mypassword | kubectl create secret generic mysecret --dry-run=client --from-file=password=/dev/stdin -o yaml | kubeseal -o yaml > mysealedsecret.yaml
```

---

## 🔍 Security Best Practices

### **1. Secret Rotation**

Implement regular secret rotation:

```bash
# Rotate database passwords quarterly
./scripts/security/rotate-db-passwords.sh

# Rotate JWT secrets monthly
./scripts/security/rotate-jwt-secrets.sh

# Rotate API keys on compromise
./scripts/security/rotate-api-keys.sh
```

### **2. Secret Scanning**

Prevent secrets from being committed to Git:

```bash
# Install git-secrets
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'POSTGRES_PASSWORD=.*'
git secrets --add 'JWT_SECRET=.*'
```

### **3. Access Control**

Implement least-privilege access:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: attribution-platform-sa
  namespace: production
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: secret-reader
  namespace: production
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list"]
```

### **4. Audit and Monitoring**

Monitor secret access:

```yaml
# Enable audit logging for secret access
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: Metadata
  resources:
  - group: ""
    resources: ["secrets"]
```

---

## 🚨 Emergency Procedures

### **1. Compromised Secrets**

If secrets are compromised:

```bash
# 1. Immediately rotate all secrets
./scripts/security/emergency-rotation.sh

# 2. Update all deployments
kubectl rollout restart deployment/api-gateway -n production
kubectl rollout restart deployment/ingestion-service -n production

# 3. Verify system health
./scripts/deployment/health-check.sh -e production -d
```

### **2. Recovery Procedures**

Backup and restore secrets:

```bash
# Backup secrets
kubectl get secrets -o yaml > secrets-backup.yaml

# Restore secrets
kubectl apply -f secrets-backup.yaml
```

---

## 📊 Environment Variables Reference

### **Service-Specific Variables**

| Service | Required Variables | Optional Variables |
|---------|-------------------|-------------------|
| **API Gateway (Go)** | `DATABASE_URL`, `JWT_SECRET` | `CORS_ORIGINS`, `RATE_LIMIT` |
| **API Gateway v2 (Bun)** | `DATABASE_URL`, `JWT_SECRET` | `LOG_LEVEL`, `PORT` |
| **Ingestion Service** | `KAFKA_BROKERS`, `CLICKHOUSE_URL` | `BATCH_SIZE`, `WORKER_POOL_SIZE` |
| **Attribution Engine** | `DATABASE_URL`, `CLICKHOUSE_URL` | `ATTRIBUTION_MODEL`, `WINDOW_HOURS` |
| **Analytics API** | `DATABASE_URL`, `CLICKHOUSE_URL` | `ML_MODEL_PATH`, `WORKERS` |
| **Frontend** | `API_URL` | `WS_URL`, `MONITORING_URL` |

### **Security Requirements**

| Variable | Format | Minimum Length | Notes |
|----------|--------|----------------|-------|
| `JWT_SECRET` | Hex/Base64 | 256 bits (32 bytes) | Used for token signing |
| `ENCRYPTION_KEY` | Base64 | 256 bits (32 bytes) | Used for data encryption |
| `API_KEY_SECRET` | Hex | 192 bits (24 bytes) | Used for API key hashing |
| Database passwords | Alphanumeric + symbols | 16 characters | Include uppercase, lowercase, numbers, symbols |

---

## ✅ Validation Checklist

Before deploying to production, verify:

- [ ] All required secrets are configured
- [ ] Passwords meet complexity requirements
- [ ] JWT secrets are 256-bit minimum
- [ ] Database connections work with new credentials
- [ ] SSL certificates are valid and not expired
- [ ] Monitoring can access metrics endpoints
- [ ] Backup procedures include secret recovery
- [ ] Access controls are properly configured
- [ ] Audit logging is enabled
- [ ] Emergency rotation procedures are tested

---

## 📞 Support

For questions about secrets configuration:

1. Check the deployment scripts in `scripts/deployment/`
2. Review the health check scripts for connectivity validation
3. Consult the CI/CD pipeline configuration in `.github/workflows/`
4. For emergencies, use the rollback procedures in `scripts/deployment/rollback.sh`

**Remember:** Never commit actual secrets to version control. Always use placeholder values in examples and documentation.