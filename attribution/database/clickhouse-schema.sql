-- ============================================================================
-- ClickHouse Schema for UnMoGrowP Attribution Platform
-- Optimized for 10M+ events/sec ingestion and analytics
-- Updated: 2025-10-22
-- ============================================================================

-- Create database
CREATE DATABASE IF NOT EXISTS attribution;
USE attribution;

-- ============================================================================
-- MAIN EVENTS TABLE - Optimized for high-throughput ingestion
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
    -- Event identification
    event_id String,
    app_id String,
    user_id String,
    session_id String,

    -- Event metadata
    event_type LowCardinality(String), -- install, click, impression, conversion
    timestamp DateTime64(3, 'UTC'),
    server_timestamp DateTime64(3, 'UTC') DEFAULT now(),

    -- Device & Platform information
    device_id String,
    idfa String,
    gaid String,
    platform LowCardinality(String), -- ios, android, web
    os_version String,
    app_version String,

    -- Geographic & Context
    country FixedString(2),
    region String,
    city String,
    language FixedString(2),
    timezone String,
    user_agent String,
    ip_address IPv4,

    -- Attribution fields
    campaign_id String,
    ad_group_id String,
    creative_id String,
    network_id LowCardinality(String),
    channel LowCardinality(String),
    source String,
    medium String,

    -- Revenue & monetization
    revenue Decimal64(4),
    currency FixedString(3),

    -- Custom parameters (JSON for flexibility)
    custom_params String,

    -- Technical metadata
    sdk_version String,
    api_version UInt8 DEFAULT 1,
    processing_time DateTime64(3, 'UTC') DEFAULT now()

) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (app_id, platform, event_type, timestamp, user_id)
SAMPLE BY cityHash64(user_id)
SETTINGS index_granularity = 8192;

-- ============================================================================
-- ATTRIBUTION RESULTS TABLE - Calculated attribution data
-- ============================================================================

CREATE TABLE IF NOT EXISTS attribution_results (
    -- Attribution identification
    attribution_id String,
    user_id String,
    session_id String,
    app_id String,

    -- Attribution metadata
    model_type LowCardinality(String), -- first_touch, last_touch, linear, etc.
    calculated_at DateTime64(3, 'UTC'),
    journey_start DateTime64(3, 'UTC'),
    journey_end DateTime64(3, 'UTC'),
    journey_length UInt16,
    time_to_convert UInt32, -- seconds

    -- Attribution results (JSON for flexibility)
    attribution_data String, -- JSON with touchpoint credits

    -- Revenue attribution
    total_revenue Decimal64(4),
    currency FixedString(3),

    -- Quality metrics
    confidence_score Float32,
    data_quality_score Float32

) ENGINE = MergeTree()
PARTITION BY toYYYYMM(calculated_at)
ORDER BY (app_id, model_type, calculated_at, user_id)
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