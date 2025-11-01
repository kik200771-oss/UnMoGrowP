-- Attribution Event Processing Schema
-- UnMoGrowP Attribution Platform - High-Performance Event Processing
-- Designed for 100M+ events/day with real-time attribution

-- =============================================================================
-- EVENT INGESTION TABLE (OPTIMIZED FOR HIGH-THROUGHPUT)
-- =============================================================================

CREATE TABLE IF NOT EXISTS raw_events (
    -- Tenant isolation (REQUIRED for multi-tenant)
    organization_id String,
    app_id String,

    -- Event core data
    event_id UUID DEFAULT generateUUIDv4(),
    event_type LowCardinality(String),
    event_name String,
    event_timestamp DateTime64(3),
    server_timestamp DateTime64(3) DEFAULT now64(3),

    -- User identification (critical for attribution)
    user_id Nullable(String),
    device_id String,
    session_id String,
    anonymous_id Nullable(String),

    -- Attribution source data (raw UTM/campaign data)
    utm_source Nullable(String),
    utm_medium Nullable(String),
    utm_campaign Nullable(String),
    utm_content Nullable(String),
    utm_term Nullable(String),

    -- Additional campaign tracking
    campaign_id Nullable(String),
    creative_id Nullable(String),
    placement_id Nullable(String),
    click_id Nullable(String),

    -- Device/Platform context
    platform LowCardinality(String) DEFAULT 'unknown',
    os_name LowCardinality(String),
    os_version String,
    app_version String,
    device_model String,

    -- Geographic context (for geo-attribution)
    ip_address IPv4,
    country LowCardinality(FixedString(2)),
    region String,
    city String,

    -- Event-specific data
    revenue Nullable(Float64),
    currency Nullable(FixedString(3)),
    product_id Nullable(String),
    quantity Nullable(UInt16),

    -- Custom properties as JSON
    properties String DEFAULT '{}',

    -- Data quality and fraud detection
    is_valid Bool DEFAULT true,
    fraud_score Nullable(Float32),
    data_quality_score Float32 DEFAULT 1.0,

    -- Performance optimizations
    date Date DEFAULT toDate(event_timestamp),
    hour UInt8 DEFAULT toHour(event_timestamp)

) ENGINE = MergeTree()
PARTITION BY (organization_id, toYYYYMM(date))
ORDER BY (organization_id, app_id, event_timestamp, device_id)
TTL date + INTERVAL 1 YEAR  -- 1 year for raw events
SETTINGS index_granularity = 8192,
         min_merge_bytes_to_use_direct_io = 10737418240,
         max_merge_bytes_to_use_direct_io = 107374182400;

-- =============================================================================
-- PROCESSED EVENTS WITH ATTRIBUTION (POST-PROCESSING)
-- =============================================================================

CREATE TABLE IF NOT EXISTS processed_events (
    -- Copy from raw events
    organization_id String,
    app_id String,
    event_id UUID,
    event_type LowCardinality(String),
    event_name String,
    event_timestamp DateTime64(3),
    user_id Nullable(String),
    device_id String,
    session_id String,

    -- Enhanced attribution data (calculated by attribution engine)
    attribution_model_used LowCardinality(String), -- 'first_touch', 'last_touch', etc.
    attribution_source Nullable(String),
    attribution_medium Nullable(String),
    attribution_campaign Nullable(String),
    attribution_touchpoint_count UInt8 DEFAULT 0,

    -- Time-based attribution context
    first_touch_timestamp Nullable(DateTime64(3)),
    last_touch_timestamp Nullable(DateTime64(3)),
    time_to_conversion_minutes Nullable(UInt32),

    -- Attribution weights (from attribution engine)
    first_touch_weight Float32 DEFAULT 0,
    last_touch_weight Float32 DEFAULT 0,
    linear_weight Float32 DEFAULT 0,
    time_decay_weight Float32 DEFAULT 0,
    position_based_weight Float32 DEFAULT 0,

    -- Revenue attribution (calculated)
    attributed_revenue_first_touch Float64 DEFAULT 0,
    attributed_revenue_last_touch Float64 DEFAULT 0,
    attributed_revenue_linear Float64 DEFAULT 0,
    attributed_revenue_time_decay Float64 DEFAULT 0,
    attributed_revenue_position_based Float64 DEFAULT 0,

    -- Original event context
    platform LowCardinality(String),
    country LowCardinality(FixedString(2)),
    revenue Nullable(Float64),
    currency Nullable(FixedString(3)),

    -- Processing metadata
    processed_timestamp DateTime64(3) DEFAULT now64(3),
    attribution_engine_version String DEFAULT '1.0.0',

    date Date DEFAULT toDate(event_timestamp)

) ENGINE = ReplacingMergeTree(processed_timestamp)
PARTITION BY (organization_id, toYYYYMM(date))
ORDER BY (organization_id, app_id, event_id, attribution_model_used)
TTL date + INTERVAL 2 YEAR;

