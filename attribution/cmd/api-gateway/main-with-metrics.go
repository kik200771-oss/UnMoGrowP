package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"

	"github.com/unmogrowp/attribution-platform/internal/cache"
	"github.com/unmogrowp/attribution-platform/internal/database"
	"github.com/unmogrowp/attribution-platform/internal/metrics"
)

// App struct to hold dependencies
type App struct {
	db      *database.Client
	cache   *cache.RedisCache
	metrics *metrics.MetricsCollector
}

// APIResponse standardized response format with metadata
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
	Meta    *MetaInfo   `json:"meta,omitempty"`
}

// MetaInfo holds metadata about the response
type MetaInfo struct {
	CacheHit     bool   `json:"cache_hit,omitempty"`
	ResponseTime string `json:"response_time,omitempty"`
	Source       string `json:"source,omitempty"`
	RequestID    string `json:"request_id,omitempty"`
}

func main() {
	log.Println("🚀 UnMoGrowP Attribution Platform API (Metrics + Redis Edition) starting...")

	// Initialize metrics collector
	metricsCollector := metrics.NewMetricsCollector()

	// Initialize database client
	dbClient, err := database.NewClient()
	if err != nil {
		log.Printf("ClickHouse connection failed, running in fallback mode: %v", err)
	} else {
		log.Printf("✅ Connected to ClickHouse successfully")
	}

	// Initialize Redis cache
	redisCache, err := cache.NewRedisCache()
	if err != nil {
		log.Printf("Redis connection failed, running without cache: %v", err)
	} else {
		log.Printf("✅ Connected to Redis cache successfully")
	}

	// Create app with dependencies
	app := &App{
		db:      dbClient,
		cache:   redisCache,
		metrics: metricsCollector,
	}

	// Initialize Fiber app with enhanced config
	fiberApp := fiber.New(fiber.Config{
		AppName:      "UnMoGrowP Attribution Platform v3.0.0-metrics",
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
		ErrorHandler: func(c fiber.Ctx, err error) error {
			app.metrics.RecordError()
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(APIResponse{
				Success: false,
				Error:   err.Error(),
			})
		},
	})

	// Middleware
	fiberApp.Use(recover.New())
	fiberApp.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))
	fiberApp.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path} ${ip} ${user-agent}\n",
	}))

	// Add metrics middleware
	fiberApp.Use(app.metricsMiddleware)

	// Health and system endpoints
	fiberApp.Get("/health", app.healthCheck)
	fiberApp.Get("/metrics", app.getSystemMetrics)
	fiberApp.Get("/metrics/detailed", app.getDetailedMetrics)

	// API v1 routes
	v1 := fiberApp.Group("/api/v1")

	// Dashboard endpoints
	v1.Get("/dashboard/stats", app.getDashboardStats)

	// Cache management
	v1.Get("/cache/stats", app.getCacheStats)
	v1.Delete("/cache/invalidate", app.invalidateCache)

	// Customer endpoints
	v1.Get("/customers", app.getCustomers)
	v1.Get("/customers/:id", app.getCustomer)

	// Event tracking endpoints
	v1.Post("/events", app.trackEvent)
	v1.Post("/events/batch", app.trackBatchEvents)

	// Analytics endpoints
	v1.Get("/analytics/:customer_id", app.getAnalytics)
	v1.Get("/attribution/:customer_id", app.getAttribution)

	// Start server
	log.Printf("🚀 UnMoGrowP Attribution Platform API (Metrics + Redis Edition) starting on port 8081")

	// Start server in goroutine
	go func() {
		if err := fiberApp.Listen(":8081"); err != nil {
			log.Fatal("Server failed to start:", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Server shutting down...")

	// Shutdown with timeout
	if err := fiberApp.ShutdownWithTimeout(10 * time.Second); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server shutdown complete")
}

// Metrics middleware to track requests automatically
func (app *App) metricsMiddleware(c fiber.Ctx) error {
	start := time.Now()

	// Continue to next handler
	err := c.Next()

	// Record metrics
	responseTime := uint64(time.Since(start).Nanoseconds() / 1000000) // Convert to milliseconds
	app.metrics.RecordRequest(responseTime)

	if err != nil {
		app.metrics.RecordError()
	}

	return err
}

// Health check with enhanced metrics
func (app *App) healthCheck(c fiber.Ctx) error {
	start := time.Now()

	healthData := app.metrics.GetHealthStatus()

	// Check database
	dbStatus := "healthy"
	dbError := ""
	if app.db != nil {
		if err := app.db.HealthCheck(); err != nil {
			dbStatus = "fallback_mode"
			dbError = err.Error()
		}
	} else {
		dbStatus = "no_connection"
	}

	// Check cache
	ctx := context.Background()
	cacheStatus := "healthy"
	cacheError := ""
	if app.cache != nil {
		if err := app.cache.HealthCheck(ctx); err != nil {
			cacheStatus = "unavailable"
			cacheError = err.Error()
		}
	} else {
		cacheStatus = "no_connection"
	}

	// Combine health data
	healthData["database"] = map[string]interface{}{
		"status": dbStatus,
		"error":  dbError,
	}
	healthData["cache"] = map[string]interface{}{
		"status": cacheStatus,
		"error":  cacheError,
	}
	healthData["service"] = "UnMoGrowP Attribution Platform"
	healthData["version"] = "v3.0.0-metrics"
	healthData["timestamp"] = time.Now().Unix()

	return c.JSON(APIResponse{
		Success: true,
		Data:    healthData,
		Meta: &MetaInfo{
			ResponseTime: time.Since(start).String(),
			Source:       "health_check",
		},
	})
}

// Get system metrics
func (app *App) getSystemMetrics(c fiber.Ctx) error {
	start := time.Now()
	metrics := app.metrics.GetMetrics()

	return c.JSON(APIResponse{
		Success: true,
		Data:    metrics,
		Meta: &MetaInfo{
			ResponseTime: time.Since(start).String(),
			Source:       "metrics",
		},
	})
}

// Get detailed system metrics with additional runtime info
func (app *App) getDetailedMetrics(c fiber.Ctx) error {
	start := time.Now()
	metrics := app.metrics.GetMetrics()

	// Add additional system information
	detailedMetrics := map[string]interface{}{
		"system_metrics": metrics,
		"environment": map[string]interface{}{
			"go_version": "1.21",
			"platform":   "windows/amd64",
		},
	}

	// Add cache stats if available
	if app.cache != nil {
		ctx := context.Background()
		if cacheStats, err := app.cache.GetStats(ctx); err == nil {
			detailedMetrics["cache_stats"] = cacheStats
		}
	}

	return c.JSON(APIResponse{
		Success: true,
		Data:    detailedMetrics,
		Meta: &MetaInfo{
			ResponseTime: time.Since(start).String(),
			Source:       "detailed_metrics",
		},
	})
}

// Dashboard stats with caching and metrics
func (app *App) getDashboardStats(c fiber.Ctx) error {
	start := time.Now()
	ctx := context.Background()
	cacheKey := cache.DashboardStatsKey()

	var stats map[string]interface{}
	var cacheHit bool

	if app.cache != nil {
		err := app.cache.GetOrSet(ctx, cacheKey, &stats, 30*time.Second, func() (interface{}, error) {
			app.metrics.RecordCacheMiss()
			// Mock data for demonstration
			return map[string]interface{}{
				"total_events":   15000 + app.metrics.GetMetrics().EventsProcessed,
				"active_users":   2500,
				"revenue_today":  12500.50,
				"conversions":    125,
				"cache_enabled":  app.cache != nil,
				"data_source":    "cached_dashboard",
			}, nil
		})

		if err == nil {
			cacheHit = err == nil
			if cacheHit {
				app.metrics.RecordCacheHit()
			}
		}
	} else {
		// Fallback without cache
		stats = map[string]interface{}{
			"total_events":   15000,
			"active_users":   2500,
			"revenue_today":  12500.50,
			"conversions":    125,
			"cache_enabled":  false,
			"data_source":    "direct",
		}
	}

	return c.JSON(APIResponse{
		Success: true,
		Data:    stats,
		Meta: &MetaInfo{
			CacheHit:     cacheHit,
			ResponseTime: time.Since(start).String(),
			Source:       map[bool]string{true: "cache", false: "database"}[cacheHit],
		},
	})
}

// Get cache stats
func (app *App) getCacheStats(c fiber.Ctx) error {
	if app.cache == nil {
		return c.JSON(APIResponse{
			Success: true,
			Data: map[string]interface{}{
				"connected": false,
				"message":   "Redis cache not available",
			},
		})
	}

	ctx := context.Background()
	stats, err := app.cache.GetStats(ctx)
	if err != nil {
		return c.Status(500).JSON(APIResponse{
			Success: false,
			Error:   "Failed to get cache stats",
		})
	}

	return c.JSON(APIResponse{
		Success: true,
		Data:    stats,
	})
}

// Invalidate cache
func (app *App) invalidateCache(c fiber.Ctx) error {
	if app.cache == nil {
		return c.Status(503).JSON(APIResponse{
			Success: false,
			Error:   "Cache not available",
		})
	}

	pattern := c.Query("pattern", "*")
	ctx := context.Background()

	err := app.cache.InvalidatePattern(ctx, pattern)
	if err != nil {
		return c.Status(500).JSON(APIResponse{
			Success: false,
			Error:   "Failed to invalidate cache",
		})
	}

	return c.JSON(APIResponse{
		Success: true,
		Message: fmt.Sprintf("Cache invalidated for pattern: %s", pattern),
	})
}

// Get customers with metrics tracking
func (app *App) getCustomers(c fiber.Ctx) error {
	start := time.Now()
	ctx := context.Background()

	limitStr := c.Query("limit", "50")
	limit, _ := strconv.Atoi(limitStr)

	cacheKey := cache.CustomersKey(limit)
	var customers map[string]interface{}
	var cacheHit bool

	if app.cache != nil {
		err := app.cache.GetOrSet(ctx, cacheKey, &customers, 5*time.Minute, func() (interface{}, error) {
			app.metrics.RecordCacheMiss()
			// Mock customers data
			return map[string]interface{}{
				"customers": []map[string]interface{}{
					{
						"app_id":        "demo-app-1",
						"platforms":     []string{"ios", "android", "web"},
						"total_events":  850,
						"total_revenue": 8999.99,
						"total_users":   120,
					},
					{
						"app_id":        "demo-app-2",
						"platforms":     []string{"web"},
						"total_events":  400,
						"total_revenue": 3499.99,
						"total_users":   67,
					},
				},
				"limit": limit,
				"total": 2,
			}, nil
		})

		if err == nil {
			cacheHit = true
			app.metrics.RecordCacheHit()
		}
	} else {
		// Fallback data
		customers = map[string]interface{}{
			"customers": []map[string]interface{}{
				{
					"app_id":        "demo-app-1",
					"platforms":     []string{"ios", "android", "web"},
					"total_events":  850,
					"total_revenue": 8999.99,
					"total_users":   120,
				},
			},
			"limit": limit,
			"total": 1,
		}
	}

	app.metrics.RecordCustomerServed()

	return c.JSON(APIResponse{
		Success: true,
		Data:    customers,
		Meta: &MetaInfo{
			CacheHit:     cacheHit,
			ResponseTime: time.Since(start).String(),
			Source:       map[bool]string{true: "cache", false: "database"}[cacheHit],
		},
	})
}

// Get single customer
func (app *App) getCustomer(c fiber.Ctx) error {
	customerID := c.Params("id")

	return c.JSON(APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"customer_id": customerID,
			"app_id":      fmt.Sprintf("app-%s", customerID),
			"platforms":   []string{"web", "mobile"},
			"events":      500,
			"revenue":     2500.00,
		},
	})
}

