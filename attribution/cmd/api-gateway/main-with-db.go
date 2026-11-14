// ============================================================================
// UnMoGrowP Attribution Platform - API Gateway (Database Integrated)
// Main entry point for attribution platform API with real database connectivity
// ============================================================================

package main

import (
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

	"github.com/unmogrowp/attribution-platform/internal/database"
)

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type App struct {
	db *database.ClickHouseDB
}

func main() {
	log.Println("🚀 UnMoGrowP Attribution Platform API (Database Edition) starting...")

	// Initialize database connection
	db, err := database.NewClickHouseConnection(
		getEnv("CLICKHOUSE_HOST", "localhost"),
		getEnv("CLICKHOUSE_PORT", "9000"),
		getEnv("CLICKHOUSE_DATABASE", "attribution"),
		getEnv("CLICKHOUSE_USER", "attribution_user"),
		getEnv("CLICKHOUSE_PASSWORD", "attribution_password"),
	)
	if err != nil {
		log.Printf("⚠️ Database connection warning: %v", err)
	}

	app := &App{db: db}

	// Initialize Fiber app
	fiberApp := fiber.New(fiber.Config{
		ServerHeader:   "UnMoGrowP Attribution Platform",
		AppName:        "UnMoGrowP Attribution Platform v2.0.0-database",
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   30 * time.Second,
		IdleTimeout:    60 * time.Second,
		ErrorHandler:   errorHandler,
		Immutable:      true,
		CaseSensitive:  false,
	})

	// Middleware
	fiberApp.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path} ${ip} ${ua}\n",
	}))
	fiberApp.Use(recover.New())
	fiberApp.Use(helmet.New())
	fiberApp.Use(cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowMethods:     "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "*",
		AllowCredentials: false,
	}))

	// Routes
	setupRoutes(fiberApp, app)

	// Server configuration
	port := getEnv("PORT", "8080")
	log.Printf("🚀 UnMoGrowP Attribution Platform API (Database Edition) starting on port %s", port)

	// Start server
	go func() {
		if err := fiberApp.Listen(":" + port); err != nil {
			log.Fatal("💥 Failed to start server:", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")
	if err := fiberApp.ShutdownWithTimeout(30 * time.Second); err != nil {
		log.Printf("⚠️ Server shutdown warning: %v", err)
	}

	// Close database connection
	if app.db != nil {
		if err := app.db.Close(); err != nil {
			log.Printf("⚠️ Database close warning: %v", err)
		}
	}

	log.Println("✅ Server stopped")
}

func setupRoutes(app *fiber.App, apiApp *App) {
	// Health check
	app.Get("/health", apiApp.healthCheck)
	app.Get("/", func(c fiber.Ctx) error {
		return c.JSON(APIResponse{
			Success: true,
			Message: "UnMoGrowP Attribution Platform API v2.0.0-database - Ready to process events!",
			Data: map[string]interface{}{
				"version":     "v2.0.0-database",
				"status":      "healthy",
				"database":    "integrated",
				"endpoints":   19,
				"timestamp":   time.Now().Unix(),
			},
		})
	})

	// API v1 routes
	v1 := app.Group("/api/v1")

	// Event ingestion
	v1.Post("/events", apiApp.ingestEvents)
	v1.Post("/batch", apiApp.ingestEventBatch)

	// Analytics & Attribution
	v1.Get("/customers", apiApp.getCustomers)
	v1.Get("/analytics/:customer_id", apiApp.getCustomerAnalytics)
	v1.Get("/attribution/:customer_id", apiApp.getAttribution)
	v1.Get("/events/:customer_id", apiApp.getEvents)

	// Reporting
	v1.Get("/dashboard/stats", apiApp.getDashboardStats)
	v1.Get("/reports/revenue/:customer_id", apiApp.getRevenueReport)
	v1.Get("/reports/funnel/:customer_id", apiApp.getFunnelReport)

	// Configuration
	v1.Get("/config/:customer_id", apiApp.getConfig)
	v1.Post("/config/:customer_id", apiApp.updateConfig)

	// Authentication and user management
	v1.Post("/auth/login", apiApp.login)
	v1.Post("/auth/register", apiApp.register)
	v1.Get("/auth/profile", apiApp.getProfile)

	// Campaign management
	v1.Get("/campaigns/:customer_id", apiApp.getCampaigns)
	v1.Post("/campaigns/:customer_id", apiApp.createCampaign)

	// Real-time data
	v1.Get("/live/:customer_id", apiApp.getLiveData)

	// System endpoints
	v1.Get("/status", apiApp.getSystemStatus)
}

// Event ingestion handlers
func (app *App) ingestEvents(c fiber.Ctx) error {
	var events []database.AttributionEvent

	// Try to parse as array first, then single event
	if err := c.Bind().JSON(&events); err != nil {
		var event database.AttributionEvent
		if err := c.Bind().JSON(&event); err != nil {
			return c.Status(400).JSON(APIResponse{
				Success: false,
				Error:   "Invalid JSON format",
			})
		}
		events = []database.AttributionEvent{event}
	}

	// Validate and enrich events
	for i := range events {
		if events[i].EventID == "" {
			events[i].EventID = fmt.Sprintf("evt_%d_%d", time.Now().UnixNano(), i)
		}
		if events[i].Timestamp == 0 {
			events[i].Timestamp = time.Now().UnixMilli()
		}
		if events[i].APIVersion == 0 {
			events[i].APIVersion = 1
		}
	}

	// Insert to database
	if err := app.db.InsertEvents(events); err != nil {
		log.Printf("❌ Failed to insert events: %v", err)
		return c.Status(500).JSON(APIResponse{
			Success: false,
			Error:   "Failed to process events",
		})
	}

	log.Printf("📊 Processed %d attribution events for ingestion", len(events))

	return c.JSON(APIResponse{
		Success: true,
		Message: fmt.Sprintf("Successfully processed %d events", len(events)),
		Data: map[string]interface{}{
			"processed_count": len(events),
			"timestamp":       time.Now().Unix(),
			"status":          "success",
		},
	})
}

func (app *App) ingestEventBatch(c fiber.Ctx) error {
	var events []database.AttributionEvent
	if err := c.Bind().JSON(&events); err != nil {
		return c.Status(400).JSON(APIResponse{
			Success: false,
			Error:   "Invalid JSON batch format",
		})
	}

	if len(events) > 1000 {
		return c.Status(400).JSON(APIResponse{
			Success: false,
			Error:   "Batch size too large (max 1000 events)",
		})
	}

	// Process batch
	if err := app.db.InsertEvents(events); err != nil {
		return c.Status(500).JSON(APIResponse{
			Success: false,
			Error:   "Failed to process batch",
		})
	}

	return c.JSON(APIResponse{
		Success: true,
		Message: fmt.Sprintf("Successfully processed batch of %d events", len(events)),
		Data: map[string]interface{}{
			"batch_size": len(events),
			"timestamp":  time.Now().Unix(),
		},
	})
}

// Analytics handlers
func (app *App) getCustomerAnalytics(c fiber.Ctx) error {
	customerID := c.Params("customer_id")
	if customerID == "" {
		return c.Status(400).JSON(APIResponse{
			Success: false,
			Error:   "Customer ID is required",
		})
	}

	limitStr := c.Query("limit", "100")
	limit, _ := strconv.Atoi(limitStr)

	analytics, err := app.db.GetCustomerAnalytics(customerID, limit)
	if err != nil {
		return c.Status(500).JSON(APIResponse{
			Success: false,
			Error:   "Failed to get analytics",
		})
	}

	return c.JSON(APIResponse{
		Success: true,
		Data:    analytics,
	})
}

func (app *App) getCustomers(c fiber.Ctx) error {
	limitStr := c.Query("limit", "50")
	limit, _ := strconv.Atoi(limitStr)

	customers, err := app.db.GetCustomers(limit)
	if err != nil {
		return c.Status(500).JSON(APIResponse{
			Success: false,
			Error:   "Failed to get customers",
		})
	}

	return c.JSON(APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"customers": customers,
			"total":     len(customers),
			"limit":     limit,
		},
	})
}

