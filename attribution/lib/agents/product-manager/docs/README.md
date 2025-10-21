# Product Manager Agent

> **Обновлено:** 21 октября 2025
> **Версия:** 2.0 (с поддержкой мониторинга технологического стека)

## Роль и ответственность

Product Manager Agent отвечает за:

1. **Контроль структуры проекта**
   - Мониторинг соблюдения структуры папок
   - Проверка правильности размещения файлов
   - Предложения по улучшению организации

2. **Организация документации**
   - Категоризация документов
   - Контроль актуальности документации
   - Архивирование устаревших документов

3. **Координация агентов**
   - Определение областей ответственности (включая 11 AI агентов в `.claude/commands`)
   - Разрешение конфликтов между агентами
   - Обеспечение согласованности работы

4. **Мониторинг технологического стека** 🆕
   - Отслеживание соответствия реализации оригинальному плану
   - Выявление несоответствий и отсутствующих компонентов
   - Рекомендации по миграции и улучшению стека

5. **Стандарты качества**
   - Контроль соблюдения coding standards
   - Проверка покрытия тестами
   - Мониторинг технического долга

## Структура проекта

### Агенты (lib/agents/)

```
lib/agents/
├── ui-ux/                 # UI/UX анализ компонентов
│   ├── agent.ts
│   ├── types.ts
│   ├── utils/
│   └── docs/             # Документация специфичная для агента
├── design-analyzer/       # Анализ дизайна
│   ├── agent.ts
│   └── docs/
└── product-manager/       # Управление проектом
    ├── agent.ts
    └── docs/
```

### Документация (docs/)

```
docs/
├── setup/                # Установка и настройка
│   ├── SETUP.md
│   ├── SETUP_AUTH.md
│   ├── DEV-ENVIRONMENT.md
│   ├── INSTALL-*.md
│   ├── NGROK-*.md
│   └── DOMAIN-*.md
├── workflows/            # Рабочие процессы
│   ├── DESIGN_WORKFLOW.md
│   ├── WORKFLOW_ANALYSIS.md
│   └── DOCUMENTATION-MAINTENANCE.md
├── architecture/         # Архитектура
│   └── (будущие документы)
├── guides/              # Руководства
│   ├── QUICK-START.md
│   └── START-DEV.md
└── status/              # Статусы
    ├── STATUS.md
    └── SUCCESS.md
```

### Прототипы (prototypes/)

HTML прототипы компонентов перед конвертацией в React.

```
prototypes/
└── login-prototype.html
```

### Команда (team/)

Информация о команде агентов, их ролях и взаимодействии.

## Правила организации файлов

### 1. Документы по установке → docs/setup/
- SETUP*.md
- INSTALL*.md
- DOMAIN*.md
- NGROK*.md
- DEV-ENVIRONMENT.md

### 2. Рабочие процессы → docs/workflows/
- WORKFLOW*.md
- DESIGN_WORKFLOW*.md
- DOCUMENTATION*.md

### 3. Архитектура → docs/architecture/
- ARCHITECTURE*.md
- TECH*.md
- STACK*.md

### 4. Руководства → docs/guides/
- QUICK-START*.md
- START*.md
- GUIDE*.md

### 5. Статусы → docs/status/
- STATUS*.md
- SUCCESS*.md
- PROGRESS*.md
- REPORT*.md

### 6. Документация агентов → lib/agents/[agent-name]/docs/
- UI-UX*.md → lib/agents/ui-ux/docs/
- DESIGN-ANALYZER*.md → lib/agents/design-analyzer/docs/
- PRODUCT-MANAGER*.md → lib/agents/product-manager/docs/

## 🆕 Мониторинг технологического стека

Product Manager теперь отслеживает соответствие реализации оригинальному плану из папки `DOCUMENTS/`.

### Claude Code AI Agents (.claude/commands)

**11 специализированных AI агентов** (237 KB промптов):

| Агент | Размер | Назначение | Ожидаемый стек |
|-------|--------|------------|----------------|
| orchestrator | 28 KB | Координация агентов | Svelte 5, Go, Bun, Python |
| pm | 22 KB | Product Management | Svelte 5, Go, Bun |
| frontend | 21 KB | Frontend разработка | Svelte 5, SvelteKit, Vite |
| backend-go | 20 KB | Backend (10M req/sec) | Go 1.21+, Fiber, Chi |
| ml | 14 KB | ML/AI пайплайны | Python 3.11+, FastAPI |
| ux | 18 KB | UX дизайн | Svelte 5, Figma |
| techlead | 25 KB | Архитектура | Svelte 5, Go, Bun, Rust |
| qa | 16 KB | Тестирование | Playwright, Vitest |
| devops | 19 KB | DevOps | Docker, Kubernetes |
| security | 17 KB | Безопасность | Go, OWASP |
| docs | 17 KB | Документация | Markdown, Svelte MDsveX |

