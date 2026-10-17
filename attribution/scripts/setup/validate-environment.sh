#!/bin/bash
# =============================================================================
# UnMoGrowP Attribution Platform - Environment Validation Script
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

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

UnMoGrowP Attribution Platform - Environment Validation Script

OPTIONS:
    -e, --environment ENV    Environment to validate (development, staging, production) [default: development]
    -f, --fix               Attempt to fix common issues automatically
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

EXAMPLES:
    $0                              # Validate development environment
    $0 -e staging                   # Validate staging environment
    $0 -e production -v             # Validate production with verbose output
    $0 -f                           # Validate and auto-fix issues

EOF
}

# Default values
ENVIRONMENT="development"
FIX_ISSUES="false"
VERBOSE="false"

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -f|--fix)
                FIX_ISSUES="true"
                shift
                ;;
            -v|--verbose)
                VERBOSE="true"
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
    if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be 'development', 'staging', or 'production'"
        exit 1
    fi
}

# Load environment variables
load_environment() {
    log_info "Loading environment variables for $ENVIRONMENT environment..."

    # Load .env file if it exists
    if [ -f "$PROJECT_ROOT/.env" ]; then
        log_info "Loading .env file..."
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
    else
        log_warning ".env file not found. Using environment variables only."
    fi

    # Load environment-specific overrides
    if [ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
        log_info "Loading .env.$ENVIRONMENT file..."
        set -a
        source "$PROJECT_ROOT/.env.$ENVIRONMENT"
        set +a
    fi
}

# Validate required tools
validate_tools() {
    log_info "Validating required tools..."

    local required_tools=("docker" "docker-compose" "kubectl" "curl" "jq")
    local missing_tools=()

    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
            log_error "Required tool missing: $tool"
        else
            if [ "$VERBOSE" = "true" ]; then
                local version
                case $tool in
                    docker)
                        version=$(docker --version | cut -d' ' -f3 | tr -d ',')
                        ;;
                    docker-compose)
                        version=$(docker-compose --version | cut -d' ' -f3 | tr -d ',')
                        ;;
                    kubectl)
                        version=$(kubectl version --client --short 2>/dev/null | cut -d' ' -f3)
                        ;;
                    curl)
                        version=$(curl --version | head -n1 | cut -d' ' -f2)
                        ;;
                    jq)
                        version=$(jq --version | tr -d 'jq-')
                        ;;
                esac
                log_success "✓ $tool ($version)"
            else
                log_success "✓ $tool"
            fi
        fi
    done

    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_critical "Missing required tools: ${missing_tools[*]}"
        if [ "$FIX_ISSUES" = "true" ]; then
            log_info "Attempting to install missing tools..."
            install_missing_tools "${missing_tools[@]}"
        else
            log_error "Please install the missing tools and try again"
            return 1
        fi
    fi
}

# Install missing tools
install_missing_tools() {
    local tools=("$@")

    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        for tool in "${tools[@]}"; do
            case $tool in
                docker)
                    log_info "Installing Docker..."
                    curl -fsSL https://get.docker.com -o get-docker.sh
                    sudo sh get-docker.sh
                    rm get-docker.sh
                    ;;
                docker-compose)
                    log_info "Installing Docker Compose..."
                    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
                    sudo chmod +x /usr/local/bin/docker-compose
                    ;;
                kubectl)
                    log_info "Installing kubectl..."
                    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
                    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
                    rm kubectl
                    ;;
                jq)
                    log_info "Installing jq..."
                    sudo apt-get update && sudo apt-get install -y jq
                    ;;
            esac
        done
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        for tool in "${tools[@]}"; do
            case $tool in
                docker)
                    log_warning "Please install Docker Desktop for Mac from https://docker.com/products/docker-desktop"
                    ;;
                docker-compose)
                    log_info "Installing Docker Compose..."
                    brew install docker-compose
                    ;;
                kubectl)
                    log_info "Installing kubectl..."
                    brew install kubectl
                    ;;
                jq)
                    log_info "Installing jq..."
                    brew install jq
                    ;;
            esac
        done
    else
        log_warning "Automatic installation not supported for this OS. Please install tools manually."
    fi
}

