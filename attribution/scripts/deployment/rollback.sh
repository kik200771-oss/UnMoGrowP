#!/bin/bash
# =============================================================================
# UnMoGrowP Attribution Platform - Emergency Rollback Script
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Default values
ENVIRONMENT="production"
ROLLBACK_STEPS="1"
FORCE_ROLLBACK="false"

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

# Usage function
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

UnMoGrowP Attribution Platform - Emergency Rollback Script

OPTIONS:
    -e, --environment ENV    Environment to rollback (production, staging) [default: production]
    -s, --steps NUM         Number of rollback steps [default: 1]
    -f, --force            Force rollback without confirmation
    -h, --help             Show this help message

EXAMPLES:
    $0                              # Rollback production by 1 step
    $0 -e staging                   # Rollback staging by 1 step
    $0 -s 2                         # Rollback production by 2 steps
    $0 -e production -s 1 -f        # Force rollback production

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
            -s|--steps)
                ROLLBACK_STEPS="$2"
                shift 2
                ;;
            -f|--force)
                FORCE_ROLLBACK="true"
                shift
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
    if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be 'production' or 'staging'"
        exit 1
    fi

    # Validate rollback steps
    if ! [[ "$ROLLBACK_STEPS" =~ ^[0-9]+$ ]] || [ "$ROLLBACK_STEPS" -lt 1 ] || [ "$ROLLBACK_STEPS" -gt 10 ]; then
        log_error "Invalid rollback steps: $ROLLBACK_STEPS. Must be a number between 1 and 10"
        exit 1
    fi
}

# Pre-rollback validation
validate_prerequisites() {
    log_info "Validating rollback prerequisites..."

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
    if ! kubectl get namespace "$ENVIRONMENT" &> /dev/null; then
        log_error "Namespace $ENVIRONMENT does not exist"
        exit 1
    fi

    # Verify current context
    local current_context
    current_context=$(kubectl config current-context)
    log_info "Current Kubernetes context: $current_context"

    log_success "Prerequisites validation passed"
}

# Show current deployment status
show_current_status() {
    log_info "Current deployment status in $ENVIRONMENT:"
    echo "=================================================="

    # Show deployments with their revision history
    local services=("api-gateway" "web-ui" "ml-analytics" "backend")

    for service in "${services[@]}"; do
        if kubectl get deployment "$service" -n "$ENVIRONMENT" &> /dev/null; then
            echo ""
            log_info "Service: $service"
            echo "-------------------"

            # Current status
            kubectl get deployment "$service" -n "$ENVIRONMENT" -o wide

            # Rollout history
            echo ""
            log_info "Rollout history for $service:"
            kubectl rollout history deployment/"$service" -n "$ENVIRONMENT"
        else
            log_warning "Service $service not found in $ENVIRONMENT"
        fi
    done
    echo ""
}

# Get rollback target information
get_rollback_target() {
    local service=$1
    local target_revision

    # Get target revision (current - rollback_steps)
    local current_revision
    current_revision=$(kubectl get deployment "$service" -n "$ENVIRONMENT" -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}')

    target_revision=$((current_revision - ROLLBACK_STEPS))

    if [ "$target_revision" -lt 1 ]; then
        log_error "Cannot rollback $service by $ROLLBACK_STEPS steps. Only $((current_revision - 1)) revisions available."
        return 1
    fi

    log_info "$service: Rolling back from revision $current_revision to revision $target_revision"
    return 0
}

# Confirm rollback
confirm_rollback() {
    if [ "$FORCE_ROLLBACK" = "true" ]; then
        log_warning "Force mode enabled, skipping confirmation"
        return 0
    fi

    log_critical "⚠️  ROLLBACK CONFIRMATION ⚠️"
    echo "Environment: $ENVIRONMENT"
    echo "Rollback Steps: $ROLLBACK_STEPS"
    echo "Timestamp: $(date)"
    echo ""

    if [ "$ENVIRONMENT" = "production" ]; then
        echo "🚨 THIS IS A PRODUCTION ROLLBACK 🚨"
        echo ""
    fi

    read -p "Are you sure you want to perform this rollback? Type 'ROLLBACK' to confirm: " -r
    if [ "$REPLY" != "ROLLBACK" ]; then
        log_info "Rollback cancelled by user"
        exit 0
    fi

    log_success "Rollback confirmed"
}

