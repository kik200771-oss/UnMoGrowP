// API Rate Limiting Middleware
// UnMoGrowP Attribution Platform - Additional Security Layer
// Prevents API abuse and ensures fair usage

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  keyGenerator?: (c: Context) => string;  // Custom key generator
  skipIf?: (c: Context) => boolean;       // Skip rate limiting condition
  message?: string;      // Custom error message
}

// Rate limit store (in-memory for simplicity, use Redis in production)
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  // Clean expired entries every 5 minutes
  private cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (now > data.resetTime) {
        this.store.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  get(key: string): { count: number; resetTime: number } | null {
    return this.store.get(key) || null;
  }

  set(key: string, count: number, resetTime: number): void {
    this.store.set(key, { count, resetTime });
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const data = this.get(key);

    if (!data || now > data.resetTime) {
      // New window
      const resetTime = now + windowMs;
      this.set(key, 1, resetTime);
      return { count: 1, resetTime };
    } else {
      // Existing window
      const newCount = data.count + 1;
      this.set(key, newCount, data.resetTime);
      return { count: newCount, resetTime: data.resetTime };
    }
  }

  clear(): void {
    this.store.clear();
  }
}

// Global rate limit store
const store = new RateLimitStore();

// Default key generator (IP + User ID if authenticated)
function defaultKeyGenerator(c: Context): string {
  const ip = c.req.header('CF-Connecting-IP') ||
            c.req.header('X-Forwarded-For') ||
            c.req.header('X-Real-IP') ||
            'unknown';

  // Include user ID if authenticated (for per-user limits)
  const user = c.get('user');
  const userId = user?.userId || 'anonymous';

  return `${ip}:${userId}`;
}

// Create rate limiting middleware
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skipIf,
    message = 'Too many requests, please try again later.'
  } = config;

  return async (c: Context, next: Next) => {
    // Skip rate limiting if condition is met
    if (skipIf && skipIf(c)) {
      await next();
      return;
    }

    const key = keyGenerator(c);
    const result = store.increment(key, windowMs);

    // Add rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - result.count).toString());
    c.header('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (result.count > maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());

      throw new HTTPException(429, {
        message: message,
        cause: {
          limit: maxRequests,
          windowMs,
          retryAfter
        }
      });
    }

    await next();
  };
}

// Predefined rate limit configurations

// General API rate limit (100 requests per minute)
export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'Rate limit exceeded. Maximum 100 requests per minute.'
});

// Authentication rate limit (5 login attempts per minute)
export const authRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  keyGenerator: (c) => {
    // Use IP for auth rate limiting (prevent brute force)
    return c.req.header('CF-Connecting-IP') ||
           c.req.header('X-Forwarded-For') ||
           c.req.header('X-Real-IP') ||
           'unknown';
  },
  message: 'Too many authentication attempts. Please wait before trying again.'
});

// Dashboard API rate limit (300 requests per minute for analytics)
export const dashboardRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 300,
  message: 'Dashboard API rate limit exceeded. Maximum 300 requests per minute.'
});

// Admin API rate limit (50 requests per minute for admin endpoints)
export const adminRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 50,
  message: 'Admin API rate limit exceeded. Maximum 50 requests per minute.'
});

// Event tracking rate limit (1000 requests per minute)
export const eventRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000,
  message: 'Event tracking rate limit exceeded. Maximum 1000 events per minute.'
});

// Strict rate limit for sensitive operations (10 requests per hour)
export const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: 'Strict rate limit exceeded. Maximum 10 requests per hour for this operation.'
});

// Per-user rate limit (different limits based on user role)
export function createUserRoleRateLimit() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000, // Will be adjusted based on role
    keyGenerator: (c) => {
      const user = c.get('user');
      return user?.userId || 'anonymous';
    },
    skipIf: (c) => {
      const user = c.get('user');

      // Adjust limits based on user role
      if (user?.role === 'super_admin') {
        return true; // No rate limiting for super admins
      }

      return false;
    },
    message: 'User rate limit exceeded based on your subscription plan.'
  });
}

// Rate limit bypass for specific API keys or IPs
export function createBypassableRateLimit(config: RateLimitConfig & {
  bypassKeys?: string[];
  bypassIPs?: string[];
}) {
  const { bypassKeys = [], bypassIPs = [], ...rateLimitConfig } = config;

  return rateLimit({
    ...rateLimitConfig,
    skipIf: (c) => {
      // Check for bypass API key
      const apiKey = c.req.header('X-API-Key');
      if (apiKey && bypassKeys.includes(apiKey)) {
        return true;
      }

      // Check for bypass IP
      const ip = c.req.header('CF-Connecting-IP') ||
                c.req.header('X-Forwarded-For') ||
                'unknown';
      if (bypassIPs.includes(ip)) {
        return true;
      }

      return config.skipIf ? config.skipIf(c) : false;
    }
  });
}

// Rate limit statistics (for monitoring)
export function getRateLimitStats() {
  return {
    totalKeys: store['store'].size,
    activeWindows: Array.from(store['store'].entries()).filter(
      ([_, data]) => Date.now() < data.resetTime
    ).length
  };
}

// Clear rate limit store (useful for testing)
export function clearRateLimitStore() {
  store.clear();
}

export default {
  rateLimit,
  generalRateLimit,
  authRateLimit,
  dashboardRateLimit,
  adminRateLimit,
  eventRateLimit,
  strictRateLimit,
  createUserRoleRateLimit,
  createBypassableRateLimit,
  getRateLimitStats,
  clearRateLimitStore
};