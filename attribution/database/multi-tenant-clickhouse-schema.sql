-- Multi-Tenant ClickHouse Schema for UnMoGrowP Attribution Platform
-- Date: 2025-10-22
-- Version: 0.5.0
-- Description: High-performance multi-tenant analytics with tenant isolation

-- =============================================================================
-- MAIN EVENTS TABLE (MULTI-TENANT)
-- =============================================================================

-- Events table for real-time analytics with tenant isolation
CREATE TABLE IF NOT EXISTS events (
    -- Tenant isolation (REQUIRED)
    organization_id String,
    app_id String,

    -- Event identification
    id UUID DEFAULT generateUUIDv4(),
    event_type String,
    event_name String,

    -- User & device identification
    user_id Nullable(String),
    device_id String,
    session_id String,
    anonymous_id Nullable(String),

    -- Attribution data
    campaign_id Nullable(String),
    campaign_name Nullable(String),
    source Nullable(String),
    medium Nullable(String),
    content Nullable(String),
    term Nullable(String),
    creative_id Nullable(String),
    placement_id Nullable(String),

    -- Attribution model data
    first_touch_campaign Nullable(String),
    last_touch_campaign Nullable(String),
    attribution_score Float32 DEFAULT 1.0,

    -- Device & Platform data
    platform String DEFAULT 'unknown',
    device_type Nullable(String),
    device_model Nullable(String),
    device_manufacturer Nullable(String),
    os_name Nullable(String),
    os_version Nullable(String),
    app_version Nullable(String),
    app_build Nullable(String),
    screen_resolution Nullable(String),

    -- Geographic data
    country Nullable(String),
    country_code Nullable(FixedString(2)),
    region Nullable(String),
    city Nullable(String),
    timezone Nullable(String),
    ip_address Nullable(IPv4),
    latitude Nullable(Float32),
    longitude Nullable(Float32),

    -- Event properties
    properties String DEFAULT '{}', -- JSON string
    custom_attributes Map(String, String) DEFAULT map(),

    -- Revenue & conversion
    revenue Nullable(Float64),
    currency Nullable(FixedString(3)),
    revenue_usd Nullable(Float64),

    -- Product data
    product_id Nullable(String),
    product_name Nullable(String),
    product_category Nullable(String),
    quantity Nullable(UInt32),

    -- E-commerce specific
    order_id Nullable(String),
    transaction_id Nullable(String),
    payment_method Nullable(String),

    -- Fraud detection
    risk_score Nullable(Float32),
    fraud_flags Array(String) DEFAULT [],

    -- Attribution timing
    click_timestamp Nullable(DateTime64(3)),
    view_timestamp Nullable(DateTime64(3)),
    install_timestamp Nullable(DateTime64(3)),

    -- Timestamps (critical for analytics)
    event_timestamp DateTime64(3) DEFAULT now64(3),
    server_timestamp DateTime64(3) DEFAULT now64(3),
    processed_timestamp DateTime64(3) DEFAULT now64(3),

    -- Technical metadata
    sdk_version Nullable(String),
    user_agent Nullable(String),
    referrer Nullable(String),
    utm_source Nullable(String),
    utm_medium Nullable(String),
    utm_campaign Nullable(String),
    utm_content Nullable(String),
    utm_term Nullable(String),

    -- Data quality
    data_quality_score Float32 DEFAULT 1.0,
    is_valid Bool DEFAULT true,

    -- Partitioning and performance
    date Date DEFAULT toDate(event_timestamp),
    hour UInt8 DEFAULT toHour(event_timestamp)

) ENGINE = MergeTree()
PARTITION BY (organization_id, toYYYYMM(date))
ORDER BY (organization_id, app_id, event_type, event_timestamp, device_id)
TTL date + INTERVAL 2 YEAR  -- 2 years data retention
SETTINGS index_granularity = 8192;

-- =============================================================================
-- AGGREGATED TABLES FOR PERFORMANCE
-- =============================================================================

