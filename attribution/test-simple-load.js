// ============================================================================
// Simple Load Test for UnMoGrowP Attribution Platform
// Basic performance testing without external dependencies
// ============================================================================

const http = require('http');

const API_BASE = 'http://localhost:8080';
const TOTAL_REQUESTS = 100;
const CONCURRENT_REQUESTS = 10;

// Performance tracking
let completedRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let totalResponseTime = 0;
const responseTimes = [];

function generateTestEvent() {
  return {
    event_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    customer_id: 'load_test_customer',
    app_id: 'load_test_app',
    event_type: ['install', 'session', 'purchase', 'custom'][Math.floor(Math.random() * 4)],
    user_id: `user_${Math.floor(Math.random() * 1000)}`,
    device_id: `device_${Math.floor(Math.random() * 5000)}`,
    platform: ['ios', 'android', 'web'][Math.floor(Math.random() * 3)],
    country: 'US',
    campaign: `campaign_${Math.floor(Math.random() * 10)}`
  };
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        resolve({
          statusCode: res.statusCode,
          responseTime: responseTime,
          success: res.statusCode >= 200 && res.statusCode < 300,
          body: responseBody
        });
      });
    });

    req.on('error', (error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      resolve({
        statusCode: 0,
        responseTime: responseTime,
        success: false,
        error: error.message
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runLoadTest() {
  console.log('🚀 Starting UnMoGrowP Attribution Platform Load Test');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📊 Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`⚡ Concurrent: ${CONCURRENT_REQUESTS}`);
  console.log(`🎯 Target API: ${API_BASE}`);
  console.log('');

  const startTime = Date.now();

  // Test scenarios
  const scenarios = [
    { name: 'Health Check', path: '/health', weight: 10 },
    { name: 'Event Ingestion', path: '/api/v1/events', method: 'POST', weight: 50, data: () => generateTestEvent() },
    { name: 'Get Customers', path: '/api/v1/customers', weight: 20 },
    { name: 'Get Analytics', path: '/api/v1/analytics/load_test_customer', weight: 10 },
    { name: 'Get Attribution', path: '/api/v1/attribution/load_test_customer', weight: 10 },
  ];

  const requests = [];

  // Generate request mix based on weights
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const random = Math.random() * 100;
    let cumulativeWeight = 0;

    for (const scenario of scenarios) {
      cumulativeWeight += scenario.weight;
      if (random <= cumulativeWeight) {
        const requestData = scenario.data ? scenario.data() : null;
        requests.push({
          name: scenario.name,
          path: scenario.path,
          method: scenario.method || 'GET',
          data: requestData
        });
        break;
      }
    }
  }

  // Execute requests in batches
  const batches = [];
  for (let i = 0; i < requests.length; i += CONCURRENT_REQUESTS) {
    batches.push(requests.slice(i, i + CONCURRENT_REQUESTS));
  }

  console.log('⚡ Executing load test...\n');

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchPromises = batch.map(async (request) => {
      const result = await makeRequest(request.path, request.method, request.data);

      completedRequests++;
      responseTimes.push(result.responseTime);
      totalResponseTime += result.responseTime;

      if (result.success) {
        successfulRequests++;
      } else {
        failedRequests++;
        console.log(`❌ ${request.name} failed: ${result.statusCode} ${result.error || ''}`);
      }

      // Progress indicator
      if (completedRequests % 20 === 0 || completedRequests === TOTAL_REQUESTS) {
        const progress = Math.round((completedRequests / TOTAL_REQUESTS) * 100);
        console.log(`📊 Progress: ${completedRequests}/${TOTAL_REQUESTS} (${progress}%)`);
      }

      return result;
    });

    await Promise.all(batchPromises);

    // Small delay between batches to avoid overwhelming
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // Calculate statistics
  responseTimes.sort((a, b) => a - b);
  const avgResponseTime = totalResponseTime / completedRequests;
  const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
  const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
  const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🏁 LOAD TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  console.log('📊 Request Statistics:');
  console.log(`   Total Requests:     ${completedRequests}`);
  console.log(`   Successful:         ${successfulRequests} (${Math.round((successfulRequests/completedRequests)*100)}%)`);
  console.log(`   Failed:             ${failedRequests} (${Math.round((failedRequests/completedRequests)*100)}%)`);
  console.log('');

  console.log('⏱️  Performance Metrics:');
  console.log(`   Total Time:         ${(totalTime/1000).toFixed(2)}s`);
  console.log(`   Requests/sec:       ${(completedRequests/(totalTime/1000)).toFixed(2)}`);
  console.log(`   Avg Response Time:  ${avgResponseTime.toFixed(2)}ms`);
  console.log(`   Min Response Time:  ${minResponseTime}ms`);
  console.log(`   Max Response Time:  ${maxResponseTime}ms`);
  console.log('');

  console.log('📈 Response Time Percentiles:');
  console.log(`   50th percentile:    ${p50}ms`);
  console.log(`   95th percentile:    ${p95}ms`);
  console.log(`   99th percentile:    ${p99}ms`);
  console.log('');

  // Performance assessment
  const rps = completedRequests/(totalTime/1000);
  const errorRate = (failedRequests/completedRequests)*100;

  console.log('🎯 Performance Assessment:');
  if (rps > 100) {
    console.log(`   🚀 Excellent throughput: ${rps.toFixed(1)} RPS`);
  } else if (rps > 50) {
    console.log(`   ✅ Good throughput: ${rps.toFixed(1)} RPS`);
  } else {
    console.log(`   ⚠️  Low throughput: ${rps.toFixed(1)} RPS`);
  }

  if (p95 < 100) {
    console.log(`   🚀 Excellent response time: P95 = ${p95}ms`);
  } else if (p95 < 500) {
    console.log(`   ✅ Good response time: P95 = ${p95}ms`);
  } else {
    console.log(`   ⚠️  High response time: P95 = ${p95}ms`);
  }

  if (errorRate < 1) {
    console.log(`   ✅ Excellent reliability: ${errorRate.toFixed(1)}% errors`);
  } else if (errorRate < 5) {
    console.log(`   ⚠️  Some errors: ${errorRate.toFixed(1)}% error rate`);
  } else {
    console.log(`   ❌ High error rate: ${errorRate.toFixed(1)}%`);
  }

  console.log('');
  console.log('🏆 UnMoGrowP Attribution Platform Load Test Complete!');

  return {
    totalRequests: completedRequests,
    successfulRequests,
    failedRequests,
    avgResponseTime,
    p95ResponseTime: p95,
    requestsPerSecond: rps,
    errorRate
  };
}

// Run the load test
runLoadTest().catch(console.error);