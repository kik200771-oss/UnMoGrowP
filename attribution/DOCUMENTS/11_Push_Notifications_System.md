# PUSH NOTIFICATIONS SYSTEM

**Родительский документ:** 07_Complete_Technical_Specification_v1.0.md

**Цель:** Интегрировать систему push-уведомлений в наш Attribution SDK с полной аналитикой и easy-to-use интерфейсом для создания рассылок

---

## EXECUTIVE SUMMARY

### Проблема

Текущие решения:
- **OneSignal, Firebase Messaging:** Отдельный SDK, отдельная панель, нет связи с attribution
- **Airship, Braze:** Дорогие ($5-20K/месяц), избыточная функциональность
- **Разрыв данных:** Push analytics отдельно от marketing analytics

### Наше решение

**Unified Push + Attribution Platform:**
- ✅ Push notifications встроены в Attribution SDK
- ✅ Единая панель: Push campaigns рядом с ad campaigns
- ✅ Автоматическая корреляция: Push → retention → revenue
- ✅ Умная сегментация: Based on LTV, behavior, attribution source
- ✅ A/B тестирование: Built-in для push campaigns

### Конкурентное преимущество

```yaml
OneSignal + AppsFlyer (текущее решение):
  - 2 SDK для интеграции
  - 2 панели управления
  - 2 счёта для оплаты
  - Стоимость: $10K (AppsFlyer) + $2K (OneSignal) = $12K/месяц
  - Нет связи между push и attribution данными
  - Ручная корреляция (если вообще делают)

Наша платформа:
  - 1 SDK (всё включено)
  - 1 панель (unified view)
  - 1 подписка
  - Стоимость: $10-15K/месяц (всё включено)
  - Автоматическая связь: Push → app opens → retention → revenue
  - Умная сегментация: По LTV, источнику установки, поведению
```

### Бизнес-ценность

```yaml
Для разработчиков:
  - Простая интеграция: 3 строки кода
  - Автоматическая регистрация push tokens
  - Delivery tracking из коробки
  - Deep links поддержка

Для маркетологов:
  - Создание campaigns в пару кликов
  - Visual editor для сообщений
  - Автоматическая сегментация по attribution данным
  - Real-time analytics

Для бизнеса:
  - Push → Retention: Quantify impact
  - ROI калькулятор: Сколько принесла каждая рассылка
  - Churn prevention: Auto-push для пользователей из churn prediction
  - Revenue attribution: Какие pushes привели к покупкам
```

---

## 1. АРХИТЕКТУРА СИСТЕМЫ

### 1.1. Общая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Attribution SDK (Unified)                     │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ Attribution  │  │ Performance  │  │ Push Module  │ │ │
│  │  │ Module       │  │ Module       │  │              │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │                                        ↑                 │ │
│  │                                        │                 │ │
│  │                             Register push token          │ │
│  │                             Handle notifications         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      Register token
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    OUR BACKEND                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Push Service (Go)                          │ │
│  │  - Store push tokens                                   │ │
│  │  - Manage subscriptions                                │ │
│  │  - Segment users                                       │ │
│  │  - Schedule campaigns                                  │ │
│  │  - Track delivery/opens                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Push Campaign Manager (Python + Celery)      │ │
│  │  - Execute campaigns                                   │ │
│  │  - A/B testing                                         │ │
│  │  - Personalization                                     │ │
│  │  - Rate limiting                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Database Layer                            │ │
│  │  ┌──────────────┐  ┌──────────────┐                   │ │
│  │  │ PostgreSQL   │  │ Redis        │                   │ │
│  │  │              │  │              │                   │ │
│  │  │ - Tokens     │  │ - Campaigns  │                   │ │
│  │  │ - Campaigns  │  │ - Queue      │                   │ │
│  │  │ - Analytics  │  │ - Throttling │                   │ │
│  │  └──────────────┘  └──────────────┘                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Send push via
                            ↓
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Apple APNs   │    │ Firebase FCM │    │ Huawei HMS   │
│              │    │              │    │              │
│ iOS devices  │    │ Android      │    │ Huawei       │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ↓
                    Deliver to device
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    USER DEVICE                               │
│  - Notification shown                                        │
│  - User taps → App opens                                     │
│  - SDK tracks: delivery, open, conversion                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      Analytics
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    WEB DASHBOARD (Svelte)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Push Campaigns Dashboard                              │ │
│  │  - Create campaigns (visual editor)                    │ │
│  │  - Segment users (by attribution, behavior, LTV)       │ │
│  │  - Schedule sends                                      │ │
│  │  - Track analytics (sent, delivered, opened, converted)│ │
│  │  - A/B testing                                         │ │
│  │  - ROI calculation                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2. SDK Integration (Простота!)

**iOS (Swift):**

