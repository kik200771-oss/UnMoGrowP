/**
 * Event Processor - Real-time Attribution Event Processing
 * UnMoGrowP Attribution Platform
 *
 * High-throughput event processing pipeline that:
 * 1. Ingests raw events into ClickHouse
 * 2. Processes attribution in real-time
 * 3. Updates user journeys and touchpoint tracking
 * 4. Calculates multi-touch attribution weights
 */

import { AttributionEngine, AttributionService, type Touchpoint, type ConversionEvent } from './attribution-engine';
import type { Database } from './multi-tenant-database';

// Event processing interfaces
export interface RawEvent {
  // Tenant context
  organization_id: string;
  app_id: string;

  // Event identification
  event_id?: string;
  event_type: string;
  event_name: string;
  event_timestamp: Date;

  // User context
  user_id?: string;
  device_id: string;
  session_id: string;
  anonymous_id?: string;

  // Attribution data
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  campaign_id?: string;
  creative_id?: string;
  click_id?: string;

  // Device context
  platform: string;
  os_name?: string;
  os_version?: string;
  app_version?: string;
  device_model?: string;

  // Geographic
  ip_address?: string;
  country?: string;
  region?: string;
  city?: string;

  // Business data
  revenue?: number;
  currency?: string;
  product_id?: string;
  quantity?: number;

  // Custom properties
  properties?: Record<string, any>;

  // Quality control
  is_valid?: boolean;
  fraud_score?: number;
  data_quality_score?: number;
}

export interface ProcessedEvent extends RawEvent {
  // Attribution results
  attribution_model_used: string;
  attribution_source?: string;
  attribution_medium?: string;
  attribution_campaign?: string;
  attribution_touchpoint_count: number;

  // Attribution timing
  first_touch_timestamp?: Date;
  last_touch_timestamp?: Date;
  time_to_conversion_minutes?: number;

  // Attribution weights
  first_touch_weight: number;
  last_touch_weight: number;
  linear_weight: number;
  time_decay_weight: number;
  position_based_weight: number;

  // Attributed revenue
  attributed_revenue_first_touch: number;
  attributed_revenue_last_touch: number;
  attributed_revenue_linear: number;
  attributed_revenue_time_decay: number;
  attributed_revenue_position_based: number;

  // Processing metadata
  processed_timestamp: Date;
  attribution_engine_version: string;
}

export interface UserJourneyTouchpoint {
  organization_id: string;
  app_id: string;
  user_id: string;
  device_id: string;

  touchpoint_id: string;
  touchpoint_type: 'impression' | 'click' | 'install' | 'event' | 'conversion';
  touchpoint_timestamp: Date;

  campaign_id?: string;
  campaign_name?: string;
  source: string;
  medium: string;
  content?: string;
  creative_id?: string;

  is_within_attribution_window: boolean;
  attribution_window_days: number;

  journey_position: number;
  is_first_touchpoint: boolean;
  is_last_touchpoint: boolean;

  leads_to_conversion: boolean;
  conversion_event_id?: string;
  conversion_timestamp?: Date;
  conversion_revenue?: number;

  // Attribution weights (calculated by engine)
  attribution_weight_first_touch: number;
  attribution_weight_last_touch: number;
  attribution_weight_linear: number;
  attribution_weight_time_decay: number;
  attribution_weight_position_based: number;
}

/**
 * High-performance event processor for real-time attribution
 */
export class EventProcessor {
  private attributionService: AttributionService;
  private db: Database;
  private batchSize: number = 1000;
  private batchTimeout: number = 5000; // 5 seconds
  private eventBatch: RawEvent[] = [];
  private batchTimer?: NodeJS.Timeout;

  constructor(
    attributionService: AttributionService,
    db: Database,
    options?: {
      batchSize?: number;
      batchTimeout?: number;
    }
  ) {
    this.attributionService = attributionService;
    this.db = db;

    if (options?.batchSize) this.batchSize = options.batchSize;
    if (options?.batchTimeout) this.batchTimeout = options.batchTimeout;
  }

