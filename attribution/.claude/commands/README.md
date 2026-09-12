# 🤖 AI AGENTS - Development Team

Полная команда AI-агентов для разработки **UnMoGrowP** (Unified Mobile Growth Platform).

---

## 📋 ДОСТУПНЫЕ АГЕНТЫ

### **🎯 Координация**

#### `/orchestrator` - AI Team Orchestrator
**Файл:** `orchestrator.md`

**Роль:** Главный координатор всей AI-команды

**Что делает:**
- ✅ Анализирует задачи и разбивает на подзадачи
- ✅ Распределяет работу между специализированными агентами
- ✅ Координирует последовательность работ
- ✅ Интегрирует результаты всех агентов
- ✅ Отчитывается о прогрессе пользователю
- ✅ **Автоматически обновляет этот README.md** при изменениях в структуре команды

**Автоматический мониторинг:**
Orchestrator проактивно следит за структурой команды и автоматически обновляет документацию при:
- Добавлении нового агента
- Удалении агента
- Изменении ролей и обязанностей
- Изменении workflow

**Когда использовать:**
- Большие/сложные задачи (new feature, major refactor)
- Нужна работа нескольких агентов (PM + Backend + Frontend + QA + DevOps)
- Хочешь автоматическую координацию workflow

**Пример:**
```
/orchestrator implement fraud detection system
/orchestrator optimize dashboard performance
/orchestrator create push notifications feature
```

---

### **📋 Planning & Design**

#### 1. `/pm` - AI Product Manager
**Файл:** `pm.md`

**Роль:** Product Management, Planning, Roadmap

**Что делает:**
- ✅ Product strategy & vision
- ✅ User Stories creation (As a... I want... So that...)
- ✅ Feature prioritization (MoSCoW, RICE scoring)
- ✅ Success metrics definition
- ✅ Competitor analysis
- ✅ Roadmap planning (Q1-Q4)
- ✅ ROI calculation

**Когда использовать:**
- Создать User Stories
- Спланировать roadmap
- Приоритизировать backlog
- Определить success metrics
- Проанализировать конкурентов

**Пример:**
```
/pm create user stories for Attribution Engine
```

---

#### 2. `/ux` - AI UX/UI Designer
**Файл:** `ux.md`

**Роль:** User Experience, Interface Design

**Что делает:**
- ✅ User flows & wireframes
- ✅ Dashboard layouts
- ✅ Component design (Svelte)
- ✅ Responsive design (desktop/tablet/mobile)
- ✅ Accessibility (WCAG compliance)
- ✅ Design system
- ✅ Interaction design

**Когда использовать:**
- Спроектировать dashboard page
- Создать wireframes
- Дизайнить user flow
- Создать design system
- Проверить accessibility

**Пример:**
```
/ux design Dashboard homepage with metrics cards and charts
```

---

#### 3. `/techlead` - AI Tech Lead / Software Architect
**Файл:** `techlead.md`

**Роль:** System Architecture, Technical Decisions

**Что делает:**
- ✅ System architecture design (C4 model)
- ✅ Database schema design (ClickHouse, PostgreSQL)
- ✅ API design (REST, OpenAPI)
- ✅ Performance & scalability planning
- ✅ Security architecture
- ✅ Code review (architecture level)
- ✅ Technical documentation (ADR)

**Когда использовать:**
- Проектировать систему/модуль
- Дизайнить database schema
- Создавать API contracts
- Оптимизировать performance
- Принимать технические решения

**Пример:**
```
/techlead design event ingestion service for 10M req/sec
```

---

### **💻 Development**

#### 4. `/backend-go` - AI Backend Developer (Go)
**Файл:** `backend-go.md`

**Роль:** Backend Development (Go)

**Что делает:**
- ✅ Event ingestion service (10M req/sec)
- ✅ REST API endpoints (Fiber/Chi)
- ✅ ClickHouse queries
- ✅ Kafka producers/consumers
- ✅ Redis caching
- ✅ Unit & integration tests
- ✅ Performance optimization