-- Hourly aggregated stats per app (multi-tenant)
CREATE TABLE IF NOT EXISTS events_hourly (
    organization_id String,
    app_id String,
    date Date,
    hour UInt8,
    event_type String,

    -- Aggregated metrics
    total_events AggregateFunction(count, UInt8),
    unique_users AggregateFunction(uniq, String),
    unique_devices AggregateFunction(uniq, String),
    unique_sessions AggregateFunction(uniq, String),

    -- Revenue aggregations
    total_revenue AggregateFunction(sum, Float64),
    avg_revenue AggregateFunction(avg, Float64),

    -- Attribution aggregations
    unique_campaigns AggregateFunction(uniq, String),
    top_sources AggregateFunction(groupArray(10), String),

    -- Geographic aggregations
    top_countries AggregateFunction(groupArray(10), String),

    -- Platform aggregations
    platform_breakdown Map(String, UInt64) DEFAULT map()

) ENGINE = AggregatingMergeTree()
PARTITION BY (organization_id, toYYYYMM(date))
ORDER BY (organization_id, app_id, date, hour, event_type);

-- Daily aggregated stats per app (multi-tenant)
CREATE TABLE IF NOT EXISTS events_daily (
    organization_id String,
    app_id String,
    date Date,
    event_type String,

    -- Daily metrics
    total_events UInt64 DEFAULT 0,
    unique_users UInt64 DEFAULT 0,
    unique_devices UInt64 DEFAULT 0,
    unique_sessions UInt64 DEFAULT 0,

    -- Revenue metrics
    total_revenue Float64 DEFAULT 0,
    transactions_count UInt32 DEFAULT 0,
    avg_revenue_per_user Float64 DEFAULT 0,

    -- Retention metrics
    new_users UInt32 DEFAULT 0,
    returning_users UInt32 DEFAULT 0,

    -- Attribution metrics
    organic_installs UInt32 DEFAULT 0,
    paid_installs UInt32 DEFAULT 0,

    -- Platform breakdown
    ios_events UInt64 DEFAULT 0,
    android_events UInt64 DEFAULT 0,
    web_events UInt64 DEFAULT 0,

    -- Geographic breakdown (top 10)
    top_countries Array(Tuple(String, UInt64)) DEFAULT [],

    -- Quality metrics
    avg_data_quality Float32 DEFAULT 1.0,
    invalid_events UInt32 DEFAULT 0

) ENGINE = SummingMergeTree()
PARTITION BY (organization_id, toYYYYMM(date))
ORDER BY (organization_id, app_id, date, event_type);

-- =============================================================================
-- USER SESSIONS & COHORTS (MULTI-TENANT)
-- =============================================================================

-- User sessions tracking with tenant isolation
CREATE TABLE IF NOT EXISTS user_sessions (
    organization_id String,
    app_id String,
    user_id String,
    session_id String,
    device_id String,

    -- Session timing
    session_start DateTime64(3),
    session_end Nullable(DateTime64(3)),
    session_duration_seconds Nullable(UInt32),

    -- Session metrics
    events_count UInt32 DEFAULT 0,
    screens_count UInt32 DEFAULT 0,
    purchases_count UInt32 DEFAULT 0,
    session_revenue Float64 DEFAULT 0,

    -- Attribution for this session
    attribution_source Nullable(String),
    attribution_campaign Nullable(String),
    is_first_session Bool DEFAULT false,

    -- Technical details
    platform String,
    os_version Nullable(String),
    app_version Nullable(String),
    country Nullable(String),

    -- Session quality
    is_valid_session Bool DEFAULT true,
    crash_count UInt8 DEFAULT 0,

    date Date DEFAULT toDate(session_start)

) ENGINE = MergeTree()
PARTITION BY (organization_id, toYYYYMM(date))
ORDER BY (organization_id, app_id, user_id, session_start);

