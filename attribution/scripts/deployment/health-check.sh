#!/bin/bash
# =============================================================================
# UnMoGrowP Attribution Platform - Health Check Script
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Default values
ENVIRONMENT="production"
DETAILED="false"
CONTINUOUS="false"
INTERVAL="30"
OUTPUT_FORMAT="text"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_critical() {
    echo -e "${PURPLE}[CRITICAL]${NC} $1"
}

log_header() {
    echo -e "${CYAN}[HEADER]${NC} $1"
}

# Usage function
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

UnMoGrowP Attribution Platform - Health Check Script

OPTIONS:
    -e, --environment ENV    Environment to check (production, staging, local) [default: production]
    -d, --detailed          Show detailed health information
    -c, --continuous        Run continuous health monitoring
    -i, --interval SEC      Interval for continuous monitoring in seconds [default: 30]
    -f, --format FORMAT     Output format (text, json) [default: text]
    -h, --help              Show this help message

EXAMPLES:
    $0                              # Quick health check for production
    $0 -e staging -d                # Detailed health check for staging
    $0 -c -i 60                     # Continuous monitoring every 60 seconds
    $0 -f json                      # Output in JSON format

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -d|--detailed)
                DETAILED="true"
                shift
                ;;
            -c|--continuous)
                CONTINUOUS="true"
                shift
                ;;
            -i|--interval)
                INTERVAL="$2"
                shift 2
                ;;
            -f|--format)
                OUTPUT_FORMAT="$2"
                shift 2
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done

    # Validate environment
    if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "local" ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be 'production', 'staging', or 'local'"
        exit 1
    fi

    # Validate output format
    if [[ "$OUTPUT_FORMAT" != "text" && "$OUTPUT_FORMAT" != "json" ]]; then
        log_error "Invalid output format: $OUTPUT_FORMAT. Must be 'text' or 'json'"
        exit 1
    fi

    # Validate interval
    if ! [[ "$INTERVAL" =~ ^[0-9]+$ ]] || [ "$INTERVAL" -lt 5 ]; then
        log_error "Invalid interval: $INTERVAL. Must be a number >= 5"
        exit 1
    fi
}

# Get environment URLs
get_environment_urls() {
    case $ENVIRONMENT in
        production)
            BASE_URL="https://attribution.platform"
            PROMETHEUS_URL="http://prometheus.attribution.platform"
            GRAFANA_URL="http://grafana.attribution.platform"
            ;;
        staging)
            BASE_URL="https://staging.attribution.platform"
            PROMETHEUS_URL="http://prometheus-staging.attribution.platform"
            GRAFANA_URL="http://grafana-staging.attribution.platform"
            ;;
        local)
            BASE_URL="http://localhost:5173"
            PROMETHEUS_URL="http://localhost:9090"
            GRAFANA_URL="http://localhost:3000"
            ;;
    esac
}

# Health check results
declare -A HEALTH_RESULTS

# Basic health checks
basic_health_checks() {
    log_header "Basic Health Checks"

    local checks_passed=0
    local total_checks=5

    # 1. Frontend health
    log_info "Checking frontend health..."
    if curl -f -s -m 10 "$BASE_URL" > /dev/null 2>&1; then
        log_success "✓ Frontend is accessible"
        HEALTH_RESULTS["frontend"]="healthy"
        ((checks_passed++))
    else
        log_error "✗ Frontend is not accessible"
        HEALTH_RESULTS["frontend"]="unhealthy"
    fi

    # 2. API health
    log_info "Checking API health..."
    if curl -f -s -m 10 "$BASE_URL/health" > /dev/null 2>&1; then
        log_success "✓ API health endpoint is responding"
        HEALTH_RESULTS["api"]="healthy"
        ((checks_passed++))
    else
        log_error "✗ API health endpoint is not responding"
        HEALTH_RESULTS["api"]="unhealthy"
    fi

    # 3. Database connectivity
    log_info "Checking database connectivity..."
    if curl -f -s -m 10 "$BASE_URL/health/database" > /dev/null 2>&1; then
        log_success "✓ Database connectivity is working"
        HEALTH_RESULTS["database"]="healthy"
        ((checks_passed++))
    else
        log_error "✗ Database connectivity issues"
        HEALTH_RESULTS["database"]="unhealthy"
    fi

    # 4. Redis connectivity
    log_info "Checking Redis connectivity..."
    if curl -f -s -m 10 "$BASE_URL/health/redis" > /dev/null 2>&1; then
        log_success "✓ Redis connectivity is working"
        HEALTH_RESULTS["redis"]="healthy"
        ((checks_passed++))
    else
        log_error "✗ Redis connectivity issues"
        HEALTH_RESULTS["redis"]="unhealthy"
    fi

    # 5. ML API health
    log_info "Checking ML API health..."
    if curl -f -s -m 10 "$BASE_URL/ml/health" > /dev/null 2>&1; then
        log_success "✓ ML API is responding"
        HEALTH_RESULTS["ml_api"]="healthy"
        ((checks_passed++))
    else
        log_error "✗ ML API is not responding"
        HEALTH_RESULTS["ml_api"]="unhealthy"
    fi

    HEALTH_RESULTS["basic_score"]="$checks_passed/$total_checks"

    if [ $checks_passed -eq $total_checks ]; then
        log_success "Basic health checks: $checks_passed/$total_checks ✓"
    elif [ $checks_passed -ge 3 ]; then
        log_warning "Basic health checks: $checks_passed/$total_checks ⚠"
    else
        log_error "Basic health checks: $checks_passed/$total_checks ✗"
    fi
}