  /**
   * Process single event (adds to batch for performance)
   */
  async processEvent(event: RawEvent): Promise<void> {
    // Validate event
    if (!this.validateEvent(event)) {
      console.warn('Invalid event rejected:', event.event_id);
      return;
    }

    // Add to batch
    this.eventBatch.push(event);

    // Process batch if full
    if (this.eventBatch.length >= this.batchSize) {
      await this.processBatch();
    } else if (!this.batchTimer) {
      // Set timer for partial batch
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchTimeout);
    }
  }

  /**
   * Process batch of events
   */
  private async processBatch(): Promise<void> {
    if (this.eventBatch.length === 0) return;

    const batch = [...this.eventBatch];
    this.eventBatch = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    try {
      console.log(`Processing batch of ${batch.length} events`);

      // 1. Store raw events to ClickHouse
      await this.storeRawEvents(batch);

      // 2. Identify conversion events for attribution processing
      const conversionEvents = batch.filter(event =>
        this.isConversionEvent(event.event_type)
      );

      // 3. Process each conversion event for attribution
      for (const conversionEvent of conversionEvents) {
        try {
          await this.processConversionAttribution(conversionEvent);
        } catch (error) {
          console.error('Attribution processing failed for event:', conversionEvent.event_id, error);
        }
      }

      // 4. Update user journey touchpoints
      const touchpointEvents = batch.filter(event =>
        this.isTouchpointEvent(event.event_type)
      );

      for (const touchpointEvent of touchpointEvents) {
        try {
          await this.updateUserJourney(touchpointEvent);
        } catch (error) {
          console.error('Journey tracking failed for event:', touchpointEvent.event_id, error);
        }
      }

      console.log(`Successfully processed ${batch.length} events`);

    } catch (error) {
      console.error('Batch processing failed:', error);
      // In production, implement retry logic or dead letter queue
    }
  }

  /**
   * Store raw events to ClickHouse raw_events table
   */
  private async storeRawEvents(events: RawEvent[]): Promise<void> {
    const values = events.map(event => {
      const eventId = event.event_id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return `(
        '${event.organization_id}',
        '${event.app_id}',
        '${eventId}',
        '${event.event_type}',
        '${event.event_name}',
        '${event.event_timestamp.toISOString()}',
        '${new Date().toISOString()}',
        ${event.user_id ? `'${event.user_id}'` : 'NULL'},
        '${event.device_id}',
        '${event.session_id}',
        ${event.anonymous_id ? `'${event.anonymous_id}'` : 'NULL'},
        ${event.utm_source ? `'${event.utm_source}'` : 'NULL'},
        ${event.utm_medium ? `'${event.utm_medium}'` : 'NULL'},
        ${event.utm_campaign ? `'${event.utm_campaign}'` : 'NULL'},
        ${event.utm_content ? `'${event.utm_content}'` : 'NULL'},
        ${event.utm_term ? `'${event.utm_term}'` : 'NULL'},
        ${event.campaign_id ? `'${event.campaign_id}'` : 'NULL'},
        ${event.creative_id ? `'${event.creative_id}'` : 'NULL'},
        ${event.placement_id ? `'${event.placement_id}'` : 'NULL'},
        ${event.click_id ? `'${event.click_id}'` : 'NULL'},
        '${event.platform || 'unknown'}',
        ${event.os_name ? `'${event.os_name}'` : 'NULL'},
        ${event.os_version ? `'${event.os_version}'` : 'NULL'},
        ${event.app_version ? `'${event.app_version}'` : 'NULL'},
        ${event.device_model ? `'${event.device_model}'` : 'NULL'},
        ${this.parseIP(event.ip_address)},
        ${event.country ? `'${event.country}'` : 'NULL'},
        ${event.region ? `'${event.region}'` : 'NULL'},
        ${event.city ? `'${event.city}'` : 'NULL'},
        ${event.revenue || 'NULL'},
        ${event.currency ? `'${event.currency}'` : 'NULL'},
        ${event.product_id ? `'${event.product_id}'` : 'NULL'},
        ${event.quantity || 'NULL'},
        '${JSON.stringify(event.properties || {})}',
        ${event.is_valid !== false ? 'true' : 'false'},
        ${event.fraud_score || 'NULL'},
        ${event.data_quality_score || 1.0}
      )`;
    }).join(',');

    const query = `
      INSERT INTO raw_events (
        organization_id, app_id, event_id, event_type, event_name,
        event_timestamp, server_timestamp, user_id, device_id, session_id, anonymous_id,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        campaign_id, creative_id, placement_id, click_id,
        platform, os_name, os_version, app_version, device_model,
        ip_address, country, region, city, revenue, currency, product_id, quantity,
        properties, is_valid, fraud_score, data_quality_score
      ) VALUES ${values}
    `;

    await this.db.clickhouse.exec({ query });
  }

  /**
   * Process conversion event for multi-touch attribution
   */
  private async processConversionAttribution(conversionEvent: RawEvent): Promise<void> {
    if (!conversionEvent.user_id && !conversionEvent.device_id) {
      console.warn('Cannot process attribution: missing user_id and device_id');
      return;
    }

    // Convert to ConversionEvent format
    const conversion: ConversionEvent = {
      id: conversionEvent.event_id || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: conversionEvent.event_timestamp,
      event_type: conversionEvent.event_type,
      revenue: conversionEvent.revenue || 0,
      organization_id: conversionEvent.organization_id,
      app_id: conversionEvent.app_id,
      user_id: conversionEvent.user_id || conversionEvent.device_id,
      device_id: conversionEvent.device_id
    };

    // Get attribution window for this app (default 7 days)
    const attributionWindow = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

    // Process attribution using the attribution service
    const attributionResults = await this.attributionService.processConversionEvent(
      conversion,
      attributionWindow
    );

    if (attributionResults.length === 0) {
      console.log(`No touchpoints found for conversion ${conversion.id}`);
      return;
    }

    // Store processed event with attribution data
    await this.storeProcessedEvent(conversionEvent, attributionResults);

    console.log(`Processed attribution for conversion ${conversion.id} with ${attributionResults.length} touchpoints`);
  }

  /**
   * Store processed event with attribution data
   */
  private async storeProcessedEvent(
    originalEvent: RawEvent,
    attributionResults: Array<{
      conversion_id: string;
      touchpoint_id: string;
      weights: { first_touch: number; last_touch: number; linear: number; time_decay: number; position_based: number };
      attributed_revenue: { first_touch: number; last_touch: number; linear: number; time_decay: number; position_based: number };
    }>
  ): Promise<void> {
    // Aggregate attribution weights (sum across all touchpoints)
    const totalWeights = attributionResults.reduce((acc, result) => {
      acc.first_touch += result.weights.first_touch;
      acc.last_touch += result.weights.last_touch;
      acc.linear += result.weights.linear;
      acc.time_decay += result.weights.time_decay;
      acc.position_based += result.weights.position_based;
      return acc;
    }, { first_touch: 0, last_touch: 0, linear: 0, time_decay: 0, position_based: 0 });

    const totalRevenue = attributionResults.reduce((acc, result) => {
      acc.first_touch += result.attributed_revenue.first_touch;
      acc.last_touch += result.attributed_revenue.last_touch;
      acc.linear += result.attributed_revenue.linear;
      acc.time_decay += result.attributed_revenue.time_decay;
      acc.position_based += result.attributed_revenue.position_based;
      return acc;
    }, { first_touch: 0, last_touch: 0, linear: 0, time_decay: 0, position_based: 0 });

    // Use linear model as primary (can be configurable per organization)
    const primaryModel = 'linear';

    const processedEvent = `(
      '${originalEvent.organization_id}',
      '${originalEvent.app_id}',
      '${originalEvent.event_id || `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`}',
      '${originalEvent.event_type}',
      '${originalEvent.event_name}',
      '${originalEvent.event_timestamp.toISOString()}',
      ${originalEvent.user_id ? `'${originalEvent.user_id}'` : 'NULL'},
      '${originalEvent.device_id}',
      '${originalEvent.session_id}',
      '${primaryModel}',
      ${originalEvent.utm_source ? `'${originalEvent.utm_source}'` : 'NULL'},
      ${originalEvent.utm_medium ? `'${originalEvent.utm_medium}'` : 'NULL'},
      ${originalEvent.utm_campaign ? `'${originalEvent.utm_campaign}'` : 'NULL'},
      ${attributionResults.length},
      NULL, NULL, NULL,
      ${totalWeights.first_touch},
      ${totalWeights.last_touch},
      ${totalWeights.linear},
      ${totalWeights.time_decay},
      ${totalWeights.position_based},
      ${totalRevenue.first_touch},
      ${totalRevenue.last_touch},
      ${totalRevenue.linear},
      ${totalRevenue.time_decay},
      ${totalRevenue.position_based},
      '${originalEvent.platform || 'unknown'}',
      ${originalEvent.country ? `'${originalEvent.country}'` : 'NULL'},
      ${originalEvent.revenue || 'NULL'},
      ${originalEvent.currency ? `'${originalEvent.currency}'` : 'NULL'},
      '${new Date().toISOString()}',
      '1.0.0'
    )`;

    const query = `
      INSERT INTO processed_events (
        organization_id, app_id, event_id, event_type, event_name, event_timestamp,
        user_id, device_id, session_id, attribution_model_used,
        attribution_source, attribution_medium, attribution_campaign, attribution_touchpoint_count,
        first_touch_timestamp, last_touch_timestamp, time_to_conversion_minutes,
        first_touch_weight, last_touch_weight, linear_weight, time_decay_weight, position_based_weight,
        attributed_revenue_first_touch, attributed_revenue_last_touch, attributed_revenue_linear,
        attributed_revenue_time_decay, attributed_revenue_position_based,
        platform, country, revenue, currency, processed_timestamp, attribution_engine_version
      ) VALUES ${processedEvent}
    `;

    await this.db.clickhouse.exec({ query });
  }

  /**
   * Update user journey with new touchpoint
   */
  private async updateUserJourney(event: RawEvent): Promise<void> {
    if (!event.user_id && !event.device_id) return;

    const userId = event.user_id || event.device_id;
    const touchpointId = `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine touchpoint type
    let touchpointType: UserJourneyTouchpoint['touchpoint_type'] = 'event';
    if (event.event_type === 'click') touchpointType = 'click';
    else if (event.event_type === 'impression') touchpointType = 'impression';
    else if (event.event_type === 'install') touchpointType = 'install';
    else if (this.isConversionEvent(event.event_type)) touchpointType = 'conversion';

    // Get current journey position
    const positionQuery = `
      SELECT max(journey_position) + 1 as next_position
      FROM user_journey_touchpoints
      WHERE organization_id = '${event.organization_id}'
        AND app_id = '${event.app_id}'
        AND user_id = '${userId}'
        AND touchpoint_timestamp >= now() - INTERVAL 30 DAY
    `;

    let journeyPosition = 1;
    try {
      const positionResult = await this.db.clickhouse.query({ query: positionQuery });
      journeyPosition = positionResult.data[0]?.next_position || 1;
    } catch (error) {
      console.warn('Could not determine journey position, using 1:', error);
    }

    const touchpoint = `(
      '${event.organization_id}',
      '${event.app_id}',
      '${userId}',
      '${event.device_id}',
      '${touchpointId}',
      '${touchpointType}',
      '${event.event_timestamp.toISOString()}',
      ${event.campaign_id ? `'${event.campaign_id}'` : 'NULL'},
      ${event.utm_campaign ? `'${event.utm_campaign}'` : 'NULL'},
      '${event.utm_source || 'unknown'}',
      '${event.utm_medium || 'unknown'}',
      ${event.utm_content ? `'${event.utm_content}'` : 'NULL'},
      ${event.creative_id ? `'${event.creative_id}'` : 'NULL'},
      true,
      7,
      ${journeyPosition},
      ${journeyPosition === 1 ? 'true' : 'false'},
      false,
      ${touchpointType === 'conversion' ? 'true' : 'false'},
      ${touchpointType === 'conversion' && event.event_id ? `'${event.event_id}'` : 'NULL'},
      ${touchpointType === 'conversion' ? `'${event.event_timestamp.toISOString()}'` : 'NULL'},
      ${touchpointType === 'conversion' && event.revenue ? event.revenue : 'NULL'},
      0, 0, 0, 0, 0
    )`;

    const query = `
      INSERT INTO user_journey_touchpoints (
        organization_id, app_id, user_id, device_id, touchpoint_id, touchpoint_type, touchpoint_timestamp,
        campaign_id, campaign_name, source, medium, content, creative_id,
        is_within_attribution_window, attribution_window_days, journey_position,
        is_first_touchpoint, is_last_touchpoint, leads_to_conversion,
        conversion_event_id, conversion_timestamp, conversion_revenue,
        attribution_weight_first_touch, attribution_weight_last_touch,
        attribution_weight_linear, attribution_weight_time_decay, attribution_weight_position_based
      ) VALUES ${touchpoint}
    `;

    await this.db.clickhouse.exec({ query });
  }

  /**
   * Force process current batch (for graceful shutdown)
   */
  async flush(): Promise<void> {
    if (this.eventBatch.length > 0) {
      await this.processBatch();
    }
  }

  /**
   * Validate event data
   */
  private validateEvent(event: RawEvent): boolean {
    return !!(
      event.organization_id &&
      event.app_id &&
      event.event_type &&
      event.device_id &&
      event.event_timestamp
    );
  }

  /**
   * Check if event type is a conversion event
   */
  private isConversionEvent(eventType: string): boolean {
    return [
      'purchase', 'subscription', 'conversion', 'checkout',
      'trial_start', 'signup', 'lead', 'install'
    ].includes(eventType.toLowerCase());
  }

  /**
   * Check if event type is a touchpoint event
   */
  private isTouchpointEvent(eventType: string): boolean {
    return [
      'click', 'impression', 'view', 'install', 'app_open',
      'page_view', 'screen_view', 'engagement'
    ].includes(eventType.toLowerCase());
  }

  /**
   * Parse IP address for ClickHouse IPv4 format
   */
  private parseIP(ip?: string): string {
    if (!ip) return 'NULL';
    // Simple IPv4 validation - in production use proper IP validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      return `toIPv4('${ip}')`;
    }
    return 'NULL';
  }
}

/**
 * Event processor factory with common configurations
 */
export class EventProcessorFactory {
  /**
   * Create high-throughput processor for mobile apps
   */
  static createMobileProcessor(
    attributionService: AttributionService,
    db: Database
  ): EventProcessor {
    return new EventProcessor(attributionService, db, {
      batchSize: 500,   // Smaller batches for faster processing
      batchTimeout: 2000 // 2 second timeout
    });
  }

  /**
   * Create processor optimized for web analytics
   */
  static createWebProcessor(
    attributionService: AttributionService,
    db: Database
  ): EventProcessor {
    return new EventProcessor(attributionService, db, {
      batchSize: 1000,  // Larger batches for web volume
      batchTimeout: 5000 // 5 second timeout
    });
  }

  /**
   * Create processor for real-time dashboard updates
   */
  static createRealtimeProcessor(
    attributionService: AttributionService,
    db: Database
  ): EventProcessor {
    return new EventProcessor(attributionService, db, {
      batchSize: 100,   // Very small batches
      batchTimeout: 1000 // 1 second timeout for near real-time
    });
  }
}

// Export singleton for easy use
export const eventProcessor = EventProcessorFactory.createMobileProcessor;