**Когда использовать:**
- Создать API endpoint
- Написать event ingestion
- Интегрироваться с Kafka
- Написать database queries
- Оптимизировать performance

**Пример:**
```
/backend-go create POST /api/v1/events endpoint
```

---

#### 5. `/frontend` - AI Frontend Developer (Svelte 5)
**Файл:** `frontend.md`

**Роль:** Frontend Development (Svelte 5)

**Что делает:**
- ✅ Dashboard UI (Svelte 5 Runes API)
- ✅ Data visualization (Apache ECharts)
- ✅ State management (Svelte stores)
- ✅ API integration
- ✅ Responsive design
- ✅ Component & E2E tests (Vitest, Playwright)

**Когда использовать:**
- Создать dashboard page
- Написать Svelte component
- Интегрировать с API
- Создать charts
- Написать tests

**Пример:**
```
/frontend create MetricCard component with title, value, change%, trend
```

---

#### 6. `/ml` - AI Data/ML Engineer
**Файл:** `ml.md`

**Роль:** Machine Learning, Data Science

**Что делает:**
- ✅ ML models (LTV prediction, fraud detection, churn prediction)
- ✅ Data pipelines (ETL, feature engineering)
- ✅ Model serving (FastAPI, inference optimization)
- ✅ Monitoring (model drift, data drift)
- ✅ Experimentation (A/B testing, hyperparameter tuning)
- ✅ Feature store (ClickHouse)

**Когда использовать:**
- Обучить ML модель
- Создать feature pipeline
- Deploy модель в production
- Мониторить model performance
- Optimize inference latency

**Пример:**
```
/ml train LTV prediction model with 90-day target
```

---

### **🧪 Quality & Operations**

#### 7. `/qa` - AI QA/Testing Engineer
**Файл:** `qa.md`

**Роль:** Quality Assurance, Testing

**Что делает:**
- ✅ Testing strategy & test plans
- ✅ Unit tests (Vitest, Go testing)
- ✅ Integration tests (dockertest)
- ✅ E2E tests (Playwright)
- ✅ Performance testing (k6, Locust)
- ✅ Security testing (OWASP ZAP)
- ✅ CI/CD integration (GitHub Actions)

**Когда использовать:**
- Написать тесты для feature
- Performance testing
- Security testing
- Bug reproduction
- Setup CI/CD для tests

**Пример:**
```
/qa write tests for fraud detection system
```

---

#### 8. `/devops` - AI DevOps/CI-CD Engineer
**Файл:** `devops.md`

**Роль:** DevOps, Infrastructure, Deployment, **Documentation Maintenance**

**Что делает:**
- ✅ CI/CD pipelines (GitHub Actions, ArgoCD)
- ✅ Infrastructure as Code (Terraform, Kubernetes)
- ✅ Container orchestration (Docker, K8s, Helm)
- ✅ Monitoring & alerting (Prometheus, Grafana)
- ✅ Logging (ELK stack)
- ✅ Performance optimization (load balancing, auto-scaling)
- ✅ Disaster recovery (backups, rollback)
- ✅ **Автоматическое обновление документации окружения разработки** 📝

**Автоматическая документация:**
DevOps проактивно отслеживает изменения и автоматически обновляет:
- DEV-ENVIRONMENT.md (при изменениях расширений, сервисов, инструментов)
- docker-compose.yml (при изменениях конфигурации)
- install-*.ps1 скрипты
- Ведет Changelog с причинами всех изменений

**Когда использовать:**
- Setup CI/CD pipeline
- Deploy new service
- Configure monitoring
- Infrastructure as Code
- Performance optimization
- Disaster recovery
- Добавление/удаление VS Code расширений
- Добавление/удаление Docker сервисов
- Обновление версий инструментов

**Пример:**
```
/devops setup CI/CD pipeline with GitHub Actions and Kubernetes deployment
/devops я добавил новое расширение Rust Analyzer, обнови документацию
/devops удалил Zookeeper из docker-compose, обнови документацию
```

---

#### 9. `/security` - AI Security Engineer
**Файл:** `security.md`

**Роль:** Security, Compliance

