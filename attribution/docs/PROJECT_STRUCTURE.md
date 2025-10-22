# Структура проекта Attribution Platform

> **Ответственный за структуру:** Product Manager Agent
> **Последнее обновление:** 21 октября 2025

---

## 📁 Основные директории

### `/lib/agents/` - Агенты команды

Все AI-агенты проекта находятся здесь. Каждый агент имеет свою папку с кодом и документацией.

```
lib/agents/
├── ui-ux/                    # UI/UX Agent
│   ├── agent.ts             # Основной код агента
│   ├── types.ts             # TypeScript типы
│   ├── examples.ts          # Примеры использования
│   ├── index.ts             # Экспорты
│   ├── utils/               # Утилиты
│   │   ├── client.ts
│   │   └── helpers.ts
│   └── docs/                # Документация агента
│       ├── README.md
│       ├── UI-UX-AGENT.md
│       └── UI-UX-QUICKSTART.md
│
├── design-analyzer/          # Design Analyzer Agent
│   ├── agent.ts             # Анализ дизайна из скриншотов
│   └── docs/                # Документация
│       └── README.md
│
└── product-manager/          # Product Manager Agent
    ├── agent.ts             # Управление проектом и структурой
    └── docs/                # Документация
        └── README.md
```

**Правило:** Если документ касается ТОЛЬКО одного агента → помещать в `lib/agents/[agent]/docs/`

---

### `/docs/` - Общая документация

Документация общего назначения, касающаяся всего проекта.

```
docs/
├── setup/                    # Установка и настройка
│   ├── SETUP.md             # Основная инструкция по установке
│   ├── SETUP_AUTH.md        # Настройка аутентификации
│   ├── DEV-ENVIRONMENT.md   # Настройка dev окружения
│   ├── INSTALL-EXTENSIONS.md
│   ├── INSTALL-REMAINING.md
│   ├── DOMAIN-SETUP-COMPLETE.md
│   ├── SETUP-DOMAIN.md
│   ├── NGROK-SETUP.md
│   └── NGROK-URL.md
│
├── workflows/                # Рабочие процессы
│   ├── DESIGN_WORKFLOW.md   # Процесс создания UI
│   ├── WORKFLOW_ANALYSIS.md # Анализ рабочих процессов
│   └── DOCUMENTATION-MAINTENANCE.md
│
├── architecture/             # Архитектура проекта
│   └── (будущие документы)
│
├── guides/                   # Руководства
│   ├── QUICK-START.md       # Быстрый старт
│   └── START-DEV.md         # Запуск dev сервера
│
└── status/                   # Статусы и отчеты
    ├── STATUS.md            # Текущий статус
    └── SUCCESS.md           # История успехов
```

**Правило:** Если документ касается всего проекта → помещать в соответствующую категорию `/docs/`

---

### `/scripts/` - Скрипты и утилиты

Скрипты для установки, настройки и автоматизации проекта.

```
scripts/
├── setup/                    # PowerShell скрипты установки
│   ├── add-hosts-entries.ps1       # Добавление записей в hosts
│   ├── fix-hosts.ps1               # Исправление hosts файла
│   ├── install-go-docker.ps1       # Установка Docker
│   ├── install-ngrok.ps1           # Установка Ngrok
│   ├── install-services.ps1        # Установка сервисов
│   ├── install-vscode-extensions.ps1
│   ├── restart-computer.ps1
│   └── setup-local-domain.ps1
│
└── test-ui-ux-agent.js      # Тестирование UI/UX агента
```

**Правило:** Все `.ps1` скрипты → `scripts/setup/`, утилиты проекта → `scripts/`

---

### `/config/` - Конфигурация сервисов

Конфигурационные файлы для Docker, сервисов и развертывания.

```
config/
└── docker-compose.yml        # Docker Compose конфигурация
```

**Правило:** Конфиги сервисов (Docker, Kubernetes, etc) → `config/`

**Файлы в корне:**
- Конфиги инструментов разработки (Next.js, TypeScript, Tailwind) ОСТАЮТСЯ в корне
- Только сервисные конфигурации перемещаются в `config/`

---

### `/prototypes/` - HTML прототипы

HTML прототипы компонентов перед конвертацией в React.

```
prototypes/
└── login-prototype.html      # Прототип страницы логина
```

**Workflow:**
1. Создать HTML прототип
2. Проверить в браузере
3. После одобрения → конвертировать в React
4. Прототип сохраняется для истории

---

### `/team/` - Информация о команде