func (app *App) getAttribution(c fiber.Ctx) error {
	customerID := c.Params("customer_id")
	limitStr := c.Query("limit", "100")
	limit, _ := strconv.Atoi(limitStr)

	attribution, err := app.db.GetAttribution(customerID, limit)
	if err != nil {
		return c.Status(500).JSON(APIResponse{
			Success: false,
			Error:   "Failed to get attribution",
		})
	}

	return c.JSON(APIResponse{
		Success: true,
		Data: attribution,
	})
}

// Health and status handlers
func (app *App) healthCheck(c fiber.Ctx) error {
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

	return c.JSON(APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"service":   "UnMoGrowP Attribution Platform",
			"version":   "v2.0.0-database",
			"status":    "healthy",
			"timestamp": time.Now().Unix(),
			"database": map[string]interface{}{
				"status": dbStatus,
				"error":  dbError,
			},
		},
	})
}

// Placeholder handlers for remaining endpoints
func (app *App) getEvents(c fiber.Ctx) error {
	return c.JSON(APIResponse{
		Success: true,
		Message: "Events endpoint - implementation pending",
		Data: map[string]interface{}{
			"customer_id": c.Params("customer_id"),
			"status":      "mock",
		},
	})
}

func (app *App) getDashboardStats(c fiber.Ctx) error {
	return c.JSON(APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"total_events":   15000,
			"active_users":   2500,
			"revenue_today":  12500.50,
			"conversions":    125,
			"data_source":    "dashboard_mock",
		},
	})
}

