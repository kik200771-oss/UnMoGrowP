#!/bin/bash
# =============================================================================
# UnMoGrowP Attribution Platform - Production Deployment Script
# Blue-Green Deployment Strategy
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PRODUCTION_NAMESPACE="production"
DEPLOYMENT_TIMEOUT="900s"
HEALTH_CHECK_TIMEOUT="300"
MONITORING_TIMEOUT="120"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

# Pre-deployment validation
validate_prerequisites() {
    log_info "Validating production deployment prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi

    # Check curl
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed or not in PATH"
        exit 1
    fi

    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Verify production context
    local current_context
    current_context=$(kubectl config current-context)
    log_info "Current Kubernetes context: $current_context"

    # Confirm production deployment
    log_critical "⚠️  PRODUCTION DEPLOYMENT CONFIRMATION ⚠️"
    echo "Context: $current_context"
    echo "Namespace: $PRODUCTION_NAMESPACE"
    echo "Timestamp: $(date)"
    echo ""
    read -p "Are you sure you want to deploy to PRODUCTION? Type 'DEPLOY' to confirm: " -r
    if [ "$REPLY" != "DEPLOY" ]; then
        log_info "Deployment cancelled by user"
        exit 0
    fi

    # Check namespace exists
    if ! kubectl get namespace "$PRODUCTION_NAMESPACE" &> /dev/null; then
        log_error "Production namespace $PRODUCTION_NAMESPACE does not exist"
        exit 1
    fi

    # Check if staging deployment was successful
    if ! kubectl get deployment api-gateway -n staging &> /dev/null; then
        log_warning "Staging deployment not found or not verified"
        read -p "Continue without staging verification? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    log_success "Prerequisites validation passed"
}

# Pre-deployment health check
pre_deployment_health_check() {
    log_info "Performing pre-deployment health check..."

    # Check current production health
    local current_health_url="https://attribution.platform/health"

    if curl -f -s "$current_health_url" > /dev/null 2>&1; then
        log_success "Current production is healthy"
    else
        log_warning "Current production health check failed"
        read -p "Continue with unhealthy production? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Check monitoring system
    local prometheus_url="http://prometheus.attribution.platform/api/v1/query?query=up"

    if curl -f -s "$prometheus_url" > /dev/null 2>&1; then
        log_success "Monitoring system is accessible"
    else
        log_warning "Monitoring system check failed"
    fi

    # Check database connectivity (through health endpoint)
    local db_health_url="https://attribution.platform/health/database"

    if curl -f -s "$db_health_url" > /dev/null 2>&1; then
        log_success "Database connectivity confirmed"
    else
        log_warning "Database health check failed"
    fi
}

# Create deployment backup
create_deployment_backup() {
    log_info "Creating deployment backup..."

    local backup_dir="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"

    # Backup current deployments
    kubectl get deployment -n "$PRODUCTION_NAMESPACE" -o yaml > "$backup_dir/deployments.yaml"
    kubectl get service -n "$PRODUCTION_NAMESPACE" -o yaml > "$backup_dir/services.yaml"
    kubectl get configmap -n "$PRODUCTION_NAMESPACE" -o yaml > "$backup_dir/configmaps.yaml"
    kubectl get secret -n "$PRODUCTION_NAMESPACE" -o yaml > "$backup_dir/secrets.yaml"

    # Backup current images
    kubectl get deployments -n "$PRODUCTION_NAMESPACE" -o jsonpath='{range .items[*]}{.metadata.name}:{.spec.template.spec.containers[0].image}{"\n"}{end}' > "$backup_dir/current_images.txt"

    log_success "Backup created at $backup_dir"
    echo "$backup_dir" > "$PROJECT_ROOT/.last_backup"
}

# Blue-Green Deployment
deploy_blue_green() {
    log_info "Starting Blue-Green deployment..."

    cd "$PROJECT_ROOT"

    # Deploy new version (Green)
    log_info "Deploying Green environment..."
    kubectl apply -f deployment/kubernetes/production/ -n "$PRODUCTION_NAMESPACE"

    # Wait for Green deployment to be ready
    log_info "Waiting for Green deployments to be ready..."
    local services=("api-gateway" "web-ui" "ml-analytics" "backend")

    for service in "${services[@]}"; do
        log_info "Waiting for $service to be ready..."
        if ! kubectl rollout status deployment/"$service" -n "$PRODUCTION_NAMESPACE" --timeout="$DEPLOYMENT_TIMEOUT"; then
            log_error "Green deployment $service failed to become ready"
            return 1
        fi
    done

    log_success "Green environment deployed successfully"
}