```swift
import AttributionSDK

// AppDelegate
func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
) -> Bool {

    // Инициализация SDK (одна строка!)
    AttributionSDK.initialize(apiKey: "your_api_key")

    // Push notifications автоматически настраиваются!
    // SDK сам:
    // - Регистрирует для push notifications
    // - Получает push token
    // - Отправляет token на сервер
    // - Настраивает обработчики notifications

    return true
}

// Опционально: Кастомная обработка push (если нужно)
AttributionSDK.pushNotifications.onNotificationReceived { notification in
    print("Received: \(notification.title)")

    // Custom logic
}

AttributionSDK.pushNotifications.onNotificationOpened { notification in
    print("Opened: \(notification.title)")

    // Navigate to specific screen based on deep link
    if let deepLink = notification.deepLink {
        Router.navigate(to: deepLink)
    }
}

// Всё! Push notifications работают! 🎉
```

**Android (Kotlin):**

```kotlin
import com.attribution.sdk.AttributionSDK

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // Инициализация SDK (одна строка!)
        AttributionSDK.initialize(
            context = this,
            apiKey = "your_api_key"
        )

        // Push notifications автоматически настраиваются!
        // SDK сам всё делает!
    }
}

// Опционально: Кастомная обработка (если нужно)
AttributionSDK.pushNotifications.onNotificationReceived { notification ->
    Log.d("Push", "Received: ${notification.title}")
}

AttributionSDK.pushNotifications.onNotificationOpened { notification ->
    Log.d("Push", "Opened: ${notification.title}")

    // Navigate based on deep link
    notification.deepLink?.let { deepLink ->
        Router.navigate(deepLink)
    }
}

// Готово! Push работают! 🎉
```

**Вот и всё!** Никаких сложных настроек, никаких дополнительных SDK, никаких headaches!

---

## 2. ФУНКЦИОНАЛЬНОСТЬ PUSH NOTIFICATIONS

### 2.1. Типы уведомлений

#### 2.1.1. Standard Push Notification

```yaml
Структура:
  - Title: Заголовок (max 50 символов)
  - Body: Текст сообщения (max 150 символов)
  - Icon: Иконка приложения (auto)
  - Badge: Число на иконке (iOS)
  - Sound: Звук (default или custom)
  - Deep Link: URL для перехода после клика

Пример:
  Title: "🎉 Special Offer!"
  Body: "Get 50% off on all items. Limited time!"
  Deep Link: "myapp://products/sale"
  Sound: "default"
  Badge: 1
```

#### 2.1.2. Rich Push Notification

```yaml
С дополнительным контентом:
  - Image: Большая картинка (1024×512 px)
  - Video: Короткое видео (max 50 MB)
  - GIF: Анимированная картинка
  - Actions: Кнопки (до 3 шт)

Пример:
  Title: "New Sneakers Arrived!"
  Body: "Check out the latest collection"
  Image: "https://cdn.shop.com/sneakers.jpg"
  Actions:
    - Button 1: "Shop Now" → deep link
    - Button 2: "Save for Later" → add to wishlist
    - Button 3: "Dismiss"
```

#### 2.1.3. Silent Push (Background)

```yaml
Без уведомления пользователю:
  Используется для:
    - Обновления данных в фоне
    - Синхронизации
    - Предзагрузки контента

  Пример:
    App: E-commerce
    Задача: Обновить каталог товаров
    Silent push → App downloads новый catalog
    Когда user opens app → Контент уже ready!
```

#### 2.1.4. Персонализированные Push

```yaml
Dynamic content на основе данных пользователя:

  Template:
    "Hi {{first_name}}! You have {{cart_items}} items in cart."

  Для user 1:
    "Hi John! You have 3 items in cart."

  Для user 2:
    "Hi Sarah! You have 1 item in cart."

Плейсхолдеры:
  - {{first_name}}, {{last_name}}
  - {{cart_items}}, {{wishlist_count}}
  - {{last_purchase_date}}
  - {{predicted_ltv}}
  - {{favorite_category}}
  - И любые custom user properties!
```

### 2.2. Сегментация пользователей

```yaml
Встроенные сегменты (на основе attribution данных):

По источнику установки:
  - Пользователи из Facebook ads
  - Пользователи из Google ads
  - Organic installs
  - Specific campaign (e.g. "Summer Sale 2024")

По поведению:
  - Active users (last 7 days)
  - Inactive users (не открывали 7+ дней)
  - New users (installed <7 days ago)
  - Returning users (opened today)

По LTV (из нашей ML модели):
  - High LTV (predicted >$50)
  - Medium LTV ($10-50)
  - Low LTV (<$10)

По churn risk (из churn prediction):
  - High risk (>70% probability)
  - Medium risk (40-70%)
  - Low risk (<40%)

По платформе:
  - iOS only
  - Android only
  - Specific OS version (iOS 17+, Android 13+)

По гео:
  - Country (US, UK, Canada, etc.)
  - Region (California, New York, etc.)
  - City
  - Timezone (для оптимального времени отправки)

По engagement:
  - Power users (>10 sessions/week)
  - Regular users (3-10 sessions/week)
  - Casual users (<3 sessions/week)

По монетизации:
  - Paying users (made purchase)
  - Non-paying users
  - High spenders (>$100 total)
  - Recent purchasers (purchased last 7 days)

Кастомные сегменты:
  - Любая комбинация выше
  - Custom events (e.g. "completed_tutorial")
  - Custom user properties

  Пример:
    "iOS users from Facebook, High LTV, Last seen 3-7 days ago"
    → Perfect для re-engagement campaign!
```