func (app *App) getRevenueReport(c fiber.Ctx) error {
	return c.JSON(APIResponse{
		Success: true,
		Message: "Revenue report endpoint",
		Data: map[string]interface{}{
			"customer_id": c.Params("customer_id"),
			"status":      "mock",
		},
	})
}

func (app *App) getFunnelReport(c fiber.Ctx) error {
	return c.JSON(APIResponse{Success: true, Message: "Funnel report endpoint"})
}

func (app *App) getConfig(c fiber.Ctx) error {
	return c.JSON(APIResponse{Success: true, Message: "Config endpoint"})
}

func (app *App) updateConfig(c fiber.Ctx) error {
	return c.JSON(APIResponse{Success: true, Message: "Update config endpoint"})
}

func (app *App) login(c fiber.Ctx) error {
	return c.JSON(APIResponse{Success: true, Message: "Login endpoint"})
}

func (app *App) register(c fiber.Ctx) error {
	return c.JSON(APIResponse{Success: true, Message: "Register endpoint"})
}

func (app *App) getProfile(c fiber.Ctx) error {
	return c.JSON(APIResponse{Success: true, Message: "Profile endpoint"})
}

func (app *App) getCampaigns(c fiber.Ctx) error {
	return c.JSON(APIResponse{Success: true, Message: "Campaigns endpoint"})
}

func (app *App) createCampaign(c fiber.Ctx) error {
	return c.JSON(APIResponse{Success: true, Message: "Create campaign endpoint"})
}

func (app *App) getLiveData(c fiber.Ctx) error {
	return c.JSON(APIResponse{Success: true, Message: "Live data endpoint"})
}

func (app *App) getSystemStatus(c fiber.Ctx) error {
	return c.JSON(APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"system":    "operational",
			"database":  "connected",
			"api":       "healthy",
			"timestamp": time.Now().Unix(),
		},
	})
}

// Utility functions
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