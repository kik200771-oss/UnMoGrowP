#!/bin/bash
# UnMoGrowP Attribution Platform - Monitoring Activation Script
# One-command monitoring stack deployment

set -e

echo "🚀 UnMoGrowP Monitoring Stack Activation"
echo "======================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Verify prerequisites
echo -e "${BLUE}📋 Step 1: Verifying prerequisites...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo -e "${RED}❌ docker-compose is not available. Please install Docker Compose.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites verified${NC}"

# Step 2: Create necessary directories and configs
echo -e "${BLUE}📁 Step 2: Creating configuration files...${NC}"

# Create Prometheus configuration
mkdir -p prometheus/rules
cat > prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  # UnMoGrowP Services
  - job_name: 'go-backend'
    static_configs:
      - targets: ['host.docker.internal:8081']
    metrics_path: /metrics
    scrape_interval: 10s

  - job_name: 'bun-api'
    static_configs:
      - targets: ['host.docker.internal:3003']
    metrics_path: /metrics
    scrape_interval: 10s

  # Infrastructure monitoring
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
EOF

# Create basic alerting rules
cat > prometheus/rules/unmogrowp.yml << 'EOF'
groups:
  - name: unmogrowp.rules
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} for {{ $labels.service }}"

      # Service down
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "Service {{ $labels.job }} has been down for more than 1 minute"

      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s"
EOF

# Create Grafana provisioning
mkdir -p grafana/provisioning/{datasources,dashboards}

cat > grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
EOF

cat > grafana/provisioning/dashboards/dashboard.yml << 'EOF'
apiVersion: 1
providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

# Create Loki configuration
mkdir -p loki
cat > loki/loki-config.yml << 'EOF'
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /tmp/loki/index
  filesystem:
    directory: /tmp/loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
EOF

