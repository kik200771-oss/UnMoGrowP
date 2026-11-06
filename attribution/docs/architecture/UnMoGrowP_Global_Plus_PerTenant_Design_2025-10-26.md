# UnMoGrowP — Global Control Plane + Per‑Tenant Environments
**Дата:** 26.10.2025
**Версия документа:** 1.0

Проектирование системы, в которой **каждый пользователь (tenant)** имеет **свой фронтенд, свой бэкенд и свои БД**, а также существует **общая глобальная платформа** (Global Plane), куда **стекаются данные всех** клиентов для **ML‑обработки** и централизованной аналитики с последующей **раздачей результатов обратно** в окружения клиентов.

---

## 1. Цели и принципы
- **Изоляция клиента:** FE/BE/БД/кэш — самостоятельные окружения per tenant.
- **Единая аналитика:** Global Plane агрегирует события со всех tenants и выполняет offline/online ML.
- **Жёсткий контроль доступа:** Global Plane доступен только компании (админам), клиенты видят только свои данные и «производные» результаты (derivations).
- **Контракты:** OpenAPI + JSON Schema, идемпотентность и трассировка (correlation_id).
- **Автоматизация:** Control Plane разворачивает/обновляет окружения, управляет жизненным циклом.

---

## 2. Высокоуровневая архитектура

```text
                            ┌─────────────────────────────────┐
                            │  Global Control & Data/ML Plane │  (доступен только компании)
                            │  - Tenant Registry & Billing    │
                            │  - Global Ingest (HTTP/Kafka)   │
                            │  - Data Lake (S3) + ClickHouse  │
                            │  - Feature Store & Model Reg.   │
                            │  - Offline/Online ML Services   │
                            │  - Orchestrator (Helm/Terraform)│
                            └───────────▲───────────▲─────────┘
                                        │           │
        Results / Exports ◄─────────────┘           └────────► Global Observability (Prom/Graf/Loki)
                                        │
         ┌───────────────────────────────┼────────────────────────────────────┐
         │                               │                                    │
┌────────┴─────────┐           ┌─────────┴────────┐                 ┌─────────┴─────────┐
│ Tenant A Plane   │           │ Tenant B Plane   │                 │ Tenant N Plane    │
│ - FE (Svelte)    │           │ - FE (Svelte)    │                 │ - FE (Svelte)     │
│ - BE (Go)        │           │ - BE (Go)        │                 │ - BE (Go)         │
│ - OLTP/Cache     │           │ - OLTP/Cache     │                 │ - OLTP/Cache      │
│ - Local metrics  │           │ - Local metrics  │                 │ - Local metrics   │
└────────▲─────────┘           └────────▲─────────┘                 └────────▲──────────┘
         │ Events/Logs (PII‑safe)        │                                    │
         └───────────────►  Global Ingest (Gateway/Kafka)  ◄──────────────────┘
```

---

## 3. Компоненты

### 3.1 Global Plane
- **Ingest:** HTTP API Gateway (Go) + Kafka/Redpanda (`events.tenant_<id>`), JSON‑Schema валидация, идемпотентность (`event_id`).
- **Data Lake & OLAP:** S3‑совместимое хранилище (raw/parquet), ClickHouse (партиции `event_date`, `tenant_id`).
- **Feature Store:** централизованное хранение фич (Feast/своя реализация).
- **Model Registry:** версии моделей, артефакты, метрики (MLflow/W&B).
- **Offline ML:** Batch (Spark/Dask/ClickHouse SQL + Python).
- **Online ML:** gRPC/HTTP inference, A/B/Shadow, autoscale.
- **Exports/Fan‑out:** выгрузка скорингов и атрибуций обратно в Tenant Plane (webhook/API/CDC).
- **Control Plane:** регистрация арендаторов, шаблоны окружений, деплой через Helm/Terraform, биллинг/квоты.

### 3.2 Tenant Plane (на клиента)
- **Frontend:** Svelte 5/SvelteKit, домен `clientX.unmogrow.com`, dynamic config `/config.json` с `TENANT_ID`.
- **Backend (Go):** `/api/v1/…`, middleware `tenant_id`, JWT/RBAC, rate limits/quotas.
- **OLTP:** PostgreSQL `unmogrow_tenant_<id>` (миграции per‑tenant).
- **Cache/Queue (локально):** Redis namespace `t:<id>:*`.
- **Outbound поток:** безопасная отправка событий в Global Ingest (HTTP/Kafka) с токеном write‑only.
- **Локальные метрики:** Prometheus exporter, базовые дашборды для клиента.

---

## 4. Потоки данных (E2E)

1) **События (FE/BE → Global):** Tenant FE/BE шлёт события (PII‑safe) в Global Ingest.
2) **Обработка:** валидация, нормализация, дедупликация, антифрод‑правила.
3) **Хранилища:** запись в S3 (raw) и ClickHouse (OLAP).
4) **Фичи/ML:** расчёт фич, обучение моделей, онлайн‑инференс.
5) **Раздача результатов:** возврат скорингов/отчётов per‑tenant через webhooks/API, обновление локальных витрин.

---

## 5. Контракты и схемы

### 5.1 JSON Schema (пример события `install`)
```json
{
  "$id": "https://unmogrow/schemas/event.install.json",
  "type": "object",
  "required": ["eventId","tenantId","timestamp","deviceId","campaign"],
  "properties": {
    "eventId": { "type": "string", "format": "uuid" },
    "tenantId": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "deviceId": { "type": "string" },
    "campaign": { "type": "string" },
    "source": { "type": "string", "enum": ["ad_network","organic","cross"] },
    "metadata": { "type": "object", "additionalProperties": true }
  },
  "additionalProperties": false
}
```

