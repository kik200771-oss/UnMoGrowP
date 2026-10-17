// ============================================================================
// UnMoGrowP Attribution Platform - K6 Load Testing Script
// Comprehensive load testing for attribution platform
// ============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');
export const apiResponseTime = new Trend('api_response_time');
export const eventsIngested = new Counter('events_ingested');
export const apiCallsTotal = new Counter('api_calls_total');

// Test configuration
export const options = {
  scenarios: {
    // Warm-up phase
    warmup: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 10 },
      ],
    },

    // Load testing phase
    load_test: {
      executor: 'ramping-vus',
      startTime: '30s',
      startVUs: 10,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 50 },   // Stay at 50 users
        { duration: '2m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 0 },    // Ramp down
      ],
    },

    // Spike testing
    spike_test: {
      executor: 'ramping-vus',
      startTime: '15m',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 200 }, // Spike to 200 users
        { duration: '1m', target: 200 },  // Stay at 200 users
        { duration: '10s', target: 0 },   // Drop to 0
      ],
    },
  },

  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
    http_req_failed: ['rate<0.05'], // Less than 5% errors
    errors: ['rate<0.05'],
    api_response_time: ['p(95)<300'],
    'http_req_duration{name:ingest_events}': ['p(95)<200'], // Events ingestion should be fast
  },
};

