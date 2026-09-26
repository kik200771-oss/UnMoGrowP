# 🗃️ Database Schemas - UnMoGrowP Attribution Platform

Comprehensive database documentation for the multi-database architecture supporting 10M+ events/sec processing.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   ClickHouse    │    │     Redis       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ User Management │    │ Event Storage   │    │ Caching & Rate  │
│ Apps & API Keys │    │ Analytics       │    │ Limiting        │
│ RBAC & Security │    │ Attribution     │    │ Sessions        │
│ Customer Success│    │ Real-time Stats │    │ Real-time Data  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 PostgreSQL Schemas (Transactional Data)

### Core Database Files

| File | Purpose | Tables | Status | Auto-Load |
|------|---------|--------|--------|-----------|
| `schema.sql` | Core platform tables | 5 tables | ✅ Production | ✅ Yes |
| `multi-tenant-schema.sql` | Enterprise multi-tenant | 9 tables | ✅ Production | ❌ Manual |
| `rbac-migration.sql` | Basic RBAC system | 3 tables | ✅ Production | ✅ Yes |
| `rbac-upgrade-migration.sql` | Advanced RBAC | 3 tables | ✅ Production | ❌ Manual |
| `customer-success-schema.sql` | Customer success metrics | 2 tables | ✅ Production | ✅ Yes |

### 🔄 Automatic Schema Loading (Docker Compose)

These schemas are automatically loaded when PostgreSQL starts via Docker Compose:

```yaml
volumes:
  - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
  - ./database/rbac-migration.sql:/docker-entrypoint-initdb.d/02-rbac.sql
  - ./database/customer-success-schema.sql:/docker-entrypoint-initdb.d/03-customer-success.sql
```

### 📋 Table Structure

#### Core Tables (`schema.sql`)
```sql
users                    -- User accounts & authentication
apps                     -- Mobile/web applications
api_keys                 -- API authentication tokens
user_sessions            -- JWT session management
password_reset_tokens    -- Password reset workflow
```

#### RBAC Tables (`rbac-migration.sql`)
```sql
organizations           -- Multi-tenant organizations
user_app_permissions    -- Granular app access control
security_audit_log      -- Security event logging
```

#### Customer Success Tables (`customer-success-schema.sql`)
```sql
customer_metrics        -- Pilot customer KPI tracking
weekly_summaries        -- Sprint progress summaries
```

### 🎯 Key Features

**Multi-Tenant Support:**
- Row Level Security (RLS) for tenant isolation
- Organization-based data partitioning
- Secure cross-tenant data access prevention

**RBAC System:**
- 5 role types: super_admin, admin, user, readonly, api_key
- 20+ granular permissions (users:create, apps:read, etc.)
- App-level access control
- Security audit trail

**Customer Success Tracking:**
- Week 1 targets: 5 customers, $10K+ MRR, 90%+ satisfaction
- Technical metrics: 99%+ accuracy, <100ms latency, >99.9% uptime
- Business metrics: 30-50% cost savings, 80% time savings

## 🏭 ClickHouse Schemas (Analytics Data)

### Analytics Database Files

| File | Purpose | Performance | Status | Data Volume |
|------|---------|-------------|--------|-------------|
| `clickhouse-schema.sql` | Core analytics | 10M+ events/sec | ✅ Production | 100M-1B/day |
| `multi-tenant-clickhouse-schema.sql` | Multi-tenant analytics | 10M+ events/sec | ✅ Production | 100M-1B/day |
| `clickhouse-event-processor.sql` | Attribution processing | 100M+ events/day | ✅ Production | 1M-10M/day |
| `clickhouse-simple.sql` | Development/testing | 1M+ events/sec | ✅ Development | 1K-1M/day |

### 📈 Performance Characteristics

| Table Type | Partitioning | Ordering | TTL | Purpose |
|------------|--------------|----------|-----|---------|
| **Raw Events** | org_id + month | org_id, app_id, timestamp | 1-2 years | High-throughput ingestion |
| **Processed Events** | org_id + month | org_id, app_id, event_id | 2 years | Attribution-enhanced events |
| **Aggregations** | org_id + month | org_id, app_id, date | 5 years | Fast analytics queries |
| **User Sessions** | org_id + month | org_id, app_id, user_id | 1 year | Session tracking |

### 🎯 Attribution Models

The platform supports 5 attribution models:
- **First Touch** - Credit to first interaction
- **Last Touch** - Credit to final interaction
- **Linear** - Equal credit distribution
- **Time Decay** - Recent interactions weighted higher
- **Position-Based** - 40% first, 40% last, 20% middle

## 🔧 Database Operations

### 🚀 Quick Start (Development)

```bash
# Start all databases
docker-compose up -d postgres clickhouse redis

# Verify PostgreSQL schemas loaded
docker-compose exec postgres psql -U attribution -d attribution -c "\dt"

# Check ClickHouse connection
curl http://localhost:8123/ping

# View customer success data
docker-compose exec postgres psql -U attribution -d attribution -c "SELECT * FROM current_sprint_status;"
```

### 📊 Production Deployment

