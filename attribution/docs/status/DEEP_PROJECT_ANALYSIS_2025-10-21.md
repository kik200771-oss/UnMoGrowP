# Глубокий анализ проекта UnMoGrowP Attribution Platform
## Несоответствия, находки и план миграции на Svelte 5 + Go + Bun

> **Дата анализа:** 21 октября 2025
> **Выполнил:** Product Manager Agent (по запросу пользователя)
> **Статус:** 🚨 КРИТИЧЕСКИЕ НЕСООТВЕТСТВИЯ ОБНАРУЖЕНЫ

---

## 📋 Executive Summary

**Проблема:** Проект начинался с одним технологическим стеком (Svelte 5 + Go + Bun), но был реализован на другом (Next.js + React), при этом:
- ✅ **11 AI-агентов** в `.claude/commands/` настроены на исходный стек
- ✅ **350+ страниц документации** в `DOCUMENTS/` описывают исходный стек
- ❌ **Текущая реализация** (app/) использует другой стек
- ❌ **Backend и ML** не созданы вообще

**Критичность:** ВЫСОКАЯ — несоответствие между планами, агентами и реализацией

---

## 🔍 Детальные находки

### 1. `.claude/commands/` — Команда из 11 AI-агентов

**Расположение:** `C:\КОДИНГ\attribution\.claude\commands\`

**Обнаружено:** 11 специализированных AI-агентов (237 KB промптов)

| # | Агент | Файл | Размер | Ожидаемый стек |
|---|-------|------|--------|----------------|
| 1 | `/orchestrator` | orchestrator.md | 23 KB | Координатор команды |
| 2 | `/pm` | pm.md | 11 KB | Product Manager |
| 3 | `/ux` | ux.md | 34 KB | UX/UI Designer |
| 4 | `/techlead` | techlead.md | 21 KB | Tech Lead / Architect |
| 5 | `/backend-go` | backend-go.md | 20 KB | **Go + Fiber/Chi** ⚠️ |
| 6 | `/frontend` | frontend.md | 21 KB | **Svelte 5 + SvelteKit** ⚠️ |
| 7 | `/ml` | ml.md | 14 KB | **Python + FastAPI** ⚠️ |
| 8 | `/qa` | qa.md | 17 KB | Vitest + Playwright |
| 9 | `/devops` | devops.md | 33 KB | Docker + K8s + Terraform |
| 10 | `/security` | security.md | 11 KB | Security Engineer |
| 11 | `/docs` | docs.md | 14 KB | Technical Writer |

**Ключевые детали:**

#### `/frontend` агент (21 KB)
```yaml
Framework: Svelte 5 (Runes API)
  Почему: 3-5x faster than React, reactive by default, smaller bundle

Build Tool: Vite
Routing: SvelteKit
Charts: Apache ECharts
Styling: Tailwind CSS

Expected Structure:
  /src
    /lib
      /components
      /features
      /stores
      /api
    /routes
      +layout.svelte
      +page.svelte
      /dashboard/+page.svelte
```

**НЕСООТВЕТСТВИЕ:** Реализован Next.js 15.5.6 + React 19 в `/app/`

---

#### `/backend-go` агент (20 KB)
```yaml
Language: Go 1.21+
Framework: Fiber или Chi
Target: 10M req/sec event ingestion

Expected Structure:
  /cmd
    /api
    /ingestion
    /consumer
  /internal
    /handlers
    /repository
    /service
  /pkg
```

**НЕСООТВЕТСТВИЕ:** Backend НЕ создан вообще (нет `go.mod`, нет папки `backend/`)

---

#### `/ml` агент (14 KB)
```yaml
Language: Python 3.11+
Framework: FastAPI
Models: LightGBM, XGBoost, PyTorch

Expected Structure:
  /ml
    /models
    /pipelines
    /api
    requirements.txt
