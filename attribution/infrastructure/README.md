# Infrastructure

This directory contains all infrastructure configuration and monitoring setup for the UnMoGrowP Attribution Platform.

## Directory Structure

```
infrastructure/
├── observability/          # Complete monitoring and observability stack
│   ├── docker-compose.yml          # Basic monitoring (Prometheus, Grafana)
│   ├── docker-compose.observability.yml  # Full stack (+ Jaeger, Loki)
│   ├── activate-monitoring.sh      # Setup script
│   ├── grafana/            # Grafana dashboards and configuration
│   ├── prometheus/         # Prometheus configuration and rules
│   ├── jaeger/            # Distributed tracing configuration
│   ├── loki/              # Log aggregation configuration
│   └── promtail/          # Log collection configuration
└── README.md              # This file
```

## Quick Start

### Option 1: Basic Monitoring Stack
```bash
cd infrastructure/observability/
docker compose -f docker-compose.yml up -d
```

**Includes:**
- Prometheus (metrics) - http://localhost:9090
- Grafana (dashboards) - http://localhost:3000

### Option 2: Complete Observability Stack
```bash
cd infrastructure/observability/
docker compose -f docker-compose.observability.yml up -d
```

**Includes:**
- Prometheus (metrics) - http://localhost:9090
- Grafana (dashboards) - http://localhost:3000
- Jaeger (distributed tracing) - http://localhost:16686
- Loki (log aggregation) - http://localhost:3100

### Option 3: Automated Setup
```bash
cd infrastructure/observability/
chmod +x activate-monitoring.sh
./activate-monitoring.sh
```

## Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| **Prometheus** | 9090 | Metrics collection and storage |
| **Grafana** | 3000 | Visualization dashboards |
| **Jaeger UI** | 16686 | Distributed tracing visualization |
| **Jaeger Collector** | 14268 | Trace data collection endpoint |
| **Loki** | 3100 | Log aggregation service |
| **Promtail** | 9080 | Log collection agent |

## Default Credentials

**Grafana:**
- Username: `admin`
- Password: `admin` (change on first login)

## Pre-configured Dashboards

The Grafana instance comes with pre-configured dashboards for:
- **System Metrics** - CPU, Memory, Disk usage
- **API Performance** - Request latency, throughput, error rates
- **Database Metrics** - PostgreSQL and ClickHouse performance
- **Application Metrics** - Custom business metrics
- **Infrastructure Overview** - Complete system health

## Integration with Application

### OpenTelemetry Setup
The platform includes OpenTelemetry integration stubs:
- **File:** `api/observability/tenant-tracing.ts`
- **Features:** Distributed tracing, tenant-aware spans, performance metrics
- **Documentation:** `docs/architecture/ARCHITECTURAL_ENHANCEMENTS.md`

### Metrics Collection
Application metrics are collected through:
- **Prometheus client libraries** (Node.js, Go)
- **Custom metrics endpoints** at `/metrics`
- **Automatic service discovery** via Docker labels

### Log Collection
Logs are collected from:
- **Application containers** (stdout/stderr)
- **API access logs** (structured JSON)
- **Database slow query logs**
- **System logs** (Docker, host metrics)

## Monitoring Best Practices

### 1. Alerting Rules
Configure alerts for:
- High error rates (>5%)
- Slow response times (P95 > 500ms)
- Database connection issues
- Disk space usage (>80%)

### 2. Dashboard Organization
- **Overview dashboards** - High-level system health
- **Service-specific dashboards** - Detailed per-service metrics
- **Business dashboards** - Attribution metrics, revenue tracking
- **Troubleshooting dashboards** - Error investigation, debugging

### 3. Data Retention
- **Prometheus:** 15 days (high-resolution), 1 year (downsampled)
- **Loki:** 30 days for logs
- **Jaeger:** 7 days for traces

## Scaling Configuration

For production environments:
1. **Enable persistence** - Uncomment volume mounts in docker-compose files
2. **Configure external storage** - Use external Prometheus, Grafana databases
3. **Setup high availability** - Multiple replicas for critical services
4. **Enable authentication** - LDAP/OAuth integration for Grafana

## Troubleshooting

### Common Issues

**Service won't start:**
```bash
# Check logs
docker logs <container_name>

# Check port conflicts
netstat -tlnp | grep :<port>
```

**Missing metrics:**
```bash
# Verify Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check application metrics endpoint
curl http://localhost:3007/metrics
```

**Grafana dashboard issues:**
- Verify data source configuration
- Check Prometheus connectivity
- Validate query syntax

## Architecture Documentation

For detailed information about the observability architecture:
- `docs/architecture/ARCHITECTURAL_ENHANCEMENTS.md` - Complete observability patterns
- `api/observability/tenant-tracing.ts` - Implementation examples

---
*Part of the UnMoGrowP Attribution Platform v0.6.0-preview - Enterprise Observability Stack*