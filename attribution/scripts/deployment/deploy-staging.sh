#!/bin/bash
# =============================================================================
# UnMoGrowP Attribution Platform - Staging Deployment Script
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_NAMESPACE="staging"
DEPLOYMENT_TIMEOUT="600s"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi

    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Check namespace exists
    if ! kubectl get namespace "$DEPLOYMENT_NAMESPACE" &> /dev/null; then
        log_warning "Namespace $DEPLOYMENT_NAMESPACE does not exist, creating..."
        kubectl create namespace "$DEPLOYMENT_NAMESPACE"
    fi

    log_success "Prerequisites check passed"
}

# Deploy services
deploy_services() {
    log_info "Deploying services to staging..."

    cd "$PROJECT_ROOT"

    # Apply Kubernetes manifests
    log_info "Applying Kubernetes manifests..."
    kubectl apply -f deployment/kubernetes/staging/ -n "$DEPLOYMENT_NAMESPACE"

    # Wait for deployments to be ready
    log_info "Waiting for deployments to be ready..."

    local services=("api-gateway" "web-ui" "ml-analytics" "backend")

    for service in "${services[@]}"; do
        log_info "Waiting for $service to be ready..."
        if ! kubectl rollout status deployment/"$service" -n "$DEPLOYMENT_NAMESPACE" --timeout="$DEPLOYMENT_TIMEOUT"; then
            log_error "Deployment $service failed to become ready"
            return 1
        fi
    done

    log_success "All services deployed successfully"
}

# Health check
health_check() {
    log_info "Performing health checks..."

    # Get service endpoints
    local api_endpoint
    api_endpoint=$(kubectl get service api-gateway -n "$DEPLOYMENT_NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "localhost")

    if [ "$api_endpoint" = "localhost" ]; then
        log_warning "LoadBalancer IP not available, using port-forward for health check"
        kubectl port-forward -n "$DEPLOYMENT_NAMESPACE" service/api-gateway 8080:80 &
        local port_forward_pid=$!
        sleep 5
        api_endpoint="localhost:8080"
    fi

    # Health check with retries
    local max_retries=30
    local retry_count=0
    local health_url="http://$api_endpoint/health"

    log_info "Checking health endpoint: $health_url"

    while [ $retry_count -lt $max_retries ]; do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            log_success "Health check passed"

            # Kill port-forward if we used it
            if [ -n "${port_forward_pid:-}" ]; then
                kill "$port_forward_pid" 2>/dev/null || true
            fi

            return 0
        fi

        log_warning "Health check failed, retrying in 10 seconds... (attempt $((retry_count + 1))/$max_retries)"
        sleep 10
        ((retry_count++))
    done

    log_error "Health check failed after $max_retries attempts"

    # Kill port-forward if we used it
    if [ -n "${port_forward_pid:-}" ]; then
        kill "$port_forward_pid" 2>/dev/null || true
    fi

    return 1
}

# Run integration tests
run_integration_tests() {
    log_info "Running integration tests..."

    # Set API URL for tests
    local api_endpoint
    api_endpoint=$(kubectl get service api-gateway -n "$DEPLOYMENT_NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "localhost")

    if [ "$api_endpoint" = "localhost" ]; then
        kubectl port-forward -n "$DEPLOYMENT_NAMESPACE" service/api-gateway 8080:80 &
        local port_forward_pid=$!
        sleep 5
        api_endpoint="localhost:8080"
    fi

    export API_URL="http://$api_endpoint"

    cd "$PROJECT_ROOT"

    # Run frontend integration tests
    if [ -f "apps/web-ui/package.json" ] && npm list --depth=0 --prefix=apps/web-ui | grep -q "test:integration"; then
        log_info "Running frontend integration tests..."
        cd apps/web-ui
        npm run test:integration || {
            log_error "Frontend integration tests failed"
            [ -n "${port_forward_pid:-}" ] && kill "$port_forward_pid" 2>/dev/null || true
            return 1
        }
        cd "$PROJECT_ROOT"
    fi

    # Run API integration tests
    if [ -f "testing/integration/api-tests.js" ]; then
        log_info "Running API integration tests..."
        cd testing/integration
        bun run api-tests.js || {
            log_error "API integration tests failed"
            [ -n "${port_forward_pid:-}" ] && kill "$port_forward_pid" 2>/dev/null || true
            return 1
        }
        cd "$PROJECT_ROOT"
    fi

    # Kill port-forward if we used it
    if [ -n "${port_forward_pid:-}" ]; then
        kill "$port_forward_pid" 2>/dev/null || true
    fi

    log_success "All integration tests passed"
}

# Get deployment status
get_deployment_status() {
    log_info "Deployment Status Summary:"
    echo "=================================="

    # Services status
    kubectl get deployments -n "$DEPLOYMENT_NAMESPACE" -o wide
    echo ""

    # Pods status
    kubectl get pods -n "$DEPLOYMENT_NAMESPACE" -o wide
    echo ""

    # Services status
    kubectl get services -n "$DEPLOYMENT_NAMESPACE" -o wide
    echo ""

    # Ingress status (if exists)
    if kubectl get ingress -n "$DEPLOYMENT_NAMESPACE" &> /dev/null; then
        kubectl get ingress -n "$DEPLOYMENT_NAMESPACE" -o wide
        echo ""
    fi

    log_success "Deployment completed successfully!"
    log_info "Staging environment is ready: https://staging.attribution.platform"
}

# Rollback function
rollback_deployment() {
    log_warning "Rolling back deployment..."

    local services=("api-gateway" "web-ui" "ml-analytics" "backend")

    for service in "${services[@]}"; do
        log_info "Rolling back $service..."
        kubectl rollout undo deployment/"$service" -n "$DEPLOYMENT_NAMESPACE" || {
            log_warning "Rollback failed for $service (might not exist)"
        }
    done

    log_info "Rollback completed"
}

# Cleanup function
cleanup() {
    local exit_code=$?

    if [ $exit_code -ne 0 ]; then
        log_error "Deployment failed with exit code $exit_code"

        # Show recent events for debugging
        log_info "Recent events:"
        kubectl get events -n "$DEPLOYMENT_NAMESPACE" --sort-by='.lastTimestamp' | tail -20

        # Optionally rollback
        read -p "Do you want to rollback? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback_deployment
        fi
    fi

    exit $exit_code
}

# Main execution
main() {
    log_info "Starting staging deployment for UnMoGrowP Attribution Platform"
    log_info "=================================================="

    # Set up cleanup trap
    trap cleanup EXIT

    # Execute deployment steps
    check_prerequisites
    deploy_services
    health_check
    run_integration_tests
    get_deployment_status

    log_success "Staging deployment completed successfully!"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi