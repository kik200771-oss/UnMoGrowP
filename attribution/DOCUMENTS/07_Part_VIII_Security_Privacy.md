# Part VIII: Security & Privacy

## Enterprise-Grade Security, GDPR Compliant, Zero-Trust Architecture

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [Regulatory Compliance](#regulatory-compliance)
3. [Zero-Trust Architecture](#zero-trust-architecture)
4. [Data Encryption](#data-encryption)
5. [Authentication & Authorization](#authentication-authorization)
6. [Network Security](#network-security)
7. [Application Security](#application-security)
8. [Privacy by Design](#privacy-by-design)
9. [Incident Response](#incident-response)
10. [Security Auditing](#security-auditing)

---

## Executive Overview

### Security Philosophy

**Core Principles:**
1. **Zero Trust** - Never trust, always verify
2. **Defense in Depth** - Multiple layers of security
3. **Privacy by Design** - Privacy built into architecture
4. **Least Privilege** - Minimal access required
5. **Assume Breach** - Design for compromise scenarios

### Compliance Certifications (Target)

| Certification | Status | Timeline |
|---------------|--------|----------|
| **GDPR** (EU) | ✅ Compliant | Launch |
| **CCPA** (California) | ✅ Compliant | Launch |
| **SOC 2 Type II** | 🔄 In Progress | Year 1 |
| **ISO 27001** | 📋 Planned | Year 2 |
| **HIPAA** | 📋 Planned | Year 2 (if needed) |
| **PCI DSS** | 📋 Planned | Year 2 (if payment data) |

### Security Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Network** | CloudFlare, AWS WAF, VPC | DDoS protection, firewall |
| **Perimeter** | Kong Gateway, Istio | API security, mTLS |
| **Identity** | Auth0, Vault | Authentication, secrets |
| **Data** | AES-256, TLS 1.3 | Encryption at rest/transit |
| **Application** | OWASP, Snyk | Vulnerability scanning |
| **Monitoring** | Falco, SIEM | Threat detection |
| **Compliance** | Vanta, Drata | Automated compliance |

### Threat Model

**Attack Vectors & Mitigations:**

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| DDoS Attack | High | High | CloudFlare (unlimited protection) |
| SQL Injection | Medium | Critical | Parameterized queries, WAF |
| XSS | Medium | High | CSP headers, input sanitization |
| Data Breach | Low | Critical | Encryption, access control, audit logs |
| API Abuse | High | Medium | Rate limiting, authentication |
| Insider Threat | Low | High | Least privilege, audit logs |
| Supply Chain Attack | Medium | Critical | Dependency scanning, signing |
| Credential Theft | Medium | High | MFA, password policies, rotation |

---

## Regulatory Compliance

### GDPR Compliance (General Data Protection Regulation)

**Key Requirements:**

#### 1. Lawful Basis for Processing

```yaml
# Data processing inventory
data_categories:
  # Technical data (Legitimate Interest)
  - category: technical_identifiers
    types:
      - device_id
      - ip_address
      - user_agent
    lawful_basis: legitimate_interest
    purpose: attribution_tracking
    retention: 90_days

  # User account data (Contract)
  - category: account_data
    types:
      - email
      - company_name
      - billing_info
    lawful_basis: contract
    purpose: service_delivery
    retention: account_lifetime

  # Marketing data (Consent)
  - category: marketing
    types:
      - email
      - preferences
    lawful_basis: consent
    purpose: marketing_communications
    retention: until_consent_withdrawn
```

#### 2. User Rights Implementation

```typescript
// GDPR User Rights API
interface GDPRUserRights {
  // Right to Access (Article 15)
  exportUserData(userId: string): Promise<UserDataExport>;

  // Right to Rectification (Article 16)
  updateUserData(userId: string, updates: UserDataUpdate): Promise<void>;

  // Right to Erasure / "Right to be Forgotten" (Article 17)
  deleteUserData(userId: string): Promise<void>;

  // Right to Restriction of Processing (Article 18)
  restrictProcessing(userId: string): Promise<void>;

  // Right to Data Portability (Article 20)
  exportPortableData(userId: string, format: 'json' | 'csv'): Promise<Blob>;

  // Right to Object (Article 21)
  objectToProcessing(userId: string, category: string): Promise<void>;
}

// Implementation
class GDPRService implements GDPRUserRights {
  async exportUserData(userId: string): Promise<UserDataExport> {
    // Collect data from all systems
    const [
      accountData,
      attributionData,
      campaignData,
      billingData
    ] = await Promise.all([
      db.users.findOne({ id: userId }),
      db.attributions.find({ user_id: userId }).toArray(),
      db.campaigns.find({ user_id: userId }).toArray(),
      db.billing.find({ user_id: userId }).toArray()
    ]);

    return {
      user_id: userId,
      export_date: new Date().toISOString(),
      data: {
        account: accountData,
        attribution: attributionData,
        campaigns: campaignData,
        billing: billingData
      },
      metadata: {
        data_retention_period: '90 days',
        lawful_basis: 'contract',
        data_controller: 'Attribution Platform Inc.'
      }
    };
  }

  async deleteUserData(userId: string): Promise<void> {
    // 30-day grace period before permanent deletion
    await db.users.updateOne(
      { id: userId },
      {
        $set: {
          deletion_requested_at: new Date(),
          status: 'pending_deletion'
        }
      }
    );

    // Schedule permanent deletion after 30 days
    await scheduleTask({
      task: 'permanent_user_deletion',
      user_id: userId,
      execute_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Account Deletion Scheduled',
      body: `Your account will be permanently deleted in 30 days.
             You can cancel this request by logging in.`
    });
  }

  async permanentlyDeleteUser(userId: string): Promise<void> {
    // Delete from all systems
    await Promise.all([
      // Anonymize attribution data (keep for analytics)
      db.attributions.updateMany(
        { user_id: userId },
        { $set: { user_id: 'anonymized', anonymized_at: new Date() } }
      ),

      // Delete personal data
      db.users.deleteOne({ id: userId }),
      db.campaigns.deleteMany({ user_id: userId }),
      db.billing.deleteMany({ user_id: userId }),

      // Delete from cache
      redis.del(`user:${userId}`),

      // Delete from ML models
      mlService.forgetUser(userId),

      // Delete backups (mark for deletion)
      s3.putObjectTagging({
        Bucket: 'backups',
        Key: `users/${userId}`,
        Tagging: { TagSet: [{ Key: 'gdpr-delete', Value: 'true' }] }
      })
    ]);

    // Audit log
    await auditLog.create({
      event: 'user_permanently_deleted',
      user_id: userId,
      timestamp: new Date(),
      details: 'User data permanently deleted per GDPR Article 17'
    });
  }
}
```

#### 3. Privacy Policy & Cookie Consent

```typescript
// Cookie consent management
interface CookieConsent {
  necessary: boolean;     // Always true (required for service)
  analytics: boolean;     // User choice
  marketing: boolean;     // User choice
  personalization: boolean; // User choice
}

class ConsentManager {
  async getConsent(userId: string): Promise<CookieConsent> {
    const consent = await db.consents.findOne({ user_id: userId });

    return {
      necessary: true,  // Always allowed
      analytics: consent?.analytics ?? false,
      marketing: consent?.marketing ?? false,
      personalization: consent?.personalization ?? false
    };
  }

  async updateConsent(
    userId: string,
    consent: CookieConsent
  ): Promise<void> {
    await db.consents.updateOne(
      { user_id: userId },
      {
        $set: {
          ...consent,
          updated_at: new Date(),
          ip_address: request.ip,
          user_agent: request.headers['user-agent']
        }
      },
      { upsert: true }
    );

    // Audit log
    await auditLog.create({
      event: 'consent_updated',
      user_id: userId,
      consent: consent,
      timestamp: new Date()
    });
  }

  async withdrawConsent(
    userId: string,
    category: keyof CookieConsent
  ): Promise<void> {
    if (category === 'necessary') {
      throw new Error('Cannot withdraw consent for necessary cookies');
    }

    await this.updateConsent(userId, {
      ...await this.getConsent(userId),
      [category]: false
    });

    // Delete existing data for that category
    if (category === 'analytics') {
      await db.analytics_events.deleteMany({ user_id: userId });
    }
    if (category === 'marketing') {
      await db.marketing_preferences.deleteMany({ user_id: userId });
    }
  }
}
```

#### 4. Data Processing Agreement (DPA)

```markdown
# Data Processing Agreement

## 1. Definitions
- **Data Controller**: Customer (your company)
- **Data Processor**: Attribution Platform Inc.
- **Personal Data**: Any data that can identify an end user
- **Processing**: Collection, storage, analysis, deletion

## 2. Data Processor Obligations
We commit to:
- Process data only per your instructions
- Ensure confidentiality of processing personnel
- Implement appropriate technical & organizational measures
- Assist with data subject rights requests
- Delete or return data upon contract termination
- Make available all information necessary to demonstrate compliance

## 3. Sub-Processors
Approved sub-processors:
- AWS (hosting)
- CloudFlare (CDN)
- SendGrid (email)
- Stripe (payment processing)

Customer will be notified 30 days before any sub-processor changes.

## 4. Data Security Measures
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Regular security audits
- Penetration testing (annual)
- Access controls (RBAC)
- Audit logging (immutable)

## 5. Data Breach Notification
- Notification within 72 hours of discovery
- Details: nature, categories, approximate number of data subjects
- Likely consequences and measures taken

## 6. International Data Transfers
- EU data stored in EU region
- Standard Contractual Clauses (SCCs) for transfers
- Privacy Shield certification (if applicable)
```

### CCPA Compliance (California Consumer Privacy Act)

**CCPA User Rights:**

```typescript
class CCPAService {
  // Right to Know
  async discloseCategoriesCollected(userId: string): Promise<CCPADisclosure> {
    return {
      categories_collected: [
        {
          category: 'Identifiers',
          examples: ['Device ID', 'IP address', 'Email'],
          purpose: 'Attribution tracking, account management'
        },
        {
          category: 'Internet Activity',
          examples: ['Click events', 'Conversion events'],
          purpose: 'Attribution analysis'
        },
        {
          category: 'Commercial Information',
          examples: ['Purchase history', 'Campaign spend'],
          purpose: 'Billing, reporting'
        }
      ],
      sources: ['Directly from user', 'From user device', 'From ad networks'],
      business_purpose: 'Provide attribution tracking services',
      third_parties_shared_with: ['Cloud hosting provider (AWS)'],
      retention_period: '90 days for tracking data, lifetime for account data'
    };
  }

  // Right to Delete
  async deletePersonalInformation(userId: string): Promise<void> {
    // Same as GDPR deletion
    await gdprService.deleteUserData(userId);
  }

  // Right to Opt-Out of Sale
  async optOutOfSale(userId: string): Promise<void> {
    // We don't sell data, but mark preference
    await db.users.updateOne(
      { id: userId },
      { $set: { do_not_sell: true, do_not_sell_date: new Date() } }
    );
  }

  // Right to Non-Discrimination
  // No differential pricing or service levels for CCPA requests
}
```

### Data Retention Policies

```yaml
# data-retention.yaml
---
retention_policies:
  # User account data
  - data_type: user_accounts
    retention: account_lifetime
    deletion: within_30_days_of_account_closure

  # Attribution data (anonymous)
  - data_type: attribution_events
    retention: 90_days
    deletion: automatic_after_90_days
    anonymization: immediate_on_ingestion  # No PII stored

  # Campaign data
  - data_type: campaigns
    retention: 2_years
    deletion: manual_or_automatic_after_2_years

  # Billing data
  - data_type: invoices
    retention: 7_years  # Legal requirement
    deletion: automatic_after_7_years

  # Audit logs
  - data_type: audit_logs
    retention: 7_years
    deletion: never  # Immutable compliance logs

  # Backups
  - data_type: database_backups
    retention: 30_days
    deletion: automatic_lifecycle_policy

  # ML training data
  - data_type: ml_models
    retention: 1_year
    deletion: automatic_after_model_replaced
    anonymization: all_PII_removed_before_training
```

**Automated Retention Enforcement:**

```python
# retention_enforcer.py
import asyncio
from datetime import datetime, timedelta

class RetentionEnforcer:
    """
    Automated data retention enforcement
    """

    async def enforce_retention_policies(self):
        """
        Run daily to enforce retention policies
        """

        # Delete old attribution events (>90 days)
        cutoff_90d = datetime.now() - timedelta(days=90)
        result = await db.attributions.deleteMany({
            'timestamp': { '$lt': cutoff_90d }
        })
        logger.info(f"Deleted {result.deleted_count} old attribution events")

        # Delete old campaigns (>2 years)
        cutoff_2y = datetime.now() - timedelta(days=730)
        result = await db.campaigns.deleteMany({
            'created_at': { '$lt': cutoff_2y },
            'status': 'archived'
        })
        logger.info(f"Deleted {result.deleted_count} old campaigns")

        # Delete old backups (>30 days)
        await s3.deleteObjects(
            Bucket='backups',
            Objects=[
                obj for obj in s3.listObjects(Bucket='backups')
                if obj.LastModified < cutoff_90d
            ]
        )

        # Anonymize data for deleted users
        pending_deletions = await db.users.find({
            'deletion_requested_at': { '$lt': datetime.now() - timedelta(days=30) },
            'status': 'pending_deletion'
        }).toArray()

        for user in pending_deletions:
            await gdprService.permanentlyDeleteUser(user.id)

# Schedule daily
asyncio.create_task(RetentionEnforcer().enforce_retention_policies())
```

---

## Zero-Trust Architecture

### Principles

**Never Trust, Always Verify:**
- No implicit trust based on network location
- Verify every request, every time
- Assume breach at all times
- Minimize blast radius

### Implementation

```
┌─────────────────────────────────────────────────────────────┐
│                     EXTERNAL USER                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  CLOUDFLARE (Layer 7)                        │
│  • DDoS Protection                                          │
│  • Web Application Firewall (WAF)                           │
│  • Bot Detection                                            │
│  • Rate Limiting                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 AWS WAF (Layer 7)                            │
│  • IP reputation filtering                                  │
│  • SQL injection protection                                 │
│  • XSS protection                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  KONG GATEWAY                                │
│  • Authentication (JWT, OAuth, API Key)                     │
│  • Rate Limiting (per-user, per-IP)                         │
│  • Request Validation                                       │
│  • Circuit Breaking                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 ISTIO SERVICE MESH                           │
│  • mTLS (mutual TLS) between all services                   │
│  • Zero-trust service-to-service communication              │
│  • Authorization policies (RBAC)                            │
│  • Traffic encryption                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 MICROSERVICES                                │
│  • Least privilege access                                   │
│  • No lateral movement                                      │
│  • Defense in depth                                         │
└─────────────────────────────────────────────────────────────┘
```

### mTLS Configuration (Istio)

```yaml
# istio-mtls.yaml
---
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT  # Require mTLS for all services

---
# Authorization policy - only allow specific services
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: ingestion-authz
  namespace: ingestion
spec:
  selector:
    matchLabels:
      app: ingestion
  action: ALLOW
  rules:
    # Allow from Kong Gateway
    - from:
        - source:
            principals:
              - "cluster.local/ns/kong/sa/kong"
      to:
        - operation:
            methods: ["POST"]
            paths: ["/v1/events"]

    # Allow from monitoring (Prometheus)
    - from:
        - source:
            namespaces: ["monitoring"]
      to:
        - operation:
            methods: ["GET"]
            paths: ["/metrics", "/health"]

    # Deny all other traffic (implicit)
```

### Identity & Access Management

```yaml
# service-account-rbac.yaml
---
# Service account for ingestion service
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ingestion-service
  namespace: ingestion
  annotations:
    # AWS IAM role for service account (IRSA)
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789:role/ingestion-service-role

---
# RBAC - minimal permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ingestion-service-role
  namespace: ingestion
rules:
  # Can read ConfigMaps
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list"]

  # Can read Secrets
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get"]

  # Cannot create, update, delete anything

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ingestion-service-binding
  namespace: ingestion
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: ingestion-service-role
subjects:
  - kind: ServiceAccount
    name: ingestion-service
    namespace: ingestion
```

### AWS IAM Roles for Service Accounts (IRSA)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kafka:DescribeCluster",
        "kafka:GetBootstrapBrokers"
      ],
      "Resource": "arn:aws:kafka:us-east-1:123456789:cluster/attribution-kafka/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::attribution-raw-events/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "arn:aws:kms:us-east-1:123456789:key/*"
    }
  ]
}
```

---

## Data Encryption

### Encryption at Rest

**All data encrypted using AES-256:**

```yaml
# encryption-config.yaml
---
encryption:
  # Databases
  clickhouse:
    method: AES-256-GCM
    key_source: AWS KMS
    key_rotation: 90_days

  cockroachdb:
    method: AES-256-GCM
    key_source: AWS KMS
    key_rotation: 90_days

  redis:
    method: AES-256-CFB
    key_source: AWS KMS
    key_rotation: 90_days

  # Storage
  s3:
    method: AES-256
    key_source: AWS KMS (SSE-KMS)
    key_rotation: automatic

  ebs_volumes:
    method: AES-256-XTS
    key_source: AWS KMS
    key_rotation: automatic

  # Backups
  backups:
    method: AES-256-GCM
    key_source: AWS KMS
    key_rotation: 90_days
    additional: client_side_encryption_before_upload
```

**AWS KMS Key Management:**

```terraform
# kms.tf
resource "aws_kms_key" "attribution_data" {
  description             = "Attribution Platform Data Encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "attribution-data-key"
    Environment = "production"
  }
}

resource "aws_kms_alias" "attribution_data" {
  name          = "alias/attribution-data"
  target_key_id = aws_kms_key.attribution_data.key_id
}

# IAM policy for KMS access
resource "aws_iam_policy" "kms_decrypt" {
  name = "attribution-kms-decrypt"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.attribution_data.arn
      }
    ]
  })
}
```

### Encryption in Transit

**TLS 1.3 everywhere:**

```yaml
# tls-config.yaml
---
tls:
  # External traffic (CloudFlare)
  cloudflare:
    version: TLS 1.3
    cipher_suites:
      - TLS_AES_256_GCM_SHA384
      - TLS_CHACHA20_POLY1305_SHA256
      - TLS_AES_128_GCM_SHA256
    hsts: true
    hsts_max_age: 31536000  # 1 year

  # Kong Gateway
  kong:
    version: TLS 1.3
    client_certificate: required  # mTLS
    verify_depth: 1

  # Istio service mesh
  istio:
    mode: STRICT  # mTLS required
    version: TLS 1.3

  # Databases
  databases:
    clickhouse:
      require_ssl: true
      ssl_version: TLSv1.3
      ssl_cert_verify: true

    cockroachdb:
      require_ssl: true
      ssl_mode: require
      ssl_cert: /certs/client.crt
      ssl_key: /certs/client.key

    redis:
      tls: true
      tls_cert_file: /certs/redis.crt
      tls_key_file: /certs/redis.key
```

### Certificate Management

```yaml
# cert-manager.yaml
---
# Install cert-manager for automated certificate management
apiVersion: v1
kind: Namespace
metadata:
  name: cert-manager

---
# ClusterIssuer for Let's Encrypt
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: security@attribution-platform.com
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
      - http01:
          ingress:
            class: kong

---
# Certificate for API
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: api-tls
  namespace: api
spec:
  secretName: api-tls-cert
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - api.attribution-platform.com
  renewBefore: 720h  # 30 days
```

### Secrets Management (HashiCorp Vault)

```yaml
# vault-deployment.yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: vault

---
# Install Vault via Helm
# helm install vault hashicorp/vault \
#   --namespace vault \
#   --values vault-values.yaml

# vault-values.yaml
server:
  # High availability mode
  ha:
    enabled: true
    replicas: 3

  # Auto-unseal with AWS KMS
  auditStorage:
    enabled: true
    size: 10Gi

  # Storage backend (Raft)
  dataStorage:
    enabled: true
    size: 10Gi
    storageClass: gp3

  # Vault configuration
  config: |
    ui = true

    listener "tcp" {
      address = "[::]:8200"
      cluster_address = "[::]:8201"
      tls_cert_file = "/vault/tls/tls.crt"
      tls_key_file = "/vault/tls/tls.key"
    }

    storage "raft" {
      path = "/vault/data"
    }

    seal "awskms" {
      region = "us-east-1"
      kms_key_id = "arn:aws:kms:us-east-1:123456789:key/vault-unseal-key"
    }

    service_registration "kubernetes" {}

# Vault policies
injector:
  enabled: true

  # Inject secrets into pods
  agentImage:
    repository: hashicorp/vault
    tag: 1.15.0
```

**Vault Secrets Management:**

```bash
#!/bin/bash
# vault-setup.sh

# Enable KV secrets engine
vault secrets enable -path=attribution kv-v2

# Store database credentials
vault kv put attribution/database/clickhouse \
  username=clickhouse_user \
  password=$(openssl rand -base64 32)

vault kv put attribution/database/cockroachdb \
  username=crdb_user \
  password=$(openssl rand -base64 32)

# Store API keys
vault kv put attribution/api-keys/stripe \
  publishable_key=pk_live_xxx \
  secret_key=sk_live_xxx

# Store encryption keys
vault kv put attribution/encryption/data-key \
  key=$(openssl rand -base64 32)

# Create policy for ingestion service
vault policy write ingestion-service - <<EOF
path "attribution/database/clickhouse" {
  capabilities = ["read"]
}
path "attribution/database/redis" {
  capabilities = ["read"]
}
EOF

# Enable Kubernetes auth
vault auth enable kubernetes

vault write auth/kubernetes/config \
  kubernetes_host=https://kubernetes.default.svc \
  kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt

vault write auth/kubernetes/role/ingestion-service \
  bound_service_account_names=ingestion-service \
  bound_service_account_namespaces=ingestion \
  policies=ingestion-service \
  ttl=1h
```

**Inject Secrets into Pods:**

```yaml
# deployment-with-vault-secrets.yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ingestion-service
  namespace: ingestion
spec:
  template:
    metadata:
      annotations:
        # Vault agent injector annotations
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "ingestion-service"
        vault.hashicorp.com/agent-inject-secret-db: "attribution/database/clickhouse"
        vault.hashicorp.com/agent-inject-template-db: |
          {{- with secret "attribution/database/clickhouse" -}}
          export DB_USERNAME="{{ .Data.data.username }}"
          export DB_PASSWORD="{{ .Data.data.password }}"
          {{- end }}
    spec:
      serviceAccountName: ingestion-service
      containers:
        - name: ingestion
          image: ingestion:latest
          command:
            - sh
            - -c
            - source /vault/secrets/db && ./ingestion-service
```

---

## Authentication & Authorization

### Multi-Factor Authentication (MFA)

```typescript
// auth-service.ts
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

class MFAService {
  /**
   * Enable TOTP (Time-based One-Time Password) MFA
   */
  async enableMFA(userId: string): Promise<MFASetup> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: 'Attribution Platform',
      issuer: 'Attribution Platform',
      length: 32
    });

    // Store secret (encrypted)
    await db.users.updateOne(
      { id: userId },
      {
        $set: {
          mfa_secret: await encrypt(secret.base32),
          mfa_enabled: false,  // Not enabled until verified
          mfa_backup_codes: await this.generateBackupCodes()
        }
      }
    );

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qr_code: qrCode,
      backup_codes: await this.generateBackupCodes()
    };
  }

  /**
   * Verify TOTP token
   */
  async verifyMFA(userId: string, token: string): Promise<boolean> {
    const user = await db.users.findOne({ id: userId });
    const secret = await decrypt(user.mfa_secret);

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1  // Allow 30s clock drift
    });

    if (verified && !user.mfa_enabled) {
      // First-time verification - enable MFA
      await db.users.updateOne(
        { id: userId },
        { $set: { mfa_enabled: true } }
      );
    }

    return verified;
  }

  /**
   * Generate backup codes
   */
  async generateBackupCodes(): Promise<string[]> {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(
        Array(8).fill(0).map(() => Math.floor(Math.random() * 10)).join('')
      );
    }
    return codes;
  }
}
```

### Role-Based Access Control (RBAC)

```typescript
// rbac.ts
enum Role {
  OWNER = 'owner',           // Full access
  ADMIN = 'admin',           // Manage users, campaigns, billing
  DEVELOPER = 'developer',   // API access, view data
  ANALYST = 'analyst',       // View reports only
  BILLING = 'billing'        // View/manage billing only
}

