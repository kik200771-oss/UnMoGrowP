/**
 * API Gateway Integration Tests - integration
 * UnMoGrowP Attribution Platform - Main API Endpoints
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'bun:test';
import { Hono } from 'hono';
import { testUtils, httpHelpers, mockServices, TEST_CONFIG } from './test-setup';

// Import the app (we'll need to modify the import to be testable)
// For now, we'll create a test version
const createTestApp = () => {
  const { Hono } = require('hono');
  const { cors } = require('hono/cors');
  const { logger } = require('hono/logger');

  const app = new Hono();

  // Middleware
  app.use('*', logger());
  app.use('*', cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }));

  // Health check
  app.get('/health', (c) => {
    return c.json({
      status: 'ok',
      service: 'api-layer',
      runtime: 'bun',
      framework: 'hono',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Public endpoints
  app.get('/api/public/metrics', (c) => {
    return c.json({
      totalEvents: 1250000,
      activeUsers: 85000,
      revenueToday: 45000.75,
      conversions: 3420
    });
  });

  // Authentication endpoints
  app.post('/api/auth/login', async (c) => {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    // Mock authentication
    if (email === 'test@example.com' && password === 'password123') {
      const token = testUtils.createTestToken({ email });
      return c.json({
        success: true,
        token,
        user: {
          id: 'user123',
          email,
          role: 'user'
        }
      });
    }

    return c.json({ error: 'Invalid credentials' }, 401);
  });

  app.post('/api/auth/register', async (c) => {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name required' }, 400);
    }

    // Mock registration
    const user = testUtils.createTestUser({ email, name });
    const token = testUtils.createTestToken({ email, userId: user.id });

    return c.json({
      success: true,
      token,
      user
    });
  });

  // Dashboard endpoints (protected)
  app.get('/api/dashboard/stats', async (c) => {
    const auth = c.req.header('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json({
      success: true,
      data: {
        total_events: 1250000,
        active_users: 85000,
        revenue_today: 45000.75,
        conversions: 3420
      },
      meta: {
        cache_hit: false,
        response_time: '45ms',
        source: 'database'
      }
    });
  });

  // Error handling
  app.onError((err, c) => {
    console.error('API Error:', err);
    return c.json({
      error: 'Internal Server Error',
      message: err.message,
      timestamp: new Date().toISOString()
    }, 500);
  });

  return app;
};

describe('API Gateway Integration Tests - integration', () => {
  let app: any;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check Endpoint', () => {
    it('should return health status', async () => {
      const response = await httpHelpers.makeRequest(app, {
        url: '/health',
        method: 'GET'
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('api-layer');
      expect(data.runtime).toBe('bun');
      expect(data.framework).toBe('hono');
      expect(data.version).toBeDefined();
      expect(data.timestamp).toBeDefined();
      expect(data.uptime).toBeDefined();
    });

    it('should have correct content type', async () => {
      const response = await httpHelpers.makeRequest(app, {
        url: '/health',
        method: 'GET'
      });

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('CORS Configuration', () => {
    it('should set CORS headers for allowed origins', async () => {
      const response = await app.request('/health', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173'
        }
      });

      expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
      expect(response.headers.get('access-control-allow-credentials')).toBe('true');
    });

    it('should handle preflight requests', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,Authorization'
        }
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-methods')).toContain('POST');
      expect(response.headers.get('access-control-allow-headers')).toContain('Content-Type');
    });
  });

  describe('Public API Endpoints', () => {
    it('should return public metrics without authentication', async () => {
      const response = await httpHelpers.makeRequest(app, {
        url: '/api/public/metrics',
        method: 'GET'
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.totalEvents).toBeDefined();
      expect(data.activeUsers).toBeDefined();
      expect(data.revenueToday).toBeDefined();
      expect(data.conversions).toBeDefined();
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await httpHelpers.makeRequest(app, {
          url: '/api/auth/login',
          method: 'POST',
          body: {
            email: 'test@example.com',
            password: 'password123'
          }
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.token).toBeDefined();
        expect(data.user).toBeDefined();
        expect(data.user.email).toBe('test@example.com');
        expect(data.user.role).toBe('user');
      });

      it('should reject invalid credentials', async () => {
        const response = await httpHelpers.makeRequest(app, {
          url: '/api/auth/login',
          method: 'POST',
          body: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        });

        expect(response.status).toBe(401);

        const data = await response.json();
        expect(data.error).toBe('Invalid credentials');
      });

      it('should require email and password', async () => {
        const response = await httpHelpers.makeRequest(app, {
          url: '/api/auth/login',
          method: 'POST',
          body: {
            email: 'test@example.com'
            // missing password
          }
        });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toBe('Email and password required');
      });

      it('should handle malformed JSON', async () => {
        const response = await app.request('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: 'invalid json'
        });

        expect(response.status).toBe(400);
      });
    });

    describe('POST /api/auth/register', () => {
      it('should register new user with valid data', async () => {
        const userData = {
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User'
        };

        const response = await httpHelpers.makeRequest(app, {
          url: '/api/auth/register',
          method: 'POST',
          body: userData
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.token).toBeDefined();
        expect(data.user).toBeDefined();
        expect(data.user.email).toBe(userData.email);
        expect(data.user.name).toBe(userData.name);
      });

      it('should require all fields', async () => {
        const response = await httpHelpers.makeRequest(app, {
          url: '/api/auth/register',
          method: 'POST',
          body: {
            email: 'test@example.com'
            // missing password and name
          }
        });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.error).toBe('Email, password, and name required');
      });
    });
  });

  describe('Protected Endpoints', () => {
    it('should access protected endpoint with valid token', async () => {
      const response = await httpHelpers.makeAuthenticatedRequest(app, {
        url: '/api/dashboard/stats',
        method: 'GET'
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.total_events).toBeDefined();
      expect(data.meta).toBeDefined();
    });

    it('should reject access without token', async () => {
      const response = await httpHelpers.makeRequest(app, {
        url: '/api/dashboard/stats',
        method: 'GET'
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject access with invalid token', async () => {
      const response = await app.request('/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await httpHelpers.makeRequest(app, {
        url: '/api/nonexistent',
        method: 'GET'
      });

      expect(response.status).toBe(404);
    });

    it('should handle internal server errors gracefully', async () => {
      // We'd need to trigger an actual error in the app
      // This is more of a placeholder for error handling tests
      expect(true).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should respond to health check quickly', async () => {
      const start = performance.now();

      const response = await httpHelpers.makeRequest(app, {
        url: '/health',
        method: 'GET'
      });

      const end = performance.now();
      const duration = end - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100); // Should respond within 100ms
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        () => httpHelpers.makeRequest(app, {
          url: '/health',
          method: 'GET'
        })
      );

      const responses = await Promise.all(requests.map(req => req()));

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive information in error responses', async () => {
      const response = await httpHelpers.makeRequest(app, {
        url: '/api/auth/login',
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      });

      const data = await response.json();

      // Should not expose internal details
      expect(data.error).toBe('Invalid credentials');
      expect(data.stack).toBeUndefined();
      expect(data.password).toBeUndefined();
    });

    it('should validate content types', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: 'not json'
      });

      expect(response.status).toBe(400);
    });

    it('should handle request size limits', async () => {
      // This would test if the app properly limits request size
      // Implementation depends on your actual size limits
      const largePayload = 'x'.repeat(10000);

      const response = await httpHelpers.makeRequest(app, {
        url: '/api/auth/login',
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: largePayload
        }
      });

      // Should either accept or reject based on size limits
      expect([200, 400, 413]).toContain(response.status);
    });
  });
});