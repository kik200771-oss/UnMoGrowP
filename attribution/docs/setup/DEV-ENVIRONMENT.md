# Development Environment Guide
## UnMoGrowP - Complete Setup & Infrastructure

Полное руководство по окружению разработки, инструментам, расширениям и инфраструктуре проекта.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Development Tools](#development-tools)
4. [VS Code Extensions](#vs-code-extensions)
5. [Local Infrastructure](#local-infrastructure)
6. [Project Structure](#project-structure)
7. [AI Agents Team](#ai-agents-team)
8. [Workflows](#workflows)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**UnMoGrowP** (Unified Mobile Growth Platform) - это комплексная платформа для мобильного роста, включающая:

- 📊 Attribution Engine (определение источников установок)
- 📈 Analytics Dashboard (real-time аналитика)
- 🎯 Campaign Management (управление кампаниями)
- 🔔 Push Notifications (умные уведомления)
- 🤖 ML/AI Models (LTV prediction, fraud detection, churn prediction)
- 💰 Monetization Tools (in-app purchases, subscriptions)
- 🔗 Ad Networks Integration (Facebook, Google, TikTok, Unity)

**Масштаб:**
- 100B+ events/day
- <100ms query latency (p99)
- 10M req/sec event ingestion
- 99.99% uptime SLA

---

## 🛠️ Tech Stack

### Frontend
```yaml
Framework: Next.js 15 (App Router) + React 19
Build Tool: Turbopack
Styling: Tailwind CSS 4
State: React Hooks
Testing: Jest, Playwright
Language: TypeScript
Dependencies:
  - React 19.1.0
  - Next.js 15.5.6
  - @anthropic-ai/sdk (UI/UX Agent)
```

### Backend
```yaml
Event Ingestion: Go 1.21+ (Fiber framework)
Attribution Engine: Rust (high performance)
API Layer: Bun + Hono (3x faster than Node)
Message Queue: Kafka
Cache: Redis
Databases:
  - ClickHouse (OLAP - analytics)
  - PostgreSQL (OLTP - operational)
```

### ML/AI
```yaml
Language: Python 3.11+
Frameworks: PyTorch, LightGBM, XGBoost
API: FastAPI
Feature Store: ClickHouse
Inference: <50ms latency
Models:
  - LTV Prediction (90-day, 180-day)
  - Fraud Detection (95% accuracy)
  - Churn Prediction (85% accuracy)

AI Agents:
  - UI/UX Agent (Claude 3.5 Sonnet)
    - SDK: @anthropic-ai/sdk
    - Purpose: Interface analysis, accessibility, recommendations
    - Location: lib/agents/ui-ux/
```

### DevOps
```yaml
Containers: Docker, Kubernetes
IaC: Terraform
CI/CD: GitHub Actions, ArgoCD
Monitoring: Prometheus + Grafana
Logging: ELK Stack
Tracing: OpenTelemetry + Jaeger
```

---

## 💻 Development Tools

### Required Software

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Git** | 2.51.1+ | Version control | `choco install git` |
| **Node.js** | 22.20.0 LTS | Frontend runtime | `choco install nodejs-lts` |
| **Go** | 1.25.3+ | Backend services | `choco install golang` |
| **Python** | 3.14.0+ | ML/Data science | `choco install python` |
| **Bun** | 1.3.0+ | API runtime | `irm bun.sh/install.ps1 \| iex` |
| **Docker Desktop** | Latest | Containers | `choco install docker-desktop` |
| **VS Code** | Latest | IDE | `choco install vscode` |

### Optional Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| **Rust** | Attribution Engine | `choco install rust` |
| **kubectl** | Kubernetes CLI | `choco install kubernetes-cli` |
| **Terraform** | Infrastructure as Code | `choco install terraform` |
| **Postman** | API testing | `choco install postman` |

### Installation Scripts

```powershell
# Install VS Code extensions (31 extensions)
.\install-vscode-extensions.ps1

# Install development services
.\install-services.ps1

# Install Go and Docker (requires admin)
.\install-go-docker.ps1
```

---

## 🔌 VS Code Extensions

### Complete List (31 Extensions)

#### Frontend Development (4)
- **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`)
  - React/Svelte code snippets
- **ESLint** (`dbaeumer.vscode-eslint`)
  - JavaScript/TypeScript linting
- **Prettier** (`esbenp.prettier-vscode`)
  - Code formatting
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
  - Tailwind autocomplete & preview

#### Backend Development (2)
- **Go** (`golang.go`)
  - Official Go language support
- **Go Test Explorer** (`premparihar.gotestexplorer`)
  - Visual test runner for Go

#### Database & Query Tools (2)
- **SQLTools** (`mtxr.sqltools`)
  - SQL client for PostgreSQL, ClickHouse
- **Redis Client** (`cweijan.vscode-redis-client`)
  - Redis GUI client

#### DevOps & Containers (4)
- **Docker** (`ms-azuretools.vscode-docker`)
  - Docker container management
- **Kubernetes** (`ms-kubernetes-tools.vscode-kubernetes-tools`)
  - K8s cluster management
- **YAML** (`redhat.vscode-yaml`)
  - YAML syntax & validation
- **Terraform** (`hashicorp.terraform`)
  - Infrastructure as Code

#### Git & Version Control (2)
- **GitLens** (`eamodio.gitlens`)
  - Git blame, history, search
- **Git Graph** (`mhutchie.git-graph`)
  - Visual git history

#### AI/ML (3)
- **Jupyter** (`ms-toolsai.jupyter`)
  - Jupyter notebooks support
- **Python** (`ms-python.python`)
  - Python language support
- **Pylance** (`ms-python.vscode-pylance`)
  - Python type checking

#### Productivity (4)
- **Path Intellisense** (`christian-kohler.path-intellisense`)
  - File path autocomplete
- **Auto Rename Tag** (`formulahendry.auto-rename-tag`)
  - HTML/JSX tag renaming
- **Error Lens** (`usernamehw.errorlens`)
  - Inline error highlights
- **Todo Tree** (`gruntfuggly.todo-tree`)
  - TODO/FIXME finder

#### Code Quality (3)
- **SonarLint** (`sonarsource.sonarlint-vscode`)
  - Code quality & security
- **Better Comments** (`aaron-bond.better-comments`)
  - Colorful comments
- **Code Spell Checker** (`streetsidesoftware.code-spell-checker`)
  - Spell checking

#### Markdown & Documentation (3)
- **Markdown All in One** (`yzhang.markdown-all-in-one`)
  - Markdown editing
- **Markdown Preview Enhanced** (`shd101wyy.markdown-preview-enhanced`)
  - Enhanced preview
- **Markdown Preview Mermaid** (`bierner.markdown-mermaid`)
  - Mermaid diagrams

#### API Testing (2)
- **REST Client** (`humao.rest-client`)
  - HTTP requests in .http files
- **Thunder Client** (`rangav.vscode-thunder-client`)
  - Lightweight API client

#### Theme & UI (2)
- **Material Icon Theme** (`pkief.material-icon-theme`)
  - File/folder icons
- **One Dark Pro** (`zhuangtongfa.material-theme`)
  - Dark theme

### Recommended VS Code Settings

Create `.vscode/settings.json`:

```json
{
  // Editor
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.tabSize": 2,
  "editor.rulers": [80, 120],
  "editor.wordWrap": "on",

  // Files
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/__pycache__": true
  },

  // Language-specific
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[svelte]": {
    "editor.defaultFormatter": "svelte.svelte-vscode"
  },
  "[go]": {
    "editor.defaultFormatter": "golang.go",
    "editor.formatOnSave": true
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.python",
    "editor.formatOnSave": true
  },
  "[markdown]": {
    "editor.wordWrap": "on"
  },

  // Go
  "go.useLanguageServer": true,
  "go.lintOnSave": "package",
  "go.formatTool": "goimports",
  "go.testFlags": ["-v"],

  // Python
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black",

  // ESLint
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "svelte"
  ],

  // Prettier
  "prettier.singleQuote": true,
  "prettier.semi": true,
  "prettier.trailingComma": "es5",
  "prettier.printWidth": 100,

  // Git
  "git.autofetch": true,
  "git.confirmSync": false,
  "gitlens.hovers.currentLine.over": "line",

  // Terminal
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.fontSize": 14,

  // Error Lens
  "errorLens.enabled": true,
  "errorLens.fontSize": "12px",

  // Todo Tree
  "todo-tree.general.tags": [
    "TODO",
    "FIXME",
    "BUG",
    "HACK",
    "NOTE"
  ]
}
```

---

## 🐳 Local Infrastructure

### Docker Services Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                  (unmogrowp-network)                     │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │  ClickHouse  │    │  PostgreSQL  │    │   Redis   │ │
│  │  :8123,:9000 │    │    :5432     │    │   :6379   │ │
│  │   OLAP DB    │    │   OLTP DB    │    │   Cache   │ │
│  └──────────────┘    └──────────────┘    └───────────┘ │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │  Zookeeper   │    │    Kafka     │    │ Kafka UI  │ │
│  │    :2181     │◄───│    :9092     │◄───│   :8080   │ │
│  │ Coordination │    │   Streaming  │    │  Web UI   │ │
│  └──────────────┘    └──────────────┘    └───────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Service Details

#### ClickHouse (OLAP Database)
```yaml
Purpose: Analytics queries, event storage
Image: clickhouse/clickhouse-server:latest
Ports:
  - 8123: HTTP interface
  - 9000: Native TCP interface
Credentials:
  - User: unmogrowp
  - Password: dev_password_123
  - Database: analytics
Volume: clickhouse_data, clickhouse_logs
Performance:
  - Query latency: <100ms p99
  - Compression: 10:1 ratio
  - Queries: Supports 10K+ concurrent queries
```

**Connection Examples:**
```bash
# HTTP
curl "http://localhost:8123/?query=SELECT 1"

# clickhouse-client
docker-compose exec clickhouse clickhouse-client -u unmogrowp --password dev_password_123

# Connection string
clickhouse://unmogrowp:dev_password_123@localhost:9000/analytics
```

#### PostgreSQL (OLTP Database)
```yaml
Purpose: Users, campaigns, operational data
Image: postgres:16-alpine
Port: 5432
Credentials:
  - User: unmogrowp
  - Password: dev_password_123
  - Database: unmogrowp
Volume: postgres_data
Features:
  - ACID compliance
  - Row-level security
  - Prepared statements
```

**Connection Examples:**
```bash
# psql
docker-compose exec postgres psql -U unmogrowp

# Connection string
postgresql://unmogrowp:dev_password_123@localhost:5432/unmogrowp

# Node.js
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://unmogrowp:dev_password_123@localhost:5432/unmogrowp'
});
```

#### Redis (Cache)
```yaml
Purpose: Cache, sessions, rate limiting
Image: redis:7-alpine
Port: 6379
Password: dev_password_123
Volume: redis_data
Features:
  - AOF persistence
  - LRU eviction
  - PubSub support
```

**Connection Examples:**
```bash
# redis-cli
docker-compose exec redis redis-cli -a dev_password_123

# Test
redis-cli -h localhost -p 6379 -a dev_password_123 ping

# Node.js
const redis = require('redis');
const client = redis.createClient({
  url: 'redis://:dev_password_123@localhost:6379'
});
```

#### Kafka (Event Streaming)
```yaml
Purpose: Event ingestion, async processing
Image: confluentinc/cp-kafka:7.5.0
Ports:
  - 9092: Client connections
  - 9093: Internal
Bootstrap Server: localhost:9092
Topics:
  - raw_events: Incoming events
  - attributed_events: Post-attribution
  - analytics_events: For analytics
Volume: kafka_data
```

**Connection Examples:**
```bash
# Create topic
docker-compose exec kafka kafka-topics --create \
  --topic events \
  --bootstrap-server localhost:9092 \
  --partitions 10 \
  --replication-factor 1

# List topics
docker-compose exec kafka kafka-topics --list \
  --bootstrap-server localhost:9092

# Produce message
docker-compose exec kafka kafka-console-producer \
  --topic events \
  --bootstrap-server localhost:9092

# Consume messages
docker-compose exec kafka kafka-console-consumer \
  --topic events \
  --from-beginning \
  --bootstrap-server localhost:9092
```

#### Kafka UI (Web Interface)
```yaml
Purpose: Kafka management & monitoring
Image: provectuslabs/kafka-ui:latest
Port: 8080
URL: http://localhost:8080
Features:
  - Browse topics
  - View messages
  - Consumer groups
  - Cluster metrics
```

### Docker Compose Commands

```powershell
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres

# Stop all services
docker-compose down

# Stop and remove volumes (DELETE DATA!)
docker-compose down -v

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f clickhouse

# Check service status
docker-compose ps

# Restart service
docker-compose restart redis

# Execute command in container
docker-compose exec postgres psql -U unmogrowp

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

### Health Checks

All services include health checks:

```yaml
clickhouse:
  healthcheck:
    test: ["CMD", "clickhouse-client", "--query", "SELECT 1"]
    interval: 10s
    timeout: 5s
    retries: 5

postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U unmogrowp"]
    interval: 10s
    timeout: 5s
    retries: 5

redis:
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
```

Check health:
```powershell
docker-compose ps
# Look for "healthy" in STATUS column
```

---

## 📁 Project Structure

```
C:\КОДИНГ\attribution\
│
├── .claude/                           # AI Agents Configuration
│   └── commands/
│       ├── orchestrator.md            # 🎯 Team Orchestrator (coordinator)
│       ├── pm.md                      # 📋 Product Manager
│       ├── ux.md                      # 🎨 UX/UI Designer
│       ├── techlead.md                # 🏗️ Tech Lead / Architect
│       ├── backend-go.md              # 🔧 Backend Developer (Go)
│       ├── frontend.md                # 💻 Frontend Developer (Svelte 5)
│       ├── ml.md                      # 🤖 ML/Data Engineer
│       ├── qa.md                      # 🧪 QA/Testing Engineer
│       ├── devops.md                  # 🚀 DevOps Engineer
│       ├── security.md                # 🔒 Security Engineer
│       ├── docs.md                    # 📝 Technical Writer
│       └── README.md                  # Agents documentation
│
├── .vscode/                           # VS Code Configuration
│   ├── settings.json                  # Workspace settings
│   ├── extensions.json                # Recommended extensions
│   └── launch.json                    # Debug configurations
│
├── DOCUMENTS/                         # Project Documentation (350+ pages)
│   ├── 00_Executive_Overview.md
│   ├── 01_Technical_Architecture.md
│   ├── 02_API_Documentation.md
│   ├── 03_Database_Schema.md
│   ├── 04_ML_Models.md
│   └── ...
│
├── frontend/                          # Svelte 5 Dashboard
│   ├── src/
│   │   ├── routes/                    # SvelteKit routes
│   │   ├── lib/
│   │   │   ├── components/            # Reusable components
│   │   │   ├── stores/                # State management
│   │   │   ├── api/                   # API client
│   │   │   └── utils/                 # Utilities
│   │   └── app.html
│   ├── static/                        # Static assets
│   ├── tests/                         # Vitest + Playwright tests
│   ├── package.json
│   ├── vite.config.js
│   ├── svelte.config.js
│   └── tailwind.config.js
│
├── backend/                           # Go Backend Services
│   ├── cmd/
│   │   ├── api/                       # API server
│   │   ├── ingestion/                 # Event ingestion
│   │   └── worker/                    # Background workers
│   ├── internal/
│   │   ├── handlers/                  # HTTP handlers
│   │   ├── services/                  # Business logic
│   │   ├── repositories/              # Data access
│   │   ├── models/                    # Data models
│   │   └── middleware/                # Middleware
│   ├── pkg/                           # Shared packages
│   │   ├── clickhouse/                # ClickHouse client
│   │   ├── kafka/                     # Kafka client
│   │   └── redis/                     # Redis client
│   ├── tests/                         # Unit & integration tests
│   ├── go.mod
│   └── go.sum
│
├── attribution-engine/                # Rust Attribution Engine
│   ├── src/
│   │   ├── main.rs
│   │   ├── attribution/               # Attribution logic
│   │   ├── fraud/                     # Fraud detection
│   │   └── models/
│   ├── tests/
│   ├── Cargo.toml
│   └── Cargo.lock
│
├── ml/                                # Python ML Services
│   ├── models/
│   │   ├── ltv_prediction/            # LTV model
│   │   ├── fraud_detection/           # Fraud model
│   │   └── churn_prediction/          # Churn model
│   ├── pipelines/
│   │   ├── feature_engineering/
│   │   └── data_processing/
│   ├── api/                           # FastAPI endpoints
│   ├── notebooks/                     # Jupyter notebooks
│   ├── tests/
│   ├── requirements.txt
│   └── pyproject.toml
│
├── infrastructure/                    # Infrastructure as Code
│   ├── terraform/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   └── modules/
│   ├── kubernetes/
│   │   ├── base/                      # Base K8s manifests
│   │   └── overlays/                  # Kustomize overlays
│   └── helm/                          # Helm charts
│
├── .github/                           # GitHub Configuration
│   └── workflows/
│       ├── ci.yml                     # CI pipeline
│       ├── cd.yml                     # CD pipeline
│       └── tests.yml                  # Test automation
│
├── scripts/                           # Utility scripts
│   ├── seed-data.sh                   # Seed test data
│   ├── migrate.sh                     # Run migrations
│   └── backup.sh                      # Backup script
│
├── docker-compose.yml                 # Local dev services
├── Dockerfile                         # Production image
├── .dockerignore
├── .gitignore
├── .env.example                       # Environment template
├── package.json                       # Root package.json
├── README.md                          # Project README
├── SETUP.md                           # Setup instructions
├── DEV-ENVIRONMENT.md                 # This file
├── install-vscode-extensions.ps1      # Extensions installer
├── install-services.ps1               # Services installer
└── install-go-docker.ps1              # Go + Docker installer
```

---

## 🤖 AI Agents Team

### Available Agents (11 total)

#### Coordination
- **`/orchestrator`** - Team coordinator, delegates work to specialists

#### Planning & Design
- **`/pm`** - Product Manager (user stories, roadmap)
- **`/ux`** - UX/UI Designer (wireframes, design system)
- **`/techlead`** - Tech Lead (architecture, database design)

#### Development
- **`/backend-go`** - Backend Developer (Go APIs, services)
- **`/frontend`** - Frontend Developer (Svelte 5 UI)
- **`/ml`** - ML Engineer (models, pipelines)

#### Quality & Operations
- **`/qa`** - QA Engineer (tests, quality assurance)
- **`/devops`** - DevOps Engineer (CI/CD, infrastructure)
- **`/security`** - Security Engineer (audits, compliance)

#### Documentation
- **`/docs`** - Technical Writer (documentation)

#### AI Services
- **UI/UX Agent** - AI-ассистент для анализа интерфейса (Anthropic Claude)
  - Анализ компонентов (accessibility, usability, visual design)
  - Генерация рекомендаций по улучшению UX
  - Проверка WCAG 2.1 compliance
  - API: `/api/ui-ux/*`

### How Agents Use Infrastructure

#### Example 1: Backend Agent with Services
```
User: /backend-go create health check endpoint

Agent creates:
```go
package handlers

import (
    "github.com/gofiber/fiber/v2"
    "unmogrowp/pkg/clickhouse"
    "unmogrowp/pkg/redis"
    "database/sql"
)

func HealthCheck(c *fiber.Ctx) error {
    health := map[string]string{
        "status": "healthy",
        "clickhouse": checkClickHouse(),
        "postgres": checkPostgres(),
        "redis": checkRedis(),
        "kafka": checkKafka(),
    }
    return c.JSON(health)
}

func checkClickHouse() string {
    conn := clickhouse.Connect("localhost:9000")
    if err := conn.Ping(); err != nil {
        return "unhealthy"
    }
    return "healthy"
}
// ... similar for other services
```

#### Example 2: QA Agent with Integration Tests
```
User: /qa write integration tests for event pipeline

Agent creates:
```go
func TestEventPipeline(t *testing.T) {
    // 1. Produce to Kafka
    producer := kafka.NewProducer("localhost:9092")
    producer.Produce("raw_events", testEvent)

    // 2. Wait for processing
    time.Sleep(2 * time.Second)

    // 3. Verify in ClickHouse
    conn := clickhouse.Connect("localhost:9000")
    rows := conn.Query("SELECT * FROM events WHERE event_id = ?", testEvent.ID)
    assert.NotEmpty(t, rows)

    // 4. Check Redis cache
    rdb := redis.Connect("localhost:6379")
    cached := rdb.Get("event:" + testEvent.ID)
    assert.NotNil(t, cached)
}
```

#### Example 3: ML Agent with ClickHouse
```
User: /ml train LTV prediction model

Agent creates:
```python
from clickhouse_driver import Client

# Connect to ClickHouse
client = Client('localhost', user='unmogrowp', password='dev_password_123')

# Load training data
query = """
SELECT
    user_id,
    install_date,
    revenue_90d,
    events_count,
    sessions_count
FROM analytics.user_features
WHERE install_date >= '2025-01-01'
"""

df = client.query_dataframe(query)

# Train model
model = LightGBM(...)
model.fit(df[features], df['revenue_90d'])
```

---

## 🔄 Workflows

### Daily Development Workflow

```
1. Start Docker services
   docker-compose up -d

2. Check services are healthy
   docker-compose ps

3. Start development servers:

   Terminal 1 (Frontend):
   cd frontend
   npm run dev
   # → http://localhost:5173

   Terminal 2 (Backend):
   cd backend
   go run cmd/api/main.go
   # → http://localhost:3000

   Terminal 3 (ML - optional):
   cd ml
   python -m uvicorn api.main:app --reload
   # → http://localhost:8000

4. Use AI agents for development:
   /backend-go create new endpoint
   /frontend create new component
   /qa write tests

5. Commit & push:
   git add .
   git commit -m "feat: ..."
   git push
```

### Feature Development Workflow

```
Option 1: Use Orchestrator (for complex features)
/orchestrator implement fraud detection system

Orchestrator will:
1. /pm → Create user stories
2. /techlead → Design architecture
3. /backend-go → Implement API
4. /frontend → Create UI
5. /ml → Add ML model
6. /qa → Write tests
7. /devops → Setup deployment
8. /security → Security review
9. /docs → Documentation

Option 2: Call agents directly (for simple tasks)
/backend-go add caching to /api/campaigns endpoint
```

### Testing Workflow

```
1. Unit tests:
   # Frontend
   cd frontend && npm run test

   # Backend
   cd backend && go test ./...

   # ML
   cd ml && pytest

2. Integration tests:
   /qa write integration tests for event ingestion

3. E2E tests:
   cd frontend && npm run test:e2e

4. Performance tests:
   /qa run performance tests with 10K req/sec
```

### Deployment Workflow

```
1. Local → Dev:
   git push origin feature/my-feature
   # GitHub Actions runs CI

2. Dev → Staging:
   git push origin develop
   # ArgoCD deploys to staging

3. Staging → Production:
   git push origin main
   # ArgoCD deploys to production
   # (after approval)
```

---

## 📖 Best Practices

### Code Style

#### TypeScript/JavaScript (Frontend)
```typescript
// Use Svelte 5 Runes
let count = $state(0);
let doubled = $derived(count * 2);

// Use TypeScript
interface Campaign {
  id: string;
  name: string;
  budget: number;
}

// Use async/await
async function fetchCampaigns(): Promise<Campaign[]> {
  const response = await fetch('/api/campaigns');
  return response.json();
}
```

#### Go (Backend)
```go
// Use context
func HandleRequest(c *fiber.Ctx) error {
    ctx := context.Background()
    // ...
}

// Use error wrapping
if err != nil {
    return fmt.Errorf("failed to query database: %w", err)
}

// Use interfaces
type CampaignRepository interface {
    Get(id string) (*Campaign, error)
    List() ([]*Campaign, error)
}
```

#### Python (ML)
```python
# Use type hints
def predict_ltv(user_id: str, features: dict) -> float:
    # ...
    return prediction

# Use dataclasses
from dataclasses import dataclass

@dataclass
class User:
    id: str
    install_date: datetime
    revenue_90d: float
```

### Git Commit Messages

Follow Conventional Commits:

```
feat: add fraud detection endpoint
fix: resolve memory leak in event processor
docs: update API documentation
test: add integration tests for campaigns
refactor: simplify attribution logic
perf: optimize ClickHouse query
chore: update dependencies
```

### Branch Naming

```
feature/fraud-detection
bugfix/memory-leak
hotfix/critical-issue
refactor/attribution-engine
docs/api-documentation
```

### Environment Variables

Never commit secrets! Use `.env` files:

```bash
# .env.example (commit this)
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=9000
CLICKHOUSE_USER=unmogrowp
CLICKHOUSE_PASSWORD=

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=unmogrowp
POSTGRES_USER=unmogrowp
POSTGRES_PASSWORD=

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# AI Services
ANTHROPIC_API_KEY=
```

```bash
# .env (DO NOT commit)
CLICKHOUSE_PASSWORD=dev_password_123
POSTGRES_PASSWORD=dev_password_123
REDIS_PASSWORD=dev_password_123
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

### Testing

```
Unit Tests:
- Test individual functions
- Mock external dependencies
- Fast (<1ms per test)

Integration Tests:
- Test service interactions
- Use real databases (Docker)
- Slower (~100ms per test)

E2E Tests:
- Test full user flows
- Use Playwright
- Slowest (~seconds per test)

Coverage Target: >80%
```

---

## 🔧 Troubleshooting

### Docker Issues

#### Services not starting
```powershell
# Check logs
docker-compose logs clickhouse

# Restart service
docker-compose restart clickhouse

# Rebuild image
docker-compose up -d --build clickhouse
```

#### Port already in use
```powershell
# Find process
netstat -ano | findstr :5432

# Kill process
taskkill /PID <PID> /F
```

#### Out of memory
```
Docker Desktop → Settings → Resources
Memory: Increase to 12 GB
Apply & Restart
```

### Go Issues

#### Module not found
```powershell
go mod download
go mod tidy
```

#### Build fails
```powershell
go clean -cache
go build ./...
```

### Node.js Issues

#### Dependencies error
```powershell
rm -rf node_modules
rm package-lock.json
npm install
```

#### Port 5173 in use
```powershell
# Change port in vite.config.js
export default {
  server: { port: 5174 }
}
```

### Python Issues

#### Package not found
```powershell
pip install -r requirements.txt
```

#### Virtual environment
```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

---

## 📚 Additional Resources

### Documentation
- [Project README](./README.md)
- [Setup Guide](./SETUP.md)
- [Installation Guide](./INSTALL-REMAINING.md)
- [AI Agents Guide](./.claude/commands/README.md)
- [Technical Docs](./DOCUMENTS/)

### External Resources
- [Svelte 5 Docs](https://svelte-5-preview.vercel.app/docs)
- [Go Documentation](https://go.dev/doc/)
- [ClickHouse Docs](https://clickhouse.com/docs)
- [Kafka Docs](https://kafka.apache.org/documentation/)
- [Docker Docs](https://docs.docker.com/)

### Community
- GitHub Issues: (your repo)
- Slack/Discord: (your community)

---

## 📊 Quick Reference

### Service URLs (Local)
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- ML API: http://localhost:8000
- ClickHouse HTTP: http://localhost:8123
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Kafka: localhost:9092
- Kafka UI: http://localhost:8080

### Credentials (Local Dev)
- User: `unmogrowp`
- Password: `dev_password_123`

### Key Commands
```powershell
# Services
docker-compose up -d
docker-compose ps
docker-compose logs -f

# Frontend
cd frontend && npm run dev

# Backend
cd backend && go run cmd/api/main.go

# Tests
npm run test
go test ./...
pytest
```

---

## 📋 Changelog

### Version 1.0 - 2025-10-20

**Initial Release:**
- ✅ Complete development environment documentation
- ✅ 31 VS Code extensions configured
- ✅ 6 Docker services (ClickHouse, PostgreSQL, Redis, Kafka, Zookeeper, Kafka UI)
- ✅ Development tools documented (Git, Node.js, Go, Python, Bun, Docker)
- ✅ Full tech stack specifications
- ✅ AI Agents integration examples
- ✅ Workflows and best practices
- ✅ Troubleshooting guide

**Note:** This documentation is automatically maintained by `/devops` agent. Changes to VS Code extensions, Docker services, development tools, or project structure will be automatically detected and documented here with reasons.

---

**Last Updated:** 2025-10-20

**Version:** 1.0

**Author:** AI Team (UnMoGrowP)

**Maintained By:** `/devops` agent (automatic updates)

---

🚀 **Happy Coding with UnMoGrowP!**
