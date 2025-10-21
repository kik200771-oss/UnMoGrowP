# UI/UX Agent - Быстрый старт 🚀

## Что это?

AI-агент на базе Claude 3.5 Sonnet для автоматического анализа и улучшения UI компонентов.

## Запуск за 30 секунд

### 1. Проверьте API ключ
В файле `.env.local` должен быть:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 2. Запустите сервер
```bash
npm run dev
```

### 3. Откройте демо
Перейдите на http://localhost:3000/ui-ux-demo

## Что можно делать?

### 🎯 Полный анализ компонента
1. Выберите компонент из галереи (например, "Bad Button")
2. Нажмите **"Full Analysis"**
3. Получите детальный отчет:
   - Accessibility score (WCAG compliance)
   - Usability score
   - Visual Design score
   - Конкретные рекомендации с кодом

### ✨ Получить улучшения
1. Выберите компонент
2. Нажмите **"Get Improvements"**
3. Получите:
   - Список улучшений по категориям
   - Сравнение кода "до" и "после"

### ♿ Проверить accessibility
1. Выберите компонент
2. Нажмите **"Check A11y"**
3. Получите быстрый отчет по доступности

## Примеры компонентов в галерее

| Компонент | Качество | Основные проблемы |
|-----------|----------|-------------------|
| Test Button | 🟡 Medium | Нет ARIA, плохой focus |
| Bad Button (DIV) | 🔴 Bad | DIV вместо button, нет keyboard |
| Poor Contrast Card | 🔴 Bad | Низкий контраст текста |
| Confusing Form | 🔴 Bad | Нет labels, плохая структура |
| Good Button | 🟢 Good | Правильная реализация ✓ |
| Accessible Form | 🟢 Good | Labels, ARIA, help text ✓ |

## Используйте в своём коде

### Вариант 1: Через API
```typescript
const response = await fetch('/api/ui-ux/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    componentCode: yourCode,
    componentType: 'button',
    context: 'Form submit button'
  })
});

const analysis = await response.json();
console.log(analysis.score); // 75
```

### Вариант 2: Напрямую (server-side)
```typescript
import { getUIUXAgent } from '@/lib/agents/ui-ux/agent';

const agent = getUIUXAgent();
const analysis = await agent.analyzeComponent({
  componentCode: '...',
  componentType: 'button'
});
```

## API Endpoints

- `POST /api/ui-ux/analyze` - Полный анализ
- `POST /api/ui-ux/improve` - Улучшения кода
- `POST /api/ui-ux/accessibility` - Проверка A11y
- `POST /api/ui-ux/suggestions` - Дизайн-рекомендации

## Типичные результаты

### Хороший компонент (90+)
```
✓ Score: 95/100
✓ WCAG Level: AA
✓ Все ARIA атрибуты на месте
✓ Отличная контрастность
✓ Keyboard navigation работает
```

### Плохой компонент (< 50)
```
✗ Score: 35/100
✗ WCAG Level: none
✗ Нет семантического HTML
✗ Отсутствуют ARIA атрибуты
✗ Низкий контраст цветов
✗ Keyboard navigation не работает

Рекомендации:
→ Используйте <button> вместо <div>
→ Добавьте aria-label
→ Увеличьте контраст до 4.5:1
→ Добавьте :focus стили
```

## Проблемы?

### Ошибка: "ANTHROPIC_API_KEY not set"
Добавьте API ключ в `.env.local`

### Ошибка: "Failed to analyze"
1. Проверьте, что API ключ валидный
2. Проверьте, что есть доступ к Anthropic API
3. Посмотрите логи в консоли браузера

### Долгий анализ
Анализ занимает 5-15 секунд, это нормально - AI анализирует код детально.

## Следующие шаги

1. ✅ Протестируйте все примеры в демо
2. ✅ Попробуйте проанализировать свои компоненты
3. ✅ Изучите полную документацию в `docs/UI-UX-AGENT.md`
4. ✅ Интегрируйте в свой workflow

## Полезные ссылки

- 📖 Полная документация: `docs/UI-UX-AGENT.md`
- 🎯 Демо: http://localhost:3000/ui-ux-demo
- 🔧 API код: `app/api/ui-ux/`
- 🧠 Agent код: `lib/agents/ui-ux/`

---

**Нужна помощь?** Посмотрите примеры в `lib/agents/ui-ux/examples.ts`
