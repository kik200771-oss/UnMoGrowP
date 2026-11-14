# UnMoGrowP — Полный технический аудит (2025-10-22)

> Репозиторий: https://github.com/kik200771-oss/UnMoGrowP  
> Ветка по умолчанию (на момент аудита): `feature/migrate-to-svelte`  
> Языки по оценке GitHub: TypeScript (~67%), Svelte (~10%), PowerShell (~9%), Shell (~4%), JavaScript (~3.6%), Go (~2.7%).  
> Issues: 0 · Pull Requests: 0 · Releases: 0 · Packages: 0

## Резюме (Executive Summary)
UnMoGrowP позиционируется как «high‑performance mobile attribution platform» c фронтендом на Svelte 5 и компонентами на Go/Bun. Репозиторий находится в ранней стадии (≈20 коммитов), отсутствуют Issues/PR/CI/CD и релизы. В корне присутствуют артефакты, не относящиеся к продакшен‑коду (`backup-claude-history.bat`, папка `API_keys_console_anthropic`, `full-dev-setup-with-claude-code`), что указывает на смешение рабочих материалов и повышенные риски безопасности/процессной дисциплины.

**Сильные стороны**
- Амбициозная цель: высоконагруженная атрибуция (до 500K RPS) с AI‑аналитикой.
- Выбор стеков, подходящих для real‑time обработки: Go, Bun/Node, Svelte 5.
- Наличие директории `attribution` — зародыш доменной структуры.

**Слабые стороны / риски**
- Отсутствуют стандартизированные структура монорепозитория, CI/CD, тесты, кодстайл, защита секретов.
- В репозитории замечены потенциально чувствительные артефакты (папка с API‑ключами по названию, бэкап‑скрипт history), что создаёт **критический** риск утечки данных.
- Нет инфраструктурного кода (IaC), observability, SLO/алертинга; нет плана масштабирования под заявленную нагрузку.
- Нет угрозной модели и анти‑фрод подсистемы; нет описания соответствия GDPR/CCPA/ATT/SKAdNetwork и т.п.

**Главные рекомендации (первые 2–3 недели)**
1. Навести порядок в репозитории (см. раздел «Структура репозитория») и **исключить секреты**. Включить GitHub Advanced Security/CodeQL/Dependabot/secret scanning.
2. Ввести базовый CI/CD (lint+typecheck+unit tests, Docker build, SBOM, SAST), окружения dev/stage/prod, GitHub Environments + OIDC. 
3. Заложить архитектуру ingest→stream→attribution→storage→API→dashboards (Kafka/Redpanda + ClickHouse + Postgres + Redis + S3). 
4. Определить модель данных событий и окна дедупликации; внедрить анти‑фрод (device fingerprint sanity, rate‑limits, бот‑фильтры).
5. Запустить observability (OpenTelemetry, Prometheus, Grafana, Tempo/Loki, alerting) и SLO.

---

## 1) Обзор текущего состояния репозитория
**Найденные директории/файлы (по состоянию GitHub UI):**
- `attribution/` — доменный намёк на ядро.
- `API_keys_console_anthropic/` — **высокий риск**: название указывает на хранение ключей/документов с ключами.
- `full-dev-setup-with-claude-code/` — разработческий артефакт.
- `backup-claude-history.bat` — персональный бат‑скрипт в корне.

**Метрики проекта:**
- Commits: ~20; нет Issues/PR → отсутствует формализованный процесс.
- Languages mix: TS/Svelte/Go/Shell/PS1/JS — монорепо вероятен, но не структурирован.

**Вывод:** проект на раннем этапе, требуется упорядочивание и «жёсткая гигиена».

---

## 2) Архитектура: целевой эталон для high‑throughput атрибуции
### 2.1. Компоненты (микросервисы)
- **Edge Ingest** (Workers/Cloudflare, Fastly Compute@Edge, либо NGINX+Go на k8s) — приём SDK событий (click/install/session/open/postback). gRPC/HTTP/Protobuf, HMAC подпись, request‑sampling.
- **Event Gateway** (Go) — валидация/нормализация, обогащение (UA/Geo/ASN), публикация в Kafka/Redpanda.
- **Attribution Processor** (Go, Flink/Spark Structured Streaming или ksqlDB) — окна, дедуп, link‑matching, multi‑touch (LTA/UTA/Position‑Based), SKAd/GA4 postbacks, anti‑фрод.
- **Anti‑Fraud** — эвристики + ML‑фичи (velocity, entropy, IP/ASN репутация, device graph).
- **Storage layer**:
  - OLAP: **ClickHouse** (events, aggregates, retention tiers, TTL), партиции по дате/шардинг.
  - OLTP: **PostgreSQL** (тенанты, конфиг, пользователи, роли, интеграции).
  - Cache: **Redis** (idempotency keys, hot aggregates).
  - Object Store: **S3‑совместимое** (сырьё, бэкапы, parquet).
