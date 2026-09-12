-- RBAC Security Migration for UnMoGrowP Attribution Platform
-- JWT Authorization System + Security Audit Logging
-- Date: 2025-10-21

-- Step 1: Update users table to support RBAC roles
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ALTER COLUMN role TYPE VARCHAR(20),
ALTER COLUMN role SET DEFAULT 'user';

-- Add new role constraint with all RBAC roles
ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('super_admin', 'admin', 'user', 'readonly', 'api_key'));

-- Add organization support for multi-tenancy
ALTER TABLE users
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS app_access UUID[] DEFAULT ARRAY[]::UUID[];

-- Step 2: Create organizations table for multi-tenant support
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    settings JSONB DEFAULT '{}',
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    max_users INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create user app permissions table (fine-grained access control)
CREATE TABLE IF NOT EXISTS user_app_permissions (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
    permissions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    PRIMARY KEY (user_id, app_id)
);

-- Step 4: Create security audit log table (CRITICAL for enterprise)
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 5: Update apps table with owner reference
ALTER TABLE apps
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);

-- Set existing apps owner to user_id (backward compatibility)
UPDATE apps SET owner_id = user_id WHERE owner_id IS NULL;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_app_permissions_user_id ON user_app_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_permissions_app_id ON user_app_permissions(app_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_action ON security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_ip ON security_audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_apps_owner_id ON apps(owner_id);

-- Step 7: Add update triggers for new tables
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Update test data with proper RBAC roles
-- Update existing test user to admin with full permissions
UPDATE users SET
    role = 'admin',
    permissions = ARRAY[
        'users:create', 'users:read', 'users:update',
        'apps:create', 'apps:read', 'apps:update', 'apps:delete',
        'analytics:read', 'analytics:export', 'analytics:admin',
        'admin:users'
    ]::TEXT[]
WHERE email = 'test@test.com';

-- Step 9: Create default organization
INSERT INTO organizations (id, name, domain, plan, max_users, is_active) VALUES (
    uuid_generate_v4(),
    'Default Organization',
    'localhost',
    'enterprise',
    1000,
    true
) ON CONFLICT DO NOTHING;

-- Update test user with organization
UPDATE users SET
    organization_id = (SELECT id FROM organizations WHERE name = 'Default Organization' LIMIT 1)
WHERE email = 'test@test.com';

-- Step 10: Create additional RBAC test users
INSERT INTO users (email, password_hash, name, role, email_verified, organization_id, permissions) VALUES
-- Super Admin (system god mode)
('superadmin@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLO92Q.t.9DJmru', 'Super Admin', 'super_admin', true,
 (SELECT id FROM organizations WHERE name = 'Default Organization' LIMIT 1),
 ARRAY['users:create', 'users:read', 'users:update', 'users:delete',
       'apps:create', 'apps:read', 'apps:update', 'apps:delete',
       'analytics:read', 'analytics:export', 'analytics:admin',
       'admin:users', 'admin:system', 'admin:billing', 'admin:security']::TEXT[]),

-- Regular User (limited permissions)
('user@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLO92Q.t.9DJmru', 'Regular User', 'user', true,
 (SELECT id FROM organizations WHERE name = 'Default Organization' LIMIT 1),
 ARRAY['users:read', 'apps:read', 'apps:update', 'analytics:read']::TEXT[]),

-- Read-only User (view only)
('readonly@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLO92Q.t.9DJmru', 'Read Only User', 'readonly', true,
 (SELECT id FROM organizations WHERE name = 'Default Organization' LIMIT 1),
 ARRAY['users:read', 'apps:read', 'analytics:read']::TEXT[])

ON CONFLICT (email) DO NOTHING;

-- Step 11: Create test app permissions
-- Give test users access to test app
INSERT INTO user_app_permissions (user_id, app_id, permissions, granted_by)
SELECT
    u.id,
    a.id,
    CASE
        WHEN u.role = 'super_admin' THEN ARRAY['read', 'write', 'admin']::TEXT[]
        WHEN u.role = 'admin' THEN ARRAY['read', 'write']::TEXT[]
        WHEN u.role = 'user' THEN ARRAY['read', 'write']::TEXT[]
        ELSE ARRAY['read']::TEXT[]
    END,
    (SELECT id FROM users WHERE email = 'test@test.com')
FROM users u
CROSS JOIN apps a
WHERE u.email IN ('test@test.com', 'superadmin@test.com', 'user@test.com', 'readonly@test.com')
ON CONFLICT (user_id, app_id) DO NOTHING;

-- Step 12: Log migration completion
INSERT INTO security_audit_log (user_id, action, resource, success, metadata) VALUES (
    (SELECT id FROM users WHERE email = 'test@test.com'),
    'SYSTEM_MIGRATION',
    'RBAC_SECURITY_SETUP',
    true,
    '{"version": "1.0.0", "migration": "rbac-security", "timestamp": "' || CURRENT_TIMESTAMP || '"}'::JSONB
);

-- Step 13: Create view for user permissions (performance optimization)
CREATE OR REPLACE VIEW user_effective_permissions AS
SELECT
    u.id as user_id,
    u.email,
    u.name,
    u.role,
    u.organization_id,
    u.permissions as direct_permissions,
    COALESCE(array_agg(DISTINCT uap.permissions ORDER BY uap.permissions), ARRAY[]::TEXT[][]) as app_permissions,
    COALESCE(array_agg(DISTINCT uap.app_id ORDER BY uap.app_id), ARRAY[]::UUID[]) as accessible_apps
FROM users u
LEFT JOIN user_app_permissions uap ON u.id = uap.user_id
GROUP BY u.id, u.email, u.name, u.role, u.organization_id, u.permissions;

-- Migration completed successfully
SELECT 'RBAC Security Migration completed successfully!' as status,
       COUNT(*) as total_users,
       COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins,
       COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
       COUNT(CASE WHEN role = 'user' THEN 1 END) as users,
       COUNT(CASE WHEN role = 'readonly' THEN 1 END) as readonly_users
FROM users;