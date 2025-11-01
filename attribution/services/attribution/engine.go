package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"sort"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// TouchPoint represents a single touch point in the user journey
type TouchPoint struct {
	ID          string            `json:"id"`
	AppID       string            `json:"app_id"`
	UserID      string            `json:"user_id"`
	SessionID   string            `json:"session_id"`
	EventType   string            `json:"event_type"`
	Timestamp   int64             `json:"timestamp"`
	CampaignID  string            `json:"campaign_id"`
	AdGroupID   string            `json:"ad_group_id"`
	CreativeID  string            `json:"creative_id"`
	NetworkID   string            `json:"network_id"`
	Platform    string            `json:"platform"`
	Revenue     float64           `json:"revenue"`
	Currency    string            `json:"currency"`
	Metadata    map[string]string `json:"metadata"`
}

// UserJourney represents complete user attribution journey
type UserJourney struct {
	UserID          string       `json:"user_id"`
	AppID           string       `json:"app_id"`
	SessionID       string       `json:"session_id"`
	TouchPoints     []TouchPoint `json:"touch_points"`
	ConversionEvent TouchPoint   `json:"conversion_event"`
	JourneyStart    int64        `json:"journey_start"`
	JourneyEnd      int64        `json:"journey_end"`
	TotalRevenue    float64      `json:"total_revenue"`
}

// AttributionResult represents the result of attribution calculation
type AttributionResult struct {
	UserID         string                      `json:"user_id"`
	SessionID      string                      `json:"session_id"`
	AppID          string                     `json:"app_id"`
	ModelType      string                      `json:"model_type"`
	Attribution    map[string]AttributionData  `json:"attribution"`
	TotalRevenue   float64                     `json:"total_revenue"`
	CalculatedAt   int64                       `json:"calculated_at"`
	JourneyLength  int                         `json:"journey_length"`
	TimeToConvert  int64                       `json:"time_to_convert"`
}

// AttributionData represents attribution data for each touchpoint
type AttributionData struct {
	TouchPointID   string  `json:"touch_point_id"`
	CampaignID     string  `json:"campaign_id"`
	NetworkID      string  `json:"network_id"`
	Credit         float64 `json:"credit"`
	Revenue        float64 `json:"revenue"`
	Position       int     `json:"position"`
	TimeDelta      int64   `json:"time_delta"`
}

// AttributionModel interface for different attribution models
type AttributionModel interface {
	Calculate(journey UserJourney) (AttributionResult, error)
	Name() string
}

// FirstTouchModel implements first-touch attribution
type FirstTouchModel struct{}

func (m *FirstTouchModel) Name() string {
	return "first_touch"
}

func (m *FirstTouchModel) Calculate(journey UserJourney) (AttributionResult, error) {
	if len(journey.TouchPoints) == 0 {
		return AttributionResult{}, fmt.Errorf("no touchpoints in journey")
	}

	// Sort touchpoints by timestamp
	touchpoints := make([]TouchPoint, len(journey.TouchPoints))
	copy(touchpoints, journey.TouchPoints)
	sort.Slice(touchpoints, func(i, j int) bool {
		return touchpoints[i].Timestamp < touchpoints[j].Timestamp
	})

	firstTouch := touchpoints[0]

	attribution := map[string]AttributionData{
		firstTouch.ID: {
			TouchPointID:   firstTouch.ID,
			CampaignID:     firstTouch.CampaignID,
			NetworkID:      firstTouch.NetworkID,
			Credit:         1.0,
			Revenue:        journey.TotalRevenue,
			Position:       1,
			TimeDelta:      journey.JourneyEnd - firstTouch.Timestamp,
		},
	}

	return AttributionResult{
		UserID:         journey.UserID,
		SessionID:      journey.SessionID,
		AppID:          journey.AppID,
		ModelType:      m.Name(),
		Attribution:    attribution,
		TotalRevenue:   journey.TotalRevenue,
		CalculatedAt:   time.Now().Unix(),
		JourneyLength:  len(journey.TouchPoints),
		TimeToConvert:  journey.JourneyEnd - journey.JourneyStart,
	}, nil
}