-- User cohorts for retention analysis (multi-tenant)
CREATE TABLE IF NOT EXISTS user_cohorts (
    organization_id String,
    app_id String,
    user_id String,
    device_id String,

    -- Cohort identification
    install_date Date,
    install_week UInt16, -- toYearWeek(install_date)
    install_month UInt16, -- toYYYYMM(install_date)

    -- User classification
    user_type Enum8('organic' = 1, 'paid' = 2, 'social' = 3, 'referral' = 4),
    first_attribution_source Nullable(String),
    first_attribution_campaign Nullable(String),

    -- Lifetime metrics (updated periodically)
    lifetime_events UInt32 DEFAULT 0,
    lifetime_sessions UInt32 DEFAULT 0,
    lifetime_revenue Float64 DEFAULT 0,
    days_active UInt16 DEFAULT 0,
    last_active_date Nullable(Date),

    -- Retention flags (updated daily)
    retained_day_1 Bool DEFAULT false,
    retained_day_7 Bool DEFAULT false,
    retained_day_14 Bool DEFAULT false,
    retained_day_30 Bool DEFAULT false,

    -- Platform & geo
    platform String,
    country Nullable(String),

    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()

) ENGINE = ReplacingMergeTree(updated_at)
PARTITION BY (organization_id, toYYYYMM(install_date))
ORDER BY (organization_id, app_id, user_id);

-- =============================================================================
-- ATTRIBUTION ANALYSIS TABLES
-- =============================================================================

-- Attribution touchpoints for multi-touch attribution
CREATE TABLE IF NOT EXISTS attribution_touchpoints (
    organization_id String,
    app_id String,
    device_id String,
    user_id Nullable(String),

    -- Touchpoint data
    touchpoint_id String,
    touchpoint_type Enum8('click' = 1, 'impression' = 2, 'install' = 3, 'event' = 4),

    -- Campaign data
    campaign_id Nullable(String),
    campaign_name Nullable(String),
    source String,
    medium String,
    content Nullable(String),
    creative_id Nullable(String),

    -- Timing
    touchpoint_timestamp DateTime64(3),
    conversion_timestamp Nullable(DateTime64(3)),
    time_to_conversion_minutes Nullable(UInt32),

    -- Attribution weights (calculated by attribution models)
    first_touch_weight Float32 DEFAULT 0,
    last_touch_weight Float32 DEFAULT 0,
    linear_weight Float32 DEFAULT 0,
    time_decay_weight Float32 DEFAULT 0,
    position_based_weight Float32 DEFAULT 0,

    -- Conversion data
    conversion_event Nullable(String),
    conversion_revenue Nullable(Float64),

    date Date DEFAULT toDate(touchpoint_timestamp)

) ENGINE = MergeTree()
PARTITION BY (organization_id, toYYYYMM(date))
ORDER BY (organization_id, app_id, device_id, touchpoint_timestamp);

-- Campaign performance summary (multi-tenant)
CREATE TABLE IF NOT EXISTS campaign_performance (
    organization_id String,
    app_id String,
    campaign_id String,
    campaign_name String,
    source String,
    medium String,
    date Date,

    -- Traffic metrics
    impressions UInt64 DEFAULT 0,
    clicks UInt64 DEFAULT 0,
    installs UInt64 DEFAULT 0,
    click_through_rate Float32 DEFAULT 0,
    install_conversion_rate Float32 DEFAULT 0,

    -- Revenue metrics
    total_revenue Float64 DEFAULT 0,
    revenue_per_install Float64 DEFAULT 0,
    return_on_ad_spend Float32 DEFAULT 0,

    -- Attribution metrics
    first_touch_conversions UInt32 DEFAULT 0,
    last_touch_conversions UInt32 DEFAULT 0,
    assisted_conversions UInt32 DEFAULT 0,

    -- User quality metrics
    day_1_retention_rate Float32 DEFAULT 0,
    day_7_retention_rate Float32 DEFAULT 0,
    day_30_retention_rate Float32 DEFAULT 0,
    avg_ltv Float64 DEFAULT 0,

    -- Costs (if available)
    ad_spend Float64 DEFAULT 0,
    cost_per_click Float64 DEFAULT 0,
    cost_per_install Float64 DEFAULT 0,

    -- Quality metrics
    fraud_rate Float32 DEFAULT 0,
    data_quality_score Float32 DEFAULT 1.0

) ENGINE = SummingMergeTree()
PARTITION BY (organization_id, toYYYYMM(date))
ORDER BY (organization_id, app_id, campaign_id, date);

