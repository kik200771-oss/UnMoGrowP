package clickhouse

import (
	"context"
	"fmt"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/ClickHouse/clickhouse-go/v2/lib/driver"
)

// Client wraps ClickHouse connection
type Client struct {
	conn driver.Conn
}

// Config holds ClickHouse connection configuration
type Config struct {
	Host     string
	Port     int
	Database string
	Username string
	Password string
}

// NewClient creates new ClickHouse client
func NewClient(cfg Config) (*Client, error) {
	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: []string{fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)},
		Auth: clickhouse.Auth{
			Database: cfg.Database,
			Username: cfg.Username,
			Password: cfg.Password,
		},
		Settings: clickhouse.Settings{
			"max_execution_time": 60,
		},
		DialTimeout: 5 * time.Second,
		Compression: &clickhouse.Compression{
			Method: clickhouse.CompressionLZ4,
		},
	})

	if err != nil {
		return nil, fmt.Errorf("failed to connect to ClickHouse: %w", err)
	}

	// Test connection
	if err := conn.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping ClickHouse: %w", err)
	}

	return &Client{conn: conn}, nil
}

// InsertEvent inserts single event into ClickHouse
func (c *Client) InsertEvent(ctx context.Context, event map[string]interface{}) error {
	// TODO: Implement batch insert for better performance
	return nil
}

// InsertBatch inserts multiple events in batch
func (c *Client) InsertBatch(ctx context.Context, events []map[string]interface{}) error {
	// TODO: Implement batch insert
	return nil
}

// Close closes ClickHouse connection
func (c *Client) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}