enum Permission {
  // Campaign permissions
  CAMPAIGN_CREATE = 'campaign:create',
  CAMPAIGN_READ = 'campaign:read',
  CAMPAIGN_UPDATE = 'campaign:update',
  CAMPAIGN_DELETE = 'campaign:delete',

  // User permissions
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Billing permissions
  BILLING_READ = 'billing:read',
  BILLING_UPDATE = 'billing:update',

  // API permissions
  API_CREATE_KEY = 'api:create_key',
  API_READ_KEY = 'api:read_key',
  API_DELETE_KEY = 'api:delete_key',

  // Data permissions
  DATA_EXPORT = 'data:export',
  DATA_DELETE = 'data:delete'
}

// Role → Permissions mapping
const RolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: Object.values(Permission),  // All permissions

  [Role.ADMIN]: [
    Permission.CAMPAIGN_CREATE,
    Permission.CAMPAIGN_READ,
    Permission.CAMPAIGN_UPDATE,
    Permission.CAMPAIGN_DELETE,
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.BILLING_READ,
    Permission.BILLING_UPDATE,
    Permission.API_CREATE_KEY,
    Permission.API_READ_KEY,
    Permission.DATA_EXPORT
  ],

  [Role.DEVELOPER]: [
    Permission.CAMPAIGN_READ,
    Permission.API_CREATE_KEY,
    Permission.API_READ_KEY,
    Permission.API_DELETE_KEY,
    Permission.DATA_EXPORT
  ],

  [Role.ANALYST]: [
    Permission.CAMPAIGN_READ,
    Permission.DATA_EXPORT
  ],

  [Role.BILLING]: [
    Permission.BILLING_READ,
    Permission.BILLING_UPDATE
  ]
};

