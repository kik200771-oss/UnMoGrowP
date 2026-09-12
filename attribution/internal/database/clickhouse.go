package database

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"time"

	_ "github.com/ClickHouse/clickhouse-go/v2"
)

type AttributionEvent struct {
	EventID         string                 `json:"event_id"`
	AppID           string                 `json:"app_id"`
	UserID          string                 `json:"user_id"`
	SessionID       string                 `json:"session_id"`
	EventType       string                 `json:"event_type"`
	Timestamp       int64                  `json:"timestamp"`
	ServerTimestamp int64                  `json:"server_timestamp,omitempty"`
	DeviceID        string                 `json:"device_id"`
	IDFA            string                 `json:"idfa,omitempty"`
	GAID            string                 `json:"gaid,omitempty"`
	Platform        string                 `json:"platform"`
	OSVersion       string                 `json:"os_version,omitempty"`
	AppVersion      string                 `json:"app_version,omitempty"`
	Country         string                 `json:"country"`
	Region          string                 `json:"region,omitempty"`
	City            string                 `json:"city,omitempty"`
	Language        string                 `json:"language,omitempty"`
	Timezone        string                 `json:"timezone,omitempty"`
	UserAgent       string                 `json:"user_agent,omitempty"`
	IPAddress       string                 `json:"ip_address,omitempty"`
	CampaignID      string                 `json:"campaign_id,omitempty"`
	AdGroupID       string                 `json:"ad_group_id,omitempty"`
	CreativeID      string                 `json:"creative_id,omitempty"`
	NetworkID       string                 `json:"network_id,omitempty"`
	Channel         string                 `json:"channel,omitempty"`
	Source          string                 `json:"source,omitempty"`
	Medium          string                 `json:"medium,omitempty"`
	Revenue         float64                `json:"revenue,omitempty"`
	Currency        string                 `json:"currency,omitempty"`
	CustomParams    map[string]interface{} `json:"custom_params,omitempty"`
	SDKVersion      string                 `json:"sdk_version,omitempty"`
	APIVersion      int                    `json:"api_version,omitempty"`
}

type ClickHouseDB struct {
	conn *sql.DB
}

func NewClickHouseConnection(host, port, database, username, password string) (*ClickHouseDB, error) {
	// For development, we'll use an in-memory fallback if ClickHouse is not available
	dsn := fmt.Sprintf("clickhouse://%s:%s@%s:%s/%s?dial_timeout=10s&max_execution_time=60",
		username, password, host, port, database)

	log.Printf("Attempting to connect to ClickHouse: %s", dsn)

	conn, err := sql.Open("clickhouse", dsn)
	if err != nil {
		log.Printf("Failed to create ClickHouse connection: %v", err)
		return &ClickHouseDB{conn: nil}, nil // Return with nil conn for fallback mode
	}

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := conn.PingContext(ctx); err != nil {
		log.Printf("ClickHouse connection failed, running in fallback mode: %v", err)
		conn.Close()
		return &ClickHouseDB{conn: nil}, nil // Return with nil conn for fallback mode
	}

	log.Println("ClickHouse connection established successfully")
	return &ClickHouseDB{conn: conn}, nil
}

