# 🚀 Краткая сводка среды разработки

## Что подключено

### 1. Система контроля версий
- ✅ **Git** - система контроля версий
- ✅ **GitHub** - удаленный репозиторий

### 2. Контейнеризация (Docker Desktop)
- ✅ **ClickHouse** (порт 8123, 9000) - OLAP база для аналитики
- ✅ **PostgreSQL** (порт 5432) - OLTP база для операционных данных
- ✅ **Redis** (порт 6379) - кеш и хранилище сессий
- ✅ **Zookeeper** (порт 2181) - координация для Kafka
- ✅ **Kafka** (порт 9092) - потоковая передача событий
- ✅ **Kafka UI** (порт 8080) - веб-интерфейс для управления Kafka

### 3. Runtime и пакеты
- ✅ **Node.js 22.20.0** - JavaScript runtime
- ✅ **npm** - пакетный менеджер
- ✅ **Next.js 15.5.6** - React фреймворк с App Router
- ✅ **React 19.1.0** - UI библиотека
- ✅ **TypeScript 5** - типизированный JavaScript
- ✅ **Tailwind CSS 4** - utility-first CSS фреймворк

### 4. AI Сервисы
- ✅ **UI/UX Agent** - AI-ассистент для анализа интерфейса
  - SDK: `@anthropic-ai/sdk`
  - Model: Claude 3.5 Sonnet
  - API endpoints: `/api/ui-ux/*`
  - Возможности:
    - Анализ компонентов (accessibility, usability, visual design)
    - Генерация рекомендаций по улучшению UX
    - Проверка accessibility (WCAG 2.1)
    - Улучшение кода компонентов

## VS Code расширения (рекомендуемые)

### Обязательные:
1. ✅ **ESLint** - линтинг JavaScript/TypeScript
2. ✅ **Prettier** - форматирование кода
3. ✅ **Tailwind CSS IntelliSense** - автодополнение Tailwind классов
4. ✅ **TypeScript Importer** - автоимпорт TypeScript модулей

### Для работы с базами данных:
5. ✅ **SQLTools** - SQL клиент для PostgreSQL, ClickHouse
6. ✅ **Redis Client** - Redis GUI клиент

### DevOps & Контейнеры:
7. ✅ **Docker** - управление Docker контейнерами
8. ✅ **YAML** - YAML синтаксис и валидация

### Git & Version Control:
9. ✅ **GitLens** - Git blame, history, search
10. ✅ **Git Graph** - визуальная история git

### Productivity:
11. ✅ **Path Intellisense** - автодополнение путей к файлам
12. ✅ **Auto Rename Tag** - автоматическое переименование парных тегов
13. ✅ **Error Lens** - подсветка ошибок прямо в коде
14. ✅ **Todo Tree** - поиск TODO/FIXME

### API Testing:
15. ✅ **REST Client** - HTTP запросы в .http файлах
16. ✅ **Thunder Client** - легковесный API клиент

### Code Quality:
17. ✅ **SonarLint** - качество и безопасность кода
18. ✅ **Better Comments** - цветные комментарии
19. ✅ **Code Spell Checker** - проверка орфографии

### Theme:
20. ✅ **Material Icon Theme** - иконки файлов/папок
21. ✅ **One Dark Pro** - темная тема

## Быстрый старт

### 1. Запуск Docker сервисов:
```powershell
docker-compose up -d
docker-compose ps  # проверить статус
```

### 2. Установка зависимостей:
```powershell
npm install
```

### 3. Настройка переменных окружения:
```bash
# Убедитесь, что в .env.local есть:
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx  # ваш ключ
```

### 4. Запуск dev сервера:
```powershell
npm run dev           # доступ из сети (0.0.0.0:3000)
npm run dev:localhost # только localhost
```

### 5. Открыть в браузере:
- Frontend: http://localhost:3000
- Kafka UI: http://localhost:8080

## Структура проекта

