/**
 * Streaming Attribution Processor
 * UnMoGrowP Attribution Platform
 *
 * Real-time streaming processor for high-throughput event attribution.
 * Integrates with Go ingestion service and processes events in real-time.
 */

import { EventProcessor, EventProcessorFactory, type RawEvent } from './event-processor';
import { AttributionService, AttributionEngineFactory } from './attribution-engine';
import { pool } from './multi-tenant-database';
import { clickhouse } from './clickhouse';
import type { Database } from './multi-tenant-database';

// Streaming configuration
interface StreamingConfig {
  maxConcurrentProcessors: number;
  eventBufferSize: number;
  processingIntervalMs: number;
  metricsIntervalMs: number;
  errorRetryAttempts: number;
}

// Processing metrics
interface ProcessingMetrics {
  eventsReceived: number;
  eventsProcessed: number;
  eventsErrored: number;
  processingLatencyMs: number;
  queueSize: number;
  attributionCalculations: number;
  lastProcessedTimestamp: Date;
}

/**
 * High-performance streaming processor for attribution events
 */
export class StreamingAttributionProcessor {
  private eventProcessor: EventProcessor;
  private eventQueue: RawEvent[] = [];
  private processing = false;
  private metrics: ProcessingMetrics = {
    eventsReceived: 0,
    eventsProcessed: 0,
    eventsErrored: 0,
    processingLatencyMs: 0,
    queueSize: 0,
    attributionCalculations: 0,
    lastProcessedTimestamp: new Date()
  };

  private config: StreamingConfig = {
    maxConcurrentProcessors: 4,
    eventBufferSize: 10000,
    processingIntervalMs: 100, // Process every 100ms
    metricsIntervalMs: 30000,  // Log metrics every 30 seconds
    errorRetryAttempts: 3
  };

  private metricsInterval?: NodeJS.Timeout;
  private processingInterval?: NodeJS.Timeout;

  constructor(
    config?: Partial<StreamingConfig>
  ) {
    // Override default config
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Initialize attribution engine and service
    const attributionEngine = AttributionEngineFactory.createStandard();
    const mockDb = { clickhouse, pool }; // Mock database interface
    const attributionService = new AttributionService(attributionEngine, mockDb as any);

    // Create event processor optimized for streaming
    this.eventProcessor = new EventProcessor(attributionService, mockDb as any, {
      batchSize: 100,   // Small batches for real-time processing
      batchTimeout: 1000 // 1 second timeout
    });

    console.log('StreamingAttributionProcessor initialized');
    console.log(`Config: ${JSON.stringify(this.config, null, 2)}`);
  }

  /**
   * Start the streaming processor
   */
  start(): void {
    console.log('🚀 Starting StreamingAttributionProcessor...');

    // Start processing interval
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.config.processingIntervalMs);

    // Start metrics interval
    this.metricsInterval = setInterval(() => {
      this.logMetrics();
    }, this.config.metricsIntervalMs);

