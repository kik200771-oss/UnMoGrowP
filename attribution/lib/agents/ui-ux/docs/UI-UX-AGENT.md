# UI/UX Agent - AI-Powered Interface Analysis

Интеллектуальный агент на базе Claude 3.5 Sonnet для анализа и улучшения пользовательских интерфейсов.

## 🎯 Возможности

### 1. Полный UI/UX Анализ (`/api/ui-ux/analyze`)
- **Accessibility** - проверка доступности (WCAG 2.1 AA/AAA)
- **Usability** - анализ удобства использования
- **Visual Design** - оценка визуального дизайна
- Детальные рекомендации с примерами кода
- Общий score и WCAG compliance level

### 2. Улучшение Компонентов (`/api/ui-ux/improve`)
- Конкретные улучшения по категориям
- Сравнение кода "до" и "после"
- Рекомендации по accessibility, usability, и визуальному дизайну

### 3. Проверка Accessibility (`/api/ui-ux/accessibility`)
- Быстрая проверка доступности
- Список проблем и рекомендаций
- WCAG compliance score

### 4. Дизайн-рекомендации (`/api/ui-ux/suggestions`)
- Генерация предложений по улучшению дизайна
- Учет Design System
- Обоснование каждого предложения

## 🚀 Демо

Откройте http://localhost:3000/ui-ux-demo для интерактивной демонстрации:

### Примеры компонентов:
1. **Test Button** - простая кнопка с проблемами accessibility
2. **Bad Button** - использует DIV вместо button (critical issues)
3. **Poor Contrast Card** - низкая контрастность текста
4. **Confusing Form** - форма без labels и структуры
5. **Good Button** - правильная реализация с ARIA
6. **Accessible Form** - корректная форма с labels и help text

## 📋 Использование

### Frontend (Client-side)

```typescript
import { analyzeComponent } from '@/lib/agents/ui-ux';

const result = await analyzeComponent({
  componentCode: '...',
  componentType: 'button',
  context: 'Primary action button in dashboard'
});
```

### API Endpoints

#### POST /api/ui-ux/analyze
```json
{
  "componentCode": "export function Button() { ... }",
  "componentType": "button",
  "context": "Primary action button",
  "designSystem": { /* optional */ }
}
```

**Response:**
```json
{
  "score": 75,
  "accessibility": {
    "score": 70,
    "wcagLevel": "AA",
    "issues": [...],
    "passed": [...]
  },
  "usability": { ... },
  "visualDesign": { ... },
  "recommendations": [...]
}
```

#### POST /api/ui-ux/improve
```json
{
  "componentCode": "...",
  "componentType": "button"
}
```

**Response:**
```json
{
  "component": "Button",
  "improvements": {
    "accessibility": ["Add ARIA labels", ...],
    "usability": ["Improve focus states", ...],
    "visual": ["Enhance contrast", ...]
  },
  "codeSnippets": {
    "before": "...",
    "after": "..."
  }
}
```

#### POST /api/ui-ux/accessibility
```json
{
  "componentCode": "..."
}
```

**Response:**
```json
{
  "score": 65,
  "issues": ["Missing ARIA labels", ...],
  "recommendations": ["Add aria-label attribute", ...]
}
```

## 🔧 Настройка

### 1. API Key
Добавьте Anthropic API key в `.env.local`:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 2. Импорт агента
```typescript
import { getUIUXAgent } from '@/lib/agents/ui-ux/agent';

const agent = getUIUXAgent();
const analysis = await agent.analyzeComponent({...});
```

## 📊 Система оценок

| Score | Уровень | Описание |
|-------|---------|----------|
| 90-100 | Excellent | Отличная реализация |
| 70-89 | Good | Хорошая, но есть улучшения |
| 50-69 | Fair | Средняя, нужны изменения |
| 0-49 | Poor | Плохая, много проблем |

## 🎨 Design System Integration

Агент может учитывать ваш Design System:

```typescript
const designSystem = {
  colors: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    // ...
  },
  spacing: {
    unit: 4,
    scale: [0, 4, 8, 12, 16, 24, 32, 48, 64]
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    // ...
  }
};

await agent.analyzeComponent({
  componentCode: '...',
  designSystem
});
```

## 🧪 Тестирование

1. Запустите dev сервер: `npm run dev`
2. Откройте http://localhost:3000/ui-ux-demo
3. Выберите компонент из галереи
4. Нажмите одну из кнопок:
   - **Full Analysis** - полный анализ
   - **Get Improvements** - улучшения кода
   - **Check A11y** - проверка accessibility

## 📚 Примеры

### Пример 1: Анализ кнопки
```typescript
const analysis = await agent.analyzeComponent({
  componentCode: `
    <button onClick={handleClick}>
      Submit
    </button>
  `,
  componentType: 'button',
  context: 'Form submission button'
});

console.log(analysis.score); // 45
console.log(analysis.recommendations); // [...]
```

### Пример 2: Улучшение формы
```typescript
const improvement = await agent.improveComponent(
  formCode,
  'form'
);

console.log(improvement.improvements.accessibility);
// ["Add labels for all inputs", "Include field descriptions", ...]
```

## 🔍 Что проверяет агент

### Accessibility
- ARIA атрибуты
- Семантический HTML
- Клавиатурная навигация
- Контрастность цветов
- Screen reader поддержка
- Focus management

### Usability
- Ясность интерфейса (Clarity)
- Эффективность (Efficiency)
- Обучаемость (Learnability)
- Feedback для пользователя
- Error handling

### Visual Design
- Контраст (Contrast)
- Визуальная иерархия (Hierarchy)
- Консистентность (Consistency)
- Использование пространства (Whitespace)
- Типографика
- Цветовая схема

## 🛠️ Архитектура

```
lib/agents/ui-ux/
├── agent.ts              # Основной UI/UX Agent класс
├── types.ts              # TypeScript типы
├── utils/
│   ├── client.ts         # Клиентские функции
│   └── helpers.ts        # Вспомогательные функции
├── examples.ts           # Примеры использования
└── README.md            # Документация

app/api/ui-ux/
├── analyze/route.ts      # Полный анализ
├── improve/route.ts      # Улучшение компонентов
├── accessibility/route.ts # Проверка accessibility
└── suggestions/route.ts  # Дизайн-рекомендации

app/ui-ux-demo/
└── page.tsx             # Демо-страница

app/components/ui-ux-examples/
├── BadButton.tsx         # Примеры плохих паттернов
├── GoodButton.tsx        # Примеры хороших паттернов
├── PoorContrastCard.tsx
├── ConfusingForm.tsx
└── AccessibleForm.tsx
```

## 🤝 Contributing

Для добавления новых возможностей:

1. Расширьте `UIUXAgent` класс в `lib/agents/ui-ux/agent.ts`
2. Добавьте типы в `lib/agents/ui-ux/types.ts`
3. Создайте API endpoint в `app/api/ui-ux/`
4. Обновите демо-страницу

## 📝 Roadmap

- [ ] Batch analysis для нескольких компонентов
- [ ] Интеграция с реальными тестами accessibility
- [ ] Автоматическое применение улучшений
- [ ] Генерация Design System из компонентов
- [ ] A/B тестирование вариантов UI
- [ ] Анализ скриншотов интерфейса

## 📄 License

MIT
