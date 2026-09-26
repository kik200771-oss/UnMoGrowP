# IDE Setup Guide - Оптимальная среда разработки для Attribution Platform

**Дата:** 2025-10-20
**Тип документа:** Setup Guide
**Версия:** 1.0

---

## 📋 Оглавление

1. [Введение](#введение)
2. [Анализ редакторов кода](#анализ-редакторов-кода)
3. [Рекомендуемая конфигурация](#рекомендуемая-конфигурация)
4. [VS Code - Setup](#vs-code---setup)
5. [Cursor IDE - Setup](#cursor-ide---setup)
6. [DBeaver - ClickHouse Setup](#dbeaver---clickhouse-setup)
7. [Workflow и Best Practices](#workflow-и-best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Альтернативные сценарии](#альтернативные-сценарии)

---

## 🎯 Введение

Этот документ описывает **оптимальную setup** среды разработки для Attribution Platform с учетом нашего технического стека:

```yaml
Frontend:
  - Svelte 5 + SvelteKit
  - TypeScript
  - Tailwind CSS v4
  - Apache ECharts

Backend:
  - Bun runtime
  - Hono framework
  - TypeScript

Data:
  - ClickHouse (аналитика)
  - PostgreSQL (operational)
  - Redpanda (streaming)

Monorepo:
  - Turborepo
  - pnpm workspaces
```

---

## 🔍 Анализ редакторов кода

### Сравнение основных IDE для нашего стека

| IDE/Editor | Svelte | Bun | TypeScript | ClickHouse | AI Coding | Performance | Цена | Рекомендация |
|------------|--------|-----|------------|------------|-----------|-------------|------|--------------|
| **VS Code** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Free | ✅ Основной |
| **Cursor IDE** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | $20/m | ✅ AI-coding |
| **WebStorm** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | $199/y | 🟡 Для команд |
| **Zed** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | Free | ❌ Слишком молодой |
| **DataGrip** | N/A | N/A | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | $99/y | ✅ Для SQL |
| **DBeaver** | N/A | N/A | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | Free | ✅ Альтернатива |

### Детальный анализ

#### 1. **VS Code** - Основной редактор ⭐⭐⭐⭐⭐

**Почему лучший выбор для нашего стека:**

```typescript
// Преимущества:
const vscodeAdvantages = {
  svelte: "Официальное расширение от Svelte команды",
  bun: "Официальное расширение от Oven (создатели Bun)",
  typescript: "Разработано Microsoft (как и TypeScript)",
  ecosystem: "40,000+ расширений",
  integration: "Claude Code работает в VS Code",
  price: "Полностью бесплатно",
  community: "Крупнейшее сообщество разработчиков"
}

// Недостатки:
const vscodeDisadvantages = {
  memory: "~1.2 GB RAM (vs 200 MB у Zed)",
  startup: "~1.2s (vs 0.12s у Zed)",
  clickhouse: "Нет встроенной интеграции"
}
```

**Производительность:**
- Startup time: 1.2 секунды
- RAM usage: 1.2 GB (с 10+ расширениями)
- CPU: Средняя нагрузка
- TypeScript IntelliSense: Отличная

#### 2. **Cursor IDE** - AI-First IDE ⭐⭐⭐⭐⭐

**Критически важно для monorepo:**

```typescript
// Cursor превосходит VS Code + Copilot в:
const cursorAdvantages = {
  codebaseUnderstanding: "Индексирует весь monorepo",
  multiFileRefactoring: "Редактирует 10+ файлов одновременно",
  composerMode: "AI планирует и выполняет большие задачи",
  models: ["GPT-4", "Claude 3.5", "Gemini", "Grok", "DeepSeek"],
  contextWindow: "200K+ tokens (весь проект в контексте)"
}

// Примеры use cases:
const useCases = {
  refactoring: "Переименовать компонент во всех файлах",
  architecture: "Создать новую feature с tests + docs",
  debugging: "Найти причину бага через весь stack",
  migration: "Обновить API routes с типами"
}
```

**Цена:** $20/месяц (Pro tier) - окупается за 2-3 часа сэкономленного времени

#### 3. **WebStorm** - Enterprise решение 🟡

**Когда стоит использовать:**
- ✅ Команда > 3 человека
- ✅ Нужна интеграция с DataGrip (ClickHouse)
- ✅ Бюджет позволяет ($199/год на человека)
- ✅ Нужны продвинутые Git merge tools

**Когда НЕ стоит:**
- ❌ Solo-разработчик (избыточно)
- ❌ Работа с Bun (поддержка еще сырая)
- ❌ Нужна максимальная скорость (медленнее VS Code)

#### 4. **Zed Editor** - Будущее, но не сейчас ❌

**Почему НЕ рекомендуется для нашего проекта:**

```bash
# КРИТИЧЕСКИЕ проблемы:
❌ TypeScript performance issues на больших проектах (5+ секунд delay)
❌ Svelte поддержка менее зрелая чем в VS Code
❌ Bun поддержка еще в разработке
❌ Нет расширения для Claude Code
❌ Turborepo - нет специальных плагинов

# Преимущества (но не критичны):
✅ 10x быстрее startup (0.12s vs 1.2s)
✅ 6x меньше RAM (200 MB vs 1.2 GB)
✅ 2.58x меньше энергопотребления
```

**Вывод:** Отличный редактор, но **подождите 1-2 года** пока экосистема созреет.

#### 5. **DataGrip / DBeaver** - Для работы с ClickHouse

**DataGrip (JetBrains)** - Premium решение ⭐⭐⭐⭐⭐

```yaml
Цена: $99/год ($8.90/мес)

Преимущества:
  - ClickHouse Explorer plugin (2025)
  - AI-assisted SQL generation
  - Поддержка ClickHouse-specific типов (Array, Nested, Map)
  - Context-aware completion
  - 50+ баз данных в одном инструменте
  - Лучший в индустрии query planner

Рекомендуется для:
  - Production-grade работа с ClickHouse
  - Сложные аналитические запросы
  - Оптимизация производительности
  - Работа с несколькими БД (ClickHouse + PostgreSQL + Redis)
```

**DBeaver Community** - Open-source альтернатива ⭐⭐⭐⭐

```yaml
Цена: Бесплатно (Community Edition)

Преимущества:
  - Open-source
  - ER диаграммы
  - AI Chat extension (2025)
  - Export wizards
  - Базовая поддержка ClickHouse

Недостатки:
  - UI тормозит на больших результатах
  - Java app (ест много памяти)
  - Менее продвинутая ClickHouse интеграция

Рекомендуется для:
  - Начальная разработка
  - Простые запросы
  - Ограниченный бюджет
```

---

## 🎯 Рекомендуемая конфигурация

### Setup #1: Solo-разработчик (0-2 человека) - RECOMMENDED

```yaml
Основной редактор:
  - VS Code: Бесплатно
  - Cursor IDE: $20/мес (опционально, но рекомендуется)

SQL клиент:
  - DBeaver Community: Бесплатно
  # Upgrade до DataGrip когда ClickHouse запросы усложнятся

Итого: $0-20/мес
ROI: Cursor окупается за 2-3 часа сэкономленного времени в месяц
```

### Setup #2: Малая команда (3-5 человек)

```yaml
Основной редактор:
  - WebStorm: $149/год на человека (первый год)
  - Cursor IDE: Опционально для AI-фичей

SQL клиент:
  - DataGrip: Включен в All Products Pack

JetBrains All Products Pack:
  - $649/год первый год (скидка)
  - $519/год второй год
  - $389/год третий год+
  - Включает: WebStorm, DataGrip, IntelliJ IDEA, PyCharm, etc.

Итого: ~$130/мес на человека (все включено)
```

### Setup #3: Бюджетный вариант (минимум)

```yaml
Основной редактор:
  - VS Code: Бесплатно
  - GitHub Copilot: $10/мес (опционально)

SQL клиент:
  - DBeaver Community: Бесплатно

Итого: $0-10/мес
Компромиссы: Нет advanced AI coding, базовая ClickHouse поддержка
```

---

## 🚀 VS Code - Setup

### Установка и базовая конфигурация

#### 1. Установка VS Code

```bash
# Windows (через winget)
winget install -e --id Microsoft.VisualStudioCode

# macOS (через Homebrew)
brew install --cask visual-studio-code

# Linux (Ubuntu/Debian)
sudo snap install --classic code
```

#### 2. Обязательные расширения для нашего стека

```bash
# Svelte
code --install-extension svelte.svelte-vscode

# Bun
code --install-extension oven.bun-vscode

# TypeScript
# Встроено по умолчанию, но для улучшений:
code --install-extension ms-vscode.vscode-typescript-next

# Tailwind CSS
code --install-extension bradlc.vscode-tailwindcss

# Error Lens (показывает ошибки inline)
code --install-extension usernamehw.errorlens

# Prettier
code --install-extension esbenp.prettier-vscode

# ESLint
code --install-extension dbaeumer.vscode-eslint

# REST Client (для API тестов)
code --install-extension humao.rest-client

# Git Graph
code --install-extension mhutchie.git-graph

# Thunder Client (Postman альтернатива)
code --install-extension rangav.vscode-thunder-client
```

#### 3. Опциональные, но полезные расширения

```bash
# Auto Rename Tag
code --install-extension formulahendry.auto-rename-tag

# Better Comments
code --install-extension aaron-bond.better-comments

# Import Cost (показывает размер импортов)
code --install-extension wix.vscode-import-cost

# TODO Highlight
code --install-extension wayou.vscode-todo-highlight

# GitLens (продвинутый Git)
code --install-extension eamodio.gitlens

# Peacock (цветовая кодировка окон)
code --install-extension johnpapa.vscode-peacock

# Color Highlight
code --install-extension naumovs.color-highlight

# Path Intellisense
code --install-extension christian-kohler.path-intellisense
```

### Конфигурация settings.json

Создайте `.vscode/settings.json` в корне проекта:

```json
{
  // Editor
  "editor.fontSize": 14,
  "editor.fontFamily": "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  "editor.fontLigatures": true,
  "editor.lineHeight": 1.6,
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.detectIndentation": false,
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.quickSuggestions": {
    "strings": true
  },
  "editor.inlineSuggest.enabled": true,
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": true,

  // Files
  "files.autoSave": "onFocusChange",
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/.turbo": true,
    "**/dist": true,
    "**/.svelte-kit": true
  },
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.turbo/**": true,
    "**/dist/**": true
  },

  // TypeScript
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.inlayHints.parameterNames.enabled": "all",
  "typescript.inlayHints.parameterTypes.enabled": true,
  "typescript.inlayHints.variableTypes.enabled": true,
  "typescript.inlayHints.propertyDeclarationTypes.enabled": true,
  "typescript.inlayHints.functionLikeReturnTypes.enabled": true,

  // Svelte
  "svelte.enable-ts-plugin": true,
  "svelte.plugin.svelte.compilerWarnings": {
    "a11y-accesskey": "ignore",
    "a11y-autofocus": "ignore"
  },
  "[svelte]": {
    "editor.defaultFormatter": "svelte.svelte-vscode"
  },

  // Bun
  "bun.runtime": "bun",

  // Prettier
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // ESLint
  "eslint.validate": [
    "javascript",
    "typescript",
    "svelte"
  ],
  "eslint.workingDirectories": [
    {
      "mode": "auto"
    }
  ],

  // Tailwind
  "tailwindCSS.experimental.classRegex": [
    ["class:\\s*?[\"'`]([^\"'`]*).*?[\"'`]", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "css.validate": false,

  // Git
  "git.autofetch": true,
  "git.confirmSync": false,
  "git.enableSmartCommit": true,

  // Search
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.turbo": true,
    "**/.svelte-kit": true,
    "**/pnpm-lock.yaml": true
  },

  // Terminal
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.fontSize": 13,
  "terminal.integrated.fontFamily": "'JetBrains Mono', monospace",

  // Explorer
  "explorer.confirmDelete": false,
  "explorer.confirmDragAndDrop": false,
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "*.ts": "${capture}.js, ${capture}.test.ts, ${capture}.spec.ts",
    "*.svelte": "${capture}.test.ts, ${capture}.spec.ts",
    "package.json": "pnpm-lock.yaml, .npmrc, .prettierrc, .eslintrc.cjs, tsconfig.json, vite.config.ts"
  }
}
```

### Конфигурация extensions.json

Создайте `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "svelte.svelte-vscode",
    "oven.bun-vscode",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "usernamehw.errorlens",
    "humao.rest-client",
    "mhutchie.git-graph",
    "rangav.vscode-thunder-client",
    "eamodio.gitlens"
  ]
}
```

### Snippets для Svelte

Создайте `.vscode/svelte.code-snippets`:

```json
{
  "Svelte Component with TypeScript": {
    "prefix": "sveltecomp",
    "body": [
      "<script lang=\"ts\">",
      "\tinterface Props {",
      "\t\t$1",
      "\t}",
      "",
      "\tlet { $2 }: Props = $props();",
      "</script>",
      "",
      "<div>",
      "\t$0",
      "</div>",
      "",
      "<style>",
      "\t/* Component styles */",
      "</style>"
    ],
    "description": "Create Svelte 5 component with TypeScript"
  },
  "Svelte Rune State": {
    "prefix": "state",
    "body": [
      "let $1 = $state($2);"
    ],
    "description": "Create Svelte 5 state rune"
  },
  "Svelte Rune Derived": {
    "prefix": "derived",
    "body": [
      "let $1 = $derived($2);"
    ],
    "description": "Create Svelte 5 derived rune"
  },
  "Svelte Rune Effect": {
    "prefix": "effect",
    "body": [
      "$effect(() => {",
      "\t$0",
      "});"
    ],
    "description": "Create Svelte 5 effect rune"
  },
  "API Route": {
    "prefix": "apiroute",
    "body": [
      "import type { RequestHandler } from './$types';",
      "import { json } from '@sveltejs/kit';",
      "",
      "export const GET: RequestHandler = async ({ url, locals }) => {",
      "\ttry {",
      "\t\t$0",
      "\t\treturn json({ success: true, data: null });",
      "\t} catch (error) {",
      "\t\treturn json({ success: false, error: error.message }, { status: 500 });",
      "\t}",
      "};"
    ],
    "description": "Create SvelteKit API route"
  }
}
```

### Keyboard shortcuts

Создайте `.vscode/keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+e",
    "command": "workbench.view.explorer"
  },
  {
    "key": "ctrl+shift+f",
    "command": "workbench.view.search"
  },
  {
    "key": "ctrl+shift+g",
    "command": "workbench.view.scm"
  },
  {
    "key": "ctrl+shift+d",
    "command": "workbench.view.debug"
  },
  {
    "key": "ctrl+shift+x",
    "command": "workbench.view.extensions"
  },
  {
    "key": "ctrl+`",
    "command": "workbench.action.terminal.toggleTerminal"
  },
  {
    "key": "ctrl+shift+`",
    "command": "workbench.action.terminal.new"
  },
  {
    "key": "ctrl+k ctrl+t",
    "command": "workbench.action.selectTheme"
  }
]
```

---

## 🤖 Cursor IDE - Setup

### Установка

```bash
# Скачайте с официального сайта:
# https://cursor.sh

# Windows: cursor-setup.exe
# macOS: Cursor.dmg
# Linux: cursor.AppImage
```

### Первоначальная настройка

1. **Импорт настроек из VS Code:**
   ```
   File → Preferences → Settings Sync → Import from VS Code
   ```

2. **Настройка AI моделей:**
   ```
   Settings → Features → AI → Models

   Рекомендуемая конфигурация:
   - Primary: Claude 3.5 Sonnet (лучший для кода)
   - Secondary: GPT-4 (для общих задач)
   - Fast: Claude 3 Haiku (быстрые автодополнения)
   ```

3. **Индексация кодовой базы:**
   ```
   Ctrl+Shift+P → "Cursor: Index Codebase"

   Первая индексация займет 5-15 минут для большого monorepo
   ```

### Ключевые возможности Cursor

#### 1. **Composer Mode** - Multi-file editing

```typescript
// Пример использования:
// Нажмите Ctrl+I или Cmd+I

// Запрос в Composer:
"Создай новую feature для fraud detection:
1. Компонент FraudDashboard.svelte
2. API endpoint /api/fraud/analyze
3. Типы в types/fraud.ts
4. Unit tests для всех компонентов"

// Cursor создаст все файлы одновременно с правильными связями
```

#### 2. **Codebase Chat** - Понимание всего проекта

```typescript
// Примеры запросов:
Ctrl+L → "Где обрабатываются attribution events?"
       → "Как работает интеграция с ClickHouse?"
       → "Покажи все API endpoints для analytics"
       → "Найди все места где используется userSession"
```

#### 3. **Ctrl+K** - Inline editing

```typescript
// Выделите код → Ctrl+K → введите инструкцию:
"Добавь error handling"
"Оптимизируй этот запрос"
"Добавь TypeScript типы"
"Конвертируй в async/await"
```

#### 4. **Tab для автодополнения**

```typescript
// Cursor предсказывает следующие строки кода:
const handleClick = () => {
  // Просто нажмите Tab для принятия suggestion
  ↓
  const result = await api.track.event({
    type: 'click',
    timestamp: Date.now()
  });
}
```

### Cursor settings.json (дополнительные настройки)

```json
{
  // Cursor-specific settings
  "cursor.chat.model": "claude-3-5-sonnet-20241022",
  "cursor.autocomplete.enabled": true,
  "cursor.autocomplete.model": "claude-3-haiku-20240307",
  "cursor.codebase.indexing": true,
  "cursor.cpp.disabledLanguages": [],

  // Privacy
  "cursor.privacy.anonymousTelemetry": false,
  "cursor.privacy.codeSnippets": "consented",

  // Performance
  "cursor.experimental.modelContextProtocol": true,
  "cursor.composer.useMultipleFiles": true
}
```

### Workflow рекомендации

```typescript
// Оптимальное использование Cursor:
const workflow = {
  // 1. Планирование новых фич
  planning: {
    tool: "Cursor Composer",
    command: "Ctrl+I",
    example: "Создай CRUD для campaigns с валидацией и tests"
  },

  // 2. Рефакторинг нескольких файлов
  refactoring: {
    tool: "Cursor Composer",
    command: "Ctrl+I",
    example: "Переименуй EventTracker в AttributionTracker везде"
  },

  // 3. Быстрые правки
  quickEdits: {
    tool: "Inline edit",
    command: "Ctrl+K",
    example: "Добавь JSDoc комментарии"
  },

  // 4. Понимание кода
  understanding: {
    tool: "Codebase Chat",
    command: "Ctrl+L",
    example: "Как работает authentication flow?"
  },

  // 5. Автодополнение
  autocomplete: {
    tool: "Tab completion",
    command: "Tab",
    example: "Продолжи функцию автоматически"
  }
}
```

### Pro tips для Cursor

```typescript
// 1. @-mentions в чате
"@file:fraud-detection.ts Добавь rate limiting"
"@folder:src/lib/api Создай OpenAPI schema для всех endpoints"
"@code:calculateAttribution Оптимизируй этот алгоритм"

// 2. Используйте правила проекта
// Создайте .cursorrules в корне проекта:
```

Создайте файл `.cursorrules` в корне проекта:

```
# Project: Attribution Platform
# Stack: Svelte 5, SvelteKit, Bun, TypeScript, ClickHouse

## Code Style
- Use TypeScript strict mode
- Prefer functional programming
- Use Svelte 5 runes ($state, $derived, $effect)
- No default exports (except pages/layouts)
- Use named imports

## Architecture
- Hexagonal architecture (ports & adapters)
- Framework-agnostic core logic
- CQRS pattern for commands/queries
- Event-driven where appropriate

## Naming Conventions
- Components: PascalCase (UserProfile.svelte)
- Files: kebab-case (user-profile.ts)
- Functions: camelCase (calculateAttribution)
- Constants: UPPER_SNAKE_CASE (MAX_RETRY_COUNT)
- Types/Interfaces: PascalCase (AttributionEvent)

## Testing
- Unit tests: *.test.ts (Vitest)
- Integration tests: *.spec.ts (Playwright)
- Coverage target: 80%+

## Error Handling
- Always use try/catch in API routes
- Return typed errors: { success: false, error: string }
- Log errors with context

## Performance
- Lazy load heavy components
- Use virtual scrolling for large lists
- Debounce user inputs
- Memoize expensive calculations

## Security
- Validate all inputs
- Sanitize user content
- Use prepared statements for SQL
- Never expose API keys in frontend
```

---

## 🗄️ DBeaver - ClickHouse Setup

### Установка DBeaver Community Edition

```bash
# Windows
winget install dbeaver.dbeaver

# macOS
brew install --cask dbeaver-community

# Linux (Ubuntu/Debian)
wget https://dbeaver.io/files/dbeaver-ce-latest-linux.gtk.x86_64.tar.gz
tar -xzf dbeaver-ce-latest-linux.gtk.x86_64.tar.gz
cd dbeaver
./dbeaver
```

### Настройка подключения к ClickHouse

#### 1. Создание подключения

```sql
-- Откройте DBeaver
-- Database → New Database Connection → ClickHouse

-- Connection settings:
Host: localhost (или ваш server)
Port: 8123 (HTTP) или 9000 (Native)
Database: attribution
Username: default
Password: (ваш пароль)

-- Advanced settings:
Driver: ClickHouse (HTTP interface)
URL: jdbc:clickhouse://localhost:8123/attribution
```

#### 2. Установка ClickHouse драйвера

```
Если драйвер не установлен автоматически:

1. Database → Driver Manager
2. Найдите "ClickHouse"
3. Download/Update
4. Apply
```

#### 3. Тестирование подключения

```sql
-- Выполните тестовый запрос:
SELECT
    version() AS clickhouse_version,
    uptime() AS uptime_seconds,
    formatReadableSize(total_bytes) AS database_size
FROM system.tables
WHERE database = 'attribution';
```

### Оптимизация DBeaver для ClickHouse

#### Settings для производительности

```
Window → Preferences → Editors → SQL Editor

Query Execution:
  ☑ Fetch result sets by portions
  Portion size: 1000 rows

  ☑ Read metadata: Only necessary
  ☑ Read all data types

Formatting:
  ☑ Format SQL on save
  Formatter: ClickHouse

Memory:
  Max memory per connection: 512 MB
  Result set max size: 100 MB
```

#### Полезные SQL шаблоны для ClickHouse

Создайте SQL шаблоны в DBeaver:

```sql
-- 1. Проверка производительности запроса
EXPLAIN SYNTAX
${selection}

-- 2. Анализ использования индексов
EXPLAIN indexes = 1
${selection}

-- 3. Профилирование запроса
SET send_logs_level = 'trace';
${selection}

-- 4. Проверка размера таблицы
SELECT
    table,
    formatReadableSize(sum(bytes)) AS size,
    sum(rows) AS rows,
    max(modification_time) AS last_modified
FROM system.parts
WHERE database = currentDatabase()
  AND table = '${table_name}'
GROUP BY table;

-- 5. Top 10 самых тяжелых запросов
SELECT
    type,
    query_start_time,
    query_duration_ms,
    formatReadableSize(memory_usage) AS memory,
    substring(query, 1, 100) AS query_preview
FROM system.query_log
WHERE type = 'QueryFinish'
ORDER BY query_duration_ms DESC
LIMIT 10;
```

### ClickHouse-specific фичи в DBeaver

```sql
-- 1. MergeTree оптимизация
OPTIMIZE TABLE events FINAL;

-- 2. Проверка partitions
SELECT
    partition,
    name,
    rows,
    formatReadableSize(bytes_on_disk) AS size,
    modification_time
FROM system.parts
WHERE table = 'events'
  AND active = 1
ORDER BY modification_time DESC;

-- 3. Материализованные view
CREATE MATERIALIZED VIEW events_hourly
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (timestamp, event_type)
AS SELECT
    toStartOfHour(timestamp) AS timestamp,
    event_type,
    count() AS event_count,
    uniqExact(user_id) AS unique_users
FROM events
GROUP BY timestamp, event_type;

-- 4. Проверка репликации (если используете)
SELECT
    database,
    table,
    is_leader,
    is_readonly,
    absolute_delay,
    queue_size
FROM system.replicas
WHERE database = 'attribution';
```

### Альтернатива: DataGrip Setup (если выберете)

```yaml
DataGrip преимущества:
  - ClickHouse Explorer plugin (2025)
  - AI-assisted query generation
  - Лучший query planner
  - Интеграция с WebStorm

Setup:
  1. Установите DataGrip
  2. Database → New → Data Source → ClickHouse
  3. Download driver
  4. Configure connection
  5. Установите ClickHouse Explorer plugin:
     - Settings → Plugins → Marketplace → "ClickHouse Explorer"
  6. Enable AI Assistant:
     - Settings → Tools → AI Assistant → Enable

Query optimization features:
  - Ctrl+Alt+L: Format SQL
  - Ctrl+Alt+Shift+L: Optimize imports
  - Ctrl+Space: Smart completion
  - Ctrl+Shift+Enter: Execute query
```

---

## 🔄 Workflow и Best Practices

### Ежедневный workflow

```typescript
// Типичный день разработки:
const dailyWorkflow = {

  // 1. Утро - планирование
  morning: {
    tool: "Cursor Composer",
    tasks: [
      "Ctrl+L: 'Что я делал вчера?'",
      "Ctrl+I: 'План на сегодня: [описание фичи]'",
      "Git: создать feature branch"
    ]
  },

  // 2. Разработка - основная работа
  development: {
    // Frontend (Svelte)
    frontend: {
      tool: "VS Code или Cursor",
      workflow: [
        "Создать компонент в VS Code",
        "Ctrl+K в Cursor: 'Добавь TypeScript типы'",
        "Thunder Client: протестировать API",
        "Hot reload: проверить в браузере"
      ]
    },

    // Backend (Bun + Hono)
    backend: {
      tool: "VS Code",
      workflow: [
        "Создать API route",
        "REST Client: протестировать endpoint",
        "Vitest: написать unit tests",
        "bun test: запустить тесты"
      ]
    },

    // Database (ClickHouse)
    database: {
      tool: "DBeaver",
      workflow: [
        "Написать query в DBeaver",
        "EXPLAIN: проверить план выполнения",
        "Оптимизировать индексы",
        "Скопировать в код"
      ]
    }
  },

  // 3. Рефакторинг
  refactoring: {
    tool: "Cursor Composer",
    workflow: [
      "Ctrl+I: 'Рефактор [описание]'",
      "AI создаст план",
      "Подтвердить изменения",
      "Запустить tests"
    ]
  },

  // 4. Code review
  review: {
    tool: "VS Code + Git Graph",
    workflow: [
      "Git Graph: посмотреть изменения",
      "Ctrl+L в Cursor: 'Review этот PR'",
      "Thunder Client: протестировать API",
      "Commit changes"
    ]
  },

  // 5. Вечер - wrap up
  evening: {
    tool: "VS Code",
    tasks: [
      "git add . && git commit",
      "git push origin feature/xxx",
      "Создать PR через GitHub CLI",
      "Cursor: 'Summarize today's work'"
    ]
  }
}
```

### Multi-workspace setup для monorepo

```yaml
# .vscode/workspace.code-workspace
{
  "folders": [
    {
      "name": "🏠 Root",
      "path": "."
    },
    {
      "name": "🎨 Frontend - Web App",
      "path": "./apps/web"
    },
    {
      "name": "📱 Frontend - Admin",
      "path": "./apps/admin"
    },
    {
      "name": "⚙️ Backend - API",
      "path": "./apps/api"
    },
    {
      "name": "📊 Backend - Analytics",
      "path": "./apps/analytics"
    },
    {
      "name": "📦 Packages - Shared",
      "path": "./packages/shared"
    },
    {
      "name": "🎨 Packages - UI",
      "path": "./packages/ui"
    }
  ],
  "settings": {
    "files.exclude": {
      "**/node_modules": true,
      "**/.turbo": true,
      "**/dist": true
    }
  }
}
```

Откройте workspace:
```bash
code workspace.code-workspace
```

### Git workflow integration

```bash
# В VS Code Terminal (Ctrl+`)

# Алиасы для быстрой работы
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual 'log --oneline --graph --decorate --all'

# Workflow для feature
git co -b feature/fraud-detection
# ... работа ...
git add .
git ci -m "feat: add fraud detection module"
git push -u origin feature/fraud-detection

# Через GitHub CLI (если установлен)
gh pr create --title "Add fraud detection" --body "Описание PR"
```

### Testing workflow

```typescript
// package.json scripts
{
  "scripts": {
    // Development
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=web",
    "dev:api": "turbo run dev --filter=api",

    // Testing
    "test": "turbo run test",
    "test:unit": "vitest",
    "test:e2e": "playwright test",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",

    // Building
    "build": "turbo run build",
    "build:web": "turbo run build --filter=web",

    // Linting
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint -- --fix",
    "format": "prettier --write .",

    // Database
    "db:push": "cd apps/api && bun run prisma db push",
    "db:studio": "cd apps/api && bun run prisma studio",
    "clickhouse:migrate": "cd apps/analytics && bun run migrate"
  }
}
```

В VS Code:
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Dev: Start All",
      "type": "shell",
      "command": "bun run dev",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Test: Run All",
      "type": "shell",
      "command": "bun run test",
      "group": {
        "kind": "test",
        "isDefault": true
      }
    },
    {
      "label": "DB: Push Schema",
      "type": "shell",
      "command": "bun run db:push"
    }
  ]
}
```

---

## 🔧 Troubleshooting

### VS Code проблемы

#### 1. TypeScript медленно работает

```json
// settings.json
{
  "typescript.tsserver.maxTsServerMemory": 4096,
  "typescript.disableAutomaticTypeAcquisition": false,
  "typescript.tsserver.watchOptions": {
    "excludeDirectories": [
      "**/node_modules",
      "**/.turbo",
      "**/dist",
      "**/.svelte-kit"
    ]
  }
}
```

```bash
# Перезапустите TypeScript server
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

#### 2. IntelliSense не работает

```bash
# 1. Проверьте, что TypeScript установлен локально
bun add -D typescript

# 2. Убедитесь, что VS Code использует workspace TypeScript
Ctrl+Shift+P → "TypeScript: Select TypeScript Version" → "Use Workspace Version"

# 3. Перезагрузите window
Ctrl+Shift+P → "Developer: Reload Window"
```

#### 3. Svelte syntax highlighting не работает

```bash
# 1. Установите расширение
code --install-extension svelte.svelte-vscode

# 2. Проверьте настройки
# settings.json:
{
  "svelte.enable-ts-plugin": true,
  "[svelte]": {
    "editor.defaultFormatter": "svelte.svelte-vscode"
  }
}

# 3. Перезапустите Svelte Language Server
Ctrl+Shift+P → "Svelte: Restart Language Server"
```

#### 4. Высокое потребление памяти

```json
// settings.json - отключите ненужные фичи
{
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.turbo/**": true,
    "**/dist/**": true,
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true
  },
  "search.followSymlinks": false,
  "git.autorefresh": false,
  "extensions.autoUpdate": false
}
```

### Cursor проблемы

#### 1. Индексация зависла

```bash
# 1. Очистите индекс
Ctrl+Shift+P → "Cursor: Clear Codebase Index"

# 2. Перезапустите индексацию
Ctrl+Shift+P → "Cursor: Index Codebase"

# 3. Если не помогло - переустановите Cursor
```

#### 2. AI запросы медленные

```json
// settings.json
{
  // Используйте более быструю модель для автодополнения
  "cursor.autocomplete.model": "claude-3-haiku-20240307",

  // Ограничьте размер контекста
  "cursor.chat.maxTokens": 4000,

  // Отключите автоматическую индексацию во время работы
  "cursor.codebase.indexingSchedule": "manual"
}
```

#### 3. Composer создает неправильный код

```
# 1. Убедитесь, что .cursorrules настроен правильно
# 2. Добавьте больше контекста в запрос:

❌ Плохо:
"Создай форму"

✅ Хорошо:
"Создай форму регистрации в Svelte 5 с:
- TypeScript типами
- Zod валидацией
- Error handling
- Submit через fetch к /api/register
- Loading state"

# 3. Используйте @mentions:
"@file:types.ts Создай форму используя эти типы"
```

### DBeaver / ClickHouse проблемы

#### 1. Медленное подключение к ClickHouse

```sql
-- 1. Проверьте, что ClickHouse запущен
-- Windows/Linux:
docker ps | grep clickhouse

-- 2. Проверьте подключение вручную
curl http://localhost:8123/ping

-- 3. В DBeaver используйте HTTP интерфейс (быстрее)
-- Connection type: ClickHouse (HTTP)
-- Port: 8123 (не 9000)
```

#### 2. Query execution timeout

```
DBeaver: Edit Connection → Driver Properties

Добавьте:
  socket_timeout: 300000 (5 минут)
  max_execution_time: 300 (5 минут)
```

#### 3. Out of memory при больших результатах

```sql
-- Используйте LIMIT
SELECT * FROM events
LIMIT 1000;

-- Или в DBeaver:
-- Preferences → SQL Editor → Result Sets
-- Max rows: 10000
```

---

## 🎯 Альтернативные сценарии

### Сценарий 1: Минимальный бюджет (solo-разработчик)

```yaml
Stack:
  - VS Code: Free
  - GitHub Copilot: Free tier (12K completions/month)
  - DBeaver Community: Free

Total: $0/месяц

Компромиссы:
  - Нет multi-file AI refactoring (как в Cursor)
  - Базовая ClickHouse поддержка
  - GitHub Copilot менее мощный чем Cursor

Когда upgrade:
  - Если AI coding критичен → Cursor ($20/м)
  - Если ClickHouse queries сложные → DataGrip ($99/год)
```

### Сценарий 2: Максимальная производительность

```yaml
Stack:
  - Cursor IDE: $20/месяц (AI-first development)
  - DataGrip: $99/год (лучший SQL IDE)
  - GitHub Copilot: $10/месяц (дополнительно)

Total: $39/месяц (первый год)

Преимущества:
  - Максимальная скорость разработки
  - AI помогает с архитектурой
  - Профессиональная работа с ClickHouse
  - Лучший DX

ROI:
  - Экономия 5-10 часов в месяц
  - Окупается за 2-4 часа работы
```

### Сценарий 3: Командная работа (3-5 человек)

```yaml
Stack:
  - WebStorm: $149/год на человека (first year)
  - DataGrip: Включен в WebStorm
  - Cursor: Опционально для AI

JetBrains All Products Pack:
  - $649/год первый год
  - Включает все IDE (WebStorm, DataGrip, IntelliJ, etc.)

Total per person:
  - Year 1: $649/год (~$54/месяц)
  - Year 2: $519/год (~$43/месяц)
  - Year 3+: $389/год (~$32/месяц)

Преимущества:
  - Всё из коробки
  - Единая экосистема
  - Лучшие Git merge tools
  - Профессиональная поддержка
```

### Сценарий 4: Hybrid подход (рекомендуется)

```yaml
Daily work:
  - VS Code: Free (основная разработка)

AI-assisted work:
  - Cursor IDE: $20/месяц (сложные задачи)

Database work:
  - DBeaver Community: Free (начало)
  - → DataGrip: $99/год (когда нужно)

Total:
  - Start: $20/месяц
  - Scale: $28/месяц (с DataGrip)

Best of both worlds:
  - Экономия денег (Free VS Code)
  - AI когда нужно (Cursor)
  - Гибкость (можно upgrade постепенно)
```

---

## 📊 Сравнительная таблица стоимости (3 года)

| Сценарий | Year 1 | Year 2 | Year 3 | Total 3 years | За час* |
|----------|--------|--------|--------|---------------|---------|
| **Минимальный** | $0 | $0 | $0 | $0 | $0 |
| **VS Code + Cursor** | $240 | $240 | $240 | $720 | $0.12 |
| **Hybrid (рекомендуется)** | $336 | $336 | $336 | $1,008 | $0.17 |
| **Maximum Performance** | $468 | $468 | $468 | $1,404 | $0.23 |
| **JetBrains All** | $649 | $519 | $389 | $1,557 | $0.26 |

*При 2000 часов работы в год

---

## ✅ Финальные рекомендации

### Для solo-разработчика (СЕЙЧАС):

```yaml
✅ РЕКОМЕНДУЕТСЯ:
  - VS Code: Free (основная работа 90%)
  - Cursor IDE: $20/месяц (AI-assisted для сложных задач 10%)
  - DBeaver Community: Free (ClickHouse queries)

Итого: $20/месяц
ROI: Окупается за 2-3 часа в месяц
```

### Для команды (БУДУЩЕЕ):

```yaml
✅ РЕКОМЕНДУЕТСЯ:
  - JetBrains All Products Pack: $649/год первый год
  - Cursor IDE: Опционально ($20/месяц на человека)

Итого: ~$54/месяц на человека
ROI: Окупается за 1-2 дня в месяц
```

### Migration path:

```
Phase 1 (Month 1-3): VS Code + Cursor (Free trial → $20/м)
  ↓
Phase 2 (Month 4-6): + DBeaver Community (Free)
  ↓
Phase 3 (Month 7-12): + DataGrip если нужно ($99/год)
  ↓
Phase 4 (Year 2): При найме команды → JetBrains All Products
```

---

## 🔗 Полезные ссылки

### Downloads
- [VS Code](https://code.visualstudio.com/)
- [Cursor IDE](https://cursor.sh/)
- [WebStorm](https://www.jetbrains.com/webstorm/)
- [DataGrip](https://www.jetbrains.com/datagrip/)
- [DBeaver Community](https://dbeaver.io/download/)
- [Zed Editor](https://zed.dev/)

### Расширения VS Code
- [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)
- [Bun for VS Code](https://marketplace.visualstudio.com/items?itemName=oven.bun-vscode)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens)
- [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- [Thunder Client](https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client)

### Документация
- [VS Code Docs](https://code.visualstudio.com/docs)
- [Cursor Docs](https://docs.cursor.sh/)
- [DBeaver ClickHouse](https://dbeaver.com/docs/wiki/ClickHouse/)
- [Svelte Extension Docs](https://github.com/sveltejs/language-tools)

### Benchmarks
- [Editor Performance Comparison](https://github.com/the-benchmarker/web-frameworks)
- [VS Code vs Zed Performance](https://adreasnow.com/posts/vscode-vs-zed/)
- [SQL IDE Comparison](https://www.getgalaxy.io/blog/clickhouse-sql-console-alternatives-2025)

---

**Последнее обновление:** 2025-10-20
**Версия:** 1.0
**Автор:** Attribution Platform Development Team

---

**Следующие шаги:**
1. ✅ Установите VS Code и расширения
2. ✅ Попробуйте Cursor IDE (14-дневный trial)
3. ✅ Настройте DBeaver для ClickHouse
4. ✅ Создайте workspace для monorepo
5. ✅ Настройте .cursorrules для проекта

**Готовы начать разработку!** 🚀