    console.log('✅ StreamingAttributionProcessor started');
  }

  /**
   * Stop the streaming processor
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping StreamingAttributionProcessor...');

    // Stop intervals
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }

    // Process remaining events
    await this.processQueue();

    // Flush event processor
    await this.eventProcessor.flush();

    console.log('✅ StreamingAttributionProcessor stopped');
  }

  /**
   * Add event to processing queue (called by Go ingestion service)
   */
  addEvent(event: RawEvent): boolean {
    // Check queue capacity
    if (this.eventQueue.length >= this.config.eventBufferSize) {
      console.warn(`Event queue full (${this.config.eventBufferSize}), dropping event`);
      return false;
    }

    // Add timestamp if not present
    if (!event.event_timestamp) {
      event.event_timestamp = new Date();
    }

    // Add to queue
    this.eventQueue.push(event);
    this.metrics.eventsReceived++;
    this.metrics.queueSize = this.eventQueue.length;

    return true;
  }

  /**
   * Process events from queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.eventQueue.length === 0) {
      return;
    }

    this.processing = true;
    const startTime = Date.now();

    try {
      // Take batch from queue
      const batchSize = Math.min(100, this.eventQueue.length);
      const batch = this.eventQueue.splice(0, batchSize);

      console.log(`Processing batch of ${batch.length} events`);

      // Process events
      for (const event of batch) {
        try {
          await this.eventProcessor.processEvent(event);
          this.metrics.eventsProcessed++;

          // Count attribution calculations for conversion events
          if (this.isConversionEvent(event.event_type)) {
            this.metrics.attributionCalculations++;
          }

        } catch (error) {
          console.error('Event processing error:', error);
          this.metrics.eventsErrored++;

          // Retry logic could be implemented here
          // For now, we'll just log and continue
        }
      }

      // Update metrics
      this.metrics.processingLatencyMs = Date.now() - startTime;
      this.metrics.queueSize = this.eventQueue.length;
      this.metrics.lastProcessedTimestamp = new Date();

    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Get current processing metrics
   */
  getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }

  /**
   * Log processing metrics
   */
  private logMetrics(): void {
    const metrics = this.getMetrics();
    console.log('📊 Attribution Processing Metrics:');
    console.log(`   Events Received: ${metrics.eventsReceived}`);
    console.log(`   Events Processed: ${metrics.eventsProcessed}`);
    console.log(`   Events Errored: ${metrics.eventsErrored}`);
    console.log(`   Queue Size: ${metrics.queueSize}`);
    console.log(`   Attribution Calculations: ${metrics.attributionCalculations}`);
    console.log(`   Processing Latency: ${metrics.processingLatencyMs}ms`);
    console.log(`   Success Rate: ${((metrics.eventsProcessed / (metrics.eventsProcessed + metrics.eventsErrored)) * 100).toFixed(2)}%`);
    console.log(`   Last Processed: ${metrics.lastProcessedTimestamp.toISOString()}`);
    console.log('');
  }

  /**
   * Health check for the processor
   */
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  } {
    const metrics = this.getMetrics();
    const now = Date.now();
    const lastProcessedAge = now - metrics.lastProcessedTimestamp.getTime();
    const errorRate = metrics.eventsErrored / (metrics.eventsProcessed + metrics.eventsErrored || 1);

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check various health conditions
    if (metrics.queueSize > this.config.eventBufferSize * 0.8) {
      status = 'degraded'; // Queue getting full
    }

    if (errorRate > 0.1) {
      status = 'degraded'; // High error rate
    }

    if (lastProcessedAge > 60000) {
      status = 'unhealthy'; // Haven't processed anything in 1 minute
    }

    if (metrics.queueSize >= this.config.eventBufferSize) {
      status = 'unhealthy'; // Queue is full
    }

    if (errorRate > 0.5) {
      status = 'unhealthy'; // Very high error rate
    }

    return {
      status,
      details: {
        queueSize: metrics.queueSize,
        queueCapacity: this.config.eventBufferSize,
        errorRate: (errorRate * 100).toFixed(2) + '%',
        lastProcessedAge: Math.round(lastProcessedAge / 1000) + 's',
        processingLatency: metrics.processingLatencyMs + 'ms',
        eventsPerSecond: Math.round(metrics.eventsProcessed / (Date.now() / 1000)),
        isProcessing: this.processing
      }
    };
  }

  /**
   * Reset metrics (for testing or monitoring)
   */
  resetMetrics(): void {
    this.metrics = {
      eventsReceived: 0,
      eventsProcessed: 0,
      eventsErrored: 0,
      processingLatencyMs: 0,
      queueSize: this.eventQueue.length,
      attributionCalculations: 0,
      lastProcessedTimestamp: new Date()
    };
    console.log('📊 Metrics reset');
  }

  /**
   * Check if event is a conversion event
   */
  private isConversionEvent(eventType: string): boolean {
    return [
      'purchase', 'subscription', 'conversion', 'checkout',
      'trial_start', 'signup', 'lead', 'install'
    ].includes(eventType.toLowerCase());
  }
}

/**
 * Global streaming processor instance
 */
class StreamingProcessorManager {
  private processor?: StreamingAttributionProcessor;
  private initialized = false;

  /**
   * Initialize the streaming processor
   */
  init(config?: Partial<StreamingConfig>): StreamingAttributionProcessor {
    if (this.initialized) {
      console.warn('StreamingProcessor already initialized');
      return this.processor!;
    }

    console.log('🏗️ Initializing StreamingAttributionProcessor...');

    this.processor = new StreamingAttributionProcessor(config);
    this.initialized = true;

    // Start the processor
    this.processor.start();

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('🔄 Graceful shutdown initiated...');
      this.shutdown();
    });

    process.on('SIGTERM', () => {
      console.log('🔄 Graceful shutdown initiated...');
      this.shutdown();
    });

    console.log('✅ StreamingAttributionProcessor initialized');
    return this.processor;
  }

  /**
   * Get the processor instance
   */
  getProcessor(): StreamingAttributionProcessor {
    if (!this.initialized || !this.processor) {
      throw new Error('StreamingProcessor not initialized. Call init() first.');
    }
    return this.processor;
  }

  /**
   * Shutdown the processor
   */
  async shutdown(): Promise<void> {
    if (this.processor) {
      await this.processor.stop();
    }
    process.exit(0);
  }
}

// Export singleton manager
export const streamingProcessorManager = new StreamingProcessorManager();

// Export factory functions for different use cases
export class StreamingProcessorFactory {
  /**
   * Create processor optimized for mobile apps (high volume, fast processing)
   */
  static createMobileProcessor(): StreamingAttributionProcessor {
    return new StreamingAttributionProcessor({
      maxConcurrentProcessors: 6,
      eventBufferSize: 20000,
      processingIntervalMs: 50,  // Very fast processing
      metricsIntervalMs: 15000,  // Frequent metrics
      errorRetryAttempts: 2
    });
  }

  /**
   * Create processor optimized for web analytics (balanced processing)
   */
  static createWebProcessor(): StreamingAttributionProcessor {
    return new StreamingAttributionProcessor( {
      maxConcurrentProcessors: 4,
      eventBufferSize: 15000,
      processingIntervalMs: 100,
      metricsIntervalMs: 30000,
      errorRetryAttempts: 3
    });
  }

  /**
   * Create processor for enterprise (high reliability, detailed metrics)
   */
  static createEnterpriseProcessor(): StreamingAttributionProcessor {
    return new StreamingAttributionProcessor( {
      maxConcurrentProcessors: 8,
      eventBufferSize: 50000,
      processingIntervalMs: 100,
      metricsIntervalMs: 10000, // Very frequent metrics
      errorRetryAttempts: 5
    });
  }
}

// Export types
export type { StreamingConfig, ProcessingMetrics, RawEvent };