# Create Promtail configuration
mkdir -p promtail
cat > promtail/promtail-config.yml << 'EOF'
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: containers
    static_configs:
      - targets:
          - localhost
        labels:
          job: containerlogs
          __path__: /var/lib/docker/containers/*/*log

    pipeline_stages:
      - json:
          expressions:
            output: log
            stream: stream
            attrs:
      - json:
          expressions:
            tag:
          source: attrs
      - regex:
          expression: (?P<container_name>(?:[^|]*[^|]))
          source: tag
      - timestamp:
          format: RFC3339Nano
          source: time
      - labels:
          stream:
          container_name:
      - output:
          source: output
EOF

# Create Alertmanager configuration
mkdir -p alertmanager
cat > alertmanager/alertmanager.yml << 'EOF'
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alertmanager@unmogrowp.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://127.0.0.1:5001/'
        send_resolved: true

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
EOF

echo -e "${GREEN}✅ Configuration files created${NC}"

# Step 3: Create pre-built dashboards
echo -e "${BLUE}📊 Step 3: Creating Grafana dashboards...${NC}"

mkdir -p grafana/dashboards

# System Overview Dashboard
cat > grafana/dashboards/system-overview.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "UnMoGrowP System Overview",
    "tags": ["unmogrowp", "overview"],
    "timezone": "browser",
    "refresh": "30s",
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "API Response Time (95th percentile)",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "s",
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 0.5},
                {"color": "red", "value": 1.0}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Request Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m]))",
            "legendFormat": "Requests/sec"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps"
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 6, "y": 0}
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
            "legendFormat": "Error %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 1},
                {"color": "red", "value": 5}
              ]
            }
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0}
      },
      {
        "id": 4,
        "title": "Service Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up",
            "legendFormat": "{{ job }}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "mappings": [
              {"options": {"0": {"text": "Down", "color": "red"}}, "type": "value"},
              {"options": {"1": {"text": "Up", "color": "green"}}, "type": "value"}
            ]
          }
        },
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0}
      }
    ]
  }
}
EOF

# API Metrics Dashboard
cat > grafana/dashboards/api-metrics.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "UnMoGrowP API Metrics",
    "tags": ["unmogrowp", "api"],
    "timezone": "browser",
    "refresh": "10s",
    "time": {
      "from": "now-15m",
      "to": "now"
    },
    "panels": [
      {
        "id": 1,
        "title": "HTTP Requests Rate by Service",
        "type": "graph",
        "targets": [
          {
            "expr": "sum by (job) (rate(http_requests_total[1m]))",
            "legendFormat": "{{ job }}"
          }
        ],
        "yAxes": [
          {"label": "Requests/sec", "min": 0}
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Response Time Distribution",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          },
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "99th percentile"
          }
        ],
        "yAxes": [
          {"label": "Seconds", "min": 0}
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      }
    ]
  }
}
EOF

echo -e "${GREEN}✅ Dashboards created${NC}"

# Step 4: Start monitoring stack
echo -e "${BLUE}🐳 Step 4: Starting monitoring stack...${NC}"

# Use docker-compose or docker compose based on availability
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# Start the stack
$COMPOSE_CMD up -d

# Step 5: Wait for services to be ready
echo -e "${BLUE}⏳ Step 5: Waiting for services to start...${NC}"

# Function to check if service is ready
check_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready${NC}"
            return 0
        fi
        echo -e "${YELLOW}⏳ Waiting for $name... (attempt $attempt/$max_attempts)${NC}"
        sleep 2
        ((attempt++))
    done

    echo -e "${RED}❌ $name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Check services
check_service "http://localhost:9090/-/ready" "Prometheus"
check_service "http://localhost:3000/api/health" "Grafana"
check_service "http://localhost:3100/ready" "Loki"

# Step 6: Import dashboards
echo -e "${BLUE}📊 Step 6: Importing Grafana dashboards...${NC}"

# Wait a bit more for Grafana to fully initialize
sleep 10

# Import dashboards
for dashboard in grafana/dashboards/*.json; do
    if [ -f "$dashboard" ]; then
        dashboard_name=$(basename "$dashboard" .json)
        echo -e "${BLUE}📈 Importing dashboard: $dashboard_name${NC}"

        curl -X POST \
            -H "Content-Type: application/json" \
            -u "admin:admin123" \
            -d @"$dashboard" \
            "http://localhost:3000/api/dashboards/db" \
            2>/dev/null && echo -e "${GREEN}✅ Dashboard $dashboard_name imported${NC}" || echo -e "${YELLOW}⚠️ Dashboard $dashboard_name import failed (might already exist)${NC}"
    fi
done

# Step 7: Final status check
echo -e "${BLUE}🔍 Step 7: Final status check...${NC}"

echo ""
echo -e "${GREEN}🎉 Monitoring stack activation complete!${NC}"
echo "============================================="
echo ""
echo -e "${BLUE}📊 Access URLs:${NC}"
echo -e "  • Grafana:      ${GREEN}http://localhost:3000${NC} (admin/admin123)"
echo -e "  • Prometheus:   ${GREEN}http://localhost:9090${NC}"
echo -e "  • Alertmanager: ${GREEN}http://localhost:9093${NC}"
echo -e "  • Loki:         ${GREEN}http://localhost:3100${NC}"
echo ""
echo -e "${BLUE}🔧 System Monitoring:${NC}"
echo -e "  • Node Exporter: ${GREEN}http://localhost:9100${NC}"
echo -e "  • cAdvisor:      ${GREEN}http://localhost:8080${NC} (Docker metrics)"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "  1. Add metrics endpoints to your services (/metrics)"
echo "  2. Configure custom alerts in Prometheus rules"
echo "  3. Set up notification channels in Alertmanager"
echo "  4. Create custom dashboards in Grafana"
echo ""
echo -e "${BLUE}🛠️  Management Commands:${NC}"
echo "  • Stop monitoring:  ${YELLOW}$COMPOSE_CMD down${NC}"
echo "  • View logs:        ${YELLOW}$COMPOSE_CMD logs -f [service]${NC}"
echo "  • Restart service:  ${YELLOW}$COMPOSE_CMD restart [service]${NC}"
echo ""
echo -e "${GREEN}✅ Monitoring activation completed successfully!${NC}"