-- UnMoGrowP Attribution Platform - Customer Success Metrics Schema
-- Date: 2025-10-24
-- Version: 1.0.0
-- Description: Customer success tracking for pilot customers and sprint metrics

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CUSTOMER SUCCESS METRICS TABLE
-- =============================================================================

-- Main customer metrics table for tracking pilot customer success
-- Based on team meeting targets: 99%+ accuracy, <100ms latency, >99.9% uptime
CREATE TABLE IF NOT EXISTS customer_metrics (
    -- Primary identification
    customer_id VARCHAR(50) PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL,
    pilot_start_date TIMESTAMP NOT NULL,
    current_phase VARCHAR(20) NOT NULL DEFAULT 'discovery',

    -- Technical Metrics (Team Meeting Targets)
    -- Target: >99% accuracy, <100ms latency, >99.9% uptime
    attribution_accuracy DECIMAL(5,2) DEFAULT 0,  -- Percentage (0-100)
    avg_api_latency DECIMAL(8,2) DEFAULT 0,       -- Milliseconds
    p95_api_latency DECIMAL(8,2) DEFAULT 0,       -- Milliseconds
    system_uptime DECIMAL(5,2) DEFAULT 0,         -- Percentage (0-100)
    error_rate DECIMAL(5,4) DEFAULT 0,            -- Percentage (0-100)

    -- Business Metrics (Team Meeting Targets)
    -- Target: 30-50% cost savings, 80% time savings
    cost_savings_percent DECIMAL(5,2) DEFAULT 0,  -- Percentage
    time_savings_percent DECIMAL(5,2) DEFAULT 0,  -- Percentage
    accuracy_improvement DECIMAL(5,2) DEFAULT 0,  -- Percentage
    productivity_gain DECIMAL(5,2) DEFAULT 0,     -- Percentage

    -- Volume Metrics
    daily_event_volume BIGINT DEFAULT 0,          -- Events per day
    peak_events_per_second BIGINT DEFAULT 0,      -- Peak throughput
    total_events_processed BIGINT DEFAULT 0,      -- Lifetime total

    -- Satisfaction Metrics (Target: >90%)
    customer_satisfaction DECIMAL(5,2) DEFAULT 0, -- Score (0-100)
    nps INTEGER DEFAULT 0,                        -- Net Promoter Score (-100 to 100)
    feedback_score DECIMAL(5,2) DEFAULT 0,        -- Average feedback score

    -- Integration Metrics (Target: <2 weeks)
    integration_days INTEGER DEFAULT 0,           -- Days to integration
    go_live_date TIMESTAMP,                       -- When customer went live
    support_tickets INTEGER DEFAULT 0,            -- Number of support tickets

    -- Success Flags (Auto-calculated based on targets)
    technical_success BOOLEAN DEFAULT FALSE,      -- Technical targets met
    business_success BOOLEAN DEFAULT FALSE,       -- Business targets met
    overall_success BOOLEAN DEFAULT FALSE,        -- All targets met

    -- Metadata
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints to ensure data quality
    CONSTRAINT valid_phase CHECK (current_phase IN ('discovery', 'setup', 'launch')),
    CONSTRAINT valid_satisfaction CHECK (customer_satisfaction >= 0 AND customer_satisfaction <= 100),
    CONSTRAINT valid_accuracy CHECK (attribution_accuracy >= 0 AND attribution_accuracy <= 100),
    CONSTRAINT valid_uptime CHECK (system_uptime >= 0 AND system_uptime <= 100),
    CONSTRAINT valid_cost_savings CHECK (cost_savings_percent >= 0),
    CONSTRAINT valid_nps CHECK (nps >= -100 AND nps <= 100)
);

-- Performance indexes for customer metrics
CREATE INDEX IF NOT EXISTS idx_customer_metrics_phase ON customer_metrics(current_phase);
CREATE INDEX IF NOT EXISTS idx_customer_metrics_success ON customer_metrics(overall_success);
CREATE INDEX IF NOT EXISTS idx_customer_metrics_updated ON customer_metrics(last_updated);
CREATE INDEX IF NOT EXISTS idx_customer_metrics_company ON customer_metrics(company_name);
CREATE INDEX IF NOT EXISTS idx_customer_metrics_pilot_date ON customer_metrics(pilot_start_date);

-- =============================================================================
-- WEEKLY SUMMARIES TABLE
-- =============================================================================

-- Weekly sprint summaries for team meeting reviews
-- Tracks progress towards Week 1 targets: 5 customers, $10K+ MRR, 90%+ satisfaction
CREATE TABLE IF NOT EXISTS weekly_summaries (
    -- Time period identification
    week INTEGER NOT NULL,                         -- Sprint week number
    start_date DATE NOT NULL,                      -- Week start date
    end_date DATE NOT NULL,                        -- Week end date

    -- Aggregated summary data (JSON for flexibility)
    summary_data JSONB NOT NULL,                   -- Contains all calculated metrics

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Composite primary key
    PRIMARY KEY (week, start_date)
);

