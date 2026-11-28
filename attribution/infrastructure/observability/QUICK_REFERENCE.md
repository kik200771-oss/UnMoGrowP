# UnMoGrowP Monitoring - Quick Reference Card

## 🚀 Quick Start (1 Command)

```bash
cd infrastructure/observability && bash activate-monitoring.sh
```

## 📊 Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana** | http://localhost:3000 | admin / admin123 |
| **Prometheus** | http://localhost:9090 | - |
| **AlertManager** | http://localhost:9093 | - |

## 📈 Dashboards

| Dashboard | Purpose | Key Metrics |
|-----------|---------|-------------|
| **Performance Monitoring** | Technical goals validation | 1M events/sec, <100ms P95, >99.9% uptime |
| **Customer Success** | Pilot customer tracking | 5 customers, >90% satisfaction, ROI |
| **Load Testing** | Load test validation | Throughput, latency, success rate |
| **Customer Onboarding** | Onboarding journey | Time to launch, health score |

## ⚡ Quick Commands

### Validate Monitoring
```bash
bash infrastructure/observability/validate-monitoring.sh
```

### Check Service Health
```bash
docker-compose ps
```

### View Logs
```bash
docker-compose logs -f prometheus
docker-compose logs -f grafana
```

### Restart Services
```bash
docker-compose restart prometheus
docker-compose restart grafana
```

## 🔍 Quick Queries

### Event Throughput
```promql
sum(rate(attribution_events_processed_total[1m]))
```

### P95 Latency
```promql
histogram_quantile(0.95, sum(rate(attribution_event_processing_duration_seconds_bucket[5m])) by (le)) * 1000
```

### Customer Satisfaction
```promql
avg(customer_satisfaction_score)
```

### System Uptime
```promql
avg(up{job=~"unmogrowp.*"}) * 100
```

## 🚨 Alert Thresholds

| Metric | Threshold | Severity |
|--------|-----------|----------|
| Event Throughput | < 1M/sec | CRITICAL |
| P95 Latency | > 100ms | CRITICAL |
| System Uptime | < 99.9% | CRITICAL |
| Error Rate | > 0.1% | CRITICAL |
| Customer Satisfaction | < 90% | CRITICAL |
| Pilot Customers | < 5 | WARNING |

## 🛠️ Troubleshooting

### No Data in Dashboards
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .job, health: .health}'
```

### Service Down
```bash
# Check service status
docker-compose ps

# Restart all services
docker-compose restart
```

### Alerts Not Firing
```bash
# Check alert rules
curl http://localhost:9090/api/v1/rules | jq '.data.groups[] | .name'

# Reload Prometheus
curl -X POST http://localhost:9090/-/reload
```

## 📞 Support

- **Documentation:** `MONITORING_DEPLOYMENT_GUIDE.md`
- **Validation:** `validate-monitoring.sh`
- **Convergence Report:** `WEEK1_CONVERGENCE_REPORT.md`

## ✅ Week 1 Sprint Goals

**Technical (40%):**
- ✅ 1M+ events/sec processing
- ✅ <100ms P95 latency
- ✅ >99.9% uptime

**Customer (60%):**
- ✅ 5 pilot customers
- ✅ >90% satisfaction
- ✅ 30-50% cost savings

---

**Quick Reference v1.0** | Architecture Agent | 2025-10-22
