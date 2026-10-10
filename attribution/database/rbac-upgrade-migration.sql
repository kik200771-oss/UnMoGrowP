-- RBAC Upgrade Migration for UnMoGrowP Attribution Platform
-- Description: Upgrade from simple role system to full RBAC
-- Created: 2025-10-22
-- CRITICAL: Required for production security

BEGIN;

-- 1. Upgrade users table with extended roles
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['user'];

ALTER TABLE users
ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT ARRAY[];

ALTER TABLE users
ADD COLUMN IF NOT EXISTS app_access UUID[] DEFAULT ARRAY[];

-- Update existing role column to array format
UPDATE users SET roles = ARRAY[role] WHERE roles IS NULL;

-- 2. Create user_app_permissions table for granular app access
CREATE TABLE IF NOT EXISTS user_app_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
    permissions TEXT[] DEFAULT ARRAY['read'],
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(user_id, app_id)
);

-- 3. Create security_audit_log table for compliance
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255),
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN (roles);
CREATE INDEX IF NOT EXISTS idx_users_permissions ON users USING GIN (permissions);
CREATE INDEX IF NOT EXISTS idx_user_app_permissions_user_id ON user_app_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_permissions_app_id ON user_app_permissions(app_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_action ON security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);

-- 5. Update existing test users with new RBAC structure
UPDATE users
SET
    roles = CASE
        WHEN email = 'test@test.com' THEN ARRAY['admin']
        ELSE ARRAY['user']
    END,
    permissions = CASE
        WHEN email = 'test@test.com' THEN ARRAY[
            'users:read', 'users:create', 'users:update',
            'apps:create', 'apps:read', 'apps:update', 'apps:delete',
            'analytics:read', 'analytics:export', 'analytics:admin',
            'admin:users'
        ]
        ELSE ARRAY[
            'users:read',
            'apps:read', 'apps:update',
            'analytics:read'
        ]
    END,
    updated_at = CURRENT_TIMESTAMP;

-- 6. Grant app access to owners
UPDATE users
SET app_access = (
    SELECT ARRAY_AGG(a.id)
    FROM apps a
    WHERE a.user_id = users.id
)
WHERE EXISTS (SELECT 1 FROM apps WHERE user_id = users.id);

-- 7. Create additional admin user for testing
INSERT INTO users (email, password_hash, name, roles, permissions, email_verified)
VALUES (
    'admin@unmogrowp.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLO92Q.t.9DJmru', -- "password123"
    'System Administrator',
    ARRAY['super_admin'],
    ARRAY[
        'users:create', 'users:read', 'users:update', 'users:delete',
        'apps:create', 'apps:read', 'apps:update', 'apps:delete',
        'analytics:read', 'analytics:export', 'analytics:admin',
        'admin:users', 'admin:system', 'admin:billing', 'admin:security'
    ],
    true
) ON CONFLICT (email) DO UPDATE SET
    roles = EXCLUDED.roles,
    permissions = EXCLUDED.permissions,
    updated_at = CURRENT_TIMESTAMP;

-- 8. Create readonly user for testing
INSERT INTO users (email, password_hash, name, roles, permissions, email_verified)
VALUES (
    'readonly@unmogrowp.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLO92Q.t.9DJmru', -- "password123"
    'Readonly User',
    ARRAY['readonly'],
    ARRAY['users:read', 'apps:read', 'analytics:read'],
    true
) ON CONFLICT (email) DO UPDATE SET
    roles = EXCLUDED.roles,
    permissions = EXCLUDED.permissions,
    updated_at = CURRENT_TIMESTAMP;

-- 9. Update apps table to include owner_id reference
ALTER TABLE apps ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);
UPDATE apps SET owner_id = user_id WHERE owner_id IS NULL;

-- 10. Validate migration
DO $$
BEGIN
    -- Check that users table has new columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='roles') THEN
        RAISE EXCEPTION 'Migration failed: users.roles column not created';
    END IF;

    -- Check that security_audit_log table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='security_audit_log') THEN
        RAISE EXCEPTION 'Migration failed: security_audit_log table not created';
    END IF;

    -- Check that test users have correct roles
    IF NOT EXISTS (SELECT 1 FROM users WHERE email='admin@unmogrowp.com' AND 'super_admin' = ANY(roles)) THEN
        RAISE EXCEPTION 'Migration failed: super_admin user not created correctly';
    END IF;

    RAISE NOTICE 'RBAC migration completed successfully!';
END $$;

COMMIT;

-- Display migration results
SELECT
    'Users with RBAC roles' as table_name,
    COUNT(*) as row_count,
    STRING_AGG(DISTINCT u.roles::text, ', ') as sample_roles
FROM users u;

SELECT
    'Security audit log table' as table_name,
    COUNT(*) as row_count
FROM security_audit_log;

SELECT
    'User app permissions table' as table_name,
    COUNT(*) as row_count
FROM user_app_permissions;

-- Show test users
SELECT
    email,
    roles,
    array_length(permissions, 1) as permission_count,
    array_length(app_access, 1) as app_access_count,
    email_verified
FROM users
ORDER BY created_at;