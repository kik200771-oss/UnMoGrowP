// JWT RBAC Authorization System
// UnMoGrowP Attribution Platform - Production Security Layer

import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { AuthService } from './database';

// JWT Secret - must match database.ts
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// PostgreSQL connection for authorization checks
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'unmogrowp',
  user: process.env.DB_USER || 'unmogrowp',
  password: process.env.DB_PASS || 'unmogrowp',
});

// User Roles Hierarchy (from high to low privilege)
export enum UserRole {
  SUPER_ADMIN = 'super_admin',  // System administration
  ADMIN = 'admin',              // Organization admin
  USER = 'user',                // Standard user
  READONLY = 'readonly',        // View-only access
  API_KEY = 'api_key'           // Programmatic access
}

// Granular Permissions System
export enum Permission {
  // User Management
  USERS_CREATE = 'users:create',
  USERS_READ = 'users:read',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',

  // App Management
  APPS_CREATE = 'apps:create',
  APPS_READ = 'apps:read',
  APPS_UPDATE = 'apps:update',
  APPS_DELETE = 'apps:delete',

  // Analytics Access
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_EXPORT = 'analytics:export',
  ANALYTICS_ADMIN = 'analytics:admin',

  // System Administration
  ADMIN_USERS = 'admin:users',
  ADMIN_SYSTEM = 'admin:system',
  ADMIN_BILLING = 'admin:billing',
  ADMIN_SECURITY = 'admin:security'
}

// Role-Permission Matrix (production-ready RBAC)
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // All permissions (system god mode)
    Permission.USERS_CREATE, Permission.USERS_READ, Permission.USERS_UPDATE, Permission.USERS_DELETE,
    Permission.APPS_CREATE, Permission.APPS_READ, Permission.APPS_UPDATE, Permission.APPS_DELETE,
    Permission.ANALYTICS_READ, Permission.ANALYTICS_EXPORT, Permission.ANALYTICS_ADMIN,
    Permission.ADMIN_USERS, Permission.ADMIN_SYSTEM, Permission.ADMIN_BILLING, Permission.ADMIN_SECURITY
  ],

  [UserRole.ADMIN]: [
    // Organization-level administration
    Permission.USERS_CREATE, Permission.USERS_READ, Permission.USERS_UPDATE,
    Permission.APPS_CREATE, Permission.APPS_READ, Permission.APPS_UPDATE, Permission.APPS_DELETE,
    Permission.ANALYTICS_READ, Permission.ANALYTICS_EXPORT, Permission.ANALYTICS_ADMIN,
    Permission.ADMIN_USERS
  ],

  [UserRole.USER]: [
    // Standard user permissions
    Permission.USERS_READ, // Can read own profile
    Permission.APPS_READ, Permission.APPS_UPDATE, // Own apps only
    Permission.ANALYTICS_READ
  ],

  [UserRole.READONLY]: [
    // View-only access
    Permission.USERS_READ,
    Permission.APPS_READ,
    Permission.ANALYTICS_READ
  ],

  [UserRole.API_KEY]: [
    // Programmatic access (limited)
    Permission.APPS_READ,
    Permission.ANALYTICS_READ
  ]
};

// JWT Token Payload Interface
export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// Extended User Context for Authorization
export interface AuthUser extends JWTPayload {
  permissions: Permission[];
  appAccess: string[]; // App IDs user has access to
}

// Authorization Service Class
export class AuthorizationService {

  // Get user permissions based on role
  static getUserPermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  // Check if user has specific permission
  static hasPermission(user: AuthUser, permission: Permission): boolean {
    return user.permissions.includes(permission);
  }

  // Check if user has any of the specified roles
  static hasRole(user: AuthUser, roles: UserRole[]): boolean {
    return roles.includes(user.role);
  }

  // Check if user can access specific app
  static async canAccessApp(userId: string, appId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT 1 FROM user_app_permissions
         WHERE user_id = $1 AND app_id = $2
         UNION
         SELECT 1 FROM apps WHERE id = $2 AND owner_id = $1`,
        [userId, appId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('App access check failed:', error);
      return false;
    }
  }

  // Get user's app access list
  static async getUserAppAccess(userId: string): Promise<string[]> {
    try {
      const result = await pool.query(
        `SELECT DISTINCT app_id FROM user_app_permissions WHERE user_id = $1
         UNION
         SELECT id as app_id FROM apps WHERE owner_id = $1`,
        [userId]
      );
      return result.rows.map(row => row.app_id);
    } catch (error) {
      console.error('Failed to get user app access:', error);
      return [];
    }
  }

  // Log security events for audit trail
  static async logSecurityEvent(
    userId: string,
    action: string,
    resource: string,
    success: boolean,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO security_audit_log (user_id, action, resource, success, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, now())`,
        [userId, action, resource, success, ip, userAgent]
      );
    } catch (error) {
      console.error('Security audit logging failed:', error);
      // Don't throw - logging failure shouldn't break the request
    }
  }
}

