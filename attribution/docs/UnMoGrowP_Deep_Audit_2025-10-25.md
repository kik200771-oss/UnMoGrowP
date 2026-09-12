# UnMoGrowP — Полный технический аудит (глубокий)
**Дата:** 2025-10-25 (Europe/Kyiv)

## 0) Executive Summary
UnMoGrowP позиционируется как high‑performance платформа мобильной атрибуции (Svelte 5 + Go + Bun). Репозиторий сейчас публичен и демонстрирует заметную активность. Основные сильные стороны: современный фронтенд‑стек, задел под горизонтальное масштабирование и отдельный домен "attribution". Основные риски: отсутствующие/неполные CI/CD, формализованные контракты API, тестовое покрытие, безопасность секретов, а также процесс (Issues/PR/ADR). Ниже — детальный разбор и план доведения до production‑grade.

## 1) Обзор репозитория
- Основная ветка разработки: `feature/migrate-to-svelte` (миграция на Svelte 5).
- Тематика: mobile attribution / analytics / event‑ingestion / real‑time marketing tech.
- Языки: TypeScript, Svelte, Go, Python, Shell, JavaScript.
- Ключевые каталоги/артефакты: `attribution/`, `API_keys_console_anthropic/`, `full-dev-setup-with-claude-code/`, `backup-claude-history.bat`.

**Сильные стороны**
- Модерновый фронт (Svelte 5) и потенциально быстрый бэкенд (Go).
- Явный домен «атрибуции», намёк на событийную архитектуру.
- Нарастающая активность коммитов и публичность проекта.

**Зоны роста/риски**
- Нет формализованного процесса (Issues/PR/Review/ADR).
- Нет видимых CI/CD‑пайплайнов, CodeQL/Gitleaks.
- Потенциально чувствительные файлы/каталоги в дереве репозитория.
- Нет опубликованных OpenAPI/JSON Schema; риск дрейфа фронт↔бэк.
- Низкая наблюдаемость и отсутствие перф‑бюджетов.

## 2) Архитектура (целевой дизайн)
**2.1 Контекст**
- Клиенты (SDK/веб) → Ingestion (API) → Queue/Stream → Processors (атрибуция/фрод/агрегации) → Storage (DB/DataLake) → Query/API → Frontend (Svelte 5).
- Сервисность: разделить ingestion, атрибуцию, отчётность, антифрод, биллинг.

**2.2 Контейнеры**
- **Web App (Svelte 5/SvelteKit)**: UI, визуализации, операции с отчётами, фильтры, сегментация.
- **API Gateway (Go)**: авторизация (JWT + RBAC), маршрутизация в доменные сервисы.
- **Attribution Service (Go/Python)**: алгоритмы last‑touch / multi‑touch / probabilistic, окно атрибуции.
- **Events Ingestion (Go)**: высокая пропускная способность, валидация по JSON Schema, запись в log/queue.
- **Anti‑Fraud (Go/Python)**: правила, поведенческие сигнатуры, device fingerprint, ML‑флаги.
- **Storage**: OLTP (PostgreSQL), OLAP (ClickHouse/BigQuery/Redshift), Blob (S3‑совместимое).
- **Observability**: Prometheus + Grafana, OpenTelemetry, Sentry (FE/BE).

**2.3 Контракты и схемы**
- **OpenAPI 3.1** для HTTP‑эндпоинтов (ingest/query/admin).
- **JSON Schema** для событий (install, session_start, purchase, revenue, postback и т. д.).
- Версионирование `/v1` `/v2`; корреляционный ID; единый формат ошибок.

## 3) Фронтенд (Svelte 5) — миграция и структура
**3.1 Требования к миграции**
- Повсеместно перейти на руны: `$state`, `$derived`, `$effect`; устранить смешанный синтаксис Svelte 4/5.
- Обновить сторы (run‑based), заменить top‑level `let` на `$state()`.
- Проверить слоты/ивенты/`<svelte:component>`/транзишены.
- Если используется SvelteKit: `prepare: svelte-kit sync`, соглашения `+layout/+page`.

**3.2 Каталожная структура**
```
src/
  lib/
    api/            # typed API‑клиент, interceptors, ретраи, отмены
    components/     # UI‑примитивы (таблицы/чарты/формы)
    features/       # доменные фичи (attribution, cohorts, fraud, billing)
    stores/         # runes‑based stores
    utils/
  routes/           # SvelteKit маршруты (если используется)
```
**3.3 Качество UI**
- Ввести дизайн‑токены (цвета/типы/spacing), тёмную тему.
- Визуализации: лениво инициализировать тяжёлые графики, пагинация и серверные фильтры.

## 4) Бэкенд (Go) и Data Layer
**4.1 Входные контракты**
- JSON Schema‑валидация для всех типов событий (install, session, purchase, ad_impression/postback и т. д.).
- Поля трекинга: `eventId(uuid)`, `timestamp(ISO)`, `deviceId`, `campaign`, `source`, `country`, `os`, `appId`, `metadata`.

**4.2 Атрибуция**
- Алгоритмы: last‑touch (click/view), multi‑touch (U‑shape/linear/positional), probabilistic match (идентификаторы/фингерпринт).
- Окна: click‑through vs view‑through, пер‑канальные правила.
- Конфигурируемость на уровне приложения/кампании.

**4.3 Хранилища**
- **OLTP**: Postgres (transactional), **OLAP**: ClickHouse/BigQuery (агрегации/BI).
- **Event Log**: Kafka/Redpanda/NATS; партиционирование по времени/приложению/региону.
- TTL/Retention для «сырых» событий и агрегаций (стоимостная оптимизация).

