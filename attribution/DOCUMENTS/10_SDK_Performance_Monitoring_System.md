# SDK PERFORMANCE MONITORING SYSTEM

**Родительский документ:** 07_Complete_Technical_Specification_v1.0.md

**Цель:** Расширить наш Attribution SDK для сбора технической аналитики о производительности приложения пользователя, чтобы помочь им улучшить свои приложения

---

## EXECUTIVE SUMMARY

### Проблема

Текущие решения:
- **Attribution SDK** (AppsFlyer, Adjust): Собирают только маркетинговые данные (установки, события, доход)
- **Performance monitoring** (Firebase Performance, New Relic): Отдельный SDK, отдельная панель, отдельная оплата
- **Разработчики:** Должны интегрировать 2-3 разных SDK → сложность, конфликты, overhead

### Наше решение

**Всё-в-одном SDK:**
- ✅ Attribution (установки, события, доход)
- ✅ Performance monitoring (скорость, стабильность, ресурсы)
- ✅ User experience (FPS, задержки, плавность)
- ✅ Business impact (корреляция производительности → конверсии)

**Один SDK, одна панель, одна подписка.**

### Конкурентное преимущество

```yaml
AppsFlyer + Firebase Performance:
  - 2 SDK для интеграции
  - 2 панели управления
  - 2 счёта для оплаты
  - Стоимость: $10K (attribution) + $5K (performance) = $15K/месяц
  - Нет корреляции между маркетингом и производительностью

Наша платформа:
  - 1 SDK (всё включено)
  - 1 панель (unified view)
  - 1 подписка
  - Стоимость: $8K-12K/месяц (дешевле + больше функций!)
  - Автоматическая корреляция: производительность → retention → revenue
```

### Бизнес-ценность для клиентов

```yaml
Для разработчиков:
  - Обнаружение проблем ДО того как пользователи жалуются
  - Приоритизация: Какие проблемы влияют на revenue?
  - A/B тестирование: Как изменения влияют на производительность?
  - Мониторинг релизов: Новая версия хуже/лучше?

Для маркетологов:
  - Понимание: Почему плохой retention? (Приложение тормозит!)
  - Оптимизация: Улучшить производительность → ↑retention → ↓CAC
  - Доказательство ROI: Инвестиции в performance → +15% retention

Для бизнеса:
  - Связь производительности с деньгами
  - Пример: Ускорение загрузки на 1s → +$50K revenue/месяц
  - Data-driven решения по приоритетам разработки
```

---

## 1. АРХИТЕКТУРА СИСТЕМЫ

### 1.1. Обзор компонентов

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP (iOS/Android)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Attribution SDK (Unified)                     │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ Attribution  │  │ Performance  │  │ Crash        │ │ │
│  │  │ Module       │  │ Module       │  │ Reporter     │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ Network      │  │ UI/UX        │  │ Resource     │ │ │
│  │  │ Monitor      │  │ Monitor      │  │ Monitor      │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │     Local Buffer (SQLite)                        │  │ │
│  │  │     - Батчинг событий                            │  │ │
│  │  │     - Retry при ошибках                          │  │ │
│  │  │     - Compression                                 │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      (HTTPS / gRPC)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    EDGE LAYER (Cloudflare)                   │
│  - Geo-routing (ближайший регион)                           │
│  - DDoS protection                                           │
│  - Compression (Brotli)                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 INGESTION SERVICE (Go)                       │
│  - Приём событий (10M/sec)                                  │
│  - Валидация схемы                                          │
│  - Enrichment (geo, device info)                            │
│  - Kafka producer                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      Apache Kafka
                            ↓
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Attribution  │    │ Performance  │    │ ML/AI        │
│ Stream       │    │ Stream       │    │ Processing   │
│ (Flink)      │    │ (Flink)      │    │              │
│              │    │              │    │ - Anomaly    │
│ Matching     │    │ - Aggregates │    │ - Prediction │
│ Rules        │    │ - Percentiles│    │ - Clustering │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ClickHouse   │  │ TimescaleDB  │  │ Redis        │     │
│  │              │  │              │  │              │     │
│  │ - Raw events │  │ - Time-series│  │ - Real-time  │     │
│  │ - Aggregates │  │ - Metrics    │  │ - Alerts     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    WEB DASHBOARD (Svelte)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Performance Dashboard                                  │ │
│  │  - App health overview                                 │ │
│  │  - Real-time metrics                                   │ │
│  │  - Alerts & anomalies                                  │ │
│  │  - Business impact correlation                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. МЕТРИКИ ДЛЯ СБОРА

### 2.1. Производительность приложения (App Performance)

#### 2.1.1. Запуск приложения (App Launch)

```yaml
Метрики:

Cold Start (холодный старт):
  Определение: Приложение полностью закрыто, процесс не в памяти
  Измерение: От клика иконки до первого rendered frame

  Точки измерения:
    - t0: Process creation (система запускает процесс)
    - t1: Application onCreate/init (инициализация)
    - t2: Activity/ViewController onCreate (главный экран)
    - t3: First frame rendered (первый кадр на экране)
    - t4: Time to Interactive (UI реагирует на клики)

  Метрики:
    - Total cold start time: t3 - t0
    - Time to interactive: t4 - t0
    - Init time: t1 - t0
    - UI creation time: t2 - t1
    - Render time: t3 - t2
    - Interactive delay: t4 - t3

Warm Start (тёплый старт):
  Определение: Процесс в памяти, но Activity уничтожена
  Измерение: От клика до первого frame

  Метрики:
    - Total warm start time
    - UI recreation time
    - Data loading time

Hot Start (горячий старт):
  Определение: Приложение в фоне, возврат на передний план
  Измерение: От клика до отображения

  Метрики:
    - Total hot start time (обычно <500ms)
    - Resume time

Целевые значения (benchmarks):
  Cold start:
    - Excellent: <2s
    - Good: 2-3s
    - Fair: 3-5s
    - Poor: >5s

  Warm start:
    - Excellent: <1s
    - Good: 1-2s
    - Poor: >2s

  Hot start:
    - Excellent: <500ms
    - Poor: >1s
```

