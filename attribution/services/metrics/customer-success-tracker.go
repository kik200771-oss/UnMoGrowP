package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/lib/pq"
	_ "github.com/lib/pq"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// ============================================================================
// UnMoGrowP Attribution Platform - Customer Success Metrics Tracker
// Tracks pilot customer success metrics and KPIs in real-time
// ============================================================================

// Customer Success Metrics from Team Meeting
type CustomerMetrics struct {
	CustomerID          string    `json:"customer_id" db:"customer_id"`
	CompanyName         string    `json:"company_name" db:"company_name"`
	PilotStartDate      time.Time `json:"pilot_start_date" db:"pilot_start_date"`
	CurrentPhase        string    `json:"current_phase" db:"current_phase"` // discovery, setup, launch

	// Technical Metrics (Target: >99% accuracy, <100ms latency, >99.9% uptime)
	AttributionAccuracy float64   `json:"attribution_accuracy" db:"attribution_accuracy"`
	AvgAPILatency      float64   `json:"avg_api_latency" db:"avg_api_latency"`
	P95APILatency      float64   `json:"p95_api_latency" db:"p95_api_latency"`
	SystemUptime       float64   `json:"system_uptime" db:"system_uptime"`
	ErrorRate          float64   `json:"error_rate" db:"error_rate"`

	// Business Metrics (Target: 30-50% cost savings, 80% time savings)
	CostSavingsPercent    float64 `json:"cost_savings_percent" db:"cost_savings_percent"`
	TimeSavingsPercent    float64 `json:"time_savings_percent" db:"time_savings_percent"`
	AccuracyImprovement   float64 `json:"accuracy_improvement" db:"accuracy_improvement"`
	ProductivityGain      float64 `json:"productivity_gain" db:"productivity_gain"`

	// Volume Metrics
	DailyEventVolume     int64   `json:"daily_event_volume" db:"daily_event_volume"`
	PeakEventsPerSecond  int64   `json:"peak_events_per_second" db:"peak_events_per_second"`
	TotalEventsProcessed int64   `json:"total_events_processed" db:"total_events_processed"`

	// Satisfaction Metrics (Target: >90%)
	CustomerSatisfaction float64 `json:"customer_satisfaction" db:"customer_satisfaction"`
	NPS                 int     `json:"nps" db:"nps"`
	FeedbackScore       float64 `json:"feedback_score" db:"feedback_score"`

	// Integration Metrics (Target: <2 weeks)
	IntegrationDays     int       `json:"integration_days" db:"integration_days"`
	GoLiveDate         *time.Time `json:"go_live_date,omitempty" db:"go_live_date"`
	SupportTickets     int       `json:"support_tickets" db:"support_tickets"`

	// Success Flags
	TechnicalSuccess   bool      `json:"technical_success" db:"technical_success"`
	BusinessSuccess    bool      `json:"business_success" db:"business_success"`
	OverallSuccess     bool      `json:"overall_success" db:"overall_success"`

	LastUpdated        time.Time `json:"last_updated" db:"last_updated"`
}

// Weekly Success Summary for Team Meeting Review
type WeeklySuccessSummary struct {
	Week                int                `json:"week"`
	StartDate           time.Time          `json:"start_date"`
	EndDate             time.Time          `json:"end_date"`
	TotalCustomers      int                `json:"total_customers"`
	NewCustomers        int                `json:"new_customers"`
	ActiveCustomers     int                `json:"active_customers"`
	SuccessfulCustomers int                `json:"successful_customers"`

	// Aggregate Metrics
	AvgSatisfaction     float64            `json:"avg_satisfaction"`
	AvgAccuracy         float64            `json:"avg_accuracy"`
	AvgCostSavings      float64            `json:"avg_cost_savings"`
	TotalEventVolume    int64              `json:"total_event_volume"`

	// Success Targets Progress (from AI Team Meeting)
	Target5Customers    bool               `json:"target_5_customers"`    // 5 pilot customers
	Target10KMRR        bool               `json:"target_10k_mrr"`        // $10K+ MRR
	Target90Satisfaction bool               `json:"target_90_satisfaction"` // 90%+ satisfaction
	ProductMarketFit    bool               `json:"product_market_fit"`    // Product-market fit validation

	CustomerDetails     []CustomerMetrics  `json:"customer_details"`
}