- **Public API** (Go): запросы отчётов, экспорты, webhooks.
- **Admin/Console** (SvelteKit 5): RBAC, конфиг источников/постбеков, отчёты.
- **Connectors**: AppStore/Play Referrer, ad‑networks postbacks, webhook sink’и (BigQuery/Snowflake).

### 2.2. Пропускная способность и масштабирование
- **500K RPS ingest**: горизонтальное масштабирование edge → gateway; zero‑copy I/O (Go, fasthttp), batch‑flush в Kafka; **back‑pressure** и circuit‑breakers.
- Kafka/Redpanda **N** брокеров, ретенции «сырых» событий ≥ 7–14 дней; **Exactly‑Once‑Semantics** через idempotent producers + transactional consumers.
- ClickHouse: шардинг по tenant_id+event_date, ReplicatedMergeTree, TTL для «холодных» партиций → S3.
- **SLO**: p99 ingest latency < 50–100ms, query p95 < 2s для топ‑дашбордов.

---

## 3) Структура репозитория (предложение для монорепо)
```
/apps
  /console (SvelteKit 5)
  /docs (Docusaurus/MkDocs)
/services
  /ingest-gw (Go)
  /attrib-processor (Go + stream)
  /public-api (Go)
  /anti-fraud (Go/Python ML)
/packages
  /sdk-js, /sdk-ios, /sdk-android
  /shared-proto (protobuf + buf)
  /shared-lib-ts (types, utils)
/infra
  /k8s (Helm charts)
  /terraform (cloud: AWS/GCP)
  /otel, /prometheus, /grafana
/.github
  /workflows (CI/CD pipelines)
/security
  /threat-model (STRIDE, DFD)
  /policies (RBAC, IAM, KMS)
/scripts (dx, local dev)
/CHANGELOG.md
/CODEOWNERS
/CONTRIBUTING.md
/SECURITY.md
```

---

## 4) Качество кода, стандарты, тестирование
- **TypeScript strict** + ESLint + Prettier + Husky (pre‑commit).
- **Go**: `go vet`, `golangci-lint`, `staticcheck`, `gofumpt`, `errgroup`/context timeouts повсюду.
- **Test Pyramid**: unit (≥70% крит. модулей), contract tests (protobuf/Buf), integration (Testcontainers), e2e (k6/Gatling для нагрузочных).
- **Security linters**: `gosec`, `semgrep` ruleset по OWASP ASVS.

---

## 5) CI/CD (GitHub Actions, пример пайплайнов)
- **Checks**: lint+typecheck+tests (matrix), CodeQL, Semgrep, Trivy (containers), Syft/Grype (SBOM/VEX).
- **Build**: Docker multi‑arch, image signing (cosign), provenance (SLSA L3+), push в GHCR/ECR.
- **Deploy**: ArgoCD/Flux (GitOps), среды `dev`→`stage`→`prod`, review‑apps для /apps/console.
- **Secrets**: OIDC→cloud roles, без статических ключей; `secrets scanning` + `push protection`.
- **Compliance**: artifact retention, release notes, conventional commits, changelog.

---

## 6) Безопасность и соответствие
- **Убрать из репозитория всё, что связано с ключами/личными данными.**
- Threat Modeling (STRIDE), DFD для ingest→storage→API.
- **RBAC/JWT** с Keycloak/Auth0; audit log (append‑only), scoped API tokens, per‑tenant encryption (KMS).
- **PII minimization**: хэширование/id‑маппинг, «privacy budget», Consent Management.
- Поддержка **ATT/SKAdNetwork**, Google Play Referrer; DPA, GDPR/CCPA, data retention и правo на удаление.
- Анти‑фрод: device/UA sanity, ASN/IP репутация, velocity фичи, бот‑сети, тренинги моделей (batch + online).

---

