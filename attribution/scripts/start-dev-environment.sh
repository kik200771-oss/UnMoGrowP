#!/bin/bash

# ============================================================================
# UnMoGrowP Attribution Platform - Development Environment Starter
# Complete setup and launch script for local development
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local service=$1
    local host=$2
    local port=$3
    local timeout=60
    local count=0

    print_status "Waiting for $service to be ready at $host:$port..."

    while [ $count -lt $timeout ]; do
        if nc -z $host $port 2>/dev/null; then
            print_success "$service is ready!"
            return 0
        fi
        sleep 2
        count=$((count + 2))
    done

    print_error "$service failed to start within $timeout seconds"
    return 1
}

# Function to check service health
check_health() {
    local service=$1
    local url=$2

    print_status "Checking $service health..."

    if curl -f $url >/dev/null 2>&1; then
        print_success "$service is healthy"
        return 0
    else
        print_warning "$service health check failed"
        return 1
    fi
}

# Main function
main() {
    echo "🚀 UnMoGrowP Attribution Platform - Development Environment"
    echo "════════════════════════════════════════════════════════"

    # Check prerequisites
    print_status "Checking prerequisites..."

    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    if ! command_exists go; then
        print_warning "Go is not installed. Backend compilation may fail."
    fi

    if ! command_exists node; then
        print_warning "Node.js is not installed. Frontend may fail to build."
    fi

    print_success "Prerequisites check completed"

    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.dev.yml down --remove-orphans || true

    # Pull latest images
    print_status "Pulling latest images..."
    docker-compose -f docker-compose.dev.yml pull

    # Build custom images
    print_status "Building application images..."
    docker-compose -f docker-compose.dev.yml build --no-cache

    # Start infrastructure services first
    print_status "Starting infrastructure services..."
    docker-compose -f docker-compose.dev.yml up -d zookeeper postgres redis clickhouse

    # Wait for infrastructure services
    wait_for_service "PostgreSQL" localhost 5432
    wait_for_service "Redis" localhost 6379
    wait_for_service "ClickHouse" localhost 8123
    wait_for_service "Zookeeper" localhost 2181

    # Start Kafka
    print_status "Starting Kafka..."
    docker-compose -f docker-compose.dev.yml up -d kafka

    # Wait for Kafka
    wait_for_service "Kafka" localhost 9092

    # Start monitoring services
    print_status "Starting monitoring services..."
    docker-compose -f docker-compose.dev.yml up -d prometheus grafana jaeger

    # Wait for monitoring services
    wait_for_service "Prometheus" localhost 9090
    wait_for_service "Grafana" localhost 3001
    wait_for_service "Jaeger" localhost 16686

    # Start application services
    print_status "Starting application services..."
    docker-compose -f docker-compose.dev.yml up -d api-gateway web-ui

    # Wait for application services
    wait_for_service "API Gateway" localhost 8080
    wait_for_service "Web UI" localhost 3000

    # Start admin tools
    print_status "Starting admin tools..."
    docker-compose -f docker-compose.dev.yml up -d adminer kafka-ui redis-commander

    # Wait a bit for everything to stabilize
    print_status "Waiting for services to stabilize..."
    sleep 10

    # Health checks
    print_status "Performing health checks..."

    check_health "API Gateway" "http://localhost:8080/health"
    check_health "Web UI" "http://localhost:3000"
    check_health "Prometheus" "http://localhost:9090/-/healthy"
    check_health "Grafana" "http://localhost:3001/api/health"

    # Display service information
    echo ""
    echo "🎉 UnMoGrowP Attribution Platform is ready!"
    echo "══════════════════════════════════════════"
    echo ""
    echo "📱 Application Services:"
    echo "   • Web UI:         http://localhost:3000"
    echo "   • API Gateway:    http://localhost:8080"
    echo "   • API Docs:       http://localhost:8080/api/docs"
    echo ""
    echo "📊 Monitoring & Observability:"
    echo "   • Prometheus:     http://localhost:9090"
    echo "   • Grafana:        http://localhost:3001 (admin/admin)"
    echo "   • Jaeger:         http://localhost:16686"
    echo ""
    echo "🛠️  Admin Tools:"
    echo "   • Adminer:        http://localhost:8081"
    echo "   • Kafka UI:       http://localhost:8082"
    echo "   • Redis Cmd:      http://localhost:8083"
    echo ""
    echo "🗃️  Databases:"
    echo "   • PostgreSQL:     localhost:5432"
    echo "   • ClickHouse:     localhost:8123 / localhost:9000"
    echo "   • Redis:          localhost:6379"
    echo ""
    echo "🔄 Streaming:"
    echo "   • Kafka:          localhost:9092"
    echo "   • Zookeeper:      localhost:2181"
    echo ""
    echo "📝 Logs: docker-compose -f docker-compose.dev.yml logs -f [service]"
    echo "🛑 Stop: docker-compose -f docker-compose.dev.yml down"
    echo ""
    print_success "Development environment is ready for use!"

    # Optional: Run load test
    if [ "$1" = "--with-load-test" ]; then
        print_status "Running load test..."
        docker-compose -f docker-compose.dev.yml --profile testing up k6
    fi

    # Optional: Follow logs
    if [ "$1" = "--follow-logs" ] || [ "$2" = "--follow-logs" ]; then
        print_status "Following logs... (Ctrl+C to stop)"
        docker-compose -f docker-compose.dev.yml logs -f api-gateway web-ui
    fi
}

# Handle script arguments
case "$1" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --with-load-test    Run K6 load test after startup"
        echo "  --follow-logs       Follow application logs after startup"
        echo "  --help, -h          Show this help message"
        echo ""
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac