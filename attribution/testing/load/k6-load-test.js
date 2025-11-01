// ============================================================================
// UnMoGrowP Attribution Platform - K6 Load Testing Suite
// Tests high-performance event ingestion (target: 10M+ events/sec)
// ============================================================================

import http from 'k6/http';
import { check, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom Metrics
const errorRate = new Rate('errors');
const eventsSent = new Counter('events_sent');
const attributionLatency = new Trend('attribution_latency');
const ingestionLatency = new Trend('ingestion_latency');

// Test Configuration
export const options = {
  scenarios: {
    // Scenario 1: Gradual Ramp-up (1M events/sec target)
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '2m', target: 100 },   // Ramp up to 100 VUs
        { duration: '5m', target: 500 },   // Stay at 500 VUs
        { duration: '10m', target: 1000 }, // Peak at 1000 VUs (1M events/sec)
        { duration: '5m', target: 500 },   // Ramp down
        { duration: '2m', target: 0 },     // Cool down
      ],
    },

    // Scenario 2: Spike Testing (burst traffic simulation)
    spike_test: {
      executor: 'ramping-vus',
      startTime: '25m',
      startVUs: 100,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 2000 },  // Sudden spike
        { duration: '30s', target: 100 },
        { duration: '1m', target: 3000 },  // Higher spike
        { duration: '30s', target: 100 },
      ],
    },

    // Scenario 3: Constant Load (endurance testing)
    constant_load: {
      executor: 'constant-vus',
      startTime: '30m',
      vus: 500,
      duration: '15m',
    }
  },

  thresholds: {
    // Performance Requirements
    'http_req_duration': ['p(95)<100'], // 95% of requests < 100ms
    'http_req_failed': ['rate<0.1%'],   // Error rate < 0.1%
    'errors': ['rate<0.1%'],
    'events_sent': ['count>100000'],    // Minimum 100K events
    'ingestion_latency': ['p(95)<50'],  // Ingestion latency < 50ms
    'attribution_latency': ['p(95)<1000'], // Attribution < 1s
  }
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const API_KEY = __ENV.API_KEY || 'test-api-key-12345';

// Test Data Generators
const USER_ACTIONS = ['app_open', 'screen_view', 'button_click', 'purchase', 'registration', 'level_complete'];
const PLATFORMS = ['iOS', 'Android', 'Web'];
const COUNTRIES = ['US', 'GB', 'DE', 'FR', 'JP', 'AU', 'CA', 'BR'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'BRL'];

function generateUserId() {
  return `user_${Math.random().toString(36).substr(2, 9)}`;
}

function generateDeviceId() {
  return `device_${Math.random().toString(36).substr(2, 12)}`;
}

function generateEvent() {
  const eventType = USER_ACTIONS[Math.floor(Math.random() * USER_ACTIONS.length)];
  const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
  const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];

  const baseEvent = {
    user_id: generateUserId(),
    device_id: generateDeviceId(),
    event_name: eventType,
    timestamp: new Date().toISOString(),
    platform: platform,
    country: country,
    session_id: `session_${Math.random().toString(36).substr(2, 8)}`,
    app_version: '1.2.3',
    sdk_version: '2.1.0',
  };

  // Add event-specific parameters
  if (eventType === 'purchase') {
    baseEvent.parameters = {
      revenue: Math.round(Math.random() * 100 * 100) / 100, // $0.01 - $100.00
      currency: CURRENCIES[Math.floor(Math.random() * CURRENCIES.length)],
      item_id: `item_${Math.floor(Math.random() * 1000)}`,
      quantity: Math.floor(Math.random() * 5) + 1,
    };
  } else if (eventType === 'registration') {
    baseEvent.parameters = {
      method: ['email', 'social', 'phone'][Math.floor(Math.random() * 3)],
      user_type: ['free', 'premium'][Math.floor(Math.random() * 2)],
    };
  } else if (eventType === 'level_complete') {
    baseEvent.parameters = {
      level: Math.floor(Math.random() * 100) + 1,
      score: Math.floor(Math.random() * 10000),
      duration: Math.floor(Math.random() * 300) + 10, // 10-310 seconds
    };
  }

  return baseEvent;
}