-- =============================================================================
-- MATERIALIZED VIEWS FOR REAL-TIME AGGREGATION
-- =============================================================================

-- Real-time hourly aggregation
CREATE MATERIALIZED VIEW IF NOT EXISTS events_hourly_mv TO events_hourly AS
SELECT
    organization_id,
    app_id,
    date,
    hour,
    event_type,

    countState() as total_events,
    uniqState(user_id) as unique_users,
    uniqState(device_id) as unique_devices,
    uniqState(session_id) as unique_sessions,

    sumState(revenue) as total_revenue,
    avgState(revenue) as avg_revenue,

    uniqState(campaign_id) as unique_campaigns,
    groupArrayState(10)(source) as top_sources,
    groupArrayState(10)(country) as top_countries,

    map() as platform_breakdown -- Simplified for now

FROM events
WHERE isNotNull(organization_id) AND isNotNull(app_id)
GROUP BY organization_id, app_id, date, hour, event_type;

-- Real-time daily aggregation
CREATE MATERIALIZED VIEW IF NOT EXISTS events_daily_mv TO events_daily AS
SELECT
    organization_id,
    app_id,
    date,
    event_type,

    count() as total_events,
    uniq(user_id) as unique_users,
    uniq(device_id) as unique_devices,
    uniq(session_id) as unique_sessions,

    sum(revenue) as total_revenue,
    countIf(revenue > 0) as transactions_count,
    avgIf(revenue, revenue > 0) as avg_revenue_per_user,

    -- Platform breakdown
    countIf(platform = 'ios') as ios_events,
    countIf(platform = 'android') as android_events,
    countIf(platform = 'web') as web_events,

    -- Quality metrics
    avg(data_quality_score) as avg_data_quality,
    countIf(is_valid = false) as invalid_events

FROM events
WHERE isNotNull(organization_id) AND isNotNull(app_id)
GROUP BY organization_id, app_id, date, event_type;

-- Session tracking materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS user_sessions_mv TO user_sessions AS
SELECT
    organization_id,
    app_id,
    user_id,
    session_id,
    device_id,

    min(event_timestamp) as session_start,
    max(event_timestamp) as session_end,
    dateDiff('second', min(event_timestamp), max(event_timestamp)) as session_duration_seconds,

    count() as events_count,
    uniq(event_name) as screens_count,
    countIf(event_type = 'purchase') as purchases_count,
    sum(revenue) as session_revenue,

    any(source) as attribution_source,
    any(campaign_name) as attribution_campaign,

    any(platform) as platform,
    any(os_version) as os_version,
    any(app_version) as app_version,
    any(country) as country,

    toDate(min(event_timestamp)) as date

FROM events
WHERE isNotNull(organization_id) AND isNotNull(app_id)
  AND isNotNull(session_id)
GROUP BY organization_id, app_id, user_id, session_id, device_id;

-- =============================================================================
-- INDEXES FOR PERFORMANCE (SPARSE INDEXES)
-- =============================================================================

-- Skip indexes for faster filtering
ALTER TABLE events ADD INDEX idx_event_type event_type TYPE set(100) GRANULARITY 1;
ALTER TABLE events ADD INDEX idx_country country TYPE set(200) GRANULARITY 1;
ALTER TABLE events ADD INDEX idx_platform platform TYPE set(10) GRANULARITY 1;
ALTER TABLE events ADD INDEX idx_source source TYPE set(1000) GRANULARITY 1;
ALTER TABLE events ADD INDEX idx_revenue revenue TYPE minmax GRANULARITY 1;