**⚠️ Критическое несоответствие:** Все агенты настроены на **Svelte 5 + Go + Bun**, но текущая реализация использует **Next.js + React**.

### Статус технологического стека

| Компонент | Планировалось | Текущее состояние | Статус |
|-----------|---------------|-------------------|---------|
| Frontend | Svelte 5 + SvelteKit (40 KB) | Next.js + React (140 KB) | ⚠️ Несоответствие |
| Backend | Go + Fiber (10M req/sec) | Не создан | ❌ Отсутствует |
| API Layer | Bun + Hono | Не создан | ❌ Отсутствует |
| Attribution Engine | Rust | Не создан | ❌ Отсутствует |
| ML Pipeline | Python + FastAPI | Не создан | ❌ Отсутствует |
| Data Infrastructure | ClickHouse + PostgreSQL + Redis + Kafka | Полностью работает | ✅ Соответствует |

### Рекомендации по миграции

**Рекомендуется: Вариант A** - Полная миграция на Svelte 5 + Go + Bun

**Вариант A:** Полная миграция (2-3 дня)
- ✅ Соответствие оригинальному плану
- ✅ Все 11 AI агентов работают корректно
- ✅ Производительность: 3-5x быстрее React
- ✅ Bundle size: 40 KB вместо 140 KB
- ❌ Нужно переписать Login страницу

**Вариант B:** Гибридный подход (2 дня)
- ✅ Сохранить Next.js Login
- ✅ Создать Go backend
- ❌ Frontend остается медленным
- ❌ Frontend агент не работает

**Вариант C:** Обновить агентов под Next.js (5-7 дней)
- ✅ Сохранить текущий код
- ❌ Переписать 11 агентов (237 KB)
- ❌ Потеря производительности

## Использование

### Проверка структуры

```typescript
import { productManager } from '@/lib/agents/product-manager/agent';

// Получить структуру проекта
const structure = productManager.getProjectStructure();

// Проверить куда поместить файл
const location = productManager.suggestFileLocation('SETUP_NEW.md');
// Вернет: 'docs/setup/'

// Валидация структуры
const validation = await productManager.validateStructure();
console.log(validation.issues); // Список проблем
console.log(validation.suggestions); // Предложения по улучшению
```

### Генерация отчета о структуре

```typescript
const report = productManager.generateStructureReport();
// Возвращает markdown отчет о структуре проекта
```

### 🆕 Мониторинг технологического стека

```typescript
// Получить информацию о Claude Command агентах
const agents = productManager.getClaudeCommandAgents();
console.log(`Всего агентов: ${agents.length}`); // 11

// Проверить статус стека
const stackStatus = productManager.getStackStatus();
const hasMismatches = productManager.hasStackMismatches(); // true
const criticalIssues = productManager.getCriticalStackIssues(); // 5 проблем

// Получить рекомендации по миграции
const recommendations = productManager.getMigrationRecommendations();
console.log(recommendations.recommended); // "Variant A"

// Генерация отчетов
const stackReport = productManager.generateStackStatusReport();
const agentsReport = productManager.generateClaudeAgentsReport();
```

## Задачи Product Manager

### Текущая задача: Мониторинг структуры проекта

**Ответственность:**
1. Проверять что новые файлы размещаются в правильных папках
2. Предлагать перемещение неправильно размещенных файлов
3. Следить за актуальностью документации
4. Координировать работу других агентов

**Критерии успеха:**
- ✅ Все файлы находятся в соответствующих категориях
- ✅ Документация агентов находится в их папках
- ✅ Нет дублирующейся документации
- ✅ Структура проекта понятна и логична

## Взаимодействие с другими агентами

### UI/UX Agent
- Product Manager → задает стандарты качества UI/UX
- UI/UX Agent → отчитывается о найденных проблемах

### Design Analyzer
- Product Manager → определяет процессы анализа дизайна
- Design Analyzer → предоставляет спецификации

### Будущие агенты
- Testing Agent - ответственность за тесты
- Documentation Agent - автоматическое обновление документации
- Code Quality Agent - контроль качества кода

## Отчеты

Product Manager генерирует следующие отчеты:

1. **Структура проекта** - текущее состояние папок и файлов
2. **Качество кодовой базы** - метрики и проблемы
3. **Прогресс разработки** - выполненные и запланированные задачи
4. **Техдолг** - накопленный технический долг

## Контакты и вопросы

Для вопросов по структуре проекта или организации файлов обращайтесь к Product Manager агенту.
