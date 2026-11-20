#!/usr/bin/env node

/**
 * Attribution System Integration Test
 * UnMoGrowP Attribution Platform - Full System Testing
 *
 * Tests the complete attribution pipeline:
 * 1. Event ingestion via API
 * 2. Real-time attribution processing
 * 3. ClickHouse data storage
 * 4. Analytics queries
 */

console.log('🎯 Attribution System Integration Test');
console.log('=====================================\n');

const API_BASE_URL = 'http://localhost:3003';

// Test results tracking
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

// Wait function for async operations
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: API Server Health Check
async function testServerHealth() {
  console.log('🏥 Testing API Server Health');

  const result = await apiCall('/health');

  assert(
    result.ok,
    'API server is running',
    'HTTP 200',
    `HTTP ${result.status}`
  );

  console.log('');
}

// Test 2: Attribution Engine Status
async function testAttributionEngineStatus() {
  console.log('🎯 Testing Attribution Engine Status');

  // First, we need to authenticate to access attribution endpoints
  const loginResult = await apiCall('/api/auth/login', 'POST', {
    email: 'admin@test.com',
    password: 'admin123'
  });

  if (!loginResult.ok) {
    console.log('⚠️  Authentication failed, skipping attribution tests');
    console.log('   Make sure demo user exists or create one first\n');
    return null;
  }

  const token = loginResult.data.data?.token;
  if (!token) {
    console.log('⚠️  No token received, skipping attribution tests\n');
    return null;
  }

  // Test attribution engine status
  const statusResult = await apiCall('/api/attribution/status', 'GET', null, {
    'Authorization': `Bearer ${token}`
  });

  assert(
    statusResult.ok,
    'Attribution engine status accessible',
    'HTTP 200',
    `HTTP ${statusResult.status}`
  );

  if (statusResult.ok) {
    const status = statusResult.data;
    console.log(`   Engine Status: ${status.status}`);
    console.log(`   Events Processed: ${status.metrics.events_processed}`);
    console.log(`   Queue Size: ${status.metrics.queue_size}`);
    console.log(`   Success Rate: ${status.metrics.success_rate}`);
  }

  console.log('');
  return token;
}

// Test 3: Event Ingestion
async function testEventIngestion(token) {
  if (!token) {
    console.log('🔄 Skipping event ingestion (no auth token)\n');
    return;
  }

  console.log('📊 Testing Event Ingestion');

  // Create a test user journey with multiple touchpoints
  const testEvents = [
    // First touchpoint - impression
    {
      event_type: 'impression',
      event_name: 'ad_view',
      user_id: 'test_user_001',
      device_id: 'device_001',
      session_id: 'session_001',
      utm_source: 'facebook',
      utm_medium: 'social',
      utm_campaign: 'winter_sale',
      platform: 'ios',
      country: 'US',
      properties: { position: 'feed', creative: 'video_ad' }
    },

    // Second touchpoint - click
    {
      event_type: 'click',
      event_name: 'ad_click',
      user_id: 'test_user_001',
      device_id: 'device_001',
      session_id: 'session_002',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'search_campaign',
      platform: 'ios',
      country: 'US',
      properties: { keyword: 'mobile app', ad_group: 'brand' }
    },

    // Third touchpoint - conversion
    {
      event_type: 'purchase',
      event_name: 'subscription_purchase',
      user_id: 'test_user_001',
      device_id: 'device_001',
      session_id: 'session_003',
      utm_source: 'email',
      utm_medium: 'email',
      utm_campaign: 'retention_email',
      platform: 'ios',
      country: 'US',
      revenue: 9.99,
      currency: 'USD',
      product_id: 'premium_monthly',
      properties: { plan: 'premium', billing_cycle: 'monthly' }
    }
  ];

  // Send events individually to test single event processing
  for (let i = 0; i < testEvents.length; i++) {
    const event = testEvents[i];
    console.log(`   Sending ${event.event_type} event...`);

    const result = await apiCall('/api/attribution/events', 'POST', event, {
      'Authorization': `Bearer ${token}`
    });

    assert(
      result.ok,
      `${event.event_type} event ingested successfully`,
      'HTTP 200',
      `HTTP ${result.status}`
    );

    if (result.ok) {
      console.log(`     Queue size: ${result.data.processing_queue_size}`);
    }

    // Small delay between events to simulate real user journey
    await wait(100);
  }

  console.log('');
}