// LastTouchModel implements last-touch attribution
type LastTouchModel struct{}

func (m *LastTouchModel) Name() string {
	return "last_touch"
}

func (m *LastTouchModel) Calculate(journey UserJourney) (AttributionResult, error) {
	if len(journey.TouchPoints) == 0 {
		return AttributionResult{}, fmt.Errorf("no touchpoints in journey")
	}

	// Sort touchpoints by timestamp
	touchpoints := make([]TouchPoint, len(journey.TouchPoints))
	copy(touchpoints, journey.TouchPoints)
	sort.Slice(touchpoints, func(i, j int) bool {
		return touchpoints[i].Timestamp < touchpoints[j].Timestamp
	})

	lastTouch := touchpoints[len(touchpoints)-1]

	attribution := map[string]AttributionData{
		lastTouch.ID: {
			TouchPointID:   lastTouch.ID,
			CampaignID:     lastTouch.CampaignID,
			NetworkID:      lastTouch.NetworkID,
			Credit:         1.0,
			Revenue:        journey.TotalRevenue,
			Position:       len(touchpoints),
			TimeDelta:      journey.JourneyEnd - lastTouch.Timestamp,
		},
	}

	return AttributionResult{
		UserID:         journey.UserID,
		SessionID:      journey.SessionID,
		AppID:          journey.AppID,
		ModelType:      m.Name(),
		Attribution:    attribution,
		TotalRevenue:   journey.TotalRevenue,
		CalculatedAt:   time.Now().Unix(),
		JourneyLength:  len(journey.TouchPoints),
		TimeToConvert:  journey.JourneyEnd - journey.JourneyStart,
	}, nil
}

// LinearModel implements linear attribution
type LinearModel struct{}

func (m *LinearModel) Name() string {
	return "linear"
}

func (m *LinearModel) Calculate(journey UserJourney) (AttributionResult, error) {
	if len(journey.TouchPoints) == 0 {
		return AttributionResult{}, fmt.Errorf("no touchpoints in journey")
	}

	// Sort touchpoints by timestamp
	touchpoints := make([]TouchPoint, len(journey.TouchPoints))
	copy(touchpoints, journey.TouchPoints)
	sort.Slice(touchpoints, func(i, j int) bool {
		return touchpoints[i].Timestamp < touchpoints[j].Timestamp
	})

	credit := 1.0 / float64(len(touchpoints))
	revenuePerTouch := journey.TotalRevenue / float64(len(touchpoints))

	attribution := make(map[string]AttributionData)

	for i, touch := range touchpoints {
		attribution[touch.ID] = AttributionData{
			TouchPointID:   touch.ID,
			CampaignID:     touch.CampaignID,
			NetworkID:      touch.NetworkID,
			Credit:         credit,
			Revenue:        revenuePerTouch,
			Position:       i + 1,
			TimeDelta:      journey.JourneyEnd - touch.Timestamp,
		}
	}

	return AttributionResult{
		UserID:         journey.UserID,
		SessionID:      journey.SessionID,
		AppID:          journey.AppID,
		ModelType:      m.Name(),
		Attribution:    attribution,
		TotalRevenue:   journey.TotalRevenue,
		CalculatedAt:   time.Now().Unix(),
		JourneyLength:  len(journey.TouchPoints),
		TimeToConvert:  journey.JourneyEnd - journey.JourneyStart,
	}, nil
}

// TimeDecayModel implements time-decay attribution
type TimeDecayModel struct {
	DecayRate float64 `json:"decay_rate"` // Decay rate (e.g., 0.1 for 10% decay per day)
}

func (m *TimeDecayModel) Name() string {
	return "time_decay"
}

