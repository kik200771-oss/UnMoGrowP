# Future-Proof Architecture для Greenfield Attribution Platform

**Дата:** 2025-10-20
**Тип документа:** Архитектурный blueprint
**Цель:** Создать масштабируемую, гибкую и адаптивную платформу атрибуции на 5-10 лет вперёд

---

## 📋 Executive Summary

Этот документ представляет детальный архитектурный план для создания современной платформы атрибуции трафика с нуля, учитывая:
- Ошибки и ограничения существующих решений (AppsFlyer, Adjust, Branch)
- Современные технологические тренды 2025
- Прогнозируемые тренды 2025-2030
- Масштабируемость до 100+ млрд событий в день
- Гибкость для быстрой адаптации к изменениям

**Ключевой принцип:** Избежать технологической блокировки (vendor/framework lock-in) при сохранении высокой производительности.

---

## 🎯 Оглавление

1. [Lessons Learned: Ошибки существующих платформ](#lessons-learned)
2. [Ключевые архитектурные принципы](#ключевые-архитектурные-принципы)
3. [Technology Stack 2025-2030](#technology-stack)
4. [Архитектурные слои](#архитектурные-слои)
5. [Data Pipeline Architecture](#data-pipeline-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Backend Architecture](#backend-architecture)
8. [Infrastructure & DevOps](#infrastructure-devops)
9. [Security & Privacy](#security-privacy)
10. [Migration Strategy](#migration-strategy)
11. [Team Structure](#team-structure)
12. [Risk Mitigation](#risk-mitigation)
13. [Timeline & Milestones](#timeline-milestones)

---

## 🚨 Lessons Learned: Ошибки существующих платформ

### AppsFlyer: что пошло не так

#### 1. Framework Lock-in (React)
**Проблема:**
- Застряли на React из-за миллионов строк кода
- Virtual DOM overhead для data-heavy UI
- Redux boilerplate и сложность state management
- Micro Frontends создали дополнительную сложность

**Урок:**
✅ Использовать framework-agnostic подход
✅ Минимизировать привязку к конкретному фреймворку
✅ Проектировать с учётом возможности миграции

#### 2. Monolithic Dashboard Architecture
**Проблема:**
- Единый монолитный frontend
- Сложно масштабировать разработку
- Длинные циклы деплоя
- Tight coupling между модулями

**Урок:**
✅ Использовать modular monolith или micro-frontends правильно
✅ Чёткие границы между доменами
✅ Independent deployment capabilities

#### 3. Visualization Technical Debt
**Проблема:**
- D3.js + React конфликт
- Плохая производительность на больших датасетах
- Сложность кастомизации графиков

**Урок:**
✅ Использовать специализированные библиотеки (ECharts, Plotly)
✅ WebGL для больших данных
✅ Declarative approach для графиков

#### 4. State Management Hell
**Проблема:**
- Redux complexity
- Over-normalization данных
- Selector performance issues
- Много boilerplate

**Урок:**
✅ Использовать современные state managers (Zustand, Jotai)
✅ Signals для fine-grained reactivity
✅ Server state отдельно от client state

#### 5. No Design System from Day 1
**Проблема:**
- Несогласованный UI/UX
- Дублирование компонентов
- Сложность поддержки

**Урок:**
✅ Design System с самого начала
✅ Atomic design methodology
✅ Component-driven development

### Другие платформы: паттерны проблем

#### Adjust: Performance Issues
- Медленные dashboard'ы при больших объёмах данных
- Long time-to-interactive (TTI)
- **Урок:** Оптимизация с первого дня, не после проблем

#### Branch: Complex Integration
- Сложный onboarding для разработчиков
- Плохая документация API
- **Урок:** Developer Experience = приоритет #1

#### Общие проблемы индустрии:
1. **Technical Debt накапливается незаметно**
2. **Недооценка сложности real-time визуализации**
3. **Отсутствие чёткой стратегии масштабирования**
4. **Игнорирование DevOps с самого начала**

---

## 🏗️ Ключевые архитектурные принципы

### 1. Framework Agnosticism
**Принцип:** Минимизировать зависимость от конкретных фреймворков

**Реализация:**
```typescript
// ❌ Плохо: tight coupling с React
import React from 'react';
export const MyComponent = () => <div>...</div>;

// ✅ Хорошо: framework-agnostic core
// core/business-logic.ts
export class AttributionEngine {
  calculateAttribution(events: Event[]): Attribution {
    // Pure business logic, no framework deps
  }
}

// adapters/svelte/AttributionWidget.svelte
// adapters/react/AttributionWidget.tsx
// adapters/vue/AttributionWidget.vue
```

**Слои изоляции:**
```
┌─────────────────────────────────────┐
│   UI Layer (Framework-specific)    │ ← Легко заменяемый
├─────────────────────────────────────┤
│   Adapter Layer (Abstraction)      │ ← Минимальная логика
├─────────────────────────────────────┤
│   Business Logic (Pure TS/JS)      │ ← Framework-agnostic
├─────────────────────────────────────┤
│   Data Layer (API clients)         │ ← Standardized interfaces
└─────────────────────────────────────┘
```

### 2. Progressive Enhancement Strategy
**Принцип:** Система должна работать на базовом уровне, улучшаясь при наличии возможностей

**Примеры:**
- Server-side rendering → Hydration → Client-side interactivity
- Static charts → Real-time updates → WebGL acceleration
- Basic analytics → Advanced ML predictions → AI insights

### 3. Data-First Architecture
**Принцип:** Оптимизация архитектуры для работы с большими объёмами данных

**Ключевые аспекты:**
- Streaming-first approach
- Event-driven architecture
- CQRS (Command Query Responsibility Segregation)
- Materialized views для быстрых запросов

### 4. Composability Over Inheritance
**Принцип:** Композиция вместо наследования на всех уровнях

```typescript
// ❌ Плохо: inheritance hell
class BaseChart extends Component {
  render() {...}
}
class LineChart extends BaseChart {...}
class AdvancedLineChart extends LineChart {...}

// ✅ Хорошо: composition
const Chart = compose(
  withData,
  withTooltip,
  withZoom,
  withExport
)(BaseChart);
```

### 5. Zero-Trust Security Model
**Принцип:** Безопасность на каждом слое, не полагаться на периметр

### 6. Observability by Design
**Принцип:** Мониторинг, логирование, трейсинг встроены с первого дня

### 7. Developer Experience First
**Принцип:** Если неудобно разработчикам, система не будет качественной

---

## 🔧 Technology Stack 2025-2030

### Frontend Core Stack

#### Framework: **SvelteKit** (с путями миграции)

**Почему Svelte:**
```
✅ Компиляция в vanilla JS (no runtime overhead)
✅ Fine-grained reactivity (faster than React)
✅ Smallest bundle size (~40 KB vs React 140 KB)
✅ Best DX в индустрии
✅ Растущая экосистема и enterprise adoption
✅ Web Components support (future-proof)
```

**Почему SvelteKit:**
```
✅ Full-stack framework (SSR + API routes)
✅ File-based routing
✅ Excellent performance
✅ Adapter system (deploy anywhere)
✅ Built-in code splitting
```

**Exit Strategy:**
```typescript
// Если нужна миграция, используем Adapter Pattern
// Все компоненты пишутся через интерфейсы

// @core/interfaces/IChart.ts
export interface IChart {
  data: ChartData;
  render(): void;
  update(data: ChartData): void;
}

// @adapters/svelte/Chart.svelte - текущая реализация
// @adapters/solid/Chart.tsx - альтернатива
// @adapters/web-components/Chart.ts - future migration path
```

**Альтернативный путь (если Svelte не подойдёт):**
- **Plan B:** Solid.js (похожий синтаксис, но ещё быстрее)
- **Plan C:** Web Components + Lit (полная framework independence)

#### State Management: **Signals + Zustand**

**Архитектура состояния:**
```typescript
// Signals для UI reactivity (встроено в Svelte 5+)
import { signal } from '@preact/signals-core';

const eventsCount = signal(0);

// Zustand для глобального app state
import { create } from 'zustand';

const useStore = create((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
}));

// TanStack Query для server state
import { useQuery } from '@tanstack/svelte-query';

const events = useQuery({
  queryKey: ['events'],
  queryFn: fetchEvents,
});
```

**Почему этот подход:**
- ✅ Signals: fine-grained reactivity без overhead
- ✅ Zustand: минимальный boilerplate для app state
- ✅ TanStack Query: best-in-class для server state
- ✅ Чёткое разделение ответственности

#### Data Visualization: **Apache ECharts + Observable Plot**

**Primary: Apache ECharts**
```typescript
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Tree-shaking: включаем только нужное
echarts.use([LineChart, BarChart, GridComponent, CanvasRenderer]);

// WebGL для больших данных (миллионы точек)
import { GraphGLChart } from 'echarts-gl/charts';
echarts.use([GraphGLChart]);
```

**Почему ECharts:**
- ✅ WebGL рендеринг (10M+ точек)
- ✅ 100+ типов графиков
- ✅ Декларативная конфигурация
- ✅ Enterprise-ready (Alibaba, Baidu)
- ✅ Отличная документация

**Secondary: Observable Plot**
```javascript
import * as Plot from '@observablehq/plot';

// Для быстрых exploratory визуализаций
const chart = Plot.plot({
  marks: [
    Plot.line(data, {x: 'date', y: 'value'})
  ]
});
```

**Почему Observable Plot:**
- ✅ Лаконичный синтаксис
- ✅ Быстрое прототипирование
- ✅ Хорошо для data exploration

#### Component Library: **Custom Design System**

**Подход:**
```
Base: shadcn/ui principles (copy-paste, не dependency)
Style: Tailwind CSS v4+ (CSS-first)
Icons: Lucide Icons (tree-shakeable)
Animations: Motion One (performance-first)
```

**Структура:**
```
packages/ui/
├── primitives/        # Headless components (Radix-like)
│   ├── Button/
│   ├── Select/
│   └── Dialog/
├── composed/          # Domain-specific components
│   ├── EventTable/
│   ├── AttributionChart/
│   └── FilterPanel/
└── themes/            # Customizable themes
    ├── default.css
    └── dark.css
```

**Почему Custom + shadcn подход:**
- ✅ Полный контроль над кодом
- ✅ Нет dependency bloat
- ✅ Легко кастомизировать
- ✅ Performance-first

#### Build Tool: **Vite 6+ / Turbopack**

**Primary: Vite**
```javascript
// vite.config.js
export default {
  plugins: [
    svelte(),
    wasm(), // WebAssembly support
  ],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-core': ['svelte'],
          'vendor-viz': ['echarts'],
        }
      }
    }
  }
}
```

**Почему Vite:**
- ✅ Мгновенный HMR
- ✅ ES modules в dev
- ✅ Rollup для production
- ✅ Plugin ecosystem

**Watching: Turbopack**
- Потенциально быстрее Vite
- Rust-based
- Интеграция с Next.js

#### Styling: **Tailwind CSS v4 + CSS Variables**

```css
/* Design tokens через CSS variables */
:root {
  --color-primary: oklch(60% 0.15 270);
  --spacing-unit: 0.25rem;
}

/* Tailwind для utility classes */
<div class="flex gap-4 p-[var(--spacing-unit)]">
```

**Почему Tailwind v4:**
- ✅ Lightning CSS engine (Rust)
- ✅ Native cascade layers
- ✅ Container queries
- ✅ Меньший bundle size

### Backend Core Stack

#### API Layer: **Bun + Hono**

**Почему Bun:**
```
✅ 3x быстрее Node.js
✅ Native TypeScript
✅ Built-in bundler, test runner
✅ Web standards API
✅ Low memory footprint
```

**Почему Hono:**
```typescript
import { Hono } from 'hono';

const app = new Hono();

app.get('/api/events', async (c) => {
  const events = await db.query('...');
  return c.json(events);
});

// Middleware
app.use('*', cors(), logger(), cache());

// WebSockets support
app.get('/ws', websocket());
```

**Преимущества Hono:**
- ✅ Ultra-fast (fastest JS framework)
- ✅ Multi-runtime (Bun, Deno, Node, Edge)
- ✅ TypeScript-first
- ✅ Express-like API

**Альтернатива:**
- **Plan B:** Fastify (если нужен Node.js)
- **Plan C:** Rust + Axum (maximum performance)

#### Real-time Layer: **WebSockets + Server-Sent Events**

```typescript
// WebSockets для bi-directional
import { websocket } from 'hono/websocket';

app.get('/ws/events', websocket((ws) => {
  ws.on('message', (msg) => {
    // Process event
    broadcastToClients(processed);
  });
}));

// SSE для server-to-client (проще, надёжнее)
app.get('/api/events/stream', (c) => {
  return c.stream(async (stream) => {
    for await (const event of eventSource) {
      await stream.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  });
});
```

#### Data Processing: **Rust + WebAssembly**

**Для тяжёлых вычислений:**
```rust
// attribution_engine.rs
#[wasm_bindgen]
pub fn calculate_attribution(events: &[Event]) -> Attribution {
    // Complex ML calculations
    // 10-100x faster than JavaScript
}
```

```typescript
// frontend: attribution.ts
import init, { calculate_attribution } from './wasm/attribution_engine.js';

await init();
const result = calculate_attribution(events);
```

**Почему WASM:**
- ✅ Near-native performance
- ✅ CPU-intensive вычисления
- ✅ Predictable performance
- ✅ Cross-platform

#### Data Storage Strategy

**Time-Series Data: ClickHouse**
```sql
-- Optimized for analytics queries
CREATE TABLE events (
    timestamp DateTime,
    event_type String,
    user_id UUID,
    properties String -- JSON
) ENGINE = MergeTree()
ORDER BY (timestamp, event_type)
PARTITION BY toYYYYMM(timestamp)
TTL timestamp + INTERVAL 90 DAY;
```

**Почему ClickHouse:**
- ✅ 100-1000x faster than PostgreSQL для аналитики
- ✅ Сжатие данных (10-30x)
- ✅ Горизонтальное масштабирование
- ✅ Real-time materialized views

**Operational Data: PostgreSQL + pgvector**
```sql
-- User accounts, configurations
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMPTZ
);

-- Vector embeddings для ML
CREATE EXTENSION vector;
CREATE TABLE embeddings (
    id UUID,
    embedding vector(1536)
);
```

**Cache Layer: Redis + Dragonfly**
```typescript
// Dragonfly - Redis-compatible, faster
import { createClient } from 'redis';

const cache = createClient({
  url: 'redis://dragonfly:6379'
});

// Cache hot data
await cache.set('events:summary', summary, { EX: 300 });
```

**Почему Dragonfly:**
- ✅ 25x faster than Redis
- ✅ Drop-in replacement
- ✅ Lower memory usage
- ✅ Multi-threaded

**Message Queue: Apache Kafka + Redpanda**
```typescript
// Redpanda - Kafka-compatible, но проще
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  brokers: ['redpanda:9092']
});

const producer = kafka.producer();
await producer.send({
  topic: 'attribution-events',
  messages: [{ value: JSON.stringify(event) }]
});
```

**Почему Redpanda:**
- ✅ 10x faster than Kafka
- ✅ No ZooKeeper dependency
- ✅ Lower latency
- ✅ Easier ops

### Infrastructure Stack

#### Container Orchestration: **Kubernetes + k3s (dev)**

```yaml
# Production: Full K8s
# Development: k3s (lightweight)

apiVersion: apps/v1
kind: Deployment
metadata:
  name: attribution-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: attribution-api:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
```

#### Service Mesh: **Istio / Linkerd**

**Для:**
- Traffic management
- Security (mTLS)
- Observability
- Resilience (circuit breakers)

#### Edge Network: **Cloudflare Workers**

```typescript
// Edge functions для:
// - A/B testing
// - Geo-routing
// - DDoS protection
// - Rate limiting

export default {
  async fetch(request: Request) {
    const country = request.cf?.country;

    // Route to nearest region
    const region = getRegion(country);
    return fetch(`https://${region}.api.attribution.io${request.url}`);
  }
};
```

**Почему Cloudflare:**
- ✅ 200+ locations worldwide
- ✅ < 5ms cold start
- ✅ DDoS protection
- ✅ Free tier generous

#### Monitoring Stack: **Grafana + Prometheus + Loki + Tempo**

```yaml
# Observability stack
- Grafana: Visualization
- Prometheus: Metrics
- Loki: Logs
- Tempo: Distributed tracing
- OpenTelemetry: Instrumentation
```

### Development Tools

#### Monorepo: **Turborepo**

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "cache": true
    },
    "dev": {
      "cache": false
    }
  }
}
```

**Структура:**
```
attribution-platform/
├── apps/
│   ├── dashboard/        # SvelteKit app
│   ├── admin/            # Admin panel
│   └── docs/             # Documentation
├── packages/
│   ├── ui/               # Design system
│   ├── core/             # Business logic
│   ├── api-client/       # API SDK
│   └── types/            # Shared types
└── services/
    ├── api/              # Bun + Hono
    ├── worker/           # Background jobs
    └── stream/           # Real-time processor
```

**Почему Turborepo:**
- ✅ Fastest build tool
- ✅ Smart caching
- ✅ Remote caching (Vercel)
- ✅ Task pipelines

#### Testing Strategy

**Unit Tests: Vitest**
```typescript
import { describe, it, expect } from 'vitest';

describe('AttributionEngine', () => {
  it('calculates last-click attribution', () => {
    const result = calculateAttribution(events);
    expect(result.source).toBe('google_ads');
  });
});
```

**E2E Tests: Playwright**
```typescript
import { test, expect } from '@playwright/test';

test('user can filter events', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('[data-test="filter-button"]');
  await expect(page.locator('.event-row')).toHaveCount(5);
});
```

**Visual Regression: Chromatic**
```typescript
// Автоматическая проверка UI изменений
// Интеграция с Storybook
```

#### CI/CD: **GitHub Actions + Argo CD**

```yaml
# .github/workflows/ci.yml
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bun install
      - run: bun test
      - run: bun run build
```

---

## 🏛️ Архитектурные слои

### Hexagonal Architecture (Ports & Adapters)

```
┌────────────────────────────────────────────────────────┐
│                   Presentation Layer                   │
│              (Svelte Components, UI)                   │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│                   Application Layer                    │
│         (Use Cases, Application Services)              │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│                    Domain Layer                        │
│         (Business Logic, Domain Models)                │
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │   Attribution Engine (Pure Logic)            │     │
│  │   - Last Click                               │     │
│  │   - Multi-Touch                              │     │
│  │   - Data-Driven                              │     │
│  └──────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│                 Infrastructure Layer                   │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ClickHouse│  │PostgreSQL│  │  Redis   │           │
│  └──────────┘  └──────────┘  └──────────┘           │
└────────────────────────────────────────────────────────┘
```

### CQRS Pattern для масштабируемости

```typescript
// Command Side (Write)
class CreateEventCommand {
  execute(event: Event) {
    // Validate
    // Persist to Kafka
    // Return immediately
  }
}

// Query Side (Read)
class GetEventsQuery {
  execute(filters: Filters) {
    // Read from materialized view
    // Fast, optimized
  }
}
```

**Разделение:**
- **Commands:** Kafka → ClickHouse (write-optimized)
- **Queries:** Materialized Views → Cache → Response

### Event-Driven Architecture

```typescript
// Domain Events
class EventReceivedEvent {
  constructor(
    public readonly eventId: string,
    public readonly timestamp: Date,
    public readonly data: EventData
  ) {}
}

// Event Handlers
class AttributionHandler {
  async handle(event: EventReceivedEvent) {
    const attribution = await this.engine.calculate(event);
    await this.publisher.publish(new AttributionCalculatedEvent(attribution));
  }
}
```

**Event Flow:**
```
User Action → Event Emitted → Kafka Topic → Multiple Handlers
                                                  │
                    ┌─────────────────────────────┼─────────────────┐
                    ▼                             ▼                 ▼
            Attribution Engine            Fraud Detection    Analytics Update
```

---

## 📊 Data Pipeline Architecture

### Stream Processing Pipeline

```
┌──────────────┐
│  SDK/Client  │
└──────┬───────┘
       │ HTTPS POST
       ▼
┌──────────────┐
│  Edge (CF)   │ ← Rate limit, geo-route
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  API Gateway │ ← Auth, validation
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Kafka     │ ← Buffer, decouple
└──────┬───────┘
       │
       ├────────────────────────────────┐
       ▼                                ▼
┌──────────────┐              ┌──────────────┐
│   Flink/     │              │  ClickHouse  │
│ Spark Stream │              │    (Raw)     │
└──────┬───────┘              └──────────────┘
       │ Process, enrich
       ▼
┌──────────────┐
│  ClickHouse  │
│ (Aggregated) │
└──────────────┘
       │
       ▼
┌──────────────┐
│  Dashboard   │
│  (Real-time) │
└──────────────┘
```

### Batch Processing Layer (Lambda Architecture)

```typescript
// Real-time: Flink
const stream = env
  .addSource(kafkaSource)
  .keyBy(event => event.userId)
  .window(TumblingEventTimeWindows.of(Time.minutes(5)))
  .aggregate(new AttributionAggregator());

// Batch: Spark (nightly)
spark.read
  .format('clickhouse')
  .load()
  .groupBy('date', 'source')
  .agg(
    count('*').as('events'),
    sum('revenue').as('total_revenue')
  )
  .write
  .format('clickhouse')
  .mode('overwrite')
  .save();
```

### Data Quality Pipeline

```typescript
// Great Expectations для валидации
const suite = {
  expectations: [
    {
      expectation_type: 'expect_column_values_to_not_be_null',
      column: 'event_id'
    },
    {
      expectation_type: 'expect_column_values_to_be_in_set',
      column: 'event_type',
      value_set: ['click', 'impression', 'install']
    }
  ]
};

// Автоматическая проверка каждого батча
```

---

## 🎨 Frontend Architecture (детально)

### Component Architecture

```typescript
// Atomic Design + Smart/Dumb pattern

// Atoms (базовые элементы)
// ui/primitives/Button.svelte
<script lang="ts">
  export let variant: 'primary' | 'secondary' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
</script>

<button class={`btn btn-${variant} btn-${size}`}>
  <slot />
</button>

// Molecules (композиция атомов)
// ui/composed/SearchInput.svelte
<script>
  import Button from '$ui/primitives/Button.svelte';
  import Input from '$ui/primitives/Input.svelte';
</script>

<div class="search">
  <Input bind:value={query} placeholder="Search..." />
  <Button on:click={handleSearch}>Search</Button>
</div>

// Organisms (комплексные компоненты)
// features/events/EventsTable.svelte
<script>
  import Table from '$ui/composed/Table.svelte';
  import Pagination from '$ui/composed/Pagination.svelte';

  export let events: Event[];
</script>

<div>
  <Table data={events} columns={columns} />
  <Pagination total={total} page={page} />
</div>

// Pages (композиция organisms)
// routes/dashboard/+page.svelte
<script>
  import EventsTable from '$features/events/EventsTable.svelte';
  import MetricsCards from '$features/metrics/MetricsCards.svelte';
</script>

<MetricsCards />
<EventsTable />
```

### State Management Patterns

```typescript
// 1. Local State (Svelte)
<script>
  let count = 0; // reactive
</script>

// 2. Global App State (Zustand)
// stores/app.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'app-storage' }
  )
);

// 3. Server State (TanStack Query)
// api/events.ts
import { useQuery, useMutation } from '@tanstack/svelte-query';

export const useEvents = (filters) => {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => fetchEvents(filters),
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // 1 minute
  });
};

// 4. Real-time State (WebSockets + Signals)
// stores/realtime.ts
import { signal } from '@preact/signals-core';

export const liveEvents = signal<Event[]>([]);

const ws = new WebSocket('wss://api/events/stream');
ws.onmessage = (msg) => {
  const event = JSON.parse(msg.data);
  liveEvents.value = [event, ...liveEvents.value].slice(0, 100);
};
```

### Routing Strategy

```typescript
// SvelteKit file-based routing
src/routes/
├── +layout.svelte           // Root layout
├── +page.svelte             // Home (/)
├── dashboard/
│   ├── +layout.svelte       // Dashboard layout
│   ├── +page.svelte         // /dashboard
│   ├── events/
│   │   ├── +page.svelte     // /dashboard/events
│   │   └── [id]/
│   │       └── +page.svelte // /dashboard/events/:id
│   └── analytics/
│       └── +page.svelte     // /dashboard/analytics
└── api/                      // API routes
    ├── events/
    │   └── +server.ts       // /api/events
    └── health/
        └── +server.ts       // /api/health

// Dynamic imports для code splitting
<script>
  import { onMount } from 'svelte';

  let EventsTable;

  onMount(async () => {
    // Lazy load heavy component
    const module = await import('./EventsTable.svelte');
    EventsTable = module.default;
  });
</script>
```

### Performance Optimization Strategies

```typescript
// 1. Virtual Scrolling для больших списков
import { createVirtualizer } from '@tanstack/svelte-virtual';

const virtualizer = createVirtualizer({
  count: events.length,
  getScrollElement: () => parentRef,
  estimateSize: () => 50,
  overscan: 5,
});

// 2. Debouncing поиска
import { debounce } from 'lodash-es';

const handleSearch = debounce((query) => {
  // Search logic
}, 300);

// 3. Web Workers для тяжёлых вычислений
// workers/processor.ts
self.onmessage = (e) => {
  const processed = heavyComputation(e.data);
  self.postMessage(processed);
};

// Usage
const worker = new Worker('/workers/processor.js');
worker.postMessage(data);
worker.onmessage = (e) => {
  results = e.data;
};

// 4. Image optimization
<script>
  import { onMount } from 'svelte';

  let imgSrc;

  onMount(() => {
    // Lazy load images
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          imgSrc = entry.target.dataset.src;
        }
      });
    });

    observer.observe(imgElement);
  });
</script>

<img data-src={originalSrc} src={imgSrc} alt="" />

// 5. Service Worker для offline support
// service-worker.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

// Cache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Network first для API
registerRoute(
  /^https:\/\/api\./,
  new NetworkFirst()
);

// Cache first для изображений
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif)$/,
  new CacheFirst()
);
```

---

## 🔒 Security & Privacy Architecture

### Multi-Layer Security

```typescript
// 1. Edge Layer (Cloudflare)
// - DDoS protection
// - Rate limiting
// - Bot detection
// - WAF rules

// 2. API Gateway Layer
// - Authentication (JWT)
// - Authorization (RBAC)
// - Input validation
// - Request sanitization

import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { validator } from 'hono/validator';
import { z } from 'zod';

const app = new Hono();

// JWT auth middleware
app.use('/api/*', jwt({
  secret: process.env.JWT_SECRET!,
}));

// Request validation
const eventSchema = z.object({
  event_type: z.enum(['click', 'impression', 'install']),
  timestamp: z.string().datetime(),
  user_id: z.string().uuid(),
});

app.post(
  '/api/events',
  validator('json', (value, c) => {
    const parsed = eventSchema.safeParse(value);
    if (!parsed.success) {
      return c.json({ error: parsed.error }, 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const event = c.req.valid('json');
    // Process event
  }
);

// 3. Application Layer
// - Business logic authorization
// - Data access control
// - Audit logging

class AuthorizationService {
  canAccessEvent(user: User, event: Event): boolean {
    // Check permissions
    if (user.role === 'admin') return true;
    if (event.organizationId !== user.organizationId) return false;
    return true;
  }
}

// 4. Data Layer
// - Encryption at rest
// - Row-level security
// - PII masking

// PostgreSQL RLS
CREATE POLICY user_isolation ON events
  USING (organization_id = current_setting('app.current_organization')::uuid);
```

### Privacy by Design

```typescript
// 1. Data Minimization
interface Event {
  id: string;
  type: string;
  timestamp: Date;
  // NO: email, phone, precise location
  // YES: hashed user_id, country-level geo
  userId: string; // SHA-256 hash
  country: string; // Only country, not city
}

// 2. Consent Management
class ConsentManager {
  async checkConsent(userId: string, purpose: string): Promise<boolean> {
    const consent = await db.consent.findUnique({
      where: { userId, purpose }
    });
    return consent?.granted ?? false;
  }

  async trackingAllowed(userId: string): Promise<boolean> {
    // Check GDPR/CCPA consent
    return this.checkConsent(userId, 'tracking');
  }
}

// 3. Data Retention
// ClickHouse TTL
CREATE TABLE events (
  ...
) ENGINE = MergeTree()
TTL timestamp + INTERVAL 90 DAY DELETE,
    timestamp + INTERVAL 30 DAY TO DISK 'cold';

// 4. PII Anonymization
class PIIService {
  async anonymize(data: any): Promise<any> {
    return {
      ...data,
      email: this.hashEmail(data.email),
      ip: this.maskIP(data.ip),
      deviceId: this.hashDeviceId(data.deviceId),
    };
  }

  private hashEmail(email: string): string {
    return crypto.createHash('sha256').update(email).digest('hex');
  }

  private maskIP(ip: string): string {
    // IPv4: 192.168.1.1 → 192.168.0.0
    return ip.split('.').slice(0, 2).join('.') + '.0.0';
  }
}

// 5. Privacy-Preserving Analytics
// Differential Privacy
class DifferentialPrivacy {
  addNoise(value: number, epsilon: number = 0.1): number {
    const noise = this.laplacianNoise(1 / epsilon);
    return value + noise;
  }

  private laplacianNoise(scale: number): number {
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }
}
```

### Compliance Features

```typescript
// GDPR Compliance
class GDPRService {
  // Right to Access
  async exportUserData(userId: string): Promise<UserData> {
    return {
      profile: await db.users.findUnique({ where: { id: userId } }),
      events: await db.events.findMany({ where: { userId } }),
      consents: await db.consents.findMany({ where: { userId } }),
    };
  }

  // Right to Erasure
  async deleteUserData(userId: string): Promise<void> {
    await db.$transaction([
      db.events.deleteMany({ where: { userId } }),
      db.consents.deleteMany({ where: { userId } }),
      db.users.update({
        where: { id: userId },
        data: {
          email: '[deleted]',
          deletedAt: new Date(),
        }
      }),
    ]);
  }

  // Right to Portability
  async exportToJSON(userId: string): Promise<string> {
    const data = await this.exportUserData(userId);
    return JSON.stringify(data, null, 2);
  }
}

// SOC 2 Compliance
class AuditLogger {
  async log(action: string, user: User, details: any) {
    await db.auditLog.create({
      data: {
        action,
        userId: user.id,
        timestamp: new Date(),
        ip: details.ip,
        userAgent: details.userAgent,
        details: JSON.stringify(details),
      }
    });
  }
}
```

---

## 🚀 Deployment & Infrastructure

### Multi-Region Architecture

```
Global Edge (Cloudflare Workers)
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
  US-East  EU-West  APAC
    │       │       ▼
    │       │    Regional API
    │       │       │
    │       └───────┼───────┐
    │               ▼       ▼
    └──────────> Global DB  Regional Cache
               (ClickHouse)  (Redis)
```

### Kubernetes Configuration

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: attribution-api
  labels:
    app: attribution-api
spec:
  replicas: 5
  selector:
    matchLabels:
      app: attribution-api
  template:
    metadata:
      labels:
        app: attribution-api
    spec:
      containers:
      - name: api
        image: attribution-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: attribution-api
spec:
  selector:
    app: attribution-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: attribution-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: attribution-api
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### GitOps with Argo CD

```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: attribution-platform
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/kik200771-oss/UnMoGrowP
    targetRevision: main
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

### Monitoring & Observability

```typescript
// OpenTelemetry instrumentation
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

const sdk = new NodeSDK({
  traceExporter: new PrometheusExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

// Custom metrics
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('attribution-api');
const eventCounter = meter.createCounter('events_processed');
const latencyHistogram = meter.createHistogram('api_latency');

app.use(async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  latencyHistogram.record(duration, {
    route: c.req.path,
    method: c.req.method,
    status: c.res.status,
  });
});
```

---

## 📈 Migration Strategy (Exit Plan)

### Phase 1: Parallel Run (6 months)

```
Old System (React)     New System (Svelte)
      │                       │
      │                       │
   Users ──────────┬──────────┘
                   │
            Traffic Split (10%)
```

**Tasks:**
1. Deploy new system to 10% users
2. Compare metrics (performance, errors)
3. Gather feedback
4. Fix issues

### Phase 2: Gradual Migration (12 months)

```
Month 1-3:   10% → 25%
Month 4-6:   25% → 50%
Month 7-9:   50% → 75%
Month 10-12: 75% → 100%
```

### Phase 3: Framework Migration Path

**If need to migrate from Svelte:**

```typescript
// Step 1: Extract business logic to framework-agnostic core
// @core/attribution-engine.ts
export class AttributionEngine {
  calculate(events: Event[]): Attribution {
    // Pure TypeScript, no framework dependency
  }
}

// Step 2: Create adapters for new framework
// @adapters/solid/AttributionWidget.tsx (new)
import { AttributionEngine } from '@core/attribution-engine';

export function AttributionWidget(props) {
  const engine = new AttributionEngine();
  const result = engine.calculate(props.events);

  return <div>{result.source}</div>;
}

// @adapters/svelte/AttributionWidget.svelte (old - still works)
import { AttributionEngine } from '@core/attribution-engine';

const engine = new AttributionEngine();
$: result = engine.calculate(events);

<div>{result.source}</div>

// Step 3: Gradually replace adapters
// Both versions coexist, migrate route by route
```

### Web Components as Ultimate Exit Strategy

```typescript
// @components/attribution-widget.ts
class AttributionWidget extends HTMLElement {
  connectedCallback() {
    const events = JSON.parse(this.getAttribute('events') || '[]');
    const engine = new AttributionEngine();
    const result = engine.calculate(events);

    this.innerHTML = `<div>${result.source}</div>`;
  }
}

customElements.define('attribution-widget', AttributionWidget);

// Use in ANY framework (or no framework)
// React:
<attribution-widget events={JSON.stringify(events)} />

// Svelte:
<attribution-widget events={JSON.stringify(events)} />

// Vue:
<attribution-widget :events="JSON.stringify(events)" />

// Vanilla:
<attribution-widget events='[...]'></attribution-widget>
```

---

## 👥 Team Structure & Responsibilities

### Recommended Team Composition

```
Platform Engineering (50 people total)
│
├── Frontend Team (15 people)
│   ├── Dashboard Team (8)
│   │   ├── 2x Senior Engineers
│   │   ├── 4x Engineers
│   │   └── 2x Junior Engineers
│   │
│   ├── Design System Team (4)
│   │   ├── 1x Staff Engineer
│   │   ├── 2x Engineers
│   │   └── 1x Designer
│   │
│   └── Data Viz Team (3)
│       ├── 1x Senior Engineer
│       └── 2x Engineers
│
├── Backend Team (20 people)
│   ├── API Team (8)
│   ├── Data Pipeline Team (8)
│   └── ML/Attribution Team (4)
│
├── Platform/DevOps Team (10 people)
│   ├── Infrastructure (4)
│   ├── Security (3)
│   └── Observability (3)
│
└── QA Team (5 people)
    ├── Automation (3)
    └── Manual Testing (2)
```

### Skill Matrix

| Role | Required Skills | Nice to Have |
|------|----------------|--------------|
| **Frontend Engineer** | TypeScript, Svelte, TanStack Query | WebAssembly, WebGL, Performance tuning |
| **Backend Engineer** | TypeScript/Rust, Bun/Hono, Kafka | ClickHouse, Flink, Kubernetes |
| **Data Engineer** | SQL, Python, Spark | ClickHouse, Kafka Streams, Airflow |
| **DevOps Engineer** | Kubernetes, Terraform, CI/CD | Istio, Argo CD, Prometheus |
| **ML Engineer** | Python, PyTorch, Statistics | Rust, Production ML, Feature Engineering |

### Development Workflow

```
1. Feature Request
   ↓
2. Design Review (Team Lead + Architect)
   ↓
3. Implementation (Engineer)
   ├→ Write code
   ├→ Write tests
   ├→ Write docs
   └→ Create PR
   ↓
4. Code Review (2 approvals required)
   ↓
5. Automated Tests (CI)
   ├→ Unit tests
   ├→ Integration tests
   ├→ E2E tests
   └→ Performance tests
   ↓
6. Deploy to Staging (Argo CD)
   ↓
7. QA Testing
   ↓
8. Deploy to Production (Canary)
   ├→ 5% traffic
   ├→ Monitor 24h
   ├→ 25% traffic
   ├→ Monitor 24h
   └→ 100% traffic
```

---

## ⚠️ Risk Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Svelte ecosystem immaturity** | Medium | Medium | • Maintain abstraction layer<br>• Plan B: Solid.js<br>• Plan C: Web Components |
| **Performance issues at scale** | Low | High | • Load testing from day 1<br>• Horizontal scaling<br>• Caching layers |
| **Data pipeline failures** | Medium | High | • Kafka for buffering<br>• Dead letter queues<br>• Automated retries |
| **Security breach** | Low | Critical | • Multi-layer security<br>• Regular audits<br>• Bug bounty program |
| **Team skill gaps** | Medium | Medium | • Training program<br>• Pair programming<br>• External consultants |

### Business Risks

| Risk | Mitigation |
|------|-----------|
| **Slow adoption** | • Excellent onboarding<br>• Clear docs<br>• Migration tools |
| **Competitor innovation** | • Rapid iteration<br>• Customer feedback loops<br>• R&D budget |
| **Regulatory changes** | • Privacy by design<br>• Compliance team<br>• Flexible architecture |

### Contingency Plans

```typescript
// 1. Framework Migration Plan
if (svelteProblematic) {
  // Option A: Solid.js (similar syntax)
  migrateTo('solid-js', { effort: 'medium', time: '6 months' });

  // Option B: Web Components (framework-free)
  migrateTo('web-components', { effort: 'high', time: '12 months' });
}

// 2. Database Migration Plan
if (clickhouseIssues) {
  // Option A: TimescaleDB
  migrateTo('timescaledb', { effort: 'medium' });

  // Option B: Apache Druid
  migrateTo('druid', { effort: 'high' });
}

// 3. Infrastructure Migration Plan
if (k8sComplexity) {
  // Option A: Simplified setup
  useManagedService('GKE', 'EKS', or 'AKS');

  // Option B: Serverless
  migrateTo('cloudflare-workers + vercel', { effort: 'medium' });
}
```

---

## 📅 Timeline & Milestones

### Phase 1: Foundation (Months 1-3)

**Goals:**
- Setup infrastructure
- Core architecture
- Design system v1

**Deliverables:**
```
✓ Monorepo setup (Turborepo)
✓ CI/CD pipeline (GitHub Actions)
✓ K8s cluster (staging + prod)
✓ Database setup (ClickHouse + PostgreSQL)
✓ Design System (20 components)
✓ Authentication system
✓ Basic dashboard (read-only)
```

**Team:** 10 people (5 frontend, 3 backend, 2 DevOps)

### Phase 2: Core Features (Months 4-6)

**Goals:**
- Event ingestion
- Basic attribution
- Real-time dashboard

**Deliverables:**
```
✓ SDK (JavaScript, iOS, Android)
✓ Event ingestion API
✓ Kafka pipeline
✓ Attribution engine (last-click)
✓ Real-time dashboard
✓ User management
✓ Organization management
```

**Team:** 20 people (8 frontend, 8 backend, 2 data, 2 DevOps)

### Phase 3: Advanced Features (Months 7-12)

**Goals:**
- Multi-touch attribution
- ML models
- Advanced analytics

**Deliverables:**
```
✓ Multi-touch attribution
✓ Data-driven attribution (ML)
✓ Fraud detection
✓ Custom reports
✓ API for customers
✓ Webhooks
✓ Slack/Email alerts
```

**Team:** 35 people (full team ramped up)

### Phase 4: Scale & Optimize (Months 13-18)

**Goals:**
- 100B+ events/day
- Sub-second queries
- 99.99% uptime

**Deliverables:**
```
✓ Multi-region deployment
✓ Advanced caching
✓ Query optimization
✓ WebAssembly for complex calculations
✓ Performance monitoring
✓ Cost optimization
```

### Phase 5: Enterprise Features (Months 19-24)

**Goals:**
- Enterprise-ready
- Compliance certifications
- Advanced integrations

**Deliverables:**
```
✓ SOC 2 Type II certification
✓ GDPR compliance tools
✓ SSO (SAML, OIDC)
✓ Advanced RBAC
✓ Audit logs
✓ Data residency options
✓ 100+ integrations
```

---

## 💰 Cost Estimation

### Infrastructure Costs (Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| **Kubernetes (GKE/EKS)** | 50 nodes | $5,000 |
| **ClickHouse** | 10TB data | $3,000 |
| **PostgreSQL (RDS)** | 500GB | $500 |
| **Redis (ElastiCache)** | 50GB | $300 |
| **Kafka (MSK)** | 10 brokers | $2,000 |
| **Cloudflare** | Enterprise | $2,000 |
| **S3/GCS** | 50TB | $1,000 |
| **Monitoring** | Grafana Cloud | $500 |
| **CI/CD** | GitHub Actions | $200 |
| **CDN** | Cloudflare | $500 |
| **Total** | | **$15,000/month** |

**At scale (100B events/day):** ~$50,000/month

### Development Costs (Annual)

| Role | Count | Avg Salary | Total |
|------|-------|-----------|-------|
| **Frontend Engineers** | 15 | $120k | $1.8M |
| **Backend Engineers** | 20 | $130k | $2.6M |
| **DevOps Engineers** | 10 | $140k | $1.4M |
| **QA Engineers** | 5 | $90k | $450k |
| **Engineering Managers** | 5 | $180k | $900k |
| **Product Managers** | 3 | $150k | $450k |
| **Designers** | 3 | $110k | $330k |
| **Data Scientists** | 4 | $150k | $600k |
| **Total** | 65 | | **$8.53M/year** |

### Total Investment

**Year 1:** ~$8.7M (team + infra)
**Year 2:** ~$9.5M (scale + hiring)
**Year 3:** ~$11M (full scale)

---

## 🎓 Conclusion & Recommendations

### Key Takeaways

1. **Framework Choice: Svelte + SvelteKit**
   - Best performance for data-heavy dashboards
   - Excellent DX
   - Growing ecosystem
   - Clear exit strategy via Web Components

2. **State Management: Signals + Zustand + TanStack Query**
   - Fine-grained reactivity
   - Minimal boilerplate
   - Clear separation of concerns

3. **Visualization: Apache ECharts**
   - Best performance (WebGL)
   - 100+ chart types
   - Production-ready

4. **Backend: Bun + Hono**
   - Excellent performance
   - TypeScript-first
   - Modern APIs

5. **Data: ClickHouse + PostgreSQL + Kafka**
   - Optimized for analytics
   - Proven at scale
   - Strong ecosystem

### Success Factors

✅ **Start simple, scale gradually**
✅ **Design System from day 1**
✅ **Observability built-in**
✅ **Clear abstraction layers**
✅ **Exit strategies for every major dependency**
✅ **Performance testing from the start**
✅ **Security by design**
✅ **Developer Experience = Priority**

### Anti-Patterns to Avoid

❌ Premature micro-frontends
❌ Over-engineering
❌ Ignoring performance until it's a problem
❌ No design system
❌ Tight framework coupling
❌ Poor documentation
❌ Skipping tests
❌ Manual deployments

### Future-Proofing Checklist

- [ ] Framework-agnostic business logic
- [ ] Web Components as escape hatch
- [ ] WASM for compute-heavy tasks
- [ ] Signals-based reactivity (future standard)
- [ ] Edge-first architecture
- [ ] Multi-region from day 1
- [ ] API versioning strategy
- [ ] Clear upgrade paths
- [ ] Comprehensive docs
- [ ] Automated everything

---

## 📚 Additional Resources

### Learning Resources

**Svelte:**
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [SvelteKit Docs](https://kit.svelte.dev/)
- [Svelte Society](https://sveltesociety.dev/)

**Data Visualization:**
- [Apache ECharts Docs](https://echarts.apache.org/handbook/en/get-started/)
- [Observable Plot](https://observablehq.com/plot/)

**Backend:**
- [Bun Documentation](https://bun.sh/docs)
- [Hono Guide](https://hono.dev/)

**Architecture:**
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)

### Tools & Libraries

**Frontend:**
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://github.com/pmndrs/zustand)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Motion One](https://motion.dev/)

**Backend:**
- [ClickHouse](https://clickhouse.com/docs)
- [Redpanda](https://docs.redpanda.com/)
- [Dragonfly](https://www.dragonflydb.io/)

**DevOps:**
- [Kubernetes](https://kubernetes.io/docs/)
- [Argo CD](https://argo-cd.readthedocs.io/)
- [Terraform](https://www.terraform.io/docs)

---

**Последнее обновление:** 2025-10-20
**Версия документа:** 1.0
**Авторы:** Architecture Team
**Статус:** Ready for Review

---

## Appendix A: Code Examples Repository

Полные примеры кода доступны в репозитории:
```
https://github.com/kik200771-oss/UnMoGrowP
```

## Appendix B: Decision Log

Все архитектурные решения документируются в:
```
/docs/architecture/decisions/
```

Format: Architecture Decision Records (ADR)

## Appendix C: Glossary

**Attribution:** Процесс определения источника, приведшего к конверсии
**CQRS:** Command Query Responsibility Segregation
**Event Sourcing:** Сохранение всех изменений как последовательности событий
**Fine-grained Reactivity:** Обновление только изменившихся DOM-узлов
**Signals:** Примитив для реактивного программирования
**WebAssembly (WASM):** Бинарный формат для выполнения кода в браузере

---

**END OF DOCUMENT**
