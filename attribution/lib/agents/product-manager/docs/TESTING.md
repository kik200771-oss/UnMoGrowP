# Тестирование Product Manager Agent

## Запуск тестов

```bash
npm run test:pm
```

Или напрямую:

```bash
npx tsx scripts/test-product-manager-demo.ts
```

---

## Что тестируется

### 1. Определение места для файлов ✅

Product Manager корректно определяет куда должны быть перемещены файлы:

| Файл | Куда перемещать |
|------|-----------------|
| `SETUP_NEW.md` | `docs/setup/` |
| `install-python.ps1` | `scripts/setup/` |
| `WORKFLOW_DESIGN.md` | `docs/workflows/` |
| `docker-compose.dev.yml` | `config/` |
| `QUICK-START-2.md` | `docs/guides/` |
| `STATUS_REPORT.md` | `docs/status/` |
| `UI-UX-GUIDE.md` | `lib/agents/ui-ux/docs/` |

**API:**
```typescript
productManager.suggestFileLocation('install-python.ps1');
// → 'scripts/setup/'
```

---

### 2. Проверка файлов в корне ✅

Product Manager знает какие файлы разрешены в корне проекта:

**✅ Разрешены:**
- `README.md`, `PROJECT_STRUCTURE.md`
- `package.json`, `package-lock.json`
- `next.config.ts` - Next.js требует в корне
- `tsconfig.json` - TypeScript требует в корне
- `components.json` - Shadcn CLI требует в корне
- `tailwind.config.ts` - Tailwind требует в корне
- `eslint.config.mjs` - ESLint требует в корне
- `.env` файлы

**❌ Запрещены (с предложениями куда переместить):**
- `SETUP.md` → `docs/setup/`
- `install-docker.ps1` → `scripts/setup/`
- `docker-compose.yml` → `config/`
- Любые другие markdown документы

**API:**
```typescript
productManager.isAllowedInRoot('next.config.ts');
// → true (ДОЛЖЕН быть в корне)

productManager.isAllowedInRoot('SETUP.md');
// → false (переместить в docs/setup/)
```

---

### 3. Структура проекта ✅

Product Manager знает полную структуру проекта:

```typescript
const structure = productManager.getProjectStructure();
// → Массив из 16 папок с описанием их назначения
```

**Агенты с документацией:**
- `lib/agents/ui-ux/` - UI/UX Agent
- `lib/agents/design-analyzer/` - Design Analyzer
- `lib/agents/product-manager/` - Product Manager

**Категории документации:**
- `docs/setup/` - установка и настройка
- `docs/workflows/` - рабочие процессы
- `docs/architecture/` - архитектура
- `docs/guides/` - руководства
- `docs/status/` - статусы и отчеты

**Скрипты и конфиги:**
- `scripts/` - утилиты
- `scripts/setup/` - PowerShell скрипты
- `config/` - конфигурация сервисов

---

### 4. Правила организации ✅

Product Manager имеет 10 правил для разных типов файлов:

```typescript
const rules = productManager.getOrganizationRules();
```

**Правила:**

1. **PowerShell скрипты** (`*.ps1`) → `scripts/setup/`
2. **Docker конфиги** (`docker-compose*.yml`) → `config/`
3. **Setup документы** (`SETUP*.md`, `INSTALL*.md`) → `docs/setup/`
4. **Workflow документы** (`WORKFLOW*.md`) → `docs/workflows/`
5. **Архитектура** (`ARCHITECTURE*.md`, `TECH*.md`) → `docs/architecture/`
6. **Руководства** (`QUICK-START*.md`, `GUIDE*.md`) → `docs/guides/`
7. **Статусы** (`STATUS*.md`, `REPORT*.md`) → `docs/status/`
8. **UI/UX docs** (`UI-UX*.md`) → `lib/agents/ui-ux/docs/`
9. **Design Analyzer docs** (`DESIGN-ANALYZER*.md`) → `lib/agents/design-analyzer/docs/`
10. **Product Manager docs** (`PRODUCT-MANAGER*.md`) → `lib/agents/product-manager/docs/`

---

### 5. Валидация структуры ✅

Product Manager может валидировать структуру проекта:

```typescript
const validation = await productManager.validateStructure();

if (validation.valid) {
  console.log('✅ Структура валидна');
} else {
  console.log('❌ Проблемы:', validation.issues);
  console.log('💡 Предложения:', validation.suggestions);
}
```

---

## 🆕 Новые тесты (Версия 2.0)

### 6. Мониторинг Claude Command Agents ✅

Product Manager знает о 11 AI агентах в `.claude/commands`:

```typescript
const agents = productManager.getClaudeCommandAgents();
// → 11 агентов (237 KB промптов)
```