**iOS SDK Implementation:**

```swift
// Performance Monitor Module
class PerformanceMonitor {
    private var appLaunchStart: Date?
    private var firstFrameRendered: Date?
    private var timeToInteractive: Date?

    // Автоматически вызывается при старте
    init() {
        self.appLaunchStart = Date()

        // Слушаем первый frame
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(firstFrameDidRender),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )

        // Измеряем время до интерактивности
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            self.measureTimeToInteractive()
        }
    }

    @objc private func firstFrameDidRender() {
        guard firstFrameRendered == nil else { return }

        self.firstFrameRendered = Date()

        let coldStartTime = firstFrameRendered!.timeIntervalSince(appLaunchStart!)

        // Отправить метрику
        AttributionSDK.shared.trackPerformance(
            metric: "app_cold_start",
            value: coldStartTime * 1000, // ms
            attributes: [
                "device_model": UIDevice.current.model,
                "os_version": UIDevice.current.systemVersion,
                "app_version": Bundle.main.appVersion
            ]
        )
    }

    private func measureTimeToInteractive() {
        // Проверяем что main thread не заблокирован
        let isInteractive = !Thread.isMainThread || RunLoop.main.currentMode != nil

        if isInteractive && timeToInteractive == nil {
            self.timeToInteractive = Date()

            let ttiTime = timeToInteractive!.timeIntervalSince(appLaunchStart!)

            AttributionSDK.shared.trackPerformance(
                metric: "app_time_to_interactive",
                value: ttiTime * 1000,
                attributes: [:]
            )
        } else {
            // Retry через 50ms
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
                self.measureTimeToInteractive()
            }
        }
    }
}
```

**Android SDK Implementation:**

```kotlin
// Performance Monitor
class PerformanceMonitor(private val application: Application) {
    private var appLaunchStart: Long = 0
    private var firstFrameRendered: Long = 0

    init {
        appLaunchStart = System.currentTimeMillis()

        // First frame callback
        application.registerActivityLifecycleCallbacks(
            object : Application.ActivityLifecycleCallbacks {
                override fun onActivityResumed(activity: Activity) {
                    if (firstFrameRendered == 0L) {
                        measureFirstFrame(activity)
                    }
                }

                // ... other lifecycle methods
            }
        )
    }

    private fun measureFirstFrame(activity: Activity) {
        activity.window.decorView.viewTreeObserver.addOnDrawListener {
            if (firstFrameRendered == 0L) {
                firstFrameRendered = System.currentTimeMillis()

                val coldStartTime = firstFrameRendered - appLaunchStart

                // Отправить метрику
                AttributionSDK.trackPerformance(
                    metric = "app_cold_start",
                    value = coldStartTime.toDouble(),
                    attributes = mapOf(
                        "device_model" to Build.MODEL,
                        "os_version" to Build.VERSION.SDK_INT.toString(),
                        "app_version" to BuildConfig.VERSION_NAME
                    )
                )
            }
        }
    }

    // Измерение Time to Interactive
    private fun measureTimeToInteractive() {
        val handler = Handler(Looper.getMainLooper())

        // Проверяем что UI thread не заблокирован
        handler.post {
            val ttiTime = System.currentTimeMillis() - appLaunchStart

            AttributionSDK.trackPerformance(
                metric = "app_time_to_interactive",
                value = ttiTime.toDouble(),
                attributes = emptyMap()
            )
        }
    }
}
```

#### 2.1.2. Производительность экранов (Screen Performance)

```yaml
Метрики для каждого экрана:

Load Time (время загрузки):
  - From: Начало навигации (tap button)
  - To: Экран полностью отрисован
  - Компоненты:
    - Navigation time (переход)
    - Data fetching time (API calls)
    - Rendering time (UI creation)
    - Image loading time (если есть)

Render Performance:
  - FPS (frames per second):
    - Target: 60 FPS (16.67ms per frame)
    - Good: 55+ FPS
    - Poor: <50 FPS

  - Dropped frames:
    - Count: Сколько кадров пропущено
    - Percentage: % от total frames

  - Jank detection:
    - Jank = frame took >16.67ms (missed deadline)
    - Severe jank = frame took >32ms (2+ frames dropped)
    - Count janky frames
    - Total jank time

Scroll Performance:
  - FPS during scroll (должно быть 60)
  - Scroll responsiveness (задержка касания)
  - Hitches (подёргивания при скролле)

Memory Usage:
  - Memory allocated on screen load
  - Peak memory during session
  - Memory leaks (memory not freed after leaving screen)
```

**Implementation:**

