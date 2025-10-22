# Команда агентов Attribution Platform

> Дата создания: 21 октября 2025
> Статус: Активная разработка

---

## 👥 Состав команды

### 1. Product Manager Agent 🎯

**Статус:** Активный
**Расположение:** `lib/agents/product-manager/`
**Документация:** `lib/agents/product-manager/docs/README.md`

**Роль:**
- Главный координатор проекта
- Контроль структуры и организации
- Мониторинг качества
- Управление другими агентами

**Ответственность:**
- ✅ Контроль структуры папок и файлов
- ✅ Организация документации
- ✅ Валидация размещения новых файлов
- ✅ Координация работы агентов
- ✅ Генерация отчетов о состоянии проекта

**Ключевые задачи:**
1. Следить за тем, чтобы все файлы были в правильных папках
2. Предлагать улучшения структуры
3. Обеспечивать актуальность документации
4. Разрешать конфликты между агентами

**API:**
```typescript
import { productManager } from '@/lib/agents/product-manager/agent';

// Проверка структуры
const validation = await productManager.validateStructure();

// Определение места для файла
const location = productManager.suggestFileLocation('SETUP_NEW.md');

// Генерация отчета
const report = productManager.generateStructureReport();
```

---

### 2. UI/UX Agent 🎨

**Статус:** Активный
**Расположение:** `lib/agents/ui-ux/`
**Документация:** `lib/agents/ui-ux/docs/`

**Роль:**
- Анализ UI/UX качества компонентов
- Проверка accessibility
- Оценка usability
- Контроль визуального дизайна

**Ответственность:**
- ✅ Анализ React/HTML компонентов
- ✅ Проверка WCAG соответствия
- ✅ Оценка по шкале 0-100
- ✅ Предоставление рекомендаций

**Технологии:**
- Claude Sonnet 4.5 API
- React/TypeScript анализ
- WCAG 2.1 стандарты

**API Endpoint:**
```bash
POST /api/ui-ux/analyze
{
  "componentCode": "React code here",
  "componentType": "button"
}
```

**Документация:**
- `lib/agents/ui-ux/docs/README.md` - основная документация
- `lib/agents/ui-ux/docs/UI-UX-AGENT.md` - детальное описание
- `lib/agents/ui-ux/docs/UI-UX-QUICKSTART.md` - быстрый старт

---

### 3. Design Analyzer Agent 🔍

**Статус:** Активный (создан 21 октября 2025)
**Расположение:** `lib/agents/design-analyzer/`
**Документация:** `lib/agents/design-analyzer/docs/`

**Роль:**
- Анализ дизайна из скриншотов
- Генерация детальных спецификаций
- Извлечение цветов, размеров, отступов
- Описание интерактивных состояний

**Ответственность:**
- ✅ Анализ скриншотов дизайна
- ✅ Генерация JSON спецификаций
- ✅ Извлечение точных значений (цвета, размеры)
- ✅ Описание hover/focus/active состояний
- ✅ Определение z-index и наложений

**Технологии:**
- Claude Sonnet 4.5 API (vision)
- Image analysis
- JSON specification generation

**API Endpoint:**
```bash
POST /api/design/analyze
{
  "imageBase64": "base64 encoded image",
  "description": "Optional description"
}
```

**Использование:**
```typescript
import { DesignAnalyzer } from '@/lib/agents/design-analyzer/agent';

const analyzer = new DesignAnalyzer(apiKey);
const spec = await analyzer.analyzeDesign(imageBase64, 'Login page');
```

**Выход:** Детальная JSON спецификация с:
- Точными цветами (rgb/hex)
- Размерами всех элементов
- Отступами и gaps
- Shadows, transitions, effects
- Структурой компонентов
- Интерактивными состояниями

---

## 🔄 Взаимодействие агентов

### Workflow: Создание нового UI компонента

```
1. Design Analyzer
   ↓ (Анализирует скриншот)
   ↓ (Генерирует спецификацию)

2. Developer (человек)
   ↓ (Создает HTML прототип)
   ↓ (Проверяет в браузере)

3. UI/UX Agent
   ↓ (Анализирует прототип)
   ↓ (Дает рекомендации)

4. Developer
   ↓ (Вносит правки)
   ↓ (Конвертирует в React)

5. Product Manager
   ↓ (Проверяет размещение файлов)
   ↓ (Обновляет документацию)
```

### Hierarchy

```
Product Manager (координатор)
├── UI/UX Agent (проверка качества UI)
├── Design Analyzer (анализ дизайна)
└── (Будущие агенты)
```

---

## 📊 Метрики команды

### Производительность

| Агент | Задач выполнено | Время отклика | Точность |
|-------|----------------|---------------|----------|
| Product Manager | - | Мгновенно | 100% |
| UI/UX Agent | 10+ | 30-60s | 95% |
| Design Analyzer | 1 (тест) | 30-60s | TBD |

### Качество работы

- **UI/UX Agent:** Успешно выявил проблемы в компонентах
- **Design Analyzer:** Только создан, требует тестирования
- **Product Manager:** Успешно реорганизовал структуру проекта

---

## 🎯 Текущие задачи команды

### Product Manager
- ✅ Реорганизация структуры проекта
- ✅ Создание системы категоризации файлов
- 🔄 Мониторинг соблюдения структуры
- 📋 Генерация отчетов о состоянии проекта

### UI/UX Agent
- ✅ Анализ компонентов
- ✅ Интеграция в workflow
- 📋 Улучшение JSON parsing
- 📋 Расширение базы рекомендаций

### Design Analyzer
- ✅ Создание базового функционала
- 🔄 Тестирование на реальных кейсах
- 📋 Интеграция в workflow разработки
- 📋 Автогенерация HTML из спецификаций

---

## 🚀 Будущие агенты

### Testing Agent (планируется)
**Роль:** Автоматическое тестирование
**Ответственность:**
- Генерация unit тестов
- E2E тестирование
- Проверка покрытия

### Documentation Agent (планируется)
**Роль:** Автоматическое обновление документации
**Ответственность:**
- Генерация API документации
- Обновление README файлов
- Синхронизация версий

### Code Quality Agent (планируется)
**Роль:** Контроль качества кода
**Ответственность:**
- Code review
- Проверка на code smells
- Предложения по рефакторингу

---

## 📞 Связь с агентами

### Для разработчиков

**Product Manager:**
```typescript
import { productManager } from '@/lib/agents/product-manager/agent';
```

**UI/UX Agent:**
```typescript
import { UIUXAgent } from '@/lib/agents/ui-ux/agent';
```

**Design Analyzer:**
```typescript
import { DesignAnalyzer } from '@/lib/agents/design-analyzer/agent';
```

### API Endpoints

- `/api/ui-ux/analyze` - UI/UX анализ
- `/api/design/analyze` - Design анализ

---

## 📚 Документация

Полная документация каждого агента находится в `lib/agents/[agent-name]/docs/README.md`

- [Product Manager Docs](../lib/agents/product-manager/docs/README.md)
- [UI/UX Agent Docs](../lib/agents/ui-ux/docs/README.md)
- [Design Analyzer Docs](../lib/agents/design-analyzer/docs/) (TBD)

---

## 🏆 Достижения команды

- ✅ Успешная реорганизация структуры проекта
- ✅ Создание системы категоризации документов
- ✅ Интеграция UI/UX анализа в workflow
- ✅ Создание Design Analyzer для автоматического анализа дизайна
- ✅ Улучшение процесса разработки (8-10 итераций → 2-3)

---

**Последнее обновление:** 21 октября 2025
**Статус команды:** Активная разработка
**Координатор:** Product Manager Agent