```

**НЕСООТВЕТСТВИЕ:** ML НЕ создан вообще (нет `requirements.txt`, нет папки `ml/`)

---

### 2. Структура проекта — текущее состояние

**Фактическая структура:**
```
attribution/
├── .claude/              ✅ 11 AI-агентов (настроены на Svelte/Go)
│   └── commands/
│       ├── orchestrator.md
│       ├── frontend.md   ⚠️ Ожидает Svelte 5
│       ├── backend-go.md ⚠️ Ожидает Go
│       └── ...
│
├── app/                  ⚠️ Next.js (не Svelte!)
│   ├── login/
│   ├── dashboard/
│   ├── api/
│   └── ...
│
├── lib/                  ✅ AI-агенты (Anthropic Claude)
│   └── agents/
│       ├── ui-ux/
│       ├── design-analyzer/
│       └── product-manager/
│
├── DOCUMENTS/            ✅ 350+ страниц (описывают Svelte/Go)
│
├── docs/                 ✅ Текущая документация
│
├── scripts/              ✅ PowerShell скрипты
│
├── config/               ✅ docker-compose.yml
│
├── components/           ⚠️ Shadcn/ui для React (не Svelte!)
│
├── test-files/           ❌ Пустая папка
│
├── package.json          ⚠️ Next.js зависимости
│
└── НЕТ:
    ❌ frontend/ (Svelte)
    ❌ backend/ (Go)
    ❌ ml/ (Python)
    ❌ go.mod
    ❌ requirements.txt
    ❌ svelte.config.js
```

---

### 3. Зависимости — package.json

**Текущие зависимости (Next.js стек):**
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.67.0",       // ✅ AI агенты
    "@radix-ui/react-slot": "^1.2.3",     // ⚠️ React (не Svelte)
    "class-variance-authority": "^0.7.1", // ⚠️ React CVA
    "clsx": "^2.1.1",
    "next": "15.5.6",                     // ⚠️ Next.js (не SvelteKit)
    "next-auth": "^4.24.11",              // ⚠️ NextAuth (не Svelte)
    "react": "19.1.0",                    // ⚠️ React (не Svelte)
    "react-dom": "19.1.0",
    "react-google-recaptcha": "^3.1.0",
    "tailwind-merge": "^3.3.1"            // ✅ OK (используется и в Svelte)
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",         // ✅ OK
    "@types/node": "^20",
    "@types/react": "^19",                // ⚠️ React types
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.5.6",       // ⚠️ Next.js ESLint
    "tailwindcss": "^4",                  // ✅ OK
    "typescript": "^5"                    // ✅ OK
  }
}
```

**Ожидаемые зависимости (Svelte 5 стек):**
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.67.0",       // ✅ AI агенты
    "svelte": "^5.0.0",                   // Svelte 5
    "clsx": "^2.1.1",                     // ✅ OK
    "tailwind-merge": "^3.3.1"            // ✅ OK
  },
  "devDependencies": {
    "@sveltejs/kit": "^2.0.0",            // SvelteKit
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "vite": "^6.0.0",                     // Vite (не Turbopack)
    "@tailwindcss/vite": "^4.0.0",
    "vitest": "^2.0.0",                   // Vitest (не Jest)
    "playwright": "^1.40.0",
    "typescript": "^5"                    // ✅ OK
  }
}
```

---

### 4. Docker Infrastructure — что работает ✅

**Статус:** Инфраструктура полностью готова и работает!

| Сервис | Статус | URL/Port | Назначение |
|--------|--------|----------|------------|
| ClickHouse | ✅ Running + Healthy | localhost:8123, 9000 | Analytics DB (OLAP) |
| PostgreSQL | ✅ Running + Healthy | localhost:5432 | Operational DB (OLTP) |
| Redis | ✅ Running + Healthy | localhost:6379 | Cache & sessions |
| Kafka | ✅ Running + Healthy | localhost:9092 | Event streaming |
| Zookeeper | ✅ Running + Healthy | localhost:2181 | Kafka coordination |
| Kafka UI | ✅ Running | localhost:8080 | Web monitoring |

**Вывод:** Backend сервисы готовы принимать Go/Rust приложения!

---

### 5. DOCUMENTS/ — исходная концепция (350+ страниц)

**Расположение:** `C:\КОДИНГ\attribution\DOCUMENTS\`

**Содержание:** 26+ документов с изначальным планом

**Ключевые документы:**

#### `00_Executive_Overview.md` (44 KB)
```yaml
Project: UnMoGrowP (Unified Mobile Growth Platform)
Goal: All-in-One платформа (7 систем в одной)
Scale: 100B+ events/day, 10M req/sec, 99.99% uptime
Tech Stack: [описан Svelte 5 + Go + Bun]
```

#### `02_AppsFlyer_Tech_Stack_Analysis.md` (33 KB)
```yaml
Problem: React не оптимален для data-heavy dashboards
Solution: Svelte 5 + SvelteKit
Reason:
  - 3-5x faster than React
  - Smaller bundle (40 KB vs 140 KB)
  - Better real-time reactivity