// Prometheus Metrics
var (
	customerSatisfactionGauge = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "customer_satisfaction_score",
			Help: "Customer satisfaction score (0-100)",
		},
		[]string{"customer_id", "company_name"},
	)

	attributionAccuracyGauge = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "attribution_accuracy_percent",
			Help: "Attribution accuracy percentage",
		},
		[]string{"customer_id"},
	)

	apiLatencyGauge = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "customer_api_latency_ms",
			Help: "Customer API latency in milliseconds",
		},
		[]string{"customer_id", "percentile"},
	)

	costSavingsGauge = promauto.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "customer_cost_savings_percent",
			Help: "Customer cost savings percentage",
		},
		[]string{"customer_id"},
	)

	totalPilotCustomers = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "total_pilot_customers",
			Help: "Total number of pilot customers",
		},
	)

	successfulCustomers = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "successful_pilot_customers",
			Help: "Number of successful pilot customers",
		},
	)
)

type CustomerSuccessTracker struct {
	db     *sql.DB
	app    *fiber.App
}

func NewCustomerSuccessTracker(dbURL string) (*CustomerSuccessTracker, error) {
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	app := fiber.New(fiber.Config{
		AppName: "Customer Success Tracker v1.0.0",
	})

	tracker := &CustomerSuccessTracker{
		db:  db,
		app: app,
	}

	if err := tracker.initDatabase(); err != nil {
		return nil, fmt.Errorf("failed to initialize database: %v", err)
	}

	tracker.setupRoutes()

	// Start metrics updater
	go tracker.startMetricsUpdater()

	return tracker, nil
}

func (cst *CustomerSuccessTracker) initDatabase() error {
	schema := `
	CREATE TABLE IF NOT EXISTS customer_metrics (
		customer_id VARCHAR(50) PRIMARY KEY,
		company_name VARCHAR(200) NOT NULL,
		pilot_start_date TIMESTAMP NOT NULL,
		current_phase VARCHAR(20) NOT NULL DEFAULT 'discovery',

		-- Technical Metrics
		attribution_accuracy DECIMAL(5,2) DEFAULT 0,
		avg_api_latency DECIMAL(8,2) DEFAULT 0,
		p95_api_latency DECIMAL(8,2) DEFAULT 0,
		system_uptime DECIMAL(5,2) DEFAULT 0,
		error_rate DECIMAL(5,4) DEFAULT 0,

		-- Business Metrics
		cost_savings_percent DECIMAL(5,2) DEFAULT 0,
		time_savings_percent DECIMAL(5,2) DEFAULT 0,
		accuracy_improvement DECIMAL(5,2) DEFAULT 0,
		productivity_gain DECIMAL(5,2) DEFAULT 0,

		-- Volume Metrics
		daily_event_volume BIGINT DEFAULT 0,
		peak_events_per_second BIGINT DEFAULT 0,
		total_events_processed BIGINT DEFAULT 0,

		-- Satisfaction Metrics
		customer_satisfaction DECIMAL(5,2) DEFAULT 0,
		nps INTEGER DEFAULT 0,
		feedback_score DECIMAL(5,2) DEFAULT 0,

		-- Integration Metrics
		integration_days INTEGER DEFAULT 0,
		go_live_date TIMESTAMP,
		support_tickets INTEGER DEFAULT 0,

		-- Success Flags
		technical_success BOOLEAN DEFAULT FALSE,
		business_success BOOLEAN DEFAULT FALSE,
		overall_success BOOLEAN DEFAULT FALSE,

		last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

		CONSTRAINT valid_phase CHECK (current_phase IN ('discovery', 'setup', 'launch')),
		CONSTRAINT valid_satisfaction CHECK (customer_satisfaction >= 0 AND customer_satisfaction <= 100),
		CONSTRAINT valid_accuracy CHECK (attribution_accuracy >= 0 AND attribution_accuracy <= 100)
	);

	CREATE INDEX IF NOT EXISTS idx_customer_metrics_phase ON customer_metrics(current_phase);
	CREATE INDEX IF NOT EXISTS idx_customer_metrics_success ON customer_metrics(overall_success);
	CREATE INDEX IF NOT EXISTS idx_customer_metrics_updated ON customer_metrics(last_updated);

	-- Weekly summaries table
	CREATE TABLE IF NOT EXISTS weekly_summaries (
		week INTEGER NOT NULL,
		start_date DATE NOT NULL,
		end_date DATE NOT NULL,
		summary_data JSONB NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

		PRIMARY KEY (week, start_date)
	);
	`

	_, err := cst.db.Exec(schema)
	return err
}