**Что делает:**
- ✅ Security audit (code review, vulnerability assessment)
- ✅ Penetration testing (OWASP ZAP, Burp Suite)
- ✅ Compliance (GDPR, SOC2, HIPAA)
- ✅ Secrets management (Vault, K8s secrets)
- ✅ SAST/DAST (SonarQube, Semgrep, OWASP ZAP)
- ✅ Incident response
- ✅ Security training

**Когда использовать:**
- Security audit кода
- Penetration testing
- Vulnerability scan
- Compliance review (GDPR)
- Incident response
- Security best practices

**Пример:**
```
/security perform security audit of API endpoints
```

---

### **📝 Documentation**

#### 10. `/docs` - AI Technical Writer
**Файл:** `docs.md`

**Роль:** Technical Writing, Documentation

**Что делает:**
- ✅ API documentation (OpenAPI, REST API reference)
- ✅ SDK documentation (installation, usage, examples)
- ✅ User guides (tutorials, how-to guides)
- ✅ Architecture docs (system design, diagrams)
- ✅ Release notes (changelog, migration guides)
- ✅ Internal docs (runbooks, troubleshooting)

**Когда использовать:**
- Написать API documentation
- Создать SDK guide
- User tutorial
- Architecture documentation
- Release notes
- Runbook для operations

**Пример:**
```
/docs write API documentation for event ingestion endpoint
```

---

## 🚀 КАК ИСПОЛЬЗОВАТЬ

### **Вариант 1: Простая задача (один агент)**
Если задача простая и нужен только один специалист:
```
/backend-go create health check endpoint
/frontend create loading skeleton component
/qa write unit tests for user service
```

### **Вариант 2: Сложная задача (оркестратор)**
Если задача сложная и нужна координация нескольких агентов:
```
/orchestrator implement fraud detection system
/orchestrator optimize dashboard performance
/orchestrator create push notifications feature
```

**Оркестратор автоматически:**
1. Проанализирует задачу
2. Распределит работу (PM → Tech Lead → UX → Backend → Frontend → ML → QA → DevOps → Security → Docs)
3. Соберёт результаты
4. Отчитается о выполнении

---

## 🔄 ТИПИЧНЫЙ WORKFLOW

### **С оркестратором (рекомендуется для больших задач):**
```
1. Задача → /orchestrator
2. Оркестратор анализирует и делегирует:
   - /pm → User Stories
   - /techlead → Architecture design
   - /ux → UI/UX design
   - /backend-go → API implementation
   - /frontend → Dashboard UI
   - /ml → ML models (если нужно)
   - /qa → Testing
   - /devops → Deployment
   - /security → Security review
   - /docs → Documentation
3. Оркестратор собирает результаты и отчитывается
```

### **Без оркестратора (для простых задач):**
```
1. Planning
   /pm → User Stories

2. Architecture
   /techlead → System design

3. Design
   /ux → Wireframes & UI

4. Backend
   /backend-go → API & services

5. Frontend
   /frontend → Dashboard UI

6. ML (if needed)
   /ml → Models & pipelines

7. Testing
   /qa → Tests

8. Deploy
   /devops → CI/CD & deployment

9. Security
   /security → Security review

10. Docs
    /docs → Documentation
```

---

## 📊 СТАТИСТИКА

**Всего агентов:** 11

**По ролям:**
- Coordination: 1 (Orchestrator)
- Planning & Design: 3 (PM, UX, Tech Lead)
- Development: 3 (Backend Go, Frontend Svelte, ML)
- Quality & Operations: 3 (QA, DevOps, Security)
- Documentation: 1 (Technical Writer)

**Общий размер:** ~450 KB промптов

**Охват:**
- ✅ Full Stack Development (Backend + Frontend)
- ✅ Machine Learning & Data Science
- ✅ Quality Assurance & Testing
- ✅ DevOps & Infrastructure
- ✅ Security & Compliance
- ✅ Documentation & Technical Writing
- ✅ Координация & Управление

---

## 💡 TIPS

