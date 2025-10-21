import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Create Hono app (3x faster than Node.js Express)
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'api-layer',
    runtime: 'bun',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes

// Authentication routes
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json();

  // TODO: Implement actual authentication logic with PostgreSQL
  // For now, return mock data with token
  return c.json({
    success: true,
    message: 'Login successful',
    data: {
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: 'user-123',
        email: body.email,
        name: 'Test User',
      },
    },
  });
});

app.post('/api/auth/register', async (c) => {
  const body = await c.req.json();

  // TODO: Implement registration logic
  return c.json({
    success: true,
    message: 'Register endpoint',
  });
});

app.post('/api/auth/google', async (c) => {
  const body = await c.req.json();

  // TODO: Implement actual Google OAuth with Auth.js
  // For now, return mock data with token
  return c.json({
    success: true,
    message: 'Google login successful',
    data: {
      token: 'mock-google-jwt-token-' + Date.now(),
      user: {
        id: 'user-google-123',
        email: 'user@gmail.com',
        name: 'Google User',
      },
    },
  });
});

// Dashboard routes
app.get('/api/dashboard/stats', async (c) => {
  // TODO: Fetch stats from ClickHouse via Go backend
  return c.json({
    success: true,
    data: {
      totalEvents: 0,
      activeUsers: 0,
      revenue: 0,
    },
  });
});

app.get('/api/dashboard/charts/:chartType', async (c) => {
  const chartType = c.req.param('chartType');

  // TODO: Fetch chart data from ClickHouse
  return c.json({
    success: true,
    chartType,
    data: [],
  });
});

// Attribution routes
app.post('/api/attribution/track', async (c) => {
  const event = await c.req.json();

  // Forward to Go backend event ingestion
  try {
    const response = await fetch('http://localhost:8080/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const data = await response.json();
    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to forward event to ingestion service',
    }, 500);
  }
});

app.post('/api/attribution/batch', async (c) => {
  const events = await c.req.json();

  // Forward batch to Go backend
  try {
    const response = await fetch('http://localhost:8080/v1/events/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(events),
    });

    const data = await response.json();
    return c.json({
      success: true,
      data,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to forward batch to ingestion service',
    }, 500);
  }
});

// Analytics routes
app.get('/api/analytics/reports/:reportId', async (c) => {
  const reportId = c.req.param('reportId');

  // TODO: Fetch report from ClickHouse
  return c.json({
    success: true,
    reportId,
    data: {},
  });
});

// App management routes
app.get('/api/apps', async (c) => {
  // TODO: Fetch apps list from PostgreSQL
  return c.json({
    success: true,
    data: [],
  });
});

app.post('/api/apps', async (c) => {
  const appData = await c.req.json();

  // TODO: Create app in PostgreSQL
  return c.json({
    success: true,
    message: 'App created',
  });
});

// Error handling
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    success: false,
    error: err.message,
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
  }, 404);
});

// Start server
const port = process.env.PORT || 3000;

console.log(`🚀 Bun + Hono API server starting on port ${port}`);
console.log(`⚡ Bun runtime: 3x faster than Node.js`);
console.log(`🔥 Hono framework: Ultra-fast edge-ready`);
console.log(`📊 API Layer for UnMoGrowP Attribution Platform`);

export default {
  port,
  fetch: app.fetch,
};