### 2.3. Campaign Types

#### 2.3.1. One-Time Campaign (Разовая рассылка)

```yaml
Use case: Announcements, promotions, news

Настройки:
  - Target: Выбрать сегмент
  - Message: Title + Body + Image
  - Schedule: Сейчас или Later (specific date/time)
  - Timezone: User's local time или Fixed time

Пример:
  Campaign: "Black Friday Sale"
  Target: All active users
  Message: "🔥 Black Friday! 70% OFF everything!"
  Schedule: Nov 24, 2024 at 9:00 AM (user's timezone)
  Expected reach: 1.2M users
```

#### 2.3.2. Recurring Campaign (Повторяющаяся)

```yaml
Use case: Daily deals, weekly digests, reminders

Настройки:
  - Frequency: Daily, Weekly, Monthly
  - Day of week: Monday, Tuesday, etc.
  - Time: 10:00 AM (user's timezone)
  - Duration: Start date → End date

Пример:
  Campaign: "Daily Motivation Quote"
  Target: All users
  Frequency: Daily at 8:00 AM
  Duration: Ongoing (no end date)
```

#### 2.3.3. Triggered Campaign (Триггерная)

```yaml
Use case: Автоматическая реакция на события

Triggers:
  1. Event-based:
     - User completed tutorial → Welcome message
     - User added to cart → Reminder after 1 hour
     - User made purchase → Thank you + cross-sell

  2. Time-based:
     - 24 hours after install → Onboarding tips
     - 7 days inactive → Re-engagement offer
     - 30 days since last purchase → "We miss you!"

  3. Behavior-based:
     - User viewed product 3+ times → Price drop alert
     - User abandoned cart → 10% discount offer
     - User searched but no results → Notify when available

Пример:
  Trigger: Cart abandonment
  Condition: User added items but didn't checkout
  Delay: 1 hour after cart abandonment
  Message: "You left {{cart_items}} items! Complete purchase now and get 10% off."
  Target: Users who abandoned cart in last 24h
  Frequency limit: Max once per week (не спамить!)
```

#### 2.3.4. A/B Test Campaign

```yaml
Use case: Оптимизация messaging

Настройки:
  - Variants: 2-5 вариантов сообщений
  - Split: % пользователей на каждый вариант
  - Metric: Что оптимизируем (open rate, conversion, revenue)
  - Duration: Как долго тестируем
  - Auto-winner: Автоматически выбрать winner и отправить всем остальным

Пример:
  Goal: Увеличить open rate

  Variant A (50%):
    Title: "Special Offer Inside!"
    Body: "Check out our latest deals"

  Variant B (50%):
    Title: "🎁 You Got a Gift!"
    Body: "Open now to claim your reward"

  Results after 1000 sends each:
    Variant A: 12% open rate
    Variant B: 18% open rate (Winner! 🏆)

  Action: Send Variant B to remaining users
```

---

## 3. ANALYTICS & TRACKING

### 3.1. Метрики Push Notifications

#### 3.1.1. Delivery Metrics

```yaml
Sent:
  - Определение: Сколько push отправлено с нашего сервера
  - Формула: COUNT(push_sent)
  - Пример: 100,000 push sent

Delivered:
  - Определение: Сколько push доставлено на устройство
  - Подтверждение: APNs/FCM delivery receipt
  - Формула: COUNT(delivery_receipt)
  - Пример: 95,000 delivered (95% delivery rate)

Failed:
  - Определение: Не доставлено на устройство
  - Причины:
    - Invalid token (user uninstalled app)
    - Token expired
    - Device offline (>30 days)
    - Network error
  - Формула: Sent - Delivered
  - Пример: 5,000 failed (5%)

Delivery Rate:
  - Формула: (Delivered / Sent) × 100%
  - Target: >90% (excellent), >80% (good), <70% (poor)
  - Пример: 95%
```

#### 3.1.2. Engagement Metrics

```yaml
Received:
  - Определение: Push показан пользователю (notification appeared)
  - Note: Может быть < Delivered если:
    - User disabled notifications
    - Do Not Disturb mode
    - Notification dismissed by OS
  - Пример: 90,000 received

Opened (Clicked):
  - Определение: Пользователь кликнул на notification
  - Формула: COUNT(notification_opened)
  - Пример: 18,000 opened

Open Rate:
  - Формула: (Opened / Delivered) × 100%
  - Benchmarks:
    - Excellent: >10%
    - Good: 5-10%
    - Average: 2-5%
    - Poor: <2%
  - Пример: 18,000 / 95,000 = 18.9% (Excellent! 🎉)

Direct Open:
  - User кликнул на notification → App opened
  - Время: Within 1 hour of delivery
  - Пример: 16,000 (88% of opens)

Influenced Open:
  - User opened app within 24h after receiving push
  - Не прямой клик, но push напомнил
  - Пример: 12,000 additional opens

Time to Open:
  - Среднее время от delivery до open
  - Пример: Median = 8 minutes, P95 = 4 hours
```