func (m *TimeDecayModel) Calculate(journey UserJourney) (AttributionResult, error) {
	if len(journey.TouchPoints) == 0 {
		return AttributionResult{}, fmt.Errorf("no touchpoints in journey")
	}

	if m.DecayRate <= 0 {
		m.DecayRate = 0.1 // Default decay rate
	}

	// Sort touchpoints by timestamp
	touchpoints := make([]TouchPoint, len(journey.TouchPoints))
	copy(touchpoints, journey.TouchPoints)
	sort.Slice(touchpoints, func(i, j int) bool {
		return touchpoints[i].Timestamp < touchpoints[j].Timestamp
	})

	// Calculate weights based on time decay
	weights := make([]float64, len(touchpoints))
	totalWeight := 0.0

	for i, touch := range touchpoints {
		// Time delta in hours from conversion
		timeDelta := float64(journey.JourneyEnd-touch.Timestamp) / 3600.0
		weight := math.Exp(-m.DecayRate * timeDelta)
		weights[i] = weight
		totalWeight += weight
	}

	// Normalize weights and create attribution
	attribution := make(map[string]AttributionData)

	for i, touch := range touchpoints {
		credit := weights[i] / totalWeight
		revenue := credit * journey.TotalRevenue

		attribution[touch.ID] = AttributionData{
			TouchPointID:   touch.ID,
			CampaignID:     touch.CampaignID,
			NetworkID:      touch.NetworkID,
			Credit:         credit,
			Revenue:        revenue,
			Position:       i + 1,
			TimeDelta:      journey.JourneyEnd - touch.Timestamp,
		}
	}

	return AttributionResult{
		UserID:         journey.UserID,
		SessionID:      journey.SessionID,
		AppID:          journey.AppID,
		ModelType:      m.Name(),
		Attribution:    attribution,
		TotalRevenue:   journey.TotalRevenue,
		CalculatedAt:   time.Now().Unix(),
		JourneyLength:  len(journey.TouchPoints),
		TimeToConvert:  journey.JourneyEnd - journey.JourneyStart,
	}, nil
}

// PositionBasedModel implements position-based attribution (40-20-40 model)
type PositionBasedModel struct {
	FirstTouchCredit  float64 `json:"first_touch_credit"`  // Default: 0.4
	LastTouchCredit   float64 `json:"last_touch_credit"`   // Default: 0.4
	MiddleTouchCredit float64 `json:"middle_touch_credit"` // Default: 0.2
}

func (m *PositionBasedModel) Name() string {
	return "position_based"
}

