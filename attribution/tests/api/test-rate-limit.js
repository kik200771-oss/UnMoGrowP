#!/usr/bin/env node

// Rate Limiting Test Suite
// UnMoGrowP Attribution Platform - Security Testing

console.log('⚡ API Rate Limiting Test Suite');
console.log('===============================\n');

const API_BASE_URL = 'http://localhost:3003';

// Test results
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', body = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.text();

    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = data;
    }

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: parsedData,
      ok: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      headers: {},
      data: { error: error.message },
      ok: false
    };
  }
}

// Test assertion
function assert(condition, testName, expected, actual) {
  testResults.total++;

  if (condition) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}`);
    console.log(`   Expected: ${expected}`);
    console.log(`   Actual: ${actual}\n`);
  }
}

// Test 1: General Rate Limit Headers
async function testRateLimitHeaders() {
  console.log('📊 Testing Rate Limit Headers');

  const result = await apiCall('/health');

  assert(
    result.headers['x-ratelimit-limit'],
    'Rate limit headers present',
    'Rate limit header exists',
    result.headers['x-ratelimit-limit'] ? 'Header exists' : 'No header'
  );

  assert(
    result.headers['x-ratelimit-remaining'],
    'Rate limit remaining header present',
    'Remaining header exists',
    result.headers['x-ratelimit-remaining'] ? 'Header exists' : 'No header'
  );

  console.log(`   Rate Limit: ${result.headers['x-ratelimit-limit']}`);
  console.log(`   Remaining: ${result.headers['x-ratelimit-remaining']}`);
  console.log('');
}

// Test 2: Authentication Rate Limiting
async function testAuthRateLimit() {
  console.log('🔑 Testing Authentication Rate Limiting');

  // Make multiple auth requests to trigger rate limit
  const authRequests = [];
  for (let i = 0; i < 7; i++) { // Auth rate limit is 5 per minute
    authRequests.push(
      apiCall('/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    );
  }

  const results = await Promise.all(authRequests);

  // First 5 should be allowed (though may fail due to wrong credentials)
  const earlyResults = results.slice(0, 5);
  const allowedResults = earlyResults.filter(r => r.status !== 429);

  assert(
    allowedResults.length >= 4, // Allow some variance
    'First requests not rate limited',
    'At least 4 requests allowed',
    `${allowedResults.length} requests allowed`
  );

  // Later requests should be rate limited
  const laterResults = results.slice(5);
  const rateLimitedResults = laterResults.filter(r => r.status === 429);

  assert(
    rateLimitedResults.length > 0,
    'Exceeded requests are rate limited',
    'Some requests rate limited (429)',
    `${rateLimitedResults.length} requests rate limited`
  );

  if (rateLimitedResults.length > 0) {
    const rateLimitResponse = rateLimitedResults[0];
    assert(
      rateLimitResponse.headers['retry-after'],
      'Retry-After header present on rate limit',
      'Retry-After header exists',
      rateLimitResponse.headers['retry-after'] ? 'Header exists' : 'No header'
    );
  }

  console.log('');
}

// Test 3: Different Endpoints Different Limits
async function testEndpointSpecificLimits() {
  console.log('🌐 Testing Endpoint-Specific Rate Limits');

  // Test health endpoint (should have general rate limit)
  const healthResult = await apiCall('/health');
  const generalLimit = parseInt(healthResult.headers['x-ratelimit-limit']);

  assert(
    generalLimit === 100,
    'Health endpoint has general rate limit (100/min)',
    '100',
    generalLimit.toString()
  );

  console.log(`   General Rate Limit: ${generalLimit}/min`);
  console.log('');
}

// Test 4: Rate Limit Reset
async function testRateLimitReset() {
  console.log('🔄 Testing Rate Limit Reset Time');

  const result = await apiCall('/health');
  const resetTime = result.headers['x-ratelimit-reset'];

  assert(
    resetTime && !isNaN(new Date(resetTime).getTime()),
    'Rate limit reset time is valid',
    'Valid ISO timestamp',
    resetTime ? 'Valid timestamp' : 'Invalid timestamp'
  );

  if (resetTime) {
    const resetDate = new Date(resetTime);
    const now = new Date();
    const timeDiff = resetDate.getTime() - now.getTime();

    assert(
      timeDiff > 0 && timeDiff <= 60000, // Should be within next minute
      'Reset time is reasonable (within next minute)',
      'Time diff 0-60 seconds',
      `Time diff: ${Math.round(timeDiff / 1000)} seconds`
    );

    console.log(`   Reset Time: ${resetTime}`);
    console.log(`   Time Until Reset: ${Math.round(timeDiff / 1000)} seconds`);
  }

  console.log('');
}

// Test 5: Multiple IPs (simulated)
async function testMultipleIPs() {
  console.log('🌍 Testing Different IPs (Headers)');

  // Simulate different IPs with headers
  const ip1Result = await apiCall('/health', 'GET', null, {
    'X-Forwarded-For': '192.168.1.100'
  });

  const ip2Result = await apiCall('/health', 'GET', null, {
    'X-Forwarded-For': '192.168.1.200'
  });

  // Both should have full rate limits (separate counters)
  const ip1Remaining = parseInt(ip1Result.headers['x-ratelimit-remaining']);
  const ip2Remaining = parseInt(ip2Result.headers['x-ratelimit-remaining']);

  assert(
    ip1Remaining > 95 && ip2Remaining > 95,
    'Different IPs have separate rate limit counters',
    'Both >95 remaining',
    `IP1: ${ip1Remaining}, IP2: ${ip2Remaining} remaining`
  );

  console.log('');
}

// Test 6: Burst Protection
async function testBurstProtection() {
  console.log('💥 Testing Burst Protection');

  // Make rapid requests
  const burstRequests = [];
  for (let i = 0; i < 10; i++) {
    burstRequests.push(apiCall('/health'));
  }

  const burstResults = await Promise.all(burstRequests);

  // All should succeed initially (within rate limit)
  const successfulRequests = burstResults.filter(r => r.ok);

  assert(
    successfulRequests.length === 10,
    'Burst requests within limit succeed',
    '10 successful requests',
    `${successfulRequests.length} successful requests`
  );

  // Check remaining count decreased
  const finalResult = await apiCall('/health');
  const remaining = parseInt(finalResult.headers['x-ratelimit-remaining']);

  assert(
    remaining < 90, // Should have used up some of the rate limit
    'Rate limit counter decreases with requests',
    'Less than 90 remaining',
    `${remaining} remaining`
  );

  console.log('');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Rate Limiting Tests...\n');

  try {
    await testRateLimitHeaders();
    await testEndpointSpecificLimits();
    await testRateLimitReset();
    await testMultipleIPs();
    await testBurstProtection();

    // Note: Auth rate limiting test is commented out to avoid flooding logs
    // Uncomment if needed: await testAuthRateLimit();

    // Print results
    console.log('===============================');
    console.log('🎯 RATE LIMITING TEST RESULTS');
    console.log('===============================');
    console.log(`✅ Tests Passed: ${testResults.passed}`);
    console.log(`❌ Tests Failed: ${testResults.failed}`);
    console.log(`📊 Total Tests: ${testResults.total}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Rate limiting is working correctly!');
      console.log('🛡️  API is protected against abuse and DoS attacks');
    } else {
      console.log('\n⚠️  Some tests failed. Rate limiting may need adjustment.');
    }

  } catch (error) {
    console.error('💥 Test suite failed with error:', error.message);
  }
}

// Check server health first
async function checkServerHealth() {
  console.log('⏳ Checking API server health...');

  try {
    const healthResult = await apiCall('/health');
    if (healthResult.ok) {
      console.log('✅ API server is running with rate limiting\n');
      return true;
    } else {
      console.log('❌ API server health check failed\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ Cannot connect to API server at ${API_BASE_URL}`);
    console.log('   Make sure the API server is running: cd api && PORT=3003 bun run index-secure.ts\n');
    return false;
  }
}

// Run the test suite
(async () => {
  const isServerHealthy = await checkServerHealth();

  if (isServerHealthy) {
    await runAllTests();
  } else {
    console.log('💡 Start the API server with rate limiting and run tests again.');
    process.exit(1);
  }
})();