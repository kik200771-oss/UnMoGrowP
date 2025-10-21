# Documentation Maintenance System
## Automatic Documentation Updates

Система автоматического обновления документации для проекта UnMoGrowP.

---

## 🎯 Overview

В проекте UnMoGrowP настроена система автоматического обновления документации с помощью AI агентов:

### Агенты-документаторы:

#### 1. `/orchestrator` - Team Structure Documentation
**Ответственность:** Автоматическое обновление структуры команды AI агентов

**Отслеживает:**
- Добавление новых агентов в `.claude/commands/`
- Удаление агентов
- Изменение ролей и обязанностей агентов
- Изменение workflow команды

**Обновляет:**
- `.claude/commands/README.md` - документация по всем агентам

**Триггеры:**
- При каждом обращении к `/orchestrator`
- Автоматическая проверка структуры команды
- Проактивное обнаружение изменений

**Формат Changelog:**
```markdown
### Version X.Y - YYYY-MM-DD
**Added Agents:**
- `/agent-name` - Role description - Reason: Why added

**Removed Agents:**
- `/agent-name` - Role description - Reason: Why removed

**Updated Agents:**
- `/agent-name` - Changes description - Reason: Why changed
```

---

#### 2. `/devops` - Development Environment Documentation
**Ответственность:** Автоматическое обновление документации окружения разработки

**Отслеживает:**
- VS Code Extensions (добавление/удаление)
- Docker Services (добавление/удаление/обновление)
- Development Tools (версии, новые инструменты)
- Project Structure (новые папки/модули)

**Обновляет:**
- `DEV-ENVIRONMENT.md` - главный документ окружения
- `docker-compose.yml` - конфигурация сервисов
- `SETUP.md` - инструкции установки
- `install-vscode-extensions.ps1` - скрипт расширений
- `install-services.ps1` - скрипт сервисов

**Триггеры:**
- При каждом обращении к `/devops`
- Автоматическая проверка:
  - Количество VS Code extensions (ожидается: 31)
  - Количество Docker services (ожидается: 6)
  - Версии инструментов (Go, Node.js, Python, etc.)
  - Дата последнего обновления документации

**Формат Changelog:**
```markdown
### Version X.Y - YYYY-MM-DD

**VS Code Extensions:**
- ✅ Added: `extension.id` (Name) - Reason: Why added
- ❌ Removed: `extension.id` (Name) - Reason: Why removed
- 🔄 Updated: `extension.id` (Name) - Reason: Why updated

**Docker Services:**
- ✅ Added: `service-name` (port XXXX) - Reason: Why added
- ❌ Removed: `service-name` - Reason: Why removed
- 🔄 Updated: `service-name` - Changes - Reason: Why updated

**Development Tools:**
- ✅ Added: `tool` (vX.Y.Z) - Reason: Why added
- ❌ Removed: `tool` - Reason: Why removed
- 🔄 Updated: `tool` (vX.Y → vX.Z) - Reason: Why updated

**Project Structure:**
- ✅ Added: `folder/` - Reason: Why added
- ❌ Removed: `folder/` - Reason: Why removed
```

---

## 📂 Документы под автоматическим управлением

### 1. Team Structure (by `/orchestrator`)
```
.claude/commands/README.md
├── Overview
├── Available Agents (11 total)
├── Usage Examples
├── Workflows
└── Changelog (automatic)
```

### 2. Development Environment (by `/devops`)
```
DEV-ENVIRONMENT.md
├── Tech Stack
├── Development Tools (31 extensions + 6 tools)
├── VS Code Extensions (31 total)
├── Local Infrastructure (6 Docker services)
├── Project Structure
├── AI Agents Integration
├── Workflows
├── Best Practices
├── Troubleshooting
└── Changelog (automatic)

docker-compose.yml
├── 6 services
└── Health checks

SETUP.md
└── Installation instructions

install-vscode-extensions.ps1
└── 31 extensions

install-services.ps1
└── 6 development tools
```

---

## 🔄 Workflow автоматического обновления

### Сценарий 1: Добавление нового агента

```
User: Создал нового агента /performance-testing

1. /orchestrator (проактивно):
   - Проверяет .claude/commands/*.md
   - Обнаруживает новый файл performance-testing.md
   - Спрашивает: "Какова роль нового агента?"
   - User: "Performance testing и benchmarking"

2. /orchestrator обновляет:
   - README.md:
     - Добавляет описание агента
     - Обновляет счетчик (11 → 12 агентов)
     - Добавляет в Changelog:
       ✅ Added: `/performance-testing` - Role: Performance testing
          Reason: Need dedicated agent for load testing and benchmarking
     - Инкрементирует версию (2.2 → 2.3)
     - Обновляет дату

3. Уведомляет пользователя:
   "📝 Team documentation updated! Added /performance-testing agent."
```

### Сценарий 2: Добавление VS Code расширения

```
User: Добавил расширение Rust Analyzer

1. /devops (проактивно):
   - Проверяет install-vscode-extensions.ps1
   - Обнаруживает новое расширение: rust-lang.rust-analyzer
   - Спрашивает: "Зачем добавлено Rust расширение?"
   - User: "Для разработки Attribution Engine на Rust"

2. /devops обновляет:
   - install-vscode-extensions.ps1:
     - Добавляет Install-VSCodeExtension "rust-lang.rust-analyzer"

   - DEV-ENVIRONMENT.md:
     - Section "VS Code Extensions":
       - Добавляет описание расширения
       - Обновляет счетчик (31 → 32)
     - Section "Changelog":
       ✅ Added: `rust-lang.rust-analyzer` (Rust)
          Reason: Required for Attribution Engine development
     - Инкрементирует версию (1.0 → 1.1)
     - Обновляет дату

3. Уведомляет пользователя:
   "📝 Dev environment docs updated! Added Rust Analyzer extension."
```

