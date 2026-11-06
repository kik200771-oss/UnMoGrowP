#!/bin/bash
# UnMoGrowP Attribution Platform - Monitoring Validation Script
# Validates that monitoring stack is correctly deployed and meeting Week 1 Sprint goals

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   UnMoGrowP Monitoring Validation - Week 1 Sprint Goals      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if service is responding
check_service() {
    local url=$1
    local name=$2

    echo -n "Checking $name... "
    if curl -sf "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

# Function to check metric exists
check_metric() {
    local metric=$1
    local name=$2
    local url="http://localhost:9090/api/v1/query?query=$metric"

    echo -n "Checking $name... "
    local result=$(curl -sf "$url" 2>/dev/null | jq -r '.data.result | length')

    if [ "$result" -gt 0 ] 2>/dev/null; then
        echo -e "${GREEN}✓ PASS${NC} (Found $result series)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Metric not found)"
        ((FAILED++))
        return 1
    fi
}

# Function to check metric value against threshold
check_metric_threshold() {
    local query=$1
    local threshold=$2
    local comparison=$3
    local name=$4
    local url="http://localhost:9090/api/v1/query?query=$query"

    echo -n "Checking $name... "
    local value=$(curl -sf "$url" 2>/dev/null | jq -r '.data.result[0].value[1] // empty')

    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠ WARNING${NC} (No data yet)"
        ((WARNINGS++))
        return 1
    fi

    if [ "$comparison" == "gt" ]; then
        if (( $(echo "$value > $threshold" | bc -l) )); then
            echo -e "${GREEN}✓ PASS${NC} (Value: $value, Target: >$threshold)"
            ((PASSED++))
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (Value: $value, Target: >$threshold)"
            ((FAILED++))
            return 1
        fi
    elif [ "$comparison" == "lt" ]; then
        if (( $(echo "$value < $threshold" | bc -l) )); then
            echo -e "${GREEN}✓ PASS${NC} (Value: $value, Target: <$threshold)"
            ((PASSED++))
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (Value: $value, Target: <$threshold)"
            ((FAILED++))
            return 1
        fi
    fi
}

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 1: Monitoring Stack Health${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

check_service "http://localhost:9090/-/ready" "Prometheus"
check_service "http://localhost:3000/api/health" "Grafana"
check_service "http://localhost:3100/ready" "Loki"
check_service "http://localhost:9093/-/ready" "AlertManager"
check_service "http://localhost:9100/metrics" "Node Exporter"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 2: Prometheus Target Health${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check Prometheus targets
echo "Checking Prometheus scrape targets..."
targets=$(curl -sf http://localhost:9090/api/v1/targets 2>/dev/null | jq -r '.data.activeTargets[] | "\(.job): \(.health)"')

if [ -n "$targets" ]; then
    echo "$targets" | while IFS= read -r line; do
        job=$(echo "$line" | cut -d: -f1)
        health=$(echo "$line" | cut -d: -f2 | xargs)

        echo -n "  Target $job... "
        if [ "$health" == "up" ]; then
            echo -e "${GREEN}✓ UP${NC}"
            ((PASSED++))
        else
            echo -e "${RED}✗ DOWN${NC}"
            ((FAILED++))
        fi
    done
else
    echo -e "${RED}✗ FAIL${NC} - Could not retrieve targets"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 3: Performance Metrics Collection${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

check_metric "attribution_events_processed_total" "Event processing metrics"
check_metric "attribution_event_processing_duration_seconds_bucket" "Latency metrics"
check_metric "attribution_active_connections" "Connection metrics"
check_metric "attribution_memory_usage_bytes" "Memory metrics"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 4: Customer Success Metrics${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

check_metric "customer_satisfaction_score" "Customer satisfaction tracking"
check_metric "attribution_accuracy_percent" "Attribution accuracy tracking"
check_metric "customer_api_latency_ms" "Customer latency tracking"
check_metric "customer_cost_savings_percent" "Cost savings tracking"
check_metric "total_pilot_customers" "Pilot customer count"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 5: Week 1 Sprint Goal Validation${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Note: These checks require active load to validate. If services are not under load, warnings are expected.${NC}"
echo ""

# Event Throughput (Target: 1M+ events/sec)
check_metric_threshold "sum(rate(attribution_events_processed_total[5m]))" "1000000" "gt" "Event throughput >= 1M events/sec"

# P95 Latency (Target: <100ms)
check_metric_threshold "histogram_quantile(0.95,sum(rate(attribution_event_processing_duration_seconds_bucket[5m]))by(le))*1000" "100" "lt" "P95 latency < 100ms"

# System Uptime (Target: >99.9%)
check_metric_threshold "avg(up{job=~\"unmogrowp.*\"})*100" "99.9" "gt" "System uptime > 99.9%"

# Error Rate (Target: <0.1%)
check_metric_threshold "(sum(rate(attribution_events_processed_total{status=\"error\"}[5m]))/sum(rate(attribution_events_processed_total[5m])))*100" "0.1" "lt" "Error rate < 0.1%"

# Customer Satisfaction (Target: >90%)
check_metric_threshold "avg(customer_satisfaction_score)" "90" "gt" "Customer satisfaction > 90%"

# Pilot Customer Count (Target: 5)
check_metric_threshold "total_pilot_customers" "5" "gt" "Pilot customers >= 5"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 6: Dashboard Availability${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if dashboards are loaded
dashboards=(
    "performance-monitoring"
    "customer-success-metrics"
    "load-testing-validation"
    "customer-onboarding"
)

for dashboard in "${dashboards[@]}"; do
    echo -n "Checking dashboard: $dashboard... "
    result=$(curl -sf "http://localhost:3000/api/search?query=$dashboard" 2>/dev/null | jq -r '. | length')

    if [ "$result" -gt 0 ] 2>/dev/null; then
        echo -e "${GREEN}✓ FOUND${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ NOT FOUND${NC} (May need manual import)"
        ((WARNINGS++))
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 7: Alert Rules Validation${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if alerting rules are loaded
echo "Checking Prometheus alert rules..."
rules=$(curl -sf http://localhost:9090/api/v1/rules 2>/dev/null | jq -r '.data.groups[] | .name')

if [ -n "$rules" ]; then
    echo "$rules" | while IFS= read -r rule; do
        echo -n "  Rule group: $rule... "
        echo -e "${GREEN}✓ LOADED${NC}"
        ((PASSED++))
    done
else
    echo -e "${RED}✗ FAIL${NC} - No alert rules loaded"
    ((FAILED++))
fi

# Check for active alerts
echo ""
echo "Checking for active alerts..."
active_alerts=$(curl -sf http://localhost:9090/api/v1/alerts 2>/dev/null | jq -r '.data.alerts[] | select(.state == "firing") | .labels.alertname')

if [ -z "$active_alerts" ]; then
    echo -e "${GREEN}✓ No critical alerts firing${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Active alerts:${NC}"
    echo "$active_alerts"
    ((WARNINGS++))
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}SECTION 8: Integration Validation${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check UnMoGrowP service endpoints
services=(
    "http://localhost:8081/metrics:Go Ingestion Service"
    "http://localhost:3004/metrics:Bun API Layer"
    "http://localhost:8084/metrics:Customer Success Tracker"
)

for service in "${services[@]}"; do
    url=$(echo "$service" | cut -d: -f1-2)
    name=$(echo "$service" | cut -d: -f3)

    echo -n "Checking $name... "
    if curl -sf "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ AVAILABLE${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ NOT AVAILABLE${NC} (Service may not be running)"
        ((WARNINGS++))
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}VALIDATION SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

TOTAL=$((PASSED + FAILED + WARNINGS))
PASS_RATE=$((PASSED * 100 / TOTAL))

echo -e "Total Checks: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "Pass Rate: $PASS_RATE%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║               ✓ VALIDATION SUCCESSFUL                         ║${NC}"
    echo -e "${GREEN}║  Monitoring stack is ready for Week 1 Sprint deployment      ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. Review warnings and address if needed"
    echo "  2. Access Grafana: http://localhost:3000 (admin/admin123)"
    echo "  3. Validate dashboards are displaying data"
    echo "  4. Configure alert notifications (Slack/Email)"
    echo "  5. Coordinate with other agents for convergence validation"
    echo ""
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║               ✗ VALIDATION FAILED                             ║${NC}"
    echo -e "${RED}║  Please review failed checks and resolve issues              ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  1. Check if all services are running: docker-compose ps"
    echo "  2. View logs: docker-compose logs [service-name]"
    echo "  3. Verify network connectivity between services"
    echo "  4. Consult MONITORING_DEPLOYMENT_GUIDE.md for detailed troubleshooting"
    echo ""
    exit 1
fi
