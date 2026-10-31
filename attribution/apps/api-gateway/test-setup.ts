/**
 * Test Setup for API Gateway
 * UnMoGrowP Attribution Platform - Bun Test Runner
 */

import { beforeAll, afterAll } from 'bun:test';

// Global test configuration
export const TEST_CONFIG = {
  TEST_DB_URL: 'postgres://test:test@localhost:5432/test_attribution',
  TEST_CLICKHOUSE_URL: 'http://localhost:8123',
  TEST_JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
  TEST_RESEND_API_KEY: 'test-resend-key',
  API_BASE_URL: 'http://localhost:3000',
  TIMEOUT: 5000
};

// Set test environment variables
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = TEST_CONFIG.TEST_DB_URL;
  process.env.CLICKHOUSE_URL = TEST_CONFIG.TEST_CLICKHOUSE_URL;
  process.env.JWT_SECRET = TEST_CONFIG.TEST_JWT_SECRET;
  process.env.RESEND_API_KEY = TEST_CONFIG.TEST_RESEND_API_KEY;
  process.env.LOG_LEVEL = 'silent';
});

// Cleanup after tests
afterAll(() => {
  // Reset environment
  delete process.env.NODE_ENV;
  delete process.env.DATABASE_URL;
  delete process.env.CLICKHOUSE_URL;
  delete process.env.JWT_SECRET;
  delete process.env.RESEND_API_KEY;
  delete process.env.LOG_LEVEL;
});

// Mock external services for testing
export const mockServices = {
  // Mock ClickHouse responses
  mockClickHouse: {
    query: jest.fn().mockResolvedValue({
      data: [],
      meta: { source: 'test' }
    }),
    ping: jest.fn().mockResolvedValue(true)
  },

  // Mock email service
  mockEmail: {
    send: jest.fn().mockResolvedValue({
      id: 'test-email-id',
      from: 'test@example.com',
      to: 'user@example.com'
    })
  },

  // Mock database
  mockDatabase: {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true)
  }
};

// Test utilities
export const testUtils = {
  // Create test JWT token
  createTestToken: (payload: any = {}) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
        appId: 'test-app',
        ...payload
      },
      TEST_CONFIG.TEST_JWT_SECRET,
      { expiresIn: '1h' }
    );
  },

  // Create test user
  createTestUser: (overrides: any = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    appId: 'test-app',
    createdAt: new Date().toISOString(),
    ...overrides
  }),

  // Create test API request
  createTestRequest: (overrides: any = {}) => ({
    method: 'GET',
    url: '/',
    headers: {
      'Content-Type': 'application/json',
      ...overrides.headers
    },
    body: overrides.body,
    ...overrides
  }),

  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random test data
  randomString: (length: number = 10) =>
    Math.random().toString(36).substring(2, 2 + length),

  randomEmail: () =>
    `test-${Math.random().toString(36).substring(7)}@example.com`,

  randomId: () =>
    `test-${Math.random().toString(36).substring(2, 15)}`
};

// Mock external dependencies
export const setupMocks = () => {
  // Mock pg (PostgreSQL)
  jest.mock('pg', () => ({
    Pool: jest.fn().mockImplementation(() => mockServices.mockDatabase),
    Client: jest.fn().mockImplementation(() => mockServices.mockDatabase)
  }));

  // Mock bcryptjs
  jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true),
    genSalt: jest.fn().mockResolvedValue('salt')
  }));

  // Mock jsonwebtoken
  jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'user'
    }),
    decode: jest.fn().mockReturnValue({
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'user'
    })
  }));

  // Mock resend
  jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockServices.mockEmail.send
      }
    }))
  }));
};

// Database helpers for integration tests
export const dbHelpers = {
  // Setup test database
  setupTestDb: async () => {
    // Implementation would depend on your database setup
    console.log('Setting up test database...');
  },

  // Cleanup test database
  cleanupTestDb: async () => {
    console.log('Cleaning up test database...');
  },

  // Insert test data
  insertTestData: async (table: string, data: any) => {
    console.log(`Inserting test data into ${table}:`, data);
    return { id: testUtils.randomId(), ...data };
  }
};

// HTTP test helpers
export const httpHelpers = {
  // Make authenticated request
  makeAuthenticatedRequest: async (app: any, options: any) => {
    const token = testUtils.createTestToken();
    return app.request(options.url, {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  },

  // Make unauthenticated request
  makeRequest: async (app: any, options: any) => {
    return app.request(options.url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  }
};

// Performance testing utilities
export const performanceHelpers = {
  // Measure execution time
  measureTime: async (fn: Function) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return {
      result,
      duration: end - start
    };
  },

  // Test concurrent requests
  testConcurrency: async (requests: Function[], concurrency: number = 10) => {
    const results = [];
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(req => req()));
      results.push(...batchResults);
    }
    return results;
  }
};

// Export everything for easy importing
export default {
  TEST_CONFIG,
  mockServices,
  testUtils,
  setupMocks,
  dbHelpers,
  httpHelpers,
  performanceHelpers
};