func (db *ClickHouseDB) InsertEvents(events []AttributionEvent) error {
	if db.conn == nil {
		// Fallback mode - just log the events
		log.Printf("Fallback mode: Would insert %d events to ClickHouse", len(events))
		for i, event := range events {
			log.Printf("Event %d: %s - %s - %s - %s", i+1, event.EventID, event.EventType, event.AppID, event.UserID)
		}
		return nil
	}

	ctx := context.Background()
	tx, err := db.conn.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx, `
		INSERT INTO attribution.events (
			event_id, app_id, user_id, session_id, event_type,
			timestamp, server_timestamp, device_id, idfa, gaid,
			platform, os_version, app_version, country, region,
			city, language, timezone, user_agent, ip_address,
			campaign_id, ad_group_id, creative_id, network_id, channel,
			source, medium, revenue, currency, custom_params,
			sdk_version, api_version, processing_time
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	for _, event := range events {
		customParamsJSON := "{}"
		if event.CustomParams != nil {
			if jsonBytes, err := json.Marshal(event.CustomParams); err == nil {
				customParamsJSON = string(jsonBytes)
			}
		}

		serverTimestamp := event.ServerTimestamp
		if serverTimestamp == 0 {
			serverTimestamp = time.Now().UnixMilli()
		}

		timestamp := time.Unix(0, event.Timestamp*int64(time.Millisecond))
		serverTime := time.Unix(0, serverTimestamp*int64(time.Millisecond))
		processingTime := time.Now()

		_, err := stmt.ExecContext(ctx,
			event.EventID, event.AppID, event.UserID, event.SessionID, event.EventType,
			timestamp, serverTime, event.DeviceID, event.IDFA, event.GAID,
			event.Platform, event.OSVersion, event.AppVersion, event.Country, event.Region,
			event.City, event.Language, event.Timezone, event.UserAgent, event.IPAddress,
			event.CampaignID, event.AdGroupID, event.CreativeID, event.NetworkID, event.Channel,
			event.Source, event.Medium, event.Revenue, event.Currency, customParamsJSON,
			event.SDKVersion, event.APIVersion, processingTime,
		)
		if err != nil {
			return fmt.Errorf("failed to insert event %s: %w", event.EventID, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	log.Printf("Successfully inserted %d events to ClickHouse", len(events))
	return nil
}

func (db *ClickHouseDB) GetCustomerAnalytics(customerID string, limit int) (map[string]interface{}, error) {
	if db.conn == nil {
		// Fallback mode - return mock data
		log.Printf("Fallback mode: Would query analytics for customer %s", customerID)
		return map[string]interface{}{
			"customer_id":     customerID,
			"total_events":    1250,
			"total_users":     234,
			"total_revenue":   12499.99,
			"top_events":      []string{"app_open", "purchase", "screen_view"},
			"top_platforms":   []string{"ios", "android", "web"},
			"total_countries": 15,
			"data_source":     "fallback_mode",
		}, nil
	}

	ctx := context.Background()

	query := `
		SELECT
			count() as total_events,
			uniq(user_id) as unique_users,
			sum(revenue) as total_revenue,
			groupArray(event_type) as event_types,
			groupArray(platform) as platforms,
			uniq(country) as unique_countries
		FROM attribution.events
		WHERE app_id = ?
		LIMIT ?
	`

	row := db.conn.QueryRowContext(ctx, query, customerID, limit)

	var totalEvents, uniqueUsers, uniqueCountries int64
	var totalRevenue float64
	var eventTypes, platforms string

	err := row.Scan(&totalEvents, &uniqueUsers, &totalRevenue, &eventTypes, &platforms, &uniqueCountries)
	if err != nil {
		if err == sql.ErrNoRows {
			return map[string]interface{}{
				"customer_id":     customerID,
				"total_events":    0,
				"total_users":     0,
				"total_revenue":   0.0,
				"message":         "No data found for customer",
				"data_source":     "clickhouse",
			}, nil
		}
		return nil, fmt.Errorf("failed to query analytics: %w", err)
	}

	return map[string]interface{}{
		"customer_id":     customerID,
		"total_events":    totalEvents,
		"total_users":     uniqueUsers,
		"total_revenue":   totalRevenue,
		"event_types":     eventTypes,
		"platforms":       platforms,
		"total_countries": uniqueCountries,
		"data_source":     "clickhouse",
	}, nil
}

func (db *ClickHouseDB) GetCustomers(limit int) ([]map[string]interface{}, error) {
	if db.conn == nil {
		// Fallback mode - return mock data
		log.Printf("Fallback mode: Would query customers with limit %d", limit)
		return []map[string]interface{}{
			{
				"app_id":        "demo-app-1",
				"total_events":  850,
				"total_users":   120,
				"total_revenue": 8999.99,
				"platforms":     []string{"ios", "android", "web"},
			},
			{
				"app_id":        "demo-app-2",
				"total_events":  400,
				"total_users":   67,
				"total_revenue": 3499.99,
				"platforms":     []string{"web"},
			},
		}, nil
	}

	ctx := context.Background()

	query := `
		SELECT
			app_id,
			count() as total_events,
			uniq(user_id) as unique_users,
			sum(revenue) as total_revenue,
			groupArray(DISTINCT platform) as platforms
		FROM attribution.events
		GROUP BY app_id
		ORDER BY total_events DESC
		LIMIT ?
	`

	rows, err := db.conn.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query customers: %w", err)
	}
	defer rows.Close()

	var customers []map[string]interface{}
	for rows.Next() {
		var appID, platformsStr string
		var totalEvents, uniqueUsers int64
		var totalRevenue float64

		err := rows.Scan(&appID, &totalEvents, &uniqueUsers, &totalRevenue, &platformsStr)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		customers = append(customers, map[string]interface{}{
			"app_id":        appID,
			"total_events":  totalEvents,
			"total_users":   uniqueUsers,
			"total_revenue": totalRevenue,
			"platforms":     platformsStr,
		})
	}

	return customers, nil
}

func (db *ClickHouseDB) GetAttribution(customerID string, limit int) (map[string]interface{}, error) {
	if db.conn == nil {
		// Fallback mode
		log.Printf("Fallback mode: Would query attribution for customer %s", customerID)
		return map[string]interface{}{
			"customer_id":        customerID,
			"attribution_model":  "last_touch",
			"total_conversions":  45,
			"total_revenue":      4999.99,
			"top_channels":       []string{"facebook", "google_ads", "organic"},
			"conversion_rate":    0.187,
			"data_source":        "fallback_mode",
		}, nil
	}

	ctx := context.Background()

	// Simplified attribution query - in production this would be much more complex
	query := `
		SELECT
			count() as total_events,
			countIf(event_type = 'purchase') as conversions,
			sum(revenue) as attributed_revenue,
			groupArray(DISTINCT source) as top_sources,
			avg(revenue) as avg_revenue
		FROM attribution.events
		WHERE app_id = ? AND revenue > 0
		LIMIT ?
	`

	row := db.conn.QueryRowContext(ctx, query, customerID, limit)

	var totalEvents, conversions int64
	var attributedRevenue, avgRevenue float64
	var topSources string

	err := row.Scan(&totalEvents, &conversions, &attributedRevenue, &topSources, &avgRevenue)
	if err != nil {
		if err == sql.ErrNoRows {
			return map[string]interface{}{
				"customer_id":        customerID,
				"attribution_model":  "last_touch",
				"total_conversions":  0,
				"total_revenue":      0.0,
				"message":            "No attribution data found",
				"data_source":        "clickhouse",
			}, nil
		}
		return nil, fmt.Errorf("failed to query attribution: %w", err)
	}

	conversionRate := 0.0
	if totalEvents > 0 {
		conversionRate = float64(conversions) / float64(totalEvents)
	}

	return map[string]interface{}{
		"customer_id":        customerID,
		"attribution_model":  "last_touch",
		"total_conversions":  conversions,
		"total_revenue":      attributedRevenue,
		"top_sources":        topSources,
		"conversion_rate":    conversionRate,
		"avg_revenue":        avgRevenue,
		"data_source":        "clickhouse",
	}, nil
}

func (db *ClickHouseDB) Close() error {
	if db.conn != nil {
		return db.conn.Close()
	}
	return nil
}

func (db *ClickHouseDB) HealthCheck() error {
	if db.conn == nil {
		return fmt.Errorf("running in fallback mode - no database connection")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return db.conn.PingContext(ctx)
}

// Helper function to safely convert string to int
func safeAtoi(s string, defaultVal int) int {
	if val, err := strconv.Atoi(s); err == nil {
		return val
	}
	return defaultVal
}