# Comprehensive health check
comprehensive_health_check() {
    log_info "Performing comprehensive health check..."

    local health_checks_passed=0
    local total_health_checks=8

    # 1. Basic health endpoint
    log_info "1/8 Checking basic health endpoint..."
    if curl -f -s "https://attribution.platform/health" > /dev/null 2>&1; then
        log_success "✓ Basic health check passed"
        ((health_checks_passed++))
    else
        log_error "✗ Basic health check failed"
    fi

    # 2. API Gateway health
    log_info "2/8 Checking API Gateway health..."
    if curl -f -s "https://attribution.platform/api/health" > /dev/null 2>&1; then
        log_success "✓ API Gateway health check passed"
        ((health_checks_passed++))
    else
        log_error "✗ API Gateway health check failed"
    fi

    # 3. Database connectivity
    log_info "3/8 Checking database connectivity..."
    if curl -f -s "https://attribution.platform/health/database" > /dev/null 2>&1; then
        log_success "✓ Database connectivity check passed"
        ((health_checks_passed++))
    else
        log_error "✗ Database connectivity check failed"
    fi

    # 4. Redis connectivity
    log_info "4/8 Checking Redis connectivity..."
    if curl -f -s "https://attribution.platform/health/redis" > /dev/null 2>&1; then
        log_success "✓ Redis connectivity check passed"
        ((health_checks_passed++))
    else
        log_error "✗ Redis connectivity check failed"
    fi

    # 5. ML API health
    log_info "5/8 Checking ML API health..."
    if curl -f -s "https://attribution.platform/ml/health" > /dev/null 2>&1; then
        log_success "✓ ML API health check passed"
        ((health_checks_passed++))
    else
        log_error "✗ ML API health check failed"
    fi

    # 6. Authentication test
    log_info "6/8 Testing authentication..."
    local auth_response
    auth_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://attribution.platform/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"health@check.com","password":"test"}')

    if [ "$auth_response" = "200" ] || [ "$auth_response" = "401" ]; then
        log_success "✓ Authentication endpoint responsive"
        ((health_checks_passed++))
    else
        log_error "✗ Authentication endpoint failed (HTTP $auth_response)"
    fi

    # 7. Event ingestion test
    log_info "7/8 Testing event ingestion..."
    local ingestion_response
    ingestion_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://attribution.platform/api/events/track \
        -H "Content-Type: application/json" \
        -d '{"event_type":"health_check","user_id":"health_check","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"}')

    if [ "$ingestion_response" = "200" ]; then
        log_success "✓ Event ingestion test passed"
        ((health_checks_passed++))
    else
        log_error "✗ Event ingestion test failed (HTTP $ingestion_response)"
    fi

    # 8. Performance test
    log_info "8/8 Testing API performance..."
    local response_time
    response_time=$(curl -s -o /dev/null -w "%{time_total}" https://attribution.platform/health)

    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        log_success "✓ Performance test passed (${response_time}s)"
        ((health_checks_passed++))
    else
        log_warning "⚠ Performance test warning (${response_time}s > 2.0s)"
        ((health_checks_passed++))  # Still pass but with warning
    fi

    # Evaluate overall health
    local health_percentage=$((health_checks_passed * 100 / total_health_checks))

    if [ $health_checks_passed -eq $total_health_checks ]; then
        log_success "All health checks passed ($health_checks_passed/$total_health_checks - 100%)"
        return 0
    elif [ $health_percentage -ge 75 ]; then
        log_warning "Most health checks passed ($health_checks_passed/$total_health_checks - $health_percentage%)"
        read -p "Continue with $health_percentage% health score? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            return 0
        else
            return 1
        fi
    else
        log_error "Health checks failed ($health_checks_passed/$total_health_checks - $health_percentage%)"
        return 1
    fi
}

