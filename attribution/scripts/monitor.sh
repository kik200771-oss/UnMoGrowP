#!/bin/bash

# UnMoGrowP Attribution Platform - Monitoring Script
# Continuous monitoring with alerts

# Configuration
ALERT_EMAIL="admin@example.com"
SLACK_WEBHOOK=""  # Set your Slack webhook URL
DISCORD_WEBHOOK=""  # Set your Discord webhook URL
CHECK_INTERVAL=60  # seconds

# Alert thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=90

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 UnMoGrowP Monitoring Service"
echo "==============================="
echo "Check interval: ${CHECK_INTERVAL}s"
echo ""

# Send alert function
send_alert() {
    local severity=$1
    local message=$2
    local emoji="⚠️"

    if [ "$severity" == "critical" ]; then
        emoji="🚨"
    elif [ "$severity" == "warning" ]; then
        emoji="⚠️"
    elif [ "$severity" == "info" ]; then
        emoji="ℹ️"
    fi

    echo -e "${RED}${emoji} ALERT: ${message}${NC}"

    # Send to Slack
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"${emoji} **${severity^^}**: ${message}\"}" \
            2>/dev/null
    fi

    # Send to Discord
    if [ -n "$DISCORD_WEBHOOK" ]; then
        curl -X POST "$DISCORD_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"content\":\"${emoji} **${severity^^}**: ${message}\"}" \
            2>/dev/null
    fi

    # Send email
    if command -v mail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "UnMoGrowP Alert: $severity" "$ALERT_EMAIL"
    fi
}

# Check system resources
check_system() {
    # CPU usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    CPU_USAGE_INT=${CPU_USAGE%.*}

    if [ "$CPU_USAGE_INT" -gt "$CPU_THRESHOLD" ]; then
        send_alert "warning" "High CPU usage: ${CPU_USAGE}%"
    fi

    # Memory usage
    MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')

    if [ "$MEM_USAGE" -gt "$MEMORY_THRESHOLD" ]; then
        send_alert "warning" "High memory usage: ${MEM_USAGE}%"
    fi

    # Disk usage
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
        send_alert "critical" "High disk usage: ${DISK_USAGE}%"
    fi

    echo -e "${GREEN}✓${NC} System: CPU ${CPU_USAGE}%, Memory ${MEM_USAGE}%, Disk ${DISK_USAGE}%"
}

# Check service health
check_services() {
    # Frontend
    if ! curl -sf http://localhost:5173 > /dev/null; then
        send_alert "critical" "Frontend (port 5173) is DOWN"
        echo -e "${RED}✗${NC} Frontend: DOWN"
    else
        echo -e "${GREEN}✓${NC} Frontend: UP"
    fi

    # API
    if ! curl -sf http://localhost:3001/health > /dev/null; then
        send_alert "critical" "API (port 3001) is DOWN"
        echo -e "${RED}✗${NC} API: DOWN"
    else
        echo -e "${GREEN}✓${NC} API: UP"
    fi

    # Go Backend
    if ! curl -sf http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC} Go Backend: DOWN (may not be started)"
    else
        echo -e "${GREEN}✓${NC} Go Backend: UP"
    fi
}

# Check Docker containers
check_docker() {
    local unhealthy_count=0

    while IFS= read -r line; do
        container=$(echo "$line" | awk '{print $1}')
        status=$(echo "$line" | awk '{print $NF}')

        if [[ "$status" == *"unhealthy"* ]]; then
            send_alert "critical" "Docker container $container is unhealthy"
            echo -e "${RED}✗${NC} Docker: $container is unhealthy"
            ((unhealthy_count++))
        fi
    done < <(docker ps --format "table {{.Names}}\t{{.Status}}" | tail -n +2)

    if [ "$unhealthy_count" -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Docker: All containers healthy"
    fi
}

# Check database connections
check_databases() {
    # PostgreSQL
    if docker exec unmogrowp-postgres pg_isready -U unmogrowp > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} PostgreSQL: UP"
    else
        send_alert "critical" "PostgreSQL is not responding"
        echo -e "${RED}✗${NC} PostgreSQL: DOWN"
    fi

    # ClickHouse
    if docker exec unmogrowp-clickhouse clickhouse-client --query "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} ClickHouse: UP"
    else
        send_alert "critical" "ClickHouse is not responding"
        echo -e "${RED}✗${NC} ClickHouse: DOWN"
    fi

    # Redis
    if docker exec unmogrowp-redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Redis: UP"
    else
        send_alert "critical" "Redis is not responding"
        echo -e "${RED}✗${NC} Redis: DOWN"
    fi
}

# Main monitoring loop
echo "Starting monitoring... Press Ctrl+C to stop"
echo ""

while true; do
    clear
    echo "🔍 UnMoGrowP Monitoring - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================================"
    echo ""

    echo "📊 System Resources:"
    check_system
    echo ""

    echo "🌐 Services:"
    check_services
    echo ""

    echo "🐳 Docker Containers:"
    check_docker
    echo ""

    echo "🗄️  Databases:"
    check_databases
    echo ""

    echo "Next check in ${CHECK_INTERVAL}s..."
    sleep "$CHECK_INTERVAL"
done