func (cst *CustomerSuccessTracker) setupRoutes() {
	cst.app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "healthy", "service": "customer-success-tracker"})
	})

	// Customer metrics endpoints
	cst.app.Post("/v1/customers", cst.createCustomer)
	cst.app.Get("/v1/customers", cst.getCustomers)
	cst.app.Get("/v1/customers/:id", cst.getCustomer)
	cst.app.Put("/v1/customers/:id/metrics", cst.updateCustomerMetrics)
	cst.app.Post("/v1/customers/:id/feedback", cst.recordFeedback)

	// Success tracking endpoints
	cst.app.Get("/v1/success/weekly", cst.getWeeklySummary)
	cst.app.Get("/v1/success/dashboard", cst.getSuccessDashboard)
	cst.app.Get("/v1/success/targets", cst.getSuccessTargets)

	// Analytics endpoints
	cst.app.Get("/v1/analytics/performance", cst.getPerformanceAnalytics)
	cst.app.Get("/v1/analytics/satisfaction", cst.getSatisfactionAnalytics)
}

func (cst *CustomerSuccessTracker) createCustomer(c fiber.Ctx) error {
	var customer CustomerMetrics
	if err := c.Bind().JSON(&customer); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	customer.PilotStartDate = time.Now()
	customer.CurrentPhase = "discovery"
	customer.LastUpdated = time.Now()

	query := `
	INSERT INTO customer_metrics (
		customer_id, company_name, pilot_start_date, current_phase, last_updated
	) VALUES ($1, $2, $3, $4, $5)
	ON CONFLICT (customer_id) DO UPDATE SET
		company_name = EXCLUDED.company_name,
		last_updated = EXCLUDED.last_updated
	`

	_, err := cst.db.Exec(query,
		customer.CustomerID,
		customer.CompanyName,
		customer.PilotStartDate,
		customer.CurrentPhase,
		customer.LastUpdated,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create customer"})
	}

	// Update Prometheus metrics
	cst.updatePrometheusMetrics()

	return c.Status(201).JSON(customer)
}

func (cst *CustomerSuccessTracker) updateCustomerMetrics(c fiber.Ctx) error {
	customerID := c.Params("id")

	var updates CustomerMetrics
	if err := c.Bind().JSON(&updates); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	updates.LastUpdated = time.Now()

	// Calculate success flags based on targets from team meeting
	updates.TechnicalSuccess = updates.AttributionAccuracy > 99.0 &&
		updates.P95APILatency < 100.0 &&
		updates.SystemUptime > 99.9

	updates.BusinessSuccess = updates.CostSavingsPercent > 30.0 &&
		updates.CustomerSatisfaction > 90.0

	updates.OverallSuccess = updates.TechnicalSuccess && updates.BusinessSuccess

	query := `
	UPDATE customer_metrics SET
		current_phase = COALESCE(NULLIF($2, ''), current_phase),
		attribution_accuracy = COALESCE(NULLIF($3, 0), attribution_accuracy),
		avg_api_latency = COALESCE(NULLIF($4, 0), avg_api_latency),
		p95_api_latency = COALESCE(NULLIF($5, 0), p95_api_latency),
		system_uptime = COALESCE(NULLIF($6, 0), system_uptime),
		error_rate = COALESCE(NULLIF($7, 0), error_rate),
		cost_savings_percent = COALESCE(NULLIF($8, 0), cost_savings_percent),
		time_savings_percent = COALESCE(NULLIF($9, 0), time_savings_percent),
		accuracy_improvement = COALESCE(NULLIF($10, 0), accuracy_improvement),
		productivity_gain = COALESCE(NULLIF($11, 0), productivity_gain),
		daily_event_volume = COALESCE(NULLIF($12, 0), daily_event_volume),
		peak_events_per_second = COALESCE(NULLIF($13, 0), peak_events_per_second),
		total_events_processed = COALESCE(NULLIF($14, 0), total_events_processed),
		customer_satisfaction = COALESCE(NULLIF($15, 0), customer_satisfaction),
		nps = COALESCE(NULLIF($16, 0), nps),
		feedback_score = COALESCE(NULLIF($17, 0), feedback_score),
		integration_days = COALESCE(NULLIF($18, 0), integration_days),
		support_tickets = COALESCE(NULLIF($19, 0), support_tickets),
		technical_success = $20,
		business_success = $21,
		overall_success = $22,
		last_updated = $23
	WHERE customer_id = $1
	`

	_, err := cst.db.Exec(query,
		customerID, updates.CurrentPhase, updates.AttributionAccuracy,
		updates.AvgAPILatency, updates.P95APILatency, updates.SystemUptime,
		updates.ErrorRate, updates.CostSavingsPercent, updates.TimeSavingsPercent,
		updates.AccuracyImprovement, updates.ProductivityGain,
		updates.DailyEventVolume, updates.PeakEventsPerSecond, updates.TotalEventsProcessed,
		updates.CustomerSatisfaction, updates.NPS, updates.FeedbackScore,
		updates.IntegrationDays, updates.SupportTickets,
		updates.TechnicalSuccess, updates.BusinessSuccess, updates.OverallSuccess,
		updates.LastUpdated,
	)

	if err != nil {
		log.Printf("Failed to update customer metrics: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update customer metrics"})
	}

	// Update Prometheus metrics
	cst.updatePrometheusMetrics()

	return c.JSON(fiber.Map{"success": true, "customer_id": customerID})
}

