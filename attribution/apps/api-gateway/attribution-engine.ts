/**
 * Attribution Engine - Core Multi-Touch Attribution Logic
 * UnMoGrowP Attribution Platform
 *
 * Implements 5 attribution models:
 * 1. First Touch - 100% credit to first touchpoint
 * 2. Last Touch - 100% credit to last touchpoint
 * 3. Linear - Equal credit across all touchpoints
 * 4. Time Decay - Exponential decay favoring recent touchpoints
 * 5. Position Based - 40% first, 40% last, 20% middle
 */

import type { Database } from './multi-tenant-database';

// Core attribution interfaces
export interface Touchpoint {
  id: string;
  timestamp: Date;
  source: string;
  medium: string;
  campaign?: string;
  creative_id?: string;
  click_id?: string;
  cost?: number;
  position: number; // 1-based position in customer journey
}

export interface ConversionEvent {
  id: string;
  timestamp: Date;
  event_type: string;
  revenue?: number;
  organization_id: string;
  app_id: string;
  user_id: string;
  device_id: string;
}

export interface AttributionWeights {
  first_touch: number;
  last_touch: number;
  linear: number;
  time_decay: number;
  position_based: number;
}

export interface AttributionResult {
  conversion_id: string;
  touchpoint_id: string;
  weights: AttributionWeights;
  attributed_revenue: {
    first_touch: number;
    last_touch: number;
    linear: number;
    time_decay: number;
    position_based: number;
  };
  created_at: Date;
}

/**
 * Attribution Engine - Core calculation logic
 */
export class AttributionEngine {
  private timeDecayHalfLife: number = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  constructor(options?: {
    timeDecayHalfLife?: number; // Custom half-life for time decay model
  }) {
    if (options?.timeDecayHalfLife) {
      this.timeDecayHalfLife = options.timeDecayHalfLife;
    }
  }

  /**
   * Calculate attribution weights for a conversion event
   * @param touchpoints Array of touchpoints leading to conversion
   * @param conversion The conversion event
   * @returns Attribution weights for each model
   */
  calculateAttribution(
    touchpoints: Touchpoint[],
    conversion: ConversionEvent
  ): Map<string, AttributionWeights> {
    if (touchpoints.length === 0) {
      throw new Error('No touchpoints provided for attribution calculation');
    }

    // Sort touchpoints by timestamp
    const sortedTouchpoints = [...touchpoints].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    const attributionMap = new Map<string, AttributionWeights>();

    // Calculate weights for each touchpoint
    sortedTouchpoints.forEach((touchpoint, index) => {
      const weights: AttributionWeights = {
        first_touch: this.calculateFirstTouchWeight(index, sortedTouchpoints.length),
        last_touch: this.calculateLastTouchWeight(index, sortedTouchpoints.length),
        linear: this.calculateLinearWeight(sortedTouchpoints.length),
        time_decay: this.calculateTimeDecayWeight(
          touchpoint.timestamp,
          conversion.timestamp,
          sortedTouchpoints
        ),
        position_based: this.calculatePositionBasedWeight(index, sortedTouchpoints.length)
      };

      attributionMap.set(touchpoint.id, weights);
    });

    // Validate weights sum to 1.0 for each model
    this.validateWeights(attributionMap);

    return attributionMap;
  }

  /**
   * First Touch Attribution - 100% to first touchpoint
   */
  private calculateFirstTouchWeight(index: number, totalTouchpoints: number): number {
    return index === 0 ? 1.0 : 0.0;
  }

  /**
   * Last Touch Attribution - 100% to last touchpoint
   */
  private calculateLastTouchWeight(index: number, totalTouchpoints: number): number {
    return index === totalTouchpoints - 1 ? 1.0 : 0.0;
  }

  /**
   * Linear Attribution - Equal weight across all touchpoints
   */
  private calculateLinearWeight(totalTouchpoints: number): number {
    return 1.0 / totalTouchpoints;
  }