**Агенты:**
- orchestrator (28 KB) - Координация
- pm (22 KB) - Product Management
- frontend (21 KB) - Svelte 5 разработка
- backend-go (20 KB) - Go backend
- ml (14 KB) - ML/AI пайплайны
- ux (18 KB) - UX дизайн
- techlead (25 KB) - Архитектура
- qa (16 KB) - Тестирование
- devops (19 KB) - DevOps
- security (17 KB) - Безопасность
- docs (17 KB) - Документация

---

### 7. Статус технологического стека ✅

Product Manager отслеживает соответствие стека:

```typescript
const stackStatus = productManager.getStackStatus();
const hasMismatches = productManager.hasStackMismatches(); // true
const criticalIssues = productManager.getCriticalStackIssues(); // 5 проблем
```

**Найденные несоответствия:**
- ⚠️ Frontend: Svelte 5 → Next.js (производительность 3-5x хуже)
- ❌ Backend: Go не создан (критично)
- ❌ API Layer: Bun не создан
- ❌ Attribution Engine: Rust не создан
- ❌ ML Pipeline: Python не создан
- ✅ Data Infrastructure: полностью соответствует

---

### 8. Рекомендации по миграции ✅

Product Manager предоставляет 3 варианта миграции:

```typescript
const recommendations = productManager.getMigrationRecommendations();
console.log(recommendations.recommended); // "Variant A"
```

**Варианты:**
- **Variant A** (рекомендуется): Полная миграция на Svelte 5 (2-3 дня)
- **Variant B**: Гибридный подход (2 дня)
- **Variant C**: Обновить агентов под Next.js (5-7 дней)

---

## Результаты последнего теста

**Дата:** 21 октября 2025 (обновлено)
**Версия:** 2.0
**Результат:** ✅ 18/18 тестов пройдено (100%)

```
📊 ИТОГОВАЯ СТАТИСТИКА

Всего тестов: 18
✅ Успешно: 18 (100.0%)
❌ Провалено: 0

🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!

💡 Дополнительная информация

Product Manager теперь знает о:
  ✓ 11 AI агентах в .claude/commands (237 KB промптов)
  ✓ Оригинальной концепции из DOCUMENTS/ (350+ страниц)
  ✓ Несоответствии стека: Svelte 5 → Next.js
  ✓ Отсутствующих компонентах: Go backend, Bun API, ML pipeline
  ✓ 3 вариантах миграции с рекомендациями
```

---

## Примеры использования

### Пример 1: Проверка нового файла

```typescript
import { productManager } from '@/lib/agents/product-manager/agent';

// Создали новый файл INSTALL_PYTHON.md
const location = productManager.suggestFileLocation('INSTALL_PYTHON.md');
console.log(`Переместить в: ${location}`);
// → "Переместить в: docs/setup/"

// Проверяем можно ли оставить в корне
const allowed = productManager.isAllowedInRoot('INSTALL_PYTHON.md');
if (!allowed) {
  console.log('Файл должен быть перемещен');
}
```

### Пример 2: Валидация перед коммитом

```typescript
// Pre-commit hook
const validation = await productManager.validateStructure();

if (!validation.valid) {
  console.error('❌ Структура проекта нарушена!');
  console.error('Проблемы:');
  validation.issues.forEach(issue => console.error(`  - ${issue}`));
  process.exit(1);
}
```

### Пример 3: Генерация отчета

```typescript
const report = productManager.generateStructureReport();
console.log(report);
// → Markdown отчет о структуре проекта
```

---

## Интеграция в CI/CD

### GitHub Actions пример:

```yaml
name: Validate Project Structure

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:pm
      - name: Check structure
        run: |
          if [ $? -ne 0 ]; then
            echo "❌ Product Manager tests failed!"
            exit 1
          fi
```

---

## Troubleshooting

### Тест провален: "Файл не найден"

**Проблема:** Product Manager не смог определить место для файла

**Решение:** Добавить новое правило в `organizationRules`:

```typescript
{
  pattern: /^NEW_PATTERN.*\.md$/i,
  destination: 'docs/new-category/',
  category: 'new-category',
}
```

### Тест провален: "Неверная проверка корня"

**Проблема:** Файл неправильно классифицирован как разрешенный/запрещенный

**Решение:** Обновить список в методе `isAllowedInRoot()`:

```typescript
const allowedFiles = [
  // ... existing files
  'new-required-config.json',
];
```

---

## Документация

- [README.md](./README.md) - Основная документация Product Manager
- [MISSION.md](./MISSION.md) - Задание и ответственности
- [TESTING.md](./TESTING.md) - Это документ

---

**Последнее обновление:** 21 октября 2025
