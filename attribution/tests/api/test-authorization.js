#!/usr/bin/env node
// UnMoGrowP Attribution Platform - Authorization Test Suite
// 🔐 Test JWT RBAC security system
// Usage: node test-authorization.js

const API_BASE = 'http://localhost:3003';

// Test users with different roles
const TEST_USERS = {
  admin: {
    email: 'admin@unmogrowp.com',
    password: 'password123',
    expectedRole: 'super_admin'
  },
  user: {
    email: 'test@test.com',
    password: 'password123',
    expectedRole: 'admin'
  },
  readonly: {
    email: 'readonly@unmogrowp.com',
    password: 'password123',
    expectedRole: 'readonly'
  }
};

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.blue}${colors.bold}🧪 Testing: ${testName}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// HTTP request helper
async function request(method, endpoint, token = null, body = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return {
      status: response.status,
      success: response.ok,
      data,
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message,
    };
  }
}

// Test: Health check (public)
async function testHealthCheck() {
  logTest('Health Check (Public)');

  const result = await request('GET', '/health');

  if (result.success && result.data.security === 'JWT-RBAC-ENABLED') {
    logSuccess('Health check passed - RBAC security enabled');
    return true;
  } else {
    logError('Health check failed or RBAC not enabled');
    return false;
  }
}

// Test: User authentication
async function testAuthentication() {
  logTest('User Authentication');

  const tokens = {};

  for (const [userType, credentials] of Object.entries(TEST_USERS)) {
    log(`\nTesting ${userType} login...`);

    const result = await request('POST', '/api/auth/login', null, credentials);

    if (result.success && result.data.data?.token) {
      tokens[userType] = result.data.data.token;
      logSuccess(`${userType} login successful - Token: ${result.data.data.token.substring(0, 20)}...`);
      log(`   Role: ${result.data.data.user.role}`);
    } else {
      logError(`${userType} login failed: ${result.data?.message || 'Unknown error'}`);
    }
  }

  return tokens;
}

// Test: Protected endpoint access
async function testProtectedEndpoints(tokens) {
  logTest('Protected Endpoint Access');

  // Test cases: [endpoint, method, requiredRole/permission, shouldSucceed]
  const testCases = [
    // Dashboard - analytics:read permission required
    ['/api/dashboard/stats', 'GET', 'analytics:read', ['admin', 'user']],
    ['/api/dashboard/charts/events', 'GET', 'analytics:read', ['admin', 'user']],

    // Apps - apps:read permission required
    ['/api/apps', 'GET', 'apps:read', ['admin', 'user', 'readonly']],
    ['/api/apps', 'POST', 'apps:create', ['admin', 'user']],

    // Admin endpoints - admin role required
    ['/api/admin/users', 'GET', 'admin', ['admin']],
    ['/api/admin/security/audit', 'GET', 'super_admin', ['admin']],

    // Profile - authentication required
    ['/api/profile', 'GET', 'user', ['admin', 'user', 'readonly']],
  ];

  for (const [endpoint, method, requirement, allowedUsers] of testCases) {
    log(`\n📍 Testing ${method} ${endpoint} (requires: ${requirement})`);

    for (const [userType, token] of Object.entries(tokens)) {
      if (!token) continue;

      const shouldSucceed = allowedUsers.includes(userType);
      const result = await request(method, endpoint, token);

      if (shouldSucceed) {
        if (result.success) {
          logSuccess(`${userType}: Access granted (expected)`);
        } else {
          logError(`${userType}: Access denied (unexpected) - Status: ${result.status}`);
          if (result.data?.message) {
            log(`   Message: ${result.data.message}`);
          }
        }
      } else {
        if (!result.success && result.status === 403) {
          logSuccess(`${userType}: Access denied (expected) - Status: ${result.status}`);
        } else if (result.success) {
          logError(`${userType}: Access granted (unexpected) - SECURITY BREACH!`);
        } else {
          logWarning(`${userType}: Access denied with status ${result.status} (expected 403)`);
        }
      }
    }
  }
}

// Test: No authentication (should fail)
async function testNoAuthentication() {
  logTest('No Authentication (Should Fail)');

  const protectedEndpoints = [
    '/api/dashboard/stats',
    '/api/apps',
    '/api/profile',
    '/api/admin/users',
  ];

  for (const endpoint of protectedEndpoints) {
    const result = await request('GET', endpoint);

    if (result.status === 401) {
      logSuccess(`${endpoint}: Properly blocked (401)`);
    } else {
      logError(`${endpoint}: Not properly protected! Status: ${result.status}`);
    }
  }
}

// Test: Invalid token (should fail)
async function testInvalidToken() {
  logTest('Invalid Token (Should Fail)');

  const invalidTokens = [
    'invalid-token',
    'Bearer invalid-token',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
  ];

  for (const invalidToken of invalidTokens) {
    const result = await request('GET', '/api/profile', invalidToken);

    if (result.status === 401) {
      logSuccess(`Invalid token properly rejected (401)`);
    } else {
      logError(`Invalid token accepted! Status: ${result.status}`);
    }
  }
}

// Test: Token tampering (should fail)
async function testTokenTampering(tokens) {
  logTest('Token Tampering (Should Fail)');

  if (!tokens.user) {
    logWarning('No user token available for tampering test');
    return;
  }

  // Tamper with token by changing last character
  const originalToken = tokens.user;
  const tamperedToken = originalToken.slice(0, -1) + 'X';

  const result = await request('GET', '/api/profile', tamperedToken);

  if (result.status === 401) {
    logSuccess('Tampered token properly rejected (401)');
  } else {
    logError(`Tampered token accepted! Status: ${result.status} - CRITICAL SECURITY ISSUE!`);
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('🔐 UnMoGrowP Attribution Platform - Authorization Test Suite');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`${colors.reset}`);

  try {
    // Check if API server is running
    const healthOk = await testHealthCheck();
    if (!healthOk) {
      logError('API server is not running or RBAC is not enabled');
      logError('Please start the secure API server first:');
      log('   cd api && PORT=3003 bun run index-secure.ts', 'yellow');
      process.exit(1);
    }

    // Run authentication tests
    const tokens = await testAuthentication();

    if (Object.keys(tokens).length === 0) {
      logError('No tokens obtained - cannot continue with authorization tests');
      process.exit(1);
    }

    // Run authorization tests
    await testProtectedEndpoints(tokens);
    await testNoAuthentication();
    await testInvalidToken();
    await testTokenTampering(tokens);

    console.log(`\n${colors.bold}${colors.green}✅ Authorization tests completed!${colors.reset}`);
    console.log(`\n${colors.yellow}📝 Next steps:${colors.reset}`);
    log('1. Start Docker infrastructure: make start-infra');
    log('2. Apply RBAC migration: psql -U unmogrowp -d unmogrowp < database/rbac-upgrade-migration.sql');
    log('3. Start secure API server: cd api && PORT=3003 bun run index-secure.ts');
    log('4. Run this test again to verify full functionality');

  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  logError('This test requires Node.js 18+ with native fetch support');
  logError('Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Run the tests
runTests();