  /**
   * Time Decay Attribution - Exponential decay favoring recent touchpoints
   */
  private calculateTimeDecayWeight(
    touchpointTime: Date,
    conversionTime: Date,
    allTouchpoints: Touchpoint[]
  ): number {
    const timeDiff = conversionTime.getTime() - touchpointTime.getTime();
    const decayFactor = Math.exp(-timeDiff / this.timeDecayHalfLife);

    // Calculate sum of all decay factors for normalization
    const totalDecayFactor = allTouchpoints.reduce((sum, tp) => {
      const tpTimeDiff = conversionTime.getTime() - tp.timestamp.getTime();
      return sum + Math.exp(-tpTimeDiff / this.timeDecayHalfLife);
    }, 0);

    return decayFactor / totalDecayFactor;
  }

  /**
   * Position-Based Attribution - 40% first, 40% last, 20% middle
   */
  private calculatePositionBasedWeight(index: number, totalTouchpoints: number): number {
    if (totalTouchpoints === 1) {
      return 1.0; // Single touchpoint gets all credit
    }

    if (totalTouchpoints === 2) {
      return 0.5; // Two touchpoints split 50/50
    }

    // Three or more touchpoints
    if (index === 0) {
      return 0.4; // First touchpoint
    } else if (index === totalTouchpoints - 1) {
      return 0.4; // Last touchpoint
    } else {
      // Middle touchpoints share remaining 20%
      const middleTouchpoints = totalTouchpoints - 2;
      return 0.2 / middleTouchpoints;
    }
  }

  /**
   * Validate that weights sum to 1.0 for each attribution model
   */
  private validateWeights(attributionMap: Map<string, AttributionWeights>): void {
    const sums = {
      first_touch: 0,
      last_touch: 0,
      linear: 0,
      time_decay: 0,
      position_based: 0
    };

    for (const weights of attributionMap.values()) {
      sums.first_touch += weights.first_touch;
      sums.last_touch += weights.last_touch;
      sums.linear += weights.linear;
      sums.time_decay += weights.time_decay;
      sums.position_based += weights.position_based;
    }

    // Check each model sums to ~1.0 (allow small floating point errors)
    Object.entries(sums).forEach(([model, sum]) => {
      if (Math.abs(sum - 1.0) > 0.0001) {
        throw new Error(`Attribution weights for ${model} model sum to ${sum}, expected 1.0`);
      }
    });
  }

  /**
   * Calculate attributed revenue for each touchpoint
   */
  calculateAttributedRevenue(
    attributionMap: Map<string, AttributionWeights>,
    totalRevenue: number
  ): Map<string, AttributionResult['attributed_revenue']> {
    const revenueMap = new Map<string, AttributionResult['attributed_revenue']>();

    for (const [touchpointId, weights] of attributionMap.entries()) {
      revenueMap.set(touchpointId, {
        first_touch: totalRevenue * weights.first_touch,
        last_touch: totalRevenue * weights.last_touch,
        linear: totalRevenue * weights.linear,
        time_decay: totalRevenue * weights.time_decay,
        position_based: totalRevenue * weights.position_based
      });
    }

    return revenueMap;
  }

  /**
   * Process a conversion event and calculate full attribution
   */
  async processConversion(
    touchpoints: Touchpoint[],
    conversion: ConversionEvent
  ): Promise<AttributionResult[]> {
    const attributionMap = this.calculateAttribution(touchpoints, conversion);
    const revenueMap = this.calculateAttributedRevenue(
      attributionMap,
      conversion.revenue || 0
    );

    const results: AttributionResult[] = [];

    for (const [touchpointId, weights] of attributionMap.entries()) {
      const attributedRevenue = revenueMap.get(touchpointId)!;

      results.push({
        conversion_id: conversion.id,
        touchpoint_id: touchpointId,
        weights,
        attributed_revenue: attributedRevenue,
        created_at: new Date()
      });
    }

    return results;
  }
}

/**
 * Attribution Engine Factory with preset configurations
 */