class AuthorizationService {
  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    permission: Permission
  ): Promise<boolean> {
    const user = await db.users.findOne({ id: userId });
    const permissions = RolePermissions[user.role];
    return permissions.includes(permission);
  }

  /**
   * Require permission (throw if not authorized)
   */
  async requirePermission(
    userId: string,
    permission: Permission
  ): Promise<void> {
    const hasPermission = await this.hasPermission(userId, permission);
    if (!hasPermission) {
      throw new ForbiddenError(
        `User ${userId} does not have permission: ${permission}`
      );
    }
  }

  /**
   * Authorization middleware
   */
  authorize(permission: Permission) {
    return async (req, res, next) => {
      try {
        await this.requirePermission(req.user.id, permission);
        next();
      } catch (error) {
        res.status(403).json({ error: 'Forbidden' });
      }
    };
  }
}

// Usage in API routes
app.post('/api/campaigns',
  authenticate,
  authz.authorize(Permission.CAMPAIGN_CREATE),
  async (req, res) => {
    // Create campaign
  }
);
```

### API Key Management

```typescript
// api-key-service.ts
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

interface APIKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;  // First 8 chars (for identification)
  key_hash: string;    // Hashed key (bcrypt)
  permissions: Permission[];
  rate_limit: number;  // Requests per minute
  created_at: Date;
  last_used_at?: Date;
  expires_at?: Date;
}