```bash
# 1. Deploy PostgreSQL with all schemas
docker-compose -f docker-compose.prod.yml up -d postgres

# 2. Load multi-tenant schema (if needed)
docker-compose exec postgres psql -U attribution -d attribution -f /app/database/multi-tenant-schema.sql

# 3. Deploy ClickHouse with analytics schemas
docker-compose -f docker-compose.prod.yml up -d clickhouse

# 4. Initialize ClickHouse schemas
curl -X POST http://clickhouse:8123/ --data-binary @database/clickhouse-schema.sql
```

### 🔄 Schema Migrations

```bash
# Apply RBAC upgrade
docker-compose exec postgres psql -U attribution -d attribution -f /app/database/rbac-upgrade-migration.sql

# Check migration status
docker-compose exec postgres psql -U attribution -d attribution -c "SELECT version FROM schema_migrations;"
```

## 📈 Performance Optimization

### PostgreSQL Optimizations
- **Indexing**: Comprehensive B-tree and GIN indexes
- **Partitioning**: Date-based partitioning for large tables
- **Connection Pooling**: PgBouncer configuration ready
- **Replication**: Master-slave setup supported

### ClickHouse Optimizations
- **Partitioning**: Monthly partitions by organization_id
- **Compression**: LZ4 compression for storage efficiency
- **Materialized Views**: Real-time aggregation
- **Sparse Indexes**: Fast filtering on high-cardinality columns

### Redis Optimizations
- **Memory Policy**: LRU eviction for cache efficiency
- **Persistence**: AOF + RDB for durability
- **Clustering**: Redis Cluster ready for scaling
- **Pipeline**: Batch operations for performance

## 🔐 Security Features

### Data Protection
- **Encryption at Rest**: AES-256 encryption
- **Encryption in Transit**: TLS 1.3 for all connections
- **Row Level Security**: PostgreSQL RLS policies
- **Tenant Isolation**: Complete data separation

### Access Control
- **RBAC**: Role-based access control
- **API Keys**: Scoped API access with rate limiting
- **Audit Logging**: All data access logged
- **Session Management**: Secure JWT tokens

### Compliance
- **GDPR Ready**: User data deletion procedures
- **SOC 2**: Security audit trail
- **HIPAA**: Healthcare data protection (optional)
- **Data Retention**: Configurable retention policies

## 📊 Monitoring & Health Checks

### Database Health
```bash
# PostgreSQL health
curl http://localhost:5432/health

# ClickHouse health
curl http://localhost:8123/ping

# Redis health
redis-cli ping
```

### Performance Metrics
- **Query Performance**: Slow query logging enabled
- **Connection Monitoring**: Active connection tracking
- **Storage Usage**: Disk space monitoring
- **Replication Lag**: Master-slave synchronization

## 🛠️ Development Tools

### Schema Validation
```bash
# Validate PostgreSQL schemas
psql -U attribution -d attribution -c "\d+ customer_metrics"

# Test ClickHouse table structure
curl "http://localhost:8123/?query=DESCRIBE events"

# Check indexes
psql -U attribution -d attribution -c "\di"
```

### Sample Queries
```sql
-- PostgreSQL: Customer success overview
SELECT * FROM current_sprint_status;

-- ClickHouse: Top campaigns by attribution
SELECT
    attribution_campaign,
    sum(attributed_revenue_linear) as revenue
FROM processed_events
WHERE date >= today() - 30
GROUP BY attribution_campaign
ORDER BY revenue DESC
LIMIT 10;
```

## 📚 Additional Resources

### Documentation Links
- [PostgreSQL Multi-Tenant Guide](multi-tenant-schema.sql)
- [ClickHouse Performance Tuning](clickhouse-schema.sql)
- [RBAC Implementation Details](rbac-migration.sql)
- [Customer Success Metrics](customer-success-schema.sql)

### Team Meeting Resources
- Weekly sprint progress: `SELECT * FROM weekly_summaries;`
- Customer success targets: `SELECT * FROM current_sprint_status;`
- Performance rankings: `SELECT * FROM customer_performance_ranking;`

### Troubleshooting
- **Connection Issues**: Check docker-compose logs
- **Schema Errors**: Verify SQL file syntax
- **Performance Issues**: Check query execution plans
- **Data Inconsistency**: Run integrity checks

---

## 📋 Schema Status Summary

| Component | Tables | Documentation | Auto-Load | Production Ready |
|-----------|--------|---------------|-----------|------------------|
| **PostgreSQL Core** | 5 | ✅ Complete | ✅ Yes | ✅ Ready |
| **PostgreSQL Multi-Tenant** | 9 | ✅ Complete | ⚠️ Manual | ✅ Ready |
| **PostgreSQL RBAC** | 6 | ✅ Complete | ✅ Yes | ✅ Ready |
| **PostgreSQL Customer Success** | 2 | ✅ Complete | ✅ Yes | ✅ Ready |
| **ClickHouse Analytics** | 15+ | ✅ Complete | ⚠️ Manual | ✅ Ready |
| **Redis Configuration** | N/A | ✅ Complete | ✅ Yes | ✅ Ready |

**Result: 100% Documented Database Architecture! 🎉**

For questions or support, contact: **ml-team@attribution.platform**