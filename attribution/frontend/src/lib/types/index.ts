// Dashboard Metrics Types
export interface DashboardMetrics {
  totalConversions: number;
  revenue: number;
  costPerAcquisition: number;
  returnOnAdSpend: number;
  trend: 'up' | 'down' | 'neutral';
  changePercent: number;
}

// Attribution Model Types
export type AttributionModelType = 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based';

export interface AttributionChannel {
  channel: string;
  revenue: number;
  conversions: number;
  percentage: number;
}

export interface AttributionModel {
  name: string;
  type: AttributionModelType;
  revenue: number;
  conversions: number;
  channels: AttributionChannel[];
}

// Customer Journey Types
export interface Touchpoint {
  id: string;
  channel: string;
  timestamp: string;
  attribution: number;
  metadata?: Record<string, any>;
}

export interface CustomerJourney {
  customerId: string;
  touchpoints: Touchpoint[];
  conversionDate: string;
  revenue: number;
  attributionBreakdown: Record<string, number>;
}

// Analytics Types
export interface AnalyticsInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'opportunity' | 'warning';
  severity: number;
  title: string;
  description: string;
  impact: string;
  revenueImpact: number;
  confidence: number;
  timestamp: string;
  recommendation: string;
}

export interface CustomerSegment {
  rfm: {
    recencyScore: number;
    frequencyScore: number;
    monetaryScore: number;
    segment: string;
    description: string;
  };
  behavioral: {
    cluster: string;
    channels: string[];
    engagementLevel: string;
  };
  predictive: {
    clvSegment: string;
    predictedClv: number;
    churnRisk: string;
    churnProbability: number;
  };
}

// Chart Data Types
export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  model?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

// Campaign Types
export interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  conversions: number;
  revenue: number;
  roi: number;
}

// Real-time Event Types
export interface RealtimeEvent {
  type: 'conversion' | 'touchpoint' | 'revenue';
  data: any;
  timestamp: string;
}