// JWT Authentication Middleware
export const authenticate = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Authorization header required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify JWT token
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Get user's app access
    const appAccess = await AuthorizationService.getUserAppAccess(payload.userId);

    // Create full auth user object
    const authUser: AuthUser = {
      ...payload,
      permissions: AuthorizationService.getUserPermissions(payload.role),
      appAccess
    };

    // Store in context for next middleware
    c.set('user', authUser);

    // Log successful authentication
    await AuthorizationService.logSecurityEvent(
      payload.userId,
      'AUTHENTICATE',
      'JWT_TOKEN',
      true,
      c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      c.req.header('User-Agent')
    );

    await next();

  } catch (error) {
    // Log failed authentication attempt
    const authHeader = c.req.header('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.substring(7);
        const payload = jwt.decode(token) as any;
        if (payload?.userId) {
          await AuthorizationService.logSecurityEvent(
            payload.userId,
            'AUTHENTICATE',
            'JWT_TOKEN',
            false,
            c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
            c.req.header('User-Agent')
          );
        }
      } catch {}
    }

    throw new HTTPException(401, {
      message: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
};

// Role-based Authorization Middleware
export const requireRole = (roles: UserRole[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser;

    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    if (!AuthorizationService.hasRole(user, roles)) {
      // Log authorization failure
      await AuthorizationService.logSecurityEvent(
        user.userId,
        'AUTHORIZE_ROLE',
        `REQUIRED_ROLES: ${roles.join(',')}`,
        false,
        c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
        c.req.header('User-Agent')
      );

      throw new HTTPException(403, {
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    // Log successful authorization
    await AuthorizationService.logSecurityEvent(
      user.userId,
      'AUTHORIZE_ROLE',
      `GRANTED_ROLES: ${roles.join(',')}`,
      true,
      c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      c.req.header('User-Agent')
    );

    await next();
  };
};

// Permission-based Authorization Middleware
export const requirePermission = (permission: Permission) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser;

    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    if (!AuthorizationService.hasPermission(user, permission)) {
      // Log authorization failure
      await AuthorizationService.logSecurityEvent(
        user.userId,
        'AUTHORIZE_PERMISSION',
        `REQUIRED: ${permission}`,
        false,
        c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
        c.req.header('User-Agent')
      );

      throw new HTTPException(403, {
        message: `Access denied. Required permission: ${permission}`
      });
    }

    // Log successful authorization
    await AuthorizationService.logSecurityEvent(
      user.userId,
      'AUTHORIZE_PERMISSION',
      `GRANTED: ${permission}`,
      true,
      c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      c.req.header('User-Agent')
    );

    await next();
  };
};

// App Access Authorization Middleware
export const requireAppAccess = (appIdParam: string = 'appId') => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthUser;
    const appId = c.req.param(appIdParam);

    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    if (!appId) {
      throw new HTTPException(400, { message: 'App ID required' });
    }

    // Super admins can access everything
    if (user.role === UserRole.SUPER_ADMIN) {
      await next();
      return;
    }

    // Check app access
    const hasAccess = await AuthorizationService.canAccessApp(user.userId, appId);

    if (!hasAccess) {
      // Log authorization failure
      await AuthorizationService.logSecurityEvent(
        user.userId,
        'AUTHORIZE_APP_ACCESS',
        `APP_ID: ${appId}`,
        false,
        c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
        c.req.header('User-Agent')
      );

      throw new HTTPException(403, {
        message: `Access denied to app: ${appId}`
      });
    }

    // Log successful authorization
    await AuthorizationService.logSecurityEvent(
      user.userId,
      'AUTHORIZE_APP_ACCESS',
      `APP_ID: ${appId}`,
      true,
      c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
      c.req.header('User-Agent')
    );

    await next();
  };
};

// Utility: Get current authenticated user
export const getCurrentUser = (c: Context): AuthUser | null => {
  return c.get('user') as AuthUser || null;
};

// Utility: Check if current user has permission
export const checkPermission = (c: Context, permission: Permission): boolean => {
  const user = getCurrentUser(c);
  return user ? AuthorizationService.hasPermission(user, permission) : false;
};

// Note: UserRole, Permission, AuthUser, JWTPayload, and AuthorizationService
// are already exported above in the file, so no need to re-export them here