```

#### `03_Future_Proof_Architecture_Greenfield_Attribution_Platform.md` (56 KB)
```yaml
Frontend: Svelte 5 + SvelteKit + Apache ECharts
Backend: Bun + Hono (API), Go (event ingestion), Rust (attribution engine)
Data: ClickHouse + PostgreSQL + Redis + Kafka
```

**ВЫВОД:** Вся исходная документация описывает Svelte 5, НЕ React!

---

## 🚨 Критические несоответствия

### Несоответствие #1: Frontend стек

| Элемент | Ожидается | Реализовано | Статус |
|---------|-----------|-------------|--------|
| Framework | Svelte 5 + SvelteKit | Next.js 15.5.6 + React 19 | ❌ КРИТИЧНО |
| Build Tool | Vite | Turbopack | ❌ |
| Routing | SvelteKit file-based | Next.js App Router | ❌ |
| Components | Svelte Components | React Components | ❌ |
| State | Svelte 5 Runes | React Hooks | ❌ |
| Bundle Size | ~40 KB | ~140 KB | ❌ 3.5x больше |

**Impact:** AI-агенты генерируют Svelte код, но проект использует React

---

### Несоответствие #2: Backend отсутствует

| Элемент | Ожидается | Реализовано | Статус |
|---------|-----------|-------------|--------|
| Backend | Go + Fiber/Chi | ❌ НЕТ | ❌ КРИТИЧНО |
| go.mod | Должен быть | ❌ НЕТ | ❌ |
| backend/ folder | /cmd, /internal, /pkg | ❌ НЕТ | ❌ |
| API Endpoints | /api/events, /api/campaigns | ❌ НЕТ | ❌ |
| Event Ingestion | 10M req/sec target | ❌ НЕТ | ❌ |

**Impact:** Нет backend для приема событий и обработки атрибуции

---

### Несоответствие #3: ML/Data не создан

| Элемент | Ожидается | Реализовано | Статус |
|---------|-----------|-------------|--------|
| ML Service | Python + FastAPI | ❌ НЕТ | ❌ |
| requirements.txt | Должен быть | ❌ НЕТ | ❌ |
| ml/ folder | /models, /pipelines, /api | ❌ НЕТ | ❌ |
| ML Models | LTV, Fraud, Churn | ❌ НЕТ | ❌ |

**Impact:** Нет ML capabilities (предсказания, fraud detection)

---

### Несоответствие #4: Структура папок

| Элемент | Ожидается | Реализовано | Статус |
|---------|-----------|-------------|--------|
| Frontend | /frontend/src/routes | /app | ❌ |
| Backend | /backend/cmd, /internal | ❌ НЕТ | ❌ |
| ML | /ml | ❌ НЕТ | ❌ |
| Monorepo | Turborepo | Single package.json | ⚠️ |

**Impact:** AI-агенты ожидают другую структуру

---

## 🎯 План возврата к исходному стеку (Svelte 5 + Go + Bun)

### Вариант A: Полная миграция (рекомендуется для долгосрочной перспективы)

**Преимущества:**
- ✅ Соответствие изначальному плану
- ✅ AI-агенты работают как задумано
- ✅ 3-5x лучше performance (Svelte vs React)
- ✅ Меньше bundle size (40 KB vs 140 KB)
- ✅ Лучше для data-heavy dashboards
- ✅ Меньше комиссия за инструменты ($10-15K vs $19K)

**Недостатки:**
- ⚠️ Нужно переписать Login page (1 страница)
- ⚠️ Потеря 1-2 дней работы

**Timeline:** 2-3 дня

---

#### Шаг 1: Создать Svelte 5 + SvelteKit проект

```bash
# 1. Создать SvelteKit проект
npm create svelte@latest frontend
# Выбрать:
# - SvelteKit demo app (skeleton)
# - TypeScript: Yes
# - ESLint: Yes
# - Prettier: Yes
# - Playwright: Yes
# - Vitest: Yes

