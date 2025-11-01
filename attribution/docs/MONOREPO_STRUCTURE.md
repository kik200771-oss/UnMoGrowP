# Monorepo Structure (Post-Audit Reorganization)

## 🏗️ Recommended Structure According to Security Audit

Based on the technical audit findings, the repository should be reorganized as follows:

```
/
├── apps/                          # User-facing applications
│   ├── console/                   # Admin console (SvelteKit 5)
│   │   ├── src/
│   │   ├── package.json
│   │   └── svelte.config.js
│   ├── docs/                      # Documentation site
│   │   ├── src/
│   │   └── package.json
│   └── landing/                   # Marketing website
│
├── services/                      # Backend microservices
│   ├── ingest-gateway/            # High-throughput event ingestion
│   │   ├── cmd/
│   │   ├── internal/
│   │   ├── go.mod
│   │   └── Dockerfile
│   ├── attribution-processor/     # Core attribution logic
│   │   ├── cmd/
│   │   ├── internal/
│   │   └── go.mod
│   ├── public-api/               # Public REST/GraphQL API
│   │   ├── cmd/
│   │   ├── internal/
│   │   └── go.mod
│   ├── anti-fraud/               # Fraud detection service
│   │   ├── cmd/
│   │   ├── models/
│   │   └── go.mod
│   └── webhook-service/          # Outbound webhooks
│
├── packages/                     # Shared libraries
│   ├── shared-proto/             # Protocol Buffers definitions
│   │   ├── attribution/
│   │   ├── events/
│   │   └── buf.gen.yaml
│   ├── sdk-js/                   # JavaScript SDK
│   │   ├── src/
│   │   └── package.json
│   ├── sdk-ios/                  # iOS SDK (Swift)
│   │   ├── Sources/
│   │   └── Package.swift
│   ├── sdk-android/              # Android SDK (Kotlin)
│   │   ├── src/
│   │   └── build.gradle
│   └── shared-config/            # Shared configuration
│
├── infra/                        # Infrastructure as Code
│   ├── terraform/                # Infrastructure provisioning
│   │   ├── environments/
│   │   ├── modules/
│   │   └── main.tf
│   ├── kubernetes/               # K8s manifests
│   │   ├── base/
│   │   ├── overlays/
│   │   └── helm/
│   ├── monitoring/               # Observability stack
│   │   ├── prometheus/
│   │   ├── grafana/
│   │   ├── opentelemetry/
│   │   └── loki/
│   └── scripts/                  # Deployment scripts
│
├── .github/                      # GitHub configuration
│   ├── workflows/                # CI/CD pipelines
│   │   ├── security.yml
│   │   ├── backend.yml
│   │   ├── frontend.yml
│   │   └── deploy.yml
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
│
├── security/                     # Security documentation
│   ├── threat-model/             # STRIDE/DFD models
│   ├── rbac-policies/           # Access control policies
│   ├── compliance/              # GDPR/CCPA/etc documentation
│   └── audit-reports/           # Security audit results
│
├── docs/                        # Technical documentation
│   ├── architecture/            # System design
│   ├── api/                     # API documentation
│   ├── deployment/              # Deployment guides
│   └── development/             # Developer guides
│
├── tools/                       # Development tools
│   ├── scripts/                 # Build/development scripts
│   ├── generators/              # Code generators
│   └── linters/                 # Custom linting rules
│
├── tests/                       # Integration/E2E tests
│   ├── e2e/                     # End-to-end tests
│   ├── integration/             # Integration tests
│   ├── performance/             # Load/performance tests
│   └── contracts/               # Contract tests
│
├── SECURITY.md                  # Security policy
├── CONTRIBUTING.md             # Contribution guidelines
├── CODE_OF_CONDUCT.md          # Code of conduct
├── LICENSE                     # License
├── README.md                   # Main documentation
├── .gitignore                  # Git ignore rules
├── .editorconfig              # Editor configuration
├── renovate.json              # Dependency updates
└── workspace.json             # Workspace configuration
```

## 🔄 Migration Plan

### Phase 1: Security Cleanup (Week 1)
- [ ] Remove sensitive files from git history
- [ ] Update .gitignore with security rules
- [ ] Create SECURITY.md
- [ ] Enable GitHub Security features

### Phase 2: Structure Migration (Week 2)
- [ ] Create new directory structure
- [ ] Move existing code to appropriate locations
- [ ] Update import paths
- [ ] Update build configurations

### Phase 3: Infrastructure Setup (Week 3)
- [ ] Set up CI/CD workflows
- [ ] Configure monitoring stack
- [ ] Implement proper dependency management
- [ ] Set up development environment

## 🎯 Current vs Target State

### Current State (attribution/ directory)
```
attribution/
├── frontend/          # Svelte 5 app
├── api/              # Bun + Hono API
├── backend/          # Go ingestion service
├── database/         # SQL schemas
└── docs/             # Documentation
```

### Target State (Root level)
```
/
├── apps/console/     # Frontend (from attribution/frontend)
├── services/         # Backend services (from attribution/api + backend)
├── packages/         # Shared libraries
├── infra/           # Infrastructure
└── security/        # Security documentation
```

## 📋 Benefits of Reorganization

1. **Clear Separation**: Apps, services, packages clearly separated
2. **Scalability**: Easy to add new services/apps
3. **Security**: Dedicated security directory structure
4. **DevOps**: Proper CI/CD and infrastructure organization
5. **Team Structure**: Aligns with recommended team roles from audit
6. **Compliance**: Easier to maintain compliance documentation

## 🛠️ Implementation Steps

1. **Create new structure** (preserve git history)
2. **Update all import paths** in code
3. **Update build configurations** (package.json, go.mod, etc.)
4. **Migrate CI/CD workflows**
5. **Update documentation**
6. **Test all services** after migration

---

**Status**: Planning Phase
**Timeline**: 2-3 weeks implementation
**Priority**: High (post-security cleanup)