Информация о команде агентов, их ролях и взаимодействии.

```
team/
└── (файлы о команде)
```

---

### `/app/` - Next.js приложение

```
app/
├── login/                    # Страница логина
│   └── page.tsx
├── dashboard/                # Дашборд
├── api/                      # API routes
│   ├── auth/                # Аутентификация
│   ├── ui-ux/               # UI/UX анализ API
│   └── design/              # Design Analyzer API
├── providers/                # React providers
│   └── SessionProvider.tsx
├── layout.tsx               # Root layout
└── globals.css              # Глобальные стили
```

---

### `/components/` - React компоненты

```
components/
└── ui/                       # Shadcn/ui компоненты
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    └── badge.tsx
```

---

## 📋 Правила организации файлов

### Документы по установке → `docs/setup/`
- `SETUP*.md`
- `INSTALL*.md`
- `DOMAIN*.md`
- `NGROK*.md`
- `DEV-ENVIRONMENT.md`

### Рабочие процессы → `docs/workflows/`
- `WORKFLOW*.md`
- `DESIGN_WORKFLOW*.md`
- `DOCUMENTATION*.md`

### Архитектура → `docs/architecture/`
- `ARCHITECTURE*.md`
- `TECH*.md`
- `STACK*.md`

### Руководства → `docs/guides/`
- `QUICK-START*.md`
- `START*.md`
- `GUIDE*.md`

### Статусы → `docs/status/`
- `STATUS*.md`
- `SUCCESS*.md`
- `PROGRESS*.md`
- `REPORT*.md`

### PowerShell скрипты → `scripts/setup/`
- `*.ps1` (все PowerShell скрипты)
- `install-*.ps1`
- `setup-*.ps1`
- `fix-*.ps1`

### Конфигурация сервисов → `config/`
- `docker-compose*.yml`
- Конфиги для Kubernetes, etc

### Документация агентов → `lib/agents/[agent-name]/docs/`
- `UI-UX*.md` → `lib/agents/ui-ux/docs/`
- `DESIGN-ANALYZER*.md` → `lib/agents/design-analyzer/docs/`
- `PRODUCT-MANAGER*.md` → `lib/agents/product-manager/docs/`

---

## 👥 Команда агентов

### UI/UX Agent
**Роль:** Анализ UI/UX компонентов
**Ответственность:** Проверка accessibility, usability, visual design
**Расположение:** `lib/agents/ui-ux/`
**Документация:** `lib/agents/ui-ux/docs/`

### Design Analyzer Agent
**Роль:** Анализ дизайна из скриншотов
**Ответственность:** Генерация детальных спецификаций для реализации
**Расположение:** `lib/agents/design-analyzer/`
**Документация:** `lib/agents/design-analyzer/docs/`

### Product Manager Agent
**Роль:** Управление проектом и контроль структуры
**Ответственность:**
- Контроль структуры проекта
- Организация файлов и документации
- Координация работы агентов
- Мониторинг качества

**Расположение:** `lib/agents/product-manager/`
**Документация:** `lib/agents/product-manager/docs/`

---

## 🔍 Как найти нужный файл?

### Ищу документ по установке
→ Смотри в `docs/setup/`

### Ищу документ о workflow
→ Смотри в `docs/workflows/`

### Ищу информацию о конкретном агенте
→ Смотри в `lib/agents/[agent-name]/docs/`

### Ищу HTML прототип компонента
→ Смотри в `prototypes/`

### Ищу React компонент
→ Смотри в `app/` (страницы) или `components/` (переиспользуемые)

---

## ⚠️ Важные правила

1. **Файлы в корне:** Только необходимые конфиги и документация
   - ✅ Разрешены: README.md, PROJECT_STRUCTURE.md, package.json, конфиги (Next.js, TypeScript, Tailwind, ESLint, etc)
   - ❌ Запрещены: Markdown документы (→ docs/), скрипты (→ scripts/), конфиги сервисов (→ config/)

2. **Всегда помещай файлы в соответствующие категории:**
   - Документы → `docs/[категория]/`
   - Скрипты → `scripts/setup/`
   - Конфиги сервисов → `config/`
   - Прототипы → `prototypes/`

3. **Документация агента → в папку docs агента**

4. **PowerShell скрипты → scripts/setup/**

5. **Product Manager следит за структурой** - автоматически проверяет размещение файлов

---

## 📞 Контакты

По вопросам структуры проекта обращайтесь к **Product Manager Agent**.

Последняя реорганизация: **21 октября 2025**
