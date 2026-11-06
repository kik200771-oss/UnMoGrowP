# UnMoGrowP Attribution Platform - Monitoring Deployment Guide
## Week 1 Sprint: Performance Monitoring Setup

**Version:** 1.0.0
**Last Updated:** 2025-10-22
**Sprint Goal:** Week 1 Customer + Load Testing Launch (60% customer + 40% technical)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Detailed Setup](#detailed-setup)
6. [Dashboard Configuration](#dashboard-configuration)
7. [Alert Configuration](#alert-configuration)
8. [Validation Checklist](#validation-checklist)
9. [Integration with Other Agents](#integration-with-other-agents)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This monitoring stack provides comprehensive observability for the UnMoGrowP Attribution Platform, specifically designed to validate Week 1 Sprint goals:

### Sprint Goals Monitoring
- **Technical Validation:** 1M+ events/sec processing, <100ms P95 latency, >99.9% uptime
- **Customer Success:** Track pilot customer metrics, satisfaction scores, and business impact
- **Load Testing:** Real-time validation of performance under load
- **Pilot Readiness:** Integration metrics for customer onboarding

### Monitoring Stack Components
- **Prometheus** - Metrics collection and alerting
- **Grafana** - Visualization and dashboards
- **Loki** - Log aggregation
- **Jaeger** - Distributed tracing
- **Node Exporter** - System metrics
- **cAdvisor** - Container metrics
- **AlertManager** - Alert routing and notification

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     UnMoGrowP Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Go Ingestion │  │  Bun API     │  │   Customer   │         │
│  │  Service     │  │   Layer      │  │Success Tracker│         │
│  │  (Port 8081) │  │ (Port 3004)  │  │  (Port 8084) │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │ /metrics        │ /metrics        │ /metrics         │
└─────────┼─────────────────┼─────────────────┼─────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
     ┌────────────────────────────────────────────┐
     │          Prometheus (Port 9090)            │
     │  • Scrapes metrics every 15s               │
     │  • Evaluates alerting rules                │
     │  • Stores time-series data (30 days)       │
     └────────────┬───────────────────────────────┘
                  │
                  ▼
     ┌────────────────────────────────────────────┐
     │           Grafana (Port 3000)              │
     │  • Performance Monitoring Dashboard         │
     │  • Customer Success Metrics Dashboard       │
     │  • Load Testing Validation Dashboard        │
     │  • Customer Onboarding Dashboard            │
     └────────────────────────────────────────────┘
                  │
                  ▼
     ┌────────────────────────────────────────────┐
     │       AlertManager (Port 9093)             │
     │  • Routes alerts to Slack/Email            │
     │  • Deduplicates and groups alerts          │
     └────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Software
- **Docker** 20.10+ and **Docker Compose** 2.0+
- **Git** (to clone repository)
- Network access to:
  - UnMoGrowP services (ports 8080-8084, 3001-3004)
  - Monitoring stack (ports 3000, 9090, 9093)

### Service Dependencies
Ensure these services are running and exposing metrics:
1. **Go Ingestion Service** - `http://localhost:8081/metrics`
2. **Bun API Layer** - `http://localhost:3004/metrics` (if metrics enabled)
3. **Customer Success Tracker** - `http://localhost:8084/metrics` (optional)

### System Requirements
- **CPU:** 4+ cores recommended
- **RAM:** 8GB minimum (16GB recommended)
- **Disk:** 50GB free space (for metrics storage)
- **OS:** Linux, macOS, or Windows with WSL2

---

## Quick Start

### 1. One-Command Deployment

```bash
cd infrastructure/observability
bash activate-monitoring.sh
```

This script will:
- ✅ Verify prerequisites (Docker, docker-compose)
- ✅ Create all configuration files
- ✅ Start monitoring stack (Prometheus, Grafana, Loki, etc.)
- ✅ Wait for services to be healthy
- ✅ Import pre-built dashboards

**Expected Output:**
```
🚀 UnMoGrowP Monitoring Stack Activation
=======================================
✅ Prerequisites verified
✅ Configuration files created
✅ Dashboards created
🐳 Starting monitoring stack...
✅ Prometheus is ready
✅ Grafana is ready
✅ Loki is ready
📊 Importing dashboards...
✅ Dashboard performance-monitoring imported
✅ Dashboard customer-success-metrics imported
✅ Dashboard load-testing-validation imported
✅ Dashboard customer-onboarding imported

🎉 Monitoring stack activation complete!
=============================================

📊 Access URLs:
  • Grafana:      http://localhost:3000 (admin/admin123)
  • Prometheus:   http://localhost:9090
  • Alertmanager: http://localhost:9093
```

### 2. Access Dashboards

Open your browser and navigate to:
- **Grafana:** http://localhost:3000
- **Login:** admin / admin123 (change on first login)

**Available Dashboards:**
1. **Performance Monitoring** - Real-time performance metrics (1M events/sec, <100ms P95)
2. **Customer Success Metrics** - Pilot customer tracking and satisfaction
3. **Load Testing Validation** - Load test campaign results
4. **Customer Onboarding** - Onboarding funnel and health metrics

---

## Detailed Setup

### Manual Deployment (Alternative to Quick Start)

If you prefer manual setup or need customization:

#### Step 1: Start Monitoring Stack

```bash
cd infrastructure/observability
docker-compose up -d
```

#### Step 2: Verify Services

```bash
# Check all services are running
docker-compose ps

# Expected output:
# unmogrowp-prometheus    running    0.0.0.0:9090->9090/tcp
# unmogrowp-grafana       running    0.0.0.0:3000->3000/tcp
# unmogrowp-loki          running    0.0.0.0:3100->3100/tcp
# unmogrowp-alertmanager  running    0.0.0.0:9093->9093/tcp
# unmogrowp-node-exporter running    0.0.0.0:9100->9100/tcp
# unmogrowp-cadvisor      running    0.0.0.0:8080->8080/tcp
```

#### Step 3: Verify Metrics Collection

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .job, health: .health}'

# Expected: All targets should show "health": "up"
```

#### Step 4: Import Dashboards

Dashboards are automatically provisioned from `grafana/dashboards/` directory. To manually import:

```bash
# Navigate to Grafana UI
# Go to: Dashboards → Import → Upload JSON file
# Import files from: infrastructure/observability/grafana/dashboards/
```

---

## Dashboard Configuration

### 1. Performance Monitoring Dashboard

**Purpose:** Real-time validation of Week 1 technical goals

**Key Metrics:**
- Event Processing Rate (Target: 1M+ events/sec)
- P95 API Latency (Target: <100ms)
- System Uptime (Target: >99.9%)
- Attribution Accuracy (Target: >99%)

**Access:** Grafana → Dashboards → "UnMoGrowP Performance Monitoring"

**Alert Thresholds:**
```yaml
Event Throughput < 1M/sec    → CRITICAL
P95 Latency > 100ms          → CRITICAL
System Uptime < 99.9%        → CRITICAL
Error Rate > 0.1%            → CRITICAL
```

### 2. Customer Success Metrics Dashboard

**Purpose:** Track pilot customer satisfaction and business impact

**Key Metrics:**
- Total Pilot Customers (Target: 5 in Week 1)
- Average Customer Satisfaction (Target: >90%)
- Attribution Accuracy by Customer (Target: >99%)
- Cost Savings per Customer (Target: 30-50%)

**Access:** Grafana → Dashboards → "UnMoGrowP Customer Success Metrics"

**Business KPIs:**
```yaml
Pilot Customers < 5          → WARNING (Week 1 target)
Satisfaction < 90%           → CRITICAL
Success Rate < 60%           → WARNING
Technical Success = False    → CRITICAL
```

### 3. Load Testing Validation Dashboard

**Purpose:** Real-time load test campaign monitoring

**Key Metrics:**
- Current Throughput vs 1M target
- P95 Latency under load
- Success Rate (Target: >99.9%)
- Resource Utilization

**Access:** Grafana → Dashboards → "UnMoGrowP Load Testing Validation"

**Load Test Criteria:**
```yaml
Throughput > 1M events/sec   → PASS
P95 Latency < 100ms          → PASS
Success Rate > 99.9%         → PASS
CPU Usage < 85%              → HEALTHY
```

### 4. Customer Onboarding Dashboard

**Purpose:** Track pilot customer onboarding progress

**Key Metrics:**
- Onboarding Pipeline (Discovery → Setup → Launch)
- Time to Launch (Target: <14 days)
- Support Tickets per Customer
- Customer Health Score

**Access:** Grafana → Dashboards → "UnMoGrowP Customer Onboarding"

**Onboarding Health:**
```yaml
Time to Launch < 14 days     → GREEN
Time to Launch < 21 days     → YELLOW
Time to Launch > 21 days     → RED
Support Tickets < 5          → HEALTHY
```

---

## Alert Configuration

### Prometheus Alerting Rules

Alerts are defined in: `prometheus/rules/performance-alerts.yml`

#### Critical Alerts (Immediate Action Required)

| Alert Name | Condition | For Duration | Severity |
|------------|-----------|--------------|----------|
| EventThroughputBelowTarget | < 1M events/sec | 5 minutes | CRITICAL |
| P95LatencyAboveTarget | > 100ms | 3 minutes | CRITICAL |
| ServiceDown | Service unavailable | 1 minute | CRITICAL |
| HighErrorRate | Error rate > 0.1% | 3 minutes | CRITICAL |
| CustomerSatisfactionBelowTarget | < 90% | 10 minutes | CRITICAL |

#### Warning Alerts (Investigation Needed)

| Alert Name | Condition | For Duration | Severity |
|------------|-----------|--------------|----------|
| LatencyDegrading | Increasing trend | 5 minutes | WARNING |
| PilotCustomerCountLow | < 5 customers | 1 hour | WARNING |
| LoadTestThroughputFailure | < 1M during test | 5 minutes | WARNING |
| HighMemoryUsage | > 7GB | 5 minutes | WARNING |

### Alert Notification Setup

#### Slack Integration

1. Create Slack webhook URL: https://api.slack.com/messaging/webhooks
2. Update AlertManager configuration:

```yaml
# alertmanager/alertmanager.yml
receivers:
  - name: 'slack-alerts'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#unmogrowp-alerts'
        title: 'UnMoGrowP Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

3. Restart AlertManager:
```bash
docker-compose restart alertmanager
```

#### Email Integration

```yaml
# alertmanager/alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@unmogrowp.com'
  smtp_auth_username: 'your-email@gmail.com'
  smtp_auth_password: 'your-app-password'

receivers:
  - name: 'email-alerts'
    email_configs:
      - to: 'team@unmogrowp.com'
        headers:
          Subject: '[UnMoGrowP] {{ .GroupLabels.alertname }}'
```

---

## Validation Checklist

### Pre-Deployment Validation

- [ ] Docker and docker-compose installed and running
- [ ] All UnMoGrowP services running and healthy
- [ ] Services exposing Prometheus metrics endpoints
- [ ] Network connectivity to service ports verified
- [ ] Sufficient disk space (50GB+) available

### Post-Deployment Validation

#### 1. Monitoring Stack Health

```bash
# All services running
docker-compose ps | grep "Up"

# Prometheus targets healthy
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health != "up")'
# Expected: Empty output (all targets healthy)

# Grafana accessible
curl -s http://localhost:3000/api/health | jq '.database'
# Expected: "ok"
```

#### 2. Metrics Collection Validation

```bash
# Verify event processing metrics
curl -s 'http://localhost:9090/api/v1/query?query=attribution_events_processed_total' | jq '.data.result | length'
# Expected: > 0 (metrics being collected)

# Verify customer metrics
curl -s 'http://localhost:9090/api/v1/query?query=customer_satisfaction_score' | jq '.data.result | length'
# Expected: > 0 (if customers onboarded)

# Verify latency metrics
curl -s 'http://localhost:9090/api/v1/query?query=attribution_event_processing_duration_seconds_bucket' | jq '.data.result | length'
# Expected: > 0 (latency histograms present)
```

#### 3. Dashboard Validation

- [ ] **Performance Monitoring Dashboard**
  - [ ] Event processing rate chart showing data
  - [ ] P95 latency gauge displaying current value
  - [ ] System uptime showing >99%
  - [ ] No critical alerts firing

- [ ] **Customer Success Dashboard**
  - [ ] Pilot customer count visible
  - [ ] Satisfaction scores displaying
  - [ ] Cost savings metrics present
  - [ ] Customer health indicators active

- [ ] **Load Testing Dashboard**
  - [ ] Throughput metrics collecting during tests
  - [ ] Latency distribution chart working
  - [ ] Resource utilization monitoring active
  - [ ] Success rate calculating correctly

- [ ] **Customer Onboarding Dashboard**
  - [ ] Onboarding pipeline showing phases
  - [ ] Time to launch metrics tracking
  - [ ] Customer health scores visible
  - [ ] Support ticket counts displaying

#### 4. Alert Validation

```bash
# Test alert firing (simulate high latency)
curl -X POST http://localhost:9090/api/v1/admin/tsdb/snapshot

# Check active alerts
curl -s http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | {alert: .labels.alertname, state: .state}'

# Verify AlertManager receives alerts
curl -s http://localhost:9093/api/v2/alerts | jq '.[] | {alertname: .labels.alertname, status: .status.state}'
```

#### 5. Week 1 Sprint Goal Validation

**Technical Validation (60% weight):**
- [ ] Event processing rate monitoring shows 1M+ events/sec capability
- [ ] P95 latency consistently <100ms under normal load
- [ ] System uptime >99.9% tracked
- [ ] Error rate <0.1% monitored

**Customer Success (40% weight):**
- [ ] 5 pilot customers tracked in system
- [ ] Customer satisfaction >90% average
- [ ] Business impact metrics (30-50% cost savings) tracked
- [ ] Technical success criteria met for majority of customers

---

## Integration with Other Agents

### Product Manager Agent Integration
**Convergence Point:** Customer metrics from monitoring feed into customer materials

**Integration:**
- Customer satisfaction scores → Customer success stories
- Performance metrics → Technical specifications for customers
- Onboarding metrics → Pilot program documentation

**Data Flow:**
```bash
# Export customer metrics for Product Manager
curl -s 'http://localhost:9090/api/v1/query?query=customer_satisfaction_score' \
  | jq '.data.result[] | {company: .metric.company_name, satisfaction: .value[1]}'
```

### DevOps Agent Integration
**Convergence Point:** Monitoring validates deployment health

**Integration:**
- Service health metrics → Deployment validation
- Resource utilization → Capacity planning
- Error rates → Deployment rollback decisions

**Validation Endpoint:**
```bash
# Health check for DevOps automation
curl -s http://localhost:9090/api/v1/query?query=up | jq '.data.result[] | select(.value[1] == "0")'
# Empty output = all services healthy
```

### Testing Agent Integration
**Convergence Point:** Load test results validation

**Integration:**
- Real-time throughput metrics during load tests
- Latency distribution under load
- Error rates during stress testing
- Resource exhaustion detection

**Load Test Query Examples:**
```bash
# Get current throughput during load test
curl -s 'http://localhost:9090/api/v1/query?query=sum(rate(attribution_events_processed_total[1m]))' \
  | jq '.data.result[0].value[1]'

# Get P95 latency during load test
curl -s 'http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,sum(rate(attribution_event_processing_duration_seconds_bucket[5m]))by(le))*1000' \
  | jq '.data.result[0].value[1]'
```

### Go Code Agent Integration
**Convergence Point:** Performance optimization validation

**Integration:**
- Real-time performance metrics for optimization validation
- Memory usage tracking for leak detection
- Latency improvements measurement
- Throughput scaling validation

**Metrics for Code Optimization:**
- `attribution_events_processed_total` - Throughput impact
- `attribution_event_processing_duration_seconds` - Latency impact
- `attribution_memory_usage_bytes` - Memory efficiency
- `attribution_active_connections` - Connection pool efficiency

---

## Troubleshooting

### Common Issues

#### Issue 1: Prometheus Not Scraping Metrics

**Symptoms:**
- Dashboards show "No data"
- Targets show as "DOWN" in Prometheus

**Solution:**
```bash
# Check if services are exposing metrics
curl http://localhost:8081/metrics
curl http://localhost:3004/metrics

# Verify network connectivity
docker exec unmogrowp-prometheus ping -c 3 host.docker.internal

# Check Prometheus logs
docker-compose logs prometheus | grep -i error

# Restart Prometheus
docker-compose restart prometheus
```

#### Issue 2: Dashboards Not Loading

**Symptoms:**
- Grafana shows "Dashboard not found"
- Dashboards exist but show errors

**Solution:**
```bash
# Verify dashboard files exist
ls -la grafana/dashboards/

# Check Grafana logs
docker-compose logs grafana | grep -i error

# Re-provision dashboards
docker-compose restart grafana

# Manual import via UI
# Grafana → Dashboards → Import → Upload JSON
```

#### Issue 3: Alerts Not Firing

**Symptoms:**
- No alerts despite conditions being met
- AlertManager shows no alerts

**Solution:**
```bash
# Verify alerting rules loaded
curl http://localhost:9090/api/v1/rules | jq '.data.groups[] | .name'

# Check for rule evaluation errors
curl http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | select(.health != "ok")'

# Reload Prometheus configuration
curl -X POST http://localhost:9090/-/reload

# Check AlertManager logs
docker-compose logs alertmanager | grep -i error
```

#### Issue 4: High Memory Usage

**Symptoms:**
- Prometheus consuming >8GB RAM
- System becoming slow

**Solution:**
```bash
# Reduce retention period (in prometheus.yml)
# --storage.tsdb.retention.time=15d (instead of 30d)

# Increase resource limits (in docker-compose.yml)
# memory: 4G (instead of 2G)

# Clean old data
docker exec unmogrowp-prometheus rm -rf /prometheus/*

# Restart with new settings
docker-compose down
docker-compose up -d
```

#### Issue 5: Customer Metrics Not Showing

**Symptoms:**
- Customer Success Dashboard empty
- Customer metrics queries return no data

**Solution:**
```bash
# Verify Customer Success Tracker is running
curl http://localhost:8084/health

# Check if metrics are being exposed
curl http://localhost:8084/metrics | grep customer

# Verify Prometheus is scraping the endpoint
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.job == "customer-success-tracker")'

# Add scrape config if missing (in prometheus.yml)
# - job_name: 'customer-success-tracker'
#   static_configs:
#     - targets: ['host.docker.internal:8084']
```

### Performance Optimization

#### Optimize Prometheus Storage

```bash
# Compact old data
docker exec unmogrowp-prometheus promtool tsdb compact /prometheus

# Reduce scrape frequency for less critical metrics
# In prometheus.yml:
# scrape_interval: 30s (instead of 15s) for infrastructure
```

#### Optimize Grafana Performance

```bash
# Increase query cache
# In grafana.ini:
# [caching]
# enabled = true
# ttl = 300

# Reduce dashboard refresh rate
# In dashboard settings: 30s instead of 5s
```

### Getting Help

**Documentation:**
- Prometheus: https://prometheus.io/docs/
- Grafana: https://grafana.com/docs/
- Project docs: `docs/`

**Support Channels:**
- GitHub Issues: https://github.com/your-org/unmogrowp/issues
- Team Slack: #unmogrowp-monitoring
- Email: support@unmogrowp.com

---

## Appendix

### A. Metrics Reference

#### Event Processing Metrics
```
attribution_events_processed_total{app_id, event_type, platform, status}
attribution_event_processing_duration_seconds_bucket{endpoint, le}
attribution_active_connections
attribution_memory_usage_bytes
```

#### Customer Success Metrics
```
customer_satisfaction_score{customer_id, company_name}
attribution_accuracy_percent{customer_id}
customer_api_latency_ms{customer_id, percentile}
customer_cost_savings_percent{customer_id}
total_pilot_customers
successful_pilot_customers
```

### B. Query Examples

#### Get current event throughput
```promql
sum(rate(attribution_events_processed_total[1m]))
```

#### Get P95 latency
```promql
histogram_quantile(0.95, sum(rate(attribution_event_processing_duration_seconds_bucket[5m])) by (le)) * 1000
```

#### Get customer satisfaction average
```promql
avg(customer_satisfaction_score)
```

#### Get success rate
```promql
(successful_pilot_customers / total_pilot_customers) * 100
```

### C. Configuration Files Reference

```
infrastructure/observability/
├── docker-compose.yml              # Main monitoring stack
├── activate-monitoring.sh          # One-command deployment
├── prometheus/
│   ├── prometheus.yml              # Prometheus configuration
│   └── rules/
│       └── performance-alerts.yml  # Alerting rules
├── grafana/
│   ├── provisioning/
│   │   └── datasources/
│   │       └── datasources.yml     # Data source config
│   └── dashboards/
│       ├── performance-monitoring.json
│       ├── customer-success-metrics.json
│       ├── load-testing-validation.json
│       └── customer-onboarding.json
├── loki/
│   └── loki-config.yml
├── promtail/
│   └── promtail-config.yml
└── alertmanager/
    └── alertmanager.yml
```

---

**End of Monitoring Deployment Guide**

For questions or issues, contact the Architecture Team or consult the main project documentation.
