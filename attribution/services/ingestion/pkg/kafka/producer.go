package kafka

import (
	"context"
	"fmt"
	"time"

	"github.com/segmentio/kafka-go"
)

// Producer wraps Kafka producer
type Producer struct {
	writer *kafka.Writer
}

// Config holds Kafka producer configuration
type Config struct {
	Brokers []string
	Topic   string
}

// NewProducer creates new Kafka producer
func NewProducer(cfg Config) (*Producer, error) {
	writer := &kafka.Writer{
		Addr:         kafka.TCP(cfg.Brokers...),
		Topic:        cfg.Topic,
		Balancer:     &kafka.LeastBytes{}, // Distribute messages evenly
		RequiredAcks: kafka.RequireOne,    // Wait for leader acknowledgment
		Compression:  kafka.Snappy,         // Compress messages
		BatchSize:    100,                  // Batch up to 100 messages
		BatchTimeout: 10 * time.Millisecond,
		MaxAttempts:  3,
		Async:        true, // Enable async writes for high throughput
	}

	return &Producer{writer: writer}, nil
}

// SendEvent sends single event to Kafka
func (p *Producer) SendEvent(ctx context.Context, key, value []byte) error {
	msg := kafka.Message{
		Key:   key,
		Value: value,
		Time:  time.Now(),
	}

	return p.writer.WriteMessages(ctx, msg)
}

// SendBatch sends multiple events to Kafka
func (p *Producer) SendBatch(ctx context.Context, messages []kafka.Message) error {
	return p.writer.WriteMessages(ctx, messages...)
}

// Close closes Kafka producer
func (p *Producer) Close() error {
	if p.writer != nil {
		return p.writer.Close()
	}
	return nil
}

// Stats returns producer statistics
func (p *Producer) Stats() kafka.WriterStats {
	return p.writer.Stats()
}
