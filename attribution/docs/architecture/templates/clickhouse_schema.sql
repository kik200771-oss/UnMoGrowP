CREATE TABLE IF NOT EXISTS events_t123 (
  event_date Date DEFAULT toDate(timestamp),
  event_id UUID,
  tenant_id String,
  timestamp DateTime64(3),
  device_id String,
  campaign String,
  source LowCardinality(String),
  metadata JSON
) ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (tenant_id, timestamp);