```
attribution/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── ui-ux/               # UI/UX Agent endpoints
│   │       ├── analyze/         # POST /api/ui-ux/analyze
│   │       ├── suggestions/     # POST /api/ui-ux/suggestions
│   │       ├── improve/         # POST /api/ui-ux/improve
│   │       └── accessibility/   # POST /api/ui-ux/accessibility
│   ├── components/              # React компоненты
│   ├── login/                   # Страница входа
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Главная страница
│
├── lib/                         # Библиотеки и утилиты
│   └── agents/                 # AI агенты
│       └── ui-ux/              # UI/UX Agent
│           ├── agent.ts        # Основной класс агента
│           ├── types.ts        # TypeScript типы
│           ├── index.ts        # Публичное API
│           ├── examples.ts     # 7 примеров использования
│           ├── README.md       # Документация
│           └── utils/          # Утилиты
│               ├── client.ts   # Клиентские функции
│               └── helpers.ts  # Вспомогательные функции
│
├── docker-compose.yml           # Docker сервисы
├── .env.local                  # Локальные переменные
├── .env.example                # Пример конфигурации
├── package.json                # Зависимости проекта
├── tsconfig.json               # TypeScript конфигурация
├── DEV-ENVIRONMENT.md          # Полная документация (350+ страниц)
└── QUICK-START.md              # Этот файл
```

## Использование UI/UX Agent

### Client-side (React компоненты):
```typescript
import { analyzeComponent } from '@/lib/agents/ui-ux';

const result = await analyzeComponent({
  componentCode: '...ваш код...',
  componentType: 'button',
  context: 'Primary action button for form submission'
});

console.log('Score:', result.score);
console.log('Issues:', result.accessibility.issues);
```

### Server-side (API Routes, Server Actions):
```typescript
import { getUIUXAgent } from '@/lib/agents/ui-ux';

const agent = getUIUXAgent();
const analysis = await agent.analyzeComponent({
  componentCode: `<button>Click me</button>`,
  componentType: 'button'
});
```

### API Endpoints:
```bash
# Анализ компонента
POST /api/ui-ux/analyze
{
  "componentCode": "...",
  "componentType": "button"
}

# Получение рекомендаций
POST /api/ui-ux/suggestions
{
  "context": "Dashboard для аналитики..."
}

# Улучшение компонента
POST /api/ui-ux/improve
{
  "componentCode": "...",
  "componentType": "button"
}

# Проверка accessibility
POST /api/ui-ux/accessibility
{
  "componentCode": "..."
}
```

## Команды разработки

```powershell
# Docker
docker-compose up -d              # Запустить все сервисы
docker-compose down               # Остановить все сервисы
docker-compose logs -f            # Посмотреть логи
docker-compose ps                 # Проверить статус

# Development
npm run dev                       # Запустить dev сервер
npm run build                     # Собрать проект
npm start                         # Запустить production
npm run lint                      # Линтинг

# Git
git status                        # Проверить статус
git add .                         # Добавить изменения
git commit -m "feat: ..."        # Сделать коммит
git push                          # Отправить на GitHub
```

## Порты и URL

| Сервис | URL | Описание |
|--------|-----|----------|
| Next.js App | http://localhost:3000 | Основное приложение |
| Kafka UI | http://localhost:8080 | Управление Kafka |
| ClickHouse HTTP | http://localhost:8123 | HTTP интерфейс ClickHouse |
| PostgreSQL | localhost:5432 | База данных PostgreSQL |
| Redis | localhost:6379 | Кеш Redis |
| Kafka | localhost:9092 | Брокер Kafka |

## Credentials (локальная разработка)

```
User: unmogrowp
Password: dev_password_123
```

## Полезные ссылки

- [Полная документация среды разработки](./DEV-ENVIRONMENT.md)
- [README проекта](./README.md)
- [UI/UX Agent README](./lib/agents/ui-ux/README.md)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Docker Docs](https://docs.docker.com)

## Troubleshooting

### Docker не запускается
```powershell
# Проверьте, что Docker Desktop запущен
# Проверьте порты (5432, 6379, 8123, 9092, 8080)
netstat -ano | findstr :5432
```

### Next.js не запускается
```powershell
rm -rf node_modules .next
npm install
npm run dev
```

### UI/UX Agent не работает
```bash
# Проверьте API ключ в .env.local
# Получите ключ на: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

---

**Последнее обновление:** 2025-10-20

**Версия:** 1.0

🚀 **Готовы к разработке!**
