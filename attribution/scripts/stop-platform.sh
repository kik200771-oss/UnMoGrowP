#!/bin/bash
# ============================================================================
# UnMoGrowP Attribution Platform Stop Script
# Gracefully stops all services
# ============================================================================

set -e

echo "🛑 Stopping UnMoGrowP Attribution Platform..."
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stop services in reverse order
echo -e "${YELLOW}🔄 Stopping services gracefully...${NC}"

# Phase 1: Stop load balancer and monitoring
echo -e "${BLUE}Phase 1: Stopping load balancer and monitoring...${NC}"
docker-compose stop nginx grafana prometheus jaeger

# Phase 2: Stop application services
echo -e "${BLUE}Phase 2: Stopping application services...${NC}"
docker-compose stop ingestion-service attribution-service

# Phase 3: Stop data stores
echo -e "${BLUE}Phase 3: Stopping data stores...${NC}"
docker-compose stop kafka zookeeper redis postgres clickhouse

echo -e "${GREEN}✅ All services stopped successfully${NC}"

# Option to remove containers and volumes
read -p "Do you want to remove containers and volumes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️  Removing containers and volumes...${NC}"
    docker-compose down -v --remove-orphans
    echo -e "${GREEN}✅ Containers and volumes removed${NC}"
else
    echo -e "${BLUE}📦 Containers preserved for restart${NC}"
fi

echo -e "${GREEN}🏁 UnMoGrowP Attribution Platform stopped${NC}"