func (m *PositionBasedModel) Calculate(journey UserJourney) (AttributionResult, error) {
	if len(journey.TouchPoints) == 0 {
		return AttributionResult{}, fmt.Errorf("no touchpoints in journey")
	}

	// Set default credits if not specified
	if m.FirstTouchCredit == 0 {
		m.FirstTouchCredit = 0.4
	}
	if m.LastTouchCredit == 0 {
		m.LastTouchCredit = 0.4
	}
	if m.MiddleTouchCredit == 0 {
		m.MiddleTouchCredit = 0.2
	}

	// Sort touchpoints by timestamp
	touchpoints := make([]TouchPoint, len(journey.TouchPoints))
	copy(touchpoints, journey.TouchPoints)
	sort.Slice(touchpoints, func(i, j int) bool {
		return touchpoints[i].Timestamp < touchpoints[j].Timestamp
	})

	attribution := make(map[string]AttributionData)

	if len(touchpoints) == 1 {
		// Only one touchpoint gets all credit
		touch := touchpoints[0]
		attribution[touch.ID] = AttributionData{
			TouchPointID:   touch.ID,
			CampaignID:     touch.CampaignID,
			NetworkID:      touch.NetworkID,
			Credit:         1.0,
			Revenue:        journey.TotalRevenue,
			Position:       1,
			TimeDelta:      journey.JourneyEnd - touch.Timestamp,
		}
	} else if len(touchpoints) == 2 {
		// First touch and last touch split evenly
		firstCredit := 0.5
		lastCredit := 0.5

		// First touch
		firstTouch := touchpoints[0]
		attribution[firstTouch.ID] = AttributionData{
			TouchPointID:   firstTouch.ID,
			CampaignID:     firstTouch.CampaignID,
			NetworkID:      firstTouch.NetworkID,
			Credit:         firstCredit,
			Revenue:        firstCredit * journey.TotalRevenue,
			Position:       1,
			TimeDelta:      journey.JourneyEnd - firstTouch.Timestamp,
		}

		// Last touch
		lastTouch := touchpoints[1]
		attribution[lastTouch.ID] = AttributionData{
			TouchPointID:   lastTouch.ID,
			CampaignID:     lastTouch.CampaignID,
			NetworkID:      lastTouch.NetworkID,
			Credit:         lastCredit,
			Revenue:        lastCredit * journey.TotalRevenue,
			Position:       2,
			TimeDelta:      journey.JourneyEnd - lastTouch.Timestamp,
		}
	} else {
		// First touch gets 40%
		firstTouch := touchpoints[0]
		attribution[firstTouch.ID] = AttributionData{
			TouchPointID:   firstTouch.ID,
			CampaignID:     firstTouch.CampaignID,
			NetworkID:      firstTouch.NetworkID,
			Credit:         m.FirstTouchCredit,
			Revenue:        m.FirstTouchCredit * journey.TotalRevenue,
			Position:       1,
			TimeDelta:      journey.JourneyEnd - firstTouch.Timestamp,
		}

		// Last touch gets 40%
		lastTouch := touchpoints[len(touchpoints)-1]
		attribution[lastTouch.ID] = AttributionData{
			TouchPointID:   lastTouch.ID,
			CampaignID:     lastTouch.CampaignID,
			NetworkID:      lastTouch.NetworkID,
			Credit:         m.LastTouchCredit,
			Revenue:        m.LastTouchCredit * journey.TotalRevenue,
			Position:       len(touchpoints),
			TimeDelta:      journey.JourneyEnd - lastTouch.Timestamp,
		}

		// Middle touches share 20%
		if len(touchpoints) > 2 {
			middleTouches := touchpoints[1 : len(touchpoints)-1]
			middleCreditPerTouch := m.MiddleTouchCredit / float64(len(middleTouches))
			middleRevenuePerTouch := middleCreditPerTouch * journey.TotalRevenue

			for i, touch := range middleTouches {
				attribution[touch.ID] = AttributionData{
					TouchPointID:   touch.ID,
					CampaignID:     touch.CampaignID,
					NetworkID:      touch.NetworkID,
					Credit:         middleCreditPerTouch,
					Revenue:        middleRevenuePerTouch,
					Position:       i + 2, // Position starts from 2 (after first touch)
					TimeDelta:      journey.JourneyEnd - touch.Timestamp,
				}
			}
		}
	}

	return AttributionResult{
		UserID:         journey.UserID,
		SessionID:      journey.SessionID,
		AppID:          journey.AppID,
		ModelType:      m.Name(),
		Attribution:    attribution,
		TotalRevenue:   journey.TotalRevenue,
		CalculatedAt:   time.Now().Unix(),
		JourneyLength:  len(journey.TouchPoints),
		TimeToConvert:  journey.JourneyEnd - journey.JourneyStart,
	}, nil
}

// AttributionEngine manages attribution calculation with multiple models
type AttributionEngine struct {
	mu      sync.RWMutex
	models  map[string]AttributionModel
	metrics *AttributionMetrics
	ctx     context.Context
	cancel  context.CancelFunc
}

// AttributionMetrics tracks attribution engine performance
type AttributionMetrics struct {
	CalculationsProcessed     int64   `json:"calculations_processed"`
	AverageProcessingTime     float64 `json:"avg_processing_time_ms"`
	ErrorRate                 float64 `json:"error_rate"`
	ModelsUsage              map[string]int64 `json:"models_usage"`
}