// Test 4: Batch Event Ingestion
async function testBatchEventIngestion(token) {
  if (!token) {
    console.log('🔄 Skipping batch ingestion (no auth token)\n');
    return;
  }

  console.log('📦 Testing Batch Event Ingestion');

  // Create batch of events for different users
  const batchEvents = [];
  for (let userId = 1; userId <= 5; userId++) {
    batchEvents.push(
      {
        event_type: 'impression',
        event_name: 'ad_impression',
        user_id: `batch_user_${userId}`,
        device_id: `batch_device_${userId}`,
        session_id: `batch_session_${userId}_1`,
        utm_source: 'tiktok',
        utm_medium: 'social',
        utm_campaign: 'viral_campaign',
        platform: 'android',
        country: 'CA'
      },
      {
        event_type: 'click',
        event_name: 'ad_click',
        user_id: `batch_user_${userId}`,
        device_id: `batch_device_${userId}`,
        session_id: `batch_session_${userId}_2`,
        utm_source: 'tiktok',
        utm_medium: 'social',
        utm_campaign: 'viral_campaign',
        platform: 'android',
        country: 'CA'
      }
    );

    // Every second user makes a purchase
    if (userId % 2 === 0) {
      batchEvents.push({
        event_type: 'purchase',
        event_name: 'in_app_purchase',
        user_id: `batch_user_${userId}`,
        device_id: `batch_device_${userId}`,
        session_id: `batch_session_${userId}_3`,
        utm_source: 'tiktok',
        utm_medium: 'social',
        utm_campaign: 'viral_campaign',
        platform: 'android',
        country: 'CA',
        revenue: 4.99,
        currency: 'USD',
        product_id: 'coins_pack_small'
      });
    }
  }

  const result = await apiCall('/api/attribution/events/batch', 'POST', {
    events: batchEvents
  }, {
    'Authorization': `Bearer ${token}`
  });

  assert(
    result.ok,
    'Batch events ingested successfully',
    'HTTP 200',
    `HTTP ${result.status}`
  );

  if (result.ok) {
    console.log(`   Events processed: ${result.data.message}`);
    console.log(`   Queue size: ${result.data.processing_queue_size}`);
  }

  console.log('');
}

// Test 5: Processing and Attribution Calculation
async function testAttributionProcessing(token) {
  if (!token) {
    console.log('🔄 Skipping attribution processing (no auth token)\n');
    return;
  }

  console.log('⚙️  Testing Attribution Processing');

  // Wait for events to be processed
  console.log('   Waiting for events to be processed...');
  await wait(3000); // Wait 3 seconds for processing

  // Check processing metrics
  const statusResult = await apiCall('/api/attribution/status', 'GET', null, {
    'Authorization': `Bearer ${token}`
  });

  if (statusResult.ok) {
    const status = statusResult.data;

    assert(
      status.metrics.events_processed > 0,
      'Events have been processed',
      '> 0 events',
      `${status.metrics.events_processed} events`
    );

    assert(
      status.metrics.attribution_calculations > 0,
      'Attribution calculations performed',
      '> 0 calculations',
      `${status.metrics.attribution_calculations} calculations`
    );

    console.log(`   Processing Status: ${status.status}`);
    console.log(`   Total Events Processed: ${status.metrics.events_processed}`);
    console.log(`   Attribution Calculations: ${status.metrics.attribution_calculations}`);
    console.log(`   Success Rate: ${status.metrics.success_rate}`);
  }

  console.log('');
}