```swift
// Screen Performance Tracker (iOS)
class ScreenPerformanceTracker {
    private var screenName: String
    private var loadStartTime: Date?
    private var displayLink: CADisplayLink?
    private var frameCount: Int = 0
    private var droppedFrames: Int = 0
    private var lastFrameTime: CFTimeInterval = 0

    init(screenName: String) {
        self.screenName = screenName
        self.loadStartTime = Date()

        // Start FPS monitoring
        startFPSMonitoring()
    }

    func onScreenRendered() {
        guard let startTime = loadStartTime else { return }

        let loadTime = Date().timeIntervalSince(startTime)

        AttributionSDK.shared.trackPerformance(
            metric: "screen_load_time",
            value: loadTime * 1000,
            attributes: [
                "screen_name": screenName
            ]
        )
    }

    private func startFPSMonitoring() {
        displayLink = CADisplayLink(target: self, selector: #selector(displayLinkTick))
        displayLink?.add(to: .main, forMode: .common)
    }

    @objc private func displayLinkTick(displayLink: CADisplayLink) {
        frameCount += 1

        let currentTime = displayLink.timestamp
        let frameDuration = currentTime - lastFrameTime

        // Идеальное время для 60 FPS = 16.67ms
        let idealFrameDuration = 1.0 / 60.0

        // Если frame занял >16.67ms → dropped frame
        if frameDuration > idealFrameDuration * 1.5 {
            droppedFrames += 1
        }

        lastFrameTime = currentTime

        // Отправляем метрики каждые 5 секунд
        if frameCount % 300 == 0 {  // 300 frames ≈ 5 seconds
            reportFPS()
        }
    }

    private func reportFPS() {
        let fps = Double(frameCount) / (Date().timeIntervalSince(loadStartTime ?? Date()))
        let droppedPercentage = Double(droppedFrames) / Double(frameCount) * 100.0

        AttributionSDK.shared.trackPerformance(
            metric: "screen_fps",
            value: fps,
            attributes: [
                "screen_name": screenName,
                "dropped_frames": String(droppedFrames),
                "dropped_percentage": String(format: "%.2f", droppedPercentage)
            ]
        )

        // Reset counters
        frameCount = 0
        droppedFrames = 0
    }

    deinit {
        displayLink?.invalidate()
    }
}

// Usage
class MyViewController: UIViewController {
    private var performanceTracker: ScreenPerformanceTracker?

    override func viewDidLoad() {
        super.viewDidLoad()

        performanceTracker = ScreenPerformanceTracker(screenName: "ProductDetails")
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        performanceTracker?.onScreenRendered()
    }
}
```

#### 2.1.3. Память (Memory)

```yaml
Метрики памяти:

Current Memory Usage:
  - Текущее потребление RAM (MB)
  - Breakdown: App, System, Graphics, Other

Peak Memory:
  - Максимальное потребление за сессию
  - Per screen (какой экран жрёт больше всего)

Memory Warnings:
  - iOS: didReceiveMemoryWarning count
  - Android: onLowMemory, onTrimMemory callbacks

Memory Leaks:
  - Objects not deallocated after screen close
  - Retain cycles
  - Leaked view controllers

OOM (Out of Memory) Crashes:
  - Крэш из-за нехватки памяти
  - Memory limit на момент крэша
  - Stack trace

GC (Garbage Collection) Pauses (Android):
  - Frequency: Как часто GC запускается
  - Duration: Сколько времени занимает
  - Impact: Влияние на FPS (UI freeze)
```

**Implementation:**

```swift
// Memory Monitor (iOS)
class MemoryMonitor {
    private var timer: Timer?

    init() {
        // Мониторим каждые 10 секунд
        timer = Timer.scheduledTimer(withTimeInterval: 10.0, repeats: true) { _ in
            self.reportMemoryUsage()
        }

        // Слушаем memory warnings
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(didReceiveMemoryWarning),
            name: UIApplication.didReceiveMemoryWarningNotification,
            object: nil
        )
    }

    private func reportMemoryUsage() {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4

        let kerr: kern_return_t = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }

        if kerr == KERN_SUCCESS {
            let usedMemoryMB = Double(info.resident_size) / 1024.0 / 1024.0

            AttributionSDK.shared.trackPerformance(
                metric: "memory_usage",
                value: usedMemoryMB,
                attributes: [
                    "device_model": UIDevice.current.model,
                    "available_memory": String(ProcessInfo.processInfo.physicalMemory / 1024 / 1024)
                ]
            )
        }
    }

    @objc private func didReceiveMemoryWarning() {
        AttributionSDK.shared.trackPerformance(
            metric: "memory_warning",
            value: 1.0,
            attributes: [
                "timestamp": ISO8601DateFormatter().string(from: Date())
            ]
        )
    }
}
```

#### 2.1.4. CPU и батарея

```yaml
CPU метрики:

CPU Usage:
  - Total CPU usage (%)
  - Per thread:
    - Main thread (UI thread)
    - Background threads
    - Network threads
  - Per process component

CPU Thermal State:
  - Normal: Нормальная температура
  - Fair: Начинает нагреваться
  - Serious: Сильный нагрев
  - Critical: Критический перегрев (throttling)

Батарея метрики:

Battery Drain:
  - Battery level change per hour (%)
  - Estimated drain rate (mAh/hour)

Energy Impact:
  - iOS: Energy Impact API
  - Android: Battery Historian data

Charging State:
  - Charging, Not charging, Full
  - Charging method: USB, Wireless, Fast charge
```

---

### 2.2. Сетевая производительность (Network Performance)

#### 2.2.1. HTTP запросы

