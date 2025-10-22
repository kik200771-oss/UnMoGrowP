# Database Schemas

This directory contains all database schemas and migration files for the UnMoGrowP Attribution Platform.

## Schema Files

### PostgreSQL Schemas
- **`schema.sql`** - Legacy single-tenant PostgreSQL schema
- **`multi-tenant-schema.sql`** - Multi-tenant PostgreSQL schema with Row-Level Security (RLS)
- **`rbac-migration.sql`** - Role-Based Access Control migration

### ClickHouse Schemas
- **`clickhouse-schema.sql`** - Standard ClickHouse OLAP schema
- **`multi-tenant-clickhouse-schema.sql`** - Multi-tenant ClickHouse with tenant isolation
- **`clickhouse-simple.sql`** - Simplified ClickHouse schema for development

## Usage Guide

### For New Projects (Recommended)
Use the multi-tenant schemas for new deployments:
```sql
-- PostgreSQL (OLTP)
\i database/multi-tenant-schema.sql

-- ClickHouse (OLAP)
SOURCE database/multi-tenant-clickhouse-schema.sql
```

### Schema Selection Matrix

| Use Case | PostgreSQL Schema | ClickHouse Schema |
|----------|------------------|------------------|
| **Production Multi-tenant** | `multi-tenant-schema.sql` | `multi-tenant-clickhouse-schema.sql` |
| **Single Tenant** | `schema.sql` | `clickhouse-schema.sql` |
| **Development** | `schema.sql` | `clickhouse-simple.sql` |
| **Legacy Migration** | `schema.sql` → `multi-tenant-schema.sql` | `clickhouse-schema.sql` → `multi-tenant-clickhouse-schema.sql` |

## Multi-Tenant Features

The multi-tenant schemas include:
- **Row-Level Security (RLS)** - Complete tenant data isolation
- **Tenant-aware indexing** - Performance optimization per tenant
- **RBAC integration** - Role-based access control
- **Audit logging** - Security and compliance tracking
- **Partitioning** - Scale optimization for large datasets

## Migration Commands

```bash
# Apply PostgreSQL multi-tenant schema
psql -d unmogrowp -f database/multi-tenant-schema.sql

# Apply ClickHouse multi-tenant schema
clickhouse-client --queries-file database/multi-tenant-clickhouse-schema.sql

# Apply RBAC migration
psql -d unmogrowp -f database/rbac-migration.sql
```

## Architecture Documentation

For detailed architecture information, see:
- `docs/architecture/MULTI_TENANT_ARCHITECTURE.md` - Complete multi-tenant documentation
- `docs/architecture/ARCHITECTURAL_ENHANCEMENTS.md` - Advanced architectural patterns

---
*Part of the UnMoGrowP Attribution Platform v0.6.0-preview*