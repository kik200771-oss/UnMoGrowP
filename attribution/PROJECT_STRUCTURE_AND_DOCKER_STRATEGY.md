# UnMoGrowP Attribution Platform - Complete Project Structure & Docker Configuration Guide

**Document Date:** 2025-10-23  
**Project:** UnMoGrowP - Enterprise Mobile Attribution Platform  
**Current Version:** v4.0.0

## Executive Summary

The UnMoGrowP Attribution Platform is a comprehensive enterprise mobile attribution system designed to process 10M+ events/sec with sub-100ms latency. The platform comprises:

- 6 Core Services (Go & TypeScript backends)
- 4 ML Services (Python-based predictive models)
- 1 Svelte 5 Frontend with modern UI
- 5 Data Storage Systems (ClickHouse, PostgreSQL, Redis, Kafka, Elasticsearch)
- Complete Observability Stack (Prometheus, Grafana, Jaeger)

Current Docker Support: 3 Dockerfiles exist (metrics service, api-gateway, web-ui dev)

## Services Overview

### Quick Reference Table

| Service | Language | Type | Port | Entry Point | Status |
|---------|----------|------|------|-------------|--------|
| API Gateway | Go | Backend | 8080 | `cmd/api-gateway/main.go` | Core |
| Ingestion Service | Go | Backend | 8080 | `services/ingestion/main.go` | Core |
| Attribution Engine | Go | Backend | 8082 | `services/attribution/engine.go` | Core |
| Metrics Service | Go | Backend | 8084 | `services/metrics/customer-success-tracker.go` | Core |
| Web UI | Svelte 5 | Frontend | 5173/3000 | `apps/web-ui/src/app.html` | Core |
| API Gateway v2 | TypeScript | Backend | Custom | `apps/api-gateway/index.ts` | Core |
| Analytics API | Python | ML Service | 8085+ | `ml-services/analytics-api/main.py` | Active |
| Attribution ML | Python | ML Service | - | `ml-services/attribution-ml/` | Placeholder |
| Fraud Detection | Python | ML Service | - | `ml-services/fraud-detection/` | Placeholder |
| LTV Prediction | Python | ML Service | - | `ml-services/ltv-prediction/` | Placeholder |

## Detailed Service Breakdown

### 1. API Gateway (Go) - Main Entry Point
- Location: `cmd/api-gateway/main.go`
- Framework: Fiber v3
- Port: 8080 (HTTP), 8081 (Metrics)
- Key features: CORS, Auth (JWT), Rate limiting, Event processing, ClickHouse integration

### 2. Event Ingestion Service (Go)
- Location: `services/ingestion/main.go`
- Framework: Fiber v3
- Port: 8080 + 8081 (metrics)
- Purpose: High-performance event collection and batch processing
- Supports: 1-1000 events per batch, iOS/Android/Web platforms

### 3. Attribution Engine (Go)
- Location: `services/attribution/engine.go`
- Framework: Fiber v3
- Port: 8082 + 8083 (metrics)
- Purpose: Multi-model attribution calculation
- Configuration: DEFAULT_ATTRIBUTION_MODEL=last_touch, ATTRIBUTION_WINDOW=7 days

### 4. Metrics Service (Go - Customer Success Tracker)
- Location: `services/metrics/customer-success-tracker.go`
- Framework: Fiber v3
- Port: 8084
- Tracks: Technical, Business, and Satisfaction metrics
- Database: PostgreSQL

### 5. TypeScript API Gateway (Bun)
- Location: `apps/api-gateway/`
- Entry: `index.ts`
- Runtime: Bun (high-performance JS runtime)
- Key modules: auth, clickhouse, database, event-processor, streaming-processor, rate-limit
- Build: `bun build index.ts --outdir dist`

### 6. Web UI (Svelte 5 Frontend) - Two Implementations
- New: `frontend/` (Recommended)
  - Framework: SvelteKit + Vite
  - Port: 5173 (dev) / 3000 (prod)
  - Node: >=20.0.0
  - Dependencies: Chart.js, D3, Tailwind CSS, Bits UI, Lucide

- Legacy: `apps/web-ui/`
  - Framework: SvelteKit + Vite
  - Port: 3000
  - Dockerfile.dev already exists

### 7. Analytics API (Python - FastAPI)
- Location: `ml-services/analytics-api/`
- Entry: `main.py`
- Framework: FastAPI + Uvicorn
- Port: 8085+
- Purpose: ML inference and analytics (15+ endpoints)
- Models: XGBoost, LightGBM, scikit-learn
- Python: 3.11+
- Key deps: fastapi, uvicorn, pydantic, scikit-learn, xgboost, numpy, pandas

### 8-10. Placeholder ML Services
- Locations: `ml-services/{attribution-ml, fraud-detection, ltv-prediction}/`
- Status: Empty directories ready for implementation