```yaml
Детальные метрики для каждого HTTP запроса:

Timing Breakdown:
  1. DNS Lookup Time:
     - Сколько времени заняло разрешение домена
     - Target: <50ms
     - Issue: >200ms (DNS проблемы)

  2. TCP Connection Time:
     - Время установки TCP соединения
     - Target: <100ms
     - Issue: >500ms (сетевые проблемы)

  3. TLS Handshake Time:
     - Время SSL/TLS handshake
     - Target: <200ms
     - Issue: >1s (проблемы с сертификатами)

  4. Time to First Byte (TTFB):
     - От отправки запроса до первого байта ответа
     - Target: <200ms (API в том же регионе)
     - Issue: >1s (медленный сервер)

  5. Content Download Time:
     - Время скачивания тела ответа
     - Depends on: Response size, bandwidth

  6. Total Request Time:
     - Сумма всех выше
     - Target: <1s для большинства API
     - Issue: >3s (плохой UX)

Response Size:
  - Request size (bytes)
  - Response size (bytes)
  - Compression: Gzip, Brotli

Success Metrics:
  - Success rate: % успешных запросов (2xx, 3xx)
  - Error rate: % ошибок (4xx, 5xx, timeouts)
  - Timeout rate: % запросов с timeout

  Breakdown by:
    - Endpoint (какие API медленные)
    - HTTP method (GET, POST, PUT, DELETE)
    - Status code (200, 404, 500, etc.)

Retry Behavior:
  - Retry count: Сколько раз повторяли запрос
  - Final result: Success/Failure после retry
```

**Implementation:**

```swift
// Network Performance Monitor (iOS)
class NetworkPerformanceMonitor: NSObject, URLSessionTaskDelegate {

    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        didFinishCollecting metrics: URLSessionTaskMetrics
    ) {
        guard let transactionMetrics = metrics.transactionMetrics.first else { return }

        let timings = extractTimings(from: transactionMetrics)

        AttributionSDK.shared.trackPerformance(
            metric: "network_request",
            value: timings.totalTime,
            attributes: [
                "url": task.originalRequest?.url?.absoluteString ?? "",
                "method": task.originalRequest?.httpMethod ?? "",
                "status_code": String((task.response as? HTTPURLResponse)?.statusCode ?? 0),
                "dns_time": String(timings.dnsTime),
                "tcp_time": String(timings.tcpTime),
                "tls_time": String(timings.tlsTime),
                "ttfb": String(timings.ttfb),
                "download_time": String(timings.downloadTime),
                "request_size": String(task.countOfBytesSent),
                "response_size": String(task.countOfBytesReceived)
            ]
        )
    }

    private func extractTimings(from metrics: URLSessionTaskTransactionMetrics) -> NetworkTimings {
        let fetchStart = metrics.fetchStartDate!
        let domainLookupStart = metrics.domainLookupStartDate
        let domainLookupEnd = metrics.domainLookupEndDate
        let connectStart = metrics.connectStartDate
        let secureConnectionStart = metrics.secureConnectionStartDate
        let secureConnectionEnd = metrics.secureConnectionEndDate
        let connectEnd = metrics.connectEndDate
        let requestStart = metrics.requestStartDate
        let responseStart = metrics.responseStartDate
        let responseEnd = metrics.responseEndDate!

        var timings = NetworkTimings()

        // DNS time
        if let start = domainLookupStart, let end = domainLookupEnd {
            timings.dnsTime = end.timeIntervalSince(start) * 1000
        }

        // TCP connection time
        if let start = connectStart, let end = connectEnd {
            timings.tcpTime = end.timeIntervalSince(start) * 1000
        }

        // TLS handshake time
        if let start = secureConnectionStart, let end = secureConnectionEnd {
            timings.tlsTime = end.timeIntervalSince(start) * 1000
        }

        // TTFB (Time to First Byte)
        if let start = requestStart, let end = responseStart {
            timings.ttfb = end.timeIntervalSince(start) * 1000
        }

        // Download time
        if let start = responseStart {
            timings.downloadTime = responseEnd.timeIntervalSince(start) * 1000
        }

        // Total time
        timings.totalTime = responseEnd.timeIntervalSince(fetchStart) * 1000

        return timings
    }
}

struct NetworkTimings {
    var dnsTime: Double = 0
    var tcpTime: Double = 0
    var tlsTime: Double = 0
    var ttfb: Double = 0
    var downloadTime: Double = 0
    var totalTime: Double = 0
}
```

#### 2.2.2. Качество соединения

```yaml
Connection Type:
  - WiFi (802.11a/b/g/n/ac/ax)
  - Cellular:
    - 5G (mmWave, sub-6GHz)
    - 4G/LTE
    - 3G
    - 2G
  - Offline

Network Quality Metrics:

Bandwidth (пропускная способность):
  - Download speed: Mbps
  - Upload speed: Mbps
  - Measured through: Speed test или historical API performance

Latency (задержка):
  - Ping time: ms
  - Target: <50ms (excellent), <100ms (good), >200ms (poor)

Packet Loss:
  - Percentage: %
  - Target: <1% (good), >5% (poor network)

Jitter (нестабильность):
  - Variation in latency
  - Target: <10ms (stable), >50ms (unstable)

Signal Strength:
  - WiFi: RSSI (dBm)
  - Cellular: Signal bars (0-5)
```

**Implementation:**