class APIKeyService {
  /**
   * Create API key
   */
  async createAPIKey(
    userId: string,
    name: string,
    permissions: Permission[],
    expiresInDays?: number
  ): Promise<{ key: string; api_key: APIKey }> {
    // Generate random key (64 chars)
    const key = crypto.randomBytes(32).toString('hex');
    const keyPrefix = key.substring(0, 8);
    const keyHash = await bcrypt.hash(key, 10);

    const apiKey: APIKey = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      permissions: permissions,
      rate_limit: 10000,  // 10K req/min default
      created_at: new Date(),
      expires_at: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined
    };

    await db.api_keys.insertOne(apiKey);

    // Return plaintext key ONCE (never stored in plaintext)
    return {
      key: key,
      api_key: apiKey
    };
  }

  /**
   * Verify API key
   */
  async verifyAPIKey(key: string): Promise<APIKey | null> {
    const keyPrefix = key.substring(0, 8);

    // Find by prefix (fast)
    const apiKey = await db.api_keys.findOne({ key_prefix: keyPrefix });
    if (!apiKey) {
      return null;
    }

    // Verify hash (slow but secure)
    const valid = await bcrypt.compare(key, apiKey.key_hash);
    if (!valid) {
      return null;
    }

    // Check expiration
    if (apiKey.expires_at && apiKey.expires_at < new Date()) {
      return null;
    }

    // Update last used
    await db.api_keys.updateOne(
      { id: apiKey.id },
      { $set: { last_used_at: new Date() } }
    );

    return apiKey;
  }

  /**
   * Rate limit check
   */
  async checkRateLimit(apiKey: APIKey): Promise<boolean> {
    const key = `rate_limit:${apiKey.id}`;
    const count = await redis.incr(key);

    if (count === 1) {
      // First request in window - set expiry
      await redis.expire(key, 60);  // 1 minute
    }

    return count <= apiKey.rate_limit;
  }
}

