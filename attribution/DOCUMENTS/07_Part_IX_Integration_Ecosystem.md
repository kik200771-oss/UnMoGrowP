# Part IX: Integration Ecosystem

## Developer-First Platform with Comprehensive SDKs, APIs, and Integrations

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [Mobile SDKs](#mobile-sdks)
3. [Web SDK](#web-sdk)
4. [Server-to-Server API](#server-to-server-api)
5. [REST API Documentation](#rest-api-documentation)
6. [Webhooks](#webhooks)
7. [Ad Network Integrations](#ad-network-integrations)
8. [Data Export & Import](#data-export-import)
9. [Third-Party Integrations](#third-party-integrations)
10. [Developer Resources](#developer-resources)

---

## Executive Overview

### Integration Philosophy

**Developer-First Approach:**
- Easy to integrate (< 30 minutes)
- Comprehensive documentation
- Multiple integration methods
- SDK for every platform
- Generous free tier
- Active developer community

### Integration Methods

| Method | Use Case | Complexity | Setup Time |
|--------|----------|------------|------------|
| **Mobile SDK** | iOS/Android apps | Low | 15-30 min |
| **Web SDK** | Web applications | Low | 10-15 min |
| **Server API** | Backend integration | Medium | 30-60 min |
| **REST API** | Custom integrations | Medium | 1-2 hours |
| **Webhooks** | Real-time events | Low | 15-30 min |
| **CSV Import** | Bulk data import | Low | 5-10 min |

### Supported Platforms

**Mobile:**
- iOS (Swift, Objective-C)
- Android (Kotlin, Java)
- React Native
- Flutter
- Unity
- Cordova/Ionic

**Web:**
- JavaScript (vanilla)
- React
- Vue
- Angular
- Svelte
- Next.js

**Backend:**
- Node.js / Bun
- Python
- Go
- Ruby
- PHP
- Java
- C# / .NET

**Ad Networks (Campaign Automation):**
- Facebook Ads
- Google Ads
- TikTok Ads
- Snapchat Ads
- Twitter Ads
- Unity Ads
- AppLovin Axon
- Apple Search Ads

---

## Mobile SDKs

### iOS SDK (Swift)

**Installation (CocoaPods):**

```ruby
# Podfile
platform :ios, '13.0'
use_frameworks!

target 'YourApp' do
  pod 'AttributionSDK', '~> 1.0'
end
```

**Installation (Swift Package Manager):**

```swift
// Package.swift
dependencies: [
    .package(url: "https://github.com/attribution-platform/ios-sdk.git", from: "1.0.0")
]
```

**Basic Integration:**

```swift
// AppDelegate.swift
import AttributionSDK

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        // Initialize SDK
        AttributionSDK.shared.initialize(
            apiKey: "your_api_key_here",
            environment: .production
        )

        // Optional: Set user ID (for cross-device tracking)
        AttributionSDK.shared.setUserId("user_12345")

        // Optional: Enable debug logging
        #if DEBUG
        AttributionSDK.shared.setLogLevel(.debug)
        #endif

        return true
    }

    // Handle deep links
    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {

        // Track deep link
        if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL {
            AttributionSDK.shared.trackDeepLink(url)
        }

        return true
    }
}
```

**Event Tracking:**

```swift
// Track install (automatic on first launch)
// No code needed - SDK handles automatically

// Track custom events
AttributionSDK.shared.trackEvent(
    name: "purchase",
    properties: [
        "product_id": "SKU123",
        "price": 9.99,
        "currency": "USD"
    ]
)

// Track revenue
AttributionSDK.shared.trackRevenue(
    amount: 9.99,
    currency: "USD",
    productId: "SKU123"
)

// Track user properties
AttributionSDK.shared.setUserProperties([
    "subscription_tier": "premium",
    "ltv_segment": "high_value"
])
```

**Advanced Features:**

```swift
// Get attribution data
AttributionSDK.shared.getAttribution { result in
    switch result {
    case .success(let attribution):
        print("Campaign: \(attribution.campaign)")
        print("Source: \(attribution.source)")
        print("Medium: \(attribution.medium)")

    case .failure(let error):
        print("Error: \(error)")
    }
}

// GDPR compliance
AttributionSDK.shared.setConsentGiven(true)

// Opt out of tracking
AttributionSDK.shared.optOut()

// Delete user data
AttributionSDK.shared.deleteUserData { success in
    print("Data deleted: \(success)")
}
```

**SKAdNetwork Support (iOS 14+):**

```swift
// Info.plist
<key>SKAdNetworkItems</key>
<array>
    <dict>
        <key>SKAdNetworkIdentifier</key>
        <string>attribution-platform-id.skadnetwork</string>
    </dict>
</array>

// Track conversion value (0-63)
AttributionSDK.shared.updateSKAdNetworkConversionValue(42)
```

### Android SDK (Kotlin)

**Installation (Gradle):**

```kotlin
// build.gradle (project level)
allprojects {
    repositories {
        maven { url 'https://maven.attribution-platform.com/releases' }
    }
}

// build.gradle (app level)
dependencies {
    implementation 'com.attribution:sdk:1.0.0'
}
```

**Basic Integration:**

```kotlin
// Application.kt
import com.attribution.sdk.AttributionSDK
import com.attribution.sdk.AttributionConfig

class MyApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        // Initialize SDK
        val config = AttributionConfig.Builder(
            context = this,
            apiKey = "your_api_key_here"
        )
            .setEnvironment(Environment.PRODUCTION)
            .setLogLevel(LogLevel.INFO)
            .build()

        AttributionSDK.initialize(config)

        // Optional: Set user ID
        AttributionSDK.setUserId("user_12345")
    }
}
```

**AndroidManifest.xml:**

```xml
<manifest>
    <application
        android:name=".MyApplication">

        <!-- Attribution SDK Receiver -->
        <receiver
            android:name="com.attribution.sdk.InstallReferrerReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="com.android.vending.INSTALL_REFERRER" />
            </intent-filter>
        </receiver>

        <!-- Deep link handling -->
        <activity android:name=".MainActivity">
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="yourapp.com" />
            </intent-filter>
        </activity>
    </application>

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
</manifest>
```

**Event Tracking:**

```kotlin
// Track custom events
AttributionSDK.trackEvent(
    name = "purchase",
    properties = mapOf(
        "product_id" to "SKU123",
        "price" to 9.99,
        "currency" to "USD"
    )
)

// Track revenue
AttributionSDK.trackRevenue(
    amount = 9.99,
    currency = "USD",
    productId = "SKU123"
)

// Track user properties
AttributionSDK.setUserProperties(
    mapOf(
        "subscription_tier" to "premium",
        "ltv_segment" to "high_value"
    )
)
```

**Advanced Features:**

```kotlin
// Get attribution data
AttributionSDK.getAttribution { result ->
    when (result) {
        is Result.Success -> {
            val attribution = result.data
            Log.d("Attribution", "Campaign: ${attribution.campaign}")
            Log.d("Attribution", "Source: ${attribution.source}")
        }
        is Result.Error -> {
            Log.e("Attribution", "Error: ${result.error}")
        }
    }
}

// GDPR compliance
AttributionSDK.setConsentGiven(true)

// Opt out
AttributionSDK.optOut()

// Delete user data
AttributionSDK.deleteUserData { success ->
    Log.d("Attribution", "Data deleted: $success")
}
```

### React Native SDK

**Installation:**

```bash
npm install @attribution-platform/react-native-sdk
# or
yarn add @attribution-platform/react-native-sdk

# iOS
cd ios && pod install
```

**Basic Integration:**

```typescript
// App.tsx
import React, { useEffect } from 'react';
import AttributionSDK from '@attribution-platform/react-native-sdk';

export default function App() {
  useEffect(() => {
    // Initialize SDK
    AttributionSDK.initialize({
      apiKey: 'your_api_key_here',
      environment: 'production'
    });

    // Optional: Set user ID
    AttributionSDK.setUserId('user_12345');
  }, []);

  return (
    // Your app
  );
}
```

**Event Tracking:**

```typescript
// Track event
AttributionSDK.trackEvent('purchase', {
  product_id: 'SKU123',
  price: 9.99,
  currency: 'USD'
});

// Track revenue
AttributionSDK.trackRevenue({
  amount: 9.99,
  currency: 'USD',
  productId: 'SKU123'
});

// Get attribution
const attribution = await AttributionSDK.getAttribution();
console.log('Campaign:', attribution.campaign);
```

### Flutter SDK

**Installation:**

```yaml
# pubspec.yaml
dependencies:
  attribution_sdk: ^1.0.0
```

**Basic Integration:**

```dart
// main.dart
import 'package:flutter/material.dart';
import 'package:attribution_sdk/attribution_sdk.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize SDK
  await AttributionSDK.initialize(
    apiKey: 'your_api_key_here',
    environment: Environment.production,
  );

  runApp(MyApp());
}

// Track events
AttributionSDK.trackEvent(
  name: 'purchase',
  properties: {
    'product_id': 'SKU123',
    'price': 9.99,
    'currency': 'USD',
  },
);

// Get attribution
final attribution = await AttributionSDK.getAttribution();
print('Campaign: ${attribution.campaign}');
```

### Unity SDK

**Installation:**
1. Download `AttributionSDK.unitypackage`
2. Import into Unity project
3. Configure in `Window > Attribution SDK > Settings`

**Basic Integration:**

```csharp
// AttributionManager.cs
using AttributionPlatform;
using UnityEngine;

public class AttributionManager : MonoBehaviour
{
    void Start()
    {
        // Initialize SDK
        AttributionSDK.Initialize(new AttributionConfig
        {
            ApiKey = "your_api_key_here",
            Environment = Environment.Production
        });

        // Optional: Set user ID
        AttributionSDK.SetUserId("user_12345");
    }

    public void OnPurchase()
    {
        // Track purchase
        AttributionSDK.TrackEvent("purchase", new Dictionary<string, object>
        {
            { "product_id", "SKU123" },
            { "price", 9.99f },
            { "currency", "USD" }
        });
    }

    public async void GetAttribution()
    {
        var attribution = await AttributionSDK.GetAttribution();
        Debug.Log($"Campaign: {attribution.Campaign}");
    }
}
```

---

## Web SDK

### JavaScript SDK

**Installation (CDN):**

```html
<!-- Add to <head> -->
<script src="https://cdn.attribution-platform.com/sdk/v1/attribution.js"></script>
<script>
  // Initialize SDK
  Attribution.init({
    apiKey: 'your_api_key_here',
    environment: 'production'
  });
</script>
```

**Installation (NPM):**

```bash
npm install @attribution-platform/web-sdk
# or
yarn add @attribution-platform/web-sdk
```

**Basic Integration:**

```typescript
// main.ts
import Attribution from '@attribution-platform/web-sdk';

// Initialize SDK
Attribution.init({
  apiKey: 'your_api_key_here',
  environment: 'production',

  // Optional: Cookie consent
  requireConsent: true,

  // Optional: Custom cookie domain
  cookieDomain: '.yourdomain.com',

  // Optional: Debug mode
  debug: false
});

// Set user ID (after login)
Attribution.setUserId('user_12345');

// Track page views (automatic)
// Automatically tracks on route change

// Track custom events
Attribution.trackEvent('button_click', {
  button_id: 'cta_signup',
  page: window.location.pathname
});

// Track conversions
Attribution.trackConversion('purchase', {
  revenue: 9.99,
  currency: 'USD',
  product_id: 'SKU123'
});
```

**React Integration:**

```typescript
// AttributionProvider.tsx
import React, { createContext, useContext, useEffect } from 'react';
import Attribution from '@attribution-platform/web-sdk';

const AttributionContext = createContext(Attribution);

export function AttributionProvider({ children }) {
  useEffect(() => {
    // Initialize on mount
    Attribution.init({
      apiKey: process.env.NEXT_PUBLIC_ATTRIBUTION_API_KEY,
      environment: process.env.NODE_ENV
    });
  }, []);

  return (
    <AttributionContext.Provider value={Attribution}>
      {children}
    </AttributionContext.Provider>
  );
}

export function useAttribution() {
  return useContext(AttributionContext);
}

// Usage in component
function CheckoutPage() {
  const attribution = useAttribution();

  const handlePurchase = async () => {
    // Track conversion
    attribution.trackConversion('purchase', {
      revenue: 9.99,
      currency: 'USD',
      product_id: 'SKU123'
    });
  };

  return (
    <button onClick={handlePurchase}>
      Complete Purchase
    </button>
  );
}
```

**Vue Integration:**

```typescript
// plugins/attribution.ts
import Attribution from '@attribution-platform/web-sdk';

export default defineNuxtPlugin(() => {
  Attribution.init({
    apiKey: process.env.NUXT_PUBLIC_ATTRIBUTION_API_KEY,
    environment: process.env.NODE_ENV
  });

  return {
    provide: {
      attribution: Attribution
    }
  };
});

// Usage in component
<script setup>
const { $attribution } = useNuxtApp();

const handlePurchase = () => {
  $attribution.trackConversion('purchase', {
    revenue: 9.99,
    currency: 'USD'
  });
};
</script>
```

**Advanced Features:**

```typescript
// Get attribution data
const attribution = await Attribution.getAttribution();
console.log('Campaign:', attribution.campaign);
console.log('Source:', attribution.source);
console.log('Medium:', attribution.medium);

// A/B testing
const variant = await Attribution.getExperimentVariant('homepage_hero');
if (variant === 'variant_b') {
  // Show variant B
}

// GDPR compliance
Attribution.setConsentGiven(true);

// Opt out
Attribution.optOut();

// Delete user data
await Attribution.deleteUserData();
```

---

## Server-to-Server API

### Node.js / Bun SDK

**Installation:**

```bash
npm install @attribution-platform/node-sdk
# or
bun add @attribution-platform/node-sdk
```

**Basic Integration:**

```typescript
// server.ts
import { AttributionClient } from '@attribution-platform/node-sdk';

// Initialize client
const attribution = new AttributionClient({
  apiKey: process.env.ATTRIBUTION_API_KEY,
  environment: 'production'
});

// Track server-side event
await attribution.trackEvent({
  event_type: 'conversion',
  user_id: 'user_12345',
  device_id: 'device_abc',
  timestamp: Date.now(),
  properties: {
    revenue: 9.99,
    currency: 'USD',
    product_id: 'SKU123'
  }
});

// Batch tracking (more efficient)
await attribution.trackBatch([
  {
    event_type: 'purchase',
    user_id: 'user_1',
    timestamp: Date.now(),
    properties: { revenue: 9.99 }
  },
  {
    event_type: 'purchase',
    user_id: 'user_2',
    timestamp: Date.now(),
    properties: { revenue: 14.99 }
  }
]);

// Get attribution for user
const userAttribution = await attribution.getAttribution('user_12345');
console.log('Campaign:', userAttribution.campaign);
```

### Python SDK

**Installation:**

```bash
pip install attribution-platform
```

**Basic Integration:**

```python
# server.py
from attribution_platform import AttributionClient

# Initialize client
attribution = AttributionClient(
    api_key=os.environ['ATTRIBUTION_API_KEY'],
    environment='production'
)

# Track event
attribution.track_event(
    event_type='conversion',
    user_id='user_12345',
    device_id='device_abc',
    timestamp=int(time.time() * 1000),
    properties={
        'revenue': 9.99,
        'currency': 'USD',
        'product_id': 'SKU123'
    }
)

# Batch tracking
attribution.track_batch([
    {
        'event_type': 'purchase',
        'user_id': 'user_1',
        'timestamp': int(time.time() * 1000),
        'properties': {'revenue': 9.99}
    },
    {
        'event_type': 'purchase',
        'user_id': 'user_2',
        'timestamp': int(time.time() * 1000),
        'properties': {'revenue': 14.99}
    }
])

# Get attribution
user_attribution = attribution.get_attribution('user_12345')
print(f"Campaign: {user_attribution['campaign']}")
```

### Go SDK

**Installation:**

```bash
go get github.com/attribution-platform/go-sdk
```

**Basic Integration:**

```go
// main.go
package main

import (
    "context"
    attribution "github.com/attribution-platform/go-sdk"
)

func main() {
    // Initialize client
    client := attribution.NewClient(
        attribution.WithAPIKey(os.Getenv("ATTRIBUTION_API_KEY")),
        attribution.WithEnvironment("production"),
    )

    // Track event
    err := client.TrackEvent(context.Background(), &attribution.Event{
        EventType: "conversion",
        UserID:    "user_12345",
        DeviceID:  "device_abc",
        Timestamp: time.Now().UnixMilli(),
        Properties: map[string]interface{}{
            "revenue":    9.99,
            "currency":   "USD",
            "product_id": "SKU123",
        },
    })
    if err != nil {
        log.Fatal(err)
    }

    // Get attribution
    attr, err := client.GetAttribution(context.Background(), "user_12345")
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Campaign: %s\n", attr.Campaign)
}
```

---

## REST API Documentation

### Authentication

**API Key (Header):**

```http
POST /v1/events HTTP/1.1
Host: api.attribution-platform.com
X-API-Key: your_api_key_here
Content-Type: application/json
```

**Bearer Token (OAuth):**

```http
POST /v1/campaigns HTTP/1.1
Host: api.attribution-platform.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Event Ingestion API

**POST /v1/events**

Track attribution events.

**Request:**

```json
{
  "event_type": "install",
  "timestamp": 1699564800000,
  "device_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "user_12345",
  "campaign_id": "campaign_abc",
  "ip": "1.2.3.4",
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)...",
  "referrer": "https://google.com",
  "metadata": {
    "app_version": "1.2.3",
    "platform": "ios"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "event_id": "evt_1234567890"
}
```

**POST /v1/events/batch**

Track multiple events in one request (more efficient).

**Request:**

```json
{
  "events": [
    {
      "event_type": "click",
      "timestamp": 1699564800000,
      "device_id": "device_1",
      "campaign_id": "campaign_abc"
    },
    {
      "event_type": "install",
      "timestamp": 1699564900000,
      "device_id": "device_1",
      "campaign_id": "campaign_abc"
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "processed": 2,
  "failed": 0
}
```

### Attribution API

**GET /v1/attribution/{device_id}**

Get attribution data for a device.

**Response (200 OK):**

```json
{
  "device_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "attributed": true,
  "campaign": {
    "id": "campaign_abc",
    "name": "Summer Sale 2024",
    "source": "facebook",
    "medium": "cpc",
    "content": "creative_123"
  },
  "attribution_method": "deterministic",
  "attribution_time": 1699564800000,
  "click_time": 1699564700000,
  "install_time": 1699564800000,
  "confidence": 1.0
}
```

### Campaign API

**GET /v1/campaigns**

List all campaigns.

**Query Parameters:**
- `status`: Filter by status (active, paused, archived)
- `platform`: Filter by platform (facebook, google, tiktok)
- `limit`: Results per page (default: 50, max: 100)
- `offset`: Pagination offset

**Response (200 OK):**

```json
{
  "campaigns": [
    {
      "id": "campaign_abc",
      "name": "Summer Sale 2024",
      "platform": "facebook",
      "status": "active",
      "budget": {
        "daily": 500,
        "currency": "USD"
      },
      "performance": {
        "impressions": 100000,
        "clicks": 5000,
        "installs": 250,
        "ctr": 0.05,
        "cpa": 10.0,
        "roas": 3.5
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 42,
  "has_more": true
}
```

**POST /v1/campaigns**

Create a new campaign.

**Request:**

```json
{
  "name": "Summer Sale 2024",
  "platform": "facebook",
  "campaign_type": "app_install",
  "objective": "installs",
  "budget": {
    "type": "daily",
    "amount": 500
  },
  "bidding": {
    "strategy": "cost_cap",
    "target_cpa": 12.0
  },
  "targeting": {
    "geos": ["US", "CA"],
    "demographics": {
      "age_min": 18,
      "age_max": 65,
      "genders": ["all"]
    }
  },
  "creatives": [
    {
      "type": "image",
      "file_url": "https://cdn.example.com/image.jpg"
    }
  ],
  "ai_automation": {
    "enabled": true,
    "optimization_mode": "balanced"
  }
}
```

**Response (201 Created):**

```json
{
  "id": "campaign_xyz",
  "name": "Summer Sale 2024",
  "platform": "facebook",
  "status": "paused",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Analytics API

**GET /v1/analytics/overview**

Get high-level analytics overview.

**Query Parameters:**
- `start_date`: ISO 8601 date (e.g., 2024-01-01)
- `end_date`: ISO 8601 date
- `campaign_id`: Filter by campaign (optional)

**Response (200 OK):**

```json
{
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "metrics": {
    "impressions": 1000000,
    "clicks": 50000,
    "installs": 2500,
    "conversions": 500,
    "revenue": 12500.00,
    "spend": 5000.00,
    "ctr": 0.05,
    "cpa": 2.0,
    "roas": 2.5,
    "roi": 1.5
  },
  "trends": {
    "installs_change": 0.15,
    "revenue_change": 0.22,
    "roas_change": 0.08
  }
}
```

**GET /v1/analytics/funnel**

Get attribution funnel data.

**Response (200 OK):**

```json
{
  "funnel": [
    {
      "stage": "impressions",
      "count": 1000000,
      "conversion_rate": 1.0
    },
    {
      "stage": "clicks",
      "count": 50000,
      "conversion_rate": 0.05
    },
    {
      "stage": "installs",
      "count": 2500,
      "conversion_rate": 0.05
    },
    {
      "stage": "conversions",
      "count": 500,
      "conversion_rate": 0.2
    }
  ]
}
```

### Rate Limits

| Endpoint | Rate Limit | Burst |
|----------|-----------|-------|
| Event Ingestion | 10,000 req/min | 20,000 req/min |
| Batch Ingestion | 1,000 req/min | 2,000 req/min |
| Attribution API | 5,000 req/min | 10,000 req/min |
| Campaign API | 1,000 req/min | 2,000 req/min |
| Analytics API | 500 req/min | 1,000 req/min |

**Rate Limit Headers:**

```http
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9500
X-RateLimit-Reset: 1699564800
```

### Error Responses

**400 Bad Request:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid event_type",
    "details": {
      "field": "event_type",
      "expected": "one of: click, impression, install, conversion"
    }
  }
}
```

**401 Unauthorized:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key"
  }
}
```

**429 Too Many Requests:**

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "retry_after": 60
  }
}
```

---

## Webhooks

### Webhook Events

Subscribe to real-time events via webhooks.

**Supported Events:**
- `attribution.created` - New attribution created
- `conversion.created` - New conversion event
- `campaign.status_changed` - Campaign status changed
- `ai_automation.action_taken` - AI took action on campaign
- `fraud.detected` - Fraud detected
- `budget.threshold_reached` - Budget threshold reached

### Webhook Configuration

**Create Webhook Endpoint:**

```http
POST /v1/webhooks
Content-Type: application/json
Authorization: Bearer your_api_token

{
  "url": "https://your-server.com/webhooks/attribution",
  "events": [
    "attribution.created",
    "conversion.created",
    "ai_automation.action_taken"
  ],
  "secret": "your_webhook_secret"
}
```

**Response:**

```json
{
  "id": "webhook_abc123",
  "url": "https://your-server.com/webhooks/attribution",
  "events": ["attribution.created", "conversion.created"],
  "secret": "whsec_abc123...",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Webhook Payload

**attribution.created:**

```json
{
  "event": "attribution.created",
  "timestamp": 1699564800000,
  "data": {
    "attribution_id": "attr_123",
    "device_id": "device_abc",
    "campaign": {
      "id": "campaign_xyz",
      "name": "Summer Sale 2024"
    },
    "attribution_method": "deterministic",
    "confidence": 1.0,
    "click_time": 1699564700000,
    "install_time": 1699564800000
  }
}
```

**conversion.created:**

```json
{
  "event": "conversion.created",
  "timestamp": 1699565000000,
  "data": {
    "conversion_id": "conv_456",
    "user_id": "user_12345",
    "device_id": "device_abc",
    "campaign": {
      "id": "campaign_xyz",
      "name": "Summer Sale 2024"
    },
    "revenue": 9.99,
    "currency": "USD",
    "product_id": "SKU123"
  }
}
```

**ai_automation.action_taken:**

```json
{
  "event": "ai_automation.action_taken",
  "timestamp": 1699565200000,
  "data": {
    "campaign_id": "campaign_xyz",
    "action_type": "budget_increased",
    "reason": "ROAS 3.8x > target 3.0x, low saturation",
    "changes": {
      "budget_before": 500,
      "budget_after": 600,
      "increase_pct": 0.20
    },
    "expected_impact": "+$87K revenue/month"
  }
}
```

### Webhook Security

**Verify Signature:**

```typescript
// Node.js example
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express.js webhook handler
app.post('/webhooks/attribution', (req, res) => {
  const signature = req.headers['x-attribution-signature'];
  const payload = JSON.stringify(req.body);

  // Verify signature
  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook
  const event = req.body;

  switch (event.event) {
    case 'attribution.created':
      handleAttribution(event.data);
      break;
    case 'conversion.created':
      handleConversion(event.data);
      break;
    // ...
  }

  res.json({ success: true });
});
```

### Webhook Retries

- Automatic retry on failure (5xx errors)
- Exponential backoff: 1s, 5s, 25s, 125s
- Max 5 retry attempts
- Webhook disabled after 100 consecutive failures

---

## Ad Network Integrations

### Facebook Ads Integration

**OAuth Flow:**

```typescript
// Step 1: Redirect user to Facebook OAuth
const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?
  client_id=${FB_APP_ID}&
  redirect_uri=${REDIRECT_URI}&
  scope=ads_management,ads_read&
  state=${STATE}`;

window.location.href = authUrl;

// Step 2: Handle callback
app.get('/auth/facebook/callback', async (req, res) => {
  const { code, state } = req.query;

  // Exchange code for access token
  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?
      client_id=${FB_APP_ID}&
      client_secret=${FB_APP_SECRET}&
      redirect_uri=${REDIRECT_URI}&
      code=${code}`
  );

  const { access_token } = await response.json();

  // Store token
  await db.integrations.insertOne({
    user_id: req.user.id,
    platform: 'facebook',
    access_token: encrypt(access_token),
    created_at: new Date()
  });

  res.redirect('/dashboard');
});
```

**API Integration:**

```typescript
// Create campaign via Facebook API
import { FacebookAdsAPI } from '@attribution-platform/ad-network-sdk';

const fb = new FacebookAdsAPI(accessToken);

// Create campaign
const campaign = await fb.createCampaign({
  name: 'Summer Sale 2024',
  objective: 'APP_INSTALLS',
  status: 'PAUSED',
  special_ad_categories: []
});

// Create ad set
const adset = await fb.createAdSet({
  campaign_id: campaign.id,
  name: 'US iOS Users',
  optimization_goal: 'APP_INSTALLS',
  billing_event: 'IMPRESSIONS',
  daily_budget: 50000,  // $500 in cents
  targeting: {
    geo_locations: { countries: ['US'] },
    user_os: ['iOS'],
    age_min: 18,
    age_max: 65
  }
});

// Create ad
const ad = await fb.createAd({
  adset_id: adset.id,
  name: 'Creative 1',
  creative: {
    image_hash: '...',
    message: 'Download our app!',
    link: 'https://apps.apple.com/...'
  }
});
```

### Google Ads Integration

**OAuth Flow (similar to Facebook):**

```typescript
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?
  client_id=${GOOGLE_CLIENT_ID}&
  redirect_uri=${REDIRECT_URI}&
  scope=https://www.googleapis.com/auth/adwords&
  response_type=code&
  access_type=offline`;
```

**API Integration:**

```typescript
import { GoogleAdsAPI } from '@attribution-platform/ad-network-sdk';

const google = new GoogleAdsAPI(accessToken, customerId);

// Create UAC campaign
const campaign = await google.createCampaign({
  name: 'Summer Sale UAC',
  advertising_channel_type: 'MULTI_CHANNEL',
  advertising_channel_sub_type: 'APP_CAMPAIGN',
  target_cpa_micros: 12000000,  // $12 CPA
  daily_budget_micros: 500000000  // $500/day
});

// Add assets
await google.addAssets(campaign.id, {
  headlines: ['Download Now', 'Get Started Today'],
  descriptions: ['Best app for tracking', 'Try it free'],
  images: ['https://cdn.example.com/image1.jpg'],
  videos: ['https://youtube.com/...']
});
```

### TikTok Ads Integration

```typescript
import { TikTokAdsAPI } from '@attribution-platform/ad-network-sdk';

const tiktok = new TikTokAdsAPI(accessToken, advertiserId);

// Create campaign
const campaign = await tiktok.createCampaign({
  campaign_name: 'Summer Sale TikTok',
  objective_type: 'APP_INSTALL',
  budget_mode: 'BUDGET_MODE_DAY',
  budget: 500.00
});

// Create ad group
const adGroup = await tiktok.createAdGroup({
  campaign_id: campaign.campaign_id,
  ad_group_name: 'iOS 18-34',
  placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
  location_ids: ['US'],
  age_groups: ['AGE_18_24', 'AGE_25_34'],
  operating_systems: ['IOS'],
  budget: 500.00,
  bid_type: 'BID_TYPE_CUSTOM',
  bid_price: 12.00
});

// Create ad
const ad = await tiktok.createAd({
  ad_group_id: adGroup.ad_group_id,
  ad_name: 'Video Ad 1',
  ad_format: 'SINGLE_VIDEO',
  video_id: '...',
  ad_text: 'Download our app!',
  call_to_action: 'DOWNLOAD'
});
```

### Integration Status Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  🔗 Ad Network Integrations                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Facebook Ads              ✅ Connected                     │
│  └─ Account: Example Inc. (123456789)                      │
│  └─ Last sync: 2 minutes ago                               │
│  └─ [Reconnect] [Settings]                                 │
│                                                             │
│  Google Ads                ✅ Connected                     │
│  └─ Account: Example Inc. (987-654-3210)                   │
│  └─ Last sync: 5 minutes ago                               │
│  └─ [Reconnect] [Settings]                                 │
│                                                             │
│  TikTok Ads                ⚠️  Token Expiring              │
│  └─ Account: @exampleapp                                   │
│  └─ Expires: In 7 days                                     │
│  └─ [Reconnect] [Settings]                                 │
│                                                             │
│  Snapchat Ads              ❌ Not Connected                │
│  └─ [Connect]                                               │
│                                                             │
│  Twitter Ads               ❌ Not Connected                │
│  └─ [Connect]                                               │
│                                                             │
│  Unity Ads                 ❌ Not Connected                │
│  └─ [Connect]                                               │
│                                                             │
│  AppLovin Axon             ❌ Not Connected                │
│  └─ [Connect]                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Export & Import

### CSV Export

**Export Campaigns:**

```typescript
// GET /v1/export/campaigns?format=csv
const response = await fetch(
  'https://api.attribution-platform.com/v1/export/campaigns?format=csv',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const csv = await response.text();
// campaign_id,name,platform,status,impressions,clicks,installs,spend,cpa,roas
// campaign_1,Summer Sale,facebook,active,100000,5000,250,2500,10.0,3.5
```

**Export Attribution Data:**

```typescript
// GET /v1/export/attributions?start_date=2024-01-01&end_date=2024-01-31&format=csv
const response = await fetch(
  'https://api.attribution-platform.com/v1/export/attributions?start_date=2024-01-01&end_date=2024-01-31&format=csv',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
```

### CSV Import

**Import Historical Data:**

```http
POST /v1/import/events
Content-Type: multipart/form-data
Authorization: Bearer your_token

--boundary
Content-Disposition: form-data; name="file"; filename="events.csv"
Content-Type: text/csv

event_type,timestamp,device_id,campaign_id,revenue
install,1699564800000,device_1,campaign_abc,
conversion,1699565000000,device_1,campaign_abc,9.99
--boundary--
```

**Response:**

```json
{
  "job_id": "import_123",
  "status": "processing",
  "total_rows": 10000,
  "processed_rows": 0
}
```

**Check Import Status:**

```http
GET /v1/import/jobs/import_123
```

```json
{
  "job_id": "import_123",
  "status": "completed",
  "total_rows": 10000,
  "processed_rows": 10000,
  "failed_rows": 0,
  "completed_at": "2024-01-15T10:35:00Z"
}
```

### Data Warehouse Integration

**BigQuery Export:**

```yaml
# Configure BigQuery export
export:
  destination: bigquery
  project_id: your-gcp-project
  dataset: attribution_data
  table_prefix: events_
  schedule: daily  # Export every day at 2 AM UTC
  fields:
    - event_type
    - timestamp
    - device_id
    - campaign_id
    - revenue
    - currency
```

**Snowflake Export:**

```yaml
export:
  destination: snowflake
  account: your-account.snowflakecomputing.com
  database: ATTRIBUTION_DB
  schema: PUBLIC
  table_prefix: EVENTS_
  schedule: hourly
```

---

## Third-Party Integrations

### Analytics Platforms

**Google Analytics 4:**

```typescript
// Send attribution data to GA4
import { gtag } from 'gtag-js';

const attribution = await Attribution.getAttribution();

gtag('event', 'attribution', {
  campaign_source: attribution.source,
  campaign_medium: attribution.medium,
  campaign_name: attribution.campaign,
  campaign_id: attribution.campaign_id
});
```

**Mixpanel:**

```typescript
import mixpanel from 'mixpanel-browser';

const attribution = await Attribution.getAttribution();

mixpanel.people.set({
  'attribution_source': attribution.source,
  'attribution_campaign': attribution.campaign
});

mixpanel.track('Attribution Received', {
  campaign: attribution.campaign,
  source: attribution.source
});
```

### Customer Data Platforms

**Segment:**

```typescript
// Attribution Platform → Segment destination
analytics.identify('user_12345', {
  attribution_source: attribution.source,
  attribution_campaign: attribution.campaign,
  predicted_ltv: 45.99
});

analytics.track('Conversion', {
  revenue: 9.99,
  currency: 'USD',
  attribution_campaign: attribution.campaign
});
```

**mParticle:**

```typescript
const attributionData = {
  attribution_source: attribution.source,
  attribution_campaign: attribution.campaign
};

mParticle.Identity.getCurrentUser()
  .setUserAttributes(attributionData);

mParticle.logEvent(
  'Conversion',
  mParticle.EventType.Transaction,
  { revenue: 9.99, ...attributionData }
);
```

### CRM Integrations

**Salesforce:**

```typescript
// Sync attribution data to Salesforce
await salesforce.updateLead('lead_123', {
  Attribution_Source__c: attribution.source,
  Attribution_Campaign__c: attribution.campaign,
  Predicted_LTV__c: 45.99
});
```

**HubSpot:**

```typescript
// Sync to HubSpot
await hubspot.updateContact('contact_123', {
  properties: {
    attribution_source: attribution.source,
    attribution_campaign: attribution.campaign,
    predicted_ltv: 45.99
  }
});
```

---

## Developer Resources

### Documentation

**Comprehensive Docs:**
- Getting Started Guide (< 30 min integration)
- API Reference (all endpoints documented)
- SDK Documentation (all platforms)
- Code Examples (100+ snippets)
- Best Practices
- Troubleshooting Guide

**Interactive API Explorer:**
- Try API calls directly in browser
- See request/response examples
- Generate code snippets (10+ languages)
- Test with your API key

### Developer Portal

```
┌─────────────────────────────────────────────────────────────┐
│  👨‍💻 Developer Portal                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📚 Documentation                                           │
│  └─ Getting Started                                         │
│  └─ API Reference                                           │
│  └─ SDK Guides                                              │
│  └─ Webhooks                                                │
│  └─ Best Practices                                          │
│                                                             │
│  🔑 API Keys                                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Production Key    pk_live_abc123...     [Copy] [Rotate]││
│  │ Test Key          pk_test_xyz789...     [Copy] [Rotate]││
│  │ [Create New Key]                                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  📊 API Usage (Last 30 Days)                                │
│  └─ Requests: 1,234,567                                     │
│  └─ Errors: 42 (0.003%)                                     │
│  └─ P50 Latency: 45ms                                       │
│  └─ P95 Latency: 120ms                                      │
│                                                             │
│  🔗 Webhooks                                                │
│  └─ Production: https://api.yourapp.com/webhooks            │
│     └─ Events: attribution.created, conversion.created      │
│     └─ Status: ✅ Healthy (99.9% success rate)             │
│  [Create New Webhook]                                       │
│                                                             │
│  💬 Support                                                 │
│  └─ Discord Community (5,000+ developers)                   │
│  └─ GitHub (report issues, feature requests)                │
│  └─ Email: developers@attribution-platform.com              │
│  └─ Office Hours: Fridays 10am-12pm PT                      │
└─────────────────────────────────────────────────────────────┘
```

### Code Examples Repository

**GitHub: github.com/attribution-platform/examples**

```
examples/
├── mobile/
│   ├── ios/
│   │   ├── swift-basic/
│   │   ├── swiftui-integration/
│   │   └── objective-c-legacy/
│   ├── android/
│   │   ├── kotlin-basic/
│   │   ├── compose-integration/
│   │   └── java-legacy/
│   ├── react-native/
│   └── flutter/
├── web/
│   ├── vanilla-js/
│   ├── react/
│   ├── vue/
│   ├── angular/
│   └── svelte/
├── backend/
│   ├── nodejs/
│   ├── python/
│   ├── go/
│   ├── ruby/
│   └── php/
├── integrations/
│   ├── facebook-ads/
│   ├── google-ads/
│   ├── tiktok-ads/
│   ├── segment/
│   ├── mixpanel/
│   └── salesforce/
└── README.md
```

### Developer Community

**Discord Server:**
- #general - General discussion
- #help - Get help from community
- #announcements - SDK releases, API updates
- #showcase - Share what you built
- #feature-requests - Suggest new features

**Monthly Developer Office Hours:**
- Live Q&A with engineering team
- Demo new features
- Best practices
- Fridays 10am-12pm PT

**Developer Newsletter:**
- SDK updates
- New integrations
- Code tutorials
- Case studies

### SDKs & Tools

**Official SDKs (maintained by us):**
- ✅ iOS (Swift)
- ✅ Android (Kotlin)
- ✅ React Native
- ✅ Flutter
- ✅ JavaScript/TypeScript
- ✅ Node.js / Bun
- ✅ Python
- ✅ Go

**Community SDKs:**
- Ruby (by @developer123)
- PHP (by @phpdev)
- Rust (by @rustacean)
- C# / .NET (by @dotnetguy)

**Developer Tools:**
- VS Code Extension (syntax highlighting, snippets)
- Postman Collection (ready-to-use API calls)
- CLI Tool (manage campaigns from terminal)
- Browser Extension (debug SDK integration)

---

## Summary

### Integration Ecosystem Highlights

**Comprehensive SDK Coverage:**
- ✅ Mobile: iOS, Android, React Native, Flutter, Unity
- ✅ Web: JavaScript, React, Vue, Angular, Svelte
- ✅ Backend: Node.js, Python, Go, Ruby, PHP, Java, C#
- ✅ All SDKs <30 min integration time

**Developer-Friendly APIs:**
- ✅ RESTful API (all endpoints documented)
- ✅ Event Ingestion (10K req/min rate limit)
- ✅ Batch API (1K req/min, more efficient)
- ✅ Webhooks (real-time events)
- ✅ Rate limiting with clear headers

**Ad Network Integrations:**
- ✅ Facebook Ads (OAuth + API)
- ✅ Google Ads (OAuth + API)
- ✅ TikTok Ads
- ✅ Snapchat Ads
- ✅ Twitter Ads
- ✅ Unity Ads
- ✅ AppLovin Axon
- ✅ One-click OAuth flow

**Data Export & Import:**
- ✅ CSV export (campaigns, attributions, analytics)
- ✅ CSV import (historical data)
- ✅ BigQuery export (daily/hourly)
- ✅ Snowflake export
- ✅ Real-time webhooks

**Third-Party Integrations:**
- ✅ Google Analytics 4
- ✅ Mixpanel
- ✅ Segment
- ✅ mParticle
- ✅ Salesforce
- ✅ HubSpot

**Developer Resources:**
- ✅ Comprehensive documentation
- ✅ Interactive API explorer
- ✅ 100+ code examples
- ✅ Discord community (5K+ developers)
- ✅ Monthly office hours
- ✅ Developer newsletter

**This is the most comprehensive integration ecosystem in mobile attribution.**

🔌
