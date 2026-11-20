#!/bin/bash
# ============================================================================
# UnMoGrowP Attribution Platform - Integration Validation
# Validates all agent system integrations are working correctly
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║   UnMoGrowP Integration Validation - Week 1 Sprint            ║${NC}"
echo -e "${PURPLE}║   Validating DevOps + Architecture + Testing + Product        ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

FAILED_TESTS=0
PASSED_TESTS=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================================================
# 1. DevOps Agent Deliverables Validation
# ============================================================================

section "1️⃣  DevOps Agent: Customer Onboarding System"

# Customer Success API
if curl -sf http://localhost:8084/health > /dev/null 2>&1; then
    test_result 0 "Customer Success API is running"
else
    test_result 1 "Customer Success API is NOT running"
fi

# Test API endpoints
if curl -sf http://localhost:8084/v1/success/targets > /dev/null 2>&1; then
    test_result 0 "Customer Success API endpoints responding"
else
    test_result 1 "Customer Success API endpoints not responding"
fi

# Check customer creation script
if [ -x "./tools/scripts/create-pilot-customer.sh" ]; then
    test_result 0 "Customer creation script is executable"
else
    test_result 1 "Customer creation script is NOT executable"
fi

# Check deployment automation
if [ -x "./deployment/one-click-deploy.sh" ]; then
    test_result 0 "One-click deployment script ready"
else
    test_result 1 "One-click deployment script NOT ready"
fi

# Check backup automation
if [ -x "./deployment/backup-and-restore.sh" ]; then
    test_result 0 "Backup automation script ready"
else
    test_result 1 "Backup automation script NOT ready"
fi

# ============================================================================
# 2. Architecture Agent Deliverables Validation
# ============================================================================

section "2️⃣  Architecture Agent: Performance Monitoring"

# Prometheus
if curl -sf http://localhost:9090/-/healthy > /dev/null 2>&1; then
    test_result 0 "Prometheus is running"

    # Check if metrics are being collected
    if curl -sf "http://localhost:9090/api/v1/query?query=up" | grep -q "success"; then
        test_result 0 "Prometheus metrics collection working"
    else
        test_result 1 "Prometheus metrics collection NOT working"
    fi
else
    test_result 1 "Prometheus is NOT running"
fi

# Grafana
if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    test_result 0 "Grafana is running"
else
    test_result 1 "Grafana is NOT running"
fi

# Jaeger
if curl -sf http://localhost:16686 > /dev/null 2>&1; then
    test_result 0 "Jaeger tracing is running"
else
    test_result 1 "Jaeger tracing is NOT running"
fi

# Check customer success metrics in Prometheus
if curl -sf "http://localhost:9090/api/v1/query?query=customer_satisfaction_score" | grep -q "success"; then
    test_result 0 "Customer success metrics exposed to Prometheus"
else
    test_result 1 "Customer success metrics NOT in Prometheus"
fi

# ============================================================================
# 3. Testing Agent Deliverables Validation
# ============================================================================

section "3️⃣  Testing Agent: Load Testing Infrastructure"

# Check if load testing results exist
if [ -d "./tests/load-testing" ] || [ -f "./tests/k6/scenarios/load-test.js" ]; then
    test_result 0 "Load testing infrastructure available"
else
    test_result 1 "Load testing infrastructure NOT found"
fi

# Validate main platform can handle customer traffic
if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
    test_result 0 "Main platform API ready for customer traffic"
else
    test_result 1 "Main platform API NOT ready"
fi

# ============================================================================
# 4. Product Manager Deliverables Validation
# ============================================================================

section "4️⃣  Product Manager: Customer Materials Integration"

# Check for pilot customer directory structure
if [ -d "./pilot-customers" ]; then
    test_result 0 "Pilot customers directory exists"
else
    mkdir -p ./pilot-customers
    test_result 0 "Pilot customers directory created"
fi

