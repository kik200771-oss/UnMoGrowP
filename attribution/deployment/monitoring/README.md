# 📊 Мониторинг и Логирование - UnMoGrowP Attribution Platform

Комплексная система мониторинга для ML-платформы с использованием Prometheus, Grafana, Loki и AlertManager.

## 📋 Обзор Системы

### 🎯 Компоненты Мониторинга

| Компонент | Порт | Назначение | URL |
|-----------|------|------------|-----|
| **Prometheus** | 9090 | Сбор метрик | http://localhost:9090 |
| **Grafana** | 3000 | Визуализация | http://localhost:3000 |
| **Loki** | 3100 | Агрегация логов | http://localhost:3100 |
| **AlertManager** | 9093 | Управление алертами | http://localhost:9093 |
| **Node Exporter** | 9100 | Системные метрики | http://localhost:9100 |
| **cAdvisor** | 8080 | Контейнер метрики | http://localhost:8080 |

### 🔍 Мониторируемые Сервисы

- **ML Analytics API** (8091) - Prediction metrics, latency, throughput
- **Attribution ML** (8086) - Attribution calculations, model usage
- **Fraud Detection** (8087) - Fraud scores, detection rates, alerts
- **LTV Prediction** (8088) - Customer value predictions, segments
- **API Gateway** (3001) - Request rates, authentication, errors
- **Infrastructure** - CPU, Memory, Disk, Network

## 🚀 Быстрый Старт

### 1. Локальная Разработка (Docker Compose)

```bash
# Клонируйте репозиторий и перейдите в директорию
cd deployment/monitoring

# Запустите мониторинг стек
docker-compose -f docker-compose.monitoring.yml up -d

# Проверьте статус
docker-compose -f docker-compose.monitoring.yml ps
```

### 2. Kubernetes (Production)

```bash
# Создайте namespace
kubectl create namespace attribution-platform

# Примените конфигурации
kubectl apply -f ../kubernetes/monitoring/

# Проверьте развертывание
kubectl get pods -n attribution-platform
```

### 3. Запустите ML Сервисы

```bash
# В отдельных терминалах запустите ML сервисы
cd ../../ml-services/analytics-api && python main.py
cd ../../ml-services/attribution-ml && python main.py
cd ../../ml-services/fraud-detection && python main.py
cd ../../ml-services/ltv-prediction && python main.py
```

## 📊 Дашборды Grafana

### 🤖 ML Services Overview
**URL:** http://localhost:3000/d/ml-overview

**Метрики:**
- Service Status (UP/DOWN)
- Predictions per Minute
- Response Time (95th percentile)
- Error Rates
- Request Distribution

### ⚡ ML Performance Dashboard
**URL:** http://localhost:3000/d/ml-performance

**Метрики:**
- Latency Heatmaps
- Throughput by Model
- Resource Usage (CPU/Memory)
- Model-specific Performance

### 💼 Business Metrics Dashboard
**URL:** http://localhost:3000/d/business-metrics

**Метрики:**
- Fraud Detection Results
- Attribution Model Usage
- LTV Segments Distribution
- Revenue Impact

## 🚨 Алерты и Уведомления

### Критичные Алерты

1. **ML Service Down** - Сервис недоступен
2. **High Fraud Detection Rate** - Возможная атака
3. **High Prediction Latency** - Производительность ниже SLA
4. **High Error Rate** - Критический уровень ошибок

### Конфигурация Уведомлений

```yaml
# alertmanager/alertmanager.yml
receivers:
  - name: 'ml-critical'
    email_configs:
      - to: 'ml-team@attribution.platform'
    slack_configs:
      - channel: '#ml-alerts'
```

## 📋 Метрики ML Сервисов

### Analytics API (8091)
```prometheus
# Количество предсказаний по моделям
ml_predictions_total{model="conversion|revenue|churn"}

# Латентность предсказаний
ml_prediction_latency_seconds_bucket

# API запросы
api_requests_total{endpoint, method}
```

### Attribution ML (8086)
```prometheus
# Вычисления атрибуции
attribution_calculations_total{model="first_touch|last_touch|linear|time_decay|position_based"}

# Латентность атрибуции
attribution_calculation_latency_seconds_bucket
```

### Fraud Detection (8087)
```prometheus
# Детекция мошенничества
fraud_detections_total{result="low|medium|high"}

# Латентность детекции
fraud_detection_latency_seconds_bucket
```

### LTV Prediction (8088)
```prometheus
# Предсказания LTV
ltv_predictions_total{segment="low|medium|high|premium"}

# Латентность LTV
ltv_prediction_latency_seconds_bucket
```

## 🔍 Логирование

### Loki Queries