#### 3.1.3. Conversion Metrics

```yaml
Conversions:
  - Определение: Пользователь выполнил целевое действие после push
  - Примеры целевых действий:
    - Made purchase
    - Completed level (gaming)
    - Added to cart
    - Watched video
    - Signed up for trial

  Временное окно:
    - Direct conversion: Within 1 hour of open
    - Attributed conversion: Within 24 hours

  Формула: COUNT(users who did target_event after opening push)

  Пример:
    Target event: Purchase
    Opens: 18,000
    Purchases within 24h: 1,800
    Conversion rate: 10%

Conversion Rate:
  - Формула: (Conversions / Opened) × 100%
  - Benchmarks (varies by industry):
    - E-commerce: 5-15% (purchase)
    - Gaming: 20-40% (level completion)
    - SaaS: 10-25% (trial signup)

Revenue:
  - Total revenue generated from conversions
  - Пример: 1,800 purchases × $35 avg = $63,000

Revenue per Recipient:
  - Формула: Total Revenue / Delivered
  - Пример: $63,000 / 95,000 = $0.66 per recipient

Revenue per Open:
  - Формула: Total Revenue / Opened
  - Пример: $63,000 / 18,000 = $3.50 per open

ROI (Return on Investment):
  - Cost: Campaign creation time + sending cost
  - Sending cost: $0.0005 per push (very cheap!)
  - Total cost: 100,000 × $0.0005 = $50
  - Revenue: $63,000
  - ROI: ($63,000 - $50) / $50 × 100% = 125,900% 🤯

  Push notifications = INSANE ROI!
```

#### 3.1.4. Retention Metrics

```yaml
D1 Retention Lift:
  - Сравнение: Users who received push vs control group
  - Пример:
    - Received push: 45% D1 retention
    - Control (no push): 38% D1 retention
    - Lift: +7 percentage points (+18% relative)

D7 Retention Lift:
  - Пример:
    - Received push: 28% D7 retention
    - Control: 22% D7 retention
    - Lift: +6 pp (+27% relative)

Churn Prevention:
  - Для "at-risk" users (churn prediction >70%)
  - Пример:
    - Sent re-engagement push to 10,000 at-risk users
    - 2,500 opened (25%)
    - 800 returned and stayed active (8%)
    - Prevented churn for 800 users
    - Value: 800 users × $25 LTV = $20,000 saved!
```

### 3.2. Advanced Analytics

#### 3.2.1. Cohort Analysis

```yaml
Push Cohorts:
  - Group users by push campaign received
  - Track retention over time

Пример:
  Campaign: "Week 1 Onboarding Tips"
  Cohort size: 50,000 new users

  Retention:
    D1: 48% (vs 42% without push → +6pp)
    D3: 35% (vs 28% → +7pp)
    D7: 25% (vs 18% → +7pp)
    D30: 12% (vs 8% → +4pp)

  Impact: Push significantly improved retention!
```

#### 3.2.2. Funnel Analysis

```yaml
Push → Open → Action funnel:

  Step 1: Sent (100%)
    ↓ 95%
  Step 2: Delivered (95%)
    ↓ 19% of delivered
  Step 3: Opened (18%)
    ↓ 55% of opens
  Step 4: Clicked CTA (10%)
    ↓ 90% of clicks
  Step 5: Conversion (9%)

Drop-off analysis:
  - Biggest drop: Delivered → Opened (81% drop)
    → Optimize: Better messaging, timing, personalization

  - Second drop: Opened → Click CTA (45% drop)
    → Optimize: Stronger CTA, clear value proposition
```

#### 3.2.3. Time-of-Day Analysis

```yaml
Optimal send time:
  - Test different times, measure open rates

Пример results:
  6 AM - 9 AM: 22% open rate (Morning commute 🚇)
  9 AM - 12 PM: 14% open rate (Work time 💼)
  12 PM - 2 PM: 18% open rate (Lunch break 🍽️)
  2 PM - 6 PM: 12% open rate (Afternoon work)
  6 PM - 9 PM: 25% open rate (Evening relax 📺) ← Best!
  9 PM - 12 AM: 16% open rate (Before sleep)
  12 AM - 6 AM: 5% open rate (Sleeping 😴)

Recommendation: Schedule for 6-9 PM user's local time
```

#### 3.2.4. Frequency Analysis

```yaml
Вопрос: Как часто можно отправлять push без раздражения?

Test: Vary frequency, measure:
  - Open rate (decreases with frequency?)
  - Opt-out rate (users disabling push)
  - Retention (annoying push → uninstall)

Типичные результаты:
  1 push/week:
    - Open rate: 25%
    - Opt-out: 1%
    - Retention: Baseline

  3 push/week:
    - Open rate: 18% (↓28%)
    - Opt-out: 3% (↑200%)
    - Retention: -2%

  Daily (7 push/week):
    - Open rate: 8% (↓68%)
    - Opt-out: 15% (↑1400%) 🚨
    - Retention: -8% (people uninstall!)

Recommendation:
  - Max 2-3 push/week для большинства apps
  - Дать user control (preferences)
  - High-value push (purchases, important updates) можно чаще
```