# Validate environment variables
validate_environment_variables() {
    log_info "Validating environment variables..."

    local critical_vars=()
    local missing_vars=()
    local weak_secrets=()

    # Define required variables by environment
    if [ "$ENVIRONMENT" = "development" ]; then
        critical_vars=(
            "POSTGRES_PASSWORD"
            "CLICKHOUSE_PASSWORD"
            "REDIS_PASSWORD"
            "JWT_SECRET"
        )
    elif [ "$ENVIRONMENT" = "staging" ]; then
        critical_vars=(
            "POSTGRES_PASSWORD"
            "CLICKHOUSE_PASSWORD"
            "REDIS_PASSWORD"
            "JWT_SECRET"
            "DATABASE_URL"
            "CLICKHOUSE_URL"
            "REDIS_URL"
        )
    else # production
        critical_vars=(
            "POSTGRES_PASSWORD"
            "CLICKHOUSE_PASSWORD"
            "REDIS_PASSWORD"
            "JWT_SECRET"
            "DATABASE_URL"
            "CLICKHOUSE_URL"
            "REDIS_URL"
            "ENCRYPTION_KEY"
            "API_KEY_SECRET"
        )
    fi

    # Check for missing critical variables
    for var in "${critical_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
            log_error "Missing required variable: $var"
        else
            # Check for weak secrets
            case $var in
                *PASSWORD*|*SECRET*|*KEY*)
                    local value="${!var}"
                    if [ ${#value} -lt 12 ]; then
                        weak_secrets+=("$var")
                        log_warning "Weak secret detected: $var (length: ${#value})"
                    elif [[ "$value" == *"password"* ]] || [[ "$value" == *"secret"* ]] || [[ "$value" == *"your_"* ]]; then
                        weak_secrets+=("$var")
                        log_warning "Default/weak secret detected: $var"
                    else
                        if [ "$VERBOSE" = "true" ]; then
                            log_success "✓ $var (length: ${#value})"
                        else
                            log_success "✓ $var"
                        fi
                    fi
                    ;;
                *)
                    if [ "$VERBOSE" = "true" ]; then
                        log_success "✓ $var = ${!var}"
                    else
                        log_success "✓ $var"
                    fi
                    ;;
            esac
        fi
    done

    # Report issues
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_critical "Missing critical environment variables: ${missing_vars[*]}"
        if [ "$FIX_ISSUES" = "true" ]; then
            generate_missing_secrets "${missing_vars[@]}"
        else
            log_error "Please set the missing variables and try again"
            return 1
        fi
    fi

    if [ ${#weak_secrets[@]} -gt 0 ]; then
        log_warning "Weak secrets detected: ${weak_secrets[*]}"
        if [ "$FIX_ISSUES" = "true" ]; then
            generate_strong_secrets "${weak_secrets[@]}"
        else
            log_warning "Consider updating these secrets with stronger values"
        fi
    fi
}

# Generate missing secrets
generate_missing_secrets() {
    local vars=("$@")

    log_info "Generating missing secrets..."

    for var in "${vars[@]}"; do
        local value
        case $var in
            *PASSWORD*)
                value=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
                ;;
            JWT_SECRET|ENCRYPTION_KEY|*KEY*)
                value=$(openssl rand -hex 32)
                ;;
            *SECRET*)
                value=$(openssl rand -hex 24)
                ;;
            DATABASE_URL)
                value="postgres://attribution:${POSTGRES_PASSWORD:-generated_password}@localhost:5432/attribution?sslmode=disable"
                ;;
            CLICKHOUSE_URL)
                value="http://attribution:${CLICKHOUSE_PASSWORD:-generated_password}@localhost:8123/attribution"
                ;;
            REDIS_URL)
                value="redis://default:${REDIS_PASSWORD:-generated_password}@localhost:6379"
                ;;
            *)
                value="generated_value_for_$var"
                ;;
        esac

        echo "export $var=\"$value\"" >> "$PROJECT_ROOT/.env.generated"
        log_success "Generated $var"
    done

    log_info "Generated secrets saved to .env.generated"
    log_warning "Please review and copy to your .env file"
}

# Generate strong secrets
generate_strong_secrets() {
    local vars=("$@")

    log_info "Generating stronger secrets..."

    for var in "${vars[@]}"; do
        local value
        case $var in
            *PASSWORD*)
                value=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-24)
                ;;
            JWT_SECRET|ENCRYPTION_KEY|*KEY*)
                value=$(openssl rand -hex 32)
                ;;
            *SECRET*)
                value=$(openssl rand -hex 32)
                ;;
        esac

        echo "export $var=\"$value\"" >> "$PROJECT_ROOT/.env.stronger"
        log_success "Generated stronger $var"
    done

    log_info "Stronger secrets saved to .env.stronger"
    log_warning "Please review and update your .env file"
}