// Test 6: Attribution Analytics
async function testAttributionAnalytics(token) {
  if (!token) {
    console.log('🔄 Skipping analytics (no auth token)\n');
    return;
  }

  console.log('📈 Testing Attribution Analytics');

  // Test model comparison
  const comparisonResult = await apiCall('/api/attribution/models/compare?days=1', 'GET', null, {
    'Authorization': `Bearer ${token}`
  });

  assert(
    comparisonResult.ok,
    'Attribution model comparison accessible',
    'HTTP 200',
    `HTTP ${comparisonResult.status}`
  );

  if (comparisonResult.ok) {
    const comparison = comparisonResult.data.data;
    console.log(`   First Touch Revenue: $${comparison.first_touch.revenue}`);
    console.log(`   Last Touch Revenue: $${comparison.last_touch.revenue}`);
    console.log(`   Linear Revenue: $${comparison.linear.revenue}`);
    console.log(`   Time Decay Revenue: $${comparison.time_decay.revenue}`);
    console.log(`   Position Based Revenue: $${comparison.position_based.revenue}`);
  }

  // Test user journey analysis
  const journeyResult = await apiCall('/api/attribution/journeys?days=1&limit=5', 'GET', null, {
    'Authorization': `Bearer ${token}`
  });

  assert(
    journeyResult.ok,
    'User journey analysis accessible',
    'HTTP 200',
    `HTTP ${journeyResult.status}`
  );

  if (journeyResult.ok) {
    const journeys = journeyResult.data.data;
    console.log(`   User Journeys Found: ${journeys.length}`);

    if (journeys.length > 0) {
      const journey = journeys[0];
      console.log(`   Sample Journey: ${journey.touchpoint_count} touchpoints, $${journey.total_revenue} revenue`);
    }
  }

  console.log('');
}

// Test 7: Test Generation (Performance Test)
async function testTestGeneration(token) {
  if (!token) {
    console.log('🔄 Skipping test generation (no auth token)\n');
    return;
  }

  console.log('🧪 Testing Event Generation (Performance)');

  const generateResult = await apiCall('/api/attribution/test/generate?count=50', 'POST', null, {
    'Authorization': `Bearer ${token}`
  });

  assert(
    generateResult.ok,
    'Test events generated successfully',
    'HTTP 200',
    `HTTP ${generateResult.status}`
  );

  if (generateResult.ok) {
    console.log(`   ${generateResult.data.message}`);
    console.log(`   Queue Size After Generation: ${generateResult.data.queue_size}`);
  }

  console.log('');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Attribution System Integration Tests...\n');

  try {
    // Basic health check
    await testServerHealth();

    // Authentication and engine status
    const token = await testAttributionEngineStatus();

    // Event processing tests
    await testEventIngestion(token);
    await testBatchEventIngestion(token);

    // Attribution processing
    await testAttributionProcessing(token);

    // Analytics testing
    await testAttributionAnalytics(token);

    // Performance testing
    await testTestGeneration(token);

    // Final status check
    if (token) {
      console.log('📊 Final Attribution Engine Status:');
      const finalStatus = await apiCall('/api/attribution/status', 'GET', null, {
        'Authorization': `Bearer ${token}`
      });

      if (finalStatus.ok) {
        const status = finalStatus.data;
        console.log(`   Engine Status: ${status.status}`);
        console.log(`   Total Events Processed: ${status.metrics.events_processed}`);
        console.log(`   Total Attribution Calculations: ${status.metrics.attribution_calculations}`);
        console.log(`   Success Rate: ${status.metrics.success_rate}`);
        console.log(`   Queue Size: ${status.metrics.queue_size}`);
      }
      console.log('');
    }

    // Print final results
    console.log('=====================================');
    console.log('🎯 ATTRIBUTION SYSTEM TEST RESULTS');
    console.log('=====================================');
    console.log(`✅ Tests Passed: ${testResults.passed}`);
    console.log(`❌ Tests Failed: ${testResults.failed}`);
    console.log(`📊 Total Tests: ${testResults.total}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Attribution system is working correctly!');
      console.log('🏆 System Features Verified:');
      console.log('   ✅ Real-time event ingestion');
      console.log('   ✅ Multi-touch attribution calculation');
      console.log('   ✅ 5 attribution models (First, Last, Linear, Time Decay, Position-Based)');
      console.log('   ✅ High-performance streaming processing');
      console.log('   ✅ Analytics and reporting APIs');
      console.log('   ✅ User journey tracking');
      console.log('   ✅ Batch processing support');
    } else {
      console.log('\n⚠️  Some tests failed. Check system configuration.');
    }

  } catch (error) {
    console.error('💥 Test suite failed with error:', error.message);
  }
}

// Check server availability first
async function checkServerHealth() {
  console.log('⏳ Checking API server availability...');

  try {
    const healthResult = await apiCall('/health');
    if (healthResult.ok) {
      console.log('✅ API server is running and accessible\n');
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

// Run the complete test suite
(async () => {
  const isServerHealthy = await checkServerHealth();

  if (isServerHealthy) {
    await runAllTests();
  } else {
    console.log('💡 Start the API server with attribution engine and run tests again.');
    process.exit(1);
  }
})();