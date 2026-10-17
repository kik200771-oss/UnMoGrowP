-- Simple ClickHouse Schema for UnMoGrowP Attribution Platform
-- Real-time event analytics (simplified version)
-- Date: 2025-10-21

-- Events table for real-time analytics
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT generateUUIDv4(),
    event_type String,
    app_id String,
    user_id Nullable(String),
    device_id String,
    session_id String,

    -- Attribution data
    campaign_id Nullable(String),
    source Nullable(String),
    medium Nullable(String),

    -- Device & Platform
    platform String DEFAULT 'unknown',
    device_type Nullable(String),
    os_name Nullable(String),

    -- Event properties
    properties String DEFAULT '{}',
    revenue Nullable(Float64),
    currency Nullable(String),

    -- Timestamps
    event_timestamp DateTime64(3) DEFAULT now64(3),
    created_at DateTime DEFAULT now(),

    -- Partitioning
    date Date DEFAULT toDate(event_timestamp)
) ENGINE = MergeTree()
PARTITION BY date
ORDER BY (app_id, event_type, event_timestamp)
TTL created_at + INTERVAL 1 YEAR
SETTINGS index_granularity = 8192;

-- Insert sample data for testing
INSERT INTO events (
    event_type, app_id, user_id, device_id, session_id,
    platform, source, revenue, currency, properties
) VALUES
-- App launch events
('app_open', 'demo-app-1', 'user-001', 'device-001', 'session-001', 'web', 'direct', NULL, NULL, '{"page":"dashboard"}'),
('app_open', 'demo-app-1', 'user-002', 'device-002', 'session-002', 'ios', 'organic', NULL, NULL, '{"version":"1.2.3"}'),
('app_open', 'demo-app-1', 'user-003', 'device-003', 'session-003', 'android', 'facebook', NULL, NULL, '{"campaign":"social"}'),
('app_open', 'demo-app-1', 'user-004', 'device-004', 'session-004', 'ios', 'google_ads', NULL, NULL, '{"keyword":"app"}'),
('app_open', 'demo-app-1', 'user-005', 'device-005', 'session-005', 'web', 'twitter', NULL, NULL, '{"referrer":"social"}'),

-- Purchase events (revenue data)
('purchase', 'demo-app-1', 'user-001', 'device-001', 'session-001', 'web', 'direct', 29.99, 'USD', '{"product":"premium"}'),
('purchase', 'demo-app-1', 'user-002', 'device-002', 'session-002', 'ios', 'organic', 19.99, 'USD', '{"product":"basic"}'),
('purchase', 'demo-app-1', 'user-004', 'device-004', 'session-004', 'ios', 'google_ads', 49.99, 'USD', '{"product":"enterprise"}'),
('purchase', 'demo-app-1', 'user-003', 'device-003', 'session-003', 'android', 'facebook', 9.99, 'USD', '{"product":"starter"}'),

-- Screen view events
('screen_view', 'demo-app-1', 'user-001', 'device-001', 'session-001', 'web', 'direct', NULL, NULL, '{"screen":"dashboard"}'),
('screen_view', 'demo-app-1', 'user-002', 'device-002', 'session-002', 'ios', 'organic', NULL, NULL, '{"screen":"profile"}'),
('screen_view', 'demo-app-1', 'user-003', 'device-003', 'session-003', 'android', 'facebook', NULL, NULL, '{"screen":"settings"}'),

-- Click events
('click', 'demo-app-1', 'user-001', 'device-001', 'session-001', 'web', 'direct', NULL, NULL, '{"button":"subscribe"}'),
('click', 'demo-app-1', 'user-002', 'device-002', 'session-002', 'ios', 'organic', NULL, NULL, '{"button":"share"}'),

-- Install events
('install', 'demo-app-1', 'user-006', 'device-006', 'session-006', 'android', 'google_play', NULL, NULL, '{"version":"1.2.3"}'),
('install', 'demo-app-1', 'user-007', 'device-007', 'session-007', 'ios', 'app_store', NULL, NULL, '{"version":"1.2.3"}'),

-- Demo app 2 events
('install', 'demo-app-2', 'user-008', 'device-008', 'session-008', 'web', 'organic', NULL, NULL, '{}'),
('app_open', 'demo-app-2', 'user-008', 'device-008', 'session-008', 'web', 'organic', NULL, NULL, '{}'),
('purchase', 'demo-app-2', 'user-008', 'device-008', 'session-008', 'web', 'organic', 99.99, 'USD', '{"product":"premium"}'),

-- Additional events for better statistics
('app_open', 'demo-app-1', 'user-009', 'device-009', 'session-009', 'android', 'youtube', NULL, NULL, '{}'),
('app_open', 'demo-app-1', 'user-010', 'device-010', 'session-010', 'ios', 'instagram', NULL, NULL, '{}'),
('purchase', 'demo-app-1', 'user-009', 'device-009', 'session-009', 'android', 'youtube', 15.99, 'USD', '{"product":"monthly"}'),
('purchase', 'demo-app-1', 'user-010', 'device-010', 'session-010', 'ios', 'instagram', 159.99, 'USD', '{"product":"yearly"}');