```swift
// Network Quality Monitor
import Network

class NetworkQualityMonitor {
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")

    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            self?.handlePathUpdate(path)
        }
        monitor.start(queue: queue)
    }

    private func handlePathUpdate(_ path: NWPath) {
        var connectionType = "unknown"
        var connectionQuality = "unknown"

        // Определяем тип соединения
        if path.usesInterfaceType(.wifi) {
            connectionType = "wifi"
        } else if path.usesInterfaceType(.cellular) {
            connectionType = "cellular"
            connectionQuality = getCellularQuality()
        } else if path.usesInterfaceType(.wiredEthernet) {
            connectionType = "ethernet"
        }

        // Статус соединения
        let isConnected = path.status == .satisfied
        let isExpensive = path.isExpensive  // Cellular
        let isConstrained = path.isConstrained  // Low Data Mode

        AttributionSDK.shared.trackPerformance(
            metric: "network_status",
            value: isConnected ? 1.0 : 0.0,
            attributes: [
                "connection_type": connectionType,
                "connection_quality": connectionQuality,
                "is_expensive": String(isExpensive),
                "is_constrained": String(isConstrained)
            ]
        )

        // Измеряем latency
        measureLatency()
    }

    private func getCellularQuality() -> String {
        // iOS doesn't expose detailed cellular info, but we can infer from CTTelephonyNetworkInfo
        let networkInfo = CTTelephonyNetworkInfo()

        if let radioAccessTechnology = networkInfo.serviceCurrentRadioAccessTechnology?.values.first {
            switch radioAccessTechnology {
            case CTRadioAccessTechnologyNRNSA, CTRadioAccessTechnologyNR:
                return "5g"
            case CTRadioAccessTechnologyLTE:
                return "4g"
            case CTRadioAccessTechnologyWCDMA, CTRadioAccessTechnologyHSDPA, CTRadioAccessTechnologyHSUPA:
                return "3g"
            case CTRadioAccessTechnologyEdge, CTRadioAccessTechnologyGPRS:
                return "2g"
            default:
                return "cellular_unknown"
            }
        }

        return "cellular_unknown"
    }

    private func measureLatency() {
        // Простой ping к нашему серверу
        let startTime = Date()

        let url = URL(string: "https://api.attribution.com/ping")!
        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            let latency = Date().timeIntervalSince(startTime) * 1000  // ms

            AttributionSDK.shared.trackPerformance(
                metric: "network_latency",
                value: latency,
                attributes: [:]
            )
        }

        task.resume()
    }
}
```

---

### 2.3. User Experience метрики

#### 2.3.1. Взаимодействие (Interaction)

```yaml
Tap Response Time:
  - Время от касания кнопки до визуального feedback
  - Target: <100ms (незаметно для человека)
  - Poor: >300ms (ощутимая задержка)

Scroll Performance:
  - Scroll FPS (должно быть 60)
  - Scroll latency (задержка между swipe и движением)
  - Hitches (подёргивания)

Animation Smoothness:
  - FPS during animations
  - Dropped frames
  - Animation duration consistency

Input Lag:
  - Keyboard appearance time
  - Text input responsiveness
  - Autocomplete/suggestions delay
```

**Implementation:**

```swift
// Tap Response Time Monitor
class TapResponseMonitor {
    private var tapStartTime: Date?

    func onTapDown() {
        tapStartTime = Date()
    }

    func onTapResponse() {
        guard let startTime = tapStartTime else { return }

        let responseTime = Date().timeIntervalSince(startTime) * 1000

        AttributionSDK.shared.trackPerformance(
            metric: "tap_response_time",
            value: responseTime,
            attributes: [:]
        )

        tapStartTime = nil
    }
}

// Usage in UIButton subclass
class MonitoredButton: UIButton {
    private let monitor = TapResponseMonitor()

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)
        monitor.onTapDown()
    }

    override func sendAction(_ action: Selector, to target: Any?, for event: UIEvent?) {
        super.sendAction(action, to: target, for: event)
        monitor.onTapResponse()
    }
}
```

#### 2.3.2. Загрузка контента

```yaml
Web Vitals (для WebView или hybrid apps):

First Contentful Paint (FCP):
  - Время до появления первого контента на экране
  - Target: <1.8s (good), <3s (needs improvement), >3s (poor)

Largest Contentful Paint (LCP):
  - Время до загрузки самого большого элемента (главное изображение, видео)
  - Target: <2.5s (good), <4s (needs improvement), >4s (poor)

Cumulative Layout Shift (CLS):
  - Неожиданные сдвиги контента (раздражает пользователей)
  - Target: <0.1 (good), <0.25 (needs improvement), >0.25 (poor)

Time to First Byte (TTFB):
  - Время до получения первого байта от сервера
  - Target: <600ms (good), <1s (fair), >1s (poor)

Image Loading:
  - Time to load images
  - Progressive loading vs all-at-once
  - Lazy loading effectiveness

Video Performance:
  - Time to first frame
  - Buffering events (count, duration)
  - Bitrate adaptation
  - Stalls during playback
```

---

## 3. ОШИБКИ И СТАБИЛЬНОСТЬ

### 3.1. Crashes (Крэши)

```yaml
Crash Metrics:

Crash Rate:
  - Formula: (Sessions with crashes / Total sessions) × 100%
  - Target: <0.1% (excellent), <1% (acceptable), >2% (poor)

Crash-Free Users:
  - Formula: (Users without crashes / Total users) × 100%
  - Target: >99.9% (excellent), >99% (acceptable), <98% (poor)

Crash-Free Sessions:
  - Formula: (Sessions without crashes / Total sessions) × 100%
  - Target: >99.9%

Crash Details:
  - Exception type: NSException, Fatal signal, ANR
  - Stack trace: Полный stack trace для debugging
  - Thread: Какой thread крэшнулся (main, background)
  - Device info: Model, OS version, RAM, storage
  - App state: Foreground, background, launching
  - User action: Что пользователь делал перед крэшем

ANR (Application Not Responding) - Android:
  - Определение: UI thread заблокирован >5 секунд
  - Причина: Heavy operation на main thread
  - Stack trace: Что блокирует thread
```

**Implementation (iOS):**

