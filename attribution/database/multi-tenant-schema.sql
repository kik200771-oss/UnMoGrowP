-- UnMoGrowP Attribution Platform - Multi-Tenant Database Schema
-- Date: 2025-10-22
-- Version: 0.5.0
-- Description: Hybrid multi-tenant/single-tenant architecture with tenant isolation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TENANTS & ORGANIZATIONS
-- =============================================================================

-- Organizations table (top-level tenant isolation)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    plan_type VARCHAR(50) DEFAULT 'starter' CHECK (plan_type IN ('starter', 'pro', 'enterprise', 'dedicated')),
    max_apps INTEGER DEFAULT 3,
    max_events_per_month BIGINT DEFAULT 1000000,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'canceled')),

    -- Multi-tenant settings
    tenant_type VARCHAR(50) DEFAULT 'multi' CHECK (tenant_type IN ('multi', 'single', 'dedicated')),
    database_name VARCHAR(255), -- For single-tenant deployments

    -- Billing & limits
    billing_email VARCHAR(255),
    subscription_id VARCHAR(255),
    current_month_events BIGINT DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- USERS (TENANT-AWARE)
-- =============================================================================

-- Users table with tenant isolation
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- User data
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('owner', 'admin', 'user', 'viewer')),
    permissions JSONB DEFAULT '{}',

    -- Status & verification
    email_verified BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,

    -- Unique constraint for email per organization
    UNIQUE(organization_id, email)
);

-- Global email uniqueness (for cross-tenant user management)
CREATE UNIQUE INDEX idx_users_email_global ON users(email) WHERE status = 'active';

-- =============================================================================
-- APPS (TENANT-ISOLATED)
-- =============================================================================

-- Apps table with tenant isolation
CREATE TABLE apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- App data
    name VARCHAR(255) NOT NULL,
    bundle_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('ios', 'android', 'web', 'unity')),

    -- API keys and authentication
    api_key VARCHAR(255) UNIQUE NOT NULL DEFAULT ('pk_' || encode(gen_random_bytes(32), 'hex')),
    api_secret VARCHAR(255) NOT NULL DEFAULT ('sk_' || encode(gen_random_bytes(32), 'hex')),
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255) DEFAULT encode(gen_random_bytes(16), 'hex'),

    -- Configuration
    settings JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),

    -- Attribution settings
    attribution_window_hours INTEGER DEFAULT 168, -- 7 days
    view_through_window_hours INTEGER DEFAULT 24, -- 1 day

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint for bundle_id per organization
    UNIQUE(organization_id, bundle_id)
);

-- =============================================================================
-- AUTHENTICATION & SESSIONS
-- =============================================================================

-- API Keys table with tenant isolation
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    app_id UUID REFERENCES apps(id) ON DELETE CASCADE,

    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '{}',
    scopes TEXT[] DEFAULT ARRAY['read', 'write'],

    -- Rate limiting
    rate_limit_per_hour INTEGER DEFAULT 10000,
    current_hour_usage INTEGER DEFAULT 0,
    rate_limit_window TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Sessions table with tenant isolation
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    user_agent TEXT,
    ip_address INET,

    -- Session metadata
    app_ids UUID[], -- Which apps this session has access to
    permissions JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password Reset Tokens with tenant isolation
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- EVENTS & ANALYTICS (TENANT-ISOLATED)
-- =============================================================================

-- Events aggregation table for PostgreSQL (fast queries)
CREATE TABLE event_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    app_id UUID REFERENCES apps(id) ON DELETE CASCADE,

    -- Date and event type
    date DATE NOT NULL,
    event_type VARCHAR(100) NOT NULL,

    -- Aggregated metrics
    total_events BIGINT DEFAULT 0,
    unique_users BIGINT DEFAULT 0,
    unique_devices BIGINT DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,

    -- Platform breakdown
    ios_events BIGINT DEFAULT 0,
    android_events BIGINT DEFAULT 0,
    web_events BIGINT DEFAULT 0,

    -- Geography (top 5 countries)
    country_breakdown JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint for daily summaries
    UNIQUE(organization_id, app_id, date, event_type)
);