---

## 4. DASHBOARD & UI

### 4.1. Push Campaigns Dashboard

```yaml
Основные секции:

1. Campaigns Overview:
   - Active campaigns (currently running)
   - Scheduled campaigns (будущие)
   - Completed campaigns (past)
   - Draft campaigns (не завершённые)

2. Campaign List Table:
   Columns:
     - Campaign name
     - Status (Active, Scheduled, Completed, Draft)
     - Target segment (сколько users)
     - Sent / Delivered / Opened / Conversions
     - Open rate (%)
     - Conversion rate (%)
     - Revenue generated
     - ROI
     - Created date
     - Last sent

   Actions:
     - [View Analytics] - детальная аналитика
     - [Edit] - редактировать (if draft/scheduled)
     - [Duplicate] - создать копию
     - [Pause] - приостановить (if active)
     - [Delete] - удалить

3. Quick Stats Cards:
   - Total campaigns: 127
   - Total pushes sent (last 30 days): 5.2M
   - Average open rate: 16.5%
   - Total revenue (last 30 days): $480K
   - Average ROI: 2,400%

4. Performance Chart:
   - Line chart: Pushes sent over time (last 7/30/90 days)
   - Bar chart: Open rates by campaign
   - Pie chart: Revenue by campaign
```

**Визуализация (Svelte):**

```typescript
<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart } from 'chart.js';

  let campaigns = $state([]);
  let stats = $state({
    totalCampaigns: 0,
    pushes Sent: 0,
    avgOpenRate: 0,
    totalRevenue: 0
  });

  onMount(async () => {
    // Fetch campaigns
    const response = await fetch('/api/push/campaigns');
    campaigns = await response.json();

    // Fetch stats
    const statsRes = await fetch('/api/push/stats');
    stats = await statsRes.json();

    renderCharts();
  });
</script>

<div class="push-dashboard">
  <!-- Header -->
  <div class="header">
    <h1>Push Campaigns</h1>
    <button class="create-btn" onclick={() => navigate('/push/create')}>
      + Create Campaign
    </button>
  </div>

  <!-- Quick Stats -->
  <div class="stats-grid">
    <div class="stat-card">
      <h3>Total Campaigns</h3>
      <div class="stat-value">{stats.totalCampaigns}</div>
    </div>

    <div class="stat-card">
      <h3>Pushes Sent (30d)</h3>
      <div class="stat-value">{formatNumber(stats.pushesSent)}</div>
    </div>

    <div class="stat-card">
      <h3>Avg Open Rate</h3>
      <div class="stat-value">{stats.avgOpenRate}%</div>
    </div>

    <div class="stat-card">
      <h3>Revenue (30d)</h3>
      <div class="stat-value">${formatMoney(stats.totalRevenue)}</div>
    </div>
  </div>

  <!-- Campaigns Table -->
  <div class="campaigns-table">
    <table>
      <thead>
        <tr>
          <th>Campaign</th>
          <th>Status</th>
          <th>Target</th>
          <th>Sent</th>
          <th>Open Rate</th>
          <th>Conversions</th>
          <th>Revenue</th>
          <th>ROI</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each campaigns as campaign}
          <tr>
            <td>
              <div class="campaign-name">{campaign.name}</div>
              <div class="campaign-date">{formatDate(campaign.createdAt)}</div>
            </td>
            <td>
              <span class="status-badge {campaign.status}">
                {campaign.status}
              </span>
            </td>
            <td>{formatNumber(campaign.targetSize)} users</td>
            <td>{formatNumber(campaign.sent)}</td>
            <td>{campaign.openRate}%</td>
            <td>{formatNumber(campaign.conversions)}</td>
            <td>${formatMoney(campaign.revenue)}</td>
            <td>{campaign.roi}%</td>
            <td>
              <button onclick={() => viewAnalytics(campaign.id)}>
                View
              </button>
              <button onclick={() => editCampaign(campaign.id)}>
                Edit
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .push-dashboard {
    padding: 24px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .create-btn {
    background: #3b82f6;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }

  .stat-card {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .stat-value {
    font-size: 36px;
    font-weight: bold;
    margin-top: 8px;
  }

  .campaigns-table table {
    width: 100%;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  thead {
    background: #f3f4f6;
  }

  th {
    padding: 16px;
    text-align: left;
    font-weight: 600;
  }

  td {
    padding: 16px;
    border-top: 1px solid #e5e7eb;
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .status-badge.active {
    background: #dcfce7;
    color: #16a34a;
  }

  .status-badge.scheduled {
    background: #dbeafe;
    color: #2563eb;
  }

  .status-badge.completed {
    background: #f3f4f6;
    color: #6b7280;
  }
</style>
```

### 4.2. Campaign Creation Wizard

```yaml
Step 1: Basic Info
  - Campaign name
  - Campaign type (One-time, Recurring, Triggered)
  - Goal (Awareness, Engagement, Conversion, Retention)

Step 2: Target Audience
  - Visual segment builder
  - Pre-built segments (Active users, High LTV, At-risk, etc.)
  - Custom segments (drag & drop filters)
  - Estimated reach (real-time count)

  Пример UI:
    [Segment Builder]

    Include users who match ALL of:
      ┌─────────────────────────────────────┐
      │ Platform          [iOS ▼]           │
      │ Install source    [Facebook ads ▼]  │
      │ Predicted LTV     [> $30]           │
      │ Last active       [3-7 days ago ▼]  │
      │ + Add filter                        │
      └─────────────────────────────────────┘

    Estimated reach: ~45,000 users

    [Preview Audience] [Save as Preset]

Step 3: Message Composer
  - Visual editor (WYSIWYG)
  - Title (with character count: 50/50)
  - Body (with character count: 140/150)
  - Rich media (upload image/video)
  - Action buttons (optional)
  - Deep link URL
  - Personalization tags ({{first_name}}, {{cart_items}}, etc.)

  Live Preview:
    [iOS Preview]  [Android Preview]

    Shows exactly how notification will look on device

Step 4: Schedule & Frequency
  - Send now OR Schedule for later
  - Date picker + Time picker
  - Timezone: User's local time OR Fixed time
  - Frequency cap: Max X pushes per user per day/week
  - Expiry: Campaign ends after X days or on specific date

Step 5: A/B Testing (Optional)
  - Enable A/B testing
  - Number of variants (2-5)
  - Split traffic (% to each variant)
  - Test metric (Open rate, Conversion rate, Revenue)
  - Test duration (X days or X sends)
  - Auto-select winner

Step 6: Review & Send
  - Preview всех настроек
  - Estimated reach
  - Estimated cost ($0.0005 per send)
  - Confirm & Send OR Save as Draft
```

### 4.3. Campaign Analytics Page

```yaml
Sections:

1. Overview Cards:
   - Status (Active/Completed)
   - Sent: 100,000
   - Delivered: 95,000 (95%)
   - Opened: 18,000 (19%)
   - Conversions: 1,800 (10% of opens)
   - Revenue: $63,000
   - ROI: 125,900%

2. Performance Timeline:
   - Line chart: Sends/Delivered/Opened over time
   - Shows exactly when pushes were sent
   - Identifies peak open times

3. Funnel Visualization:
   - Visual funnel: Sent → Delivered → Opened → Converted
   - Drop-off rates at each step
   - Click to see details

4. Conversion Details:
   - Table of users who converted
   - Columns: User ID, Open time, Conversion time, Revenue
   - Export to CSV

5. Segment Performance:
   - Breakdown by user segments
   - Which segments had best open rates?
   - Which segments converted most?

   Пример:
     Segment: iOS users → 22% open rate
     Segment: Android users → 15% open rate
     Insight: iOS users more engaged!

6. Time Analysis:
   - Heatmap: Open rate by hour of day + day of week
   - Identifies optimal send times
   - Recommendation: "Best time is 7-9 PM on weekdays"

7. Device & Platform:
   - Breakdown: iOS (60%), Android (40%)
   - OS versions
   - Device models (iPhone 14, Samsung Galaxy, etc.)

8. Geographic Performance:
   - Map: Open rates by country
   - Table: Top countries by revenue
   - Timezone analysis

9. A/B Test Results (if applicable):
   - Comparison table: Variant A vs B vs C
   - Winner highlighted
   - Statistical significance
   - Recommendation

10. User Feedback:
    - Opt-out rate (users who disabled push after this campaign)
    - Uninstalls (did this campaign cause uninstalls?)
    - Complaints (if any)
```

---

## 5. IMPLEMENTATION DETAILS

### 5.1. SDK Architecture

```yaml
SDK Modules:

1. Push Token Manager:
   - Registers device for push notifications (APNs/FCM)
   - Obtains push token
   - Sends token to our backend
   - Handles token refresh
   - Tracks token lifecycle

2. Notification Handler:
   - Intercepts incoming notifications
   - Tracks delivery (notification received)
   - Handles user tap (notification opened)
   - Tracks conversions (user action after open)
   - Deep link routing

3. Local Storage:
   - Stores pending notifications
   - Queues tracking events (delivery, open, conversion)
   - Batches events for upload

4. Analytics Tracker:
   - Sends tracking events to backend
   - Delivery receipts
   - Open events (with timestamp)
   - Conversion events (with revenue)

5. Preferences Manager:
   - User notification preferences (if user can customize)
   - Opt-in/opt-out status
   - Frequency caps
```

### 5.2. Backend Services

```yaml
1. Push Token Service (Go):
   - Stores user tokens in database
   - Validates tokens
   - Handles token refresh
   - Cleans up invalid tokens
   - Scales: 10K req/sec (token registrations)

2. Campaign Manager (Python + Celery):
   - Creates campaigns
   - Manages scheduling
   - Executes campaigns (sends pushes)
   - Handles retries
   - Enforces frequency caps
   - A/B testing logic
   - Personalization (template rendering)

3. Push Delivery Service (Go):
   - Sends pushes to APNs/FCM/HMS
   - Batching (10K pushes per request)
   - Rate limiting (don't exceed provider limits)
   - Retry logic (exponential backoff)
   - Delivery tracking
   - Scales: 1M+ pushes/minute

4. Analytics Service (Flink):
   - Processes tracking events in real-time
   - Aggregates metrics (sent, delivered, opened, conversions)
   - Calculates rates (open rate, conversion rate)
   - Stores in TimescaleDB + ClickHouse
   - Powers dashboards

5. Segmentation Engine (Python):
   - Queries user database
   - Applies segment filters
   - Returns list of user tokens
   - Caches segments (Redis)
   - Re-evaluates on demand

6. A/B Testing Engine (Python):
   - Splits users into variants
   - Tracks performance per variant
   - Statistical significance testing
   - Auto-selects winner
```

### 5.3. Database Schema

```sql
-- Push Tokens Table
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    platform VARCHAR(10) NOT NULL, -- ios, android, huawei
    token TEXT NOT NULL,
    device_model VARCHAR(100),
    os_version VARCHAR(20),
    app_version VARCHAR(20),
    language VARCHAR(10),
    timezone VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    last_active TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_platform (platform),
    INDEX idx_active (is_active)
);

-- Campaigns Table
CREATE TABLE push_campaigns (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL, -- one_time, recurring, triggered
    status VARCHAR(20) NOT NULL, -- draft, scheduled, active, completed, paused

    -- Message
    title VARCHAR(100),
    body TEXT,
    image_url TEXT,
    deep_link TEXT,
    sound VARCHAR(50),
    badge INT,

    -- Targeting
    segment_id UUID, -- Pre-defined segment
    segment_filters JSONB, -- Custom filters
    target_size INT, -- Estimated reach

    -- Scheduling
    schedule_type VARCHAR(20), -- immediate, scheduled, recurring
    send_at TIMESTAMP, -- For scheduled
    timezone VARCHAR(50), -- user_local or fixed
    recurring_pattern VARCHAR(50), -- daily, weekly, monthly
    expires_at TIMESTAMP,

    -- A/B Testing
    is_ab_test BOOLEAN DEFAULT FALSE,
    ab_variants JSONB, -- Array of variants
    ab_metric VARCHAR(50), -- open_rate, conversion_rate, revenue

    -- Metadata
    created_by UUID,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    completed_at TIMESTAMP,

    INDEX idx_status (status),
    INDEX idx_send_at (send_at),
    INDEX idx_created_by (created_by)
);

-- Push Sends Table (каждая отправка)
CREATE TABLE push_sends (
    id UUID PRIMARY KEY,
    campaign_id UUID NOT NULL,
    user_id UUID NOT NULL,
    token_id UUID NOT NULL,

    -- Variant (for A/B testing)
    variant_id VARCHAR(10),

    -- Message (может быть персонализировано)
    title VARCHAR(100),
    body TEXT,

    -- Tracking
    sent_at TIMESTAMP NOT NULL,
    delivered_at TIMESTAMP,
    received_at TIMESTAMP,
    opened_at TIMESTAMP,
    converted_at TIMESTAMP,
    conversion_value DECIMAL(10, 2), -- Revenue

    -- Status
    status VARCHAR(20), -- sent, delivered, failed, opened, converted
    failure_reason TEXT,

    INDEX idx_campaign (campaign_id),
    INDEX idx_user (user_id),
    INDEX idx_sent_at (sent_at),
    INDEX idx_status (status)
);

-- Campaign Analytics (pre-aggregated)
CREATE TABLE campaign_analytics (
    campaign_id UUID NOT NULL,
    date DATE NOT NULL,
    hour INT, -- 0-23 (for hourly breakdown)

    -- Counts
    sent INT DEFAULT 0,
    delivered INT DEFAULT 0,
    failed INT DEFAULT 0,
    opened INT DEFAULT 0,
    conversions INT DEFAULT 0,

    -- Revenue
    total_revenue DECIMAL(12, 2) DEFAULT 0,

    -- Rates (pre-calculated)
    delivery_rate DECIMAL(5, 2),
    open_rate DECIMAL(5, 2),
    conversion_rate DECIMAL(5, 2),

    PRIMARY KEY (campaign_id, date, hour),
    INDEX idx_date (date)
);
```

---

## 6. PRICING & MONETIZATION

### 6.1. Pricing Tiers

```yaml
Push Notifications Pricing:

Included in base plan:
  - Starter ($499/month): 50K push/month
  - Growth ($1,499/month): 500K push/month
  - Scale ($4,999/month): 2M push/month
  - Enterprise ($9,999/month): 10M push/month

Additional push notifications:
  - $0.50 per 1,000 pushes (overage pricing)
  - Пример: Send 3M on Scale plan → 1M overage × $0.50 = $500

  Compare to OneSignal:
    - OneSignal: $0.75 per 1,000 (50% more expensive!)
    - Airship: $2-5 per 1,000 (4-10x more expensive!)

  Our pricing = Most competitive! ✅

Value proposition:
  - "Push included" = Easier mental model
  - No separate push bill
  - Unified platform
  - Better than buying OneSignal separately
```

