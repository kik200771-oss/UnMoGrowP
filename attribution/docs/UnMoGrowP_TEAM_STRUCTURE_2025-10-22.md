# UnMoGrowP — Структура команды и рекомендации по найму (2025-10-22)

## 🎯 Цель
Определить оптимальную структуру проектной команды для развития платформы **UnMoGrowP** — системы атрибуции мобильного трафика, антифрода и real‑time аналитики.  
Формируется структура с фокусом на техническую устойчивость, DevSecOps‑зрелость и управляемое масштабирование.

---

## 🧭 Общий обзор структуры

| Направление | Основной фокус | Кол-во специалистов |
|--------------|----------------|---------------------|
| Product & Strategy | Управление продуктом, приоритеты, аналитика | 3 |
| Architecture & Tech Leads | Архитектура, системный контроль, качество решений | 4 |
| Backend Core | Ядро атрибуции и антифрода (Go + Kafka + ClickHouse) | 5 |
| Frontend & UX | Интерфейс консоли, отчёты, визуализация | 4 |
| DevOps & Security | Инфраструктура, CI/CD, наблюдаемость, безопасность | 4 |
| Data & ML | Модели LTV, antifraud, BI‑аналитика | 3 |
| QA & Perf | Качество, нагрузочные тесты, стабильность | 3 |
| Operations & Legal | Поддержка, документация, комплаенс | 2 |
| **Итого:** |  | **28 специалистов (Full‑Scale)** |

Минимальная команда для MVP — **10–12 человек**.

---

## 🧩 1. Product & Strategy

| Роль | Основные задачи |
|------|-----------------|
| **Product Owner** | Формирует видение продукта, управляет backlog, KPI, roadmap. |
| **Product Manager** | Планирует релизы, анализирует рынок, управляет приоритетами. |
| **Business Analyst** | Описывает требования к API, интеграциям, аналитике. |

---

## 🧱 2. Architecture & Technical Leads

| Роль | Основные задачи |
|------|-----------------|
| **Chief Architect** | Определяет архитектуру (event‑driven, Kafka, ClickHouse), управляет техническим долгом. |
| **Tech Lead (Backend)** | Руководит Go‑разработкой, отвечает за производительность и устойчивость. |
| **Tech Lead (Frontend)** | Контроль разработки Svelte‑консоли, UI‑библиотеки и SSR. |
| **DevOps Lead / SRE Lead** | Разработка инфраструктуры (K8s, GitOps, Observability, DR). |

---

## ⚙️ 3. Backend Core

| Роль | Основные задачи |
|------|-----------------|
| **Senior Go Developer** | Реализация attribution‑ядра, dedup, rate‑limit, postbacks. |
| **Go Developer (Ingest)** | Создание ingest‑gateway, batching, Kafka‑producers. |
| **Python / ML Engineer** | Antifraud модели, интеграция LightGBM/ONNX. |
| **Data Engineer** | Подготовка ETL, ClickHouse / TTL / партиции. |
| **Integration Engineer** | SDK (JS/iOS/Android), API connectors, webhooks. |

---

## 🎨 4. Frontend & UX

| Роль | Основные задачи |
|------|-----------------|
| **Svelte Frontend Engineer** | UI‑консоль: отчёты, фильтры, визуализация метрик. |
| **Frontend QA** | Автотесты UI, regression, e2e‑сценарии. |
| **UI/UX Designer** | Разработка дизайн‑системы и интерфейса для multi‑tenant. |
| **UX Researcher** | Изучение поведения пользователей и оптимизация UX‑воронок. |

---

## ☁️ 5. DevOps & Security

| Роль | Основные задачи |
|------|-----------------|
| **DevOps Engineer** | CI/CD (GitHub Actions + ArgoCD), Terraform, Helm. |
| **SRE Engineer** | Мониторинг, алертинг, capacity planning, DR‑планы. |
| **Security Engineer** | Threat modeling, SDL, pentest, GDPR/CCPA compliance. |
| **Infra Engineer** | K8s‑кластеризация, observability stack. |

---

## 📊 6. Data & Machine Learning

| Роль | Основные задачи |
|------|-----------------|
| **Data Scientist** | Модели LTV, churn, attribution weighting. |
| **Data Analyst** | BI‑дашборды, аналитика ROAS / Retention. |
| **Anti‑Fraud Specialist** | Разработка эвристик и анализ аномалий. |

---

## 🧪 7. QA & Performance

| Роль | Основные задачи |
|------|-----------------|
| **QA Lead** | Формирует стратегию тестирования, тест‑пирамиду. |
| **Automation QA (Backend)** | API / нагрузочные тесты (k6, Gatling). |
| **Performance Engineer** | Оптимизация ClickHouse, Kafka, Go‑сервисов. |

---

## 🧰 8. Operations & Compliance

| Роль | Основные задачи |
|------|-----------------|
| **Technical Writer** | Документация SDK, API, архитектуры. |
| **Support Engineer** | Помощь клиентам, диагностика интеграций. |
| **Legal Advisor** | GDPR/CCPA контроль, user agreement, privacy policy. |

---

## 🚀 Этапы формирования команды

| Этап | Цель | Ключевые роли |
|------|------|---------------|
| **Фаза 1 (MVP)** | Создание ingest / attrib ядра, UI MVP | PO, Architect, 2 Go, DevOps, Frontend, QA, DataEng, Security |
| **Фаза 2 (Alpha)** | Добавление antifraud и аналитики | ML Engineer, Data Scientist, Designer |
| **Фаза 3 (Production)** | Полный observability / auto‑scaling / multi‑tenant | SRE, Tech Leads, Security Lead |
| **Фаза 4 (Growth)** | Масштабирование и бизнес‑развитие | PM, BA, Support, Legal, Marketing |

---

## 🧭 Рекомендации по приоритету найма

1. **Сформировать Core Team (10–12 чел):**
   - Product Owner / Architect / Tech Lead / 2 Go / Frontend / DevOps / QA / Security / Designer.
2. **Расширение до Full Team (20+):**
   - Добавить Data & ML, SRE, Support, Analyst, Legal.
3. **Организационные меры:**
   - Ввести RACI‑матрицу, OKR по кварталам, еженедельные tech ревью.
4. **Коммуникация:**
   - Разделение Product / Engineering / Operations, единая панель индикаторов (DevOps Metrics + Product KPIs).

---

**Итог:**  
Такая структура обеспечивает управляемый рост, устойчивость системы и готовность UnMoGrowP к масштабированию в режиме high‑performance mobile attribution platform.

