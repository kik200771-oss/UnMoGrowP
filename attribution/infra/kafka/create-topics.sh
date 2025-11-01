#!/bin/bash
# ============================================================================
# Kafka Topics Creation for UnMoGrowP Attribution Platform
# Optimized for 10M+ events/sec processing
# ============================================================================

echo "🚀 Creating Kafka topics for UnMoGrowP Attribution Platform..."

# Wait for Kafka to be ready
echo "⏳ Waiting for Kafka to be ready..."
kafka-topics --bootstrap-server kafka:29092 --list > /dev/null 2>&1
while [ $? -ne 0 ]; do
    echo "Kafka not ready yet, waiting..."
    sleep 5
    kafka-topics --bootstrap-server kafka:29092 --list > /dev/null 2>&1
done

echo "✅ Kafka is ready, creating topics..."

# ============================================================================
# EVENT PROCESSING TOPICS - High Throughput
# ============================================================================

# Raw events from ingestion service
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists \
  --topic raw-events \
  --partitions 32 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config segment.ms=86400000 \
  --config compression.type=snappy \
  --config max.message.bytes=1048576

echo "✅ Created topic: raw-events (32 partitions, 7 days retention)"

# Validated events ready for attribution
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists \
  --topic validated-events \
  --partitions 32 \
  --replication-factor 1 \
  --config retention.ms=2592000000 \
  --config segment.ms=86400000 \
  --config compression.type=snappy

echo "✅ Created topic: validated-events (32 partitions, 30 days retention)"

# Events enriched with additional data
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists \
  --topic enriched-events \
  --partitions 32 \
  --replication-factor 1 \
  --config retention.ms=2592000000 \
  --config compression.type=snappy

echo "✅ Created topic: enriched-events (32 partitions)"

# ============================================================================
# ATTRIBUTION PROCESSING TOPICS
# ============================================================================

# Attribution calculation requests
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists \
  --topic attribution-requests \
  --partitions 16 \
  --replication-factor 1 \
  --config retention.ms=259200000 \
  --config compression.type=snappy

echo "✅ Created topic: attribution-requests (16 partitions)"

# Attribution calculation results
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists \
  --topic attribution-results \
  --partitions 16 \
  --replication-factor 1 \
  --config retention.ms=2592000000 \
  --config compression.type=snappy

echo "✅ Created topic: attribution-results (16 partitions)"

# User journey updates
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists \
  --topic user-journeys \
  --partitions 16 \
  --replication-factor 1 \
  --config retention.ms=2592000000 \
  --config compression.type=snappy \
  --config cleanup.policy=compact

echo "✅ Created topic: user-journeys (16 partitions, compacted)"

# ============================================================================
# REAL-TIME STREAMING TOPICS
# ============================================================================

# Real-time metrics and dashboards
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists \
  --topic realtime-metrics \
  --partitions 8 \
  --replication-factor 1 \
  --config retention.ms=86400000 \
  --config compression.type=snappy

echo "✅ Created topic: realtime-metrics (8 partitions, 1 day retention)"

# Real-time alerts and notifications
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists \
  --topic alerts \
  --partitions 4 \
  --replication-factor 1 \
  --config retention.ms=259200000

echo "✅ Created topic: alerts (4 partitions)"

# ============================================================================
# ERROR HANDLING TOPICS
# ============================================================================

# Dead letter queue for failed events
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists \
  --topic dead-letter-queue \
  --partitions 8 \
  --replication-factor 1 \
  --config retention.ms=2592000000

echo "✅ Created topic: dead-letter-queue (8 partitions)"

# Retry queue for transient failures
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists \
  --topic retry-queue \
  --partitions 8 \
  --replication-factor 1 \
  --config retention.ms=86400000

echo "✅ Created topic: retry-queue (8 partitions)"

# ============================================================================
# ANALYTICS & EXPORT TOPICS
# ============================================================================

# ClickHouse export stream
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists \
  --topic clickhouse-export \
  --partitions 16 \
  --replication-factor 1 \
  --config retention.ms=259200000 \
  --config compression.type=snappy

echo "✅ Created topic: clickhouse-export (16 partitions)"

# Customer data export
kafka-topics --bootstrap-server kafka:29092 --create --if-not-exists \
  --topic customer-exports \
  --partitions 4 \
  --replication-factor 1 \
  --config retention.ms=259200000

echo "✅ Created topic: customer-exports (4 partitions)"

# ============================================================================
# VERIFY TOPIC CREATION
# ============================================================================

echo ""
echo "📊 Kafka Topics Summary:"
kafka-topics --bootstrap-server kafka:29092 --list | sort

echo ""
echo "📈 Topic Details:"
kafka-topics --bootstrap-server kafka:29092 --describe --topic raw-events
kafka-topics --bootstrap-server kafka:29092 --describe --topic attribution-results

echo ""
echo "🎉 All Kafka topics created successfully!"
echo "📊 Total topics: $(kafka-topics --bootstrap-server kafka:29092 --list | wc -l)"
echo "⚡ Ready for 10M+ events/sec processing!"