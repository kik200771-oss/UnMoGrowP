// Database connection and authentication utilities
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'unmogrowp',
  user: process.env.DB_USER || 'unmogrowp',
  password: process.env.DB_PASS || 'unmogrowp',
});

// JWT secret - in production, use a strong secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  email_verified: boolean;
  created_at: Date;
  last_login_at?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  company?: string;
}

export class AuthService {
  // Hash password using bcrypt
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password against hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Generate JWT token
  static generateToken(user: User, rememberMe: boolean = false): string {
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const options = {
      expiresIn: rememberMe ? '30d' : '24h',
      issuer: 'unmogrowp-api',
      audience: 'unmogrowp-frontend',
    };

    return jwt.sign(payload, JWT_SECRET, options);
  }

  // Verify JWT token
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Authenticate user (login)
  static async authenticateUser(email: string, password: string): Promise<User | null> {
    const client = await pool.connect();

    try {
      // Find user by email
      const result = await client.query(
        'SELECT id, email, password_hash, name, role, email_verified, created_at, last_login_at FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return null; // User not found
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await this.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return null; // Invalid password
      }

      // Update last login
      await client.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Return user without password hash
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
        created_at: user.created_at,
        last_login_at: new Date(),
      };
    } finally {
      client.release();
    }
  }

  // Register new user
  static async registerUser(data: RegisterRequest): Promise<User> {
    const client = await pool.connect();

    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [data.email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(data.password);

      // Create user
      const result = await client.query(
        `INSERT INTO users (email, password_hash, name, company)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, name, role, email_verified, created_at`,
        [data.email, passwordHash, data.name, data.company || null]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT id, email, name, role, email_verified, created_at, last_login_at FROM users WHERE id = $1',
        [userId]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  // Find user by email
  static async findUserByEmail(email: string): Promise<User | null> {
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT id, email, name, role, email_verified, created_at, last_login_at FROM users WHERE email = $1',
        [email]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  // Store session token (optional, for token blacklisting)
  static async storeSession(userId: string, tokenHash: string, userAgent?: string, ipAddress?: string, expiresAt?: Date): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query(
        `INSERT INTO user_sessions (user_id, token_hash, expires_at, user_agent, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, tokenHash, expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), userAgent, ipAddress]
      );
    } finally {
      client.release();
    }
  }

  // Clean expired sessions
  static async cleanExpiredSessions(): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP');
    } finally {
      client.release();
    }
  }

  // ==================== Password Reset Methods ====================

  // Generate a secure password reset token
  static generateResetToken(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex'); // 64 character hex string
  }

  // Create password reset token for user
  static async createPasswordResetToken(email: string): Promise<{ token: string; expiresAt: Date } | null> {
    const client = await pool.connect();

    try {
      // First, check if user exists
      const userResult = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return null; // User not found
      }

      const userId = userResult.rows[0].id;
      const token = this.generateResetToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      // Hash the token for storage (don't store plain token)
      const tokenHash = await this.hashPassword(token);

      // Delete any existing reset tokens for this user
      await client.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [userId]
      );

      // Insert new reset token
      await client.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [userId, tokenHash, expiresAt]
      );

      return { token, expiresAt };
    } finally {
      client.release();
    }
  }

  // Verify password reset token and get user info
  static async verifyPasswordResetToken(token: string): Promise<{ userId: string; email: string } | null> {
    const client = await pool.connect();

    try {
      // Get all non-expired reset tokens with user info
      const result = await client.query(
        `SELECT prt.user_id, prt.token_hash, u.email
         FROM password_reset_tokens prt
         JOIN users u ON prt.user_id = u.id
         WHERE prt.expires_at > CURRENT_TIMESTAMP`,
        []
      );

      // Check each token hash against the provided token
      for (const row of result.rows) {
        const isValidToken = await bcrypt.compare(token, row.token_hash);
        if (isValidToken) {
          return {
            userId: row.user_id,
            email: row.email,
          };
        }
      }

      return null; // Token not found or expired
    } finally {
      client.release();
    }
  }

  // Reset user password using reset token
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const client = await pool.connect();

    try {
      // Verify token and get user info
      const tokenInfo = await this.verifyPasswordResetToken(token);
      if (!tokenInfo) {
        return false; // Invalid or expired token
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update user's password
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, tokenInfo.userId]
      );

      // Delete the used reset token
      await client.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [tokenInfo.userId]
      );

      return true;
    } finally {
      client.release();
    }
  }

  // Clean expired password reset tokens
  static async cleanExpiredResetTokens(): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP');
    } finally {
      client.release();
    }
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Export pool for direct queries if needed
export { pool };