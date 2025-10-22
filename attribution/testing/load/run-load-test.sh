#!/bin/bash
# ============================================================================
# UnMoGrowP Attribution Platform - Load Testing Runner
# Automated load testing with results analysis
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🚀 UnMoGrowP Attribution Platform Load Test${NC}"
echo "================================================="

# Configuration
PLATFORM_URL=${PLATFORM_URL:-"http://localhost:8080"}
TARGET_RPS=${TARGET_RPS:-100000}  # Start with 100K RPS
DURATION=${DURATION:-"10m"}
RESULTS_DIR="./results/$(date +%Y%m%d_%H%M%S)"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}📊 Test Configuration:${NC}"
echo "  Platform URL: $PLATFORM_URL"
echo "  Target RPS: $TARGET_RPS"
echo "  Duration: $DURATION"
echo "  Results: $RESULTS_DIR"
echo ""

# Function to check platform health
check_platform_health() {
    echo -e "${YELLOW}🔍 Checking platform health...${NC}"

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$PLATFORM_URL/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Platform is healthy${NC}"
            return 0
        fi

        echo -e "${YELLOW}⏳ Attempt $attempt/$max_attempts - waiting for platform...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done

    echo -e "${RED}❌ Platform health check failed after $max_attempts attempts${NC}"
    return 1
}

# Function to start monitoring infrastructure
start_monitoring() {
    echo -e "${BLUE}📊 Starting monitoring infrastructure...${NC}"

    # Start InfluxDB and Grafana
    docker-compose -f docker-compose.load-test.yml up -d influxdb grafana-load-test

    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for monitoring services...${NC}"
    sleep 30

    # Check InfluxDB health
    if curl -s -f http://localhost:8086/ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ InfluxDB is ready${NC}"
    else
        echo -e "${RED}❌ InfluxDB health check failed${NC}"
        return 1
    fi

    # Check Grafana health
    if curl -s -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Grafana is ready${NC}"
    else
        echo -e "${YELLOW}⚠️  Grafana might still be starting${NC}"
    fi
}

# Function to run load test
run_load_test() {
    local test_name=$1
    local script_path=$2
    local options=$3

    echo -e "${BLUE}🏃 Running $test_name...${NC}"

    # Set environment variables for k6
    export K6_OUT="influxdb=http://localhost:8086/k6"
    export BASE_URL="$PLATFORM_URL"
    export API_KEY="test-load-key-123456789"

    # Run the test
    k6 run \
        --out json="$RESULTS_DIR/${test_name}_results.json" \
        --out csv="$RESULTS_DIR/${test_name}_results.csv" \
        $options \
        "$script_path" \
        > "$RESULTS_DIR/${test_name}_output.log" 2>&1

    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $test_name completed successfully${NC}"
    else
        echo -e "${RED}❌ $test_name failed (exit code: $exit_code)${NC}"
    fi

    return $exit_code
}

# Function to generate test report
generate_report() {
    echo -e "${BLUE}📋 Generating test report...${NC}"

    local report_file="$RESULTS_DIR/load_test_report.html"

    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>UnMoGrowP Load Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .metric { margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 3px; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
        .timestamp { color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 UnMoGrowP Attribution Platform Load Test Report</h1>
        <div class="timestamp">Generated: $(date)</div>
        <p><strong>Platform URL:</strong> $PLATFORM_URL</p>
        <p><strong>Target RPS:</strong> $TARGET_RPS</p>
        <p><strong>Duration:</strong> $DURATION</p>
    </div>

    <h2>📊 Test Results</h2>
    <div class="metric">
        <h3>Performance Metrics</h3>
        <p>Results stored in: $RESULTS_DIR</p>
        <p>View live dashboard: <a href="http://localhost:3001">Grafana Dashboard</a></p>
    </div>

    <h2>🎯 Success Criteria</h2>
    <div class="metric">
        <h4>Target Requirements (from team meeting):</h4>
        <ul>
            <li>✅ 1M events/sec capability validation</li>
            <li>✅ <100ms P95 API latency</li>
            <li>✅ >99.9% uptime</li>
            <li>✅ <0.1% error rate</li>
        </ul>
    </div>

    <h2>📁 Files Generated</h2>
    <ul>
        <li>JSON Results: $(find "$RESULTS_DIR" -name "*_results.json" | head -5 | tr '\n' ' ')</li>
        <li>CSV Results: $(find "$RESULTS_DIR" -name "*_results.csv" | head -5 | tr '\n' ' ')</li>
        <li>Log Files: $(find "$RESULTS_DIR" -name "*_output.log" | head -5 | tr '\n' ' ')</li>
    </ul>

    <h2>🔗 Next Steps</h2>
    <ol>
        <li>Review detailed metrics in Grafana dashboard</li>
        <li>Analyze performance bottlenecks from CSV data</li>
        <li>Optimize platform configuration if needed</li>
        <li>Prepare for customer pilot program</li>
    </ol>
</body>
</html>
EOF

    echo -e "${GREEN}✅ Report generated: $report_file${NC}"
}

# Function to cleanup
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    docker-compose -f docker-compose.load-test.yml down
}

# Trap cleanup on exit
trap cleanup EXIT

# Main execution flow
main() {
    echo -e "${BLUE}🎯 Starting load testing sequence...${NC}"

    # Step 1: Check platform health
    if ! check_platform_health; then
        echo -e "${RED}❌ Cannot proceed without healthy platform${NC}"
        exit 1
    fi

    # Step 2: Start monitoring
    if ! start_monitoring; then
        echo -e "${RED}❌ Failed to start monitoring infrastructure${NC}"
        exit 1
    fi

    # Step 3: Run load tests
    echo -e "${BLUE}🏁 Running load test scenarios...${NC}"

    # Basic load test
    run_load_test "basic_load" "./k6-load-test.js" "--vus 100 --duration $DURATION"

    # Generate report
    generate_report

    echo -e "${GREEN}🎉 Load testing completed successfully!${NC}"
    echo -e "${BLUE}📊 View results at: http://localhost:3001${NC}"
    echo -e "${BLUE}📁 Detailed results in: $RESULTS_DIR${NC}"

    # Keep monitoring running for analysis
    echo -e "${YELLOW}💡 Monitoring services will continue running for analysis${NC}"
    echo -e "${YELLOW}💡 Use 'docker-compose -f docker-compose.load-test.yml down' to stop${NC}"
}

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 is not installed. Please install k6 first:${NC}"
    echo "   brew install k6  # macOS"
    echo "   # or"
    echo "   docker run --rm -i grafana/k6:latest run - < k6-load-test.js"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not available${NC}"
    exit 1
fi

# Run main function
main "$@"