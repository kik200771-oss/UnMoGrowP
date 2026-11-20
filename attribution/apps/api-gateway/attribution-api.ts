/**
 * Attribution API Endpoints
 * UnMoGrowP Attribution Platform
 *
 * REST API endpoints for attribution processing and analytics
 */

import { Hono } from 'hono';
// Simple validation without external dependencies
import { streamingProcessorManager, type RawEvent } from './streaming-processor';
import { clickhouse } from './clickhouse';
import { authenticate, requirePermission, Permission, type AuthContext } from './auth';

const app = new Hono<{ Variables: AuthContext }>();

// =============================================================================
// EVENT INGESTION ENDPOINTS
// =============================================================================

// Simple validation functions
function validateEvent(data: any): string | null {
  if (!data.event_type || typeof data.event_type !== 'string') {
    return 'event_type is required';
  }
  if (!data.event_name || typeof data.event_name !== 'string') {
    return 'event_name is required';
  }
  if (!data.device_id || typeof data.device_id !== 'string') {
    return 'device_id is required';
  }
  if (!data.session_id || typeof data.session_id !== 'string') {
    return 'session_id is required';
  }
  if (data.platform && !['ios', 'android', 'web'].includes(data.platform)) {
    return 'platform must be ios, android, or web';
  }
  if (data.revenue && (typeof data.revenue !== 'number' || data.revenue <= 0)) {
    return 'revenue must be a positive number';
  }
  if (data.currency && (typeof data.currency !== 'string' || data.currency.length !== 3)) {
    return 'currency must be a 3-character code';
  }
  return null;
}

/**
 * Single event ingestion
 * POST /api/attribution/events
 */
app.post(
  '/events',
  authenticate,
  requirePermission(Permission.ANALYTICS_READ),
  async (c) => {
    const auth = c.get('auth');

    // Get and validate request body
    let eventData;
    try {
      eventData = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400);
    }

    const validationError = validateEvent(eventData);
    if (validationError) {
      return c.json({ error: validationError, code: 'VALIDATION_ERROR' }, 400);
    }

    try {
      // Convert to RawEvent format
      const event: RawEvent = {
        organization_id: auth.organization_id,
        app_id: auth.app_id,
        event_timestamp: eventData.event_timestamp ? new Date(eventData.event_timestamp) : new Date(),
        ...eventData
      };

      // Get streaming processor
      const processor = streamingProcessorManager.getProcessor();

      // Add to processing queue
      const success = processor.addEvent(event);

      if (!success) {
        return c.json({
          error: 'Event queue full, please retry',
          code: 'QUEUE_FULL'
        }, 503);
      }

      return c.json({
        success: true,
        message: 'Event queued for processing',
        event_id: event.event_id || 'generated',
        processing_queue_size: processor.getMetrics().queueSize
      });

    } catch (error) {
      console.error('Event ingestion error:', error);
      return c.json({
        error: 'Internal server error',
        code: 'PROCESSING_ERROR'
      }, 500);
    }
  }
);

/**
 * Batch event ingestion
 * POST /api/attribution/events/batch
 */
app.post(
  '/events/batch',
  authenticate,
  requirePermission(Permission.ANALYTICS_READ),
  async (c) => {
    const auth = c.get('auth');

    // Get and validate request body
    let requestBody;
    try {
      requestBody = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, 400);
    }

    if (!requestBody.events || !Array.isArray(requestBody.events)) {
      return c.json({ error: 'events array is required', code: 'INVALID_EVENTS' }, 400);
    }

    if (requestBody.events.length === 0 || requestBody.events.length > 1000) {
      return c.json({ error: 'events array must contain 1-1000 events', code: 'INVALID_EVENT_COUNT' }, 400);
    }

    // Validate each event
    for (let i = 0; i < requestBody.events.length; i++) {
      const validationError = validateEvent(requestBody.events[i]);
      if (validationError) {
        return c.json({
          error: `Event ${i + 1}: ${validationError}`,
          code: 'VALIDATION_ERROR'
        }, 400);
      }
    }

    const { events } = requestBody;

    try {
      const processor = streamingProcessorManager.getProcessor();
      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const eventData of events) {
        const event: RawEvent = {
          organization_id: auth.organization_id,
          app_id: auth.app_id,
          event_timestamp: eventData.event_timestamp ? new Date(eventData.event_timestamp) : new Date(),
          ...eventData
        };

        const success = processor.addEvent(event);

        results.push({
          event_id: event.event_id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          success,
          error: success ? null : 'Queue full'
        });

        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      return c.json({
        success: failureCount === 0,
        message: `Processed ${successCount}/${events.length} events`,
        results,
        processing_queue_size: processor.getMetrics().queueSize
      });

    } catch (error) {
      console.error('Batch ingestion error:', error);
      return c.json({
        error: 'Internal server error',
        code: 'BATCH_PROCESSING_ERROR'
      }, 500);
    }
  }
);

// =============================================================================
// PROCESSING STATUS AND METRICS
// =============================================================================

/**
 * Get processor health and metrics
 * GET /api/attribution/status
 */