func (cst *CustomerSuccessTracker) getSuccessTargets(c fiber.Ctx) error {
	// Get current counts
	var totalCustomers, successfulCustomers, activeCustomers int
	var avgSatisfaction, totalEventVolume float64

	query := `
	SELECT
		COUNT(*) as total,
		COUNT(CASE WHEN overall_success = true THEN 1 END) as successful,
		COUNT(CASE WHEN current_phase = 'launch' THEN 1 END) as active,
		COALESCE(AVG(customer_satisfaction), 0) as avg_satisfaction,
		COALESCE(SUM(daily_event_volume), 0) as total_events
	FROM customer_metrics
	`

	err := cst.db.QueryRow(query).Scan(
		&totalCustomers, &successfulCustomers, &activeCustomers,
		&avgSatisfaction, &totalEventVolume,
	)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to get success targets"})
	}

	// Calculate MRR estimate (simplified)
	estimatedMRR := float64(totalCustomers) * 2500 // $2.5K average per pilot customer

	targets := fiber.Map{
		"week_1_targets": fiber.Map{
			"target_customers":     5,
			"current_customers":    totalCustomers,
			"target_achieved":      totalCustomers >= 5,
			"progress_percent":     min(float64(totalCustomers)/5.0*100, 100),
		},
		"technical_targets": fiber.Map{
			"target_accuracy":      99.0,
			"target_latency":       100.0,
			"target_uptime":        99.9,
			"current_performance":  "measuring...",
		},
		"business_targets": fiber.Map{
			"target_mrr":           10000,
			"estimated_mrr":        estimatedMRR,
			"target_satisfaction":  90.0,
			"current_satisfaction": avgSatisfaction,
			"satisfaction_achieved": avgSatisfaction >= 90.0,
		},
		"sprint_progress": fiber.Map{
			"total_customers":      totalCustomers,
			"successful_customers": successfulCustomers,
			"active_customers":     activeCustomers,
			"success_rate":         float64(successfulCustomers)/max(float64(totalCustomers), 1)*100,
		},
	}

	return c.JSON(targets)
}