```swift
// Crash Reporter
class CrashReporter {

    init() {
        // Регистрируем обработчик uncaught exceptions
        NSSetUncaughtExceptionHandler { exception in
            CrashReporter.handleException(exception)
        }

        // Регистрируем обработчик signals (SIGSEGV, SIGABRT, etc.)
        signal(SIGSEGV, signalHandler)
        signal(SIGABRT, signalHandler)
        signal(SIGILL, signalHandler)
        signal(SIGFPE, signalHandler)
        signal(SIGBUS, signalHandler)
    }

    private static func handleException(_ exception: NSException) {
        let crashReport = CrashReport(
            exceptionName: exception.name.rawValue,
            reason: exception.reason ?? "Unknown",
            stackTrace: exception.callStackSymbols,
            deviceInfo: DeviceInfo.current(),
            appInfo: AppInfo.current(),
            timestamp: Date()
        )

        // Сохраняем crash report локально (на случай если нет сети)
        saveCrashReport(crashReport)

        // Пытаемся отправить немедленно
        sendCrashReport(crashReport)
    }

    private static func saveCrashReport(_ report: CrashReport) {
        let encoder = JSONEncoder()
        if let data = try? encoder.encode(report) {
            let filename = "crash_\(Int(Date().timeIntervalSince1970)).json"
            let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                .appendingPathComponent(filename)
            try? data.write(to: url)
        }
    }

    private static func sendCrashReport(_ report: CrashReport) {
        // Отправка на сервер
        AttributionSDK.shared.trackCrash(report)
    }
}

private func signalHandler(signal: Int32) {
    // Обработка signal crashes
    let stackTrace = Thread.callStackSymbols

    let crashReport = CrashReport(
        exceptionName: "Signal \(signal)",
        reason: signalName(signal),
        stackTrace: stackTrace,
        deviceInfo: DeviceInfo.current(),
        appInfo: AppInfo.current(),
        timestamp: Date()
    )

    CrashReporter.saveCrashReport(crashReport)
}

func signalName(_ signal: Int32) -> String {
    switch signal {
    case SIGSEGV: return "SIGSEGV - Segmentation fault"
    case SIGABRT: return "SIGABRT - Abort"
    case SIGILL: return "SIGILL - Illegal instruction"
    case SIGFPE: return "SIGFPE - Floating point exception"
    case SIGBUS: return "SIGBUS - Bus error"
    default: return "Unknown signal"
    }
}

struct CrashReport: Codable {
    let exceptionName: String
    let reason: String
    let stackTrace: [String]
    let deviceInfo: DeviceInfo
    let appInfo: AppInfo
    let timestamp: Date
}

struct DeviceInfo: Codable {
    let model: String
    let osVersion: String
    let totalMemory: UInt64
    let availableMemory: UInt64
    let diskSpace: UInt64

    static func current() -> DeviceInfo {
        return DeviceInfo(
            model: UIDevice.current.model,
            osVersion: UIDevice.current.systemVersion,
            totalMemory: ProcessInfo.processInfo.physicalMemory,
            availableMemory: getAvailableMemory(),
            diskSpace: getAvailableDiskSpace()
        )
    }
}
```

### 3.2. Non-Fatal Errors

```yaml
Network Errors:
  - Timeout errors (count, endpoints)
  - Connection failed (count, reason)
  - SSL/TLS errors (certificate issues)
  - HTTP errors (4xx, 5xx по endpoints)

API Errors:
  - Rate limiting (429 Too Many Requests)
  - Authentication failures (401)
  - Server errors (500, 502, 503)
  - Retry count and final result

Database Errors:
  - SQLite errors
  - Realm/Core Data errors
  - Corruption detection

JavaScript Errors (для React Native, Flutter web):
  - Unhandled promise rejections
  - Runtime errors
  - Type errors

Handled Exceptions:
  - Caught exceptions that didn't crash app
  - But indicate problems (for debugging)
```

---

## 4. BUSINESS IMPACT CORRELATION

### 4.1. Производительность → Retention

```yaml
Анализ корреляций:

App Launch Time → Day 1 Retention:
  Hypothesis: Быстрый запуск → больше пользователей возвращаются

  Segmentation:
    - Fast launch (<2s): D1 retention = 45%
    - Medium launch (2-4s): D1 retention = 38%
    - Slow launch (>4s): D1 retention = 28%

  Insight: Ускорение на 1 секунду → +3.5% D1 retention
  Business Impact: For 100K installs/month → +3,500 retained users

FPS Performance → D7 Retention:
  Hypothesis: Плавный UI → лучший UX → выше retention

  Segmentation:
    - Smooth (FPS 55-60): D7 retention = 32%
    - Medium (FPS 45-55): D7 retention = 26%
    - Janky (FPS <45): D7 retention = 18%

  Insight: 60 FPS vs 45 FPS → +14% D7 retention
  Business Impact: $$$

Crash Rate → Retention:
  - 0 crashes: D7 retention = 35%
  - 1 crash: D7 retention = 22% (-37%)
  - 2+ crashes: D7 retention = 8% (-77%)

  Insight: One crash kills retention
```

### 4.2. Производительность → Conversion

```yaml
Correlations:

Screen Load Time → Purchase Rate:
  E-commerce example:
    - Fast load (<1s): Purchase rate = 4.2%
    - Medium load (1-3s): Purchase rate = 3.1%
    - Slow load (>3s): Purchase rate = 1.8%

  Insight: 1 second delay → -30% conversion
  Business Impact: For $1M revenue → -$300K from slow screens

Checkout Performance → Cart Abandonment:
  - Fast checkout (<2s): Abandonment = 15%
  - Slow checkout (>5s): Abandonment = 45%

  Insight: Slow checkout → 3x more abandonment

API Response Time → User Engagement:
  - Fast API (<200ms): Avg session = 8.5 min
  - Slow API (>1s): Avg session = 4.2 min

  Insight: Slow API → 50% less engagement
```

### 4.3. Производительность → Revenue