// Track event
func (app *App) trackEvent(c fiber.Ctx) error {
	var event map[string]interface{}
	if err := c.Bind().JSON(&event); err != nil {
		app.metrics.RecordError()
		return c.Status(400).JSON(APIResponse{
			Success: false,
			Error:   "Invalid JSON",
		})
	}

	app.metrics.RecordEventProcessed(1)
	log.Printf("Fallback mode: Would insert 1 events to ClickHouse")

	return c.JSON(APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"event_id": "evt_" + fmt.Sprintf("%d", time.Now().UnixNano()),
			"status":   "processed",
		},
	})
}

// Track batch events
func (app *App) trackBatchEvents(c fiber.Ctx) error {
	var batch map[string]interface{}
	if err := c.Bind().JSON(&batch); err != nil {
		app.metrics.RecordError()
		return c.Status(400).JSON(APIResponse{
			Success: false,
			Error:   "Invalid JSON",
		})
	}

	events, ok := batch["events"].([]interface{})
	if !ok {
		app.metrics.RecordError()
		return c.Status(400).JSON(APIResponse{
			Success: false,
			Error:   "Invalid events format",
		})
	}

	eventCount := uint64(len(events))
	app.metrics.RecordEventProcessed(eventCount)
	log.Printf("Fallback mode: Would insert %d events to ClickHouse", eventCount)

	return c.JSON(APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"processed": len(events),
			"status":    "success",
		},
	})
}

// Get analytics
func (app *App) getAnalytics(c fiber.Ctx) error {
	customerID := c.Params("customer_id")
	log.Printf("Fallback mode: Would query analytics for customer %s", customerID)

	return c.JSON(APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"customer_id": customerID,
			"analytics": map[string]interface{}{
				"total_sessions":   150,
				"conversion_rate":  3.2,
				"average_revenue":  45.50,
				"top_channels":     []string{"organic", "social", "direct"},
			},
		},
	})
}

// Get attribution
func (app *App) getAttribution(c fiber.Ctx) error {
	customerID := c.Params("customer_id")
	log.Printf("Fallback mode: Would query attribution for customer %s", customerID)

	return c.JSON(APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"customer_id": customerID,
			"attribution": map[string]interface{}{
				"last_touch":   "social_media",
				"first_touch":  "google_search",
				"assisted_by":  []string{"email", "direct"},
				"journey_days": 7,
			},
		},
	})
}