cd frontend

# 2. Установить зависимости
npm install

# 3. Добавить Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. Добавить Apache ECharts
npm install echarts

# 5. Добавить Anthropic SDK
npm install @anthropic-ai/sdk

# 6. Настроить Vite для dev сервера
# vite.config.ts:
export default {
  server: {
    host: '0.0.0.0',
    port: 5173
  }
}
```

**Результат:** Готовый Svelte 5 проект в `/frontend/`

---

#### Шаг 2: Мигрировать Login page

**Текущий Login (React):** `app/login/page.tsx`

**Новый Login (Svelte):** `frontend/src/routes/login/+page.svelte`

**Конвертация:**
```svelte
<!-- frontend/src/routes/login/+page.svelte -->
<script lang="ts">
  import { signIn } from '@auth/sveltekit/client'; // Svelte Auth
  import ReCAPTCHA from 'svelte-recaptcha-v2';

  let email = $state('');
  let password = $state('');
  let recaptchaToken = $state<string | null>(null);

  async function handleGoogleLogin() {
    if (!recaptchaToken) {
      alert('Пожалуйста, подтвердите что вы не робот');
      return;
    }
    await signIn('google', { callbackUrl: '/dashboard' });
  }
</script>

<div class="min-h-screen flex items-center justify-center p-5"
     style="background: rgb(109, 140, 248);">

  <!-- Logo with overlapping circles -->
  <div class="absolute w-[140px] h-[140px] rounded-full left-0 z-0"
       style="background: rgba(255, 255, 255, 0.15)"></div>

  <div class="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl z-10">
    <h1 class="text-3xl font-bold mb-8">Вход</h1>

    <!-- Email input with floating label -->
    <div class="relative mb-6">
      <input
        type="email"
        bind:value={email}
        placeholder=" "
        class="peer w-full h-[50px] px-4 border-2 border-gray-300 rounded-lg
               focus:border-[rgb(109,140,248)] focus:outline-none transition"
      />
      <label class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500
                    peer-focus:top-[-8px] peer-focus:text-xs peer-focus:bg-white
                    peer-focus:px-1 peer-focus:text-[rgb(109,140,248)]
                    peer-[:not(:placeholder-shown)]:top-[-8px]
                    peer-[:not(:placeholder-shown)]:text-xs
                    peer-[:not(:placeholder-shown)]:bg-white
                    peer-[:not(:placeholder-shown)]:px-1
                    transition-all pointer-events-none">
        Email
      </label>
    </div>

    <!-- Password input -->
    <div class="relative mb-6">
      <input
        type="password"
        bind:value={password}
        placeholder=" "
        class="peer w-full h-[50px] px-4 border-2 border-gray-300 rounded-lg
               focus:border-[rgb(109,140,248)] focus:outline-none transition"
      />
      <label class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500
                    peer-focus:top-[-8px] peer-focus:text-xs peer-focus:bg-white
                    peer-focus:px-1 peer-focus:text-[rgb(109,140,248)]
                    transition-all pointer-events-none">
        Пароль
      </label>
    </div>

    <!-- reCAPTCHA -->
    <ReCAPTCHA
      sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
      on:success={(e) => recaptchaToken = e.detail}
    />

    <!-- Google Login Button -->
    <button
      on:click={handleGoogleLogin}
      class="w-full h-[50px] bg-[rgb(48,80,147)] hover:bg-[rgb(38,70,137)]
             text-white font-semibold rounded-lg transition active:scale-[0.98]">
      Войти через Google
    </button>
  </div>
</div>
```

**Время:** ~2 часа (с тестированием)

---

#### Шаг 3: Создать Go Backend

```bash
# 1. Создать Go проект
mkdir backend
cd backend