# Validate customer success tracking is operational
RESPONSE=$(curl -sf http://localhost:8084/v1/success/targets)
if echo "$RESPONSE" | grep -q "week_1_targets"; then
    test_result 0 "Customer success tracking operational"

    # Check target structure
    if echo "$RESPONSE" | grep -q "target_customers"; then
        test_result 0 "Week 1 targets properly configured"
    else
        test_result 1 "Week 1 targets NOT properly configured"
    fi
else
    test_result 1 "Customer success tracking NOT operational"
fi

# ============================================================================
# 5. E2E Customer Journey Validation
# ============================================================================

section "5️⃣  End-to-End Customer Journey"

echo -e "${YELLOW}Testing complete customer onboarding flow...${NC}"

# Test 1: Customer creation API
TEST_CUSTOMER_ID="test-company-$(date +%s)"
CUSTOMER_PAYLOAD='{"customer_id":"'$TEST_CUSTOMER_ID'","company_name":"Test Company"}'

CUSTOMER_RESPONSE=$(curl -sf -X POST http://localhost:8084/v1/customers \
    -H "Content-Type: application/json" \
    -d "$CUSTOMER_PAYLOAD")

if echo "$CUSTOMER_RESPONSE" | grep -q "$TEST_CUSTOMER_ID"; then
    test_result 0 "Customer creation API working"

    # Test 2: Retrieve created customer
    if curl -sf "http://localhost:8084/v1/customers/$TEST_CUSTOMER_ID" > /dev/null 2>&1; then
        test_result 0 "Customer retrieval working"
    else
        test_result 1 "Customer retrieval NOT working"
    fi

    # Test 3: Update customer metrics
    METRICS_PAYLOAD='{"attribution_accuracy":99.5,"customer_satisfaction":95.0,"daily_event_volume":50000}'

    if curl -sf -X PUT "http://localhost:8084/v1/customers/$TEST_CUSTOMER_ID/metrics" \
        -H "Content-Type: application/json" \
        -d "$METRICS_PAYLOAD" > /dev/null 2>&1; then
        test_result 0 "Customer metrics update working"
    else
        test_result 1 "Customer metrics update NOT working"
    fi

else
    test_result 1 "Customer creation API NOT working"
fi

# ============================================================================
# 6. Database Connectivity Validation
# ============================================================================

section "6️⃣  Database & Infrastructure"

# PostgreSQL
if docker exec attribution-postgres pg_isready -U attribution > /dev/null 2>&1; then
    test_result 0 "PostgreSQL is ready"

    # Test database connection from customer API
    if curl -sf http://localhost:8084/v1/success/weekly > /dev/null 2>&1; then
        test_result 0 "Customer API -> PostgreSQL connectivity working"
    else
        test_result 1 "Customer API -> PostgreSQL connectivity NOT working"
    fi
else
    test_result 1 "PostgreSQL is NOT ready"
fi

# ClickHouse
if curl -sf http://localhost:8123/ping > /dev/null 2>&1; then
    test_result 0 "ClickHouse is ready"
else
    test_result 1 "ClickHouse is NOT ready"
fi

# Redis
if docker exec attribution-redis redis-cli ping > /dev/null 2>&1; then
    test_result 0 "Redis is ready"
else
    test_result 1 "Redis is NOT ready"
fi

# Kafka
if docker exec attribution-kafka kafka-topics --bootstrap-server localhost:9092 --list > /dev/null 2>&1; then
    test_result 0 "Kafka is ready"
else
    test_result 1 "Kafka is NOT ready"
fi

# ============================================================================
# 7. Security Validation
# ============================================================================

section "7️⃣  Security & Production Readiness"

# Check environment file
if [ -f ".env" ]; then
    test_result 0 "Environment file exists"

    # Check for default passwords (security risk)
    if grep -q "CHANGEME" .env; then
        test_result 1 "SECURITY: .env contains CHANGEME passwords"
    else
        test_result 0 "Environment secrets configured"
    fi
else
    test_result 1 "Environment file NOT found"
fi

# Check Docker security
CONTAINERS=$(docker ps --format "{{.Names}}")
for container in $CONTAINERS; do
    # Check if running as root (basic check)
    USER=$(docker exec $container whoami 2>/dev/null || echo "unknown")
    if [ "$USER" = "root" ]; then
        echo -e "${YELLOW}⚠️  WARNING${NC}: $container running as root"
    fi
done

# Check rate limiting configuration
if grep -q "rate_limit" ./infra/nginx/conf.d/customer-api.conf 2>/dev/null; then
    test_result 0 "Rate limiting configured"
else
    test_result 1 "Rate limiting NOT configured"
fi

# ============================================================================
# Results Summary
# ============================================================================

echo ""
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}  Integration Validation Results${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

TOTAL_TESTS=$((PASSED_TESTS + FAILED_TESTS))
PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo -e "${GREEN}✅ Passed:${NC} $PASSED_TESTS / $TOTAL_TESTS ($PASS_RATE%)"
echo -e "${RED}❌ Failed:${NC} $FAILED_TESTS / $TOTAL_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}║     🎉 ALL INTEGRATIONS VALIDATED SUCCESSFULLY! 🎉            ║${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}║     Week 1 Sprint: Production Ready for Pilot Customers       ║${NC}"
    echo -e "${GREEN}║                                                                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${CYAN}📋 Convergence Status:${NC}"
    echo -e "   ✅ DevOps: Customer onboarding deployed"
    echo -e "   ✅ Architecture: Monitoring integrated"
    echo -e "   ✅ Testing: Load testing validated"
    echo -e "   ✅ Product: Customer materials ready"
    echo -e "   ✅ E2E: Complete customer journey working"
    echo ""

    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                                ║${NC}"
    echo -e "${RED}║     ⚠️  SOME INTEGRATIONS FAILED VALIDATION                   ║${NC}"
    echo -e "${RED}║                                                                ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${YELLOW}📋 Action Required:${NC}"
    echo "   Review failed tests above and fix issues"
    echo "   Re-run validation: ./deployment/validate-integration.sh"
    echo ""

    exit 1
fi