# Test database connections
test_database_connections() {
    log_info "Testing database connections..."

    # Test PostgreSQL
    if [ -n "${DATABASE_URL:-}" ]; then
        log_info "Testing PostgreSQL connection..."
        if command -v psql &> /dev/null; then
            if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
                log_success "✓ PostgreSQL connection successful"
            else
                log_error "✗ PostgreSQL connection failed"
                return 1
            fi
        else
            log_warning "psql not available, skipping PostgreSQL connection test"
        fi
    fi

    # Test ClickHouse
    if [ -n "${CLICKHOUSE_URL:-}" ]; then
        log_info "Testing ClickHouse connection..."
        local clickhouse_health_url="${CLICKHOUSE_URL}/ping"
        if curl -f -s "$clickhouse_health_url" &> /dev/null; then
            log_success "✓ ClickHouse connection successful"
        else
            log_error "✗ ClickHouse connection failed"
            return 1
        fi
    fi

    # Test Redis
    if [ -n "${REDIS_URL:-}" ]; then
        log_info "Testing Redis connection..."
        if command -v redis-cli &> /dev/null; then
            if redis-cli -u "$REDIS_URL" ping &> /dev/null; then
                log_success "✓ Redis connection successful"
            else
                log_error "✗ Redis connection failed"
                return 1
            fi
        else
            log_warning "redis-cli not available, skipping Redis connection test"
        fi
    fi
}

# Validate Docker setup
validate_docker_setup() {
    log_info "Validating Docker setup..."

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        if [ "$FIX_ISSUES" = "true" ]; then
            log_info "Attempting to start Docker..."
            sudo systemctl start docker || sudo service docker start
        else
            return 1
        fi
    else
        log_success "✓ Docker daemon is running"
    fi

    # Check Docker Compose
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        log_info "Validating docker-compose.yml..."
        if docker-compose -f "$PROJECT_ROOT/docker-compose.yml" config &> /dev/null; then
            log_success "✓ docker-compose.yml is valid"
        else
            log_error "✗ docker-compose.yml has errors"
            return 1
        fi
    else
        log_warning "docker-compose.yml not found"
    fi
}

# Validate Kubernetes setup (for staging/production)
validate_kubernetes_setup() {
    if [ "$ENVIRONMENT" = "development" ]; then
        return 0
    fi

    log_info "Validating Kubernetes setup..."

    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        return 1
    else
        log_success "✓ Kubernetes cluster connection successful"
    fi

    # Check namespace
    local namespace="$ENVIRONMENT"
    if ! kubectl get namespace "$namespace" &> /dev/null; then
        log_warning "Namespace $namespace does not exist"
        if [ "$FIX_ISSUES" = "true" ]; then
            log_info "Creating namespace $namespace..."
            kubectl create namespace "$namespace"
            log_success "✓ Created namespace $namespace"
        else
            return 1
        fi
    else
        log_success "✓ Namespace $namespace exists"
    fi
}

# Generate summary report
generate_summary() {
    log_info "Environment validation summary for $ENVIRONMENT:"
    echo "=============================================="

    # Environment info
    echo "Environment: $ENVIRONMENT"
    echo "Project Root: $PROJECT_ROOT"
    echo "Timestamp: $(date)"
    echo ""

    # Quick health check
    echo "Quick Health Check:"
    echo "- Tools: $(validate_tools &> /dev/null && echo "✓ OK" || echo "✗ ISSUES")"
    echo "- Environment Variables: $(validate_environment_variables &> /dev/null && echo "✓ OK" || echo "✗ ISSUES")"
    echo "- Docker: $(validate_docker_setup &> /dev/null && echo "✓ OK" || echo "✗ ISSUES")"

    if [ "$ENVIRONMENT" != "development" ]; then
        echo "- Kubernetes: $(validate_kubernetes_setup &> /dev/null && echo "✓ OK" || echo "✗ ISSUES")"
    fi

    echo ""
    echo "For detailed information, run with --verbose flag"
}

# Main execution
main() {
    log_critical "🔧 ENVIRONMENT VALIDATION STARTED 🔧"
    log_info "Environment: $ENVIRONMENT"
    log_info "Fix Issues: $FIX_ISSUES"
    log_info "================================="

    # Change to project root
    cd "$PROJECT_ROOT"

    # Execute validation steps
    load_environment
    validate_tools
    validate_environment_variables
    validate_docker_setup

    if [ "$ENVIRONMENT" != "development" ]; then
        validate_kubernetes_setup
    fi

    if [ "$ENVIRONMENT" = "development" ]; then
        test_database_connections
    fi

    generate_summary

    log_success "🎉 ENVIRONMENT VALIDATION COMPLETED! 🎉"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_args "$@"
    main
fi