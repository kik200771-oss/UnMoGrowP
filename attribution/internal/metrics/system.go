package metrics

import (
	"runtime"
	"sync/atomic"
	"time"
)

// SystemMetrics holds comprehensive system metrics
type SystemMetrics struct {
	// API Performance
	RequestCount       uint64 `json:"request_count"`
	ErrorCount         uint64 `json:"error_count"`
	TotalResponseTime  uint64 `json:"total_response_time_ms"`

	// System Performance
	GoRoutines         int     `json:"goroutines"`
	MemoryUsageMB      float64 `json:"memory_usage_mb"`
	MemoryAllocMB      float64 `json:"memory_alloc_mb"`
	GCCount            uint32  `json:"gc_count"`

	// Service Info
	UptimeSeconds      int64   `json:"uptime_seconds"`
	StartTime          int64   `json:"start_time"`
	Version            string  `json:"version"`

	// Custom Business Metrics
	EventsProcessed    uint64  `json:"events_processed"`
	CustomersServed    uint64  `json:"customers_served"`
	CacheHitRate       float64 `json:"cache_hit_rate"`

	// Performance Averages
	AverageResponseMs  float64 `json:"average_response_ms"`
	RequestsPerSecond  float64 `json:"requests_per_second"`
	ErrorRate          float64 `json:"error_rate"`
}

// MetricsCollector collects and manages system metrics
type MetricsCollector struct {
	startTime       time.Time
	requestCount    uint64
	errorCount      uint64
	totalResponseMs uint64
	eventsProcessed uint64
	customersServed uint64
	cacheHits       uint64
	cacheMisses     uint64
}

// NewMetricsCollector creates a new metrics collector
func NewMetricsCollector() *MetricsCollector {
	return &MetricsCollector{
		startTime: time.Now(),
	}
}

// RecordRequest records a request with response time
func (m *MetricsCollector) RecordRequest(responseTimeMs uint64) {
	atomic.AddUint64(&m.requestCount, 1)
	atomic.AddUint64(&m.totalResponseMs, responseTimeMs)
}

// RecordError records an error
func (m *MetricsCollector) RecordError() {
	atomic.AddUint64(&m.errorCount, 1)
}

// RecordEventProcessed records processed events
func (m *MetricsCollector) RecordEventProcessed(count uint64) {
	atomic.AddUint64(&m.eventsProcessed, count)
}

// RecordCustomerServed records served customers
func (m *MetricsCollector) RecordCustomerServed() {
	atomic.AddUint64(&m.customersServed, 1)
}

// RecordCacheHit records cache hits
func (m *MetricsCollector) RecordCacheHit() {
	atomic.AddUint64(&m.cacheHits, 1)
}

// RecordCacheMiss records cache misses
func (m *MetricsCollector) RecordCacheMiss() {
	atomic.AddUint64(&m.cacheMisses, 1)
}

// GetMetrics returns current system metrics
func (m *MetricsCollector) GetMetrics() *SystemMetrics {
	// Get memory stats
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	// Get atomic values
	requests := atomic.LoadUint64(&m.requestCount)
	errors := atomic.LoadUint64(&m.errorCount)
	totalMs := atomic.LoadUint64(&m.totalResponseMs)
	events := atomic.LoadUint64(&m.eventsProcessed)
	customers := atomic.LoadUint64(&m.customersServed)
	hits := atomic.LoadUint64(&m.cacheHits)
	misses := atomic.LoadUint64(&m.cacheMisses)

	// Calculate derived metrics
	uptime := time.Since(m.startTime)
	uptimeSeconds := int64(uptime.Seconds())

	var avgResponseMs float64
	if requests > 0 {
		avgResponseMs = float64(totalMs) / float64(requests)
	}

	var requestsPerSecond float64
	if uptimeSeconds > 0 {
		requestsPerSecond = float64(requests) / float64(uptimeSeconds)
	}

	var errorRate float64
	if requests > 0 {
		errorRate = (float64(errors) / float64(requests)) * 100
	}

	var cacheHitRate float64
	totalCacheOps := hits + misses
	if totalCacheOps > 0 {
		cacheHitRate = (float64(hits) / float64(totalCacheOps)) * 100
	}

	return &SystemMetrics{
		// API Performance
		RequestCount:      requests,
		ErrorCount:        errors,
		TotalResponseTime: totalMs,

		// System Performance
		GoRoutines:        runtime.NumGoroutine(),
		MemoryUsageMB:     float64(memStats.Sys) / 1024 / 1024,
		MemoryAllocMB:     float64(memStats.Alloc) / 1024 / 1024,
		GCCount:           memStats.NumGC,

		// Service Info
		UptimeSeconds:     uptimeSeconds,
		StartTime:         m.startTime.Unix(),
		Version:           "v3.0.0-redis",

		// Custom Business Metrics
		EventsProcessed:   events,
		CustomersServed:   customers,
		CacheHitRate:      cacheHitRate,

		// Performance Averages
		AverageResponseMs: avgResponseMs,
		RequestsPerSecond: requestsPerSecond,
		ErrorRate:         errorRate,
	}
}

// GetHealthStatus returns health status based on metrics
func (m *MetricsCollector) GetHealthStatus() map[string]interface{} {
	metrics := m.GetMetrics()

	status := "healthy"
	issues := []string{}

	// Check error rate
	if metrics.ErrorRate > 5.0 {
		status = "degraded"
		issues = append(issues, "high_error_rate")
	}

	// Check memory usage
	if metrics.MemoryUsageMB > 500 {
		status = "degraded"
		issues = append(issues, "high_memory_usage")
	}

	// Check response time
	if metrics.AverageResponseMs > 1000 {
		status = "degraded"
		issues = append(issues, "slow_response_time")
	}

	return map[string]interface{}{
		"status": status,
		"issues": issues,
		"metrics": metrics,
	}
}

// MiddlewareMetrics returns a middleware function for automatic metrics collection
func (m *MetricsCollector) MiddlewareMetrics() func(interface{}) interface{} {
	return func(handler interface{}) interface{} {
		return func(c interface{}) error {
			start := time.Now()

			// Execute handler (this would need to be adapted based on your framework)
			err := handler.(func(interface{}) error)(c)

			// Record metrics
			responseTime := uint64(time.Since(start).Nanoseconds() / 1000000) // Convert to milliseconds
			m.RecordRequest(responseTime)

			if err != nil {
				m.RecordError()
			}

			return err
		}
	}
}

// Global metrics collector instance
var GlobalCollector = NewMetricsCollector()