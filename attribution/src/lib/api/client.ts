/**
 * UnMoGrowP API Client - Foundation Pattern
 * Contract-driven development implementation
 */

import { browser } from '$app/environment';

// API Configuration
const API_BASE_URL = browser
  ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001')
  : 'http://localhost:3001';

// Type definitions based on OpenAPI schema
export interface AttributionEvent {
  eventId: string;
  timestamp: string;
  deviceId: string;
  campaign: string;
  source?: 'ad_network' | 'organic' | 'cross_promotion';
  eventType?: 'install' | 'session_start' | 'purchase' | 'registration' | 'custom';
  metadata?: Record<string, any>;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'healthy' | 'unhealthy';
    kafka: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
    clickhouse: 'healthy' | 'unhealthy';
  };
  uptime: number;
}

export interface EventIngestResponse {
  status: 'accepted' | 'partial' | 'rejected';
  processed_count: number;
  event_ids: string[];
  processing_time_ms: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// API Client Error Classes
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: ErrorResponse
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, public details: ErrorResponse['details']) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Core API client function
 * Accepts path and RequestInit parameters; prepends API_BASE_URL;
 * enforces application/json headers; throws on non-2xx responses; returns parsed JSON
 */
export async function apiClient<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Construct full URL
  const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  // Merge headers with defaults
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...Object.fromEntries(new Headers(options.headers || {}))
  });

  // Add API key if available
  const apiKey = browser
    ? localStorage.getItem('unmogrowp_api_key')
    : process.env.UNMOGROWP_API_KEY;

  if (apiKey) {
    headers.set('Authorization', `Bearer ${apiKey}`);
  }

  // Prepare request options
  const requestOptions: RequestInit = {
    ...options,
    headers,
    // Ensure JSON body is stringified
    body: options.body && typeof options.body === 'object'
      ? JSON.stringify(options.body)
      : options.body
  };

  try {
    // Make request
    const response = await fetch(url, requestOptions);

    // Handle non-2xx responses
    if (!response.ok) {
      let errorData: ErrorResponse;

      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: 'unknown_error',
          message: response.statusText || 'Unknown error occurred'
        };
      }

      // Throw specific error types
      switch (response.status) {
        case 400:
          throw new ValidationError(errorData.message, errorData.details);
        case 429:
          throw new RateLimitError(errorData.message);
        default:
          throw new APIError(errorData.message, response.status, errorData);
      }
    }

    // Parse and return JSON response
    return await response.json();
  } catch (error) {
    // Re-throw API errors
    if (error instanceof APIError) {
      throw error;
    }

    // Handle network/fetch errors
    throw new APIError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}

// API Methods based on OpenAPI specification

/**
 * Health check endpoint
 */
export async function getHealth(): Promise<HealthResponse> {
  return apiClient<HealthResponse>('/v1/health', {
    method: 'GET'
  });
}

/**
 * Ingest single attribution event
 */
export async function ingestEvent(event: AttributionEvent): Promise<EventIngestResponse> {
  return apiClient<EventIngestResponse>('/v1/events/ingest', {
    method: 'POST',
    body: event
  });
}

/**
 * Ingest batch of attribution events
 */
export async function ingestEventBatch(events: AttributionEvent[]): Promise<EventIngestResponse> {
  if (events.length === 0) {
    throw new ValidationError('Event batch cannot be empty', []);
  }

  if (events.length > 100) {
    throw new ValidationError('Event batch cannot exceed 100 events', []);
  }

  return apiClient<EventIngestResponse>('/v1/events/ingest', {
    method: 'POST',
    body: events
  });
}

/**
 * Get attribution analytics
 */
export interface AttributionAnalyticsParams {
  start_date: string;
  end_date: string;
  campaign?: string;
  source?: 'ad_network' | 'organic' | 'cross_promotion';
  attribution_model?: 'first_click' | 'last_click' | 'linear' | 'time_decay' | 'position_based';
}

export async function getAttributionAnalytics(params: AttributionAnalyticsParams): Promise<any> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  return apiClient(`/v1/analytics/attribution?${searchParams}`, {
    method: 'GET'
  });
}

// Multi-Period Saturation Prediction Types
export interface SaturationPredictionRequest {
  campaign_id: string;
  platform: string;
  current_spend: number;
  target_spend: number;
  historical_days?: number;
}

export interface PeriodPrediction {
  period: string;
  days: number;
  predicted_cpa: number;
  confidence: number;
  saturation_point: number;
  cost_efficiency: number;
  risk_level: string;
}

export interface EnsemblePrediction {
  predicted_cpa: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  risk_level: string;
  optimal_spend: number;
  saturation_probability: number;
}

export interface SaturationAnalyticsResponse {
  campaign_id: string;
  platform: string;
  spend_range: {
    current: number;
    target: number;
    increase_percentage: number;
  };
  periods: PeriodPrediction[];
  ensemble: EnsemblePrediction;
  recommendations: string[];
  data_quality: number;
  timestamp: string;
  note?: string;
}

/**
 * Get multi-period saturation analytics for dashboard
 */
export async function getSaturationAnalytics(params: {
  campaign_id?: string;
  platform?: string;
  current_spend?: number;
  target_spend?: number;
}): Promise<SaturationAnalyticsResponse> {
  const searchParams = new URLSearchParams();

  // Set defaults
  const defaultParams = {
    campaign_id: 'campaign_001',
    platform: 'facebook',
    current_spend: 1000.0,
    target_spend: 2000.0,
    ...params
  };

  Object.entries(defaultParams).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });

  return apiClient<SaturationAnalyticsResponse>(`/api/analytics/saturation?${searchParams}`, {
    method: 'GET'
  });
}

/**
 * Predict multi-period saturation with detailed ML model response
 */
export async function predictSaturation(request: SaturationPredictionRequest): Promise<any> {
  return apiClient('/api/ml/predict/saturation', {
    method: 'POST',
    body: request
  });
}

// Utility functions for API client

/**
 * Set API key for authenticated requests
 */
export function setApiKey(apiKey: string): void {
  if (browser) {
    localStorage.setItem('unmogrowp_api_key', apiKey);
  }
}

/**
 * Clear stored API key
 */
export function clearApiKey(): void {
  if (browser) {
    localStorage.removeItem('unmogrowp_api_key');
  }
}

/**
 * Get current API key
 */
export function getApiKey(): string | null {
  if (browser) {
    return localStorage.getItem('unmogrowp_api_key');
  }
  return process.env.UNMOGROWP_API_KEY || null;
}

/**
 * Check if API key is configured
 */
export function isAuthenticated(): boolean {
  return getApiKey() !== null;
}

// Default export for convenience
export default {
  getHealth,
  ingestEvent,
  ingestEventBatch,
  getAttributionAnalytics,
  getSaturationAnalytics,
  predictSaturation,
  setApiKey,
  clearApiKey,
  getApiKey,
  isAuthenticated,
  APIError,
  ValidationError,
  RateLimitError
};