### Сценарий 3: Удаление Docker сервиса

```
User: Удалил Zookeeper из docker-compose

1. /devops (проактивно):
   - Проверяет docker-compose.yml
   - Обнаруживает: было 6 сервисов, стало 5
   - Спрашивает: "Почему удален Zookeeper?"
   - User: "Kafka теперь использует KRaft mode, Zookeeper не нужен"

2. /devops обновляет:
   - docker-compose.yml:
     - Удаляет сервис zookeeper и зависимости

   - DEV-ENVIRONMENT.md:
     - Section "Docker Services Architecture":
       - Обновляет ASCII diagram (удаляет zookeeper)
     - Section "Service Details":
       - Удаляет описание Zookeeper
     - Section "Quick Reference":
       - Удаляет zookeeper URL
     - Section "Changelog":
       ❌ Removed: `zookeeper` (port 2181)
          Reason: Kafka migrated to KRaft mode (Zookeeper no longer needed)
     - Обновляет счетчик сервисов (6 → 5)
     - Инкрементирует версию (1.1 → 1.2)

   - SETUP.md:
     - Удаляет упоминания Zookeeper из инструкций

3. Уведомляет пользователя:
   "📝 Dev environment docs updated! Removed Zookeeper service."
```

### Сценарий 4: Обновление версии инструмента

```
System: Go updated from 1.21 to 1.25

1. /devops (проактивно):
   - Запускает `go version` → 1.25.3
   - Проверяет DEV-ENVIRONMENT.md → указано 1.21
   - Обнаруживает несоответствие
   - Спрашивает: "Go обновлен до 1.25. Какая причина обновления?"
   - User: "Новые generics features и лучше performance"

2. /devops обновляет:
   - DEV-ENVIRONMENT.md:
     - Section "Development Tools":
       - Обновляет версию Go (1.21 → 1.25)
     - Section "Changelog":
       🔄 Updated: `go` (1.21 → 1.25)
          Reason: New generics features, better performance
     - Инкрементирует версию (1.2 → 1.3)

   - install-services.ps1:
     - Проверяет что установка Go корректна

3. Уведомляет пользователя:
   "📝 Dev environment docs updated! Go version updated to 1.25."
```

---

## 🎯 Ключевые принципы

### 1. Проактивность
- Агенты проверяют изменения при каждом обращении к ним
- Не ждут явного запроса на обновление документации
- Автоматически обнаруживают несоответствия

### 2. Transparency (Прозрачность)
- Всегда указывается причина изменения
- Ведется детальный Changelog
- Версионирование документов (X.Y)

### 3. Consistency (Консистентность)
- Обновляются ВСЕ связанные файлы
- Документация синхронизирована с кодом
- Единый формат записи изменений

### 4. Traceability (Отслеживаемость)
- Дата каждого изменения
- Причина каждого изменения
- Кто запросил изменение (если известно)

---

## 📊 Текущее состояние

### Team Structure
- **Агентов:** 11
- **Версия README:** 2.2
- **Последнее обновление:** 2025-10-20
- **Ответственный:** `/orchestrator`

### Development Environment
- **VS Code Extensions:** 31
- **Docker Services:** 6 (ClickHouse, PostgreSQL, Redis, Kafka, Zookeeper, Kafka UI)
- **Development Tools:** 6 (Git, Node.js, Go, Python, Bun, Docker)
- **Версия документации:** 1.0
- **Последнее обновление:** 2025-10-20
- **Ответственный:** `/devops`

---

## 🚀 Использование

### Для пользователей:

**Просто работайте с проектом!** Агенты автоматически отследят изменения.

**Если добавили расширение:**
```
/devops я добавил расширение X, обнови документацию
```

**Если добавили сервис:**
```
/devops добавил Elasticsearch в docker-compose, обнови документацию
```

**Если добавили агента:**
```
/orchestrator создал нового агента /performance-testing, обнови документацию
```

### Для агентов:

**При обращении к тебе:**
1. Проверь свою зону ответственности
2. Обнаружь изменения (если есть)
3. Спроси о причине (если неясно)
4. Обнови документацию
5. Уведоми пользователя

---

## 📝 Формат уведомлений

### Успешное обновление:
```
📝 Documentation Updated!

Changes detected:
✅ Added 2 new VS Code extensions
✅ Updated Go version (1.21 → 1.25)

Updated files:
- DEV-ENVIRONMENT.md (v1.2 → v1.3)
- install-vscode-extensions.ps1

Changelog entry added with reasons for all changes.
```

### Запрос информации:
```
❓ Documentation Update Required

Detected changes:
- New extension: rust-lang.rust-analyzer
- Removed service: zookeeper

Question: Why was Zookeeper removed from docker-compose.yml?

Please provide reason for automatic documentation update.
```

---

## 🔗 Связанные документы

- [AI Agents README](./.claude/commands/README.md) - Team structure
- [DEV-ENVIRONMENT.md](./DEV-ENVIRONMENT.md) - Development environment
- [Orchestrator Agent](./.claude/commands/orchestrator.md) - Team coordinator
- [DevOps Agent](./.claude/commands/devops.md) - Environment maintainer

---

**Последнее обновление:** 2025-10-20

**Версия:** 1.0

**Автор:** AI Team (UnMoGrowP)

---

🤖 **Automatic Documentation - Always Up to Date!**