// API Key authentication middleware
async function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const key = await apiKeyService.verifyAPIKey(apiKey);
  if (!key) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Rate limiting
  const allowed = await apiKeyService.checkRateLimit(key);
  if (!allowed) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  // Attach to request
  req.apiKey = key;
  req.user = await db.users.findOne({ id: key.user_id });

  next();
}
```

---

## Network Security

### DDoS Protection

**Multi-layer defense:**

```yaml
# ddos-protection.yaml
---
layers:
  # Layer 3/4 (Network/Transport)
  - provider: AWS Shield Standard
    protection:
      - SYN flood
      - UDP flood
      - Reflection attacks
    capacity: automatic
    cost: free

  # Layer 7 (Application)
  - provider: CloudFlare
    protection:
      - HTTP flood
      - Slowloris
      - Bot attacks
    capacity: unlimited
    cost: $200/month

  # Application-level
  - provider: Kong Gateway
    protection:
      - Rate limiting (per-IP, per-user)
      - Request validation
      - Circuit breaking
    capacity: configurable
    cost: included
```

**Rate Limiting Configuration:**

```yaml
# kong-rate-limiting.yaml
---
# Global rate limit (per IP)
- name: global-rate-limit
  service: ingestion
  config:
    minute: 10000  # 10K requests per minute per IP
    hour: 500000   # 500K requests per hour per IP
    policy: redis
    redis_host: redis.databases.svc.cluster.local
    redis_port: 6379

