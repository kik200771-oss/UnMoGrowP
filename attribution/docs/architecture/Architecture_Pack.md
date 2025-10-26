# 🧩 UnMoGrowP — Architecture Integration Pack
**Версия:** 1.0
**Дата:** 26.10.2025
**Автор:** ChatGPT-AI / Tech Design Module

---

## 📁 Структура PR-папки
```
docs/
 └── architecture/
      ├── Architecture_Pack.md
      ├── UnMoGrowP_Global_Plus_PerTenant_Design_2025-10-26.md
      ├── helm/
      │    └── tenant_values_example.yaml
      ├── openapi/
      │    ├── ingest_openapi.yaml
      │    └── schemas/
      │         └── event.install.json
      └── templates/
           ├── middleware_tenant.go
           └── clickhouse_schema.sql
```

---

## 📘 Краткое описание
Этот пакет объединяет документацию и готовые шаблоны для построения архитектуры UnMoGrowP:

- Каждый клиент (tenant) получает **собственные изолированные окружения (Frontend, Backend, БД)**.
- Все данные консолидируются в **общем сервере Global Plane** — для ML, отчётности и централизованного анализа.
- В пакет входят:
  - основной архитектурный документ;
  - шаблоны Helm Values;
  - OpenAPI-контракты;
  - JSON-Schema событий;
  - шаблоны кода middleware и схемы ClickHouse.

---

## 🧱 `UnMoGrowP_Global_Plus_PerTenant_Design_2025-10-26.md`
Основной технический документ с архитектурой «Global Control Plane + Per-Tenant Environments».
[Скачать / открыть →](./UnMoGrowP_Global_Plus_PerTenant_Design_2025-10-26.md)

---

## ⚙️ `helm/tenant_values_example.yaml`
```yaml
tenantId: "t123"
domain: "client123.unmogrow.com"

backend:
  image: "ghcr.io/unmogrowp/backend:1.2.0"
  env:
    - name: TENANT_ID
      value: "t123"
    - name: PG_DSN
      valueFrom: secretRef: pg_t123

frontend:
  image: "ghcr.io/unmogrowp/frontend:1.2.0"
  env:
    - name: TENANT_ID
      value: "t123"

redis:
  namespace: "t123"
  persistence:
    enabled: false
```

---

## 🌐 `openapi/ingest_openapi.yaml`
```yaml
openapi: 3.0.3
info:
  title: UnMoGrowP Event Ingest API
  version: 1.0.0
  description: API для приёма событий с фронтенда и бэкенда клиентов (tenants)

paths:
  /api/v1/events/ingest:
    post:
      summary: Ingest event
      operationId: ingestEvent
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: './schemas/event.install.json'
      responses:
        '202':
          description: Accepted
        '400':
          description: Validation error
        '401':
          description: Unauthorized
servers:
  - url: https://api.unmogrow.com
    description: Global Ingest Gateway
```

---

## 📜 `openapi/schemas/event.install.json`
```json
{
  "$id": "https://unmogrow/schemas/event.install.json",
  "type": "object",
  "required": ["eventId", "tenantId", "timestamp", "deviceId", "campaign"],
  "properties": {
    "eventId": {"type": "string", "format": "uuid"},
    "tenantId": {"type": "string"},
    "timestamp": {"type": "string", "format": "date-time"},
    "deviceId": {"type": "string"},
    "campaign": {"type": "string"},
    "source": {"type": "string", "enum": ["ad_network", "organic", "cross"]},
    "metadata": {"type": "object", "additionalProperties": true}
  },
  "additionalProperties": false
}
```

---

## 🧩 `templates/middleware_tenant.go`
```go
package middleware

import (
  "context"
  "net/http"
)

type ctxKey string

const CtxTenantID ctxKey = "tenant_id"

func WithTenant(next http.Handler) http.Handler {
  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    tid := r.Header.Get("X-Tenant-ID")
    if tid == "" {
      http.Error(w, "missing tenant", http.StatusUnauthorized)
      return
    }
    ctx := context.WithValue(r.Context(), CtxTenantID, tid)
    next.ServeHTTP(w, r.WithContext(ctx))
  })
}
```

---

## 🗃️ `templates/clickhouse_schema.sql`
```sql
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
```

---

## 🚀 Инструкции по интеграции

1. **Скопировать** папку `docs/architecture/` в корень репозитория `UnMoGrowP`.
2. **Добавить ссылку** в `README.md` проекта:
   ```markdown
   [📘 Архитектура системы](docs/architecture/Architecture_Pack.md)
   ```
3. **Создать ветку:**
   ```bash
   git checkout -b feature/architecture-docs
   ```
4. **Добавить и закоммитить:**
   ```bash
   git add docs/architecture/
   git commit -m "Add Global + Per-Tenant architecture documentation and templates"
   git push origin feature/architecture-docs
   ```
5. **Создать Pull Request → main**
   ```
   Название: Add distributed architecture documentation
   Описание: Добавлена архитектура Global Control Plane + Per-Tenant Environments,
   включая Helm-шаблоны, OpenAPI, JSON Schema и код middleware.
   ```

---

## ✅ Результат интеграции

После мёрджа:
- проект будет иметь **единый стандарт архитектурной документации**;
- все будущие окружения (tenant) смогут деплоиться автоматически через Helm;
- будет готова основа для CI/CD и дальнейшей ML-интеграции;
- документация и схемы можно использовать в будущих релизах и презентациях для инвесторов/партнёров.