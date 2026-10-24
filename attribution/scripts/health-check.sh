#!/bin/bash

# UnMoGrowP Attribution Platform - Health Check Script
# Checks if all services are running and healthy

echo "🏥 UnMoGrowP Health Check"
echo "========================="
echo ""

ERRORS=0

# Check Frontend (SvelteKit)
echo "🔍 Checking Frontend (port 5173)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200\|301\|302"; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not responding"
    ERRORS=$((ERRORS + 1))
fi

# Check API (Bun + Hono)
echo "🔍 Checking API (port 3001)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health | grep -q "200"; then
    echo "✅ API is running"
else
    echo "❌ API is not responding"
    ERRORS=$((ERRORS + 1))
fi

# Check Go Backend (optional)
echo "🔍 Checking Go Backend (port 8080)..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health | grep -q "200"; then
    echo "✅ Go Backend is running"
else
    echo "⚠️  Go Backend is not responding (may not be started yet)"
fi

# Check PostgreSQL
echo "🔍 Checking PostgreSQL (port 5432)..."
if docker ps | grep -q "postgres"; then
    echo "✅ PostgreSQL container is running"
else
    echo "❌ PostgreSQL container is not running"
    ERRORS=$((ERRORS + 1))
fi

# Check ClickHouse
echo "🔍 Checking ClickHouse (port 9000)..."
if docker ps | grep -q "clickhouse"; then
    echo "✅ ClickHouse container is running"
else
    echo "❌ ClickHouse container is not running"
    ERRORS=$((ERRORS + 1))
fi

# Check Kafka
echo "🔍 Checking Kafka (port 9092)..."
if docker ps | grep -q "kafka"; then
    echo "✅ Kafka container is running"
else
    echo "❌ Kafka container is not running"
    ERRORS=$((ERRORS + 1))
fi

# Check Redis
echo "🔍 Checking Redis (port 6379)..."
if docker ps | grep -q "redis"; then
    echo "✅ Redis container is running"
else
    echo "❌ Redis container is not running"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "================================"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All critical services are healthy!"
    exit 0
else
    echo "❌ $ERRORS service(s) have issues"
    echo ""
    echo "💡 Troubleshooting:"
    echo "  - Run 'make start-infra' to start databases"
    echo "  - Run 'make start' to start all services"
    echo "  - Check logs with 'docker-compose logs'"
    exit 1
fi
