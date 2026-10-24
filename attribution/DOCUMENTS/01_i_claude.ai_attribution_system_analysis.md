# Глубокий анализ систем атрибуции мобильного и веб-трафика
## Техническое задание на разработку передовой системы атрибуции нового поколения

---

## EXECUTIVE SUMMARY / РЕЗЮМЕ

**RU:** Данный документ представляет комплексный анализ существующих систем атрибуции трафика (AppsFlyer, Adjust, Branch, Kochava, Singular и др.) с детальным изучением их архитектур, методов детекции фрода, интеграций и недостатков. На основе проведенного исследования сформулировано техническое задание для создания системы атрибуции нового поколения, которая превосходит существующие решения по всем ключевым параметрам: масштабируемости, точности, защите от фрода, гибкости и перспективности архитектуры на горизонте 5-10 лет.

**EN:** This document presents a comprehensive analysis of existing traffic attribution systems (AppsFlyer, Adjust, Branch, Kochava, Singular, etc.) with detailed examination of their architectures, fraud detection methods, integrations, and limitations. Based on the research, a technical specification has been formulated for creating a next-generation attribution system that surpasses existing solutions across all key parameters: scalability, accuracy, fraud protection, flexibility, and architectural sustainability over a 5-10 year horizon.

---

## ЧАСТЬ 1: АНАЛИЗ СУЩЕСТВУЮЩИХ СИСТЕМ
## PART 1: ANALYSIS OF EXISTING SYSTEMS

### 1.1. AppsFlyer

#### Архитектура / Architecture

**Клиентская часть / Client Side:**
- **SDK:** Native SDK для iOS (Swift/Objective-C), Android (Java/Kotlin), React Native, Flutter, Unity, Cordova
- **Размер SDK:** ~800KB для iOS, что относительно компактно
- **Инициализация:** Запуск в Application class (Android) или AppDelegate (iOS)
- **Методы атрибуции:**
  - Deterministic (детерминистическая): IDFA (iOS), GAID (Android), Install Referrer API
  - Probabilistic (вероятностная): IP + User Agent, fingerprinting
  - View-through attribution с настраиваемым lookback window (по умолчанию 24 часа)

**Серверная архитектура / Server Architecture:**
- Глобально распределенная инфраструктура с edge computing
- Гибридная архитектура: облако + dedicated инфраструктура для критически важных компонентов
- Core attribution engine обрабатывает миллиарды событий ежедневно с sub-second latency
- Multi-region deployment с глобальной балансировкой нагрузки
- Real-time event processing pipeline
- Time-series data model для sequential event analysis

**Технологический стек:**
- Изначально монолитное Python-приложение (Pyramid framework)
- Эволюция к microservices архитектуре (некоторые сервисы на Clojure)
- Service-oriented event-driven architecture на backend
- CouchDB для domain data с использованием changes feed
- Consul для конфигурации и service discovery
- Real-time databases + cold storage для исторических данных

**Модель данных:**
- Unified data model для нормализации данных из разных источников
- NoSQL distributed databases для неструктурированных attribution данных
- Column-oriented analytics databases для быстрых запросов на больших датасетах
- End-to-end encryption, региональная обработка данных (GDPR, CCPA compliance)

#### Защита от фрода / Fraud Protection

**Protect360 система:**
- Real-time anomaly detection алгоритмы
- Machine learning модели для идентификации паттернов фрода
- AI-driven detection с >90% эффективностью даже после bypass попыток
- 7X улучшение точности детекции
- Обнаружение до 60% больше post-attribution fraud в реальном времени
- Типы детектируемого фрода:
  - Click spamming
  - Click injection
  - SDK spoofing
  - Install hijacking
  - Attribution hijacking (CTIT timestamp anomalies)
  - Device farms & bot traffic
  - Impression fraud

**IP Geolocation:**
- Использует Digital Element NetAcuity Pulse для точной геолокации
- 98.3% detection rate для VPN/Proxy
- Миллиарды on-device location транзакций для точности

#### Интеграции

- 8,000+ партнеров в мобильной экосистеме
- Нативная интеграция с Facebook, Google Ads, Twitter Ads и др. Self-Attributing Networks (SANs)
- OneLink для cross-platform deep linking
- REST API v2 для программного доступа
- Postback URLs для real-time уведомлений ad networks
- Экспорт в BI tools, data warehouses

#### Недостатки / Limitations

1. **Стоимость:** Volume-based pricing может быстро расти при масштабировании
2. **Сложность настройки:** Требует 2-3 недели для advanced features
3. **Конфликт интересов:** Billing based on attributed data создает потенциальный конфликт при fraud detection (может пропускать до 50-60% фрода по оценкам независимых экспертов)
4. **D-7 отчетность:** Некоторые fraud reports с задержкой до 7 дней
5. **Legacy tech debt:** Монолитное наследие требует поддержки старого кода
6. **SDK размер:** Хотя и компактнее конкурентов, все равно добавляет вес приложению
7. **Privacy ограничения:** Зависимость от IDFA/GAID, сложности с iOS 14+ и SKAdNetwork

---

### 1.2. Adjust

#### Архитектура / Architecture

**Клиентская часть:**
- Быстрая интеграция SDK (~5 минут по заявлениям)
- Поддержка iOS (включая SKAN 4), Android, Windows, Unity, React Native
- Первые на рынке с SKAN 4 SDK
- Machine learning driven iOS measurement

**Серверная архитектура:**
- Private cloud infrastructure (собственная, не AWS)
- 1,000+ интеграций с рекламными партнерами
- Multi-platform measurement: mobile, CTV, PC, console
- Custom attribution waterfalls и windows
- Unlimited event tracking

**Методы атрибуции:**
- Single- и cross-device measurement
- Configurable attribution windows
- Custom parameters
- PC ad to PC app, console ad to console app, CTV ad to PC/console app

#### Защита от фрода

**Acquisition of Unbotify & Acquired.io:**
- Значительно усиленные anti-fraud capabilities (2018-2019)
- Fraud Firewall - одна из лучших в индустрии
- Automated fraud detection и prevention
- Traffic source validation

#### Интеграции

- 21 язык поддержки, 11 стран
- Интеграция с Privacy Sandbox on Android
- Attribution Reporting API support

#### Недостатки / Limitations

1. **Ценообразование:** Нет публичных цен, рост стоимости при увеличении features
2. **Сложность:** Может быть избыточен для малых проектов
3. **Raw data:** Доступ к raw data только во втором тире и выше
4. **Vendor lock-in:** Private infrastructure может создавать зависимость

---

### 1.3. Branch

#### Архитектура / Architecture

**Специализация:**
- People-based attribution фокус
- Deep linking как core capability
- Cross-platform identity graph
- Global registry of deep links с contextual data

**Клиентская часть:**
- Open source SDKs для гибкости разработчиков
- Deferred deep linking
- Universal/App links support
- Web-to-app tracking

**Серверная архитектура:**
- Purpose-built для linking с attribution сверху
- Sophisticated routing capabilities
- Cross-device identity resolution через advertiser-reported IDs
- Privacy-first approach (требует authentication для tie devices)

**Методы атрибуции:**
- Deterministic и probabilistic
- SKAdNetwork support
- Multi-touch attribution
- Custom re-engagement flows
- UTM tracking
- Website-to-app attribution forwarding

#### Интеграции

- Меньше ad network integrations, чем у конкурентов
- Фокус на e-commerce с complex customer journeys
- Built-in fraud suite для всех ads customers

#### Недостатки / Limitations

1. **Ограниченная экосистема:** Меньше network partnerships
2. **E-commerce focus:** Может быть избыточен для других вертикалей
3. **Attribution as secondary:** Deep linking первичен, attribution вторичен
4. **Цены:** Не публичные, требуется custom quote
5. **SDK footprint:** ~1MB для iOS (больше чем AppsFlyer)

---

### 1.4. Kochava

#### Архитектура / Architecture

**Unified Audience Platform:**
- Full-stack решение: Plan, Target, Activate, Measure, Optimize
- ROI-based платформа vs commodity attribution tools

**Клиентская часть:**
- SDK и S2S integration опции
- IdentityLink™ для cross-device visibility
- Configurable attribution - лидер индустрии

**Серверная архитектура:**
- **Google Cloud Spanner** как основная БД - критически важно!
- Каждый клиент получает собственную database для изоляции
- Auto-provisioning Spanner resources при создании аккаунта
- Auto-scaling infrastructure
- Real-time data ingestion
- Kochava Object Model - real-time object model всех данных
- BigQuery для reporting
- Ads Storage API для real-time lookups

**Конфигурируемая атрибуция:**
- Lookback windows: от 1 минуты до 30 дней для clicks, до 24 часов для impressions
- 3 уровня probabilistic attribution:
  - IP + User Agent (highest integrity)
  - IP + 1st stanza (medium)
  - IP only (lowest integrity, highest coverage)
- Waterfall format attribution:
  - Priority 1: Lookback window
  - Priority 2: Match integrity
  - Priority 3: Click time

**Методы атрибуции:**
- Deterministic (device ID matching)
- Probabilistic (IP + User Agent) с >90% accuracy
- SAN claims (Facebook, Twitter, Apple Search Ads, Google)
- View-through attribution с completed views

#### Защита от фрода

- Global Fraud Blocklist
- Build-your-own (BYO) blocklist
- Custom Traffic Verifier rules
- Multi-front defense approach

#### Интеграции

- 3,800+ ad network и media partner integrations - самое большое число
- Kochava Collective - data marketplace
- Server-side integrations для automated cost data import
- Programmatic advertising workflow support

#### Недостатки / Limitations