export class AttributionEngineFactory {
  /**
   * Create engine with standard 7-day time decay
   */
  static createStandard(): AttributionEngine {
    return new AttributionEngine({
      timeDecayHalfLife: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  /**
   * Create engine with mobile-optimized 3-day time decay
   */
  static createMobileOptimized(): AttributionEngine {
    return new AttributionEngine({
      timeDecayHalfLife: 3 * 24 * 60 * 60 * 1000 // 3 days
    });
  }

  /**
   * Create engine with B2B-optimized 14-day time decay
   */
  static createB2BOptimized(): AttributionEngine {
    return new AttributionEngine({
      timeDecayHalfLife: 14 * 24 * 60 * 60 * 1000 // 14 days
    });
  }
}

/**
 * Attribution Service - High-level service for database integration
 */
export class AttributionService {
  constructor(
    private engine: AttributionEngine,
    private db: Database
  ) {}

  /**
   * Get touchpoints for a user within attribution window
   */
  async getTouchpointsForUser(
    organizationId: string,
    appId: string,
    userId: string,
    conversionTime: Date,
    lookbackWindow: number = 7 * 24 * 60 * 60 * 1000 // 7 days default
  ): Promise<Touchpoint[]> {
    const windowStart = new Date(conversionTime.getTime() - lookbackWindow);

    // Query ClickHouse for touchpoints
    const query = `
      SELECT
        id,
        event_time as timestamp,
        source,
        medium,
        campaign,
        creative_id,
        click_id,
        cost,
        ROW_NUMBER() OVER (ORDER BY event_time) as position
      FROM events
      WHERE organization_id = {organizationId:String}
        AND app_id = {appId:String}
        AND user_id = {userId:String}
        AND event_time BETWEEN {windowStart:DateTime} AND {conversionTime:DateTime}
        AND event_type IN ('click', 'view', 'impression')
      ORDER BY event_time ASC
    `;

    const result = await this.db.clickhouse.query({
      query,
      query_params: {
        organizationId,
        appId,
        userId,
        windowStart: windowStart.toISOString(),
        conversionTime: conversionTime.toISOString()
      }
    });

    return result.data.map(row => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      source: row.source,
      medium: row.medium,
      campaign: row.campaign,
      creative_id: row.creative_id,
      click_id: row.click_id,
      cost: parseFloat(row.cost) || 0,
      position: parseInt(row.position)
    }));
  }

  /**
   * Store attribution results to database
   */
  async storeAttributionResults(results: AttributionResult[]): Promise<void> {
    if (results.length === 0) return;

    // Insert into ClickHouse attribution_touchpoints table
    const values = results.map(result => `(
      '${result.conversion_id}',
      '${result.touchpoint_id}',
      ${result.weights.first_touch},
      ${result.weights.last_touch},
      ${result.weights.linear},
      ${result.weights.time_decay},
      ${result.weights.position_based},
      ${result.attributed_revenue.first_touch},
      ${result.attributed_revenue.last_touch},
      ${result.attributed_revenue.linear},
      ${result.attributed_revenue.time_decay},
      ${result.attributed_revenue.position_based},
      '${result.created_at.toISOString()}'
    )`).join(',');

    const insertQuery = `
      INSERT INTO attribution_touchpoints (
        conversion_id,
        touchpoint_id,
        first_touch_weight,
        last_touch_weight,
        linear_weight,
        time_decay_weight,
        position_based_weight,
        first_touch_revenue,
        last_touch_revenue,
        linear_revenue,
        time_decay_revenue,
        position_based_revenue,
        created_at
      ) VALUES ${values}
    `;

    await this.db.clickhouse.exec({ query: insertQuery });
  }

  /**
   * Process conversion event end-to-end
   */
  async processConversionEvent(
    conversion: ConversionEvent,
    lookbackWindow?: number
  ): Promise<AttributionResult[]> {
    // Get touchpoints for this user
    const touchpoints = await this.getTouchpointsForUser(
      conversion.organization_id,
      conversion.app_id,
      conversion.user_id,
      conversion.timestamp,
      lookbackWindow
    );

    if (touchpoints.length === 0) {
      console.log(`No touchpoints found for conversion ${conversion.id}`);
      return [];
    }

    // Calculate attribution
    const results = await this.engine.processConversion(touchpoints, conversion);

    // Store results
    await this.storeAttributionResults(results);

    return results;
  }
}

// Export singleton instances
export const standardAttributionEngine = AttributionEngineFactory.createStandard();
export const mobileAttributionEngine = AttributionEngineFactory.createMobileOptimized();
export const b2bAttributionEngine = AttributionEngineFactory.createB2BOptimized();