```yaml
Gaming app example:

FPS → In-App Purchases:
  - 60 FPS: IAP rate = 5.2%
  - 45 FPS: IAP rate = 3.8%
  - 30 FPS: IAP rate = 2.1%

  Insight: Smooth gameplay → 2.5x more purchases

Load Time → ARPU:
  - Fast (<2s): ARPU = $4.50
  - Slow (>5s): ARPU = $2.10

  Insight: For 1M MAU → $2.4M revenue difference

Crash-Free Revenue:
  - Users with 0 crashes: ARPU = $5.20
  - Users with 1+ crash: ARPU = $1.80

  Insight: Crashes destroy monetization
```

---

## 5. ANALYTICS DASHBOARD

### 5.1. Performance Overview Dashboard

```yaml
Компоненты дашборда:

Health Score (0-100):
  Formula: Weighted average of:
    - App performance (30%): Launch time, FPS, memory
    - Network performance (20%): API latency, success rate
    - Stability (30%): Crash rate, error rate
    - User experience (20%): Tap response, scroll smoothness

  Display:
    - 90-100: Excellent (зелёный)
    - 70-90: Good (жёлтый)
    - 50-70: Fair (оранжевый)
    - <50: Poor (красный)

Real-Time Metrics:
  - Current active users
  - Avg FPS (last 5 min)
  - API success rate (last hour)
  - Crash rate (last 24h)

Trend Charts (последние 7/30 дней):
  - App launch time trend
  - Crash rate trend
  - API latency trend
  - Memory usage trend

Alerts & Anomalies:
  - Spike in crash rate (>2x baseline)
  - API latency degradation (>50% slower)
  - Memory leak detected
  - New error patterns
```

**Визуализация:**

```typescript
// Performance Overview Dashboard (Svelte)
<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart } from 'chart.js';

  let healthScore = $state(0);
  let metrics = $state({
    launchTime: 0,
    fps: 0,
    crashRate: 0,
    apiLatency: 0
  });

  onMount(async () => {
    // Fetch health score
    const response = await fetch('/api/performance/health');
    const data = await response.json();

    healthScore = data.score;
    metrics = data.metrics;

    // Render charts
    renderHealthScore();
    renderTrendCharts();
  });

  function renderHealthScore() {
    // Gauge chart for health score
    const canvas = document.getElementById('health-score-chart');

    new Chart(canvas, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [healthScore, 100 - healthScore],
          backgroundColor: [
            healthScore >= 90 ? '#10b981' : // green
            healthScore >= 70 ? '#fbbf24' : // yellow
            healthScore >= 50 ? '#f97316' : // orange
            '#ef4444' // red
          ],
          borderWidth: 0
        }]
      },
      options: {
        circumference: 180,
        rotation: -90,
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  }
</script>

<div class="performance-dashboard">
  <!-- Health Score -->
  <div class="health-score-card">
    <h2>App Health Score</h2>
    <canvas id="health-score-chart"></canvas>
    <div class="score-value">{healthScore}</div>
    <p class="score-label">
      {healthScore >= 90 ? 'Excellent' :
       healthScore >= 70 ? 'Good' :
       healthScore >= 50 ? 'Fair' : 'Poor'}
    </p>
  </div>

  <!-- Key Metrics -->
  <div class="metrics-grid">
    <div class="metric-card">
      <h3>App Launch</h3>
      <div class="metric-value">{metrics.launchTime}ms</div>
      <div class="metric-trend">↓ 12% vs last week</div>
    </div>

    <div class="metric-card">
      <h3>Avg FPS</h3>
      <div class="metric-value">{metrics.fps}</div>
      <div class="metric-trend">↑ 5% vs last week</div>
    </div>

    <div class="metric-card">
      <h3>Crash Rate</h3>
      <div class="metric-value">{metrics.crashRate}%</div>
      <div class="metric-trend warning">↑ 0.2% vs last week</div>
    </div>

    <div class="metric-card">
      <h3>API Latency</h3>
      <div class="metric-value">{metrics.apiLatency}ms</div>
      <div class="metric-trend">↓ 8% vs last week</div>
    </div>
  </div>

  <!-- Alerts -->
  <div class="alerts-section">
    <h3>Active Alerts</h3>
    <div class="alert warning">
      <span class="alert-icon">⚠️</span>
      <div>
        <strong>Crash Rate Spike</strong>
        <p>iOS 17.4 users experiencing 3x more crashes. Investigate.</p>
      </div>
    </div>
  </div>
</div>

<style>
  .performance-dashboard {
    padding: 24px;
  }

  .health-score-card {
    background: white;
    border-radius: 12px;
    padding: 32px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .score-value {
    font-size: 64px;
    font-weight: bold;
    margin-top: -80px;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-top: 24px;
  }

  .metric-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  }

  .metric-value {
    font-size: 32px;
    font-weight: bold;
    margin-top: 8px;
  }

  .metric-trend {
    color: #10b981;
    font-size: 14px;
    margin-top: 4px;
  }

  .metric-trend.warning {
    color: #ef4444;
  }
</style>
```

### 5.2. Screen Performance Dashboard

```yaml
Для каждого экрана приложения:

Metrics Table:
  Columns:
    - Screen Name
    - Avg Load Time
    - P95 Load Time
    - Avg FPS
    - Dropped Frames %
    - Memory Usage
    - Impact Score (how much this screen affects retention)

  Sorting: By Impact Score (desc)
  Filtering: By app version, OS, device

Detail View (click screen):
  - Load time distribution (histogram)
  - FPS over time (line chart)
  - Memory usage (area chart)
  - Top errors on this screen
  - User journey: Which screens users visit before/after
  - Business impact: Conversion rate on this screen

Comparison Mode:
  - Compare 2 app versions side-by-side
  - Compare iOS vs Android
  - Compare device tiers (high-end vs low-end)
```

### 5.3. Network Performance Dashboard