1. **Complexity:** Full-stack может быть overwhelming
2. **Learning curve:** Много конфигурационных опций
3. **UI:** Менее intuitive чем у некоторых конкурентов
4. **Cost:** Free tier ограничен, платные планы растут с MAU
5. **Over-engineering:** Может быть избыточен для простых use cases

---

### 1.5. Singular

#### Архитектура / Architecture

**Marketing Intelligence Platform:**
- ROI-focused attribution + marketing cost aggregation
- Unified view: attribution + cost data

**Клиентская часть:**
- Web SDK, Google Tag Manager integration
- Server-side tracking для offline events
- Mobile SDK
- Cross-device attribution через advertiser-reported IDs

**Серверная архитектура:**
- ETL capabilities для data normalization
- Data warehousing exports (BigQuery, Snowflake)
- Real-time processing + batch processing
- Cost aggregation engine с high precision

**Методы атрибуции:**
- SKAdNetwork (comprehensive SKAN reporting)
- Web attribution (cookie-based, attribution links, UTM)
- Cross-platform measurement
- Multi-touch attribution
- Customizable attribution models (2024+ update)

**ETL Features:**
- Data Normalization (standardization)
- Entity Matching (connecting related data)
- Custom Metrics calculation
- Raw data access для data science teams

#### Интеграции

- Thousands of automated cost data sources
- One-click Facebook, Google integrations
- 400+ integrations через ecosystem
- Ad network cost data auto-import

#### Недостатки / Limitations

1. **Focus на ROI:** Может не хватать advanced features для других use cases
2. **Dependency на advertiser IDs:** Cross-device requires authentication
3. **Complexity:** Требует data science expertise для full potential
4. **Cost transparency:** Pricing not public
5. **Cohort limitations:** Only registration-based cohorts currently

---

### 1.6. Другие игроки / Other Players

**Tenjin:**
- Gaming-focused специализация
- Industry-specific features
- Менее универсален

**Airbridge:**
- Simplified attribution + deep linking
- Подходит для smaller teams
- Ограниченные advanced features

**mParticle:**
- Customer Data Platform approach
- Attribution как часть CDP
- Data infrastructure focus

---

## ЧАСТЬ 2: КРИТИЧЕСКИЙ АНАЛИЗ НЕДОСТАТКОВ
## PART 2: CRITICAL ANALYSIS OF LIMITATIONS

### 2.1. Системные проблемы / Systemic Issues

#### 2.1.1. Конфликт интересов в fraud detection

**Проблема:** Attribution platforms billing на основе attributed data создает inherent conflict of interest. Если они детектируют больше фрода, их revenue падает.

**Доказательства:**
- Independent fraud detection companies (mFilterIt, Scalarr) находят 50-60% fraud в трафике, который MMPs пометили как "clean"
- D-7 reporting delays позволяют fraud продолжаться без немедленного реагирования
- Customizable fraud rules перекладывают ответственность на advertisers, которые не являются fraud experts

#### 2.1.2. Privacy-first era challenges

**iOS 14+ и ATT Framework:**
- IDFA opt-in rates ~15-25%
- Зависимость от SKAdNetwork с серьезными ограничениями
- Delayed postbacks (0-72 часа)
- Limited conversion values
- No user-level data

**Chrome cookie deprecation:**
- Third-party cookies фазируются out
- Cross-device tracking усложняется
- Probabilistic методы теряют точность

#### 2.1.3. Architectural tech debt

**Monolithic legacy:**
- AppsFlyer начинали с monolith, миграция к microservices незавершена
- Legacy code требует maintenance
- Сложность добавления новых features

**Vendor lock-in:**
- Proprietary solutions (Adjust private cloud)
- Сложность миграции между platforms
- Data export limitations

#### 2.1.4. Scalability bottlenecks

**Processing latency:**
- Sub-second attribution только для части events
- Batch processing для некоторых analytics
- Peak load challenges

**Data retention:**
- Ограничения retention в базовых планах
- Additional cost для long-term storage
- Raw data access restrictions

#### 2.1.5. Attribution model limitations

**Single-touch dominance:**
- Last-click attribution преобладает
- Multi-touch attribution доступна не всегда
- Limited customization в attribution logic

**Cross-platform gaps:**
- Mobile-first focus
- Web attribution как secondary
- CTV, IoT, wearables часто игнорируются
- Cross-device attribution требует logins

#### 2.1.6. Integration challenges

**Partner ecosystem:**
- Зависимость от ad networks для cooperation
- Delays в adding new partners
- API rate limits
- Inconsistent data quality от partners

#### 2.1.7. Reporting & analytics limitations

**Real-time constraints:**
- Не все metrics в real-time
- Dashboard latency
- Limited drill-down capabilities

**Custom analytics:**
- SQL access ограничен (только Kochava Query)
- Предустановленные reports
- Limited flexibility для data science

#### 2.1.8. Cost unpredictability

**Pricing models:**
- MAU-based pricing может explode при росте
- Hidden costs для premium features
- No transparent pricing для comparison

---

## ЧАСТЬ 3: ТЕХНИЧЕСКОЕ ЗАДАНИЕ НОВОЙ СИСТЕМЫ
## PART 3: TECHNICAL SPECIFICATION FOR NEW SYSTEM

### 3.1. Видение и принципы / Vision & Principles

**Vision Statement:**

**RU:** Создать универсальную платформу атрибуции нового поколения, которая объединяет лучшие практики существующих решений, устраняет их недостатки и предоставляет уникальные преимущества через инновационную архитектуру, полную прозрачность, нулевой конфликт интересов и непревзойденную защиту от фрода для мобильного и веб-трафика на горизонте 5-10 лет.

**EN:** Create a next-generation universal attribution platform that combines best practices from existing solutions, eliminates their shortcomings, and provides unique advantages through innovative architecture, complete transparency, zero conflict of interest, and unmatched fraud protection for mobile and web traffic with 5-10 year sustainability.

**Core Principles:**

1. **Truth First:** Нулевой конфликт интересов в fraud detection
2. **Privacy by Design:** GDPR, CCPA, ATT compliant с первого дня
3. **Open by Default:** Open source core, transparent algorithms
4. **Scale Without Limits:** Horizontal scaling до billions events/day
5. **Future-Proof Architecture:** Language, framework, cloud agnostic
6. **Real-Time Always:** Sub-100ms attribution latency
7. **Customer Ownership:** Data belongs to customer, full export capabilities
8. **Unified Platform:** Mobile + Web + CTV + IoT в единой системе

---

### 3.2. Архитектура системы / System Architecture

#### 3.2.1. Microservices Architecture

**Фундаментальные принципы:**

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│              (Kong / Envoy / Custom)                         │
│         Rate Limiting, Auth, Load Balancing                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│   Ingestion  │      │  Attribution │     │   Fraud      │
│   Service    │      │    Engine    │     │  Detection   │
│              │      │              │     │   Service    │
└──────────────┘      └──────────────┘     └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │  Event Bus       │
                    │  (Kafka/Pulsar)  │
                    └──────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│  Analytics   │      │   Reporting  │     │ Integration  │
│   Engine     │      │   Service    │     │   Service    │
└──────────────┘      └──────────────┘     └──────────────┘
```

**Technology Stack (Polyglot Approach):**

**Ingestion Layer:**
- **Language:** Go / Rust (performance-critical)
- **Обоснование:** 
  - Go: concurrency через goroutines, простота deployment
  - Rust: zero-cost abstractions, memory safety без GC
- **Frameworks:** 
  - Go: Gin/Fiber для HTTP
  - Rust: Actix-web/Axum
- **Capacity:** 10M+ events/second per instance

**Attribution Engine:**
- **Language:** Rust (core) + Python (ML models)
- **Обоснование:**
  - Rust: критическая performance, thread safety
  - Python: ML ecosystem, rapid experimentation
- **ML Framework:** PyTorch / TensorFlow для fraud detection models
- **Latency:** <50ms для deterministic, <200ms для probabilistic

**Fraud Detection Service:**
- **Language:** Python + Rust
- **ML Stack:** 
  - Scikit-learn для classical ML
  - PyTorch для deep learning
  - ONNX для model export и cross-language inference
  - Rust для ONNX runtime integration
- **Real-time:** Stream processing с Flink/Spark Streaming
- **Batch:** Airflow/Prefect для scheduled retraining

**Analytics Engine:**
- **Language:** Scala / Java
- **Framework:** Apache Spark для distributed computing
- **Query Engine:** Presto / Trino для ad-hoc SQL
- **OLAP:** ClickHouse / Druid для real-time analytics

**Reporting Service:**
- **Language:** Node.js / TypeScript
- **Обоснование:** async I/O, vast ecosystem, developer familiarity
- **Framework:** NestJS для structured architecture
- **API:** GraphQL + REST

**Integration Service:**
- **Language:** Go
- **Обоснование:** excellent stdlib для HTTP clients, concurrency
- **Patterns:** Circuit breaker, retry с exponential backoff, bulkhead

**Frontend:**
- **Framework:** React / Next.js для dashboard
- **State Management:** Zustand / Jotai
- **Visualization:** D3.js, Apache ECharts
- **Real-time:** WebSocket / SSE для live updates

#### 3.2.2. Data Layer Architecture

**Multi-Model Database Approach:**

**1. Hot Data (Real-Time Attribution):**
- **Primary:** CockroachDB / YugabyteDB
  - Обоснование: distributed SQL, horizontal scaling, strong consistency
  - Postgres compatibility для easy migration
  - Multi-region с low latency reads
  - Alternative: Google Cloud Spanner (proven by Kochava)
- **Use case:** 
  - Active attribution decisions
  - Recent clicks/impressions (last 30 days)
  - User sessions
- **Sharding strategy:** По app_id + date для temporal locality

**2. Time-Series Data:**
- **Database:** TimescaleDB / InfluxDB / VictoriaMetrics
- **Use case:**
  - Event timestamps
  - Performance metrics
  - User journey sequences
- **Retention:** Hot: 90 days, Warm: 1 year, Cold: archival
- **Compression:** Aggressive compression для старых данных

**3. Analytics & OLAP:**
- **Primary:** ClickHouse
  - Обоснование: column-store, exceptional compression, fast aggregations
  - SQL support
  - Materialized views для pre-aggregated reports
- **Secondary:** Apache Druid
  - Real-time ingestion
  - Sub-second query latency
  - Time-based partitioning
- **Use case:**
  - Reporting queries
  - Cohort analysis
  - Funnel analytics
  - LTV calculations

**4. Document Store:**
- **Database:** MongoDB / PostgreSQL JSONB
- **Use case:**
  - App configurations
  - User preferences
  - Flexible schemas для integrations
  - Audit logs

**5. Graph Database:**
- **Database:** Neo4j / JanusGraph
- **Use case:**
  - Cross-device identity resolution
  - User journey mapping
  - Attribution path analysis
  - Fraud network detection

**6. Cache Layer:**
- **In-Memory:** Redis / KeyDB
  - Обоснование: multi-threaded Redis fork
- **Distributed:** Redis Cluster / Hazelcast
- **Use cases:**
  - Session data
  - Rate limiting
  - Hot aggregations
  - Deduplication

**7. Object Storage:**
- **Solution:** MinIO / S3-compatible
- **Use case:**
  - Raw event logs
  - ML model artifacts
  - Backup and archives
  - Data lake foundation

**Data Flow:**

```
Ingestion → Kafka → [Real-time Stream Processing] → Hot DB
                 ↓
          [Batch Processing] → Analytics DB
                 ↓
              Archive → Object Storage