-- Index for efficient weekly queries
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_date_range ON weekly_summaries(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_week ON weekly_summaries(week);

-- =============================================================================
-- CUSTOMER SUCCESS VIEWS
-- =============================================================================

-- View for current sprint status (Week 1 targets)
CREATE OR REPLACE VIEW current_sprint_status AS
SELECT
    COUNT(*) as total_customers,
    COUNT(CASE WHEN overall_success = true THEN 1 END) as successful_customers,
    COUNT(CASE WHEN current_phase = 'launch' THEN 1 END) as active_customers,
    COUNT(CASE WHEN current_phase = 'discovery' THEN 1 END) as discovery_customers,
    COUNT(CASE WHEN current_phase = 'setup' THEN 1 END) as setup_customers,

    -- Target achievement calculations
    COUNT(*) >= 5 as target_5_customers_achieved,
    COALESCE(AVG(customer_satisfaction), 0) >= 90.0 as target_90_satisfaction_achieved,
    COUNT(*) * 2500 >= 10000 as target_10k_mrr_achieved, -- $2.5K estimated per customer

    -- Performance aggregates
    COALESCE(AVG(attribution_accuracy), 0) as avg_attribution_accuracy,
    COALESCE(AVG(p95_api_latency), 0) as avg_p95_latency,
    COALESCE(AVG(system_uptime), 0) as avg_system_uptime,
    COALESCE(AVG(customer_satisfaction), 0) as avg_customer_satisfaction,
    COALESCE(AVG(cost_savings_percent), 0) as avg_cost_savings,

    -- Volume metrics
    COALESCE(SUM(daily_event_volume), 0) as total_daily_events,
    COALESCE(MAX(peak_events_per_second), 0) as max_peak_events_per_second,
    COALESCE(SUM(total_events_processed), 0) as total_events_all_customers
FROM customer_metrics;

-- View for customer performance ranking
CREATE OR REPLACE VIEW customer_performance_ranking AS
SELECT
    customer_id,
    company_name,
    current_phase,

    -- Performance scores
    attribution_accuracy,
    p95_api_latency,
    system_uptime,
    customer_satisfaction,
    cost_savings_percent,

    -- Success indicators
    technical_success,
    business_success,
    overall_success,

    -- Overall performance score (weighted)
    (
        (attribution_accuracy * 0.3) +
        (CASE WHEN p95_api_latency < 100 THEN 100 ELSE (100 - LEAST(p95_api_latency / 10, 100)) END * 0.2) +
        (system_uptime * 0.2) +
        (customer_satisfaction * 0.2) +
        (cost_savings_percent * 0.1)
    ) as performance_score,

    -- Ranking
    ROW_NUMBER() OVER (ORDER BY
        overall_success DESC,
        (attribution_accuracy + customer_satisfaction + cost_savings_percent) DESC
    ) as rank,

    last_updated
FROM customer_metrics
ORDER BY performance_score DESC;

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert sample pilot customers for Week 1 targets
INSERT INTO customer_metrics (
    customer_id, company_name, pilot_start_date, current_phase,
    attribution_accuracy, p95_api_latency, system_uptime,
    customer_satisfaction, cost_savings_percent, time_savings_percent,
    daily_event_volume, technical_success, business_success, overall_success
) VALUES
-- Customer 1: Successful pilot
('pilot_001', 'TechCorp Solutions', '2025-10-21', 'launch',
 99.5, 45.0, 99.95, 95.0, 35.0, 85.0, 50000, true, true, true),

-- Customer 2: In setup phase
('pilot_002', 'DataFlow Inc', '2025-10-22', 'setup',
 98.5, 75.0, 99.8, 88.0, 25.0, 70.0, 25000, false, false, false),

-- Customer 3: Discovery phase
('pilot_003', 'Analytics Pro', '2025-10-23', 'discovery',
 97.0, 95.0, 99.5, 85.0, 20.0, 60.0, 10000, false, false, false),

-- Customer 4: High performer
('pilot_004', 'Mobile First', '2025-10-20', 'launch',
 99.8, 35.0, 99.99, 97.0, 45.0, 90.0, 75000, true, true, true),

-- Customer 5: Meeting targets exactly
('pilot_005', 'E-commerce Plus', '2025-10-19', 'launch',
 99.0, 99.0, 99.9, 90.0, 30.0, 80.0, 40000, true, true, true)

ON CONFLICT (customer_id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    last_updated = CURRENT_TIMESTAMP;

-- Insert sample weekly summary for Week 1
INSERT INTO weekly_summaries (week, start_date, end_date, summary_data)
VALUES (
    1,
    '2025-10-21',
    '2025-10-27',
    '{
        "total_customers": 5,
        "successful_customers": 3,
        "target_achievements": {
            "5_customers": true,
            "10k_mrr": true,
            "90_satisfaction": true,
            "product_market_fit": true
        },
        "performance_summary": {
            "avg_accuracy": 98.76,
            "avg_latency": 69.8,
            "avg_satisfaction": 91.0,
            "avg_cost_savings": 31.0
        },
        "business_impact": {
            "estimated_mrr": 12500,
            "total_events_daily": 200000,
            "peak_throughput": 75000
        }
    }'::JSONB
)
ON CONFLICT (week, start_date) DO UPDATE SET
    summary_data = EXCLUDED.summary_data,
    created_at = CURRENT_TIMESTAMP;

-- =============================================================================
-- USEFUL QUERIES FOR TEAM MEETINGS
-- =============================================================================

-- Show current sprint progress
-- SELECT * FROM current_sprint_status;

-- Show customer performance ranking
-- SELECT * FROM customer_performance_ranking LIMIT 10;

-- Get Week 1 target achievement status
-- SELECT
--     total_customers >= 5 as "5 Customers Target Met",
--     total_customers * 2500 >= 10000 as "10K MRR Target Met",
--     avg_customer_satisfaction >= 90 as "90% Satisfaction Target Met",
--     successful_customers,
--     total_customers
-- FROM current_sprint_status;

-- Show customers needing attention
-- SELECT customer_id, company_name, current_phase, overall_success
-- FROM customer_metrics
-- WHERE overall_success = false
-- ORDER BY last_updated DESC;

-- Display schema creation summary
SELECT
    'Customer Success Schema Created!' as status,
    COUNT(*) as sample_customers,
    AVG(customer_satisfaction) as avg_satisfaction,
    COUNT(CASE WHEN overall_success = true THEN 1 END) as successful_customers
FROM customer_metrics;