-- =============================================================================
-- CONVERSION FUNNEL TRACKING
-- =============================================================================

CREATE TABLE IF NOT EXISTS conversion_funnels (
    organization_id String,
    app_id String,

    -- Funnel identification
    funnel_id String,
    funnel_name String,
    step_number UInt8,
    step_name String,

    -- User context
    user_id String,
    device_id String,
    session_id String,

    -- Funnel progression
    step_timestamp DateTime64(3),
    completed Bool DEFAULT false,
    dropped_out Bool DEFAULT false,

    -- Attribution context at this step
    current_attribution_source Nullable(String),
    current_attribution_campaign Nullable(String),

    -- Funnel metrics
    time_on_step_seconds Nullable(UInt32),
    next_step_timestamp Nullable(DateTime64(3)),

    date Date DEFAULT toDate(step_timestamp)

) ENGINE = MergeTree()
PARTITION BY (organization_id, toYYYYMM(date))
ORDER BY (organization_id, app_id, funnel_id, user_id, step_number, step_timestamp);

-- =============================================================================
-- USER JOURNEY TRACKING (ATTRIBUTION TOUCHPOINTS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_journey_touchpoints (
    organization_id String,
    app_id String,
    user_id String,
    device_id String,

    -- Touchpoint details
    touchpoint_id UUID DEFAULT generateUUIDv4(),
    touchpoint_type Enum8('impression' = 1, 'click' = 2, 'install' = 3, 'event' = 4, 'conversion' = 5),
    touchpoint_timestamp DateTime64(3),

    -- Campaign context
    campaign_id Nullable(String),
    campaign_name Nullable(String),
    source String,
    medium String,
    content Nullable(String),
    creative_id Nullable(String),

    -- Attribution window tracking
    is_within_attribution_window Bool DEFAULT true,
    attribution_window_days UInt8 DEFAULT 7,

    -- Journey position
    journey_position UInt16 DEFAULT 1, -- 1st, 2nd, 3rd touchpoint in journey
    is_first_touchpoint Bool DEFAULT false,
    is_last_touchpoint Bool DEFAULT false,

    -- Conversion context (if this leads to conversion)
    leads_to_conversion Bool DEFAULT false,
    conversion_event_id Nullable(UUID),
    conversion_timestamp Nullable(DateTime64(3)),
    conversion_revenue Nullable(Float64),

    -- Attribution calculations (filled by attribution engine)
    attribution_weight_first_touch Float32 DEFAULT 0,
    attribution_weight_last_touch Float32 DEFAULT 0,
    attribution_weight_linear Float32 DEFAULT 0,
    attribution_weight_time_decay Float32 DEFAULT 0,
    attribution_weight_position_based Float32 DEFAULT 0,

    date Date DEFAULT toDate(touchpoint_timestamp)

) ENGINE = MergeTree()
PARTITION BY (organization_id, toYYYYMM(date))
ORDER BY (organization_id, app_id, user_id, touchpoint_timestamp);

-- =============================================================================
-- REAL-TIME ATTRIBUTION PROCESSING VIEWS
-- =============================================================================

-- View for getting active user journeys (within attribution window)
CREATE VIEW active_user_journeys AS
SELECT
    organization_id,
    app_id,
    user_id,
    device_id,
    groupArray(tuple(touchpoint_timestamp, source, medium, campaign_name, creative_id)) as touchpoint_sequence,
    count() as touchpoint_count,
    min(touchpoint_timestamp) as first_touchpoint_time,
    max(touchpoint_timestamp) as last_touchpoint_time,
    dateDiff('hour', min(touchpoint_timestamp), max(touchpoint_timestamp)) as journey_duration_hours,
    any(is_within_attribution_window) as within_window
FROM user_journey_touchpoints
WHERE touchpoint_timestamp >= now() - INTERVAL 7 DAY
  AND is_within_attribution_window = true
GROUP BY organization_id, app_id, user_id, device_id
HAVING touchpoint_count > 0;

-- View for conversion events that need attribution processing
CREATE VIEW pending_attribution_events AS
SELECT
    organization_id,
    app_id,
    event_id,
    user_id,
    device_id,
    event_type,
    event_timestamp,
    revenue,
    currency
FROM raw_events
WHERE event_type IN ('purchase', 'subscription', 'conversion', 'install')
  AND event_timestamp >= now() - INTERVAL 1 HOUR
  AND is_valid = true
ORDER BY event_timestamp DESC;

-- =============================================================================
-- ATTRIBUTION PROCESSING FUNCTIONS (UDFs)
-- =============================================================================

-- Function to calculate time decay weight
-- This would be implemented in attribution engine, but here's the SQL version
CREATE OR REPLACE FUNCTION calculateTimeDecayWeight(
    touchpoint_time DateTime64(3),
    conversion_time DateTime64(3),
    half_life_hours Float32
)
AS (
    pow(0.5, dateDiff('hour', touchpoint_time, conversion_time) / half_life_hours)
);

-- Function to get attribution window for app
CREATE OR REPLACE FUNCTION getAttributionWindow(app_id String)
AS (
    CASE app_id
        WHEN 'mobile_app' THEN 7
        WHEN 'web_app' THEN 30
        ELSE 7
    END
);

-- =============================================================================
-- HIGH-PERFORMANCE AGGREGATION TABLES
-- =============================================================================

-- Attribution summary by day and model
CREATE TABLE IF NOT EXISTS attribution_daily_summary (
    organization_id String,
    app_id String,
    date Date,
    attribution_model LowCardinality(String), -- first_touch, last_touch, etc.

    -- Campaign breakdown
    campaign_id String,
    campaign_name String,
    source String,
    medium String,

    -- Metrics
    total_conversions UInt32 DEFAULT 0,
    total_revenue Float64 DEFAULT 0,
    attributed_conversions Float32 DEFAULT 0,
    attributed_revenue Float64 DEFAULT 0,

    -- Quality metrics
    avg_touchpoints_per_conversion Float32 DEFAULT 0,
    avg_time_to_conversion_hours Float32 DEFAULT 0,

    -- Platform breakdown
    ios_conversions UInt32 DEFAULT 0,
    android_conversions UInt32 DEFAULT 0,
    web_conversions UInt32 DEFAULT 0

) ENGINE = SummingMergeTree()
PARTITION BY (organization_id, toYYYYMM(date))
ORDER BY (organization_id, app_id, date, attribution_model, campaign_id);

-- Real-time attribution summary materialized view
CREATE MATERIALIZED VIEW attribution_daily_summary_mv TO attribution_daily_summary AS
SELECT
    organization_id,
    app_id,
    date,
    attribution_model_used as attribution_model,

    coalesce(attribution_campaign, 'direct') as campaign_id,
    coalesce(attribution_campaign, 'Direct') as campaign_name,
    coalesce(attribution_source, 'direct') as source,
    coalesce(attribution_medium, 'none') as medium,

    countIf(event_type IN ('purchase', 'conversion')) as total_conversions,
    sum(revenue) as total_revenue,
    sum(linear_weight) as attributed_conversions, -- Using linear as example
    sum(attributed_revenue_linear) as attributed_revenue,

    0 as avg_touchpoints_per_conversion, -- Calculated separately
    0 as avg_time_to_conversion_hours,   -- Calculated separately

    countIf(platform = 'ios' AND event_type IN ('purchase', 'conversion')) as ios_conversions,
    countIf(platform = 'android' AND event_type IN ('purchase', 'conversion')) as android_conversions,
    countIf(platform = 'web' AND event_type IN ('purchase', 'conversion')) as web_conversions

FROM processed_events
WHERE isNotNull(organization_id)
  AND isNotNull(app_id)
  AND attribution_model_used != ''
GROUP BY
    organization_id,
    app_id,
    date,
    attribution_model_used,
    attribution_campaign,
    attribution_source,
    attribution_medium;

-- =============================================================================
-- INDEXES FOR ATTRIBUTION PERFORMANCE
-- =============================================================================

-- Indexes for raw events (high-throughput ingestion)
ALTER TABLE raw_events ADD INDEX idx_event_type event_type TYPE set(50) GRANULARITY 1;
ALTER TABLE raw_events ADD INDEX idx_utm_source utm_source TYPE set(1000) GRANULARITY 1;
ALTER TABLE raw_events ADD INDEX idx_campaign_id campaign_id TYPE set(10000) GRANULARITY 1;
ALTER TABLE raw_events ADD INDEX idx_revenue revenue TYPE minmax GRANULARITY 1;
ALTER TABLE raw_events ADD INDEX idx_is_valid is_valid TYPE set(2) GRANULARITY 1;

-- Indexes for processed events (attribution queries)
ALTER TABLE processed_events ADD INDEX idx_attribution_source attribution_source TYPE set(1000) GRANULARITY 1;
ALTER TABLE processed_events ADD INDEX idx_attribution_model attribution_model_used TYPE set(10) GRANULARITY 1;
ALTER TABLE processed_events ADD INDEX idx_touchpoint_count attribution_touchpoint_count TYPE minmax GRANULARITY 1;

-- Indexes for user journey (path analysis)
ALTER TABLE user_journey_touchpoints ADD INDEX idx_touchpoint_type touchpoint_type TYPE set(10) GRANULARITY 1;
ALTER TABLE user_journey_touchpoints ADD INDEX idx_journey_position journey_position TYPE minmax GRANULARITY 1;
ALTER TABLE user_journey_touchpoints ADD INDEX idx_conversion leads_to_conversion TYPE set(2) GRANULARITY 1;

-- =============================================================================
-- SAMPLE QUERIES FOR ATTRIBUTION ANALYSIS
-- =============================================================================

-- Get top performing campaigns by attribution model
-- SELECT
--     attribution_model,
--     campaign_name,
--     source,
--     sum(attributed_conversions) as conversions,
--     sum(attributed_revenue) as revenue,
--     round(attributed_revenue / attributed_conversions, 2) as revenue_per_conversion
-- FROM attribution_daily_summary
-- WHERE organization_id = 'org_123'
--   AND app_id = 'app_456'
--   AND date >= today() - 30
-- GROUP BY attribution_model, campaign_name, source
-- ORDER BY revenue DESC;

-- Get user journey analysis
-- SELECT
--     user_id,
--     groupArray(tuple(touchpoint_timestamp, source, campaign_name)) as journey,
--     max(leads_to_conversion) as converted,
--     sum(conversion_revenue) as total_revenue
-- FROM user_journey_touchpoints
-- WHERE organization_id = 'org_123'
--   AND date >= today() - 7
-- GROUP BY user_id
-- HAVING converted = true
-- ORDER BY total_revenue DESC;

-- Attribution model comparison
-- SELECT
--     'Model Comparison' as analysis,
--     sum(attributed_revenue_first_touch) as first_touch_revenue,
--     sum(attributed_revenue_last_touch) as last_touch_revenue,
--     sum(attributed_revenue_linear) as linear_revenue,
--     sum(attributed_revenue_time_decay) as time_decay_revenue,
--     sum(attributed_revenue_position_based) as position_based_revenue
-- FROM processed_events
-- WHERE organization_id = 'org_123'
--   AND date >= today() - 30
--   AND event_type = 'purchase';