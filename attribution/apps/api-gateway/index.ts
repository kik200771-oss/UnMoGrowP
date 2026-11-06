// UnMoGrowP Attribution Platform - API Server with RBAC Security
// Stack: Bun + Hono + tRPC (type-safe API) + JWT RBAC Authorization
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { trpcServer } from '@hono/trpc-server';
import { appRouter, type AppRouter } from './trpc';
import { AuthService, testConnection, type LoginRequest, type RegisterRequest } from './database';
import { clickhouse } from './clickhouse';
import { EmailService } from './email';

// RBAC Security System
import {
  authenticate,
  requireRole,
  requirePermission,
  requireAppAccess,
  getCurrentUser,
  UserRole,
  Permission,
  AuthorizationService
} from './auth';

// Create Hono app (3x faster than Node.js Express)
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3000').split(','),
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// tRPC endpoint (type-safe API)
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
  })
);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'api-layer',
    runtime: 'bun',
    framework: 'hono',
    rpc: 'tRPC',
    version: '0.3.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes

// Authentication routes
app.post('/api/auth/login', async (c) => {
  try {
    const body: LoginRequest = await c.req.json();

    // Validate required fields
    if (!body.email || !body.password) {
      return c.json({
        success: false,
        message: 'Email and password are required',
      }, 400);
    }

    // Authenticate user
    const user = await AuthService.authenticateUser(body.email, body.password);
    if (!user) {
      return c.json({
        success: false,
        message: 'Invalid email or password',
      }, 401);
    }

    // Generate JWT token
    const token = AuthService.generateToken(user, body.rememberMe || false);

    // Store session (optional, for token management)
    const userAgent = c.req.header('User-Agent');
    const ipAddress = c.req.header('X-Forwarded-For') ||
                     c.req.header('X-Real-IP') ||
                     c.env?.ip || 'unknown';

    return c.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({
      success: false,
      message: 'Internal server error',
    }, 500);
  }
});