-- Bloom filters for text searches
ALTER TABLE events ADD INDEX idx_properties properties TYPE tokenbf_v1(32768, 3, 0) GRANULARITY 1;
ALTER TABLE events ADD INDEX idx_user_agent user_agent TYPE tokenbf_v1(32768, 3, 0) GRANULARITY 1;

-- =============================================================================
-- TENANT ISOLATION HELPER FUNCTIONS
-- =============================================================================

-- Function to validate tenant access (to be used in application)
-- This would be implemented in the application layer to ensure
-- all queries include WHERE organization_id = :tenant_id

-- Sample query template for tenant isolation:
-- SELECT * FROM events WHERE organization_id = :organization_id AND app_id = :app_id

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert sample multi-tenant data
INSERT INTO events (
    organization_id, app_id, event_type, event_name,
    user_id, device_id, session_id,
    platform, country, revenue, currency, properties,
    source, medium, campaign_name
) VALUES

-- Demo Organization 1 - App 1
('org_demo_00000000000000000000000001', 'app_demo_001', 'app_open', 'app_launch', 'user_001', 'device_001', 'session_001', 'ios', 'US', NULL, NULL, '{"version":"1.0"}', 'organic', 'organic', NULL),
('org_demo_00000000000000000000000001', 'app_demo_001', 'purchase', 'subscription', 'user_001', 'device_001', 'session_001', 'ios', 'US', 9.99, 'USD', '{"plan":"premium"}', 'organic', 'organic', NULL),
('org_demo_00000000000000000000000001', 'app_demo_001', 'screen_view', 'dashboard', 'user_002', 'device_002', 'session_002', 'android', 'UK', NULL, NULL, '{"screen":"main"}', 'facebook', 'social', 'winter_campaign'),

-- Demo Organization 1 - App 2
('org_demo_00000000000000000000000001', 'app_demo_002', 'install', 'app_install', 'user_003', 'device_003', 'session_003', 'web', 'DE', NULL, NULL, '{"utm_source":"google"}', 'google', 'cpc', 'search_campaign'),
('org_demo_00000000000000000000000001', 'app_demo_002', 'purchase', 'one_time', 'user_003', 'device_003', 'session_003', 'web', 'DE', 19.99, 'EUR', '{"product":"starter_pack"}', 'google', 'cpc', 'search_campaign'),

-- Different organization (tenant isolation test)
('org_other_00000000000000000000000002', 'app_other_001', 'app_open', 'app_launch', 'user_101', 'device_101', 'session_101', 'ios', 'CA', NULL, NULL, '{"version":"2.0"}', 'organic', 'organic', NULL);

-- =============================================================================
-- TENANT ISOLATION VERIFICATION QUERIES
-- =============================================================================

-- Query to verify tenant isolation works
-- (Should only return data for specified organization)

-- Example query for organization 1:
-- SELECT
--     organization_id,
--     app_id,
--     count() as total_events,
--     uniq(user_id) as unique_users,
--     sum(revenue) as total_revenue
-- FROM events
-- WHERE organization_id = 'org_demo_00000000000000000000000001'
-- GROUP BY organization_id, app_id;

-- Verify data separation:
SELECT
    'Data Summary by Organization' as info,
    organization_id,
    count() as total_events,
    uniq(app_id) as unique_apps,
    uniq(user_id) as unique_users,
    sum(revenue) as total_revenue
FROM events
GROUP BY organization_id
ORDER BY organization_id;

-- App-level summary:
SELECT
    'App Performance Summary' as info,
    organization_id,
    app_id,
    count() as events,
    uniq(user_id) as users,
    sum(revenue) as revenue
FROM events
GROUP BY organization_id, app_id
ORDER BY organization_id, app_id;