# Authenticated user rate limit
- name: user-rate-limit
  service: api
  config:
    minute: 5000   # 5K requests per minute per user
    hour: 200000   # 200K requests per hour per user
    policy: redis
    fault_tolerant: true

# Burst protection
- name: burst-protection
  service: ingestion
  config:
    second: 1000   # Max 1000 req/sec burst
    policy: local
```

### Web Application Firewall (WAF)

```yaml
# aws-waf-rules.yaml
---
WebACL:
  Name: attribution-platform-waf
  Scope: REGIONAL
  DefaultAction:
    Allow: {}

  Rules:
    # AWS Managed Rules - Core Rule Set
    - Name: AWSManagedRulesCommonRuleSet
      Priority: 1
      Statement:
        ManagedRuleGroupStatement:
          VendorName: AWS
          Name: AWSManagedRulesCommonRuleSet
      OverrideAction:
        None: {}

    # SQL Injection protection
    - Name: AWSManagedRulesSQLiRuleSet
      Priority: 2
      Statement:
        ManagedRuleGroupStatement:
          VendorName: AWS
          Name: AWSManagedRulesSQLiRuleSet

    # XSS protection
    - Name: AWSManagedRulesKnownBadInputsRuleSet
      Priority: 3
      Statement:
        ManagedRuleGroupStatement:
          VendorName: AWS
          Name: AWSManagedRulesKnownBadInputsRuleSet

    # Rate-based rule (10K req/5min per IP)
    - Name: RateLimitRule
      Priority: 4
      Statement:
        RateBasedStatement:
          Limit: 10000
          AggregateKeyType: IP
      Action:
        Block:
          CustomResponse:
            ResponseCode: 429

    # Geo-blocking (if needed)
    - Name: GeoBlockRule
      Priority: 5
      Statement:
        GeoMatchStatement:
          CountryCodes:
            - CN  # Block China (example)
            - RU  # Block Russia (example)
      Action:
        Block: {}

    # IP reputation list
    - Name: AWSManagedRulesAmazonIpReputationList
      Priority: 6
      Statement:
        ManagedRuleGroupStatement:
          VendorName: AWS
          Name: AWSManagedRulesAmazonIpReputationList
```

### Network Policies (Kubernetes)

```yaml
# network-policies.yaml
---
# Deny all traffic by default
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: ingestion
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress

---
# Allow ingestion service to receive from Kong Gateway
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-kong-to-ingestion
  namespace: ingestion
spec:
  podSelector:
    matchLabels:
      app: ingestion
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: kong
        - podSelector:
            matchLabels:
              app: kong
      ports:
        - protocol: TCP
          port: 8080

---
# Allow ingestion service egress to Kafka
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingestion-to-kafka
  namespace: ingestion
spec:
  podSelector:
    matchLabels:
      app: ingestion
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: databases
        - podSelector:
            matchLabels:
              app: kafka
      ports:
        - protocol: TCP
          port: 9092

    # Allow DNS
    - to:
        - namespaceSelector:
            matchLabels:
              name: kube-system
        - podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

---

## Application Security

### OWASP Top 10 Protection

| Vulnerability | Mitigation |
|---------------|------------|
| **A01: Broken Access Control** | RBAC, JWT validation, authorization middleware |
| **A02: Cryptographic Failures** | TLS 1.3, AES-256, KMS, Vault |
| **A03: Injection** | Parameterized queries, input validation, WAF |
| **A04: Insecure Design** | Threat modeling, security reviews, defense in depth |
| **A05: Security Misconfiguration** | IaC (Terraform), automated scans, principle of least privilege |
| **A06: Vulnerable Components** | Snyk, Dependabot, automated updates |
| **A07: Identification & Auth Failures** | MFA, password policies, session management |
| **A08: Software & Data Integrity** | Code signing, SBOMs, immutable deployments |
| **A09: Logging & Monitoring Failures** | Centralized logging (Loki), SIEM, alerts |
| **A10: Server-Side Request Forgery** | Input validation, allowlists, network segmentation |

### Input Validation

```typescript
// validation.ts
import { z } from 'zod';

// Event ingestion validation
const EventSchema = z.object({
  event_type: z.enum(['click', 'impression', 'install', 'conversion']),
  timestamp: z.number().int().positive(),
  device_id: z.string().regex(/^[a-zA-Z0-9-]{36}$/),  // UUID format
  campaign_id: z.string().max(100),
  user_agent: z.string().max(1000),
  ip: z.string().ip(),

  // Optional fields
  referrer: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional()
});

// API validation middleware
function validateRequest(schema: z.ZodSchema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

// Usage
app.post('/v1/events',
  validateRequest(EventSchema),
  async (req, res) => {
    // Process validated event
  }
);
```

### SQL Injection Prevention

