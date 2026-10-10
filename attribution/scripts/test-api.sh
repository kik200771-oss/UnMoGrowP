#!/bin/bash

# UnMoGrowP Attribution Platform - API Testing Script
# Tests all API endpoints

set -e

API_URL="http://localhost:3001"
TOKEN=""

echo "🧪 UnMoGrowP API Test Suite"
echo "============================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5

    echo -n "Testing: $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data")
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [[ "$status_code" == "$expected_status"* ]]; then
        echo -e "${GREEN}✅ PASS${NC} ($status_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC} (expected $expected_status, got $status_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
    fi
}

# 1. Health Check
echo "1️⃣  Health & Info Endpoints"
echo "----------------------------"
test_endpoint "Health Check" "GET" "/health" "" "200"
test_endpoint "API Info" "GET" "/" "" "200"
echo ""

# 2. Authentication
echo "2️⃣  Authentication Endpoints"
echo "----------------------------"

# Login
echo "→ Testing login..."
login_response=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@test.com",
        "password": "password123",
        "rememberMe": true,
        "recaptchaToken": "test-token"
    }')

TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Login successful, token received${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ Login failed, no token received${NC}"
    FAILED=$((FAILED + 1))
fi

# Google Auth
test_endpoint "Google OAuth" "POST" "/api/auth/google" \
    '{"idToken":"test-google-token","recaptchaToken":"test-token"}' "200"

# Logout
test_endpoint "Logout" "POST" "/api/auth/logout" "" "200"

echo ""

# 3. Dashboard
echo "3️⃣  Dashboard Endpoints"
echo "----------------------"
test_endpoint "Dashboard Stats" "GET" "/api/dashboard/stats" "" "200"
test_endpoint "Chart Data (installs)" "GET" "/api/dashboard/charts?type=installs&range=7d" "" "200"
test_endpoint "Chart Data (revenue)" "GET" "/api/dashboard/charts?type=revenue&range=30d" "" "200"
echo ""

# 4. Attribution
echo "4️⃣  Attribution Endpoints"
echo "-------------------------"
test_endpoint "Track Event" "POST" "/api/events/track" \
    '{"eventType":"install","userId":"user123","appId":"app456","platform":"ios"}' "200"
echo ""

# 5. Apps (if implemented)
echo "5️⃣  Apps Management Endpoints"
echo "-----------------------------"
test_endpoint "List Apps" "GET" "/api/apps" "" "200"
test_endpoint "Get App Details" "GET" "/api/apps/app123" "" "200"
echo ""

# Summary
echo "================================"
echo "📊 Test Results"
echo "================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
