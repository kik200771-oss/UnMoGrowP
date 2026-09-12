// Multi-Tenant Database Connection and Authentication Utilities
// Version: 0.5.0 - Multi-tenant Architecture Implementation
import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'unmogrowp',
  user: process.env.DB_USER || 'unmogrowp',
  password: process.env.DB_PASS || 'unmogrowp',
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// JWT secret - in production, use a strong secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  plan_type: 'starter' | 'pro' | 'enterprise' | 'dedicated';
  max_apps: number;
  max_events_per_month: number;
  status: 'active' | 'suspended' | 'canceled';
  tenant_type: 'multi' | 'single' | 'dedicated';
  database_name?: string;
  current_month_events: number;
  created_at: Date;
  last_active_at: Date;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  company?: string;
  role: 'owner' | 'admin' | 'user' | 'viewer';
  permissions: Record<string, any>;
  email_verified: boolean;
  status: 'active' | 'suspended' | 'pending';
  created_at: Date;
  last_login_at?: Date;
  organization?: Organization; // Populated when needed
}

export interface App {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  bundle_id: string;
  platform: 'ios' | 'android' | 'web' | 'unity';
  api_key: string;
  api_secret: string;
  webhook_url?: string;
  webhook_secret: string;
  settings: Record<string, any>;
  status: 'active' | 'paused' | 'archived';
  attribution_window_hours: number;
  view_through_window_hours: number;
  created_at: Date;
  updated_at: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  organization_id?: string; // Optional for multi-tenant
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  company?: string;
  organization_name?: string; // For creating new organization
  organization_id?: string; // For joining existing organization
}

export interface JWTPayload {
  userId: string;
  organizationId: string;
  email: string;
  name: string;
  role: string;
  permissions: Record<string, any>;
  apps: string[]; // App IDs user has access to
}

// ============================================================================
// MULTI-TENANT AUTHENTICATION SERVICE
// ============================================================================

export class MultiTenantAuthService {

  // ==================== UTILITY METHODS ====================

  // Hash password using bcrypt
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password against hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Generate JWT token with tenant information
  static generateToken(user: User, rememberMe: boolean = false): string {
    const payload: JWTPayload = {
      userId: user.id,
      organizationId: user.organization_id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      apps: [], // Will be populated when needed
    };

    const options = {
      expiresIn: rememberMe ? '30d' : '24h',
      issuer: 'unmogrowp-api',
      audience: 'unmogrowp-frontend',
    };

    return jwt.sign(payload, JWT_SECRET, options);
  }

  // Verify JWT token
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Set tenant context for database queries (Row Level Security)
  static async setTenantContext(client: PoolClient, organizationId: string): Promise<void> {
    await client.query('SET LOCAL app.current_organization_id = $1', [organizationId]);
  }

  // ==================== ORGANIZATION MANAGEMENT ====================