function generateBatchEvents(count = 10) {
  const events = [];
  for (let i = 0; i < count; i++) {
    events.push(generateEvent());
  }
  return events;
}

// Main Test Function
export default function() {
  group('Event Ingestion Load Test', () => {

    // Test 1: Single Event Ingestion
    group('Single Event Ingestion', () => {
      const event = generateEvent();
      const startTime = Date.now();

      const response = http.post(`${BASE_URL}/v1/events`, JSON.stringify(event), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
      });

      const latency = Date.now() - startTime;
      ingestionLatency.add(latency);

      const success = check(response, {
        'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'response time < 100ms': (r) => r.timings.duration < 100,
        'has event_id in response': (r) => JSON.parse(r.body || '{}').event_id !== undefined,
      });

      if (success) {
        eventsSent.add(1);
      } else {
        errorRate.add(1);
      }
    });

    // Test 2: Batch Event Ingestion (10 events per batch)
    group('Batch Event Ingestion', () => {
      const events = generateBatchEvents(10);
      const startTime = Date.now();

      const response = http.post(`${BASE_URL}/v1/events/batch`, JSON.stringify({ events }), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
      });

      const latency = Date.now() - startTime;
      ingestionLatency.add(latency);

      const success = check(response, {
        'status is 200': (r) => r.status === 200,
        'batch response time < 200ms': (r) => r.timings.duration < 200,
        'processed all events': (r) => {
          const body = JSON.parse(r.body || '{}');
          return body.processed_count === 10;
        },
      });

      if (success) {
        eventsSent.add(10);
      } else {
        errorRate.add(1);
      }
    });

    // Test 3: Attribution Query Performance
    if (Math.random() < 0.1) { // 10% of requests test attribution
      group('Attribution Query Performance', () => {
        const userId = generateUserId();
        const startTime = Date.now();

        const response = http.get(`${BASE_URL}/v1/attribution/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        });

        const latency = Date.now() - startTime;
        attributionLatency.add(latency);

        check(response, {
          'attribution status is 200': (r) => r.status === 200,
          'attribution response time < 1s': (r) => r.timings.duration < 1000,
          'has attribution data': (r) => {
            const body = JSON.parse(r.body || '{}');
            return body.attributions !== undefined;
          },
        });
      });
    }
  });
}

// Setup function - runs once before all VUs
export function setup() {
  console.log('🚀 Starting UnMoGrowP Attribution Platform Load Test');
  console.log(`📊 Target URL: ${BASE_URL}`);
  console.log(`🎯 Goal: Validate 1M+ events/sec processing capability`);

  // Health check before starting
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    throw new Error(`Platform health check failed: ${healthResponse.status}`);
  }

  console.log('✅ Platform health check passed - starting load test');
  return { startTime: Date.now() };
}

// Teardown function - runs once after all VUs complete
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`🏁 Load test completed in ${duration}s`);
  console.log('📊 Check metrics for performance validation');
}

// Custom error handling
export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    'load-test-summary.html': `
      <html>
        <head><title>UnMoGrowP Load Test Results</title></head>
        <body>
          <h1>Load Test Summary</h1>
          <h2>Key Metrics</h2>
          <ul>
            <li>Total Events Sent: ${data.metrics.events_sent?.values.count || 0}</li>
            <li>Error Rate: ${(data.metrics.errors?.values.rate || 0) * 100}%</li>
            <li>Avg Ingestion Latency: ${data.metrics.ingestion_latency?.values.avg || 0}ms</li>
            <li>P95 Response Time: ${data.metrics.http_req_duration?.values['p(95)'] || 0}ms</li>
          </ul>
        </body>
      </html>
    `
  };
}