# 2. Инициализировать Go module
go mod init github.com/yourusername/unmogrowp

# 3. Установить зависимости
go get github.com/gofiber/fiber/v3      # Web framework
go get github.com/segmentio/kafka-go    # Kafka client
go get github.com/ClickHouse/clickhouse-go/v2  # ClickHouse
go get github.com/jackc/pgx/v5          # PostgreSQL
go get github.com/redis/go-redis/v9     # Redis

# 4. Создать структуру
mkdir -p cmd/api cmd/ingestion cmd/consumer
mkdir -p internal/{handlers,repository,service,middleware}
mkdir -p pkg/{clickhouse,kafka,redis}
```

**Структура:**
```
backend/
├── cmd/
│   ├── api/main.go           # REST API server
│   ├── ingestion/main.go     # Event ingestion (10M req/sec)
│   └── consumer/main.go      # Kafka consumer
│
├── internal/
│   ├── handlers/             # HTTP handlers
│   │   ├── events.go
│   │   ├── campaigns.go
│   │   └── analytics.go
│   ├── repository/           # Data access
│   │   ├── clickhouse/
│   │   ├── postgres/
│   │   └── redis/
│   ├── service/              # Business logic
│   │   ├── event/
│   │   ├── analytics/
│   │   └── attribution/
│   └── middleware/           # Middleware
│       ├── auth.go
│       ├── logging.go
│       └── ratelimit.go
│
├── pkg/                      # Shared packages
│   ├── clickhouse/
│   ├── kafka/
│   └── redis/
│
├── go.mod
└── go.sum
```

**Пример API endpoint:**
```go
// cmd/api/main.go
package main

import (
    "github.com/gofiber/fiber/v3"
    "unmogrowp/internal/handlers"
)

func main() {
    app := fiber.New()

    // Health check
    app.Get("/health", handlers.HealthCheck)

    // Event ingestion
    app.Post("/api/v1/events", handlers.IngestEvent)

    // Analytics
    app.Get("/api/v1/analytics/dashboard", handlers.GetDashboard)
    app.Get("/api/v1/campaigns", handlers.ListCampaigns)

    app.Listen(":8000")
}
```

**Время:** 1-2 дня

---

#### Шаг 4: Создать Bun API Layer (опционально)

```bash
# 1. Создать Bun проект
mkdir api
cd api

# 2. Инициализировать Bun проект
bun init

# 3. Установить Hono
bun add hono

# 4. Создать API endpoints
# index.ts:
import { Hono } from 'hono'

const app = new Hono()

app.get('/api/campaigns', async (c) => {
  // Query ClickHouse
  const campaigns = await queryCampaigns()
  return c.json(campaigns)
})

export default app
```

**Время:** 1 день

---

#### Шаг 5: Интеграция и тестирование

1. **Запустить все сервисы:**
```bash
# Terminal 1: Docker services
docker-compose up -d

# Terminal 2: Frontend (Svelte)
cd frontend && npm run dev
# → http://localhost:5173

# Terminal 3: Backend (Go)
cd backend && go run cmd/api/main.go
# → http://localhost:8000