// Configuration
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/api/v1`;

// Test data generators
function generateEvent(customerId = 'load-test-customer') {
  const eventTypes = ['install', 'session', 'purchase', 'custom'];
  const platforms = ['ios', 'android', 'web'];
  const countries = ['US', 'UK', 'DE', 'FR', 'JP', 'CA', 'AU'];

  return {
    event_id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    customer_id: customerId,
    app_id: `app_${customerId}`,
    event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
    user_id: `user_${Math.floor(Math.random() * 10000)}`,
    device_id: `device_${Math.floor(Math.random() * 50000)}`,
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    country: countries[Math.floor(Math.random() * countries.length)],
    campaign: `campaign_${Math.floor(Math.random() * 10)}`,
    revenue: Math.random() > 0.9 ? Math.round(Math.random() * 100 * 100) / 100 : undefined,
    currency: 'USD',
    attribution_data: {
      channel: ['organic', 'paid_search', 'paid_social', 'email', 'direct'][Math.floor(Math.random() * 5)],
      source: ['google', 'facebook', 'twitter', 'email', 'direct'][Math.floor(Math.random() * 5)],
      attribution_score: Math.round(Math.random() * 100) / 100,
    }
  };
}

function generateBatchEvents(batchSize = 10, customerId = 'load-test-customer') {
  const events = [];
  for (let i = 0; i < batchSize; i++) {
    events.push(generateEvent(customerId));
  }
  return events;
}

// Main test function
export default function() {
  const customerId = `load-test-${__VU}-${Math.floor(__ITER / 10)}`;

  // Test health check
  testHealthCheck();

  // Test event ingestion (single event)
  testSingleEventIngestion(customerId);

  // Test batch event ingestion
  testBatchEventIngestion(customerId);

  // Test analytics endpoints
  testAnalyticsEndpoints(customerId);

  // Test customer management
  testCustomerEndpoints(customerId);

  // Test real-time data
  testRealtimeEndpoints(customerId);

  sleep(1);
}

function testHealthCheck() {
  const response = http.get(`${API_BASE_URL}/health`);

  apiCallsTotal.add(1);
  apiResponseTime.add(response.timings.duration);

  const success = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check has success=true': (r) => {
      try {
        return JSON.parse(r.body).success === true;
      } catch (e) {
        return false;
      }
    },
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });

  if (!success) errorRate.add(1);
}

function testSingleEventIngestion(customerId) {
  const event = generateEvent(customerId);

  const response = http.post(
    `${API_URL}/events`,
    JSON.stringify(event),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'load-test-key',
      },
      tags: { name: 'ingest_events' },
    }
  );

  apiCallsTotal.add(1);
  apiResponseTime.add(response.timings.duration);

  const success = check(response, {
    'event ingestion status is 200': (r) => r.status === 200,
    'event ingestion has success=true': (r) => {
      try {
        return JSON.parse(r.body).success === true;
      } catch (e) {
        return false;
      }
    },
    'event ingestion response time < 200ms': (r) => r.timings.duration < 200,
  });

  if (success) {
    eventsIngested.add(1);
  } else {
    errorRate.add(1);
  }
}

function testBatchEventIngestion(customerId) {
  const events = generateBatchEvents(5, customerId);

  const response = http.post(
    `${API_URL}/events`,
    JSON.stringify(events),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'load-test-key',
      },
      tags: { name: 'batch_ingest_events' },
    }
  );

  apiCallsTotal.add(1);
  apiResponseTime.add(response.timings.duration);

  const success = check(response, {
    'batch ingestion status is 200': (r) => r.status === 200,
    'batch ingestion has success=true': (r) => {
      try {
        return JSON.parse(r.body).success === true;
      } catch (e) {
        return false;
      }
    },
    'batch ingestion response time < 500ms': (r) => r.timings.duration < 500,
  });

  if (success) {
    eventsIngested.add(events.length);
  } else {
    errorRate.add(1);
  }
}

function testAnalyticsEndpoints(customerId) {
  // Test customer analytics
  const analyticsResponse = http.get(`${API_URL}/analytics/${customerId}`);

  apiCallsTotal.add(1);
  apiResponseTime.add(analyticsResponse.timings.duration);

  const analyticsSuccess = check(analyticsResponse, {
    'analytics status is 200': (r) => r.status === 200,
    'analytics response time < 300ms': (r) => r.timings.duration < 300,
  });

  if (!analyticsSuccess) errorRate.add(1);

  // Test attribution data
  const attributionResponse = http.get(`${API_URL}/attribution/${customerId}`);

  apiCallsTotal.add(1);
  apiResponseTime.add(attributionResponse.timings.duration);

  const attributionSuccess = check(attributionResponse, {
    'attribution status is 200': (r) => r.status === 200,
    'attribution response time < 400ms': (r) => r.timings.duration < 400,
  });

  if (!attributionSuccess) errorRate.add(1);
}

function testCustomerEndpoints(customerId) {
  // Test get customer
  const response = http.get(`${API_URL}/customers/${customerId}`);

  apiCallsTotal.add(1);
  apiResponseTime.add(response.timings.duration);

  const success = check(response, {
    'customer get status is 200': (r) => r.status === 200,
    'customer get response time < 200ms': (r) => r.timings.duration < 200,
  });

  if (!success) errorRate.add(1);
}

function testRealtimeEndpoints(customerId) {
  const response = http.get(`${API_URL}/realtime/${customerId}`);

  apiCallsTotal.add(1);
  apiResponseTime.add(response.timings.duration);

  const success = check(response, {
    'realtime status is 200': (r) => r.status === 200,
    'realtime response time < 150ms': (r) => r.timings.duration < 150,
  });

  if (!success) errorRate.add(1);
}

// Setup function - runs once before the test
export function setup() {
  console.log('🚀 Starting UnMoGrowP Attribution Platform Load Test');
  console.log(`📊 API Base URL: ${API_BASE_URL}`);

  // Test API availability
  const response = http.get(`${API_BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error(`API not available. Health check returned ${response.status}`);
  }

  console.log('✅ API is available, starting load test...');
  return { apiUrl: API_BASE_URL };
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log('🏁 Load test completed');
  console.log(`📊 Total API calls: ${apiCallsTotal.count}`);
  console.log(`📈 Events ingested: ${eventsIngested.count}`);
  console.log(`🎯 Error rate: ${(errorRate.rate * 100).toFixed(2)}%`);
}