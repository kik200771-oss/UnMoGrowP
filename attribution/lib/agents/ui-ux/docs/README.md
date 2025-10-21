# UI/UX Agent

AI-ассистент для анализа и улучшения пользовательского интерфейса, использующий Claude API.

## Возможности

- **Анализ компонентов**: Детальный анализ UI компонентов по accessibility, usability и visual design
- **Рекомендации по дизайну**: Генерация конкретных предложений по улучшению UX
- **Улучшение кода**: Автоматические предложения по улучшению кода компонентов
- **Проверка accessibility**: Специализированная проверка доступности (WCAG 2.1)

## Структура

```
lib/agents/ui-ux/
├── agent.ts          # Основной класс агента
├── types.ts          # TypeScript типы и интерфейсы
├── index.ts          # Публичное API
├── utils/
│   ├── client.ts     # Клиентские утилиты для API
│   └── helpers.ts    # Вспомогательные функции
└── README.md         # Документация
```

## Установка

1. Добавьте API ключ Anthropic в `.env.local`:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

2. Установите зависимости (если еще не установлены):

```bash
npm install @anthropic-ai/sdk
```

## Использование

### Server-side (API Routes, Server Components)

```typescript
import { getUIUXAgent } from '@/lib/agents/ui-ux';

// Создаем экземпляр агента
const agent = getUIUXAgent();

// Анализируем компонент
const analysis = await agent.analyzeComponent({
  componentCode: `
    <button className="bg-blue-500 text-white px-4 py-2">
      Click me
    </button>
  `,
  componentType: 'button',
  context: 'Primary action button for form submission',
});

console.log(analysis);
// {
//   score: 75,
//   accessibility: { score: 80, issues: [...], ... },
//   usability: { score: 70, ... },
//   visualDesign: { score: 75, ... },
//   recommendations: [...],
//   summary: "..."
// }
```

### Client-side (React Components)

```typescript
'use client';

import { useState } from 'react';
import { analyzeComponent } from '@/lib/agents/ui-ux';
import type { UIAnalysisResponse } from '@/lib/agents/ui-ux';

export function ComponentAnalyzer() {
  const [analysis, setAnalysis] = useState<UIAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeComponent({
        componentCode: '...ваш код...',
        componentType: 'button',
      });
      setAnalysis(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Анализирую...' : 'Анализировать'}
      </button>
      {analysis && (
        <div>
          <h3>Общая оценка: {analysis.score}/100</h3>
          <p>{analysis.summary}</p>
        </div>
      )}
    </div>
  );
}
```

## API Endpoints

### POST /api/ui-ux/analyze

Анализирует UI компонент и возвращает детальный отчет.

**Request:**
```json
{
  "componentCode": "string",
  "componentType": "button | form | card | navigation | layout | other",
  "context": "string (optional)",
  "designSystem": { ... } // optional
}
```

**Response:**
```json
{
  "score": 85,
  "accessibility": {
    "score": 90,
    "issues": [...],
    "passed": [...],
    "wcagLevel": "AA"
  },
  "usability": { ... },
  "visualDesign": { ... },
  "recommendations": [...],
  "summary": "..."
}
```

### POST /api/ui-ux/suggestions

Генерирует рекомендации по улучшению дизайна.

**Request:**
```json
{
  "context": "string",
  "designSystem": { ... } // optional
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "type": "color | spacing | typography | layout | interaction",
      "suggestion": "...",
      "reasoning": "..."
    }
  ]
}
```

### POST /api/ui-ux/improve

Анализирует компонент и предлагает улучшения кода.

**Request:**
```json
{
  "componentCode": "string",
  "componentType": "string"
}
```

**Response:**
```json
{
  "component": "ButtonComponent",
  "improvements": {
    "accessibility": [...],
    "usability": [...],
    "visual": [...]
  },
  "codeSnippets": {
    "before": "...",
    "after": "..."
  }
}
```

### POST /api/ui-ux/accessibility

Проверяет accessibility компонента.

**Request:**
```json
{
  "componentCode": "string"
}
```

**Response:**
```json
{
  "score": 85,
  "issues": [...],
  "recommendations": [...]
}
```

## Примеры использования

### Пример 1: Анализ кнопки