# Terminal 4: Bun API (optional)
cd api && bun run index.ts
# → http://localhost:3000
```

2. **Тестирование:**
- Login page works
- Google OAuth works
- reCAPTCHA works
- API endpoints respond

**Время:** 1 день

---

### Вариант B: Гибридный подход (сохранить Next.js, добавить Go/Bun)

**Преимущества:**
- ✅ Не нужно переписывать Login page
- ✅ Быстрее старт

**Недостатки:**
- ⚠️ Next.js медленнее Svelte для data-heavy dashboards
- ⚠️ AI-агенты генерируют Svelte код (несоответствие)
- ⚠️ Больше bundle size
- ⚠️ Не соответствует изначальному плану

**Шаги:**
1. Оставить Next.js для dashboard
2. Создать Go backend (как в Варианте A, Шаг 3)
3. Создать Bun API layer (как в Варианте A, Шаг 4)
4. Интегрировать Next.js с Go/Bun API

**Время:** 2 дня

---

### Вариант C: Обновить AI-агенты на Next.js (НЕ рекомендуется)

**Преимущества:**
- ✅ Сохранить текущий код

**Недостатки:**
- ❌ Потеря performance advantage (3-5x медленнее)
- ❌ Больше bundle size (3.5x)
- ❌ Не соответствует изначальному плану
- ❌ Нужно переписать 11 AI-агентов (237 KB промптов)
- ❌ Потеря 350+ страниц документации

**НЕ РЕКОМЕНДУЕТСЯ**

---

## 📊 Сравнительная таблица вариантов

| Критерий | Вариант A (Svelte) | Вариант B (Hybrid) | Вариант C (Next.js) |
|----------|-------------------|-------------------|---------------------|
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Bundle Size | 40 KB | 140 KB | 140 KB |
| AI Agents | ✅ Work | ⚠️ Mismatch | ❌ Need rewrite |
| Documentation | ✅ Matches | ⚠️ Mismatch | ❌ Need rewrite |
| Timeline | 2-3 дня | 2 дня | 5-7 дней |
| Effort | Medium | Low | Very High |
| Long-term | ✅ Best | ⚠️ OK | ❌ Poor |

**Рекомендация:** **Вариант A** (полная миграция на Svelte 5)

---

## 🎯 Рекомендации Product Manager

### Критичность: ВЫСОКАЯ

**Проблема:**
1. Проект начинался с Svelte 5 + Go + Bun
2. 11 AI-агентов настроены на этот стек
3. 350+ страниц документации описывают этот стек
4. Реализован другой стек (Next.js + React)
5. Backend и ML не созданы

**Рекомендация: ВЕРНУТЬСЯ к исходному плану (Svelte 5 + Go + Bun)**

**Причины:**
1. ✅ **Performance:** Svelte 3-5x быстрее React для data-heavy dashboards
2. ✅ **Bundle Size:** 40 KB vs 140 KB (3.5x меньше)
3. ✅ **AI Agents:** Работают как задумано
4. ✅ **Documentation:** Соответствует плану
5. ✅ **Cost:** Меньше комиссия за инструменты
6. ✅ **Scalability:** Лучше для 100B+ events/day

**Timeline:** 2-3 дня (потеря минимальна, Login page = 1 страница)

**ROI:** Возврат за 2-3 дня окупается за счет:
- Лучшей производительности
- Меньшего bundle size
- Соответствия AI-агентам
- Соответствия документации

---

## 📝 Детальный план миграции (рекомендуемый)

### День 1: Frontend (Svelte 5)

**Утро (4 часа):**
1. Создать SvelteKit проект: `npm create svelte@latest frontend`
2. Установить зависимости: Tailwind, ECharts, Anthropic SDK
3. Настроить Vite: dev server на 0.0.0.0:5173

**Обед (2 часа):**
4. Мигрировать Login page: React → Svelte
5. Настроить SvelteKit Auth (Google OAuth)
6. Интегрировать reCAPTCHA

**Вечер (2 часа):**
7. Тестировать Login page
8. Проверить OAuth flow
9. Проверить reCAPTCHA

**Результат День 1:** ✅ Svelte 5 Login page работает

---

### День 2: Backend (Go) + API Layer (Bun)

**Утро (4 часа):**
1. Создать Go проект: `go mod init`
2. Создать структуру: /cmd, /internal, /pkg
3. Реализовать основные handlers:
   - Health check
   - Event ingestion (POST /api/v1/events)
   - Campaigns list (GET /api/v1/campaigns)

**Обед (2 часа):**
4. Подключить ClickHouse, PostgreSQL, Redis
5. Реализовать Kafka producer

**Вечер (2 часа):**
6. Создать Bun API Layer (Hono)
7. Реализовать endpoints для dashboard

**Результат День 2:** ✅ Go Backend + Bun API работают

---

### День 3: Интеграция и тестирование

**Утро (2 часа):**
1. Интегрировать Svelte с Go/Bun API
2. Настроить CORS
3. Настроить proxy в Vite

**Обед (2 часа):**
4. E2E тестирование:
   - Login flow
   - OAuth flow
   - API calls

**Вечер (4 часа):**
5. Performance testing
6. Исправление багов
7. Финальная проверка

**Результат День 3:** ✅ Полный стек работает

---

## ✅ Итоговый чек-лист миграции

### Подготовка
- [ ] Сохранить текущий Login page (React) для reference
- [ ] Создать ветку `feature/migrate-to-svelte`
- [ ] Backup `.env.local`

### Frontend
- [ ] Создать SvelteKit проект в `/frontend/`
- [ ] Установить зависимости (Tailwind, ECharts, Anthropic)
- [ ] Мигрировать Login page (React → Svelte)
- [ ] Настроить SvelteKit Auth
- [ ] Интегрировать reCAPTCHA
- [ ] Тестировать Login + OAuth

### Backend
- [ ] Создать Go проект в `/backend/`
- [ ] Установить зависимости (Fiber, Kafka, ClickHouse, Redis)
- [ ] Создать структуру /cmd, /internal, /pkg
- [ ] Реализовать Health check endpoint
- [ ] Реализовать Event ingestion endpoint
- [ ] Реализовать Campaigns endpoint
- [ ] Подключить ClickHouse, PostgreSQL, Redis
- [ ] Реализовать Kafka producer

### API Layer (optional)
- [ ] Создать Bun проект в `/api/`
- [ ] Установить Hono
- [ ] Реализовать Dashboard API endpoints
- [ ] Подключить ClickHouse

### Интеграция
- [ ] Интегрировать Svelte с Go/Bun API
- [ ] Настроить CORS
- [ ] Настроить proxy в Vite
- [ ] E2E тестирование

### Cleanup
- [ ] Удалить `/app/` (Next.js)
- [ ] Удалить Next.js зависимости из package.json
- [ ] Удалить `next.config.ts`, `components.json`
- [ ] Обновить `.gitignore`
- [ ] Обновить `README.md`
- [ ] Обновить Product Manager Agent (new structure)

### Documentation
- [ ] Обновить `PROJECT_STRUCTURE.md`
- [ ] Обновить `TECH_STACK_AND_DEVELOPMENT_PROCESS.md`
- [ ] Создать `MIGRATION_COMPLETE.md`

---

## 🚀 Следующие шаги

### Немедленно (сегодня):
1. **Принять решение:** Вариант A (Svelte), B (Hybrid), или C (Next.js)
2. **Создать ветку:** `feature/migrate-to-svelte` или `feature/add-backend`

### Если выбран Вариант A (рекомендуется):
1. **День 1:** Создать Svelte 5 проект, мигрировать Login
2. **День 2:** Создать Go Backend + Bun API
3. **День 3:** Интеграция и тестирование

### Если выбран Вариант B:
1. **День 1-2:** Создать Go Backend + Bun API
2. **День 2:** Интегрировать с Next.js

---

## 📊 Статус проекта после анализа

```
✅ Infrastructure:       100% (6/6 services)
✅ AI Agents:            100% (11 agents, but expect Svelte)
✅ Workflow:             100%
✅ Documentation:        100% (but describes Svelte)
⚠️ Frontend:             30% (Next.js, should be Svelte)
❌ Backend:              0% (not started)
❌ ML:                   0% (not started)

───────────────────────────────────────
Alignment with plan:     40%
Critical issues:         3 (Frontend mismatch, No Backend, No ML)
```

---

## 💡 Выводы

1. **Критическое несоответствие:** Проект начинался с Svelte 5, но реализован на Next.js
2. **AI-агенты не работают:** Они генерируют Svelte код, но проект использует React
3. **Backend отсутствует:** Нет Go backend, нет event ingestion
4. **ML отсутствует:** Нет Python ML сервиса
5. **Рекомендация:** Вернуться к Svelte 5 + Go + Bun (2-3 дня)
6. **ROI:** Миграция окупается за счет лучшего performance и соответствия плану

---

**Статус:** 🚨 ТРЕБУЕТСЯ РЕШЕНИЕ

**Ответственный:** Product Manager Agent

**Дата:** 21 октября 2025

**Next Action:** Обсудить с командой и принять решение по варианту миграции

---

**UnMoGrowP** — The All-in-One Mobile Growth Platform. Built for the AI Era. 🚀