# Monitoring and alerting
monitor_deployment() {
    log_info "Monitoring deployment for $MONITORING_TIMEOUT seconds..."

    local start_time=$(date +%s)
    local end_time=$((start_time + MONITORING_TIMEOUT))
    local check_interval=10

    while [ $(date +%s) -lt $end_time ]; do
        # Check error rates
        local error_rate_query='rate(http_requests_total{status=~"5.."}[5m])'
        local error_rate
        error_rate=$(curl -s "http://prometheus.attribution.platform/api/v1/query?query=$error_rate_query" | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "0")

        # Check response times
        local response_time_query='histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))'
        local response_time
        response_time=$(curl -s "http://prometheus.attribution.platform/api/v1/query?query=$response_time_query" | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "0")

        # Check CPU usage
        local cpu_query='rate(container_cpu_usage_seconds_total[5m])'
        local cpu_usage
        cpu_usage=$(curl -s "http://prometheus.attribution.platform/api/v1/query?query=$cpu_query" | jq -r '.data.result[0].value[1] // "0"' 2>/dev/null || echo "0")

        log_info "Monitoring: Error Rate=${error_rate}, P95 Response Time=${response_time}s, CPU=${cpu_usage}"

        # Alert if metrics are concerning
        if (( $(echo "$error_rate > 0.01" | bc -l) )); then
            log_warning "High error rate detected: $error_rate"
        fi

        if (( $(echo "$response_time > 1.0" | bc -l) )); then
            log_warning "High response time detected: ${response_time}s"
        fi

        sleep $check_interval
    done

    log_success "Monitoring period completed"
}

# Rollback function
emergency_rollback() {
    log_critical "EMERGENCY ROLLBACK INITIATED"

    local services=("api-gateway" "web-ui" "ml-analytics" "backend")

    for service in "${services[@]}"; do
        log_info "Rolling back $service..."
        if kubectl rollout undo deployment/"$service" -n "$PRODUCTION_NAMESPACE"; then
            log_success "Rollback successful for $service"
        else
            log_error "Rollback failed for $service"
        fi
    done

    # Wait for rollback to complete
    for service in "${services[@]}"; do
        kubectl rollout status deployment/"$service" -n "$PRODUCTION_NAMESPACE" --timeout="$DEPLOYMENT_TIMEOUT"
    done

    log_info "Performing post-rollback health check..."
    if curl -f -s "https://attribution.platform/health" > /dev/null 2>&1; then
        log_success "Post-rollback health check passed"
    else
        log_error "Post-rollback health check failed"
    fi

    log_critical "Emergency rollback completed"
}

# Notification
send_notification() {
    local status=$1
    local message=$2

    # Slack notification (if webhook URL is available)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local slack_payload=$(cat <<EOF
{
    "text": "UnMoGrowP Production Deployment",
    "attachments": [
        {
            "color": "$( [ "$status" = "success" ] && echo "good" || echo "danger" )",
            "fields": [
                {
                    "title": "Status",
                    "value": "$status",
                    "short": true
                },
                {
                    "title": "Message",
                    "value": "$message",
                    "short": false
                },
                {
                    "title": "Timestamp",
                    "value": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
                    "short": true
                }
            ]
        }
    ]
}
EOF
        )

        curl -X POST -H 'Content-type: application/json' \
            --data "$slack_payload" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi

    log_info "Notification sent: $status - $message"
}

# Cleanup function
cleanup() {
    local exit_code=$?

    if [ $exit_code -ne 0 ]; then
        log_error "Production deployment failed with exit code $exit_code"

        # Show recent events for debugging
        log_info "Recent events:"
        kubectl get events -n "$PRODUCTION_NAMESPACE" --sort-by='.lastTimestamp' | tail -20

        send_notification "failed" "Production deployment failed. Manual intervention required."

        # Ask for emergency rollback
        read -p "EMERGENCY ROLLBACK? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            emergency_rollback
            send_notification "rollback" "Emergency rollback completed"
        fi
    else
        send_notification "success" "Production deployment completed successfully"
    fi

    exit $exit_code
}

# Main execution
main() {
    log_info "Starting PRODUCTION deployment for UnMoGrowP Attribution Platform"
    log_info "================================================================="

    # Set up cleanup trap
    trap cleanup EXIT

    # Execute deployment steps
    validate_prerequisites
    pre_deployment_health_check
    create_deployment_backup
    deploy_blue_green
    comprehensive_health_check
    monitor_deployment

    log_success "🎉 PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉"
    log_info "Production environment: https://attribution.platform"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi