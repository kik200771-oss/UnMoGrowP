# Cohort Analysis & Visualization System

## Comprehensive Visual Analytics with Multi-Dimensional Breakdowns

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [Cohort Analysis Engine](#cohort-analysis-engine)
3. [Multi-Dimensional Breakdowns](#multi-dimensional-breakdowns)
4. [Visualization Components](#visualization-components)
5. [Interactive Dashboards](#interactive-dashboards)
6. [Advanced Analytics Features](#advanced-analytics-features)
7. [Technical Implementation](#technical-implementation)
8. [Performance Optimization](#performance-optimization)

---

## Executive Overview

### What is Cohort Analysis?

**Cohort Analysis** - группировка пользователей по общему признаку (дата установки, источник, страна) и отслеживание их поведения во времени.

**Why It Matters:**
- Понять retention rate по когортам
- Сравнить качество трафика из разных источников
- Оптимизировать географию и платформы
- Измерить эффективность креативов
- Предсказать LTV на ранних стадиях

### Key Features

✅ **Time-Based Cohorts** - По дате установки (daily, weekly, monthly)
✅ **Source Cohorts** - По источнику трафика (campaign, network, creative)
✅ **Geography Cohorts** - По странам и регионам
✅ **Platform Cohorts** - iOS vs Android, версии ОС
✅ **Multi-Dimensional** - Комбинации измерений (US + iOS + Facebook)
✅ **Real-Time Updates** - Обновление данных каждые 5 минут
✅ **Interactive Filters** - Динамическая фильтрация и drill-down
✅ **Export Options** - CSV, Excel, PDF, API

### Supported Metrics

**Retention Metrics:**
- Day 1, 3, 7, 14, 30, 60, 90 retention
- Classic retention vs Rolling retention
- Unbounded retention

**Revenue Metrics:**
- Revenue per cohort
- ARPU (Average Revenue Per User)
- ARPPU (Average Revenue Per Paying User)
- Cumulative revenue

**Engagement Metrics:**
- DAU, WAU, MAU per cohort
- Sessions per user
- Session length
- Feature usage

**Conversion Metrics:**
- Purchase rate
- Subscription rate
- Trial-to-paid conversion
- Funnel completion

---

## Cohort Analysis Engine

### Core Cohort Types

#### 1. Installation Date Cohorts (Acquisition Cohorts)

**Purpose:** Track users based on when they installed the app.

**Granularity:**
- Daily cohorts (users who installed on 2024-01-15)
- Weekly cohorts (users who installed in Week 3 of 2024)
- Monthly cohorts (users who installed in January 2024)

**Example Query:**
```sql
-- Day 1, 7, 30 retention by daily cohort
SELECT
    DATE(install_time) as cohort_date,
    COUNT(DISTINCT user_id) as cohort_size,

    -- Day 1 retention
    COUNT(DISTINCT CASE
        WHEN last_active >= DATE(install_time) + INTERVAL 1 DAY
        THEN user_id
    END) as day_1_retained,

    -- Day 7 retention
    COUNT(DISTINCT CASE
        WHEN last_active >= DATE(install_time) + INTERVAL 7 DAY
        THEN user_id
    END) as day_7_retained,

    -- Day 30 retention
    COUNT(DISTINCT CASE
        WHEN last_active >= DATE(install_time) + INTERVAL 30 DAY
        THEN user_id
    END) as day_30_retained

FROM users
WHERE install_time >= '2024-01-01'
GROUP BY cohort_date
ORDER BY cohort_date DESC
```

**Visualization:**

```
Cohort Retention Table (Daily Cohorts)
┌─────────────┬────────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ Install Date│ Size   │ Day 1│ Day 3│ Day 7│ Day14│ Day30│ Day90│
├─────────────┼────────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ 2024-01-15  │ 1,000  │  45% │  35% │  28% │  22% │  18% │  12% │
│ 2024-01-16  │ 1,200  │  48% │  38% │  30% │  24% │  20% │  14% │
│ 2024-01-17  │   800  │  42% │  32% │  26% │  20% │  16% │  10% │
│ 2024-01-18  │ 1,500  │  50% │  40% │  32% │  26% │  22% │  16% │
│ 2024-01-19  │ 1,100  │  46% │  36% │  29% │  23% │  19% │  13% │
└─────────────┴────────┴──────┴──────┴──────┴──────┴──────┴──────┘

Color-coding:
🟢 Green: >40% retention
🟡 Yellow: 25-40% retention
🔴 Red: <25% retention
```

#### 2. Campaign Cohorts (Attribution Source)

**Purpose:** Compare quality of traffic from different campaigns.

**Dimensions:**
- Campaign ID
- Campaign name
- Ad network (Facebook, Google, TikTok, etc.)
- Campaign type (UAC, CPI, CPA, etc.)

**Example Analysis:**

```
Retention by Campaign (Day 30)
┌────────────────────────┬────────┬──────────┬──────┬────────┐
│ Campaign               │ Installs│ Day 30   │ ARPU │ LTV    │
├────────────────────────┼────────┼──────────┼──────┼────────┤
│ FB_Lookalike_iOS_US    │  5,000 │   35% ⭐ │ $4.50│ $45.20 │
│ Google_UAC_Android     │  8,000 │   28%    │ $3.20│ $32.50 │
│ TikTok_Gaming_Gen      │  3,000 │   22%    │ $2.80│ $25.10 │
│ FB_Broad_Targeting     │ 12,000 │   18% ⚠️ │ $1.90│ $18.40 │
│ Snapchat_Stories_18-24 │  2,000 │   40% ⭐ │ $5.20│ $52.80 │
└────────────────────────┴────────┴──────────┴──────┴────────┘

Insight: FB_Lookalike и Snapchat дают лучший retention и LTV
Action: Увеличить budget на эти кампании
```

#### 3. Geographic Cohorts (Country/Region)

**Purpose:** Understand user behavior by geography.

**Dimensions:**
- Country (US, UK, DE, etc.)
- Region (North America, Europe, APAC)
- City (for large markets)

**Example Analysis:**

```
Retention by Country (Day 7)
┌─────────────┬────────┬──────────┬──────┬────────┬─────────┐
│ Country     │ Installs│ Day 7    │ ARPU │ CPI    │ ROI     │
├─────────────┼────────┼──────────┼──────┼────────┼─────────┤
│ 🇺🇸 US       │ 50,000 │   32%    │ $5.80│ $12.00 │  +120%  │
│ 🇬🇧 UK       │ 15,000 │   30%    │ $4.20│  $9.50 │  +85%   │
│ 🇩🇪 Germany  │ 10,000 │   28%    │ $3.50│  $8.00 │  +65%   │
│ 🇧🇷 Brazil   │ 20,000 │   25%    │ $1.20│  $2.50 │  +12%   │
│ 🇮🇳 India    │ 30,000 │   22%    │ $0.80│  $1.50 │  -15% ⚠️│
│ 🇯🇵 Japan    │  8,000 │   35% ⭐ │ $6.50│ $14.00 │  +140%  │
└─────────────┴────────┴──────────┴──────┴────────┴─────────┘

Insight: US, UK, Japan - высокий ROI. India - убыточно.
Action: Остановить кампании в India, масштабировать Japan.
```

#### 4. Platform Cohorts (iOS vs Android)

**Purpose:** Compare platform performance.

**Dimensions:**
- OS type (iOS, Android)
- OS version (iOS 16, iOS 17, Android 13, Android 14)
- Device type (iPhone 14, Samsung Galaxy S23, etc.)

**Example Analysis:**

```
Retention by Platform (Day 30)
┌──────────────┬────────┬──────────┬──────┬────────┬─────────┐
│ Platform     │ Installs│ Day 30   │ ARPU │ IAP Rate│ LTV    │
├──────────────┼────────┼──────────┼──────┼────────┼─────────┤
│ iOS          │ 60,000 │   32%    │ $6.20│   15%  │ $62.80  │
│ Android      │ 80,000 │   24%    │ $3.80│    8%  │ $35.40  │
│              │        │          │      │        │         │
│ iOS 17       │ 40,000 │   35% ⭐ │ $6.80│   18%  │ $68.50  │
│ iOS 16       │ 20,000 │   28%    │ $5.20│   12%  │ $54.30  │
│ Android 14   │ 50,000 │   26%    │ $4.20│    9%  │ $38.20  │
│ Android 13   │ 30,000 │   22%    │ $3.20│    7%  │ $31.50  │
└──────────────┴────────┴──────────┴──────┴────────┴─────────┘

Insight: iOS users имеют 2x higher LTV
Action: Increase iOS ad spend, optimize Android monetization
```

#### 5. Creative Cohorts (Ad Creative Performance)

**Purpose:** Compare which creatives drive quality users.

**Dimensions:**
- Creative ID
- Creative type (image, video, playable)
- Creative theme (gameplay, testimonial, offer)

**Example Analysis:**

```
Retention by Creative (Day 14)
┌───────────────────────┬────────┬──────────┬──────┬────────┐
│ Creative              │ Installs│ Day 14   │ CPI  │ eCPI   │
├───────────────────────┼────────┼──────────┼──────┼────────┤
│ Video_Gameplay_V1     │ 10,000 │   38% ⭐ │ $8.50│ $22.37 │
│ Video_Gameplay_V2     │  8,000 │   34%    │ $9.20│ $27.06 │
│ Image_Feature_Promo   │  5,000 │   28%    │ $6.00│ $21.43 │
│ Video_Testimonial     │  3,000 │   25%    │ $7.50│ $30.00 │
│ Playable_Demo         │  2,000 │   42% ⭐ │$12.00│ $28.57 │
└───────────────────────┴────────┴──────────┴──────┴────────┘

Metrics:
- CPI: Cost Per Install (paid to ad network)
- eCPI: Effective CPI (adjusted for retention)
  Formula: CPI / Day 14 Retention

Insight: Playable Demo и Gameplay V1 имеют лучший retention
Action: Pause testimonial creative, scale playable
```

---

## Multi-Dimensional Breakdowns

### Combination Analysis

**Purpose:** Analyze cohorts with multiple dimensions simultaneously.

#### Example 1: Country + Platform

```
Retention by Country + Platform (Day 7)
┌─────────────┬──────────┬────────┬──────────┬──────┬────────┐
│ Country     │ Platform │ Installs│ Day 7    │ ARPU │ LTV    │
├─────────────┼──────────┼────────┼──────────┼──────┼────────┤
│ 🇺🇸 US       │ iOS      │ 30,000 │   40% ⭐ │ $8.20│ $82.50 │
│ 🇺🇸 US       │ Android  │ 20,000 │   28%    │ $4.50│ $45.30 │
│ 🇬🇧 UK       │ iOS      │  8,000 │   35%    │ $6.50│ $65.20 │
│ 🇬🇧 UK       │ Android  │  7,000 │   26%    │ $3.20│ $32.80 │
│ 🇩🇪 Germany  │ iOS      │  5,000 │   32%    │ $5.20│ $52.40 │
│ 🇩🇪 Germany  │ Android  │  5,000 │   24%    │ $2.80│ $28.50 │
└─────────────┴──────────┴────────┴──────────┴──────┴────────┘

Insight: iOS users в западных странах - наиболее ценные
```

#### Example 2: Campaign + Country + Platform

```
Best Performing Segments (Day 30 Retention)
┌────────────────────┬─────────┬──────────┬────────┬──────────┬────────┐
│ Campaign           │ Country │ Platform │ Installs│ Day 30   │ LTV    │
├────────────────────┼─────────┼──────────┼────────┼──────────┼────────┤
│ FB_Lookalike       │ US      │ iOS      │  2,000 │   45% ⭐ │ $95.20 │
│ FB_Lookalike       │ US      │ Android  │  1,500 │   32%    │ $58.40 │
│ FB_Lookalike       │ UK      │ iOS      │    800 │   40%    │ $82.30 │
│ Google_UAC         │ US      │ Android  │  3,000 │   30%    │ $52.50 │
│ TikTok_Gaming      │ US      │ iOS      │    500 │   38%    │ $68.90 │
│ Snapchat_Stories   │ US      │ iOS      │    800 │   48% ⭐ │$102.40 │
└────────────────────┴─────────┴──────────┴────────┴──────────┴────────┘

Insight: Snapchat + US + iOS = золотая комбинация
Action: Максимизировать бюджет на этот сегмент
```

#### Example 3: Time + Creative + Platform

```
Creative Performance Over Time (Weekly Cohorts)
┌────────────┬───────────────────┬──────────┬────────┬──────────┐
│ Week       │ Creative          │ Platform │ Installs│ Day 7    │
├────────────┼───────────────────┼──────────┼────────┼──────────┤
│ Week 1     │ Video_Gameplay_V1 │ iOS      │  1,000 │   42%    │
│ Week 2     │ Video_Gameplay_V1 │ iOS      │  1,200 │   40%    │
│ Week 3     │ Video_Gameplay_V1 │ iOS      │  1,500 │   35% ⚠️ │ ← Fatigue
│ Week 4     │ Video_Gameplay_V2 │ iOS      │  1,000 │   44% ⭐ │ ← Refresh
└────────────┴───────────────────┴──────────┴────────┴──────────┘

Insight: Creative fatigue после 2-3 недель
Action: Rotate creatives каждые 2 недели
```

### Advanced Filters

**Filter Options:**

```yaml
filters:
  # Time filters
  date_range:
    - last_7_days
    - last_30_days
    - last_90_days
    - custom_range
    - year_to_date
    - all_time

  cohort_granularity:
    - daily
    - weekly
    - monthly

  # Attribution filters
  campaign:
    - campaign_ids: [campaign_1, campaign_2, ...]
    - campaign_names: ["Summer Sale", "Black Friday"]
    - ad_network: [facebook, google, tiktok, snapchat]
    - campaign_type: [uac, cpi, cpa]

  # Geographic filters
  geography:
    - countries: [US, UK, DE, FR, JP]
    - regions: [north_america, europe, apac]
    - cities: [new_york, london, berlin]
    - languages: [en, de, fr, ja]

  # Platform filters
  platform:
    - os: [ios, android]
    - os_version: ["iOS 17", "iOS 16", "Android 14"]
    - device: [iphone, ipad, samsung, pixel]
    - device_type: [phone, tablet]

  # Creative filters
  creative:
    - creative_ids: [creative_1, creative_2, ...]
    - creative_type: [image, video, playable]
    - creative_theme: [gameplay, testimonial, offer]

  # User filters
  user:
    - user_segment: [new, returning, churned, resurrected]
    - ltv_bucket: [high, medium, low]
    - payment_status: [paying, free, trial]

  # Behavioral filters
  behavior:
    - completed_tutorial: [true, false]
    - made_purchase: [true, false]
    - reached_level: [1, 5, 10, 20, 50]
    - session_count: [1, 3, 7, 14, 30]
```

---

## Visualization Components

### 1. Cohort Retention Table

**Classic Retention Table (Heatmap):**

```
┌─────────────┬──────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Cohort      │ Size │ D0  │ D1  │ D2  │ D3  │ D7  │ D14 │ D30 │ D90 │
├─────────────┼──────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 2024-01-01  │ 1.2K │100% │ 48% │ 42% │ 38% │ 32% │ 26% │ 20% │ 14% │
│ 2024-01-02  │ 1.5K │100% │ 52% │ 45% │ 40% │ 35% │ 28% │ 22% │ 16% │
│ 2024-01-03  │ 0.8K │100% │ 45% │ 38% │ 35% │ 28% │ 22% │ 18% │ 12% │
│ 2024-01-04  │ 2.0K │100% │ 55% │ 48% │ 44% │ 38% │ 32% │ 26% │ 18% │
│ ...         │      │     │     │     │     │     │     │     │     │
└─────────────┴──────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Color Heatmap:
🟢 >40% (Excellent)
🟡 25-40% (Good)
🟠 15-25% (Fair)
🔴 <15% (Poor)
```

**Visualization Code (React + ECharts):**

```typescript
import ReactECharts from 'echarts-for-react';

function CohortRetentionTable({ data }) {
  const option = {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const { name, value } = params;
        return `${name}<br/>Retention: ${value}%`;
      }
    },
    grid: {
      height: '80%',
      top: '10%'
    },
    xAxis: {
      type: 'category',
      data: ['D0', 'D1', 'D3', 'D7', 'D14', 'D30', 'D60', 'D90'],
      splitArea: { show: true }
    },
    yAxis: {
      type: 'category',
      data: data.cohorts.map(c => c.date),
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: ['#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#91cf60', '#1a9850']
      }
    },
    series: [{
      name: 'Retention',
      type: 'heatmap',
      data: data.retentionData, // [[0, 0, 100], [0, 1, 48], ...]
      label: {
        show: true,
        formatter: '{c}%'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };

  return <ReactECharts option={option} style={{ height: 600 }} />;
}
```

### 2. Retention Curves (Line Chart)

**Compare Multiple Cohorts:**

```
Retention Curves by Campaign
100% │                                      ╭─ Snapchat_Stories
     │                                 ╭────╯
 80% │                            ╭────╯
     │                       ╭────╯  ╭─ FB_Lookalike
 60% │                  ╭────╯   ╭──╯
     │             ╭────╯     ╭──╯
 40% │        ╭────╯      ╭──╯  ╭─ Google_UAC
     │   ╭────╯       ╭──╯   ╭──╯
 20% │───╯        ╭──╯    ╭──╯  ╭─ TikTok_Gaming
     │        ╭──╯     ╭──╯  ╭──╯
  0% └────────┴────────┴─────┴────┴──────────────────────────
     D0   D1   D3    D7   D14   D30    D60    D90

Legend:
── Snapchat_Stories (48% D30)
── FB_Lookalike (35% D30)
── Google_UAC (28% D30)
── TikTok_Gaming (22% D30)
```

**Code:**

```typescript
function RetentionCurves({ campaigns }) {
  const option = {
    title: {
      text: 'Retention Curves by Campaign'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: campaigns.map(c => c.name),
      bottom: 10
    },
    xAxis: {
      type: 'category',
      data: ['D0', 'D1', 'D3', 'D7', 'D14', 'D30', 'D60', 'D90']
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%'
      },
      max: 100
    },
    series: campaigns.map(campaign => ({
      name: campaign.name,
      type: 'line',
      smooth: true,
      data: campaign.retentionData,
      markPoint: {
        data: [
          { type: 'max', name: 'Peak' }
        ]
      }
    }))
  };

  return <ReactECharts option={option} style={{ height: 500 }} />;
}
```

### 3. Revenue Cohort Analysis

**Cumulative Revenue per Cohort:**

```
Cumulative Revenue by Cohort (ARPU)
$10 │                                          ╭─ 2024-01-01
    │                                     ╭────╯
 $8 │                                ╭────╯  ╭─ 2024-01-02
    │                           ╭────╯    ╭──╯
 $6 │                      ╭────╯      ╭──╯
    │                 ╭────╯        ╭──╯  ╭─ 2024-01-03
 $4 │            ╭────╯          ╭──╯  ╭──╯
    │       ╭────╯            ╭──╯  ╭──╯
 $2 │  ╭────╯              ╭──╯  ╭──╯
    │──╯                ╭──╯  ╭──╯
 $0 └───────────────────┴─────┴────────────────────────────
    D0  D1  D3   D7   D14  D30   D60   D90

Table View:
┌─────────────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ Cohort      │ D1   │ D7   │ D14  │ D30  │ D60  │ D90  │
├─────────────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ 2024-01-01  │ $0.20│ $1.50│ $3.20│ $6.80│ $9.20│$12.50│
│ 2024-01-02  │ $0.25│ $1.80│ $3.60│ $7.20│ $9.80│$13.20│
│ 2024-01-03  │ $0.15│ $1.20│ $2.80│ $6.00│ $8.50│$11.80│
└─────────────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

### 4. Multi-Dimensional Comparison

**Sunburst Chart (Hierarchical Breakdown):**

```
                    ┌─────────────────────┐
                    │   All Installs      │
                    │     100,000         │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
      ┌─────▼─────┐      ┌────▼────┐      ┌─────▼─────┐
      │    US     │      │   UK    │      │  Germany  │
      │  50,000   │      │ 30,000  │      │  20,000   │
      └─────┬─────┘      └────┬────┘      └─────┬─────┘
            │                 │                  │
      ┌─────┴─────┐     ┌─────┴─────┐    ┌─────┴─────┐
      │           │     │           │    │           │
  ┌───▼──┐   ┌───▼──┐ ┌▼──┐   ┌───▼┐  ┌▼──┐   ┌───▼┐
  │ iOS  │   │Android│ iOS │   │And.│  iOS │   │And.│
  │30,000│   │20,000│ 18K │   │12K │  12K │   │ 8K │
  └──────┘   └──────┘ └───┘   └────┘  └───┘   └────┘

Interactive: Click to drill down
Color-coded by retention rate
Size proportional to cohort size
```

### 5. Geographic Heatmap

**World Map with Retention Overlay:**

```
World Map - Day 30 Retention by Country

     ┌─────────────────────────────────────────────────┐
     │  🌍 World                                        │
     │                                                  │
     │         🇺🇸 45%                                  │
     │                                                  │
     │              🇬🇧 40%   🇩🇪 35%                   │
     │                                                  │
     │                                         🇯🇵 42%  │
     │                                                  │
     │                   🇧🇷 28%                        │
     │                                                  │
     │                            🇮🇳 22%               │
     │                                                  │
     └─────────────────────────────────────────────────┘

Color Legend:
🟢 >40% (Excellent)
🟡 30-40% (Good)
🟠 20-30% (Fair)
🔴 <20% (Poor)
```

---

## Interactive Dashboards

### Dashboard 1: Cohort Overview

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Cohort Analysis Dashboard                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filters:                                                   │
│  ┌────────────────────────────────────────────────────────┐│
│  │ Date Range: [Last 90 Days ▼]                           ││
│  │ Granularity: [● Daily  ○ Weekly  ○ Monthly]            ││
│  │ Campaign: [All Campaigns ▼]                             ││
│  │ Country: [All Countries ▼]                              ││
│  │ Platform: [All Platforms ▼]                             ││
│  │ [Apply Filters]  [Reset]  [Save View]                  ││
│  └────────────────────────────────────────────────────────┘│
│                                                             │
│  Key Metrics (All Cohorts):                                │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │ Total    │ Avg D7   │ Avg D30  │ Avg LTV  │            │
│  │ 100,000  │   32%    │   22%    │  $45.20  │            │
│  │ installs │  ▲ 5%    │  ▲ 3%    │  ▲ $2.10 │            │
│  └──────────┴──────────┴──────────┴──────────┘            │
│                                                             │
│  Cohort Retention Heatmap:                                 │
│  [Interactive Heatmap - See Section 1]                     │
│                                                             │
│  Retention Curves:                                          │
│  [Interactive Line Chart - See Section 2]                  │
│                                                             │
│  Top Performing Segments:                                   │
│  ┌────────────────────────────────────────────────────────┐│
│  │ 1. Snapchat + US + iOS        48% D30  $102.40 LTV    ││
│  │ 2. FB_Lookalike + US + iOS    45% D30   $95.20 LTV    ││
│  │ 3. FB_Lookalike + UK + iOS    40% D30   $82.30 LTV    ││
│  │ 4. Google_UAC + US + iOS      38% D30   $78.50 LTV    ││
│  │ 5. TikTok_Gaming + US + iOS   38% D30   $68.90 LTV    ││
│  └────────────────────────────────────────────────────────┘│
│                                                             │
│  [Export CSV]  [Export Excel]  [Share Dashboard]           │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard 2: Campaign Comparison

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 Campaign Cohort Comparison                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Select Campaigns to Compare:                               │
│  ┌────────────────────────────────────────────────────────┐│
│  │ ✓ FB_Lookalike_iOS_US                                   ││
│  │ ✓ Google_UAC_Android                                    ││
│  │ ✓ TikTok_Gaming_Gen                                     ││
│  │ ✓ Snapchat_Stories_18-24                                ││
│  │ ☐ FB_Broad_Targeting                                    ││
│  │ [Select All]  [Clear]                                   ││
│  └────────────────────────────────────────────────────────┘│
│                                                             │
│  Side-by-Side Comparison:                                   │
│  ┌───────────────┬──────────┬──────────┬──────────┬──────┐│
│  │ Campaign      │ Installs │ D7 Ret.  │ D30 Ret. │ LTV  ││
│  ├───────────────┼──────────┼──────────┼──────────┼──────┤│
│  │ FB_Lookalike  │   5,000  │   42%    │   35% ⭐ │ $45  ││
│  │ Google_UAC    │   8,000  │   35%    │   28%    │ $32  ││
│  │ TikTok_Gaming │   3,000  │   28%    │   22%    │ $25  ││
│  │ Snapchat      │   2,000  │   48% ⭐ │   40% ⭐ │ $52⭐││
│  └───────────────┴──────────┴──────────┴──────────┴──────┘│
│                                                             │
│  Retention Curves (Overlay):                                │
│  [4 lines overlaid - one per campaign]                     │
│                                                             │
│  Revenue Curves (Overlay):                                  │
│  [4 lines showing cumulative ARPU]                         │
│                                                             │
│  Cost Efficiency:                                           │
│  ┌───────────────┬──────┬──────┬───────┬────────┐         │
│  │ Campaign      │ CPI  │ eCPI │ ROI   │ Status │         │
│  ├───────────────┼──────┼──────┼───────┼────────┤         │
│  │ FB_Lookalike  │ $9.00│$25.71│ +175% │ ✓ Good │         │
│  │ Google_UAC    │ $7.50│$26.79│ +142% │ ✓ Good │         │
│  │ TikTok_Gaming │ $5.00│$22.73│ +180% │ ✓ Good │         │
│  │ Snapchat      │$12.00│$30.00│ +233% │⭐Great │         │
│  └───────────────┴──────┴──────┴───────┴────────┘         │
│                                                             │
│  Recommendation: Scale Snapchat (highest LTV + ROI)         │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard 3: Geographic Analysis

```
┌─────────────────────────────────────────────────────────────┐
│  🌍 Geographic Cohort Analysis                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  World Map (Interactive):                                   │
│  [Click country to drill down]                              │
│  [Color-coded by Day 30 retention]                          │
│                                                             │
│  Regional Performance:                                       │
│  ┌────────────────┬──────────┬─────────┬──────┬──────────┐│
│  │ Region         │ Installs │ D30 Ret.│ LTV  │ ROI      ││
│  ├────────────────┼──────────┼─────────┼──────┼──────────┤│
│  │ North America  │  70,000  │   34%   │ $52  │  +145%   ││
│  │ Western Europe │  30,000  │   30%   │ $42  │  +95%    ││
│  │ Eastern Europe │  15,000  │   26%   │ $28  │  +55%    ││
│  │ APAC           │  50,000  │   28%   │ $35  │  +80%    ││
│  │ LatAm          │  25,000  │   24%   │ $22  │  +25%    ││
│  │ MENA           │  10,000  │   22%   │ $18  │  +10%    ││
│  └────────────────┴──────────┴─────────┴──────┴──────────┘│
│                                                             │
│  Top Countries:                                             │
│  ┌──────┬────────┬─────────┬──────┬──────┬────────┐       │
│  │ Rank │ Country│ Installs│ D30  │ LTV  │ ROI    │       │
│  ├──────┼────────┼─────────┼──────┼──────┼────────┤       │
│  │  1   │ 🇺🇸 US  │ 50,000  │ 35%  │ $55  │ +150%  │       │
│  │  2   │ 🇯🇵 Japan│  8,000  │ 38%⭐│ $62⭐│ +180%⭐│       │
│  │  3   │ 🇬🇧 UK  │ 15,000  │ 32%  │ $45  │ +110%  │       │
│  │  4   │ 🇩🇪 DE  │ 10,000  │ 30%  │ $38  │  +85%  │       │
│  │  5   │ 🇨🇦 CA  │ 12,000  │ 32%  │ $42  │ +100%  │       │
│  └──────┴────────┴─────────┴──────┴──────┴────────┘       │
│                                                             │
│  Bottom Countries (Consider Pausing):                       │
│  ┌──────┬────────┬─────────┬──────┬──────┬────────┐       │
│  │ Rank │ Country│ Installs│ D30  │ LTV  │ ROI    │       │
│  ├──────┼────────┼─────────┼──────┼──────┼────────┤       │
│  │  1   │ 🇮🇳 India│ 30,000 │ 18%  │ $12  │  -25% ⚠│       │
│  │  2   │ 🇮🇩 ID  │ 15,000  │ 20%  │ $15  │  -15% ⚠│       │
│  │  3   │ 🇵🇰 PK  │  8,000  │ 16%  │ $10  │  -35% ⚠│       │
│  └──────┴────────┴─────────┴──────┴──────┴────────┘       │
│                                                             │
│  💡 Recommendation: Stop India, Indonesia, Pakistan         │
│     campaigns. Reinvest budget into Japan, US, UK.         │
└─────────────────────────────────────────────────────────────┘
```

---

## Advanced Analytics Features

### 1. Cohort Prediction (ML-Powered)

**Predict Future Retention Based on Early Behavior:**

```python
from sklearn.ensemble import GradientBoostingClassifier
import numpy as np

class CohortRetentionPredictor:
    """
    Predict Day 30 retention based on Day 1-7 behavior

    Use case: Identify bad cohorts early and pause campaigns
    """

    def train(self, historical_cohorts):
        """
        Train model on historical data

        Features:
        - Day 1 retention
        - Day 3 retention
        - Day 7 retention
        - Session count (D1-D7)
        - Revenue (D1-D7)

        Target: Day 30 retention (binary: >25% = good)
        """

        X = []
        y = []

        for cohort in historical_cohorts:
            features = [
                cohort.day_1_retention,
                cohort.day_3_retention,
                cohort.day_7_retention,
                cohort.avg_sessions_d1_d7,
                cohort.avg_revenue_d1_d7
            ]

            label = 1 if cohort.day_30_retention > 0.25 else 0

            X.append(features)
            y.append(label)

        self.model = GradientBoostingClassifier()
        self.model.fit(X, y)

    def predict(self, new_cohort):
        """
        Predict if new cohort will have good Day 30 retention
        """

        features = np.array([[
            new_cohort.day_1_retention,
            new_cohort.day_3_retention,
            new_cohort.day_7_retention,
            new_cohort.avg_sessions_d1_d7,
            new_cohort.avg_revenue_d1_d7
        ]])

        probability = self.model.predict_proba(features)[0][1]

        return {
            'predicted_good_retention': probability > 0.5,
            'confidence': probability,
            'predicted_d30_retention': self.estimate_d30(features)
        }

# Example usage
predictor = CohortRetentionPredictor()
predictor.train(historical_cohorts)

# New campaign started yesterday
new_cohort = {
    'campaign': 'TikTok_NewCreative',
    'day_1_retention': 0.42,
    'day_3_retention': 0.35,
    'day_7_retention': 0.28,
    'avg_sessions_d1_d7': 3.2,
    'avg_revenue_d1_d7': 0.85
}

prediction = predictor.predict(new_cohort)

if not prediction['predicted_good_retention']:
    alert(f"⚠️ Warning: {new_cohort['campaign']} predicted to have "
          f"poor D30 retention ({prediction['predicted_d30_retention']:.1%}). "
          f"Consider pausing.")
```

### 2. Cohort Clustering

**Automatically Group Similar Cohorts:**

```python
from sklearn.cluster import KMeans
import pandas as pd

def cluster_cohorts(cohorts):
    """
    Cluster cohorts by behavior patterns

    Use case: Find hidden segments with similar characteristics
    """

    # Feature engineering
    features = pd.DataFrame([
        {
            'day_1_retention': c.day_1_retention,
            'day_7_retention': c.day_7_retention,
            'day_30_retention': c.day_30_retention,
            'avg_ltv': c.avg_ltv,
            'avg_sessions': c.avg_sessions,
            'purchase_rate': c.purchase_rate
        }
        for c in cohorts
    ])

    # K-means clustering
    kmeans = KMeans(n_clusters=4, random_state=42)
    features['cluster'] = kmeans.fit_predict(features)

    # Analyze clusters
    for cluster_id in range(4):
        cluster_cohorts = features[features['cluster'] == cluster_id]

        print(f"Cluster {cluster_id}:")
        print(f"  Avg D30 Retention: {cluster_cohorts['day_30_retention'].mean():.1%}")
        print(f"  Avg LTV: ${cluster_cohorts['avg_ltv'].mean():.2f}")
        print(f"  Size: {len(cluster_cohorts)} cohorts")

        # Find common characteristics
        cohort_ids = cluster_cohorts.index.tolist()
        campaigns = [cohorts[i].campaign for i in cohort_ids]
        countries = [cohorts[i].country for i in cohort_ids]

        print(f"  Common campaigns: {pd.Series(campaigns).value_counts().head(3)}")
        print(f"  Common countries: {pd.Series(countries).value_counts().head(3)}")

# Example output:
"""
Cluster 0 (High-Value Users):
  Avg D30 Retention: 42%
  Avg LTV: $65.20
  Size: 45 cohorts
  Common campaigns: FB_Lookalike (20), Snapchat_Stories (15)
  Common countries: US (25), UK (12), Japan (8)

Cluster 1 (Medium-Value Users):
  Avg D30 Retention: 28%
  Avg LTV: $35.50
  Size: 120 cohorts
  Common campaigns: Google_UAC (60), TikTok_Gaming (40)
  Common countries: US (50), DE (30), CA (25)

Cluster 2 (Low-Value Users):
  Avg D30 Retention: 18%
  Avg LTV: $18.20
  Size: 80 cohorts
  Common campaigns: FB_Broad (50), Display_Network (30)
  Common countries: BR (30), IN (25), ID (15)

Cluster 3 (Churners):
  Avg D30 Retention: 8%
  Avg LTV: $5.40
  Size: 25 cohorts
  Common campaigns: FB_Broad (15), Incent_Traffic (10)
  Common countries: PK (10), BD (8), PH (7)

Action: Pause all Cluster 3 campaigns
"""
```

### 3. Anomaly Detection

**Detect Unusual Cohort Behavior:**

```python
from sklearn.ensemble import IsolationForest

def detect_anomalous_cohorts(cohorts):
    """
    Detect cohorts with unusual retention patterns

    Use case: Identify fraud, technical issues, or exceptional performance
    """

    # Feature matrix
    X = np.array([
        [
            c.day_1_retention,
            c.day_7_retention,
            c.day_30_retention,
            c.avg_ltv
        ]
        for c in cohorts
    ])

    # Isolation Forest
    clf = IsolationForest(contamination=0.1)  # Expect 10% anomalies
    predictions = clf.fit_predict(X)

    # Flag anomalies
    anomalous_cohorts = []
    for i, pred in enumerate(predictions):
        if pred == -1:  # Anomaly
            cohort = cohorts[i]
            anomalous_cohorts.append({
                'cohort': cohort,
                'reason': classify_anomaly(cohort)
            })

    return anomalous_cohorts

def classify_anomaly(cohort):
    """
    Classify why cohort is anomalous
    """

    # Unusually high retention
    if cohort.day_30_retention > 0.60:
        return "⭐ Exceptional performance - investigate for best practices"

    # Retention cliff (sudden drop)
    if (cohort.day_1_retention > 0.50 and
        cohort.day_7_retention < 0.20):
        return "⚠️ Retention cliff - possible onboarding issue"

    # Zero revenue despite retention
    if (cohort.day_30_retention > 0.30 and
        cohort.avg_ltv < 1.0):
        return "⚠️ Non-monetizing users - possible fraud"

    # High revenue, low retention
    if (cohort.day_7_retention < 0.15 and
        cohort.avg_ltv > 50.0):
        return "🤔 High-value churners - investigate why they left"

    return "❓ Unknown anomaly - manual review needed"

# Example output:
"""
Anomalous Cohorts Detected:

1. TikTok_NewCreative (2024-01-15)
   ⚠️ Retention cliff - possible onboarding issue
   D1: 52%, D7: 18%, D30: 8%
   Action: Review onboarding flow

2. FB_Lookalike_Premium (2024-01-18)
   ⭐ Exceptional performance - investigate for best practices
   D1: 65%, D7: 58%, D30: 48%
   Action: Increase budget, replicate strategy

3. Incent_Traffic_Test (2024-01-20)
   ⚠️ Non-monetizing users - possible fraud
   D30: 35%, LTV: $0.50
   Action: Pause campaign, investigate fraud
"""
```

---

## Technical Implementation

### Database Schema for Cohorts

```sql
-- cohorts table
CREATE TABLE cohorts (
    cohort_id UUID PRIMARY KEY,
    cohort_date DATE NOT NULL,
    cohort_type VARCHAR(50), -- 'daily', 'weekly', 'monthly'

    -- Dimensions
    campaign_id UUID,
    country_code VARCHAR(2),
    platform VARCHAR(20), -- 'ios', 'android'
    os_version VARCHAR(20),
    creative_id UUID,

    -- Size
    cohort_size INT NOT NULL,

    -- Retention metrics
    day_0_retained INT DEFAULT cohort_size,
    day_1_retained INT,
    day_3_retained INT,
    day_7_retained INT,
    day_14_retained INT,
    day_30_retained INT,
    day_60_retained INT,
    day_90_retained INT,

    -- Revenue metrics
    day_1_revenue DECIMAL(10,2),
    day_7_revenue DECIMAL(10,2),
    day_30_revenue DECIMAL(10,2),
    day_90_revenue DECIMAL(10,2),

    -- Engagement metrics
    avg_sessions_d1_d7 DECIMAL(5,2),
    avg_sessions_d1_d30 DECIMAL(5,2),
    avg_session_length_d1_d7 INT, -- seconds

    -- Conversion metrics
    paying_users INT,
    purchase_rate DECIMAL(5,4),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    INDEX idx_cohort_date (cohort_date),
    INDEX idx_campaign (campaign_id),
    INDEX idx_country (country_code),
    INDEX idx_platform (platform)
);

-- cohort_metrics table (for faster queries)
CREATE TABLE cohort_metrics_mv AS
SELECT
    cohort_id,
    cohort_date,
    campaign_id,
    country_code,
    platform,

    cohort_size,

    -- Retention rates
    day_1_retained * 1.0 / cohort_size as day_1_retention,
    day_7_retained * 1.0 / cohort_size as day_7_retention,
    day_30_retained * 1.0 / cohort_size as day_30_retention,

    -- ARPU
    day_30_revenue * 1.0 / cohort_size as day_30_arpu,

    -- LTV estimate
    day_90_revenue * 1.0 / cohort_size as day_90_ltv

FROM cohorts;
```

### API Endpoints

```typescript
// GET /api/cohorts
interface CohortQueryParams {
  // Date range
  start_date: string;  // YYYY-MM-DD
  end_date: string;

  // Granularity
  granularity: 'daily' | 'weekly' | 'monthly';

  // Dimensions (filters)
  campaign_ids?: string[];
  country_codes?: string[];
  platforms?: ('ios' | 'android')[];

  // Metrics to return
  metrics?: ('retention' | 'revenue' | 'engagement')[];

  // Limit
  limit?: number;
  offset?: number;
}

// Response
interface CohortResponse {
  cohorts: Cohort[];
  total: number;
  aggregates: {
    total_installs: number;
    avg_day_7_retention: number;
    avg_day_30_retention: number;
    avg_ltv: number;
  };
}

// Example request
GET /api/cohorts?start_date=2024-01-01&end_date=2024-01-31&granularity=daily&campaign_ids=campaign_1,campaign_2&metrics=retention,revenue

// Example response
{
  "cohorts": [
    {
      "cohort_id": "uuid",
      "cohort_date": "2024-01-15",
      "campaign_id": "campaign_1",
      "country": "US",
      "platform": "ios",
      "cohort_size": 1000,
      "retention": {
        "day_1": 0.48,
        "day_7": 0.32,
        "day_30": 0.22
      },
      "revenue": {
        "day_1": 0.20,
        "day_7": 1.50,
        "day_30": 6.80
      }
    }
  ],
  "total": 31,
  "aggregates": {
    "total_installs": 50000,
    "avg_day_7_retention": 0.35,
    "avg_day_30_retention": 0.24,
    "avg_ltv": 45.20
  }
}
```

---

## Performance Optimization

### 1. Materialized Views

**Pre-aggregate cohort data for fast queries:**

```sql
-- Materialized view for daily cohorts
CREATE MATERIALIZED VIEW cohort_daily_mv AS
SELECT
    DATE(install_time) as cohort_date,
    campaign_id,
    country_code,
    platform,

    COUNT(DISTINCT user_id) as cohort_size,

    -- Retention
    COUNT(DISTINCT CASE WHEN days_since_install >= 1 THEN user_id END) as day_1_retained,
    COUNT(DISTINCT CASE WHEN days_since_install >= 7 THEN user_id END) as day_7_retained,
    COUNT(DISTINCT CASE WHEN days_since_install >= 30 THEN user_id END) as day_30_retained,

    -- Revenue
    SUM(CASE WHEN days_since_install <= 30 THEN revenue ELSE 0 END) as day_30_revenue

FROM user_events
WHERE install_time >= NOW() - INTERVAL '90 days'
GROUP BY cohort_date, campaign_id, country_code, platform;

-- Refresh hourly
REFRESH MATERIALIZED VIEW cohort_daily_mv;
```

### 2. Caching Strategy

```typescript
// Redis cache for frequently accessed cohorts
import Redis from 'ioredis';

const redis = new Redis();

async function getCohortData(params: CohortQueryParams) {
  // Generate cache key
  const cacheKey = `cohort:${JSON.stringify(params)}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Query database
  const data = await db.query(buildCohortQuery(params));

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(data));

  return data;
}
```

### 3. Query Optimization

**Use ClickHouse for fast cohort queries:**

```sql
-- ClickHouse table (columnar storage)
CREATE TABLE cohorts_ch (
    cohort_date Date,
    campaign_id String,
    country_code FixedString(2),
    platform Enum8('ios' = 1, 'android' = 2),

    cohort_size UInt32,

    day_1_retention Float32,
    day_7_retention Float32,
    day_30_retention Float32,

    day_30_arpu Decimal(10, 2),

    INDEX idx_date cohort_date TYPE minmax GRANULARITY 1,
    INDEX idx_campaign campaign_id TYPE bloom_filter GRANULARITY 1
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(cohort_date)
ORDER BY (cohort_date, campaign_id, country_code, platform);

-- Query (sub-100ms for 1M+ cohorts)
SELECT
    cohort_date,
    campaign_id,
    country_code,
    platform,
    avg(day_30_retention) as avg_retention,
    avg(day_30_arpu) as avg_arpu
FROM cohorts_ch
WHERE cohort_date BETWEEN '2024-01-01' AND '2024-01-31'
  AND campaign_id IN ('campaign_1', 'campaign_2')
  AND country_code = 'US'
GROUP BY cohort_date, campaign_id, country_code, platform
ORDER BY cohort_date DESC;
```

---

## Summary

### Cohort Analysis System Highlights

✅ **Comprehensive Cohort Types:**
- Installation date cohorts (daily, weekly, monthly)
- Campaign cohorts (compare traffic sources)
- Geographic cohorts (country, region, city)
- Platform cohorts (iOS vs Android, OS versions)
- Creative cohorts (ad creative performance)
- Multi-dimensional combinations

✅ **Rich Metrics:**
- Retention (D1, D3, D7, D14, D30, D60, D90)
- Revenue (ARPU, ARPPU, cumulative LTV)
- Engagement (DAU, sessions, session length)
- Conversion (purchase rate, trial-to-paid)

✅ **Visualization Types:**
- Cohort retention heatmap (color-coded)
- Retention curves (line charts)
- Revenue curves (cumulative ARPU)
- Sunburst charts (hierarchical drill-down)
- Geographic heatmaps (world map)

✅ **Interactive Dashboards:**
- Cohort Overview Dashboard
- Campaign Comparison Dashboard
- Geographic Analysis Dashboard
- Real-time filters and drill-downs
- Export to CSV, Excel, PDF

✅ **Advanced Analytics:**
- ML-powered retention prediction (predict D30 from D1-D7)
- Cohort clustering (find hidden segments)
- Anomaly detection (flag unusual patterns)
- Automated insights and recommendations

✅ **Performance:**
- Sub-100ms queries (ClickHouse + materialized views)
- Redis caching for frequently accessed cohorts
- Real-time updates (5-minute refresh)
- Handle millions of cohorts

**This is the most comprehensive cohort analysis system in the attribution industry. Competitors can't match this level of detail and interactivity.**

🎯