func (cst *CustomerSuccessTracker) getWeeklySummary(c fiber.Ctx) error {
	// Calculate current week metrics
	now := time.Now()
	startOfWeek := now.AddDate(0, 0, -int(now.Weekday()))
	endOfWeek := startOfWeek.AddDate(0, 0, 6)

	var customers []CustomerMetrics
	query := `
	SELECT * FROM customer_metrics
	WHERE last_updated >= $1
	ORDER BY last_updated DESC
	`

	rows, err := cst.db.Query(query, startOfWeek)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to get weekly summary"})
	}
	defer rows.Close()

	for rows.Next() {
		var customer CustomerMetrics
		err := rows.Scan(
			&customer.CustomerID, &customer.CompanyName, &customer.PilotStartDate,
			&customer.CurrentPhase, &customer.AttributionAccuracy, &customer.AvgAPILatency,
			&customer.P95APILatency, &customer.SystemUptime, &customer.ErrorRate,
			&customer.CostSavingsPercent, &customer.TimeSavingsPercent,
			&customer.AccuracyImprovement, &customer.ProductivityGain,
			&customer.DailyEventVolume, &customer.PeakEventsPerSecond,
			&customer.TotalEventsProcessed, &customer.CustomerSatisfaction,
			&customer.NPS, &customer.FeedbackScore, &customer.IntegrationDays,
			&customer.GoLiveDate, &customer.SupportTickets,
			&customer.TechnicalSuccess, &customer.BusinessSuccess,
			&customer.OverallSuccess, &customer.LastUpdated,
		)
		if err != nil {
			continue
		}
		customers = append(customers, customer)
	}

	// Calculate summary metrics
	summary := WeeklySuccessSummary{
		Week:                1, // Week 1 of 3-week sprint
		StartDate:           startOfWeek,
		EndDate:             endOfWeek,
		TotalCustomers:      len(customers),
		ActiveCustomers:     len(customers),
		CustomerDetails:     customers,
		Target5Customers:    len(customers) >= 5,
		Target90Satisfaction: true, // Calculate based on actual data
		ProductMarketFit:    len(customers) >= 3, // Early indicator
	}

	// Calculate aggregates
	if len(customers) > 0 {
		var totalSatisfaction, totalAccuracy, totalCostSavings float64
		var totalEvents int64
		successCount := 0

		for _, customer := range customers {
			totalSatisfaction += customer.CustomerSatisfaction
			totalAccuracy += customer.AttributionAccuracy
			totalCostSavings += customer.CostSavingsPercent
			totalEvents += customer.DailyEventVolume

			if customer.OverallSuccess {
				successCount++
			}
		}

		summary.AvgSatisfaction = totalSatisfaction / float64(len(customers))
		summary.AvgAccuracy = totalAccuracy / float64(len(customers))
		summary.AvgCostSavings = totalCostSavings / float64(len(customers))
		summary.TotalEventVolume = totalEvents
		summary.SuccessfulCustomers = successCount
		summary.Target90Satisfaction = summary.AvgSatisfaction >= 90.0
		summary.Target10KMRR = float64(len(customers))*2500 >= 10000
	}

	return c.JSON(summary)
}

func (cst *CustomerSuccessTracker) updatePrometheusMetrics() {
	query := `
	SELECT
		customer_id, company_name, attribution_accuracy,
		avg_api_latency, p95_api_latency, cost_savings_percent,
		customer_satisfaction
	FROM customer_metrics
	`

	rows, err := cst.db.Query(query)
	if err != nil {
		log.Printf("Failed to update Prometheus metrics: %v", err)
		return
	}
	defer rows.Close()

	totalCustomers := 0
	successfulCustomers := 0

	for rows.Next() {
		var customerID, companyName string
		var accuracy, avgLatency, p95Latency, costSavings, satisfaction float64

		err := rows.Scan(&customerID, &companyName, &accuracy,
			&avgLatency, &p95Latency, &costSavings, &satisfaction)
		if err != nil {
			continue
		}

		totalCustomers++

		// Update individual customer metrics
		customerSatisfactionGauge.WithLabelValues(customerID, companyName).Set(satisfaction)
		attributionAccuracyGauge.WithLabelValues(customerID).Set(accuracy)
		apiLatencyGauge.WithLabelValues(customerID, "avg").Set(avgLatency)
		apiLatencyGauge.WithLabelValues(customerID, "p95").Set(p95Latency)
		costSavingsGauge.WithLabelValues(customerID).Set(costSavings)

		// Count successful customers
		if accuracy > 99.0 && p95Latency < 100.0 && satisfaction > 90.0 {
			successfulCustomers++
		}
	}

	// Update aggregate metrics
	totalPilotCustomers.Set(float64(totalCustomers))
	successfulCustomers.Set(float64(successfulCustomers))
}

func (cst *CustomerSuccessTracker) startMetricsUpdater() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		cst.updatePrometheusMetrics()
	}
}

func (cst *CustomerSuccessTracker) Start(port string) error {
	log.Printf("Customer Success Tracker starting on port %s", port)
	return cst.app.Listen(":" + port)
}

func main() {
	dbURL := "postgres://attribution:attribution_secure_pass_pg@localhost:5432/attribution?sslmode=disable"

	tracker, err := NewCustomerSuccessTracker(dbURL)
	if err != nil {
		log.Fatal("Failed to create tracker:", err)
	}

	if err := tracker.Start("8084"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func max(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}