// ============================================================================
// UnMoGrowP Attribution Platform - API Gateway
// Main entry point for attribution platform API
// ============================================================================

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
	"github.com/gofiber/fiber/v3/middleware/helmet"
)

type AttributionEvent struct {
	EventID         string                 `json:"event_id" validate:"required"`
	Timestamp       int64                  `json:"timestamp" validate:"required"`
	CustomerID      string                 `json:"customer_id" validate:"required"`
	AppID           string                 `json:"app_id" validate:"required"`
	EventType       string                 `json:"event_type" validate:"required"` // install, session, purchase, custom
	UserID          string                 `json:"user_id"`
	DeviceID        string                 `json:"device_id"`
	IP              string                 `json:"ip"`
	UserAgent       string                 `json:"user_agent"`
	Platform        string                 `json:"platform"` // ios, android, web
	Country         string                 `json:"country"`
	Campaign        string                 `json:"campaign"`
	Adgroup         string                 `json:"adgroup"`
	Creative        string                 `json:"creative"`
	Keywords        string                 `json:"keywords"`
	Revenue         float64                `json:"revenue,omitempty"`
	Currency        string                 `json:"currency,omitempty"`
	CustomParams    map[string]interface{} `json:"custom_params,omitempty"`
	AttributionData AttributionData        `json:"attribution_data,omitempty"`
}

