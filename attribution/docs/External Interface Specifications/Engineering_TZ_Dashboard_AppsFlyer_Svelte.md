# Инженерное ТЗ – Dashboard / Обзор (AppsFlyer, Svelte 7)

## 🎯 Назначение
Панель "Dashboard / Обзор" — центральная точка входа в систему, где пользователь получает сводную информацию по ключевым метрикам. Реализуется в виде набора виджетов и аналитических компонентов.

## 👥 Целевая аудитория
- Маркетологи — фокус на стоимости, ROI, установках
- Аналитики — исследование трендов и источников
- Продакт-менеджеры — анализ Retention / LTV
- Руководство — краткий обзор по проектам и приложениям

## 🧱 Архитектура компонентов

### Dashboard.svelte
Контейнер страницы, использует:
- KPIGroup.svelte
- TrendChart.svelte
- TopSourcesTable.svelte
- FilterPanel.svelte

### KPIGroup.svelte
Компонент обёртки для набора KPI-блоков.
- Props: metrics: KPIData[]
- События: on:select → проксирует клик по KPI

#### KPIWidget.svelte
- Props:
  - title: string
  - value: number | string
  - delta: number
  - unit?: string
  - trendData?: number[]
  - colorScheme?: string
- События: on:click
- Внутри: MiniSparkline.svelte

### TrendChart.svelte
- Props:
  - metric: string
  - data: ChartPoint[]
  - period: TimeRange
- События:
  - on:pointHover
  - on:metricChange
  - on:periodChange

### TopSourcesTable.svelte
- Props:
  - rows: CampaignRow[]
  - sortBy: string
  - pagination: { page: number, size: number }
- События:
  - on:sort
  - on:paginate

### FilterPanel.svelte
- Props:
  - availableApps: App[]
  - filters: DashboardFilter
- События: on:change
- Сохраняет состояние в Svelte Store: dashboardFilters

## 🔁 Состояние и логика

### Stores
- dashboardFilters: Writable<DashboardFilter>
- dashboardData: Readable<DashboardData>

### Загрузка данных
```ts
onMount(async () => {
  $dashboardData = await fetchDashboardData($dashboardFilters)
})
```

## 🧪 Поведение и UX
- Начальная загрузка — Skeleton компоненты
- KPI кликабельны
- Tooltip по точке графика
- Таблица — сортировка, пагинация
- Responsive layout >1200px

## 🛠 Роли

| Роль              | Видимость KPI     | Источники | ROI | Кастомизация |
|-------------------|--------------------|------------|-----|----------------|
| Маркетолог        | ✅                 | ✅         | ✅  | ❌             |
| Продакт-менеджер  | ✅ (без затрат)    | ❌         | ❌  | ❌             |
| Руководство       | ✅                 | ✅         | ✅  | ✅             |
| Разработчик       | ⚠️ Технические     | ❌         | ❌  | ❌             |
| Администратор     | ✅ (всё)            | ✅         | ✅  | ✅             |

## ⚙️ Особенности в Svelte 7
- context API для фильтров
- <Card> с light/dark темами
- Lazy loading через IntersectionObserver
- svelte:component для динамики
- Валидация через zod