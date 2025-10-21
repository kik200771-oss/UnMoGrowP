package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
)

// EventPayload represents incoming attribution event
type EventPayload struct {
	EventType    string                 `json:"event_type"`
	AppID        string                 `json:"app_id"`
	DeviceID     string                 `json:"device_id"`
	UserID       string                 `json:"user_id,omitempty"`
	SessionID    string                 `json:"session_id"`
	Timestamp    int64                  `json:"timestamp"`
	Platform     string                 `json:"platform"`
	OSVersion    string                 `json:"os_version"`
	AppVersion   string                 `json:"app_version"`
	Attribution  map[string]interface{} `json:"attribution,omitempty"`
	EventData    map[string]interface{} `json:"event_data,omitempty"`
	IP           string                 `json:"ip"`
	UserAgent    string                 `json:"user_agent"`
}

func main() {
	// Create Fiber app with configuration for high performance
	app := fiber.New(fiber.Config{
		Prefork:       false, // Enable for production (process per CPU core)
		CaseSensitive: true,
		StrictRouting: false,
		ServerHeader:  "UnMoGrowP",
		AppName:       "UnMoGrowP Event Ingestion v1.0.0",
		// Buffer size for high throughput
		ReadBufferSize:  16384,
		WriteBufferSize: 16384,
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format: "[${time}] ${status} - ${latency} ${method} ${path}\n",
	}))
	app.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"POST", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization"},
	}))

	// Health check endpoint
	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "event-ingestion",
			"version": "1.0.0",
		})
	})

	// Metrics endpoint
	app.Get("/metrics", func(c fiber.Ctx) error {
		// TODO: Implement Prometheus metrics
		return c.JSON(fiber.Map{
			"events_received": 0,
			"events_processed": 0,
			"errors": 0,
		})
	})

	// Main event ingestion endpoint (target: 10M req/sec)
	app.Post("/v1/events", handleEvent)

	// Batch event ingestion
	app.Post("/v1/events/batch", handleBatchEvents)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Event Ingestion API starting on port %s", port)
	log.Printf("📊 Target: 10M events/second")
	log.Printf("⚡ Using Go Fiber v3 for maximum performance")

	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// handleEvent processes single attribution event
func handleEvent(c fiber.Ctx) error {
	var event EventPayload

	if err := c.Bind().JSON(&event); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid JSON payload",
		})
	}

	// Validate required fields
	if event.EventType == "" || event.AppID == "" || event.DeviceID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing required fields: event_type, app_id, device_id",
		})
	}

	// TODO: Send to Kafka for processing
	// TODO: Write to ClickHouse for analytics

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status": "accepted",
		"event_id": event.DeviceID + "-" + event.SessionID,
	})
}

// handleBatchEvents processes multiple events in one request
func handleBatchEvents(c fiber.Ctx) error {
	var events []EventPayload

	if err := c.Bind().JSON(&events); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid JSON payload",
		})
	}

	if len(events) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Empty batch",
		})
	}

	if len(events) > 1000 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Batch size exceeds limit (max 1000 events)",
		})
	}

	// TODO: Send batch to Kafka
	// TODO: Batch write to ClickHouse

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status": "accepted",
		"count": len(events),
	})
}