## Technology Stack Summary

Backend:
- Go 1.25.3 (Fiber v3)
- TypeScript/Bun (Latest)
- Python 3.11+ (FastAPI)
- PostgreSQL 15
- ClickHouse 23.8+
- Redis 7
- Kafka 7.4.0

Frontend:
- Svelte 5.1.9
- SvelteKit 2.5.28
- Vite 7.1.7
- Tailwind CSS 3.4.14
- Chart.js 4.4.6
- D3 7.9.0

Observability:
- Prometheus 2.45.0
- Grafana 10.1.0
- Jaeger 1.49
- Nginx 1.25

## Build Requirements & Dependencies

### Go Services
- Go 1.25.3
- C compiler (for ClickHouse driver)
- Git
- Build: `CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags='-w -s' -o service`
- Size: 15-30 MB per binary

### TypeScript/Bun
- Bun runtime 1.0+
- Node.js 20+
- Build: `bun install && bun build index.ts --outdir dist`
- Size: 200-300 MB with node_modules

### Python ML Services
- Python 3.11+
- pip or poetry
- Build: `pip install -r requirements.txt && python main.py`
- Size: 500 MB - 1 GB

### Frontend (Svelte)
- Node.js 20+
- npm 10+
- Build: `npm ci && npm run build`
- Output: 2-5 MB static files

## Environment Configuration

Core Variables:
PORT=8080
METRICS_PORT=8081
POSTGRES_URL=postgres://user:pass@postgres:5432/attribution
CLICKHOUSE_URL=http://clickhouse:8123
REDIS_URL=redis://redis:6379
KAFKA_BROKERS=kafka:29092
LOG_LEVEL=info
DEFAULT_ATTRIBUTION_MODEL=last_touch
ATTRIBUTION_WINDOW_HOURS=168
WORKER_POOL_SIZE=50
BATCH_SIZE=100

Frontend:
VITE_API_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080/ws

## Docker Compose Infrastructure

Production (docker-compose.yml):
- ClickHouse (8GB RAM, 4 CPU)
- PostgreSQL 15 (2GB RAM, 2 CPU)
- Redis 7 (2GB RAM, 1 CPU)
- Kafka 7.4.0 (4GB RAM, 2 CPU)
- Zookeeper
- Prometheus, Grafana, Jaeger
- Nginx load balancer

Development (docker-compose.dev.yml):
- All production services
- Plus: Adminer, Kafka UI, Redis Commander, K6 load testing

## Service Port Mapping

Internal Ports:
- API Gateway: 8080
- Ingestion: 8080
- Attribution: 8082
- Metrics: 8084
- Analytics API: 8085+
- Web UI: 3000 / 5173
- ClickHouse: 8123 (HTTP), 9000 (Native)
- PostgreSQL: 5432
- Redis: 6379
- Kafka: 9092
- Prometheus: 9090
- Grafana: 3000
- Jaeger: 16686

## Directory Structure

attribution/
├── cmd/api-gateway/ (MAIN ENTRY)
├── services/
│   ├── ingestion/ (ENTRY)
│   ├── attribution/ (ENTRY)
│   └── metrics/ (ENTRY - Dockerfile EXISTS)
├── apps/
│   ├── api-gateway/ (ENTRY)
│   └── web-ui/ (Dockerfile.dev EXISTS)
├── frontend/ (NEWER VERSION)
├── ml-services/
│   ├── analytics-api/ (ENTRY)
│   ├── attribution-ml/
│   ├── fraud-detection/
│   └── ltv-prediction/
├── internal/
│   ├── cache/redis.go
│   ├── database/clickhouse.go
│   └── metrics/system.go
├── docker/ (api-gateway Dockerfile EXISTS)
├── deployment/ (Scripts and K8s configs)
├── docker-compose.yml (PRODUCTION)
└── docker-compose.dev.yml (DEVELOPMENT)

## Recommended Dockerfile Strategy

1. Create unified Go Dockerfile for API Gateway (main.go)
2. Create Dockerfile for Ingestion Service
3. Create Dockerfile for Attribution Service
4. Optimize existing Metrics Service Dockerfile
5. Create Dockerfile for TypeScript API Gateway (Bun)
6. Create Dockerfile for each ML service (Analytics, Attribution-ML, Fraud, LTV)
7. Create production Dockerfile for frontend (nginx reverse proxy)
8. Organize in docker/ directory structure
9. Add .dockerignore file
10. Implement health checks and observability

## Performance Targets

- Event Throughput: 10M+ events/sec
- API Latency: <100ms (P95)
- System Uptime: >99.9%
- Attribution Accuracy: >99%
- Container startup: <5 seconds
- Go binary size: 20-30 MB
- Python image size: 500 MB - 1 GB
- Frontend image size: 50-100 MB

---
Document Generated: 2025-10-23
