-- ClickHouse Schema for UnMoGrowP Attribution Platform
-- Real-time event analytics and attribution
-- Date: 2025-10-21

-- Events table for real-time analytics (optimized for 100M+ events/day)
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
    content Nullable(String),
    term Nullable(String),

    -- Device & Platform
    platform String DEFAULT 'unknown',
    device_type Nullable(String),
    os_name Nullable(String),
    os_version Nullable(String),
    app_version Nullable(String),

    -- Geographic data
    country Nullable(String),
    region Nullable(String),
    city Nullable(String),
    ip_address Nullable(IPv4),

    -- Event properties
    properties String DEFAULT '{}', -- JSON string
    revenue Nullable(Float64),
    currency Nullable(String),

    -- Timestamps (critical for analytics)
    event_timestamp DateTime64(3) DEFAULT now64(3),
    server_timestamp DateTime64(3) DEFAULT now64(3),
    created_at DateTime DEFAULT now(),

    -- Partitioning and indexing
    date Date DEFAULT toDate(event_timestamp)
) ENGINE = MergeTree()
PARTITION BY date
ORDER BY (app_id, event_type, event_timestamp)
TTL created_at + INTERVAL 2 YEAR  -- 2 years data retention
SETTINGS index_granularity = 8192;

-- Users aggregation table (materialized view for performance)
CREATE TABLE IF NOT EXISTS users_daily (
    app_id String,
    date Date,
    unique_users AggregateFunction(uniq, String),
    total_events SimpleAggregateFunction(sum, UInt64),
    total_revenue SimpleAggregateFunction(sum, Float64),
    new_users AggregateFunction(uniq, String)
) ENGINE = AggregatingMergeTree()
PARTITION BY date
ORDER BY (app_id, date);

-- Materialized view to populate users_daily
CREATE MATERIALIZED VIEW IF NOT EXISTS users_daily_mv TO users_daily AS
SELECT
    app_id,
    date,
    uniqState(user_id) as unique_users,
    count() as total_events,
    sum(revenue) as total_revenue,
    -- Simplified new users logic (can be enhanced)
    uniqState(user_id) as new_users
FROM events
WHERE user_id IS NOT NULL
GROUP BY app_id, date;

-- Insert sample data for testing
INSERT INTO events (
    event_type, app_id, user_id, device_id, session_id,
    platform, country, revenue, currency, properties
) VALUES
-- App launch events
('app_open', 'demo-app-1', 'user-001', 'device-001', 'session-001', 'web', 'US', NULL, NULL, '{"source":"direct"}'),
('app_open', 'demo-app-1', 'user-002', 'device-002', 'session-002', 'ios', 'UK', NULL, NULL, '{"source":"organic"}'),
('app_open', 'demo-app-1', 'user-003', 'device-003', 'session-003', 'android', 'DE', NULL, NULL, '{"source":"facebook"}'),

-- Purchase events
('purchase', 'demo-app-1', 'user-001', 'device-001', 'session-001', 'web', 'US', 29.99, 'USD', '{"product":"premium_plan"}'),
('purchase', 'demo-app-1', 'user-002', 'device-002', 'session-002', 'ios', 'UK', 19.99, 'GBP', '{"product":"basic_plan"}'),

-- Engagement events
('screen_view', 'demo-app-1', 'user-001', 'device-001', 'session-001', 'web', 'US', NULL, NULL, '{"screen":"dashboard"}'),
('screen_view', 'demo-app-1', 'user-002', 'device-002', 'session-002', 'ios', 'UK', NULL, NULL, '{"screen":"profile"}'),
('click', 'demo-app-1', 'user-003', 'device-003', 'session-003', 'android', 'DE', NULL, NULL, '{"button":"subscribe"}'),

-- Attribution events
('install', 'demo-app-1', 'user-004', 'device-004', 'session-004', 'ios', 'FR', NULL, NULL, '{"source":"google_ads", "campaign":"winter_2024"}'),
('install', 'demo-app-1', 'user-005', 'device-005', 'session-005', 'android', 'CA', NULL, NULL, '{"source":"facebook", "campaign":"social_growth"}'),

-- More sample data for better analytics
('app_open', 'demo-app-1', 'user-004', 'device-004', 'session-004', 'ios', 'FR', NULL, NULL, '{}'),
('app_open', 'demo-app-1', 'user-005', 'device-005', 'session-005', 'android', 'CA', NULL, NULL, '{}'),
('purchase', 'demo-app-1', 'user-004', 'device-004', 'session-004', 'ios', 'FR', 49.99, 'EUR', '{"product":"enterprise_plan"}'),

-- Demo app 2 data
('install', 'demo-app-2', 'user-006', 'device-006', 'session-006', 'web', 'JP', NULL, NULL, '{"source":"organic"}'),
('app_open', 'demo-app-2', 'user-006', 'device-006', 'session-006', 'web', 'JP', NULL, NULL, '{}'),
('purchase', 'demo-app-2', 'user-006', 'device-006', 'session-006', 'web', 'JP', 9.99, 'JPY', '{"product":"starter_pack"}');

-- Create indexes for better query performance
-- Note: ClickHouse uses sparse indexes, so we don't create many secondary indexes

-- Verify data insertion
SELECT
    'Sample data summary:' as info,
    count() as total_events,
    uniq(user_id) as unique_users,
    uniq(app_id) as unique_apps,
    sum(revenue) as total_revenue
FROM events;

-- Show events by type
SELECT
    event_type,
    count() as event_count,
    uniq(user_id) as unique_users
FROM events
GROUP BY event_type
ORDER BY event_count DESC;

-- Show revenue by app
SELECT
    app_id,
    sum(revenue) as total_revenue,
    count(*) as total_events
FROM events
WHERE revenue > 0
GROUP BY app_id
ORDER BY total_revenue DESC;