// Prometheus metrics
var (
	attributionCalculations = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "attribution_calculations_total",
			Help: "Total number of attribution calculations",
		},
		[]string{"model", "app_id", "status"},
	)

	attributionDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "attribution_calculation_duration_seconds",
			Help:    "Duration of attribution calculations",
			Buckets: prometheus.ExponentialBuckets(0.001, 2, 10),
		},
		[]string{"model"},
	)

	journeyLength = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "attribution_journey_length",
			Help:    "Length of user attribution journeys",
			Buckets: []float64{1, 2, 3, 5, 10, 20, 50, 100},
		},
		[]string{"app_id"},
	)
)

// NewAttributionEngine creates a new attribution engine
func NewAttributionEngine() *AttributionEngine {
	ctx, cancel := context.WithCancel(context.Background())

	engine := &AttributionEngine{
		models: make(map[string]AttributionModel),
		metrics: &AttributionMetrics{
			ModelsUsage: make(map[string]int64),
		},
		ctx:    ctx,
		cancel: cancel,
	}

	// Register default models
	engine.RegisterModel(&FirstTouchModel{})
	engine.RegisterModel(&LastTouchModel{})
	engine.RegisterModel(&LinearModel{})
	engine.RegisterModel(&TimeDecayModel{DecayRate: 0.1})
	engine.RegisterModel(&PositionBasedModel{
		FirstTouchCredit:  0.4,
		LastTouchCredit:   0.4,
		MiddleTouchCredit: 0.2,
	})

	log.Printf("Attribution engine initialized with %d models", len(engine.models))

	return engine
}

// RegisterModel adds a new attribution model
func (e *AttributionEngine) RegisterModel(model AttributionModel) {
	e.mu.Lock()
	defer e.mu.Unlock()

	e.models[model.Name()] = model
	e.metrics.ModelsUsage[model.Name()] = 0

	log.Printf("Registered attribution model: %s", model.Name())
}

// Calculate performs attribution calculation using specified model
func (e *AttributionEngine) Calculate(journey UserJourney, modelName string) (AttributionResult, error) {
	start := time.Now()

	e.mu.RLock()
	model, exists := e.models[modelName]
	e.mu.RUnlock()

	if !exists {
		attributionCalculations.WithLabelValues(modelName, journey.AppID, "error").Inc()
		return AttributionResult{}, fmt.Errorf("unknown attribution model: %s", modelName)
	}

	// Calculate attribution
	result, err := model.Calculate(journey)

	duration := time.Since(start)
	attributionDuration.WithLabelValues(modelName).Observe(duration.Seconds())
	journeyLength.WithLabelValues(journey.AppID).Observe(float64(len(journey.TouchPoints)))

	if err != nil {
		attributionCalculations.WithLabelValues(modelName, journey.AppID, "error").Inc()
		return result, err
	}

	// Update metrics
	e.mu.Lock()
	e.metrics.CalculationsProcessed++
	e.metrics.ModelsUsage[modelName]++
	e.mu.Unlock()

	attributionCalculations.WithLabelValues(modelName, journey.AppID, "success").Inc()

	log.Printf("Attribution calculated: %s model, journey length: %d, revenue: %.2f",
		modelName, len(journey.TouchPoints), journey.TotalRevenue)

	return result, nil
}

// CalculateAll calculates attribution using all available models
func (e *AttributionEngine) CalculateAll(journey UserJourney) (map[string]AttributionResult, error) {
	e.mu.RLock()
	modelNames := make([]string, 0, len(e.models))
	for name := range e.models {
		modelNames = append(modelNames, name)
	}
	e.mu.RUnlock()

	results := make(map[string]AttributionResult)

	for _, modelName := range modelNames {
		result, err := e.Calculate(journey, modelName)
		if err != nil {
			log.Printf("Error calculating attribution with model %s: %v", modelName, err)
			continue
		}
		results[modelName] = result
	}

	return results, nil
}

// GetAvailableModels returns list of available attribution models
func (e *AttributionEngine) GetAvailableModels() []string {
	e.mu.RLock()
	defer e.mu.RUnlock()

	models := make([]string, 0, len(e.models))
	for name := range e.models {
		models = append(models, name)
	}

	return models
}

