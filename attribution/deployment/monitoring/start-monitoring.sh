#!/bin/bash

# UnMoGrowP Attribution Platform - Monitoring Stack Startup Script
# This script sets up and starts the complete monitoring infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.monitoring.yml"
HEALTH_CHECK_TIMEOUT=60
GRAFANA_PASSWORD="admin123"

echo -e "${BLUE}🚀 Starting UnMoGrowP Attribution Platform Monitoring Stack${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if port is available
check_port() {
    local port=$1
    local service=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        print_warning "Port $port is already in use (required for $service)"
        echo "Please stop the service using port $port or change the configuration"
        return 1
    fi
    return 0
}

# Function to wait for service health
wait_for_service() {
    local url=$1
    local service_name=$2
    local timeout=$3

    echo "Waiting for $service_name to be healthy..."
    local count=0

    while [ $count -lt $timeout ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_status "$service_name is healthy"
            return 0
        fi

        echo -n "."
        sleep 2
        ((count++))
    done

    print_error "$service_name failed to start within ${timeout} seconds"
    return 1
}

# Pre-flight checks
echo -e "\n${BLUE}📋 Pre-flight Checks${NC}"
echo "===================="

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi
print_status "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed"
    exit 1
fi
print_status "docker-compose is available"

# Check required ports
PORTS=(
    "9090:Prometheus"
    "3000:Grafana"
    "3100:Loki"
    "9093:AlertManager"
    "9100:Node Exporter"
    "8080:cAdvisor"
)

for port_service in "${PORTS[@]}"; do
    port=$(echo $port_service | cut -d: -f1)
    service=$(echo $port_service | cut -d: -f2)
    check_port $port "$service" || exit 1
done
print_status "All required ports are available"

# Check if config files exist
CONFIG_FILES=(
    "prometheus/prometheus.yml"
    "grafana/datasources/datasources.yml"
    "loki/loki.yml"
    "alertmanager/alertmanager.yml"
)

for config in "${CONFIG_FILES[@]}"; do
    if [ ! -f "$config" ]; then
        print_error "Required config file not found: $config"
        exit 1
    fi
done
print_status "All configuration files found"

# Create required directories
echo -e "\n${BLUE}📁 Creating Directories${NC}"
echo "========================"

DIRS=(
    "prometheus/data"
    "grafana/data"
    "loki/data"
    "alertmanager/data"
)

for dir in "${DIRS[@]}"; do
    mkdir -p "$dir"
    print_status "Created directory: $dir"
done

# Set permissions
chmod 777 prometheus/data grafana/data loki/data alertmanager/data
print_status "Set directory permissions"

# Start monitoring stack
echo -e "\n${BLUE}🐳 Starting Monitoring Stack${NC}"
echo "============================"

print_status "Pulling latest images..."
docker-compose -f $COMPOSE_FILE pull

print_status "Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo -e "\n${BLUE}🏥 Health Checks${NC}"
echo "================"

# Prometheus
wait_for_service "http://localhost:9090/-/healthy" "Prometheus" 30

# Loki
wait_for_service "http://localhost:3100/ready" "Loki" 30

# Grafana
wait_for_service "http://localhost:3000/api/health" "Grafana" 30

# AlertManager
wait_for_service "http://localhost:9093/-/healthy" "AlertManager" 30

# Check ML services are reachable (if running)
echo -e "\n${BLUE}🤖 ML Services Check${NC}"
echo "===================="

ML_SERVICES=(
    "8091:ML Analytics"
    "8086:Attribution ML"
    "8087:Fraud Detection"
    "8088:LTV Prediction"
)

for service in "${ML_SERVICES[@]}"; do
    port=$(echo $service | cut -d: -f1)
    name=$(echo $service | cut -d: -f2)

    if curl -s "http://localhost:$port/health" >/dev/null 2>&1; then
        print_status "$name is running and will be monitored"
    else
        print_warning "$name is not running (start it to enable monitoring)"
    fi
done

# Configure Grafana datasources and dashboards
echo -e "\n${BLUE}📊 Configuring Grafana${NC}"
echo "======================"

# Wait a bit more for Grafana to fully initialize
sleep 10

# The datasources and dashboards are automatically provisioned via volume mounts
print_status "Grafana datasources configured automatically"
print_status "Grafana dashboards imported automatically"

# Display access information
echo -e "\n${GREEN}🎉 Monitoring Stack Started Successfully!${NC}"
echo "========================================"
echo ""
echo "📊 Access URLs:"
echo "  Grafana:       http://localhost:3000 (admin/admin123)"
echo "  Prometheus:    http://localhost:9090"
echo "  AlertManager:  http://localhost:9093"
echo "  Loki:          http://localhost:3100"
echo ""
echo "📈 Grafana Dashboards:"
echo "  ML Overview:        http://localhost:3000/d/ml-overview"
echo "  ML Performance:     http://localhost:3000/d/ml-performance"
echo "  Business Metrics:   http://localhost:3000/d/business-metrics"
echo ""
echo "🚨 Alerts Configuration:"
echo "  View active alerts: http://localhost:9093/#/alerts"
echo "  Silence alerts:     http://localhost:9093/#/silences"
echo ""
echo "📋 Next Steps:"
echo "  1. Start your ML services to see metrics"
echo "  2. Check Grafana dashboards for data"
echo "  3. Configure alert notifications in AlertManager"
echo "  4. Review and customize alert rules as needed"
echo ""
echo "🛠️  Management Commands:"
echo "  Stop:    docker-compose -f $COMPOSE_FILE down"
echo "  Restart: docker-compose -f $COMPOSE_FILE restart"
echo "  Logs:    docker-compose -f $COMPOSE_FILE logs -f [service]"
echo ""
echo "📚 Documentation: ./README.md"

# Optional: Open Grafana in browser (uncomment for auto-open)
# if command -v xdg-open &> /dev/null; then
#     xdg-open "http://localhost:3000"
# elif command -v open &> /dev/null; then
#     open "http://localhost:3000"
# fi

echo -e "\n${GREEN}✨ Monitoring is ready! Happy monitoring! ✨${NC}"