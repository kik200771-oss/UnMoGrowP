/**
 * Authentication & Authorization Tests - unit
 * UnMoGrowP Attribution Platform - API Gateway
 */

import { describe, it, expect, beforeEach, jest } from 'bun:test';
import {
  AuthService,
  AuthorizationService,
  UserRole,
  Permission,
  authenticate,
  requireRole,
  requirePermission,
  getCurrentUser
} from './auth';
import { testUtils, mockServices } from './test-setup';

describe('Authentication Service - unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthService', () => {
    it('should create password hash', async () => {
      const password = 'testpassword123';
      const hash = await AuthService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(typeof hash).toBe('string');
    });

    it('should verify correct password', async () => {
      const password = 'testpassword123';
      const hash = await AuthService.hashPassword(password);
      const isValid = await AuthService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hash = await AuthService.hashPassword(password);
      const isValid = await AuthService.verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should generate JWT token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: UserRole.USER
      };

      const token = AuthService.generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should verify valid JWT token', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: UserRole.USER
      };

      const token = AuthService.generateToken(payload);
      const decoded = AuthService.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should reject invalid JWT token', () => {
      const invalidToken = 'invalid.jwt.token';

      expect(() => {
        AuthService.verifyToken(invalidToken);
      }).toThrow();
    });

    it('should reject expired JWT token', () => {
      // This would require a token with past expiry
      // In real implementation, you'd create a token with negative exp
      const expiredToken = testUtils.createTestToken({ exp: Math.floor(Date.now() / 1000) - 3600 });

      expect(() => {
        AuthService.verifyToken(expiredToken);
      }).toThrow();
    });
  });

  describe('AuthorizationService', () => {
    it('should validate admin role permissions', () => {
      const adminPermissions = AuthorizationService.getRolePermissions(UserRole.ADMIN);

      expect(adminPermissions).toContain(Permission.READ_USERS);
      expect(adminPermissions).toContain(Permission.WRITE_USERS);
      expect(adminPermissions).toContain(Permission.DELETE_USERS);
      expect(adminPermissions).toContain(Permission.MANAGE_APPS);
    });

    it('should validate user role permissions', () => {
      const userPermissions = AuthorizationService.getRolePermissions(UserRole.USER);

      expect(userPermissions).toContain(Permission.READ_OWN_DATA);
      expect(userPermissions).not.toContain(Permission.WRITE_USERS);
      expect(userPermissions).not.toContain(Permission.DELETE_USERS);
    });

    it('should validate viewer role permissions', () => {
      const viewerPermissions = AuthorizationService.getRolePermissions(UserRole.VIEWER);

      expect(viewerPermissions).toContain(Permission.READ_OWN_DATA);
      expect(viewerPermissions).not.toContain(Permission.WRITE_ANALYTICS);
    });

    it('should check user has required permission', () => {
      const user = {
        id: 'user123',
        role: UserRole.ADMIN,
        appId: 'app123'
      };

      const hasPermission = AuthorizationService.hasPermission(user, Permission.MANAGE_APPS);
      expect(hasPermission).toBe(true);
    });

    it('should check user lacks required permission', () => {
      const user = {
        id: 'user123',
        role: UserRole.USER,
        appId: 'app123'
      };

      const hasPermission = AuthorizationService.hasPermission(user, Permission.DELETE_USERS);
      expect(hasPermission).toBe(false);
    });

    it('should validate app access for same app', () => {
      const user = {
        id: 'user123',
        role: UserRole.USER,
        appId: 'app123'
      };

      const hasAccess = AuthorizationService.hasAppAccess(user, 'app123');
      expect(hasAccess).toBe(true);
    });

    it('should deny app access for different app', () => {
      const user = {
        id: 'user123',
        role: UserRole.USER,
        appId: 'app123'
      };

      const hasAccess = AuthorizationService.hasAppAccess(user, 'app456');
      expect(hasAccess).toBe(false);
    });

    it('should allow admin access to any app', () => {
      const admin = {
        id: 'admin123',
        role: UserRole.ADMIN,
        appId: 'app123'
      };

      const hasAccess = AuthorizationService.hasAppAccess(admin, 'app456');
      expect(hasAccess).toBe(true);
    });
  });

  describe('Middleware Functions', () => {
    it('should authenticate valid token', async () => {
      const token = testUtils.createTestToken();
      const mockContext = {
        req: {
          header: jest.fn().mockReturnValue(`Bearer ${token}`)
        },
        set: jest.fn(),
        next: jest.fn()
      };

      await authenticate(mockContext);

      expect(mockContext.set).toHaveBeenCalledWith('user', expect.any(Object));
      expect(mockContext.next).toHaveBeenCalled();
    });

    it('should reject missing authorization header', async () => {
      const mockContext = {
        req: {
          header: jest.fn().mockReturnValue(null)
        },
        json: jest.fn().mockReturnValue({ error: 'Unauthorized' }),
        status: jest.fn()
      };

      await authenticate(mockContext);

      expect(mockContext.status).toHaveBeenCalledWith(401);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unauthorized' })
      );
    });

    it('should reject invalid token format', async () => {
      const mockContext = {
        req: {
          header: jest.fn().mockReturnValue('InvalidToken')
        },
        json: jest.fn().mockReturnValue({ error: 'Invalid token format' }),
        status: jest.fn()
      };

      await authenticate(mockContext);

      expect(mockContext.status).toHaveBeenCalledWith(401);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token format' })
      );
    });

    it('should require specific role', async () => {
      const user = testUtils.createTestUser({ role: UserRole.ADMIN });
      const mockContext = {
        get: jest.fn().mockReturnValue(user),
        next: jest.fn()
      };

      const middleware = requireRole(UserRole.ADMIN);
      await middleware(mockContext);

      expect(mockContext.next).toHaveBeenCalled();
    });

    it('should reject insufficient role', async () => {
      const user = testUtils.createTestUser({ role: UserRole.USER });
      const mockContext = {
        get: jest.fn().mockReturnValue(user),
        json: jest.fn().mockReturnValue({ error: 'Insufficient permissions' }),
        status: jest.fn()
      };

      const middleware = requireRole(UserRole.ADMIN);
      await middleware(mockContext);

      expect(mockContext.status).toHaveBeenCalledWith(403);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Insufficient permissions' })
      );
    });

    it('should require specific permission', async () => {
      const user = testUtils.createTestUser({ role: UserRole.ADMIN });
      const mockContext = {
        get: jest.fn().mockReturnValue(user),
        next: jest.fn()
      };

      const middleware = requirePermission(Permission.MANAGE_APPS);
      await middleware(mockContext);

      expect(mockContext.next).toHaveBeenCalled();
    });

    it('should reject insufficient permission', async () => {
      const user = testUtils.createTestUser({ role: UserRole.USER });
      const mockContext = {
        get: jest.fn().mockReturnValue(user),
        json: jest.fn().mockReturnValue({ error: 'Insufficient permissions' }),
        status: jest.fn()
      };

      const middleware = requirePermission(Permission.DELETE_USERS);
      await middleware(mockContext);

      expect(mockContext.status).toHaveBeenCalledWith(403);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Insufficient permissions' })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed JWT token', () => {
      const malformedToken = 'malformed.token';

      expect(() => {
        AuthService.verifyToken(malformedToken);
      }).toThrow();
    });

    it('should handle empty password', async () => {
      const emptyPassword = '';

      expect(async () => {
        await AuthService.hashPassword(emptyPassword);
      }).toThrow();
    });

    it('should handle null user in authorization', () => {
      const result = AuthorizationService.hasPermission(null, Permission.READ_USERS);
      expect(result).toBe(false);
    });

    it('should handle undefined role', () => {
      const user = {
        id: 'user123',
        role: undefined,
        appId: 'app123'
      };

      const result = AuthorizationService.hasPermission(user, Permission.READ_USERS);
      expect(result).toBe(false);
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive data in tokens', () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        password: 'should-not-be-included',
        role: UserRole.USER
      };

      const token = AuthService.generateToken(payload);
      const decoded = AuthService.verifyToken(token);

      expect(decoded.password).toBeUndefined();
    });

    it('should use secure password hashing', async () => {
      const password = 'testpassword123';
      const hash1 = await AuthService.hashPassword(password);
      const hash2 = await AuthService.hashPassword(password);

      // Same password should produce different hashes (salt)
      expect(hash1).not.toBe(hash2);

      // But both should verify the original password
      expect(await AuthService.verifyPassword(password, hash1)).toBe(true);
      expect(await AuthService.verifyPassword(password, hash2)).toBe(true);
    });

    it('should reject tokens with wrong signature', () => {
      const validToken = testUtils.createTestToken();
      const [header, payload] = validToken.split('.');
      const tamperedToken = `${header}.${payload}.invalid-signature`;

      expect(() => {
        AuthService.verifyToken(tamperedToken);
      }).toThrow();
    });
  });
});