## 5) Безопасность
- Переместить секреты в **secrets**/vault и удалить из Git; добавить `.env` и `.env.example`.
- Включить **Gitleaks** (CI) и **CodeQL** (статанализ).
- RBAC/JWT для панели; защита API‑ключей; rate‑limits/атаку‑устойчивость.
- CSP/Trusted Types для FE (если SPA/SSR).
- Политика инцидент‑респонса и журналирование админ‑действий.

## 6) CI/CD и релизы
- GitHub Actions: `typecheck` → `lint` → `test` → `build` → `docker build/push` → deploy.
- Обязательные статусы в PR, branch protection, автолейблы и авто‑merge dependabot‑патчей.
- Версионирование релизов (SemVer), changelog, релизные артефакты (front build, контейнеры).
- Environments: dev/stage/prod c секретами/переменными окружения.

## 7) Тестирование
- FE: unit (Vitest), e2e (Playwright), визуальные снапшоты (по желанию).
- BE: unit/integration (Go), контрактные тесты по OpenAPI/JSON Schema.
- Performance: K6/Gatling/JMeter сценарии на ingestion/query.
- Coverage: ≥70% по ключевым модулям, отчёты в PR.

## 8) Производительность и масштабирование
- Ленивые модули FE, code‑splitting, графики/карты — отложенная инициализация.
- Идентификаторы запросов, tracing, профилирование «узких мест».
- Batch‑ингест, компрессия/pipelining, бэк‑прешер в очередях.
- Перф‑бюджеты Lighthouse и бандл‑аналитика (vite‑bundle‑visualizer).

## 9) Observability
- FE: Sentry (ошибки/перф), логирование клиентских событий.
- BE: OpenTelemetry, Prometheus + Grafana, алёрты по SLO.
- Корреляционный ID сквозной (FE→API→сервисы→хранилище).

## 10) Документация и процесс
- `README` (как собрать/запустить), `ARCHITECTURE.md`, ADR в `/docs/adr/`.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, шаблоны Issues/PR.
- Диаграммы C4 (Context/Container/Component) + последовательности (диаграммы событий).

## 11) Риски (в порядке приоритета)
1. **Secrets в репозитории** → утечки и блокировки сторонних сервисов.
2. **Отсутствие CI/CD** → регрессии, нестабильность сборок, сложность релизов.
3. **Нет API‑контрактов** → дрейф фронт↔бэк, поломки интеграций.
4. **Недостаточное тестирование** → скрытые дефекты, осложнённый рефакторинг.
5. **Наблюдаемость/перф отсутствуют** → сложно расследовать инциденты и удерживать SLO.

## 12) План 30/60/90
**30 дней**
- Удалить секреты/артефакты из Git, добавить `.env(.example)`; включить Gitleaks/CodeQL.
- Ввести GitHub Actions (lint/typecheck/test/build), branch protection.
- Начальный OpenAPI/JSON Schema и 3–5 ключевых событий.

**60 дней**
- Контрактные тесты, генерация TS‑клиента из OpenAPI.
- Базовый антифрод/правила, атрибуция last‑touch; e2e‑тесты (FE).
- Наблюдаемость (Sentry/OTel/Prom+Grafana), перф‑бюджеты.

**90 дней**
- Версионирование API, multi‑touch атрибуция, первые ML‑сигналы.
- Прогон нагрузочных тестов и оптимизация ingestion/processing.
- Бета‑релиз с релизными артефактами и changelog.

## 13) Конкретные Action Items
- [ ] Перенести секреты в переменные/Secrets, удалить каталоги/скрипты с ключами.
- [ ] Добавить workflows: `ci.yml`, `gitleaks.yml`, `codeql.yml`.
- [ ] Включить Dependabot + авто‑merge патчей.
- [ ] Коммитнуть `openapi/openapi.yaml` и `schemas/events/*.json`.
- [ ] Добавить `vitest`, `@playwright/test`, smoke‑тесты FE и контрактные тесты BE.
- [ ] Включить Sentry (dsn через env), Prometheus метрики и кор‑ID.

## 14) Приложения

### 14.1 Пример JSON Schema (install)
```json
{
  "$id": "https://unmogrowp/schemas/event.install.json",
  "type": "object",
  "required": ["eventId", "timestamp", "deviceId", "campaign"],
  "properties": {
    "eventId": {"type":"string","format":"uuid"},
    "timestamp": {"type":"string","format":"date-time"},
    "deviceId": {"type":"string"},
    "campaign": {"type":"string"},
    "source": {"type":"string","enum":["ad_network","organic","cross"]},
    "metadata": {"type":"object","additionalProperties":true}
  },
  "additionalProperties": false
}
```

### 14.2 Минимальный OpenAPI (фрагмент)
```yaml
openapi: 3.1.0
info: { title: UnMoGrowP API, version: 0.2.0 }
paths:
  /health:
    get:
      operationId: health
      responses:
        '200': { description: OK }
  /events/ingest:
    post:
      operationId: ingestEvent
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '../schemas/events/install.json'
      responses:
        '202': { description: Accepted }
```

### 14.3 CI (минимум)
```yaml
name: ci
on:
  pull_request:
  push:
    branches: [ feature/migrate-to-svelte ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci || npm i
      - run: npm run typecheck --if-present
      - run: npm run lint --if-present
      - run: npm test --if-present -- --run
      - run: npm run build --if-present
```

### 14.4 API‑клиент (FE, TypeScript)
```ts
export async function api(path: string, init: RequestInit = {}) {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const res = await fetch(base + path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

### 14.5 Store (Svelte 5, пример)
```ts
export function createAppState() {
  let state = { ready: false };
  function setReady(v: boolean) { state.ready = v; }
  return { state, setReady };
}
```

— Конец отчёта —