// Check email availability for registration
app.post('/api/auth/check-email', async (c) => {
  try {
    const body = await c.req.json();

    // Validate email field
    if (!body.email) {
      return c.json({
        success: false,
        message: 'Email is required',
      }, 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return c.json({
        success: false,
        message: 'Invalid email format',
      }, 400);
    }

    // Check if user exists
    const existingUser = await AuthService.findUserByEmail(body.email);

    if (existingUser) {
      return c.json({
        success: true,
        data: {
          available: false,
          message: 'User with this email already exists'
        }
      });
    }

    return c.json({
      success: true,
      data: {
        available: true,
        message: 'Email is available for registration'
      }
    });

  } catch (error) {
    console.error('Email check error:', error);
    return c.json({
      success: false,
      message: 'Internal server error',
    }, 500);
  }
});

app.post('/api/auth/register', async (c) => {
  try {
    const body: RegisterRequest = await c.req.json();

    // Validate required fields
    if (!body.email || !body.password || !body.name) {
      return c.json({
        success: false,
        message: 'Email, password, and name are required',
      }, 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return c.json({
        success: false,
        message: 'Invalid email format',
      }, 400);
    }

    // Password strength validation
    if (body.password.length < 8) {
      return c.json({
        success: false,
        message: 'Password must be at least 8 characters long',
      }, 400);
    }

    // Register user
    const user = await AuthService.registerUser(body);

    // Generate token for new user
    const token = AuthService.generateToken(user, false);

    return c.json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.message === 'User already exists') {
      return c.json({
        success: false,
        message: 'User with this email already exists',
      }, 409);
    }

    return c.json({
      success: false,
      message: 'Internal server error',
    }, 500);
  }
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

// Password reset endpoints
app.post('/api/auth/forgot-password', async (c) => {
  try {
    const body = await c.req.json();

    // Validate email field
    if (!body.email) {
      return c.json({
        success: false,
        message: 'Email is required',
      }, 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return c.json({
        success: false,
        message: 'Invalid email format',
      }, 400);
    }

    // Create password reset token
    const resetTokenInfo = await AuthService.createPasswordResetToken(body.email);

    if (!resetTokenInfo) {
      // Return success even if user doesn't exist (security best practice)
      return c.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      });
    }

    // Send email with reset link
    const emailResult = await EmailService.sendPasswordResetEmail(
      body.email,
      resetTokenInfo.token,
      'User' // TODO: Get actual user name from database
    );

    // Log for development (keep console logs for now)
    console.log(`Password reset token for ${body.email}: ${resetTokenInfo.token}`);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    console.log(`Reset link: ${frontendUrl}/reset-password?token=${resetTokenInfo.token}`);

    if (emailResult.success) {
      console.log(`✅ Password reset email sent successfully (${emailResult.messageId})`);
    } else {
      console.warn(`⚠️  Failed to send email: ${emailResult.error}`);
    }

    return c.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
      // Include email status for development
      emailSent: emailResult.success,
      // TODO: Remove in production - only for testing
      data: {
        resetToken: resetTokenInfo.token,
        expiresAt: resetTokenInfo.expiresAt,
        emailMessageId: emailResult.messageId
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({
      success: false,
      message: 'Internal server error',
    }, 500);
  }
});

app.post('/api/auth/reset-password', async (c) => {
  try {
    const body = await c.req.json();

    // Validate required fields
    if (!body.token || !body.newPassword) {
      return c.json({
        success: false,
        message: 'Reset token and new password are required',
      }, 400);
    }

    // Password strength validation
    if (body.newPassword.length < 8) {
      return c.json({
        success: false,
        message: 'Password must be at least 8 characters long',
      }, 400);
    }

    // Reset password using token
    const success = await AuthService.resetPassword(body.token, body.newPassword);

    if (!success) {
      return c.json({
        success: false,
        message: 'Invalid or expired reset token',
      }, 400);
    }

    return c.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({
      success: false,
      message: 'Internal server error',
    }, 500);
  }
});

// Verify reset token (optional endpoint for frontend validation)
app.post('/api/auth/verify-reset-token', async (c) => {
  try {
    const body = await c.req.json();

    if (!body.token) {
      return c.json({
        success: false,
        message: 'Reset token is required',
      }, 400);
    }

    // Verify token and get user info
    const tokenInfo = await AuthService.verifyPasswordResetToken(body.token);

    if (!tokenInfo) {
      return c.json({
        success: false,
        message: 'Invalid or expired reset token',
      }, 400);
    }

    return c.json({
      success: true,
      message: 'Reset token is valid',
      data: {
        email: tokenInfo.email,
      },
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return c.json({
      success: false,
      message: 'Internal server error',
    }, 500);
  }
});

// Dashboard routes (Protected - requires authentication + analytics:read permission)
app.get('/api/dashboard/stats',
  authenticate,
  requirePermission(Permission.ANALYTICS_READ),
  async (c) => {
    const user = getCurrentUser(c);

    // Log dashboard access
    await AuthorizationService.logSecurityEvent(
      user!.userId,
      'DASHBOARD_ACCESS',
      'STATS',
      true,
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent')
    );

    // Get real stats from ClickHouse
    try {
      const stats = await clickhouse.getDashboardStats();
      return c.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('ClickHouse query failed:', error);
      // Fallback to mock data if ClickHouse is unavailable
      return c.json({
        success: true,
        data: {
          totalEvents: 0,
          activeUsers: 0,
          revenue: 0,
        },
        warning: 'Real-time data unavailable, showing fallback data'
      });
    }
  }
);

app.get('/api/dashboard/charts/:chartType',
  authenticate,
  requirePermission(Permission.ANALYTICS_READ),
  async (c) => {
    const chartType = c.req.param('chartType');
    const user = getCurrentUser(c);

    // Log chart access
    await AuthorizationService.logSecurityEvent(
      user!.userId,
      'CHART_ACCESS',
      `CHART_TYPE: ${chartType}`,
      true,
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent')
    );

    // Get real chart data from ClickHouse
    try {
      const range = c.req.query('range') || '7d';
      const chartData = await clickhouse.getChartData(chartType, range);
      return c.json({
        success: true,
        chartType,
        data: {
          labels: chartData.labels,
          datasets: [{
            label: chartType,
            data: chartData.data,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.4,
          }],
        },
      });
    } catch (error) {
      console.error('ClickHouse chart query failed:', error);
      // Fallback to empty data
      return c.json({
        success: true,
        chartType,
        data: {
          labels: [],
          datasets: [{
            label: chartType,
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.4,
          }],
        },
        warning: 'Real-time data unavailable'
      });
    }
  }
);

// Attribution routes
app.post('/api/attribution/track', async (c) => {
  const event = await c.req.json();

  // Forward to Go backend event ingestion
  try {
    const goBackendUrl = process.env.GO_BACKEND_URL || 'http://localhost:8080';
    const response = await fetch(`${goBackendUrl}/v1/events`, {
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
    const goBackendUrl = process.env.GO_BACKEND_URL || 'http://localhost:8080';
    const response = await fetch(`${goBackendUrl}/v1/events/batch`, {
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

// Admin routes (Protected - requires admin role)
app.get('/api/admin/users',
  authenticate,
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  async (c) => {
    const user = getCurrentUser(c);

    // Log admin action
    await AuthorizationService.logSecurityEvent(
      user!.userId,
      'ADMIN_LIST_USERS',
      'ALL_USERS',
      true,
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent')
    );

    // TODO: Fetch users from database with pagination
    return c.json({
      success: true,
      data: {
        users: [],
        totalCount: 0,
        page: 1,
      },
    });
  }
);

// User management routes (Protected - requires specific permissions)
app.post('/api/users',
  authenticate,
  requirePermission(Permission.USERS_CREATE),
  async (c) => {
    const user = getCurrentUser(c);
    const userData = await c.req.json();

    // Log user creation attempt
    await AuthorizationService.logSecurityEvent(
      user!.userId,
      'CREATE_USER',
      `EMAIL: ${userData.email}`,
      true,
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent')
    );

    // TODO: Implement user creation logic
    return c.json({
      success: true,
      message: 'User created successfully',
      data: { userId: 'new-user-id' },
    });
  }
);

// App management routes (Protected - requires app access)
app.get('/api/apps/:appId',
  authenticate,
  requireAppAccess('appId'),
  async (c) => {
    const appId = c.req.param('appId');
    const user = getCurrentUser(c);

    // Log app access
    await AuthorizationService.logSecurityEvent(
      user!.userId,
      'APP_ACCESS',
      `APP_ID: ${appId}`,
      true,
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent')
    );

    // TODO: Fetch app data from database
    return c.json({
      success: true,
      data: {
        id: appId,
        name: 'Test App',
        platform: 'web',
        status: 'active',
      },
    });
  }
);

// Security audit log endpoint (Protected - requires security admin)
app.get('/api/admin/security/audit',
  authenticate,
  requirePermission(Permission.ADMIN_SECURITY),
  async (c) => {
    const user = getCurrentUser(c);
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');

    // Log audit log access
    await AuthorizationService.logSecurityEvent(
      user!.userId,
      'VIEW_AUDIT_LOG',
      `PAGE: ${page}, LIMIT: ${limit}`,
      true,
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent')
    );

    // TODO: Fetch audit logs with pagination
    return c.json({
      success: true,
      data: {
        logs: [],
        totalCount: 0,
        page,
        limit,
      },
    });
  }
);

// User profile endpoint (Protected - requires authentication)
app.get('/api/profile',
  authenticate,
  async (c) => {
    const user = getCurrentUser(c);

    // Return user profile (sanitized)
    return c.json({
      success: true,
      data: {
        id: user!.userId,
        email: user!.email,
        name: user!.name,
        role: user!.role,
        permissions: user!.permissions,
        appAccess: user!.appAccess,
      },
    });
  }
);

// Logout endpoint (Protected - requires authentication)
app.post('/api/auth/logout',
  authenticate,
  async (c) => {
    const user = getCurrentUser(c);

    // Log logout
    await AuthorizationService.logSecurityEvent(
      user!.userId,
      'LOGOUT',
      'USER_LOGOUT',
      true,
      c.req.header('CF-Connecting-IP') || 'unknown',
      c.req.header('User-Agent')
    );

    // TODO: Invalidate JWT token in database (blacklist)
    return c.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
  }, 404);
});

// Start server
const port = parseInt(process.env.PORT || '3001');

// Initialize database connection on startup
console.log('🔌 Testing database connection...');
testConnection().then((connected) => {
  if (connected) {
    console.log('✅ PostgreSQL database ready');
  } else {
    console.error('❌ PostgreSQL connection failed - authentication will not work');
  }
});

console.log(`🚀 API Server starting...`);
console.log(`   Runtime: Bun ${Bun.version}`);
console.log(`   Framework: Hono`);
console.log(`   RPC: tRPC (type-safe)`);
console.log(`   Port: ${port}`);
console.log(`   Auth: PostgreSQL + bcrypt + JWT RBAC`);
console.log(``);
const hostUrl = process.env.API_HOST_URL || `http://localhost:${port}`;
console.log(`📡 Endpoints:`);
console.log(`   Health: ${hostUrl}/health`);
console.log(`   tRPC: ${hostUrl}/trpc`);
console.log(`   REST (legacy): ${hostUrl}/api/*`);
console.log(``);

export default {
  port,
  fetch: app.fetch,
};

// Export router type for frontend
export type { AppRouter };
