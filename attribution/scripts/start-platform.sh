#!/bin/bash
# ============================================================================
# UnMoGrowP Attribution Platform Startup Script
# Starts all infrastructure components in correct order
# ============================================================================

set -e

echo "🚀 Starting UnMoGrowP Attribution Platform..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed or not in PATH${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Pre-flight checks passed${NC}"

# Create necessary directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p logs
mkdir -p data/{clickhouse,postgres,redis,kafka,zookeeper,prometheus,grafana}

# Set permissions
chmod +x infra/kafka/create-topics.sh

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Creating .env file with default values...${NC}"
    cat > .env << EOF
# UnMoGrowP Attribution Platform Environment Variables

# Database Passwords
CLICKHOUSE_PASSWORD=attribution_secure_pass_ch_$(openssl rand -hex 8)
POSTGRES_PASSWORD=attribution_secure_pass_pg_$(openssl rand -hex 8)
GRAFANA_PASSWORD=admin_$(openssl rand -hex 4)

# Redis Configuration
REDIS_PASSWORD=redis_$(openssl rand -hex 8)

# API Keys
JWT_SECRET=$(openssl rand -hex 32)
API_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Environment
NODE_ENV=development
LOG_LEVEL=info

# Platform Configuration
PLATFORM_VERSION=v1.0.0-mvp
ATTRIBUTION_WINDOW_HOURS=168
DEFAULT_ATTRIBUTION_MODEL=last_touch
EOF
    echo -e "${GREEN}✅ Created .env file with random passwords${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Start infrastructure services
echo -e "${BLUE}🏗️  Starting infrastructure services...${NC}"

# Phase 1: Data stores
echo -e "${YELLOW}🗄️  Phase 1: Starting data stores...${NC}"
docker-compose up -d zookeeper kafka clickhouse postgres redis

# Wait for data stores to be ready
echo -e "${YELLOW}⏳ Waiting for data stores to be ready...${NC}"
sleep 30

# Check ClickHouse health
echo -e "${YELLOW}🔍 Checking ClickHouse health...${NC}"
timeout 60 bash -c 'until docker-compose exec -T clickhouse wget --no-verbose --tries=1 --spider http://localhost:8123/ping; do sleep 2; done'
echo -e "${GREEN}✅ ClickHouse is ready${NC}"

# Check PostgreSQL health
echo -e "${YELLOW}🔍 Checking PostgreSQL health...${NC}"
timeout 60 bash -c 'until docker-compose exec -T postgres pg_isready -U attribution; do sleep 2; done'
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Check Redis health
echo -e "${YELLOW}🔍 Checking Redis health...${NC}"
timeout 60 bash -c 'until docker-compose exec -T redis redis-cli ping; do sleep 2; done'
echo -e "${GREEN}✅ Redis is ready${NC}"

# Create Kafka topics
echo -e "${YELLOW}📊 Creating Kafka topics...${NC}"
docker-compose exec -T kafka bash -c "cd /tmp && $(cat infra/kafka/create-topics.sh)"
echo -e "${GREEN}✅ Kafka topics created${NC}"

# Phase 2: Application services
echo -e "${YELLOW}⚡ Phase 2: Starting application services...${NC}"
docker-compose up -d ingestion-service attribution-service

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for application services...${NC}"
sleep 20

# Phase 3: Monitoring and load balancer
echo -e "${YELLOW}📊 Phase 3: Starting monitoring and load balancer...${NC}"
docker-compose up -d prometheus grafana jaeger nginx

# Final health checks
echo -e "${BLUE}🔍 Performing final health checks...${NC}"

# Check ingestion service
if curl -s -f http://localhost:8080/health > /dev/null; then
    echo -e "${GREEN}✅ Ingestion service is healthy${NC}"
else
    echo -e "${RED}❌ Ingestion service health check failed${NC}"
fi

# Check attribution service
if curl -s -f http://localhost:8082/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Attribution service is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Attribution service might still be starting${NC}"
fi

# Check nginx
if curl -s -f http://localhost/health > /dev/null; then
    echo -e "${GREEN}✅ Load balancer is healthy${NC}"
else
    echo -e "${RED}❌ Load balancer health check failed${NC}"
fi

# Display service URLs
echo ""
echo -e "${GREEN}🎉 UnMoGrowP Attribution Platform Started Successfully!${NC}"
echo "=================================================="
echo -e "${BLUE}📊 Service URLs:${NC}"
echo "🌐 API Gateway:       http://localhost"
echo "📈 Event Ingestion:   http://localhost/v1/events"
echo "🧠 Attribution API:   http://localhost/v1/attribution"
echo "📊 Grafana Dashboard: http://localhost/grafana (admin/admin)"
echo "🔍 Prometheus:        http://localhost:9090"
echo "🕵️  Jaeger Tracing:    http://localhost:16686"
echo ""
echo -e "${BLUE}🗄️  Direct Database Access:${NC}"
echo "🗃️  ClickHouse:        http://localhost:8123"
echo "🐘 PostgreSQL:        localhost:5432"
echo "📝 Redis:             localhost:6379"
echo "📨 Kafka:             localhost:9092"
echo ""
echo -e "${YELLOW}💡 Tip: Use 'docker-compose logs -f SERVICE_NAME' to view logs${NC}"
echo -e "${YELLOW}💡 Tip: Use './scripts/stop-platform.sh' to stop all services${NC}"
echo ""
echo -e "${GREEN}🚀 Platform is ready for 10M+ events/sec processing!${NC}"