```typescript
import { getUIUXAgent } from '@/lib/agents/ui-ux';

const agent = getUIUXAgent();

const buttonCode = `
export function SubmitButton() {
  return (
    <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
      Submit
    </button>
  );
}
`;

const analysis = await agent.analyzeComponent({
  componentCode: buttonCode,
  componentType: 'button',
  context: 'Form submission button',
});

console.log('Score:', analysis.score);
console.log('Accessibility issues:', analysis.accessibility.issues);
console.log('Recommendations:', analysis.recommendations);
```

### Пример 2: Улучшение формы

```typescript
const formCode = `
<form onSubmit={handleSubmit}>
  <input type="text" name="email" placeholder="Email" />
  <input type="password" name="password" placeholder="Password" />
  <button type="submit">Login</button>
</form>
`;

const improvement = await agent.improveComponent(formCode, 'form');

console.log('Improvements:');
console.log('Accessibility:', improvement.improvements.accessibility);
console.log('Usability:', improvement.improvements.usability);
console.log('\nImproved code:');
console.log(improvement.codeSnippets?.after);
```

### Пример 3: Получение рекомендаций по дизайну

```typescript
const suggestions = await agent.getDesignSuggestions(
  'Dashboard для аналитики маркетинговых данных с графиками и метриками',
  {
    colors: {
      primary: '#4F46E5',
      secondary: '#06B6D4',
      background: '#F9FAFB',
      text: '#111827',
    },
    spacing: {
      unit: 4,
      scale: [1, 2, 3, 4, 6, 8, 12, 16],
    },
    typography: {
      fontFamily: 'Inter',
      fontSizes: [12, 14, 16, 18, 24, 32],
      lineHeights: [1.2, 1.4, 1.6, 1.8],
    },
    borderRadius: [4, 8, 12, 16],
  }
);

suggestions.forEach((suggestion) => {
  console.log(`[${suggestion.type}] ${suggestion.suggestion}`);
  console.log(`Reasoning: ${suggestion.reasoning}\n`);
});
```

### Пример 4: Проверка accessibility

```typescript
const componentCode = `
<nav className="flex gap-4">
  <a href="/home">Home</a>
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
</nav>
`;

const accessibilityReport = await agent.checkAccessibility(componentCode);

console.log('Accessibility score:', accessibilityReport.score);
console.log('Issues found:', accessibilityReport.issues);
console.log('Recommendations:', accessibilityReport.recommendations);
```

## Вспомогательные утилиты

```typescript
import {
  sortIssuesBySeverity,
  getScoreColor,
  getScoreLabel,
  calculateOverallScore,
} from '@/lib/agents/ui-ux';

// Сортировка проблем по серьезности
const sortedIssues = sortIssuesBySeverity(analysis.accessibility.issues);

// Получение цвета для score
const color = getScoreColor(analysis.score); // 'green' | 'yellow' | 'orange' | 'red'

// Получение текстового описания
const label = getScoreLabel(analysis.score); // 'Отлично' | 'Хорошо' | ...

// Вычисление общего score
const overallScore = calculateOverallScore({
  accessibility: 85,
  usability: 75,
  visualDesign: 80,
});
```

## Best Practices

1. **Предоставляйте контекст**: Чем больше контекста вы предоставите (назначение компонента, user flow, design system), тем лучше будет анализ.

2. **Используйте design system**: Если у вас есть design system, передавайте его конфигурацию для более точных рекомендаций.

3. **Итеративное улучшение**: Применяйте рекомендации постепенно и проверяйте результат снова.

4. **Проверяйте код**: AI может ошибаться, всегда проверяйте сгенерированный код перед использованием.

5. **Комбинируйте методы**: Используйте разные методы агента для комплексного анализа.

## Ограничения

- Требуется API ключ Anthropic
- Анализ занимает время (обычно 2-5 секунд)
- AI может давать неточные рекомендации - всегда проверяйте
- Лучше всего работает с React/TypeScript компонентами

## Troubleshooting

### Error: "Missing API key"

Убедитесь, что в `.env.local` установлен `ANTHROPIC_API_KEY`.

### Error: "Failed to parse AI response"

AI иногда возвращает ответ не в ожидаемом формате. Попробуйте:
- Упростить код компонента
- Добавить больше контекста
- Повторить запрос

### Медленная работа

- Используйте кэширование результатов на клиенте
- Рассмотрите debouncing для частых запросов
- Оптимизируйте размер передаваемого кода

## Лицензия

MIT