```go
// attribution.go
package attribution

import (
    "database/sql"
)

// WRONG - vulnerable to SQL injection
func GetCampaignVulnerable(db *sql.DB, campaignID string) (*Campaign, error) {
    query := "SELECT * FROM campaigns WHERE id = '" + campaignID + "'"
    // Attacker can inject: ' OR '1'='1
    row := db.QueryRow(query)
    // ...
}

// CORRECT - parameterized query
func GetCampaign(db *sql.DB, campaignID string) (*Campaign, error) {
    query := "SELECT * FROM campaigns WHERE id = $1"
    row := db.QueryRow(query, campaignID)

    var campaign Campaign
    err := row.Scan(&campaign.ID, &campaign.Name, &campaign.Status)
    if err != nil {
        return nil, err
    }

    return &campaign, nil
}
```

### XSS Prevention

```typescript
// xss-prevention.ts
import DOMPurify from 'isomorphic-dompurify';
import { escape } from 'html-escaper';

// Sanitize HTML input
function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
}

// Escape for HTML context
function escapeHTML(text: string): string {
  return escape(text);
}

// Content Security Policy headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.attribution-platform.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.attribution-platform.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '));

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});
```

### Dependency Scanning

```yaml
# .github/workflows/security-scan.yml
---
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          command: test
          args: --severity-threshold=high

  trivy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

---

## Privacy by Design

### Data Minimization

```typescript
// Only collect necessary data
interface MinimalEvent {
  // Required for attribution
  event_type: string;
  timestamp: number;
  device_id: string;      // Hashed device ID
  campaign_id: string;

  // Technical metadata (necessary)
  ip: string;             // For fraud detection, discarded after processing
  user_agent: string;     // For device detection, anonymized

  // NO PII collected:
  // ❌ No email
  // ❌ No name
  // ❌ No phone number
  // ❌ No precise location (only country)
}

// Anonymization pipeline
async function anonymizeEvent(event: RawEvent): Promise<AnonymizedEvent> {
  return {
    ...event,

    // Hash device ID (irreversible)
    device_id: await hashSHA256(event.device_id),

    // Anonymize IP (keep only country)
    ip: null,
    country: await geoIP.getCountry(event.ip),

    // Anonymize user agent (keep only device type)
    user_agent: null,
    device_type: parseUserAgent(event.user_agent).deviceType,

    // Remove any accidental PII
    metadata: sanitizeMetadata(event.metadata)
  };
}
```

### Pseudonymization

```typescript
// Pseudonymization for analytics
import * as crypto from 'crypto';

class PseudonymizationService {
  private secret: Buffer;

  constructor() {
    // Load secret from Vault
    this.secret = Buffer.from(process.env.PSEUDONYM_SECRET, 'hex');
  }

  /**
   * Create pseudonym (reversible with secret)
   */
  pseudonymize(userId: string): string {
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      this.secret,
      crypto.randomBytes(16)
    );

    const encrypted = Buffer.concat([
      cipher.update(userId, 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([encrypted, authTag]).toString('base64');
  }

  /**
   * Reverse pseudonym (requires secret)
   */
  depseudonymize(pseudonym: string): string {
    const buffer = Buffer.from(pseudonym, 'base64');
    const encrypted = buffer.slice(0, -16);
    const authTag = buffer.slice(-16);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.secret,
      crypto.randomBytes(16)
    );

    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString('utf8');
  }
}
```

### Differential Privacy (for aggregated stats)

```python
# differential_privacy.py
import numpy as np

class DifferentialPrivacy:
    """
    Add noise to aggregated statistics to protect individual privacy
    """

    def __init__(self, epsilon: float = 1.0):
        """
        epsilon: Privacy budget (lower = more private, less accurate)
        """
        self.epsilon = epsilon

    def laplace_noise(self, sensitivity: float) -> float:
        """
        Generate Laplace noise
        """
        scale = sensitivity / self.epsilon
        return np.random.laplace(0, scale)

    def add_noise_to_count(self, count: int) -> int:
        """
        Add noise to count query
        """
        sensitivity = 1  # Adding/removing one person changes count by 1
        noisy_count = count + self.laplace_noise(sensitivity)
        return max(0, int(noisy_count))  # Ensure non-negative

    def add_noise_to_sum(self, total: float, max_value: float) -> float:
        """
        Add noise to sum query
        """
        sensitivity = max_value  # Max contribution per person
        noisy_sum = total + self.laplace_noise(sensitivity)
        return noisy_sum

# Usage in analytics API
dp = DifferentialPrivacy(epsilon=1.0)

# Return noisy aggregates
def get_campaign_stats(campaign_id: str) -> dict:
    # True values
    installs = db.attributions.count({ campaign_id: campaign_id })
    revenue = db.conversions.sum({ campaign_id: campaign_id }, 'revenue')

    # Add differential privacy noise
    return {
        'installs': dp.add_noise_to_count(installs),
        'revenue': dp.add_noise_to_sum(revenue, max_value=1000)
    }
```

---

## Incident Response

### Security Incident Response Plan

```yaml
# incident-response-plan.yaml
---
phases:
  # 1. PREPARATION
  - phase: preparation
    actions:
      - Maintain incident response team (security@attribution-platform.com)
      - Keep runbooks updated
      - Conduct quarterly tabletop exercises
      - Maintain backup communication channels (Slack, phone)

  # 2. DETECTION & ANALYSIS
  - phase: detection
    triggers:
      - Security alert from monitoring system
      - User report of suspicious activity
      - Third-party vulnerability disclosure
      - Compliance audit finding
    actions:
      - Triage severity (P0 Critical, P1 High, P2 Medium, P3 Low)
      - Gather initial evidence
      - Create incident ticket
      - Notify incident response team

  # 3. CONTAINMENT
  - phase: containment
    short_term:
      - Isolate affected systems
      - Block malicious IPs/users
      - Rotate compromised credentials
      - Enable enhanced monitoring
    long_term:
      - Patch vulnerabilities
      - Update firewall rules
      - Rebuild compromised systems

  # 4. ERADICATION
  - phase: eradication
    actions:
      - Remove malware/backdoors
      - Close attack vectors
      - Strengthen security controls
      - Verify no persistence mechanisms

  # 5. RECOVERY
  - phase: recovery
    actions:
      - Restore from clean backups
      - Verify system integrity
      - Resume normal operations
      - Monitor for recurrence