type AttributionData struct {
	Channel          string  `json:"channel"`
	Source           string  `json:"source"`
	Medium           string  `json:"medium"`
	Content          string  `json:"content"`
	Term             string  `json:"term"`
	FirstTouch       bool    `json:"first_touch"`
	LastTouch        bool    `json:"last_touch"`
	TouchpointIndex  int     `json:"touchpoint_index"`
	AttributionScore float64 `json:"attribution_score"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type HealthStatus struct {
	Status      string            `json:"status"`
	Timestamp   int64             `json:"timestamp"`
	Version     string            `json:"version"`
	Environment string            `json:"environment"`
	Services    map[string]string `json:"services"`
}

func main() {
	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName:      "UnMoGrowP Attribution Platform",
		ErrorHandler: errorHandler,
	})

	// Middleware
	app.Use(recover.New())
	app.Use(helmet.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // In production, specify actual domains
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization,X-Requested-With,X-API-Key",
	}))
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path} ${ip} ${ua}\n",
	}))

	// Setup routes
	setupRoutes(app)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server in goroutine
	go func() {
		log.Printf("🚀 UnMoGrowP Attribution Platform API starting on port %s", port)
		if err := app.Listen(":" + port); err != nil {
			log.Fatal("Failed to start server:", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	log.Println("🔄 Gracefully shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := app.ShutdownWithContext(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("✅ Server exited")
}

func setupRoutes(app *fiber.App) {
	// API versioning
	api := app.Group("/api")
	v1 := api.Group("/v1")

	// Health check
	app.Get("/health", healthCheck)
	app.Get("/", func(c fiber.Ctx) error {
		return c.JSON(APIResponse{
			Success: true,
			Message: "UnMoGrowP Attribution Platform API v1.0.0",
			Data: map[string]interface{}{
				"version":     "1.0.0",
				"status":      "operational",
				"endpoints":   []string{"/health", "/api/v1/events", "/api/v1/attribution", "/api/v1/analytics"},
				"docs":        "/api/docs",
				"environment": getEnv("ENVIRONMENT", "development"),
			},
		})
	})

	// Attribution events ingestion
	v1.Post("/events", ingestEvents)
	v1.Get("/events/:customer_id", getCustomerEvents)

	// Attribution analysis
	v1.Get("/attribution/:customer_id", getAttributionData)
	v1.Post("/attribution/analyze", analyzeAttribution)

	// Analytics and reporting
	v1.Get("/analytics/:customer_id", getCustomerAnalytics)
	v1.Get("/analytics/:customer_id/dashboard", getCustomerDashboard)
	v1.Post("/analytics/custom", runCustomAnalysis)

	// Customer management
	v1.Get("/customers", getCustomers)
	v1.Post("/customers", createCustomer)
	v1.Get("/customers/:customer_id", getCustomer)
	v1.Put("/customers/:customer_id", updateCustomer)

	// Real-time data
	v1.Get("/realtime/:customer_id", getRealtimeData)

	// Platform statistics
	v1.Get("/stats", getPlatformStats)
}

func healthCheck(c fiber.Ctx) error {
	health := HealthStatus{
		Status:      "healthy",
		Timestamp:   time.Now().Unix(),
		Version:     "1.0.0",
		Environment: getEnv("ENVIRONMENT", "development"),
		Services: map[string]string{
			"api_gateway":          "healthy",
			"attribution_engine":   "healthy",
			"ingestion_service":    "healthy",
			"clickhouse":          "healthy",
			"redis":               "healthy",
			"kafka":               "healthy",
		},
	}

	return c.JSON(APIResponse{
		Success: true,
		Data:    health,
	})
}

func ingestEvents(c fiber.Ctx) error {
	var events []AttributionEvent

	// Parse request body
	if err := c.Bind().JSON(&events); err != nil {
		// Try single event
		var event AttributionEvent
		if err := c.Bind().JSON(&event); err != nil {
			return c.Status(400).JSON(APIResponse{
				Success: false,
				Error:   "Invalid JSON format",
			})
		}
		events = []AttributionEvent{event}
	}

	// Validate events
	if len(events) == 0 {
		return c.Status(400).JSON(APIResponse{
			Success: false,
			Error:   "No events provided",
		})
	}

	// Process events (simplified for demo)
	processedCount := 0
	for _, event := range events {
		// Basic validation
		if event.EventID == "" || event.CustomerID == "" || event.EventType == "" {
			continue
		}

		// Set timestamp if not provided
		if event.Timestamp == 0 {
			event.Timestamp = time.Now().Unix()
		}

		// Simulate event processing
		processedCount++
	}

	log.Printf("📊 Processed %d attribution events for ingestion", processedCount)

	return c.JSON(APIResponse{
		Success: true,
		Message: fmt.Sprintf("Successfully processed %d events", processedCount),
		Data: map[string]interface{}{
			"processed_events": processedCount,
			"total_submitted":  len(events),
			"processing_time":  fmt.Sprintf("%.2fms", float64(time.Now().UnixNano())/1000000.0),
		},
	})
}

func getCustomerEvents(c fiber.Ctx) error {
	customerID := c.Params("customer_id")
	limit, _ := strconv.Atoi(c.Query("limit", "100"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	// Simulate fetching customer events
	events := generateSampleEvents(customerID, limit)

	return c.JSON(APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"customer_id": customerID,
			"events":      events,
			"total":       len(events),
			"limit":       limit,
			"offset":      offset,
		},
	})
}

func getAttributionData(c fiber.Ctx) error {
	customerID := c.Params("customer_id")

	// Simulate attribution analysis
	attribution := map[string]interface{}{
		"customer_id": customerID,
		"models": []map[string]interface{}{
			{
				"name":     "First Touch",
				"accuracy": 0.85,
				"channels": map[string]float64{
					"organic":       0.35,
					"paid_social":   0.25,
					"paid_search":   0.20,
					"email":         0.12,
					"direct":        0.08,
				},
			},
			{
				"name":     "Last Touch",
				"accuracy": 0.82,
				"channels": map[string]float64{
					"paid_search":   0.30,
					"organic":       0.28,
					"paid_social":   0.22,
					"email":         0.15,
					"direct":        0.05,
				},
			},
		},
		"recommended_model": "Data-Driven",
		"confidence":        0.92,
		"last_updated":      time.Now().Unix(),
	}

	return c.JSON(APIResponse{
		Success: true,
		Data:    attribution,
	})
}

func analyzeAttribution(c fiber.Ctx) error {
	var analysisRequest map[string]interface{}
	if err := c.Bind().JSON(&analysisRequest); err != nil {
		return c.Status(400).JSON(APIResponse{
			Success: false,
			Error:   "Invalid analysis request",
		})
	}

	// Simulate attribution analysis
	time.Sleep(500 * time.Millisecond) // Simulate processing time

	analysis := map[string]interface{}{
		"analysis_id":     fmt.Sprintf("analysis_%d", time.Now().Unix()),
		"request_params":  analysisRequest,
		"processing_time": "487ms",
		"results": map[string]interface{}{
			"conversion_rate": 0.034,
			"roas":           3.47,
			"cpa":            28.50,
			"top_channels": []string{"paid_search", "organic", "paid_social"},
		},
		"recommendations": []string{
			"Increase budget allocation to paid_search (+15%)",
			"Optimize organic content strategy",
			"Test new creative formats for paid_social",
		},
	}

	return c.JSON(APIResponse{
		Success: true,
		Data:    analysis,
	})
}

func getCustomerAnalytics(c fiber.Ctx) error {
	customerID := c.Params("customer_id")

	analytics := map[string]interface{}{
		"customer_id":  customerID,
		"period":       "last_30_days",
		"total_events": 125400,
		"unique_users": 8920,
		"conversions":  304,
		"revenue":      15847.50,
		"metrics": map[string]interface{}{
			"conversion_rate": 3.41,
			"arpu":           1.78,
			"ltv":            89.23,
			"cac":            24.75,
		},
		"trends": map[string]interface{}{
			"events_growth":      "+23%",
			"users_growth":       "+18%",
			"conversion_growth":  "+12%",
			"revenue_growth":     "+34%",
		},
	}

	return c.JSON(APIResponse{
		Success: true,
		Data: analytics,
	})
}

func getCustomerDashboard(c fiber.Ctx) error {
	customerID := c.Params("customer_id")

	dashboard := map[string]interface{}{
		"customer_id": customerID,
		"widgets": []map[string]interface{}{
			{
				"type":  "metric",
				"title": "Total Events Today",
				"value": "4,287",
				"trend": "+12%",
			},
			{
				"type":  "metric",
				"title": "Active Users",
				"value": "1,439",
				"trend": "+8%",
			},
			{
				"type":  "metric",
				"title": "Conversion Rate",
				"value": "3.41%",
				"trend": "+0.2%",
			},
			{
				"type":  "chart",
				"title": "Events Timeline",
				"data":  generateTimeseriesData(),
			},
		},
		"last_updated": time.Now().Unix(),
	}

	return c.JSON(APIResponse{
		Success: true,
		Data: dashboard,
	})
}

func runCustomAnalysis(c fiber.Ctx) error {
	var customQuery map[string]interface{}
	if err := c.Bind().JSON(&customQuery); err != nil {
		return c.Status(400).JSON(APIResponse{
			Success: false,
			Error:   "Invalid custom analysis query",
		})
	}

	// Simulate custom analysis
	time.Sleep(1 * time.Second)

	results := map[string]interface{}{
		"query_id":        fmt.Sprintf("custom_%d", time.Now().Unix()),
		"execution_time":  "1.23s",
		"results_count":   1247,
		"query_params":    customQuery,
		"sample_results": generateSampleResults(),
	}

	return c.JSON(APIResponse{
		Success: true,
		Data:    results,
	})
}

func getCustomers(c fiber.Ctx) error {
	customers := []map[string]interface{}{
		{
			"customer_id":   "cust_001",
			"name":         "GameStorm Studios",
			"industry":     "Mobile Gaming",
			"plan":         "Enterprise",
			"mrr":          4500,
			"status":       "active",
			"events_today": 12847,
		},
		{
			"customer_id":   "cust_002",
			"name":         "FinTech Pro",
			"industry":     "Financial Services",
			"plan":         "Enterprise Plus",
			"mrr":          8500,
			"status":       "active",
			"events_today": 23156,
		},
		{
			"customer_id":   "cust_003",
			"name":         "ShopFast Mobile",
			"industry":     "E-commerce",
			"plan":         "Growth",
			"mrr":          6200,
			"status":       "active",
			"events_today": 18943,
		},
	}

	return c.JSON(APIResponse{
		Success: true,
		Data:    customers,
	})
}

func createCustomer(c fiber.Ctx) error {
	var customer map[string]interface{}
	if err := c.Bind().JSON(&customer); err != nil {
		return c.Status(400).JSON(APIResponse{
			Success: false,
			Error:   "Invalid customer data",
		})
	}

	// Generate customer ID
	customerID := fmt.Sprintf("cust_%d", time.Now().Unix())
	customer["customer_id"] = customerID
	customer["created_at"] = time.Now().Unix()
	customer["status"] = "active"

	return c.Status(201).JSON(APIResponse{
		Success: true,
		Message: "Customer created successfully",
		Data:    customer,
	})
}

func getCustomer(c fiber.Ctx) error {
	customerID := c.Params("customer_id")

	customer := map[string]interface{}{
		"customer_id":      customerID,
		"name":            "Sample Customer",
		"industry":        "Technology",
		"plan":            "Growth",
		"mrr":             5000,
		"status":          "active",
		"created_at":      time.Now().AddDate(0, -2, 0).Unix(),
		"last_event":      time.Now().Unix() - 300,
		"total_events":    894756,
		"integration_health": "excellent",
	}

	return c.JSON(APIResponse{
		Success: true,
		Data:    customer,
	})
}

func updateCustomer(c fiber.Ctx) error {
	customerID := c.Params("customer_id")
	var updates map[string]interface{}

	if err := c.Bind().JSON(&updates); err != nil {
		return c.Status(400).JSON(APIResponse{
			Success: false,
			Error:   "Invalid update data",
		})
	}

	updates["customer_id"] = customerID
	updates["updated_at"] = time.Now().Unix()

	return c.JSON(APIResponse{
		Success: true,
		Message: "Customer updated successfully",
		Data:    updates,
	})
}

func getRealtimeData(c fiber.Ctx) error {
	customerID := c.Params("customer_id")

	realtime := map[string]interface{}{
		"customer_id":     customerID,
		"timestamp":       time.Now().Unix(),
		"events_per_sec":  47.3,
		"active_sessions": 1829,
		"current_users":   423,
		"live_conversions": 12,
		"revenue_today":   2847.50,
		"top_events": []map[string]interface{}{
			{"event": "page_view", "count": 15847},
			{"event": "session_start", "count": 8923},
			{"event": "purchase", "count": 234},
		},
	}

	return c.JSON(APIResponse{
		Success: true,
		Data:    realtime,
	})
}

func getPlatformStats(c fiber.Ctx) error {
	stats := map[string]interface{}{
		"platform": map[string]interface{}{
			"total_customers":    20,
			"total_events_today": 284756,
			"total_revenue":      103400,
			"uptime":            "99.97%",
			"avg_response_time":  "47ms",
		},
		"performance": map[string]interface{}{
			"events_per_second":   1247.8,
			"peak_events_per_sec": 2341.2,
			"storage_used":       "847GB",
			"queries_per_minute": 1834,
		},
		"health": map[string]string{
			"api_gateway":        "healthy",
			"ingestion":         "healthy",
			"attribution_engine": "healthy",
			"analytics":         "healthy",
			"storage":           "healthy",
		},
	}

	return c.JSON(APIResponse{
		Success: true,
		Data:    stats,
	})
}

// Helper functions
func errorHandler(c fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	return c.Status(code).JSON(APIResponse{
		Success: false,
		Error:   err.Error(),
	})
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func generateSampleEvents(customerID string, limit int) []AttributionEvent {
	events := make([]AttributionEvent, 0, limit)
	eventTypes := []string{"install", "session", "purchase", "custom"}
	platforms := []string{"ios", "android", "web"}

	for i := 0; i < limit && i < 10; i++ {
		event := AttributionEvent{
			EventID:    fmt.Sprintf("evt_%s_%d", customerID, i),
			Timestamp:  time.Now().Unix() - int64(i*300),
			CustomerID: customerID,
			AppID:      fmt.Sprintf("app_%s", customerID),
			EventType:  eventTypes[i%len(eventTypes)],
			UserID:     fmt.Sprintf("user_%d", i),
			DeviceID:   fmt.Sprintf("device_%d", i),
			Platform:   platforms[i%len(platforms)],
			Country:    "US",
			Campaign:   fmt.Sprintf("campaign_%d", i%3),
		}
		events = append(events, event)
	}

	return events
}

func generateTimeseriesData() []map[string]interface{} {
	data := make([]map[string]interface{}, 24)
	for i := 0; i < 24; i++ {
		data[i] = map[string]interface{}{
			"hour":   i,
			"events": 1500 + (i*50) + int(time.Now().Unix()%100),
		}
	}
	return data
}

func generateSampleResults() []map[string]interface{} {
	return []map[string]interface{}{
		{"metric": "conversion_rate", "value": 3.41, "segment": "mobile"},
		{"metric": "conversion_rate", "value": 2.87, "segment": "web"},
		{"metric": "arpu", "value": 24.50, "segment": "premium"},
		{"metric": "arpu", "value": 12.30, "segment": "standard"},
	}
}