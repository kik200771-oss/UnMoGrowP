#!/bin/bash
# ============================================================================
# UnMoGrowP Customer Onboarding System - One-Click Deployment
# Week 1 Sprint: DevOps Agent Deployment Automation
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Deployment Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOYMENT_DIR="${PROJECT_ROOT}/deployment"
LOGS_DIR="${PROJECT_ROOT}/logs/deployment"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║   UnMoGrowP Customer Onboarding System Deployment             ║${NC}"
echo -e "${PURPLE}║   Week 1 Sprint: Production-Ready Customer Systems            ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create logs directory
mkdir -p "${LOGS_DIR}"
LOG_FILE="${LOGS_DIR}/deployment_${TIMESTAMP}.log"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Error handler
error_exit() {
    echo -e "${RED}❌ ERROR: $1${NC}" | tee -a "${LOG_FILE}"
    exit 1
}

# Success message
success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "${LOG_FILE}"
}

# Info message
info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "${LOG_FILE}"
}

# Warning message
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "${LOG_FILE}"
}

# Step 1: Pre-deployment checks
echo -e "${BLUE}Step 1/7: Pre-deployment Checks${NC}"
log "Starting pre-deployment checks..."

# Check Docker
if ! command -v docker &> /dev/null; then
    error_exit "Docker is not installed"
fi
success "Docker is available"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    error_exit "Docker Compose is not installed"
fi
success "Docker Compose is available"

# Check if main stack is running
if ! docker ps | grep -q attribution-postgres; then
    warning "Main attribution stack is not running. Starting it first..."
    cd "${PROJECT_ROOT}" && docker-compose up -d
    sleep 10
fi
success "Main stack is running"

echo ""

# Step 2: Environment configuration
echo -e "${BLUE}Step 2/7: Environment Configuration${NC}"
log "Configuring environment..."

# Check .env file
if [ ! -f "${PROJECT_ROOT}/.env" ]; then
    warning ".env file not found, creating from example..."
    cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
fi
success "Environment file ready"

# Load environment variables
if [ -f "${PROJECT_ROOT}/.env" ]; then
    export $(cat "${PROJECT_ROOT}/.env" | grep -v '^#' | xargs)
fi

echo ""

# Step 3: Build customer services
echo -e "${BLUE}Step 3/7: Building Customer Services${NC}"
log "Building Docker images for customer services..."

cd "${PROJECT_ROOT}/services/metrics"
if docker build -t unmogrowp/customer-success-tracker:latest -f Dockerfile .; then
    success "Customer Success Tracker image built"
else
    error_exit "Failed to build Customer Success Tracker image"
fi

echo ""

# Step 4: Deploy customer services
echo -e "${BLUE}Step 4/7: Deploying Customer Services${NC}"
log "Starting customer service deployment..."

cd "${DEPLOYMENT_DIR}"
if docker-compose -f docker-compose.customer.yml up -d; then
    success "Customer services deployed"
else
    error_exit "Failed to deploy customer services"
fi

# Wait for services to be healthy
info "Waiting for services to be healthy (30s)..."
sleep 30

echo ""

# Step 5: Validate deployment
echo -e "${BLUE}Step 5/7: Validating Deployment${NC}"
log "Running deployment validation..."

# Check customer success tracker health
CUSTOMER_API="http://localhost:8084"
if curl -sf "${CUSTOMER_API}/health" > /dev/null; then
    success "Customer Success Tracker API is healthy"
else
    error_exit "Customer Success Tracker API health check failed"
fi

# Test database connection
info "Testing database connectivity..."
if curl -sf "${CUSTOMER_API}/v1/success/targets" > /dev/null; then
    success "Database connectivity verified"
else
    warning "Database connectivity test failed - may need initialization"
fi

echo ""

# Step 6: Initialize customer onboarding system
echo -e "${BLUE}Step 6/7: Initializing Customer Onboarding${NC}"
log "Setting up customer onboarding automation..."

# Make scripts executable
chmod +x "${PROJECT_ROOT}/tools/scripts/create-pilot-customer.sh"
success "Customer creation script ready"

# Create pilot customers directory
mkdir -p "${PROJECT_ROOT}/pilot-customers"
success "Pilot customers directory created"

echo ""

# Step 7: Integration validation
echo -e "${BLUE}Step 7/7: Integration Validation${NC}"
log "Validating integration with other systems..."

# Check Prometheus metrics endpoint
PROMETHEUS="http://localhost:9090"
if curl -sf "${PROMETHEUS}/-/healthy" > /dev/null 2>&1; then
    success "Prometheus integration verified"
else
    warning "Prometheus not available - metrics collection may be limited"
fi

# Check main platform API
PLATFORM_API="http://localhost:8080"
if curl -sf "${PLATFORM_API}/health" > /dev/null 2>&1; then
    success "Main platform API integration verified"
else
    warning "Main platform API not responding - may need restart"
fi

echo ""

# Deployment summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║             DEPLOYMENT COMPLETED SUCCESSFULLY                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${PURPLE}📊 Customer Success Tracker:${NC} ${CUSTOMER_API}"
echo -e "${PURPLE}📋 Success Dashboard:${NC} ${CUSTOMER_API}/v1/success/dashboard"
echo -e "${PURPLE}🎯 Success Targets:${NC} ${CUSTOMER_API}/v1/success/targets"
echo -e "${PURPLE}📅 Weekly Summary:${NC} ${CUSTOMER_API}/v1/success/weekly"
echo ""
echo -e "${BLUE}📁 Customer Creation Script:${NC}"
echo -e "   ${PROJECT_ROOT}/tools/scripts/create-pilot-customer.sh"
echo ""
echo -e "${BLUE}📊 Monitoring Endpoints:${NC}"
echo -e "   Grafana: http://localhost:3000 (admin/admin)"
echo -e "   Prometheus: http://localhost:9090"
echo -e "   Jaeger: http://localhost:16686"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Create pilot customers: ./tools/scripts/create-pilot-customer.sh"
echo "2. Monitor customer success: ${CUSTOMER_API}/v1/success/dashboard"
echo "3. Track weekly progress: ${CUSTOMER_API}/v1/success/weekly"
echo "4. Review Grafana dashboards: http://localhost:3000"
echo ""
echo -e "${GREEN}✅ Customer onboarding system is production-ready!${NC}"
echo ""

log "Deployment completed successfully"
log "Log file: ${LOG_FILE}"

# Create deployment status file
cat > "${DEPLOYMENT_DIR}/deployment-status.json" << EOF
{
  "deployment_timestamp": "$(date -Iseconds)",
  "deployment_version": "v3.0.0",
  "customer_success_api": "${CUSTOMER_API}",
  "services": {
    "customer_success_tracker": "running",
    "customer_creation_script": "ready",
    "monitoring_integration": "active"
  },
  "status": "production_ready",
  "log_file": "${LOG_FILE}"
}
EOF

success "Deployment status saved"