# Performance checks
performance_checks() {
    log_header "Performance Checks"

    # API response time
    log_info "Checking API response time..."
    local response_time
    response_time=$(curl -s -o /dev/null -w "%{time_total}" -m 10 "$BASE_URL/health" 2>/dev/null || echo "999")

    if (( $(echo "$response_time < 1.0" | bc -l) )); then
        log_success "✓ API response time: ${response_time}s (excellent)"
        HEALTH_RESULTS["response_time"]="excellent"
    elif (( $(echo "$response_time < 2.0" | bc -l) )); then
        log_success "✓ API response time: ${response_time}s (good)"
        HEALTH_RESULTS["response_time"]="good"
    elif (( $(echo "$response_time < 5.0" | bc -l) )); then
        log_warning "⚠ API response time: ${response_time}s (acceptable)"
        HEALTH_RESULTS["response_time"]="acceptable"
    else
        log_error "✗ API response time: ${response_time}s (poor)"
        HEALTH_RESULTS["response_time"]="poor"
    fi

    # Frontend load time
    log_info "Checking frontend load time..."
    local frontend_time
    frontend_time=$(curl -s -o /dev/null -w "%{time_total}" -m 15 "$BASE_URL" 2>/dev/null || echo "999")

    if (( $(echo "$frontend_time < 2.0" | bc -l) )); then
        log_success "✓ Frontend load time: ${frontend_time}s (fast)"
        HEALTH_RESULTS["frontend_load_time"]="fast"
    elif (( $(echo "$frontend_time < 5.0" | bc -l) )); then
        log_warning "⚠ Frontend load time: ${frontend_time}s (moderate)"
        HEALTH_RESULTS["frontend_load_time"]="moderate"
    else
        log_error "✗ Frontend load time: ${frontend_time}s (slow)"
        HEALTH_RESULTS["frontend_load_time"]="slow"
    fi
}