-- Attribution data table
CREATE TABLE attributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    app_id UUID REFERENCES apps(id) ON DELETE CASCADE,

    -- User & device
    user_id VARCHAR(255),
    device_id VARCHAR(255) NOT NULL,

    -- Attribution source
    campaign_id VARCHAR(255),
    source VARCHAR(100),
    medium VARCHAR(100),
    content VARCHAR(255),
    term VARCHAR(255),

    -- Attribution timing
    click_time TIMESTAMP,
    install_time TIMESTAMP NOT NULL,
    first_event_time TIMESTAMP,

    -- Attribution model results
    first_touch_attribution DECIMAL(5,4) DEFAULT 1.0,
    last_touch_attribution DECIMAL(5,4) DEFAULT 1.0,
    linear_attribution DECIMAL(5,4) DEFAULT 1.0,
    time_decay_attribution DECIMAL(5,4) DEFAULT 1.0,

    -- Revenue attribution
    attributed_revenue DECIMAL(15,2) DEFAULT 0,
    ltv_estimate DECIMAL(15,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint per device per app
    UNIQUE(organization_id, app_id, device_id)
);

-- =============================================================================
-- BILLING & USAGE TRACKING
-- =============================================================================

-- Usage tracking table
CREATE TABLE usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Period
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    day INTEGER,

    -- Metrics
    api_requests BIGINT DEFAULT 0,
    events_processed BIGINT DEFAULT 0,
    data_export_bytes BIGINT DEFAULT 0,

    -- Costs (for billing)
    overage_events BIGINT DEFAULT 0,
    overage_cost DECIMAL(10,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint per period
    UNIQUE(organization_id, year, month, COALESCE(day, 0))
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Organizations
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_plan_type ON organizations(plan_type);

-- Users
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Apps
CREATE INDEX idx_apps_organization_id ON apps(organization_id);
CREATE INDEX idx_apps_user_id ON apps(user_id);
CREATE INDEX idx_apps_api_key ON apps(api_key);
CREATE INDEX idx_apps_bundle_id ON apps(bundle_id);

-- API Keys
CREATE INDEX idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX idx_api_keys_app_id ON api_keys(app_id);
CREATE INDEX idx_api_keys_key ON api_keys(api_key);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- Sessions
CREATE INDEX idx_sessions_organization_id ON user_sessions(organization_id);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- Password reset tokens
CREATE INDEX idx_password_reset_organization_id ON password_reset_tokens(organization_id);
CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_expires_at ON password_reset_tokens(expires_at);

-- Event summaries
CREATE INDEX idx_event_summaries_organization_id ON event_summaries(organization_id);
CREATE INDEX idx_event_summaries_app_id ON event_summaries(app_id);
CREATE INDEX idx_event_summaries_date ON event_summaries(date);
CREATE INDEX idx_event_summaries_event_type ON event_summaries(event_type);

-- Attributions
CREATE INDEX idx_attributions_organization_id ON attributions(organization_id);
CREATE INDEX idx_attributions_app_id ON attributions(app_id);
CREATE INDEX idx_attributions_device_id ON attributions(device_id);
CREATE INDEX idx_attributions_source ON attributions(source);
CREATE INDEX idx_attributions_install_time ON attributions(install_time);

-- Usage metrics
CREATE INDEX idx_usage_metrics_organization_id ON usage_metrics(organization_id);
CREATE INDEX idx_usage_metrics_period ON usage_metrics(year, month);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apps_updated_at
    BEFORE UPDATE ON apps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_summaries_updated_at
    BEFORE UPDATE ON event_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_metrics_updated_at
    BEFORE UPDATE ON usage_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Usage tracking trigger for API requests
CREATE OR REPLACE FUNCTION update_organization_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current month events counter
    UPDATE organizations
    SET current_month_events = current_month_events + 1,
        last_active_at = CURRENT_TIMESTAMP
    WHERE id = NEW.organization_id;

    -- Update usage metrics
    INSERT INTO usage_metrics (organization_id, year, month, api_requests)
    VALUES (NEW.organization_id, EXTRACT(YEAR FROM CURRENT_TIMESTAMP), EXTRACT(MONTH FROM CURRENT_TIMESTAMP), 1)
    ON CONFLICT (organization_id, year, month, COALESCE(day, 0))
    DO UPDATE SET api_requests = usage_metrics.api_requests + 1;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tenant-aware tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
-- Note: In application, set current_setting('app.current_organization_id')

-- Organizations policy
CREATE POLICY organization_isolation ON organizations
    FOR ALL USING (id = current_setting('app.current_organization_id')::UUID);

-- Users policy
CREATE POLICY user_tenant_isolation ON users
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Apps policy
CREATE POLICY app_tenant_isolation ON apps
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- API Keys policy
CREATE POLICY api_key_tenant_isolation ON api_keys
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Sessions policy
CREATE POLICY session_tenant_isolation ON user_sessions
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Password reset tokens policy
CREATE POLICY password_reset_tenant_isolation ON password_reset_tokens
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Event summaries policy
CREATE POLICY event_summary_tenant_isolation ON event_summaries
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Attributions policy
CREATE POLICY attribution_tenant_isolation ON attributions
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Usage metrics policy
CREATE POLICY usage_metrics_tenant_isolation ON usage_metrics
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Create test organization
INSERT INTO organizations (id, name, domain, plan_type, max_apps, tenant_type) VALUES (
    'org_demo_00000000000000000000000001',
    'Demo Organization',
    'demo.unmogrowp.com',
    'pro',
    10,
    'multi'
);

-- Create test user
INSERT INTO users (organization_id, email, password_hash, name, role, email_verified) VALUES (
    'org_demo_00000000000000000000000001',
    'demo@unmogrowp.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewLO92Q.t.9DJmru', -- "password123"
    'Demo User',
    'owner',
    true
);

-- Create test app
INSERT INTO apps (organization_id, user_id, name, bundle_id, platform) VALUES (
    'org_demo_00000000000000000000000001',
    (SELECT id FROM users WHERE email = 'demo@unmogrowp.com'),
    'Demo Mobile App',
    'com.unmogrowp.demo',
    'android'
);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Organization summary view
CREATE VIEW organization_summary AS
SELECT
    o.id,
    o.name,
    o.plan_type,
    o.current_month_events,
    o.max_events_per_month,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT a.id) as total_apps,
    COUNT(DISTINCT CASE WHEN a.status = 'active' THEN a.id END) as active_apps,
    o.created_at,
    o.last_active_at
FROM organizations o
LEFT JOIN users u ON o.id = u.organization_id
LEFT JOIN apps a ON o.id = a.organization_id
GROUP BY o.id, o.name, o.plan_type, o.current_month_events, o.max_events_per_month, o.created_at, o.last_active_at;

-- App performance view
CREATE VIEW app_performance AS
SELECT
    a.id,
    a.organization_id,
    a.name,
    a.platform,
    a.status,
    COALESCE(SUM(es.total_events), 0) as total_events_30d,
    COALESCE(SUM(es.unique_users), 0) as total_users_30d,
    COALESCE(SUM(es.total_revenue), 0) as total_revenue_30d,
    COUNT(DISTINCT es.date) as active_days_30d
FROM apps a
LEFT JOIN event_summaries es ON a.id = es.app_id
    AND es.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY a.id, a.organization_id, a.name, a.platform, a.status;

-- Display created tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%'
    AND table_name NOT LIKE 'sql_%'
ORDER BY table_name;