## 7) Модель данных и атрибуция
**События**: `click`, `impression`, `install`, `open`, `session_start`, `purchase`, `postback` …  
**Идентификаторы**: device_id (hashed), ad_id (GAID/IDFA где легально), install_referrer, campaign_id, utm*.  
**Окна дедупликации**: click→install 7–28 дней; impression→install 1–7 дней; configurable per‑partner.  
**Мульти‑тач**: LTA/UTA/position‑based; правила tie‑break; пост‑инсталляционные события (ROAS/LTV).  
**Схема ClickHouse**: партиции по `event_date`, сортировка (`tenant_id`, `event_ts`, `event_type`).

---

## 8) Наблюдаемость и эксплуатация (SRE)
- **OpenTelemetry** (traces/metrics/logs), Prometheus, Grafana, Tempo/Loki, exemplars.
- SLO/SLI: ingest availability, p99 latency, attribution time, query latency, error budgets.
- Алёрты: симптом‑ориентированные; runbooks; chaos‑дни; дрилл‑репетиции инцидентов.
- **Operational Maturity**: CMDB, change mgmt, incident mgmt (SEV), postmortems (blameless).

---

## 9) Процессы и роли (RACI)
- **Product Manager**: roadmap, MRD/PRD, KPI (DAU, ROAS, LTV lift).
- **Solution/Domain Architect**: DDD, интерфейсы, RFCs, схемы данных.
- **Platform/Infra Architect**: k8s, сетевой план, storage, GitOps.
- **Tech Lead(s)** по сервисам: код‑ревью, quality gates.
- **Data/ML**: фичестор, antifraud models, оффлайн‑тренинг.
- **Security** (AppSec/CloudSec): threat model, SDL, pentest‑план.
- **DevOps/SRE**: CI/CD, observability, capacity planning.
- **QA**: стратегия тестирования, e2e, perf, контрактные тесты.
- **DX**: шаблоны сервисов, скрипты, локальная среда (Tilt/Devbox).

---

## 10) План на 90 дней (high‑level)
**0–30 дней**: репо‑гигиена, CI/CD v1, ingest‑gw POC (50K RPS), ClickHouse POC, OTEL/Prometheus, базовая модель данных.  
**31–60 дней**: Kafka/Redpanda prod‑кластер, attrib‑processor v1 (single‑touch), анти‑фрод v1, RBAC/Auth, консоль MVP.  
**61–90 дней**: multi‑touch атрибуция, отчёты/экспорт, авто‑скейл, SLO, нагрузка 250–300K RPS, пилот с 1–2 сетями.

---

## 11) Конкретные action‑items
1. Очистить репозиторий: перенести dev‑артефакты в `/scripts`, удалить папку с ключами из git‑истории (BFG/`git filter-repo`).
2. Включить: Actions, Dependabot, Secret Scanning, CodeQL, Push Protection.
3. Завести `/infra/terraform` и `/infra/k8s`, прописать GitOps (ArgoCD).
4. Принять монорепо‑структуру (см. раздел 3), завести CODEOWNERS, CONTRIBUTING.md.
5. Прототипировать ingest‑gw (Go) + Kafka + ClickHouse; e2e цепочка.
6. Внедрить OpenTelemetry, Prometheus/Grafana; SLO и алёрты.
7. Проработать юридическую модель PII и согласия; DPA/политики хранения.
8. Подготовить Antifraud v1; включить rate‑limits и защёлки на API.
9. Подготовить RFC атрибуции (окна, приоритеты, multi‑touch).

---

## Приложение A — Пример GitHub Actions (схема)
- `ci.yaml`: lint, tests, typecheck, build, CodeQL, Semgrep, Syft/Grype, Trivy.
- `deploy.yaml`: build & sign images, push → registry, notify ArgoCD.
- `release.yaml`: semver, changelog, provenance (SLSA), GH Release.

## Приложение B — Пример схемы ClickHouse (упрощённо)
```sql
CREATE TABLE events
(
  tenant_id UInt32,
  event_date Date,
  event_ts   DateTime64(3, 'UTC'),
  event_type LowCardinality(String),
  device_id  FixedString(32),
  campaign_id String,
  attrs      JSON,
  _ingest_id UUID
)
ENGINE = ReplicatedMergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (tenant_id, event_date, event_ts, event_type)
SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1;
```

---

**Контакт для внедрения**: готов предоставить шаблоны Helm/Actions, прототипы ingest/processor, политику RBAC и примеры дашбордов.