```logql
# Ошибки ML сервисов
{service=~"ml-analytics|attribution-ml|fraud-detection|ltv-prediction"} |= "ERROR"

# Медленные предсказания
{service="ml-analytics"} | json | latency_ms > 1000

# Fraud алерты высокого риска
{service="fraud-detection"} | json | risk_level="high"

# Трассировка по ID
{service=~".*"} | json | trace_id="your-trace-id"
```

### Структурированные Логи

```json
{
  "timestamp": "2025-10-24T10:30:00.123Z",
  "level": "INFO",
  "service": "ml-analytics",
  "message": "Prediction completed",
  "model": "conversion",
  "prediction_id": "pred_123456",
  "user_id": "user_789",
  "latency_ms": 45,
  "trace_id": "trace_abc123"
}
```

## ⚙️ Конфигурация

### Prometheus Configuration

```yaml
# prometheus/prometheus.yml
scrape_configs:
  - job_name: 'ml-analytics'
    static_configs:
      - targets: ['host.docker.internal:8091']
    scrape_interval: 15s
```

### Grafana Datasources

```yaml
# grafana/datasources/datasources.yml
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
  - name: Loki
    type: loki
    url: http://loki:3100
```

## 🔧 Настройка Алертов

### Prometheus Rules

```yaml
# Высокая латентность ML предсказаний
- alert: HighMLPredictionLatency
  expr: histogram_quantile(0.95, ml_prediction_latency_seconds_bucket) > 2
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "High ML prediction latency detected"
```

### AlertManager Routes

```yaml
routes:
  - match:
      severity: critical
      service: fraud-detection
    receiver: 'fraud-immediate'
    group_wait: 0s
```

## 📈 Performance Tuning

### Prometheus Retention

```bash
# Увеличить retention до 90 дней
--storage.tsdb.retention.time=90d
--storage.tsdb.retention.size=50GB
```

### Loki Optimization

```yaml
# Увеличить batch size для высокой нагрузки
limits_config:
  ingestion_rate_mb: 32
  ingestion_burst_size_mb: 64
```

## 🔐 Безопасность

### Grafana Security

```bash
# Смените пароль по умолчанию
export GF_SECURITY_ADMIN_PASSWORD="secure-password-123"

# Включите HTTPS
export GF_SERVER_PROTOCOL="https"
export GF_SERVER_CERT_FILE="/path/to/cert.pem"
export GF_SERVER_CERT_KEY="/path/to/key.pem"
```

### Prometheus Security

```yaml
# Включите basic auth
basic_auth_users:
  admin: $2b$12$hNf2lSsxfm0.i4a.1kVpSOVyBCfIB51VRjgBUyv6kdnyTlgWj81Ay
```

## 🐛 Диагностика

### Проверка Статуса

```bash
# Prometheus targets
curl http://localhost:9090/api/v1/targets

# Loki health
curl http://localhost:3100/ready

# AlertManager config
curl http://localhost:9093/-/reload
```

### Общие Проблемы

1. **ML сервисы не видны в Prometheus**
   ```bash
   # Проверьте, что ML сервисы запущены
   curl http://localhost:8091/metrics

   # Проверьте конфигурацию Prometheus
   docker exec attribution-prometheus promtool check config /etc/prometheus/prometheus.yml
   ```

2. **Логи не отображаются в Grafana**
   ```bash
   # Проверьте Loki logs
   docker logs attribution-loki

   # Проверьте Promtail
   docker logs attribution-promtail
   ```

3. **Алерты не срабатывают**
   ```bash
   # Проверьте rules
   curl http://localhost:9090/api/v1/rules

   # Проверьте AlertManager
   curl http://localhost:9093/api/v1/alerts
   ```

## 📚 Дополнительные Ресурсы

### Документация
- [Prometheus Querying](https://prometheus.io/docs/prometheus/latest/querying/)
- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/best-practices/)
- [Loki LogQL](https://grafana.com/docs/loki/latest/logql/)
- [AlertManager Configuration](https://prometheus.io/docs/alerting/latest/configuration/)

### Дашборды Сообщества
- [ML Monitoring Dashboard](https://grafana.com/grafana/dashboards/15120)
- [Kubernetes Cluster Monitoring](https://grafana.com/grafana/dashboards/315)
- [Docker Container Monitoring](https://grafana.com/grafana/dashboards/193)

### Интеграции
- **Slack**: Уведомления в реальном времени
- **PagerDuty**: Критичные алерты
- **Jaeger**: Distributed tracing
- **ElasticSearch**: Дополнительная аналитика логов

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте [troubleshooting секцию](#-диагностика)
2. Просмотрите логи контейнеров: `docker logs <container-name>`
3. Проверьте connectivity: `docker network ls`
4. Обратитесь к команде ML: `ml-team@attribution.platform`

---

**Мониторинг настроен! 🎉**

Ваша ML-платформа теперь имеет production-ready систему мониторинга и логирования.