  // Create new organization
  static async createOrganization(name: string, domain?: string, planType: string = 'starter'): Promise<Organization> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `INSERT INTO organizations (name, domain, plan_type)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name, domain, planType]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Get organization by ID
  static async getOrganizationById(organizationId: string): Promise<Organization | null> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM organizations WHERE id = $1',
        [organizationId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  // Get organization by domain (for domain-based tenant resolution)
  static async getOrganizationByDomain(domain: string): Promise<Organization | null> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT * FROM organizations WHERE domain = $1',
        [domain]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  // ==================== USER AUTHENTICATION ====================

  // Authenticate user (login) with tenant awareness
  static async authenticateUser(email: string, password: string, organizationId?: string): Promise<User | null> {
    const client = await pool.connect();

    try {
      let query: string;
      let params: any[];

      if (organizationId) {
        // Login to specific organization
        query = `
          SELECT u.*, o.name as organization_name, o.domain as organization_domain
          FROM users u
          JOIN organizations o ON u.organization_id = o.id
          WHERE u.email = $1 AND u.organization_id = $2 AND u.status = 'active'
        `;
        params = [email, organizationId];
      } else {
        // Find user across all organizations (for single-tenant or cross-tenant access)
        query = `
          SELECT u.*, o.name as organization_name, o.domain as organization_domain
          FROM users u
          JOIN organizations o ON u.organization_id = o.id
          WHERE u.email = $1 AND u.status = 'active'
          ORDER BY u.last_login_at DESC NULLS LAST
          LIMIT 1
        `;
        params = [email];
      }

      const result = await client.query(query, params);

      if (result.rows.length === 0) {
        return null; // User not found
      }

      const userRow = result.rows[0];

      // Verify password
      const isValidPassword = await this.verifyPassword(password, userRow.password_hash);
      if (!isValidPassword) {
        return null; // Invalid password
      }

      // Set tenant context for subsequent queries
      await this.setTenantContext(client, userRow.organization_id);

      // Update last login
      await client.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userRow.id]
      );

      // Update organization last active
      await client.query(
        'UPDATE organizations SET last_active_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userRow.organization_id]
      );

      // Return user object with organization info
      const user: User = {
        id: userRow.id,
        organization_id: userRow.organization_id,
        email: userRow.email,
        name: userRow.name,
        company: userRow.company,
        role: userRow.role,
        permissions: userRow.permissions || {},
        email_verified: userRow.email_verified,
        status: userRow.status,
        created_at: userRow.created_at,
        last_login_at: new Date(),
        organization: {
          id: userRow.organization_id,
          name: userRow.organization_name,
          domain: userRow.organization_domain,
          plan_type: 'pro', // Will be populated from joined query
          max_apps: 10,
          max_events_per_month: 1000000,
          status: 'active',
          tenant_type: 'multi',
          current_month_events: 0,
          created_at: new Date(),
          last_active_at: new Date(),
        },
      };

      return user;
    } finally {
      client.release();
    }
  }

  // Register new user (with organization creation or joining)
  static async registerUser(data: RegisterRequest): Promise<User> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let organizationId: string;

      if (data.organization_id) {
        // Joining existing organization
        organizationId = data.organization_id;

        // Verify organization exists and is active
        const orgCheck = await client.query(
          'SELECT id FROM organizations WHERE id = $1 AND status = $2',
          [organizationId, 'active']
        );

        if (orgCheck.rows.length === 0) {
          throw new Error('Organization not found or inactive');
        }
      } else {
        // Creating new organization
        const orgName = data.organization_name || `${data.name}'s Organization`;
        const orgResult = await client.query(
          `INSERT INTO organizations (name, plan_type)
           VALUES ($1, $2)
           RETURNING id`,
          [orgName, 'starter']
        );
        organizationId = orgResult.rows[0].id;
      }

      // Set tenant context
      await this.setTenantContext(client, organizationId);

      // Check if user already exists in this organization
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1 AND organization_id = $2',
        [data.email, organizationId]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User already exists in this organization');
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

      // Create user with owner role if creating organization, user role if joining
      const userRole = data.organization_id ? 'user' : 'owner';

      const userResult = await client.query(
        `INSERT INTO users (organization_id, email, password_hash, name, company, role, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, organization_id, email, name, company, role, permissions, email_verified, status, created_at`,
        [organizationId, data.email, passwordHash, data.name, data.company || null, userRole, false]
      );

      await client.query('COMMIT');

      const user = userResult.rows[0];
      user.permissions = user.permissions || {};

      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user by ID (tenant-aware)
  static async getUserById(userId: string, organizationId: string): Promise<User | null> {
    const client = await pool.connect();

    try {
      await this.setTenantContext(client, organizationId);

      const result = await client.query(
        `SELECT u.*, o.name as organization_name
         FROM users u
         JOIN organizations o ON u.organization_id = o.id
         WHERE u.id = $1 AND u.organization_id = $2`,
        [userId, organizationId]
      );

      if (result.rows.length === 0) return null;

      const user = result.rows[0];
      user.permissions = user.permissions || {};

      return user;
    } finally {
      client.release();
    }
  }

  // Find user by email within organization
  static async findUserByEmail(email: string, organizationId: string): Promise<User | null> {
    const client = await pool.connect();

    try {
      await this.setTenantContext(client, organizationId);

      const result = await client.query(
        'SELECT * FROM users WHERE email = $1 AND organization_id = $2',
        [email, organizationId]
      );

      if (result.rows.length === 0) return null;

      const user = result.rows[0];
      user.permissions = user.permissions || {};

      return user;
    } finally {
      client.release();
    }
  }

  // ==================== SESSION MANAGEMENT ====================

  // Store session token (tenant-aware)
  static async storeSession(
    organizationId: string,
    userId: string,
    tokenHash: string,
    appIds: string[] = [],
    userAgent?: string,
    ipAddress?: string,
    expiresAt?: Date
  ): Promise<void> {
    const client = await pool.connect();

    try {
      await this.setTenantContext(client, organizationId);

      await client.query(
        `INSERT INTO user_sessions (organization_id, user_id, token_hash, expires_at, user_agent, ip_address, app_ids, permissions)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          organizationId,
          userId,
          tokenHash,
          expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
          userAgent,
          ipAddress,
          appIds,
          JSON.stringify({})
        ]
      );
    } finally {
      client.release();
    }
  }

  // Clean expired sessions (tenant-aware)
  static async cleanExpiredSessions(organizationId?: string): Promise<void> {
    const client = await pool.connect();

    try {
      if (organizationId) {
        await this.setTenantContext(client, organizationId);
        await client.query(
          'DELETE FROM user_sessions WHERE organization_id = $1 AND expires_at < CURRENT_TIMESTAMP',
          [organizationId]
        );
      } else {
        // Clean all expired sessions (admin operation)
        await client.query('DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP');
      }
    } finally {
      client.release();
    }
  }

  // ==================== PASSWORD RESET (TENANT-AWARE) ====================

  // Create password reset token for user in organization
  static async createPasswordResetToken(email: string, organizationId?: string): Promise<{ token: string; expiresAt: Date } | null> {
    const client = await pool.connect();

    try {
      let query: string;
      let params: any[];

      if (organizationId) {
        // Reset for specific organization
        await this.setTenantContext(client, organizationId);
        query = 'SELECT id FROM users WHERE email = $1 AND organization_id = $2';
        params = [email, organizationId];
      } else {
        // Find user across organizations (use most recently active)
        query = `
          SELECT id, organization_id
          FROM users
          WHERE email = $1 AND status = 'active'
          ORDER BY last_login_at DESC NULLS LAST
          LIMIT 1
        `;
        params = [email];
      }

      const userResult = await client.query(query, params);

      if (userResult.rows.length === 0) {
        return null; // User not found
      }

      const userRow = userResult.rows[0];
      const userId = userRow.id;
      const userOrgId = organizationId || userRow.organization_id;

      // Set tenant context if not already set
      if (!organizationId) {
        await this.setTenantContext(client, userOrgId);
      }

      const token = this.generateResetToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      // Hash the token for storage
      const tokenHash = await this.hashPassword(token);

      // Delete any existing reset tokens for this user
      await client.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1 AND organization_id = $2',
        [userId, userOrgId]
      );

      // Insert new reset token
      await client.query(
        `INSERT INTO password_reset_tokens (organization_id, user_id, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [userOrgId, userId, tokenHash, expiresAt]
      );

      return { token, expiresAt };
    } finally {
      client.release();
    }
  }

  // Verify password reset token (tenant-aware)
  static async verifyPasswordResetToken(token: string): Promise<{ userId: string; organizationId: string; email: string } | null> {
    const client = await pool.connect();

    try {
      // Get all non-expired reset tokens with user info
      const result = await client.query(
        `SELECT prt.user_id, prt.organization_id, prt.token_hash, u.email
         FROM password_reset_tokens prt
         JOIN users u ON prt.user_id = u.id AND prt.organization_id = u.organization_id
         WHERE prt.expires_at > CURRENT_TIMESTAMP`,
        []
      );

      // Check each token hash against the provided token
      for (const row of result.rows) {
        const isValidToken = await bcrypt.compare(token, row.token_hash);
        if (isValidToken) {
          return {
            userId: row.user_id,
            organizationId: row.organization_id,
            email: row.email,
          };
        }
      }

      return null; // Token not found or expired
    } finally {
      client.release();
    }
  }

  // Reset user password using reset token (tenant-aware)
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const client = await pool.connect();

    try {
      // Verify token and get user info
      const tokenInfo = await this.verifyPasswordResetToken(token);
      if (!tokenInfo) {
        return false; // Invalid or expired token
      }

      // Set tenant context
      await this.setTenantContext(client, tokenInfo.organizationId);

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update user's password
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND organization_id = $3',
        [passwordHash, tokenInfo.userId, tokenInfo.organizationId]
      );

      // Delete the used reset token
      await client.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1 AND organization_id = $2',
        [tokenInfo.userId, tokenInfo.organizationId]
      );

      return true;
    } finally {
      client.release();
    }
  }

  // Generate a secure password reset token
  private static generateResetToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex'); // 64 character hex string
  }

  // Clean expired password reset tokens (tenant-aware)
  static async cleanExpiredResetTokens(organizationId?: string): Promise<void> {
    const client = await pool.connect();

    try {
      if (organizationId) {
        await this.setTenantContext(client, organizationId);
        await client.query(
          'DELETE FROM password_reset_tokens WHERE organization_id = $1 AND expires_at < CURRENT_TIMESTAMP',
          [organizationId]
        );
      } else {
        // Clean all expired tokens (admin operation)
        await client.query('DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP');
      }
    } finally {
      client.release();
    }
  }

  // ==================== APP MANAGEMENT ====================

  // Get apps for user/organization
  static async getUserApps(userId: string, organizationId: string): Promise<App[]> {
    const client = await pool.connect();

    try {
      await this.setTenantContext(client, organizationId);

      const result = await client.query(
        'SELECT * FROM apps WHERE organization_id = $1 AND (user_id = $2 OR $3 = ANY(SELECT role FROM users WHERE id = $2 AND role IN (\'owner\', \'admin\')))',
        [organizationId, userId, true]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  // Create new app (tenant-aware)
  static async createApp(
    organizationId: string,
    userId: string,
    name: string,
    bundleId: string,
    platform: string
  ): Promise<App> {
    const client = await pool.connect();

    try {
      await this.setTenantContext(client, organizationId);

      const result = await client.query(
        `INSERT INTO apps (organization_id, user_id, name, bundle_id, platform)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [organizationId, userId, name, bundleId, platform]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // ==================== TENANT RESOLUTION ====================

  // Resolve tenant from request (domain, subdomain, or header)
  static async resolveTenant(request: any): Promise<Organization | null> {
    // 1. Check for organization header
    const orgHeader = request.headers['x-organization-id'];
    if (orgHeader) {
      return await this.getOrganizationById(orgHeader);
    }

    // 2. Check for domain-based tenant resolution
    const host = request.headers.host;
    if (host) {
      // Extract subdomain (e.g., "client1.unmogrowp.com" -> "client1")
      const parts = host.split('.');
      if (parts.length > 2) {
        const subdomain = parts[0];
        const org = await this.getOrganizationByDomain(subdomain);
        if (org) return org;
      }

      // Check for exact domain match
      const org = await this.getOrganizationByDomain(host);
      if (org) return org;
    }

    // 3. Check JWT token for tenant info
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = this.verifyToken(token);
        return await this.getOrganizationById(payload.organizationId);
      } catch (error) {
        // Token invalid, continue with other methods
      }
    }

    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Multi-tenant database connected successfully at:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Multi-tenant database connection failed:', error);
    return false;
  }
}

// Initialize multi-tenant database (create tables if needed)
export async function initializeMultiTenantDB(): Promise<boolean> {
  try {
    const client = await pool.connect();

    // Check if multi-tenant tables exist
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('organizations', 'users', 'apps')
    `);

    client.release();

    const tableCount = result.rows.length;
    console.log(`✅ Multi-tenant tables found: ${tableCount}/3`);

    return tableCount === 3;
  } catch (error) {
    console.error('❌ Multi-tenant database initialization check failed:', error);
    return false;
  }
}

// Export pool for direct queries if needed (use with caution in multi-tenant environment)
export { pool };