### 5.2 OpenAPI (фрагмент `/events/ingest`)
```yaml
post:
  summary: Ingest event
  operationId: ingestEvent
  requestBody:
    required: true
    content:
      application/json:
        schema:
          $ref: 'schemas/event.install.json'
  responses:
    '202':
      description: Accepted
```

---

## 6. Изоляция данных и безопасность

- **Per‑tenant БД:** PostgreSQL — отдельные базы/схемы; ClickHouse — отдельные таблицы (`…_t<id>`).
- **PII‑санитайзер:** на входе Global — выделение PII в отдельный зашифрованный vault (KMS), аналитика — по деперсонализированным ключам.
- **Аутентификация/авторизация:** JWT/RBAC/OIDC; отдельные сервисные ключи для outbound потоков.
- **Секреты:** Secret Manager/Vault; запрет секретов в Git.
- **Политики:** Retention/TTL, DSR (удаление/анонимизация по запросу), аудируемые треки действий админов.
- **Сегментация сети:** VPC/NSG; Global Plane изолирован, доступ только у ops/ML/админов компании.

---

## 7. Наблюдаемость (Observability)

- **Tracing:** OpenTelemetry (сквозной `trace_id`/`tenant_id`).
- **Метрики:** Prometheus (общие и per‑tenant SLO/SLI), графики в Grafana.
- **Логирование:** Loki/ELK, метки `tenant_id`, маскирование PII.
- **Алерты:** по латентности ingest/inference, ошибкам валидации, росту DLQ, падению throughput.

---

## 8. CI/CD и деплой

- **Репозитории:** mono‑repo или split (FE/BE/infra); теги SemVer; changelog.
- **Билды:** Docker образы FE/BE/ML; SBOM/подписи (SLSA/attestations).
- **Деплой Global Plane:** Helm чарты + ArgoCD/GitHub Actions.
- **Деплой Tenant Plane:** Control Plane автом. создаёт окружения:
  - `helm install tenant-<id> …`
  - Вписывает DNS `client<id>.unmogrow.com`
  - Ставит secrets/конфиги
- **Миграции БД:** per‑tenant мигратор (lock/rollforward).
- **ML:** Model Registry, канареечные/Shadow релизы, автооткат.

---

## 9. Доменная логика атрибуции и ML

- **Атрибуция:** last/multi‑touch, окна атрибуции по каналам (click/view), правила приоритета.
- **ML:** LTV/ROAS, look‑alike, churn, антифрод (rule‑based + ML), рекомендации бенчей.
- **Feature Store:** агрегаты по пользователям/сессиям/кампаниям; SLAs на «свежесть» фич.
- **Governance:** версия контрактов событий (`/v1`, `/v2`), обратная совместимость, contract‑tests.

---

## 10. Профили развёртывания и стоимость

| Профиль | Для кого | Ресурсы | Примечания |
|---------|---------|---------|-----------|
| **Starter** | малые клиенты | 1 FE/1 BE, shared Postgres schema, Redis ns | дёшево, быстро |
| **Standard** | средние | 1 FE/1 BE, Postgres DB per tenant, ClickHouse таблицы per tenant | баланс цена/изоляция |
| **Enterprise** | крупные | K8s namespace per tenant, выделенные БД/кластера, выделенный ML pod | макс. изоляция и SLA |

---

## 11. План внедрения (90 дней)

**0–30 дней**
- Tenant Registry, Helm шаблоны окружений.
- Global Ingest (Gateway + Kafka), JSON Schema + OpenAPI v1.
- ClickHouse + S3 raw; PII‑санитайзер.

**30–60 дней**
- Feature Store, базовые модели (атрибуция, антифрод‑rules).
- Online inference сервис; fan‑out экспортов в tenants.
- Observability (Prom/Loki/Grafana), RBAC/SSO.

**60–90 дней**
- Версионирование моделей/контрактов; A/B/Shadow.
- Автодеплой per‑tenant, биллинг/квоты, SLA/алертинг.
- Расширение схем событий (revenue, cohort, churn, LTV).

---

## 12. Приложения (фрагменты)

### 12.1 Values для Helm (Tenant)
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
redis:
  namespace: "t123"
```

### 12.2 Пример middleware (Go)
```go
func WithTenant(next http.Handler) http.Handler {
  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    tid := r.Header.Get("X-Tenant-ID")
    if tid == "" { http.Error(w, "missing tenant", 401); return }
    ctx := context.WithValue(r.Context(), CtxTenantID, tid)
    next.ServeHTTP(w, r.WithContext(ctx))
  })
}
```

### 12.3 Типовая схема ClickHouse (пер‑тенант таблицы)
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

### 12.4 Webhook результата в Tenant Plane
```http
POST /api/v1/ml/scores
Authorization: Bearer <tenant-service-token>
Content-Type: application/json

{
  "tenantId": "t123",
  "model": "ltv_v2",
  "generatedAt": "2025-10-26T11:00:00Z",
  "items": [
    {"userId":"u-001","score":0.82,"features":{"recency":7,"arpu":12.4}},
    {"userId":"u-002","score":0.41,"features":{"recency":30,"arpu":2.1}}
  ]
}
```

---

## 13. Итог
Модель **Global Control & Data/ML Plane + Per‑Tenant Environments** обеспечивает:
- максимальную изоляцию данных клиента (FE/BE/БД/кэш отдельно),
- централизованную аналитику и ML для всей платформы,
- удобные централизованные обновления кода и моделей,
- масштабируемость и гибкость профилей развёртывания,
- контроль расходов и соблюдение требований безопасности/конфиденциальности.