# Backup current state before rollback
backup_current_state() {
    log_info "Creating backup of current state..."

    local backup_dir="$PROJECT_ROOT/backups/rollback_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"

    # Backup current deployments
    kubectl get deployment -n "$ENVIRONMENT" -o yaml > "$backup_dir/deployments.yaml"
    kubectl get replicaset -n "$ENVIRONMENT" -o yaml > "$backup_dir/replicasets.yaml"

    # Backup current images and revisions
    kubectl get deployments -n "$ENVIRONMENT" -o jsonpath='{range .items[*]}{.metadata.name}:{.metadata.annotations.deployment\.kubernetes\.io/revision}:{.spec.template.spec.containers[0].image}{"\n"}{end}' > "$backup_dir/current_state.txt"

    log_success "Backup created at $backup_dir"
    echo "$backup_dir" > "$PROJECT_ROOT/.last_rollback_backup"
}

# Execute rollback
execute_rollback() {
    log_info "Executing rollback..."

    local services=("api-gateway" "web-ui" "ml-analytics" "backend")
    local failed_services=()

    for service in "${services[@]}"; do
        if kubectl get deployment "$service" -n "$ENVIRONMENT" &> /dev/null; then
            # Check if rollback is possible for this service
            if ! get_rollback_target "$service"; then
                failed_services+=("$service")
                continue
            fi

            log_info "Rolling back $service..."

            # Execute rollback
            if [ "$ROLLBACK_STEPS" = "1" ]; then
                # Simple rollback
                kubectl rollout undo deployment/"$service" -n "$ENVIRONMENT"
            else
                # Rollback to specific revision
                local current_revision
                current_revision=$(kubectl get deployment "$service" -n "$ENVIRONMENT" -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}')
                local target_revision=$((current_revision - ROLLBACK_STEPS))

                kubectl rollout undo deployment/"$service" -n "$ENVIRONMENT" --to-revision="$target_revision"
            fi

            if [ $? -eq 0 ]; then
                log_success "Rollback initiated for $service"
            else
                log_error "Failed to initiate rollback for $service"
                failed_services+=("$service")
            fi
        else
            log_warning "Service $service not found in $ENVIRONMENT, skipping"
        fi
    done

    # Report failed services
    if [ ${#failed_services[@]} -gt 0 ]; then
        log_error "Rollback failed for services: ${failed_services[*]}"
        return 1
    fi

    log_success "Rollback initiated for all services"
}

# Wait for rollback completion
wait_for_rollback() {
    log_info "Waiting for rollback to complete..."

    local services=("api-gateway" "web-ui" "ml-analytics" "backend")
    local timeout="600s"

    for service in "${services[@]}"; do
        if kubectl get deployment "$service" -n "$ENVIRONMENT" &> /dev/null; then
            log_info "Waiting for $service rollback to complete..."

            if kubectl rollout status deployment/"$service" -n "$ENVIRONMENT" --timeout="$timeout"; then
                log_success "✓ $service rollback completed"
            else
                log_error "✗ $service rollback failed or timed out"
                return 1
            fi
        fi
    done

    log_success "All rollbacks completed successfully"
}

# Verify rollback
verify_rollback() {
    log_info "Verifying rollback..."

    local health_checks_passed=0
    local total_checks=3

    # 1. Basic health check
    log_info "1/3 Checking basic health..."
    local health_url

    if [ "$ENVIRONMENT" = "production" ]; then
        health_url="https://attribution.platform/health"
    else
        health_url="https://staging.attribution.platform/health"
    fi

    local max_retries=12
    local retry_count=0

    while [ $retry_count -lt $max_retries ]; do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            log_success "✓ Basic health check passed"
            ((health_checks_passed++))
            break
        fi

        log_warning "Health check failed, retrying in 10 seconds... (attempt $((retry_count + 1))/$max_retries)"
        sleep 10
        ((retry_count++))
    done

    if [ $retry_count -eq $max_retries ]; then
        log_error "✗ Basic health check failed after $max_retries attempts"
    fi

    # 2. Check pod status
    log_info "2/3 Checking pod status..."
    local unhealthy_pods
    unhealthy_pods=$(kubectl get pods -n "$ENVIRONMENT" --field-selector=status.phase!=Running -o name 2>/dev/null | wc -l)

    if [ "$unhealthy_pods" -eq 0 ]; then
        log_success "✓ All pods are running"
        ((health_checks_passed++))
    else
        log_error "✗ $unhealthy_pods pods are not running"
        kubectl get pods -n "$ENVIRONMENT" --field-selector=status.phase!=Running
    fi

    # 3. Check service endpoints
    log_info "3/3 Checking service endpoints..."
    local services_ready=0
    local total_services=0

    for service in api-gateway web-ui ml-analytics backend; do
        if kubectl get service "$service" -n "$ENVIRONMENT" &> /dev/null; then
            ((total_services++))
            local endpoints
            endpoints=$(kubectl get endpoints "$service" -n "$ENVIRONMENT" -o jsonpath='{.subsets[*].addresses[*].ip}' | wc -w)

            if [ "$endpoints" -gt 0 ]; then
                ((services_ready++))
            fi
        fi
    done

    if [ "$services_ready" -eq "$total_services" ] && [ "$total_services" -gt 0 ]; then
        log_success "✓ All service endpoints are ready ($services_ready/$total_services)"
        ((health_checks_passed++))
    else
        log_error "✗ Service endpoints not ready ($services_ready/$total_services)"
    fi

    # Overall verification result
    if [ $health_checks_passed -eq $total_checks ]; then
        log_success "Rollback verification passed ($health_checks_passed/$total_checks)"
        return 0
    else
        log_error "Rollback verification failed ($health_checks_passed/$total_checks)"
        return 1
    fi
}

# Send notification
send_notification() {
    local status=$1
    local message=$2

    # Slack notification (if webhook URL is available)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local slack_payload=$(cat <<EOF
{
    "text": "🔄 UnMoGrowP Rollback Alert",
    "attachments": [
        {
            "color": "$( [ "$status" = "success" ] && echo "warning" || echo "danger" )",
            "fields": [
                {
                    "title": "Environment",
                    "value": "$ENVIRONMENT",
                    "short": true
                },
                {
                    "title": "Status",
                    "value": "$status",
                    "short": true
                },
                {
                    "title": "Rollback Steps",
                    "value": "$ROLLBACK_STEPS",
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

# Show post-rollback status
show_post_rollback_status() {
    log_info "Post-rollback status:"
    echo "======================"

    # Show deployments
    kubectl get deployments -n "$ENVIRONMENT" -o wide

    echo ""

    # Show pods
    kubectl get pods -n "$ENVIRONMENT" -o wide

    echo ""

    # Show recent events
    log_info "Recent events:"
    kubectl get events -n "$ENVIRONMENT" --sort-by='.lastTimestamp' | tail -10
}

# Cleanup function
cleanup() {
    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        send_notification "success" "Rollback completed successfully in $ENVIRONMENT environment"
        log_success "🔄 ROLLBACK COMPLETED SUCCESSFULLY! 🔄"
    else
        send_notification "failed" "Rollback failed in $ENVIRONMENT environment. Manual intervention required."
        log_error "Rollback failed. Please check the logs and perform manual intervention if necessary."
    fi

    exit $exit_code
}

# Main execution
main() {
    log_critical "🔄 EMERGENCY ROLLBACK INITIATED 🔄"
    log_info "Environment: $ENVIRONMENT"
    log_info "Rollback Steps: $ROLLBACK_STEPS"
    log_info "================================="

    # Set up cleanup trap
    trap cleanup EXIT

    # Execute rollback steps
    validate_prerequisites
    show_current_status
    confirm_rollback
    backup_current_state
    execute_rollback
    wait_for_rollback
    verify_rollback
    show_post_rollback_status

    log_success "Rollback process completed successfully!"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_args "$@"
    main
fi