# Kubernetes health checks
kubernetes_health_checks() {
    if [ "$ENVIRONMENT" = "local" ]; then
        log_info "Skipping Kubernetes checks for local environment"
        return
    fi

    log_header "Kubernetes Health Checks"

    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        log_warning "kubectl not available, skipping Kubernetes checks"
        return
    fi

    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_warning "Cannot connect to Kubernetes cluster, skipping checks"
        return
    fi

    local namespace="$ENVIRONMENT"
    local checks_passed=0
    local total_checks=3

    # 1. Pod status
    log_info "Checking pod status..."
    local running_pods
    local total_pods
    running_pods=$(kubectl get pods -n "$namespace" --field-selector=status.phase=Running -o name 2>/dev/null | wc -l)
    total_pods=$(kubectl get pods -n "$namespace" -o name 2>/dev/null | wc -l)

    if [ "$total_pods" -eq 0 ]; then
        log_warning "⚠ No pods found in namespace $namespace"
        HEALTH_RESULTS["pods"]="no_pods"
    elif [ "$running_pods" -eq "$total_pods" ]; then
        log_success "✓ All pods are running ($running_pods/$total_pods)"
        HEALTH_RESULTS["pods"]="healthy"
        ((checks_passed++))
    else
        log_error "✗ Some pods are not running ($running_pods/$total_pods)"
        HEALTH_RESULTS["pods"]="unhealthy"

        # Show problematic pods
        kubectl get pods -n "$namespace" --field-selector=status.phase!=Running
    fi

    # 2. Service endpoints
    log_info "Checking service endpoints..."
    local services_with_endpoints=0
    local total_services=0

    for service in api-gateway web-ui ml-analytics backend; do
        if kubectl get service "$service" -n "$namespace" &> /dev/null; then
            ((total_services++))
            local endpoints
            endpoints=$(kubectl get endpoints "$service" -n "$namespace" -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null | wc -w)

            if [ "$endpoints" -gt 0 ]; then
                ((services_with_endpoints++))
            fi
        fi
    done

    if [ "$total_services" -eq 0 ]; then
        log_warning "⚠ No services found in namespace $namespace"
        HEALTH_RESULTS["services"]="no_services"
    elif [ "$services_with_endpoints" -eq "$total_services" ]; then
        log_success "✓ All services have endpoints ($services_with_endpoints/$total_services)"
        HEALTH_RESULTS["services"]="healthy"
        ((checks_passed++))
    else
        log_error "✗ Some services have no endpoints ($services_with_endpoints/$total_services)"
        HEALTH_RESULTS["services"]="unhealthy"
    fi

    # 3. Deployment status
    log_info "Checking deployment status..."
    local ready_deployments=0
    local total_deployments=0

    for deployment in api-gateway web-ui ml-analytics backend; do
        if kubectl get deployment "$deployment" -n "$namespace" &> /dev/null; then
            ((total_deployments++))
            local ready_replicas
            local desired_replicas
            ready_replicas=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
            desired_replicas=$(kubectl get deployment "$deployment" -n "$namespace" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

            if [ "$ready_replicas" = "$desired_replicas" ] && [ "$ready_replicas" -gt 0 ]; then
                ((ready_deployments++))
            fi
        fi
    done

    if [ "$total_deployments" -eq 0 ]; then
        log_warning "⚠ No deployments found in namespace $namespace"
        HEALTH_RESULTS["deployments"]="no_deployments"
    elif [ "$ready_deployments" -eq "$total_deployments" ]; then
        log_success "✓ All deployments are ready ($ready_deployments/$total_deployments)"
        HEALTH_RESULTS["deployments"]="healthy"
        ((checks_passed++))
    else
        log_error "✗ Some deployments are not ready ($ready_deployments/$total_deployments)"
        HEALTH_RESULTS["deployments"]="unhealthy"
    fi

    HEALTH_RESULTS["k8s_score"]="$checks_passed/3"
}

# Monitoring system checks
monitoring_checks() {
    log_header "Monitoring System Checks"

    local checks_passed=0
    local total_checks=2

    # 1. Prometheus health
    log_info "Checking Prometheus..."
    if curl -f -s -m 10 "$PROMETHEUS_URL/api/v1/query?query=up" > /dev/null 2>&1; then
        log_success "✓ Prometheus is accessible"
        HEALTH_RESULTS["prometheus"]="healthy"
        ((checks_passed++))
    else
        log_error "✗ Prometheus is not accessible"
        HEALTH_RESULTS["prometheus"]="unhealthy"
    fi

    # 2. Grafana health
    log_info "Checking Grafana..."
    if curl -f -s -m 10 "$GRAFANA_URL/api/health" > /dev/null 2>&1; then
        log_success "✓ Grafana is accessible"
        HEALTH_RESULTS["grafana"]="healthy"
        ((checks_passed++))
    else
        log_error "✗ Grafana is not accessible"
        HEALTH_RESULTS["grafana"]="unhealthy"
    fi

    HEALTH_RESULTS["monitoring_score"]="$checks_passed/$total_checks"
}

# Detailed system information
detailed_system_info() {
    if [ "$DETAILED" != "true" ]; then
        return
    fi

    log_header "Detailed System Information"

    # Memory and CPU usage from Prometheus
    if [ "${HEALTH_RESULTS["prometheus"]}" = "healthy" ]; then
        log_info "Fetching system metrics from Prometheus..."

        # CPU usage
        local cpu_usage
        cpu_usage=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)" | jq -r '.data.result[0].value[1] // "N/A"' 2>/dev/null)
        echo "CPU Usage: ${cpu_usage}%"

        # Memory usage
        local memory_usage
        memory_usage=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100" | jq -r '.data.result[0].value[1] // "N/A"' 2>/dev/null)
        echo "Memory Usage: ${memory_usage}%"

        # Error rates
        local error_rate
        error_rate=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[5m])" | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null)
        echo "Error Rate: ${error_rate} errors/sec"

        # Request rate
        local request_rate
        request_rate=$(curl -s "$PROMETHEUS_URL/api/v1/query?query=rate(http_requests_total[5m])" | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null)
        echo "Request Rate: ${request_rate} req/sec"
    fi

    # Disk usage (if Kubernetes checks are available)
    if [ "$ENVIRONMENT" != "local" ] && command -v kubectl &> /dev/null; then
        log_info "Pod resource usage:"
        kubectl top pods -n "$ENVIRONMENT" 2>/dev/null || log_warning "Metrics server not available"
    fi
}

# Generate JSON output
generate_json_output() {
    local overall_status="healthy"

    # Determine overall status
    if [[ "${HEALTH_RESULTS["basic_score"]}" != "5/5" ]] || \
       [[ "${HEALTH_RESULTS["pods"]:-healthy}" = "unhealthy" ]] || \
       [[ "${HEALTH_RESULTS["services"]:-healthy}" = "unhealthy" ]] || \
       [[ "${HEALTH_RESULTS["deployments"]:-healthy}" = "unhealthy" ]]; then
        overall_status="unhealthy"
    elif [[ "${HEALTH_RESULTS["response_time"]}" = "poor" ]] || \
         [[ "${HEALTH_RESULTS["frontend_load_time"]}" = "slow" ]]; then
        overall_status="degraded"
    fi

    cat << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "environment": "$ENVIRONMENT",
    "overall_status": "$overall_status",
    "basic_health": {
        "frontend": "${HEALTH_RESULTS["frontend"]:-unknown}",
        "api": "${HEALTH_RESULTS["api"]:-unknown}",
        "database": "${HEALTH_RESULTS["database"]:-unknown}",
        "redis": "${HEALTH_RESULTS["redis"]:-unknown}",
        "ml_api": "${HEALTH_RESULTS["ml_api"]:-unknown}",
        "score": "${HEALTH_RESULTS["basic_score"]:-unknown}"
    },
    "performance": {
        "api_response_time": "${HEALTH_RESULTS["response_time"]:-unknown}",
        "frontend_load_time": "${HEALTH_RESULTS["frontend_load_time"]:-unknown}"
    },
    "kubernetes": {
        "pods": "${HEALTH_RESULTS["pods"]:-unknown}",
        "services": "${HEALTH_RESULTS["services"]:-unknown}",
        "deployments": "${HEALTH_RESULTS["deployments"]:-unknown}",
        "score": "${HEALTH_RESULTS["k8s_score"]:-unknown}"
    },
    "monitoring": {
        "prometheus": "${HEALTH_RESULTS["prometheus"]:-unknown}",
        "grafana": "${HEALTH_RESULTS["grafana"]:-unknown}",
        "score": "${HEALTH_RESULTS["monitoring_score"]:-unknown}"
    }
}
EOF
}

# Single health check execution
run_health_check() {
    get_environment_urls

    if [ "$OUTPUT_FORMAT" = "text" ]; then
        echo ""
        log_header "UnMoGrowP Health Check - $ENVIRONMENT Environment"
        log_info "Timestamp: $(date)"
        echo "=================================================="
    fi

    # Run all health checks
    basic_health_checks
    performance_checks
    kubernetes_health_checks
    monitoring_checks
    detailed_system_info

    # Output results
    if [ "$OUTPUT_FORMAT" = "json" ]; then
        generate_json_output
    else
        echo ""
        log_header "Health Check Summary"
        echo "Environment: $ENVIRONMENT"
        echo "Basic Health: ${HEALTH_RESULTS["basic_score"]}"
        echo "Performance: API ${HEALTH_RESULTS["response_time"]}, Frontend ${HEALTH_RESULTS["frontend_load_time"]}"
        echo "Kubernetes: ${HEALTH_RESULTS["k8s_score"]:-N/A}"
        echo "Monitoring: ${HEALTH_RESULTS["monitoring_score"]}"
        echo "Timestamp: $(date)"
        echo ""
    fi
}

# Continuous monitoring
run_continuous_monitoring() {
    log_info "Starting continuous health monitoring every ${INTERVAL} seconds..."
    log_info "Press Ctrl+C to stop"
    echo ""

    local iteration=1

    while true; do
        if [ "$OUTPUT_FORMAT" = "text" ]; then
            echo "=== Health Check #$iteration ==="
        fi

        run_health_check

        if [ "$OUTPUT_FORMAT" = "text" ]; then
            echo ""
        fi

        sleep "$INTERVAL"
        ((iteration++))
    done
}

# Main execution
main() {
    if [ "$CONTINUOUS" = "true" ]; then
        run_continuous_monitoring
    else
        run_health_check
    fi
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_args "$@"
    main
fi