```yaml
API Endpoints Table:
  Columns:
    - Endpoint (URL)
    - Request Count
    - Avg Latency
    - P95 Latency
    - P99 Latency
    - Success Rate
    - Error Rate
    - Avg Response Size

  Sorting: By Error Rate (desc) or Latency (desc)

Waterfall Chart:
  - Visual timeline of request
  - DNS → TCP → TLS → TTFB → Download
  - Identify bottlenecks

Geo Map:
  - Latency heatmap по странам
  - Click country → see detailed breakdown

Network Quality Distribution:
  - Pie chart: WiFi (60%), 4G (30%), 3G (8%), 2G (2%)
  - Performance by network type
```

### 5.4. Business Impact Dashboard

```yaml
Performance → Revenue Correlation:

  Scatter Plot:
    - X-axis: App launch time
    - Y-axis: Day 1 retention
    - Each dot = cohort (1000s of users)
    - Trendline shows correlation

  Insights:
    - "Users with <2s launch have 15% higher retention"
    - "Estimated revenue impact: +$45K/month"
    - "Recommendation: Prioritize launch time optimization"

ROI Calculator:
  Input:
    - Current metric value (e.g. launch time = 3.5s)
    - Target metric value (e.g. launch time = 2s)
    - Monthly installs

  Output:
    - Expected retention improvement: +8%
    - Expected revenue increase: +$38K/month
    - Development cost: $20K (one-time)
    - ROI: 190% in first year
```

---

*[Документ продолжается с секциями 6-8: Implementation Guide, SDK API Reference, Privacy & Security]*

---

## 6. IMPLEMENTATION ROADMAP

### Phase 1: Core Performance Monitoring (Months 1-2)

```yaml
Month 1:
  ✓ App launch time tracking
  ✓ Screen load time tracking
  ✓ FPS monitoring
  ✓ Memory usage tracking
  ✓ Basic crash reporting

Month 2:
  ✓ Network performance monitoring
  ✓ API latency breakdown
  ✓ Error tracking
  ✓ Basic dashboard (overview)
```

### Phase 2: Advanced Metrics (Months 3-4)

```yaml
Month 3:
  ✓ User experience metrics (tap response, scroll)
  ✓ Battery monitoring
  ✓ CPU tracking
  ✓ Network quality detection

Month 4:
  ✓ Business impact correlation
  ✓ Automated insights (ML)
  ✓ Anomaly detection
  ✓ Advanced dashboards
```

### Phase 3: Optimization Recommendations (Months 5-6)

```yaml
Month 5:
  ✓ AI-powered performance recommendations
  ✓ A/B testing integration
  ✓ Release monitoring
  ✓ Regression detection

Month 6:
  ✓ Auto-optimization suggestions
  ✓ ROI calculator
  ✓ Custom alerts
  ✓ Full documentation
```

---

## 7. EXPECTED BUSINESS IMPACT

### For Attribution Platform (Our Business)

```yaml
Competitive Differentiation:
  - Only attribution platform with built-in performance monitoring
  - 2-in-1 solution (attribution + performance)
  - Higher perceived value

Pricing Impact:
  - Can charge $2-3K more per month
  - "Performance Monitoring" tier: +$2K/month
  - For 1,000 customers: +$2M ARR

Customer Retention:
  - Sticky feature (harder to switch away)
  - More value → less churn
  - Estimated churn reduction: 20-30%

Upsell Opportunities:
  - Free tier: Basic attribution only
  - Paid tier: + Performance monitoring
  - Enterprise tier: + AI recommendations
```

### For Our Customers

```yaml
Performance Improvements:
  - Identify and fix slow screens → +15% retention
  - Optimize app launch → +10% D1 retention
  - Fix crashes → +20% stability

Revenue Impact:
  - Gaming app (1M MAU): +$2.4M/year from better performance
  - E-commerce (500K MAU): +$1.8M/year from faster checkout
  - SaaS (200K MAU): +$600K/year from better UX

Cost Savings:
  - No need for Firebase Performance ($5K/month saved)
  - No need for New Relic ($10K/month saved)
  - Total savings: $15K/month = $180K/year
```

---

## 8. CONCLUSION

**Summary:**

Мы расширяем наш Attribution SDK для сбора **технической аналитики** о производительности приложения:

### Собираемые метрики:

1. **App Performance**: Launch time, FPS, memory, CPU, battery
2. **Network Performance**: API latency, TTFB, success rate, connection quality
3. **User Experience**: Tap response, scroll smoothness, animations
4. **Errors & Stability**: Crashes, ANRs, errors, stack traces
5. **Business Impact**: Корреляция производительности → retention → revenue

### Конкурентное преимущество:

- **Всё-в-одном**: Attribution + Performance в одном SDK
- **Одна панель**: Unified view of marketing + app health
- **Дешевле**: $8-12K vs $15K (AppsFlyer + Firebase)
- **Умнее**: AI-powered insights, auto-recommendations

### Бизнес-ценность:

**Для нас (платформа):**
- Дифференциация: Уникальная фича
- Выше цена: +$2K/month per customer
- Меньше churn: Более sticky продукт
- Больше ARR: +$2M/year (1,000 customers)

**Для клиентов:**
- Лучше performance → выше retention (+15%)
- Выше retention → больше revenue (+$2-3M/year для крупных app)
- Экономия: Не нужны другие SDK ($180K/year)
- Проще: Один SDK вместо 2-3

**Next Steps:**
1. Review документ
2. Prioritize metrics (start with critical ones)
3. Begin SDK development (iOS first, then Android)
4. Beta testing with 5-10 customers
5. Full launch in 6 months

Это **революционное** улучшение нашей платформы!