### 6.2. Business Impact

```yaml
For us (platform):

  Increased revenue:
    - 30% of customers will use push features heavily
    - Average overage: $500/month per customer
    - 1,000 customers × 30% × $500 = $150K/month additional revenue
    - Annual: $1.8M ARR from push overages

  Reduced churn:
    - Unified platform = harder to switch
    - More features = more value
    - Estimated churn reduction: 25%
    - For $100M ARR → Save $25M in prevented churn!

  Competitive advantage:
    - Only attribution platform with push notifications
    - Unique position in market
    - Higher perceived value

For customers:

  Cost savings:
    - OneSignal: $2K/month
    - Our push: Included (up to limits)
    - Savings: $2K/month = $24K/year

  Time savings:
    - One platform instead of two
    - Unified analytics
    - No context switching
    - Estimated: 5 hours/week saved × $50/hour = $250/week = $13K/year

  Revenue increase:
    - Better targeting (based on attribution data)
    - Higher open rates (+30% vs generic push)
    - Higher conversions (+50% with LTV-based targeting)
    - Typical uplift: $50-200K/year in additional revenue

  Total customer value:
    - Cost savings: $24K
    - Time savings: $13K
    - Revenue increase: $100K (conservative)
    - Total: $137K/year value!
```

---

## 7. IMPLEMENTATION ROADMAP

```yaml
Phase 1: MVP (Months 1-2)
  Month 1:
    ✓ SDK integration (iOS, Android)
    ✓ Push token management
    ✓ Backend: Token storage, Campaign creation
    ✓ APNs/FCM integration
    ✓ Basic sending

  Month 2:
    ✓ Tracking: Delivery, Opens
    ✓ Basic dashboard (create campaign, view analytics)
    ✓ Simple segmentation (all users, iOS, Android)
    ✓ Beta testing with 10 customers

Phase 2: Core Features (Months 3-4)
  Month 3:
    ✓ Advanced segmentation (by attribution, LTV, behavior)
    ✓ Scheduled campaigns
    ✓ Rich push (images, actions)
    ✓ Deep links

  Month 4:
    ✓ Conversion tracking
    ✓ Revenue attribution
    ✓ A/B testing
    ✓ Analytics dashboard v2

Phase 3: Advanced Features (Months 5-6)
  Month 5:
    ✓ Triggered campaigns (event-based, time-based)
    ✓ Personalization (dynamic content)
    ✓ Frequency capping
    ✓ User preferences

  Month 6:
    ✓ ML-powered optimization (send time, messaging)
    ✓ Predictive targeting (who will convert?)
    ✓ ROI calculator
    ✓ Full documentation & launch 🚀
```

---

## 8. CONCLUSION

**Summary:**

Мы добавляем **Push Notifications** как встроенную функцию нашего Attribution SDK:

### Ключевые преимущества:

1. **Unified SDK (всё включено):**
   - Attribution + Performance + Push в одном SDK
   - Размер: <500 KB (минимальное влияние)
   - Влияние на производительность: <3% cold start, ~1% battery (незаметно!)
   - **Рекомендация: Всё включено по умолчанию! Не усложнять модулями.**

2. **Простая интеграция:**
   - 3 строки кода → Push работают
   - Автоматическая настройка (token, permissions, handlers)
   - 5 минут до первого push notification

3. **Полная аналитика:**
   - Sent → Delivered → Opened → Converted (full funnel)
   - Revenue attribution (сколько принёс каждый push)
   - ROI calculation (typically 1000-10000%!)
   - Retention lift measurement

4. **Умная сегментация:**
   - На основе attribution данных (Facebook users, Google users)
   - На основе LTV prediction (High LTV users)
   - На основе churn prediction (At-risk users)
   - На основе поведения (Active, Inactive, Converted)

5. **Конкурентное преимущество:**
   - Только мы делаем Attribution + Push
   - Дешевле: $10-15K vs $12-15K (OneSignal + AppsFlyer)
   - Лучше: Автоматическая корреляция push → revenue
   - Проще: Одна панель, один SDK, один счёт

### Бизнес-impact:

**Для нас:**
- Additional revenue: $1.8M ARR (push overages)
- Reduced churn: -25% (sticky platform)
- Competitive moat: Unique positioning

**Для клиентов:**
- Cost savings: $24K/year (no OneSignal)
- Time savings: $13K/year (unified platform)
- Revenue increase: $100K+/year (better targeting)
- **Total value: $137K/year!**

### Финальная рекомендация:

✅ **UNIFIED SDK - всё включено по умолчанию**

Почему:
- Performance impact минимален
- Проще для разработчиков
- Лучше для маркетинга
- Конкуренты (Firebase) делают так же
- Никто не жалуется на Firebase размер (2-3 MB)
- Наш SDK легче (< 500 KB)!

**Approach:** "Батарейки включены" - всё работает из коробки! 🔋✅