  # 6. POST-INCIDENT
  - phase: post_incident
    actions:
      - Write incident report
      - Conduct lessons learned meeting
      - Update security controls
      - Train team on findings
      - Notify affected parties (if required)
```

### Incident Classification

| Severity | Description | Response Time | Escalation |
|----------|-------------|---------------|------------|
| **P0 - Critical** | Data breach, ransomware, complete service outage | Immediate | CEO, CISO, Legal |
| **P1 - High** | Unauthorized access, data exposure, DDoS | <1 hour | CTO, Security Team |
| **P2 - Medium** | Vulnerability exploit, failed auth attempts | <4 hours | Security Team |
| **P3 - Low** | Policy violation, suspicious activity | <24 hours | Security Team |

### Incident Response Runbook

```bash
#!/bin/bash
# incident-response.sh

# P0: Data Breach Response
function respond_to_data_breach() {
  echo "=== DATA BREACH RESPONSE ==="

  # 1. CONTAINMENT
  echo "Step 1: Containment"

  # Rotate all API keys
  kubectl exec -n api deploy/api-service -- \
    node scripts/rotate-all-api-keys.js

  # Rotate database passwords
  vault kv put attribution/database/clickhouse \
    password=$(openssl rand -base64 32)

  # Block suspicious IPs
  kubectl apply -f incident-response/block-ips.yaml

  # 2. EVIDENCE COLLECTION
  echo "Step 2: Evidence Collection"

  # Export audit logs
  kubectl logs -n api deploy/api-service --since=24h > audit-logs.txt

  # Capture network traffic
  tcpdump -i any -w capture.pcap &

  # 3. NOTIFICATION
  echo "Step 3: Notification"

  # Send critical alert
  curl -X POST https://hooks.slack.com/services/... \
    -d '{"text":"🚨 SECURITY INCIDENT: Data breach detected"}'

  # Email incident response team
  aws ses send-email \
    --from security@attribution-platform.com \
    --to incident-response@attribution-platform.com \
    --subject "[P0] Data Breach Detected" \
    --text "See runbook for details"

  # 4. GDPR NOTIFICATION (if EU users affected)
  echo "Step 4: GDPR Notification (72h window)"

  # Create incident report
  cat > gdpr-breach-report.md <<EOF
# Data Breach Notification

**Date of breach**: $(date)
**Nature of breach**: [TBD]
**Categories of data affected**: [TBD]
**Approximate number of data subjects**: [TBD]
**Likely consequences**: [TBD]
**Measures taken**: [TBD]

**Data Protection Officer**: dpo@attribution-platform.com
EOF

  echo "✅ Incident response initiated"
}
```

---

## Security Auditing

### Audit Logging

```typescript
// audit-log.ts
interface AuditLog {
  timestamp: Date;
  event_type: string;
  user_id?: string;
  ip_address: string;
  user_agent: string;
  resource_type: string;
  resource_id: string;
  action: string;
  result: 'success' | 'failure';
  details?: Record<string, unknown>;
}

class AuditLogger {
  async log(event: AuditLog): Promise<void> {
    // Write to immutable audit log
    await db.audit_logs.insertOne({
      ...event,
      timestamp: new Date(),
      log_id: crypto.randomUUID()
    });

    // Also send to SIEM
    await siem.send(event);
  }
}

// Audit middleware
function auditMiddleware(req, res, next) {
  const startTime = Date.now();

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    // Log after response
    auditLogger.log({
      timestamp: new Date(),
      event_type: 'api_request',
      user_id: req.user?.id,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      resource_type: req.path.split('/')[2],
      resource_id: req.params.id,
      action: req.method,
      result: res.statusCode < 400 ? 'success' : 'failure',
      details: {
        path: req.path,
        status_code: res.statusCode,
        duration_ms: Date.now() - startTime
      }
    });

    return originalSend.call(this, data);
  };

  next();
}
```

### Penetration Testing

```yaml
# penetration-testing-schedule.yaml
---
schedule:
  # External penetration test (annual)
  - type: external
    frequency: annual
    scope:
      - Public APIs
      - Web application
      - Network perimeter
    provider: third_party_security_firm
    cost: $25K

  # Internal penetration test (annual)
  - type: internal
    frequency: annual
    scope:
      - Kubernetes cluster
      - Database access
      - Service-to-service communication
    provider: third_party_security_firm
    cost: $20K

  # Bug bounty program (continuous)
  - type: bug_bounty
    frequency: continuous
    platform: HackerOne
    scope:
      - api.attribution-platform.com
      - app.attribution-platform.com
    rewards:
      critical: $5000
      high: $2000
      medium: $500
      low: $100
    cost: $50K/year
```

### Security Certifications

**Roadmap:**

| Certification | Timeline | Cost | Status |
|---------------|----------|------|--------|
| **SOC 2 Type II** | Year 1 | $50K | 🔄 In Progress |
| **ISO 27001** | Year 2 | $75K | 📋 Planned |
| **HIPAA** (if needed) | Year 2 | $40K | 📋 Planned |
| **PCI DSS** (if payment data) | Year 2 | $60K | 📋 Planned |

---

## Summary

### Security Posture

**Comprehensive Protection:**
- ✅ GDPR & CCPA compliant
- ✅ Zero-trust architecture
- ✅ AES-256 encryption at rest
- ✅ TLS 1.3 encryption in transit
- ✅ MFA for all users
- ✅ RBAC with least privilege
- ✅ WAF + DDoS protection
- ✅ Vulnerability scanning (Snyk, Trivy)
- ✅ Audit logging (immutable)
- ✅ Incident response plan
- ✅ Penetration testing (annual)
- ✅ Bug bounty program

**Privacy by Design:**
- Data minimization (no unnecessary PII)
- Pseudonymization for analytics
- Differential privacy for aggregates
- 90-day retention for tracking data
- User rights API (export, delete, restrict)
- Automated retention enforcement

**Compliance Ready:**
- SOC 2 Type II (in progress)
- ISO 27001 (planned Year 2)
- Continuous compliance monitoring (Vanta/Drata)
- Regular security audits

**Enterprise-grade security that builds trust with customers.**

🔒