app.get(
  '/status',
  authenticate,
  requirePermission(Permission.ANALYTICS_READ),
  async (c) => {
    try {
      const processor = streamingProcessorManager.getProcessor();
      const health = processor.getHealth();
      const metrics = processor.getMetrics();

      return c.json({
        status: health.status,
        health: health.details,
        metrics: {
          events_received: metrics.eventsReceived,
          events_processed: metrics.eventsProcessed,
          events_errored: metrics.eventsErrored,
          queue_size: metrics.queueSize,
          attribution_calculations: metrics.attributionCalculations,
          processing_latency_ms: metrics.processingLatencyMs,
          success_rate: ((metrics.eventsProcessed / (metrics.eventsProcessed + metrics.eventsErrored || 1)) * 100).toFixed(2) + '%',
          last_processed: metrics.lastProcessedTimestamp
        },
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Status check error:', error);
      return c.json({
        error: 'Could not retrieve status',
        code: 'STATUS_ERROR'
      }, 500);
    }
  }
);

/**
 * Reset processing metrics
 * POST /api/attribution/status/reset
 */
app.post(
  '/status/reset',
  authenticate,
  requirePermission(Permission.ADMIN_ACCESS),
  async (c) => {
    try {
      const processor = streamingProcessorManager.getProcessor();
      processor.resetMetrics();

      return c.json({
        success: true,
        message: 'Metrics reset successfully',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Metrics reset error:', error);
      return c.json({
        error: 'Could not reset metrics',
        code: 'RESET_ERROR'
      }, 500);
    }
  }
);

// =============================================================================
// ATTRIBUTION ANALYTICS ENDPOINTS
// =============================================================================

/**
 * Get attribution summary for campaigns
 * GET /api/attribution/campaigns
 */
app.get(
  '/campaigns',
  authenticate,
  requirePermission(Permission.ANALYTICS_READ),
  async (c) => {
    const auth = c.get('auth');
    const days = parseInt(c.req.query('days') || '30');
    const model = c.req.query('model') || 'linear';

    try {
      const query = `
        SELECT
          attribution_model,
          campaign_id,
          campaign_name,
          source,
          medium,
          sum(attributed_conversions) as conversions,
          sum(attributed_revenue) as revenue,
          round(attributed_revenue / attributed_conversions, 2) as revenue_per_conversion,
          count(distinct date) as active_days
        FROM attribution_daily_summary
        WHERE organization_id = {organizationId:String}
          AND app_id = {appId:String}
          AND date >= today() - {days:UInt32}
          AND attribution_model = {model:String}
        GROUP BY attribution_model, campaign_id, campaign_name, source, medium
        HAVING conversions > 0
        ORDER BY revenue DESC
        LIMIT 100
      `;

      const result = await clickhouse.query({
        query,
        query_params: {
          organizationId: auth.organization_id,
          appId: auth.app_id,
          days,
          model
        }
      });

      return c.json({
        success: true,
        data: result.data,
        meta: {
          model,
          days,
          total_campaigns: result.data.length,
          generated_at: new Date()
        }
      });

    } catch (error) {
      console.error('Campaign analytics error:', error);
      return c.json({
        error: 'Could not retrieve campaign data',
        code: 'ANALYTICS_ERROR'
      }, 500);
    }
  }
);

/**
 * Get attribution model comparison
 * GET /api/attribution/models/compare
 */
app.get(
  '/models/compare',
  authenticate,
  requirePermission(Permission.ANALYTICS_READ),
  async (c) => {
    const auth = c.get('auth');
    const days = parseInt(c.req.query('days') || '30');

    try {
      const query = `
        SELECT
          'Model Comparison' as analysis,
          sum(attributed_revenue_first_touch) as first_touch_revenue,
          sum(attributed_revenue_last_touch) as last_touch_revenue,
          sum(attributed_revenue_linear) as linear_revenue,
          sum(attributed_revenue_time_decay) as time_decay_revenue,
          sum(attributed_revenue_position_based) as position_based_revenue,
          count() as total_conversions
        FROM processed_events
        WHERE organization_id = {organizationId:String}
          AND app_id = {appId:String}
          AND date >= today() - {days:UInt32}
          AND event_type IN ('purchase', 'conversion', 'subscription')
      `;

      const result = await clickhouse.query({
        query,
        query_params: {
          organizationId: auth.organization_id,
          appId: auth.app_id,
          days
        }
      });

      const data = result.data[0] || {};

      return c.json({
        success: true,
        data: {
          first_touch: {
            revenue: parseFloat(data.first_touch_revenue || '0'),
            percentage: 0 // Calculated on frontend
          },
          last_touch: {
            revenue: parseFloat(data.last_touch_revenue || '0'),
            percentage: 0
          },
          linear: {
            revenue: parseFloat(data.linear_revenue || '0'),
            percentage: 0
          },
          time_decay: {
            revenue: parseFloat(data.time_decay_revenue || '0'),
            percentage: 0
          },
          position_based: {
            revenue: parseFloat(data.position_based_revenue || '0'),
            percentage: 0
          },
          total_conversions: parseInt(data.total_conversions || '0')
        },
        meta: {
          days,
          generated_at: new Date()
        }
      });

    } catch (error) {
      console.error('Model comparison error:', error);
      return c.json({
        error: 'Could not retrieve model comparison',
        code: 'COMPARISON_ERROR'
      }, 500);
    }
  }
);

/**
 * Get user journey analysis
 * GET /api/attribution/journeys
 */
app.get(
  '/journeys',
  authenticate,
  requirePermission(Permission.ANALYTICS_READ),
  async (c) => {
    const auth = c.get('auth');
    const days = parseInt(c.req.query('days') || '7');
    const limit = parseInt(c.req.query('limit') || '50');

    try {
      const query = `
        SELECT
          user_id,
          device_id,
          groupArray(tuple(touchpoint_timestamp, source, campaign_name, touchpoint_type)) as journey,
          count() as touchpoint_count,
          min(touchpoint_timestamp) as first_touch,
          max(touchpoint_timestamp) as last_touch,
          dateDiff('hour', min(touchpoint_timestamp), max(touchpoint_timestamp)) as journey_duration_hours,
          sum(conversion_revenue) as total_revenue,
          max(leads_to_conversion) as converted
        FROM user_journey_touchpoints
        WHERE organization_id = {organizationId:String}
          AND app_id = {appId:String}
          AND date >= today() - {days:UInt32}
        GROUP BY user_id, device_id
        HAVING touchpoint_count > 1
        ORDER BY total_revenue DESC, touchpoint_count DESC
        LIMIT {limit:UInt32}
      `;

      const result = await clickhouse.query({
        query,
        query_params: {
          organizationId: auth.organization_id,
          appId: auth.app_id,
          days,
          limit
        }
      });

      return c.json({
        success: true,
        data: result.data.map(row => ({
          user_id: row.user_id,
          device_id: row.device_id,
          journey: JSON.parse(row.journey || '[]'),
          touchpoint_count: parseInt(row.touchpoint_count),
          first_touch: row.first_touch,
          last_touch: row.last_touch,
          journey_duration_hours: parseInt(row.journey_duration_hours || '0'),
          total_revenue: parseFloat(row.total_revenue || '0'),
          converted: row.converted === 1
        })),
        meta: {
          days,
          limit,
          total_journeys: result.data.length,
          generated_at: new Date()
        }
      });

    } catch (error) {
      console.error('Journey analysis error:', error);
      return c.json({
        error: 'Could not retrieve journey data',
        code: 'JOURNEY_ERROR'
      }, 500);
    }
  }
);

// =============================================================================
// TESTING AND DEBUGGING ENDPOINTS
// =============================================================================

/**
 * Generate test events for debugging
 * POST /api/attribution/test/generate
 */
app.post(
  '/test/generate',
  authenticate,
  requirePermission(Permission.ADMIN_ACCESS),
  async (c) => {
    const auth = c.get('auth');
    const count = parseInt(c.req.query('count') || '10');

    try {
      const processor = streamingProcessorManager.getProcessor();
      const testEvents: RawEvent[] = [];

      // Generate test events
      for (let i = 0; i < count; i++) {
        const userId = `test_user_${Math.floor(i / 3) + 1}`; // 3 events per user
        const deviceId = `test_device_${userId}`;
        const sessionId = `test_session_${userId}_${Date.now()}`;

        const sources = ['google', 'facebook', 'tiktok', 'youtube', 'organic'];
        const campaigns = ['summer_sale', 'black_friday', 'new_year', 'spring_launch'];
        const eventTypes = i % 3 === 2 ? 'purchase' : (i % 3 === 1 ? 'click' : 'impression');

        testEvents.push({
          organization_id: auth.organization_id,
          app_id: auth.app_id,
          event_type: eventTypes,
          event_name: `test_${eventTypes}`,
          event_timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
          user_id: userId,
          device_id: deviceId,
          session_id: sessionId,
          utm_source: sources[Math.floor(Math.random() * sources.length)],
          utm_medium: 'test',
          utm_campaign: campaigns[Math.floor(Math.random() * campaigns.length)],
          platform: ['ios', 'android', 'web'][Math.floor(Math.random() * 3)] as any,
          country: ['US', 'UK', 'DE', 'FR'][Math.floor(Math.random() * 4)],
          revenue: eventTypes === 'purchase' ? Math.floor(Math.random() * 100) + 10 : undefined,
          currency: eventTypes === 'purchase' ? 'USD' : undefined,
          properties: { test: true, batch: Date.now() }
        });
      }

      // Add events to processor
      let successCount = 0;
      for (const event of testEvents) {
        if (processor.addEvent(event)) {
          successCount++;
        }
      }

      return c.json({
        success: true,
        message: `Generated ${successCount}/${count} test events`,
        events_added: successCount,
        queue_size: processor.getMetrics().queueSize
      });

    } catch (error) {
      console.error('Test generation error:', error);
      return c.json({
        error: 'Could not generate test events',
        code: 'TEST_ERROR'
      }, 500);
    }
  }
);

export default app;