// GetMetrics returns current attribution engine metrics
func (e *AttributionEngine) GetMetrics() AttributionMetrics {
	e.mu.RLock()
	defer e.mu.RUnlock()

	// Create a copy to avoid race conditions
	metrics := AttributionMetrics{
		CalculationsProcessed: e.metrics.CalculationsProcessed,
		AverageProcessingTime: e.metrics.AverageProcessingTime,
		ErrorRate:            e.metrics.ErrorRate,
		ModelsUsage:          make(map[string]int64),
	}

	for model, count := range e.metrics.ModelsUsage {
		metrics.ModelsUsage[model] = count
	}

	return metrics
}

// Stop gracefully shuts down the attribution engine
func (e *AttributionEngine) Stop() {
	e.cancel()
	log.Println("Attribution engine stopped")
}

func main() {
	// Example usage of the attribution engine
	engine := NewAttributionEngine()
	defer engine.Stop()

	// Sample user journey for testing
	journey := UserJourney{
		UserID:    "user_123",
		AppID:     "com.example.app",
		SessionID: "session_456",
		TouchPoints: []TouchPoint{
			{
				ID:         "touch_1",
				AppID:      "com.example.app",
				UserID:     "user_123",
				SessionID:  "session_456",
				EventType:  "click",
				Timestamp:  time.Now().Unix() - 86400*7, // 7 days ago
				CampaignID: "campaign_123",
				NetworkID:  "facebook",
				Platform:   "ios",
			},
			{
				ID:         "touch_2",
				AppID:      "com.example.app",
				UserID:     "user_123",
				SessionID:  "session_456",
				EventType:  "impression",
				Timestamp:  time.Now().Unix() - 86400*3, // 3 days ago
				CampaignID: "campaign_456",
				NetworkID:  "google",
				Platform:   "ios",
			},
			{
				ID:         "touch_3",
				AppID:      "com.example.app",
				UserID:     "user_123",
				SessionID:  "session_456",
				EventType:  "click",
				Timestamp:  time.Now().Unix() - 86400, // 1 day ago
				CampaignID: "campaign_789",
				NetworkID:  "apple_search_ads",
				Platform:   "ios",
			},
		},
		ConversionEvent: TouchPoint{
			ID:        "conversion_1",
			AppID:     "com.example.app",
			UserID:    "user_123",
			SessionID: "session_456",
			EventType: "install",
			Timestamp: time.Now().Unix(),
			Revenue:   9.99,
			Currency:  "USD",
			Platform:  "ios",
		},
		JourneyStart: time.Now().Unix() - 86400*7, // 7 days ago
		JourneyEnd:   time.Now().Unix(),
		TotalRevenue: 9.99,
	}

	// Test all attribution models
	results, err := engine.CalculateAll(journey)
	if err != nil {
		log.Fatalf("Failed to calculate attribution: %v", err)
	}

	// Print results
	for modelName, result := range results {
		log.Printf("\n=== %s Attribution ===", modelName)
		log.Printf("Journey Length: %d touchpoints", result.JourneyLength)
		log.Printf("Total Revenue: $%.2f", result.TotalRevenue)
		log.Printf("Time to Convert: %d seconds", result.TimeToConvert)

		for touchID, attr := range result.Attribution {
			log.Printf("TouchPoint %s: %.1f%% credit, $%.2f revenue (Campaign: %s, Network: %s)",
				touchID, attr.Credit*100, attr.Revenue, attr.CampaignID, attr.NetworkID)
		}
	}

	// Print engine metrics
	metrics := engine.GetMetrics()
	log.Printf("\n=== Engine Metrics ===")
	log.Printf("Total Calculations: %d", metrics.CalculationsProcessed)
	for model, count := range metrics.ModelsUsage {
		log.Printf("%s model used: %d times", model, count)
	}

	log.Println("\n🚀 Attribution Engine is ready for production!")
	log.Println("📊 Supports 5 attribution models: first_touch, last_touch, linear, time_decay, position_based")
	log.Println("⚡ Optimized for high-throughput processing with Prometheus metrics")
}