```

#### 3.2.3. Event-Driven Architecture

**Message Broker:**
- **Primary:** Apache Kafka
  - Proven at scale (LinkedIn, Uber, Netflix)
  - High throughput (millions msg/sec per cluster)
  - Durability и replayability
  - Stream processing via Kafka Streams
- **Alternative:** Apache Pulsar
  - Multi-tenancy native
  - Geo-replication
  - Functions framework

**Event Schema:**
- **Format:** Avro / Protocol Buffers
  - Schema evolution support
  - Compact binary format
  - Language-agnostic
- **Schema Registry:** Confluent Schema Registry

**Topics Structure:**
```
clicks.v1
impressions.v1
installs.v1
events.v1
conversions.v1
fraud.alerts.v1
attribution.results.v1
```

**Stream Processing:**
- **Framework:** Apache Flink
  - Обоснование: exactly-once semantics, event time processing
  - Stateful computations
  - Low latency (<100ms)
- **Alternative:** Kafka Streams для simpler use cases

**Complex Event Processing (CEP):**
- Pattern detection для fraud
- Funnel analysis в real-time
- Session windowing

#### 3.2.4. Container Orchestration & Deployment

**Kubernetes:**
- **Distribution:** Vanilla K8s / EKS / GKE / AKS
- **Multi-cloud readiness:** Avoid vendor lock-in
- **Service Mesh:** Istio / Linkerd для:
  - mTLS between services
  - Traffic management
  - Observability
  - Circuit breaking

**Container Strategy:**
- **Runtime:** containerd (lightweight, не Docker)
- **Base Images:** Distroless / Alpine для security
- **Registry:** Harbor (self-hosted) / cloud-native

**Deployment Pattern:**
- **GitOps:** ArgoCD / FluxCD
- **Blue-Green Deployments** для zero-downtime
- **Canary Releases** для gradual rollout
- **Feature Flags:** LaunchDarkly / Unleash для A/B testing

**Auto-Scaling:**
- **HPA (Horizontal Pod Autoscaler):** CPU/Memory based
- **KEDA (Kubernetes Event Driven Autoscaler):** Event source based (Kafka lag, etc.)
- **VPA (Vertical Pod Autoscaler):** Right-sizing
- **Cluster Autoscaler:** Node provisioning

**Multi-Region Strategy:**
- Active-Active для high availability
- Cross-region data replication
- Global load balancing via Anycast / DNS
- Latency-based routing

#### 3.2.5. Observability Stack

**Metrics:**
- **Collection:** Prometheus
- **Long-term Storage:** Thanos / Cortex / VictoriaMetrics
- **Alerting:** Alertmanager + PagerDuty/Opsgenie

**Logging:**
- **Collection:** Fluent Bit / Vector
- **Aggregation:** Loki / Elasticsearch
- **Visualization:** Grafana

**Tracing:**
- **Standard:** OpenTelemetry
- **Backend:** Jaeger / Tempo
- **APM:** Grafana Tempo + Grafana

**Unified Observability:**
- **Dashboard:** Grafana (metrics + logs + traces)
- **Correlation:** TraceID в logs для связи
- **Alerts:** Multi-signal alerts (metrics + logs)

**Custom Metrics:**
- Attribution latency percentiles (p50, p95, p99)
- Fraud detection accuracy
- Event processing throughput
- API error rates
- Cache hit rates
- Database query performance

---

### 3.3. Core Features & Innovations

#### 3.3.1. Attribution Engine Innovations

**Hybrid Attribution Model:**

**Multi-Touch Attribution (MTA) by Default:**
- Не только last-click, но full journey
- Configurable models:
  - Linear (equal credit)
  - Time Decay (recent touchpoints higher weight)
  - U-Shaped (first и last emphasis)
  - W-Shaped (first, middle, last)
  - Custom algorithmic (ML-based)
  - Position-based
  - Data-driven (автоматическая оптимизация весов)

**Probabilistic Attribution Next-Gen:**
- **Техника:** Gradient Boosting + Neural Networks
- **Features:**
  - Device fingerprint (screen resolution, timezone, language, fonts, canvas fingerprinting)
  - IP geolocation до города
  - ISP detection
  - Browser/OS version patterns
  - Connection type (WiFi/Cellular/VPN)
  - Behavioral patterns (scroll depth, dwell time если web)
- **Accuracy:** >95% (улучшение vs 90% у Kochava)
- **Privacy:** Differential privacy для aggregated patterns

**Deterministic + Probabilistic Fusion:**
- Не или/или, а hybrid scoring
- Confidence score для каждого match:
  - Deterministic (IDFA/GAID match): 100% confidence
  - High probabilistic (IP + UA + device fingerprint match): 95% confidence
  - Medium probabilistic (IP + UA): 85% confidence
  - Low probabilistic (IP only): 60% confidence
- Dashboard показывает confidence distribution

**Cross-Device Identity Graph:**
- **Graph Database** (Neo4j) для связей между devices
- **Linking signals:**
  - Authenticated user IDs (email, phone, customer ID)
  - Shared IP addresses (home/office WiFi patterns)
  - Temporal patterns (device switch timing)
  - Behavioral similarity (same browsing patterns)
- **Privacy:** User consent required, GDPR Article 6 compliance
- **Probabilistic graph edges:** Confidence scores на connections

**Real-Time Lookback Window Adjustment:**
- Не статичные 30 days/24 hours
- **Machine Learning** предсказывает optimal window per:
  - App category (gaming vs e-commerce vs B2B)
  - Ad network performance
  - User cohort behavior
  - Seasonality
- **Example:** Gaming app может иметь 48h window, fintech app 7 days

**Attribution Deduplication:**
- Intelligent dedup для cross-platform
- Если user clicked на web и mobile ad, кому credit?
- Configurable rules + ML recommendations
- Timestamp granularity до milliseconds

#### 3.3.2. Fraud Detection System (Cornerstone Feature)

**Принцип: Zero Conflict of Interest**

**Монетизация:** Fraud detection не влияет на attribution billing. Separate pricing model (flat fee или % от prevented fraud spend, capped).

**Multi-Layered Fraud Defense:**

**Layer 1: Real-Time Rule Engine**
- **Technology:** Rust для performance
- **Rules:**
  - CTIT (Click-to-Install Time) anomalies: <1 second = suspicious
  - Impossible travel: Click in NY, install in Tokyo 5 min later
  - Device farm patterns: Multiple installs from same device ID
  - IP blacklists: Known fraud IP ranges
  - User-Agent anomalies: Mismatched OS/device combinations
  - High-frequency clicking: >X clicks/min from single source
  - Geo mismatch: Ad geo != install geo
  - ISP mismatch: Mobile ISP but desktop user-agent
- **Response time:** <10ms per event
- **Action:** Immediate flagging, не blocking (для analysis)

**Layer 2: Machine Learning Ensemble**
- **Models:**
  - **Anomaly Detection:** Isolation Forest для outlier detection
  - **Classification:** XGBoost для fraud/legit binary
  - **Deep Learning:** LSTM для sequential pattern detection
  - **Graph Neural Networks:** Fraud network identification
- **Features (150+):**
  - Temporal: Time of day, day of week, time since last action
  - Behavioral: Click patterns, session duration, event sequences
  - Device: OS version, device model, screen size, battery level
  - Network: IP reputation, ASN, connection type, VPN detection
  - Contextual: App category, ad creative, campaign type
  - Historical: User history, publisher history, network history
- **Training:**
  - Daily retraining с latest fraud patterns
  - Active learning от analyst feedback
  - Adversarial training для robustness
- **Explainability:** SHAP values для каждого prediction
  - Dashboard показывает why event marked as fraud

**Layer 3: Collaborative Intelligence**
- **Fraud Consortium:** Анонимное sharing fraud patterns между customers
  - Privacy: Differential privacy, federated learning
  - Benefit: Network effect - fraud detected у Customer A защищает Customer B
- **Threat Intelligence Feeds:**
  - Integration с external feeds (Scalarr, TrafficGuard, etc.)
  - IP reputation databases
  - Device blacklists
- **Community-Driven Blocklists:**
  - Customers могут share publisher/network blacklists
  - Opt-in с transparency

**Layer 4: Behavioral Analysis**
- **Bot Detection:**
  - Mouse movement patterns (если web): Human-like vs robotic
  - Touch patterns (если mobile): Pressure, size, duration
  - Scroll behavior: Natural vs automated
  - Navigation patterns: Human exploration vs programmed paths
- **SDK Integrity:**
  - Certificate pinning для secure SDK communication
  - Anti-tampering checks
  - Obfuscation против reverse engineering
  - Runtime application self-protection (RASP)

**Layer 5: Post-Attribution Verification**
- **Engagement Validation:**
  - Fraud може pass install detection, но fail engagement
  - Track post-install events: sessions, key actions, revenue
  - Flag "zombie installs": Installed но never used
- **LTV Prediction:**
  - ML model предсказывает expected LTV
  - If actual LTV << predicted, investigate
- **Cohort Analysis:**
  - Compare cohort behavior
  - Anomalous cohorts flagged для review

**Fraud Dashboard:**
- **Real-Time Alerts:** Fraud spikes
- **Historical Trends:** Fraud rate over time
- **Drilldown:** By network, campaign, geo, device
- **ROI Calculator:** Fraud prevented = $$ saved
- **Confidence Scores:** Each event marked with fraud probability
- **Detailed Reports:**
  - Why это fraud: Feature contributions
  - Pattern identification: Похожие fraud cases
  - Recommendations: Block source, adjust rules

**Action System:**
- **Configurable Thresholds:**
  - Auto-block at >95% fraud probability
  - Flag for review at 70-95%
  - Log только at <70%
- **Manual Review Queue:** Для borderline cases
- **Whitelist Management:** Trusted sources
- **Automated Postback Adjustments:** Не send postback для fraud
- **Refund Requests:** Automated для proven fraud (если CPI/CPA)

**Fraud Prevention Guarantee:**
- **SLA:** <5% fraud rate or money back
- **Transparency:** Public fraud stats (anonymized)
- **Third-Party Audits:** Quarterly audits by independent firms

#### 3.3.3. Post-Installation Analytics

**User Journey Tracking:**
- **Event Collection:**
  - Standard events: Session start/end, app open, app close
  - E-commerce: Product view, add to cart, purchase, checkout steps
  - Gaming: Level start/complete, achievement unlock, tutorial finish
  - Media: Content view, play, pause, complete, share
  - Custom events: Unlimited
- **Properties:** Unlimited custom properties per event
- **User Properties:** Profile attributes, segments, cohorts

**Funnel Analysis:**
- **Visual Funnel Builder:** Drag-and-drop interface
- **Conversion Rates:** Each step
- **Drop-off Analysis:** Where users churn
- **Time Analysis:** Avg time between steps
- **Segment Comparison:** iOS vs Android, geo, source, etc.
- **A/B Test Integration:** Variant performance in funnels

**Cohort Analysis:**
- **Cohort Definition:**
  - By install date
  - By first event date
  - By campaign
  - By attribute (country, device, OS version)
  - Custom SQL-based cohorts
- **Retention:**
  - Day 1, 7, 14, 30, 60, 90 retention
  - Unbounded retention (любой день)
  - Retention curves
- **LTV (Lifetime Value):**
  - Predicted LTV via ML (Gradient Boosting)
  - Actual LTV tracking
  - Revenue per user, ARPU, ARPPU
  - Cohorted LTV curves
- **Engagement:**
  - Session frequency
  - Session duration
  - Events per session
  - Stickiness (DAU/MAU ratio)

**Segmentation:**
- **User Segments:**
  - Demographic: Age, gender, location
  - Behavioral: Power users, at-risk users, churned users
  - Transactional: High-value, low-value, non-payers
  - Custom: Any combination of properties
- **Segment Builder:** SQL-like query interface + visual
- **Dynamic Segments:** Auto-update as users change
- **Export:** To ad networks для retargeting

**User Profiles:**
- **360° View:**
  - Attribution source
  - All events timeline
  - Properties и attributes
  - Cohort membership
  - Segment membership
  - Predicted behaviors (churn risk, LTV)
  - Device(s) used
  - Cross-device journey

**Revenue Analytics:**
- **Revenue Tracking:**
  - In-app purchases
  - Subscriptions
  - Ad revenue (if applicable)
  - Other revenue streams
- **ROAS (Return on Ad Spend):**
  - By campaign, network, creative, keyword
  - Time-based: 1-day, 7-day, 30-day, lifetime ROAS
  - Cohorted ROAS
- **Payback Period:**
  - Time to recover CAC (Customer Acquisition Cost)
  - By cohort, source
- **Revenue Attribution:**
  - Multi-touch revenue attribution
  - Assisted revenue tracking

**Predictive Analytics:**
- **Churn Prediction:**
  - ML model (Random Forest / Neural Network)
  - Churn probability score per user
  - Factors contributing to churn
  - Proactive retention campaigns
- **LTV Prediction:**
  - Predict future revenue
  - Segment users by predicted LTV
  - Optimize CAC bidding
- **Conversion Prediction:**
  - Likelihood to purchase
  - Optimal time to show offer
  - Personalization recommendations

**A/B Testing:**
- **Experimentation Framework:**
  - Built-in A/B testing
  - Feature flags integration
  - Statistical significance testing
  - Bayesian analysis option
- **Use Cases:**
  - Onboarding flows
  - Pricing tests
  - Feature releases
  - UI/UX variations
- **Metrics:** Any event или metric

#### 3.3.4. Deep Linking & Web-to-App

**Universal Deep Links:**
- **OneLink Alternative:** Single link для всех platforms
  - iOS: Universal Links (Associated Domains)
  - Android: App Links
  - Web: Fallback to website
- **Context Preservation:**
  - Parameters pass through install
  - Deferred deep linking (install then open to specific screen)
  - Campaign data attached
- **Dynamic Links:**
  - Generate programmatically via API
  - QR codes
  - Short URLs с custom domains

**Web-to-App Flows:**
- **Smart Banners:**
  - Detect app install status
  - "Open in App" if installed
  - "Install App" if not
  - Customizable UI
- **Web SDK:**
  - Track web events
  - Attribute web-to-app conversions
  - Session continuity (web → app)
- **Attribution Forwarding:**
  - Web click → App install attribution
  - Preserve referrer, campaign params

**Cross-Platform Journeys:**
- **Scenario:** User sees ad on desktop web → installs mobile app → makes purchase
- **Tracking:**
  - Web SDK tracks ad click (cookie + server-side ID)
  - Mobile SDK tracks install
  - Cross-device identity resolution links them
  - Attribution credit given correctly
  - Full journey visible в dashboard

#### 3.3.5. Privacy & Compliance Features

**Privacy by Design:**

**1. Consent Management:**
- **TCF 2.0 (Transparency & Consent Framework) Integration:**
  - IAB standard support
  - CMP (Consent Management Platform) compatible
- **GDPR Article 6 & 7:**
  - Explicit consent collection
  - Granular consent (analytics vs marketing)
  - Consent withdrawal mechanism
  - Consent audit trail
- **CCPA / CPRA:**
  - "Do Not Sell My Data" support
  - User data deletion requests (within 30 days)
  - Data portability (export user data)
- **iOS ATT:**
  - SDK respects ATT status
  - Differential behavior for opted-in vs opted-out
  - SKAdNetwork integration для opted-out

**2. Data Minimization:**
- **Collect Only Necessary:**
  - Configurable data collection levels
  - Strip PII by default
  - IP anonymization (last octet masked)
- **Pseudonymization:**
  - User IDs hashed
  - No raw emails/phones stored (только hashes для matching)

**3. Data Retention Policies:**
- **Configurable Retention:**
  - Default: 2 years
  - Customer can set: 90 days to unlimited
  - Automated deletion
- **Right to Erasure:**
  - API endpoint для user deletion requests
  - Propagates to all databases, backups, logs
  - Audit trail proof

**4. Encryption:**
- **At Rest:**
  - Database encryption (AES-256)
  - Object storage encryption
  - Encrypted backups
- **In Transit:**
  - TLS 1.3 для all communications
  - mTLS между microservices
  - Certificate rotation

**5. Privacy-Preserving Techniques:**
- **Differential Privacy:**
  - Aggregated reports с noise injection
  - Prevents individual re-identification
- **Federated Learning:**
  - ML models trained без sharing raw data
  - Collaborative fraud detection без privacy breach
- **Secure Multi-Party Computation (SMPC):**
  - Future: Cross-company analytics без revealing data

**6. Compliance Dashboards:**
- **Data Inventory:**
  - What data collected
  - Where stored
  - Retention period
  - Legal basis
- **Consent Status:**
  - % users consented
  - Consent breakdowns
  - Withdrawal rate
- **Privacy Requests:**
  - Deletion requests tracking
  - Export requests
  - Response times
  - Compliance SLA monitoring

**7. Regional Data Residency:**
- **Data Localization:**
  - EU data stays в EU
  - US data в US
  - APAC data в APAC
- **Multi-Region Deployment:**
  - Kubernetes clusters per region
  - Data sovereignty compliance

**8. Third-Party Audits:**
- **SOC 2 Type II:** Annual audit
- **ISO 27001:** Information security certification
- **GDPR DPIAs:** Data Protection Impact Assessments
- **Penetration Testing:** Quarterly
- **Public Reports:** Annual transparency report

#### 3.3.6. Integration Ecosystem

**Ad Network Integrations:**
- **Goal:** 5,000+ partners (surpass Kochava)
- **Integration Types:**
  - Server-to-Server (S2S): Majority
  - SDK-to-SDK: For SRNs (Facebook, Google, TikTok, Snapchat, Twitter)
  - API-based: For smaller networks
- **Automated Cost Import:**
  - Daily syncs
  - Real-time for supported partners
  - Manual upload fallback
- **Postback System:**
  - Real-time postbacks (<5s latency)
  - Retry с exponential backoff
  - Delivery guarantees (at-least-once)
  - Custom postback templates
  - Macro support (placeholders)

**Marketing Tools:**
- **CRMs:** Salesforce, HubSpot, Marketo integration
  - Sync user data
  - Trigger campaigns based on attribution events
- **Email Marketing:** SendGrid, Mailchimp, Braze
  - Segment export
  - Attribution tracking на email clicks
- **Analytics:** Google Analytics, Mixpanel, Amplitude
  - Data forwarding
  - Cross-platform consistency
- **A/B Testing:** Optimizely, VWO, LaunchDarkly
  - Variation tracking
  - Performance attribution

**Data Warehouses:**
- **Export Connectors:**
  - Snowflake, BigQuery, Redshift, Databricks
  - Scheduled exports (hourly, daily, weekly)
  - Full historical backfill
  - Incremental updates
- **Data Formats:**
  - Parquet (columnar, compressed)
  - CSV (compatibility)
  - JSON Lines (streaming)
  - Avro (schema evolution)

**Business Intelligence:**
- **BI Tool Integrations:**
  - Tableau, Looker, Power BI, Metabase
  - Live query connectors
  - Pre-built dashboard templates
  - Custom SQL access

**Custom Integrations:**
- **REST API:**
  - Full-featured API
  - Rate limiting (generous)
  - API keys + OAuth 2.0
  - Webhooks для events
  - OpenAPI (Swagger) spec
- **SDKs:**
  - Official client libraries:
    - Python, JavaScript, Go, Ruby, Java, PHP
  - Community SDKs encouraged (GitHub)
- **Zapier / Make Integration:**
  - No-code integrations
  - Trigger actions based на attribution events

**Partner Certification Program:**
- **Fast-Track для Ad Networks:**
  - Documentation templates
  - Integration testing sandbox
  - Certification badge
  - Co-marketing opportunities
- **Marketplace:**
  - Public partner directory
  - Reviews и ratings
  - Integration guides

---

### 3.4. Scalability & Performance

#### 3.4.1. Performance Targets

**Attribution Latency:**
- **Deterministic Attribution:** <50ms (p99)
- **Probabilistic Attribution:** <200ms (p99)
- **Fraud Check:** <10ms additional overhead
- **End-to-End (Click to Attribution):** <500ms (p99)

**Ingestion Throughput:**
- **Target:** 10M events/second per region
- **Peak Capacity:** 30M events/second (3x buffer)
- **Burst Handling:** Queue-based с auto-scaling

**Query Performance:**
- **Dashboard Load:** <2s (p95)
- **Aggregated Reports:** <5s для 1M rows (p95)
- **Raw Data Queries:** <30s для 100M rows (p95)
- **Real-Time Alerts:** <1s detection

**API Performance:**
- **REST API:** <100ms response (p95)
- **GraphQL:** <200ms для complex queries (p95)
- **Webhook Delivery:** <5s (p95), с retries

**Availability:**
- **Uptime SLA:** 99.95% (21 minutes downtime/month max)
- **RTO (Recovery Time Objective):** <15 minutes
- **RPO (Recovery Point Objective):** <1 minute data loss max

#### 3.4.2. Horizontal Scaling Strategy

**Stateless Services:**
- **Design:** All microservices stateless где possible
- **Scaling:** Add replicas без coordination
- **Load Balancing:** Round-robin, least-connections, или weighted

**Stateful Services:**
- **Databases:** Sharding, replication, read replicas
- **Caches:** Redis Cluster с consistent hashing
- **Message Brokers:** Kafka partitions scale linearly

**Auto-Scaling Triggers:**
- **CPU Utilization:** >70% за 5 min → scale up
- **Memory Utilization:** >80% за 5 min → scale up
- **Request Queue Depth:** >1000 messages → scale up
- **Custom Metrics:** Attribution latency >threshold
- **Time-Based:** Pre-scale для predicted traffic (e.g., campaign launches)

**Scaling Limits:**
- **Pod Limits:** Min 3, Max 100 per service (configurable)
- **Node Limits:** Min 5, Max 500 nodes per cluster
- **Database Shards:** 1024 max (10+ years runway)

**Global Distribution:**
- **Regions:** Initially: US-East, US-West, EU-West, APAC-Southeast
- **Expansion:** Add regions on-demand
- **Data Sync:** Cross-region replication для redundancy
- **Routing:** GeoDNS + Anycast для lowest latency

#### 3.4.3. Disaster Recovery

**Backup Strategy:**
- **Frequency:**
  - Critical DBs: Continuous replication + hourly snapshots
  - Analytics DBs: Daily snapshots
  - Object Storage: Cross-region replication
- **Retention:**
  - Hourly: 7 days
  - Daily: 30 days
  - Weekly: 1 year
  - Monthly: 3 years (compliance)
- **Testing:** Quarterly restore drills

**Failover:**
- **Active-Active:** Multiple regions serving traffic
- **Automatic Failover:** Health checks → traffic reroute
- **Data Consistency:** Eventual consistency acceptable (trade-off для availability)
- **Runbooks:** Documented procedures для every scenario

**Chaos Engineering:**
- **Regular Testing:**
  - Kill random pods
  - Network partition simulations
  - Database failover tests
  - Region outage simulations
- **Tools:** Chaos Mesh / Litmus на Kubernetes

---

### 3.5. Advanced Features (Differentiation)

#### 3.5.1. AI-Powered Insights

**Automated Anomaly Detection:**
- **What:** Система автоматически детектирует аномалии в metrics
- **Examples:**
  - Sudden drop в conversion rate
  - Unexpected spike в cost
  - Unusual geo distribution
  - Fraud surge
- **Alerts:** Slack/Email/SMS с explanation
- **Root Cause Analysis:** AI suggests possible causes

**Natural Language Querying:**
- **Feature:** Ask questions в natural language
- **Examples:**
  - "Show me top campaigns by ROAS last week"
  - "Which geos have highest fraud rate?"
  - "Compare iOS vs Android LTV for Q4"
- **Technology:** GPT-4 / Claude для query parsing → SQL
- **Interface:** Chatbot в dashboard

**Predictive Recommendations:**
- **Budget Optimization:**
  - "Shift $10K from Campaign A to Campaign B for +15% ROAS"
- **Targeting Suggestions:**
  - "Target users aged 25-34 in Germany for lowest CAC"
- **Creative Insights:**
  - "Video ads outperform static by 32% для this app category"
- **Churn Prevention:**
  - "Re-engage these 5,000 users now to prevent churn"

**Automated Reporting:**
- **Scheduled Reports:**
  - Daily/Weekly/Monthly
  - Custom templates
  - Sent via email/Slack
- **Executive Summaries:**
  - AI-generated narrative
  - Key insights highlighted
  - Action items suggested

#### 3.5.2. Incrementality Testing Platform

**Проблема:** Attribution shows correlation, not causation. Was ad truly incremental or would user convert anyway?

**Solution: Built-in Incrementality Testing**

**Features:**
- **Ghost Bid Testing:**
  - Randomly withhold ads от control group
  - Measure conversion rate: Exposed vs Control
  - True incremental lift = difference
- **Geo-Lift Tests:**
  - Run campaign в test geos
  - Compare to control geos
  - Account для seasonality, trends
- **PSA (Public Service Announcement) Method:**
  - Replace ads с PSAs для control group
  - Measure conversion difference
- **Automated Test Design:**
  - Sample size calculator
  - Statistical power analysis
  - Duration recommendations
- **Results Analysis:**
  - Statistical significance testing
  - Confidence intervals
  - Incrementality % и absolute numbers
- **Integration:**
  - Results feed back into attribution model
  - Adjust attribution weights based на incrementality

**Why это важно:**
- Доказывает истинный value маркетинга
- Оптимизирует budget allocation
- Combats attribution inflation
- Industry-leading (большинство MMPs не имеют этого)

#### 3.5.3. Creative Analytics

**Проблема:** Marketers знают which campaign wins, но не why.

**Solution: Creative-Level Attribution & Analysis**

**Features:**
- **Creative Fingerprinting:**
  - Analyze ad creative (image/video)
  - Extract features: Colors, objects, text, faces, composition
  - Technology: Computer Vision (YOLOv8, CLIP)
- **Creative Performance:**
  - Performance metrics per creative asset
  - A/B testing creatives automatically
- **Creative Insights:**
  - "Creatives с people perform 23% better"
  - "Red buttons have 15% higher CTR"
  - "Landscape format outperforms square by 31%"
- **Competitor Creative Analysis:**
  - Track competitor ads (via integrations)
  - Benchmark your creatives
  - Trend identification
- **Creative Recommendations:**
  - AI suggests creative elements to test
  - Generate variations automatically (future: AI creative generation)

#### 3.5.4. Unified Reporting Across Channels

**Проблема:** Data silos. Mobile attribution ≠ web analytics ≠ CTV reporting.

**Solution: Single Source of Truth**

**Features:**
- **Cross-Platform Attribution:**
  - Mobile app + Mobile web + Desktop web + CTV + OTT
  - Unified user journey
  - Consistent definitions (session, conversion, etc.)
- **Omnichannel Dashboards:**
  - See all channels в one view
  - Compare apples-to-apples
  - Drill down by platform
- **Unified Cost Tracking:**
  - Import costs from all sources
  - Blended ROAS across channels
  - Budget allocation recommendations
- **Cross-Channel Funnels:**
  - Awareness (CTV) → Consideration (Web) → Conversion (App)
  - Visualize multi-channel paths
  - Attribution credit distributed fairly

#### 3.5.5. Privacy-Safe Audiences

**Проблема:** Retargeting audiences требует tracking, который privacy-intrusive.

**Solution: Privacy-Preserving Audience Building**

**Techniques:**
- **Cohort-Based Targeting:**
  - Group users into cohorts (не individual IDs)
  - Example: "High-LTV gamers in US aged 18-24"
  - Share cohort to ad networks, не individual users
- **Differential Privacy:**
  - Add noise к audience segments
  - Prevents individual re-identification
  - Maintains statistical utility
- **Federated Learning:**
  - Train lookalike models без sharing user data
  - Collaborate с ad networks privately
- **On-Device Targeting (Future):**
  - ML models run на device
  - No data leaves device
  - Targeting happens locally

---

### 3.6. Monetization Model (Eliminating Conflict of Interest)

#### 3.6.1. Transparent Pricing

**Принцип:** Fraud detection should INCREASE our revenue, not decrease it.

**Pricing Tiers:**

**1. Free Tier (Freemium):**
- **Limits:**
  - Up to 10K monthly active users (MAU)
  - 100K events/month
  - 30-day data retention
  - Basic attribution
  - Community support
- **Purpose:** Startups, testing, small apps
- **Monetization:** Upsell to paid

**2. Growth Tier:**
- **Price:** $299/month
- **Includes:**
  - Up to 100K MAU
  - 5M events/month
  - 1-year data retention
  - Multi-touch attribution
  - Fraud detection (basic)
  - Email support
  - 3 integrations
- **Overage:** $5 per 10K MAU, $10 per 1M events

**3. Professional Tier:**
- **Price:** $999/month
- **Includes:**
  - Up to 500K MAU
  - 50M events/month
  - 2-year data retention
  - Advanced fraud detection
  - Incrementality testing
  - Creative analytics
  - Priority support (SLA)
  - 10 integrations
  - API access
- **Overage:** $3 per 10K MAU, $5 per 1M events

**4. Enterprise Tier:**
- **Price:** Custom (starting $5K/month)
- **Includes:**
  - Unlimited MAU
  - Unlimited events
  - Unlimited data retention
  - Dedicated fraud analyst
  - Custom ML models
  - White-glove onboarding
  - Dedicated account manager
  - 24/7 support
  - Unlimited integrations
  - SLA guarantees (99.95%)
  - Regional data residency
  - Custom contracts
- **Pricing Model:** Volume discounts, annual contracts

**Fraud Detection Monetization:**

**Option A: Included в Attribution Pricing**
- All tiers include fraud detection
- Higher tiers get advanced features
- No conflict: Better fraud detection → higher customer retention → more upgrades

**Option B: Separate Fraud Prevention Service**
- **Price:** % от prevented fraud spend (e.g., 10%), capped
- **Example:** Customer prevents $100K fraud spend → pays $10K max
- **Incentive Alignment:** More fraud detected = more value = more revenue
- **Transparency:** Public fraud stats per customer (anonymized)

**Preferred Model:** Option A (simpler, cleaner)

#### 3.6.2. Revenue Streams

**Primary:**
- SaaS subscriptions (attribution platform)

**Secondary:**
- **API Overages:** Beyond plan limits
- **Data Exports:** Extra charges для excessive exports
- **Custom Development:** Bespoke features для enterprise
- **Training & Consulting:** Onboarding, best practices
- **Certification Program:** Paid courses для advertisers

**Future:**
- **Data Clean Rooms:** Privacy-safe data collaboration
- **Marketplace:** Commission на third-party integrations
- **Predictive Audiences:** Sell lookalike models (privacy-safe)

---

### 3.7. Go-to-Market Strategy

#### 3.7.1. Target Customers

**Phase 1 (Year 1): Early Adopters**
- **Segment:** Mid-sized app developers (100K-1M MAU)
- **Verticals:** Gaming, fintech, e-commerce, health/fitness
- **Geographies:** US, EU, APAC (English-speaking)
- **Pain Points:**
  - Frustrated с incumbent pricing
  - Need better fraud protection
  - Want transparency
  - Seeking incrementality testing
- **Acquisition:**
  - Content marketing (SEO, blog)
  - Product Hunt launch
  - Industry conferences (MAU Vegas, App Growth Summit)
  - Referral program
  - Free tier → paid conversion

**Phase 2 (Year 2-3): Growth**
- **Segment:** Larger apps (1M-10M MAU) + agencies
- **Expansion:** LATAM, Middle East, Southeast Asia
- **Acquisition:**
  - Direct sales team
  - Enterprise partnerships
  - Agency partnerships
  - Case studies & testimonials
  - Webinars

**Phase 3 (Year 4-5): Enterprise**
- **Segment:** Fortune 500 brands, mega-apps (10M+ MAU)
- **Acquisition:**
  - Enterprise sales (C-level relationships)
  - RFPs
  - Strategic partnerships (AWS, Google Cloud)
  - Industry awards & recognition

#### 3.7.2. Competitive Positioning

**Unique Value Propositions:**

1. **Zero Conflict Fraud Detection:** "The only MMP где fraud detection увеличивает наш revenue, не уменьшает"
2. **Open Core:** "Transparent algorithms, open source где possible"
3. **Unified Platform:** "Mobile + Web + CTV в одной системе"
4. **Incrementality Native:** "Prove true value, не just correlation"
5. **Privacy Leader:** "GDPR/CCPA compliant by design, не afterthought"
6. **Future-Proof:** "Multi-cloud, language-agnostic, designed для 10 years"
7. **Fair Pricing:** "Transparent, predictable, no hidden costs"

**Messaging:**
- **Against AppsFlyer:** "Better fraud detection, lower cost, full transparency"
- **Against Adjust:** "Open source core, no vendor lock-in, unified web+mobile"
- **Against Branch:** "Deep linking + attribution, не one or the other"
- **Against Kochava:** "Simpler UX, modern tech stack, faster time-to-value"
- **Against Singular:** "Beyond ROI — полная картина с incrementality"

#### 3.7.3. Marketing & Sales

**Content Strategy:**
- **Blog:** Technical deep dives, industry insights, best practices
- **Documentation:** World-class docs (лучше чем у конкурентов)
- **Case Studies:** Customer success stories с metrics
- **Whitepapers:** Fraud detection, privacy, attribution models
- **Webinars:** Weekly educational sessions
- **Podcast:** Mobile marketing interviews

**Developer Relations:**
- **GitHub Presence:** Open source SDKs, tools, samples
- **Stack Overflow:** Active participation
- **Discord/Slack Community:** User community
- **Hackathons:** Sponsor events
- **University Program:** Free для students/researchers

**Partnerships:**
- **Technology Partners:** AWS, GCP, Azure, MongoDB, Snowflake
- **Agency Partners:** Co-selling
- **Ad Networks:** Fast-track integration program
- **Industry Bodies:** Membership в IAB, MMA

---

### 3.8. Development Roadmap

#### 3.8.1. MVP (Months 1-6)

**Core Features:**
- ✅ Basic attribution engine (deterministic + probabilistic)
- ✅ SDK (iOS, Android)
- ✅ Dashboard (attribution reports)
- ✅ Fraud detection (rule-based)
- ✅ 100 ad network integrations
- ✅ REST API
- ✅ PostgreSQL/TimescaleDB data layer

**Team:**
- 2 Backend Engineers (Go/Rust)
- 1 Mobile Engineer (iOS + Android)
- 1 Frontend Engineer (React)
- 1 DevOps Engineer
- 1 Data Scientist (fraud)
- 1 Product Manager
- 1 Designer

**Tech Debt Acceptable:** Focus on speed to market

#### 3.8.2. V1.0 (Months 7-12)

**Enhanced Features:**
- ✅ Multi-touch attribution
- ✅ ML-based fraud detection
- ✅ 500 ad network integrations
- ✅ Web SDK + web attribution
- ✅ Deep linking
- ✅ Funnel analysis
- ✅ Cohort analysis
- ✅ LTV prediction
- ✅ Data warehouse exports
- ✅ GraphQL API
- ✅ Microservices refactoring
- ✅ Kubernetes deployment

**Team Expansion:** +5 engineers, +1 data scientist

#### 3.8.3. V2.0 (Year 2)

**Advanced Features:**
- ✅ Incrementality testing platform
- ✅ Creative analytics
- ✅ Cross-device identity graph
- ✅ Advanced ML fraud models
- ✅ Real-time OLAP (ClickHouse)
- ✅ 2,000 ad network integrations
- ✅ CTV/OTT attribution
- ✅ Multi-region deployment (3 regions)
- ✅ Privacy-safe audiences
- ✅ Natural language querying

**Team:** 30+ people

#### 3.8.4. V3.0+ (Year 3-5)

**Innovative Features:**
- ✅ Federated learning для fraud
- ✅ On-device ML
- ✅ Data clean rooms
- ✅ IoT device attribution
- ✅ Wearables support
- ✅ AR/VR attribution
- ✅ 5,000+ integrations
- ✅ Global edge network (10+ regions)
- ✅ Predictive budget optimization
- ✅ Auto-pilot campaign management
- ✅ White-label solutions

---

### 3.9. Technical Debt Management

#### 3.9.1. Code Quality Standards

**Mandatory:**
- **Testing:** 80%+ code coverage
- **Linting:** Automated (golangci-lint, clippy, eslint)
- **Code Reviews:** 2 approvals required
- **Documentation:** Every public API documented
- **Type Safety:** Strict typing (TypeScript, Rust)

**Continuous Improvement:**
- **Refactoring Sprints:** 20% time для tech debt
- **Performance Budget:** Regression tests
- **Security Scans:** Weekly automated scans
- **Dependency Updates:** Monthly updates
- **Architecture Reviews:** Quarterly

#### 3.9.2. Language & Framework Flexibility

**Philosophy: Избегать mono-language trap**

**Критерий выбора языка:**
- **Performance-critical:** Rust (attribution engine, fraud real-time)
- **Backend services:** Go (большинство microservices)
- **Data processing:** Scala/Python (Spark jobs, ML)
- **Frontend:** TypeScript (React)
- **Scripting:** Python (automation, tools)

**Framework Upgrades:**
- **Избегать framework lock-in:** Minimal framework usage
- **Prefer libraries over frameworks:** Композиция vs наследование
- **Abstraction layers:** Изолировать external dependencies
- **Migration paths:** Plan для framework changes

**Database Flexibility:**
- **Avoid ORM lock-in:** Use query builders или raw SQL
- **Standard interfaces:** SQL, gRPC, REST
- **Multi-database support:** Not dependent on one DB
- **Data layer abstraction:** Repository pattern

#### 3.9.3. Cloud Agnostic Architecture

**Избегать vendor lock-in:**

**Kubernetes as abstraction:**
- Runs на AWS, GCP, Azure, on-prem
- Standard K8s APIs
- No cloud-specific services в core

**Managed services alternatives:**
- AWS RDS → CockroachDB (self-hosted или managed)
- AWS S3 → MinIO (S3-compatible, self-hosted)
- AWS Lambda → Knative (K8s serverless)
- AWS SQS → Kafka/RabbitMQ

**Infrastructure as Code:**
- **Terraform:** Cloud-agnostic provisioning
- **Helm Charts:** K8s deployments
- **GitOps:** ArgoCD для any K8s cluster

**Multi-Cloud Strategy:**
- **Primary:** AWS (launch)
- **Secondary:** GCP (Year 2)
- **Tertiary:** Azure (Year 3)
- **Hybrid:** On-prem для enterprise customers

---

## ЧАСТЬ 4: IMPLEMENTATION PLAN
## PART 4: ПЛАН ВНЕДРЕНИЯ

### 4.1. Technology Stack Summary

**Client SDKs:**
- iOS: Swift
- Android: Kotlin
- React Native: TypeScript
- Flutter: Dart
- Unity: C#
- Web: TypeScript

**Backend Services:**
- Ingestion: Go / Rust
- Attribution Engine: Rust + Python
- Fraud Detection: Python (ML) + Rust (runtime)
- Analytics: Scala (Spark)
- Reporting: Node.js (TypeScript)
- Integration: Go

**Data Layer:**
- Hot DB: CockroachDB / YugabyteDB
- Time-Series: TimescaleDB
- OLAP: ClickHouse + Druid
- Cache: Redis Cluster
- Graph: Neo4j
- Object Storage: MinIO / S3

**Message Queue:**
- Apache Kafka

**Stream Processing:**
- Apache Flink

**Orchestration:**
- Kubernetes
- Service Mesh: Istio
- GitOps: ArgoCD

**Observability:**
- Metrics: Prometheus + Thanos
- Logs: Loki
- Traces: Tempo
- Dashboards: Grafana

**ML/AI:**
- Training: PyTorch
- Serving: ONNX Runtime
- Feature Store: Feast
- Experiment Tracking: MLflow

**Frontend:**
- Framework: Next.js (React)
- State: Zustand
- Visualization: D3.js, ECharts

**Infrastructure:**
- IaC: Terraform
- CI/CD: GitHub Actions / GitLab CI
- Container Registry: Harbor

---

### 4.2. Security Architecture

#### 4.2.1. Zero Trust Security Model

**Principles:**
- Never trust, always verify
- Assume breach
- Verify explicitly
- Least privilege access
- Microsegmentation

**Implementation:**
- **mTLS Everywhere:** Service-to-service authentication
- **Identity Management:** OIDC/OAuth 2.0
- **Service Mesh:** Istio для policy enforcement
- **Network Policies:** Kubernetes NetworkPolicies
- **Secret Management:** HashiCorp Vault
- **Certificate Rotation:** Automated via cert-manager

#### 4.2.2. API Security

**Authentication:**
- API Keys для simple use cases
- OAuth 2.0 для user-facing apps
- JWT tokens с short expiry
- Refresh tokens с rotation

**Authorization:**
- RBAC (Role-Based Access Control)
- Attribute-Based Access Control (ABAC) для complex rules
- Scope-based permissions

**Rate Limiting:**
- Per-user limits
- Per-IP limits
- Tiered limits by plan
- Burst allowance
- Graceful degradation

**Input Validation:**
- Schema validation (JSON Schema)
- SQL injection prevention
- XSS prevention
- CSRF tokens

**DDoS Protection:**
- CloudFlare / AWS Shield
- Rate limiting at edge
- CAPTCHA для suspicious traffic

#### 4.2.3. Data Security

**Encryption:**
- At-rest: AES-256
- In-transit: TLS 1.3
- Database-level encryption
- Application-level encryption для sensitive fields

**Access Control:**
- Database user per service
- Read replicas для reporting (no write access)
- Audit logs для all data access
- Data masking в non-prod environments

**Secrets Management:**
- HashiCorp Vault
- No secrets в code/config
- Rotation policies
- Emergency break-glass procedures

#### 4.2.4. Compliance & Auditing

**Audit Trails:**
- Who accessed what, when
- All API calls logged
- Database queries logged (sensitive tables)
- Configuration changes logged
- Admin actions logged

**Compliance Monitoring:**
- Automated compliance checks
- Policy violations alerts
- Regular audits (quarterly)
- Penetration testing (quarterly)
- Bug bounty program

**Incident Response:**
- Incident response plan documented
- On-call rotation
- Runbooks для common scenarios
- Post-mortem process
- Public status page

---

### 4.3. Organizational Structure

#### 4.3.1. Team Structure (5-Year Plan)

**Year 1 (Startup Phase):**
- **Engineering:** 10 people
  - 3 Backend
  - 2 Mobile (iOS + Android)
  - 2 Frontend
  - 1 DevOps
  - 2 Data Scientists (fraud + analytics)
- **Product:** 2 people (PM + Designer)
- **Operations:** 1 (Customer Success)
- **Leadership:** Founder/CEO + CTO
- **Total:** ~15 people

**Year 2 (Growth Phase):**
- **Engineering:** 30 people
  - Backend team: 10
  - Mobile team: 4
  - Frontend team: 4
  - Data team: 6 (data engineers + data scientists)
  - DevOps/SRE: 4
  - QA: 2
- **Product:** 5 (PMs + designers)
- **Sales & Marketing:** 8
- **Customer Success:** 4
- **Leadership:** +CFO, +VP Engineering
- **Total:** ~50 people

**Year 3-5 (Scale Phase):**
- **Engineering:** 80+
- **Product:** 12
- **Sales & Marketing:** 25
- **Customer Success:** 15
- **Operations:** 10
- **Leadership:** Full C-suite
- **Total:** 150+ people

#### 4.3.2. Culture & Values

**Engineering Culture:**
- **Ownership:** Engineers own services end-to-end
- **On-call:** Everyone participates (even seniors)
- **Blameless Post-Mortems:** Learn from failures
- **Continuous Learning:** Conference budgets, courses
- **Open Source:** Contribute back to community
- **Work-Life Balance:** No hero culture, sustainable pace

**Company Values:**
- **Truth First:** Transparency над profit
- **Customer Obsession:** User needs drive decisions
- **Innovation:** Embrace experimentation
- **Diversity:** Inclusive hiring и culture
- **Sustainability:** Long-term thinking

---

### 4.4. Risk Analysis & Mitigation

#### 4.4.1. Technical Risks

**Risk 1: Scalability Bottleneck**
- **Probability:** Medium
- **Impact:** High
- **Mitigation:**
  - Over-provision capacity (3x buffer)
  - Load testing vanaf day 1
  - Chaos engineering
  - Multi-region early

**Risk 2: Data Loss**
- **Probability:** Low
- **Impact:** Critical
- **Mitigation:**
  - Continuous backups
  - Cross-region replication
  - Regular restore tests
  - Immutable backups

**Risk 3: Security Breach**
- **Probability:** Medium
- **Impact:** Critical
- **Mitigation:**
  - Security-first architecture
  - Regular penetration testing
  - Bug bounty program
  - Incident response plan
  - Cyber insurance

**Risk 4: Technology Obsolescence**
- **Probability:** Medium (5-10 years)
- **Impact:** Medium
- **Mitigation:**
  - Polyglot architecture
  - Abstraction layers
  - Modular design
  - Regular tech reviews
  - Refactoring budget

#### 4.4.2. Business Risks

**Risk 1: Competitive Response**
- **Threat:** Incumbents (AppsFlyer, Adjust) могут copy features
- **Mitigation:**
  - Speed to market
  - Patent key innovations
  - Brand differentiation (transparency)
  - Customer lock-in через superior UX

**Risk 2: Market Timing**
- **Threat:** Privacy regulations могут kill attribution industry
- **Mitigation:**
  - Privacy-first approach
  - Alternative solutions (incrementality, MMM)
  - Diversify revenue streams
  - Pivot capability

**Risk 3: Customer Concentration**
- **Threat:** Over-reliance на few large customers
- **Mitigation:**
  - Diversified customer base
  - No single customer >20% revenue
  - Long-term contracts
  - Land-and-expand strategy

**Risk 4: Funding**
- **Threat:** Running out of money before PMF
- **Mitigation:**
  - Lean startup approach
  - Revenue early (freemium → paid)
  - VC funding (Series A after traction)
  - Bootstrap friendly (low burn rate)

#### 4.4.3. Operational Risks

**Risk 1: Key Person Dependency**
- **Threat:** Loss of critical team members
- **Mitigation:**
  - Documentation (runbooks, architecture docs)
  - Knowledge sharing (pair programming)
  - Cross-training
  - Competitive compensation

**Risk 2: Service Outage**
- **Probability:** Medium
- **Impact:** High
- **Mitigation:**
  - 99.95% SLA with penalties
  - Redundancy everywhere
  - Auto-failover
  - Status page communication
  - Incident management process

---

## ЧАСТЬ 5: SUCCESS METRICS & KPIs
## PART 5: МЕТРИКИ УСПЕХА

### 5.1. Product Metrics

**Attribution Accuracy:**
- **Target:** >95% probabilistic accuracy
- **Measurement:** Ground truth comparison tests

**Fraud Detection Efficacy:**
- **Target:** <5% fraud rate
- **Measurement:** Third-party audits quarterly

**Performance:**
- **Attribution Latency:** <50ms (p99 deterministic)
- **Dashboard Load Time:** <2s (p95)
- **API Response Time:** <100ms (p95)

**Availability:**
- **Uptime:** 99.95%
- **Measurement:** Uptime monitors, incident tracking

**Data Quality:**
- **Event Loss Rate:** <0.1%
- **Attribution Match Rate:** >90%

### 5.2. Business Metrics

**Customer Acquisition:**
- **Year 1:** 100 paying customers
- **Year 2:** 500 paying customers
- **Year 3:** 2,000 paying customers

**Revenue:**
- **Year 1:** $500K ARR
- **Year 2:** $5M ARR
- **Year 3:** $25M ARR

**Retention:**
- **Net Revenue Retention:** >120%
- **Logo Retention:** >85%
- **Churn Rate:** <15% annually

**Growth:**
- **MoM Growth:** 15%+ (first 2 years)
- **YoY Growth:** 3x (Year 1-2), 2x (Year 2-3)

**Unit Economics:**
- **CAC Payback:** <12 months
- **LTV/CAC Ratio:** >3x
- **Gross Margin:** >80%

**Customer Satisfaction:**
- **NPS (Net Promoter Score):** >50
- **Customer Satisfaction (CSAT):** >4.5/5
- **Support Response Time:** <2 hours (business hours)

### 5.3. Technical Metrics

**Code Quality:**
- **Test Coverage:** >80%
- **Bug Escape Rate:** <2% to production
- **Mean Time to Recovery (MTTR):** <30 minutes

**Development Velocity:**
- **Deployment Frequency:** Daily (after MVP)
- **Lead Time:** <1 day (code commit to production)
- **Change Failure Rate:** <5%

**Infrastructure:**
- **Infrastructure Costs:** <20% of revenue
- **Cost per Event:** <$0.001

---

## ЗАКЛЮЧЕНИЕ / CONCLUSION

### RU: Резюме

Данное техническое задание описывает создание системы атрибуции трафика нового поколения, которая решает критические недостатки существующих решений:

**Ключевые инновации:**

1. **Нулевой конфликт интересов** в fraud detection — уникальная модель монетизации
2. **Unified platform** для mobile + web + CTV в одной системе
3. **Privacy-first architecture** с GDPR/CCPA compliance с первого дня
4. **Incrementality testing** встроен natively
5. **Open core** подход с transparent algorithms
6. **Future-proof architecture** — polyglot, multi-cloud, microservices на 10+ лет
7. **ML-powered fraud detection** с >95% accuracy и collaborative intelligence
8. **Real-time everything** — sub-100ms attribution latency
9. **Creative analytics** и AI-powered insights
10. **Fair pricing** без vendor lock-in

**Технологический стек** выбран с учетом:
- Performance (Rust, Go)
- Scalability (Kubernetes, Kafka, distributed DBs)
- Flexibility (polyglot, cloud-agnostic)
- Longevity (proven technologies + emerging standards)
- Developer experience (modern tooling)

**Архитектура** спроектирована для:
- Horizontal scaling до billions events/day
- Multi-region deployment
- Zero-downtime deployments
- Disaster recovery
- Security (Zero Trust model)

**Go-to-market** стратегия фокусируется на:
- Differentiation через transparency и fraud protection
- Developer-friendly с free tier
- Land-and-expand с SMB → Enterprise
- Community building и open source

**Roadmap:**
- **MVP:** 6 месяцев
- **V1.0:** 12 месяцев (PMF)
- **V2.0:** Year 2 (scale)
- **V3.0+:** Year 3-5 (market leader)

Система спроектирована не просто для конкуренции с AppsFlyer, Adjust и другими, но для создания новой категории — **Transparent Attribution Platform** — где интересы platform aligned с customer success, а не конфликтуют с ними.

---

### EN: Summary

This technical specification describes the creation of a next-generation traffic attribution system that solves critical shortcomings of existing solutions:

**Key Innovations:**

1. **Zero conflict of interest** in fraud detection — unique monetization model
2. **Unified platform** for mobile + web + CTV in one system
3. **Privacy-first architecture** with GDPR/CCPA compliance from day one
4. **Incrementality testing** built-in natively
5. **Open core** approach with transparent algorithms
6. **Future-proof architecture** — polyglot, multi-cloud, microservices for 10+ years
7. **ML-powered fraud detection** with >95% accuracy and collaborative intelligence
8. **Real-time everything** — sub-100ms attribution latency
9. **Creative analytics** and AI-powered insights
10. **Fair pricing** without vendor lock-in

**Technology stack** chosen considering:
- Performance (Rust, Go)
- Scalability (Kubernetes, Kafka, distributed DBs)
- Flexibility (polyglot, cloud-agnostic)
- Longevity (proven technologies + emerging standards)
- Developer experience (modern tooling)

**Architecture** designed for:
- Horizontal scaling to billions events/day
- Multi-region deployment
- Zero-downtime deployments
- Disaster recovery
- Security (Zero Trust model)

**Go-to-market** strategy focuses on:
- Differentiation through transparency and fraud protection
- Developer-friendly with free tier
- Land-and-expand from SMB → Enterprise
- Community building and open source

**Roadmap:**
- **MVP:** 6 months
- **V1.0:** 12 months (PMF)
- **V2.0:** Year 2 (scale)
- **V3.0+:** Year 3-5 (market leader)

The system is designed not just to compete with AppsFlyer, Adjust and others, but to create a new category — **Transparent Attribution Platform** — where platform interests are aligned with customer success rather than conflicting with them.

---

## ПРИЛОЖЕНИЯ / APPENDICES

### A. Glossary / Глоссарий

**MMP** — Mobile Measurement Partner (платформа мобильной атрибуции)

**Attribution** — Процесс определения, какой маркетинговый touchpoint привел к конверсии

**Deterministic Attribution** — Точное matching через device IDs (IDFA, GAID)

**Probabilistic Attribution** — Статистическое matching через IP, User Agent и другие signals

**Fraud** — Мошеннические действия для получения attribution credit без реальной value

**IDFA** — IDentifier For Advertisers (iOS)

**GAID** — Google Advertising ID (Android)

**SKAdNetwork** — Apple's privacy-focused attribution framework (iOS 14+)

**ATT** — App Tracking Transparency (iOS privacy framework)

**GDPR** — General Data Protection Regulation (EU privacy law)

**CCPA** — California Consumer Privacy Act (US privacy law)

**LTV** — Lifetime Value (пожизненная ценность пользователя)

**ROAS** — Return on Ad Spend (возврат на рекламные расходы)

**CAC** — Customer Acquisition Cost (стоимость привлечения клиента)

**Incrementality** — Измерение true causal impact маркетинга (не просто correlation)

**MMM** — Marketing Mix Modeling (статистический подход к measurement)

---

### B. References / Источники

Данный анализ основан на публичной информации от:
- AppsFlyer официальная документация и блог
- Adjust официальные источники
- Branch, Kochava, Singular documentation
- Industry research (MMA Global, IAB)
- Technical architecture blogs (Netflix, Uber, LinkedIn)
- Academic papers on attribution и fraud detection
- Cloud provider documentation (AWS, GCP, Azure)
- Open source project documentation

---

### C. Contact & Next Steps

**Для обсуждения реализации данного ТЗ:**

1. **Technical Deep Dive:** Детальное обсуждение архитектурных решений
2. **Business Case:** Финансовое моделирование и projections
3. **Prototype:** Proof-of-concept для core attribution engine
4. **Partnerships:** Обсуждение с potential partners (ad networks, cloud providers)
5. **Funding:** Preparation for seed/Series A

---

**Документ версия:** 1.0  
**Дата:** 20 октября 2025  
**Авторы:** На основе глубокого исследования рынка attribution platforms

---

*Этот документ представляет собой comprehensive technical specification для создания attribution platform следующего поколения. Он учитывает лучшие практики индустрии, устраняет критические недостатки существующих решений и закладывает фундамент для устойчивого роста на горизонте 5-10 лет.*