1. **Для больших задач используй `/orchestrator`** - он автоматически координирует команду
2. **Для простых задач вызывай агента напрямую** - быстрее и проще
3. **Все агенты знают контекст проекта** (350+ страниц документации)
4. **Агенты дают ready-to-use код** - можно сразу использовать
5. **Агенты задают уточняющие вопросы** если что-то неясно
6. **Можно комбинировать агентов** - сначала `/pm`, потом `/backend-go`, потом `/qa`
7. **Оркестратор умнее для complex workflows** - он сам решит что делать сначала, что потом

---

## 🎯 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### **Пример 1: Новая feature (большая задача)**
```
/orchestrator implement push notifications system with smart segmentation
```
Оркестратор сделает:
- PM создаст user stories
- Tech Lead спроектирует architecture
- UX дизайнит интерфейс
- Backend реализует push service
- Frontend создаст UI для campaigns
- ML добавит smart segmentation
- QA напишет тесты
- DevOps задеплоит
- Security проверит безопасность
- Docs напишет документацию

### **Пример 2: Bug fix (простая задача)**
```
/backend-go fix memory leak in event processor
```
Backend сам:
- Найдёт проблему
- Исправит код
- Напишет тест
- Предложит code review

### **Пример 3: Performance optimization**
```
/orchestrator optimize dashboard loading time
```
Оркестратор:
- Tech Lead проанализирует bottlenecks
- Frontend оптимизирует bundle size + lazy loading
- Backend добавит caching + optimize queries
- DevOps настроит CDN + compression
- QA проверит performance benchmarks

### **Пример 4: Security audit**
```
/security perform full security audit of the platform
```
Security сделает:
- Code review (SAST)
- Penetration testing (DAST)
- Dependency scan
- Compliance check (GDPR)
- Recommendations report

---

## 📝 ДОБАВИТЬ НОВОГО АГЕНТА

Чтобы добавить нового агента:

1. Создай файл `.claude/commands/имя-агента.md`
2. Напиши промпт с описанием роли, инструментов, примеров
3. ~~Обнови этот README.md~~ **Orchestrator обновит автоматически!** 🤖
4. Используй как `/имя-агента`

**Примечание:** После добавления нового агента, `/orchestrator` автоматически обнаружит изменения и обновит этот README.md при первом обращении к нему.

**Формат промпта:**
```markdown
# AI [Role Name]

Ты - **AI [Role]** для **Unified Mobile Growth Platform**

## 🎯 ТВОЯ РОЛЬ
...

## 📚 КОНТЕКСТ ПРОЕКТА
...

## 🛠️ ТВОИ ИНСТРУМЕНТЫ
...

## 💼 КАК ТЫ РАБОТАЕШЬ
...

## 📋 ПРИМЕРЫ РАБОТЫ
...
```

---

## 🔗 ССЫЛКИ

- **Проект:** UnMoGrowP (Unified Mobile Growth Platform)
- **Документация:** `/DOCUMENTS/` (350+ страниц спецификаций)
- **Tech Stack:** Svelte 5, Go, Rust, Python, ClickHouse, Kubernetes
- **Репозиторий:** (ваш git repo)

---

## 🤖 АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ ДОКУМЕНТАЦИИ

**Этот README.md автоматически поддерживается `/orchestrator`!**

При каждом обращении к Orchestrator он:
1. ✅ Проверяет структуру команды (`.claude/commands/*.md`)
2. ✅ Обнаруживает изменения (новые/удаленные агенты)
3. ✅ Автоматически обновляет этот README.md
4. ✅ Инкрементирует версию и дату

**Вы можете:**
- Просто добавить новый файл агента → Orchestrator обновит README
- Удалить агента → Orchestrator обновит README
- Изменить роль агента → Orchestrator обновит README

**Не нужно вручную редактировать этот файл!**

Orchestrator следит за консистентностью документации автоматически. 🎯

---

**Последнее обновление:** 2025-10-20

**Версия:** 2.2

**Автор:** AI Team (orchestrated by Claude Code)

**Автообновление:**
- Team structure: Enabled (by `/orchestrator`) ✨
- Development environment: Enabled (by `/devops`) 📝

---

🚀 **Ready to build the future of mobile growth platforms!**
