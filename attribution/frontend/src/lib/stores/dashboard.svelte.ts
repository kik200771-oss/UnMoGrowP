import type { DashboardMetrics, AttributionModel, AnalyticsInsight, Campaign } from '$types';

// Reactive state using Svelte 5 runes
class DashboardStore {
  metrics = $state<DashboardMetrics>({
    totalConversions: 0,
    revenue: 0,
    costPerAcquisition: 0,
    returnOnAdSpend: 0,
    trend: 'neutral',
    changePercent: 0
  });

  attributionModels = $state<AttributionModel[]>([]);
  insights = $state<AnalyticsInsight[]>([]);
  campaigns = $state<Campaign[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);
  lastUpdate = $state<Date>(new Date());

  // Fetch dashboard metrics
  async fetchMetrics() {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch('/api/v1/dashboard/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');

      const data = await response.json();
      this.metrics = data.metrics;
      this.lastUpdate = new Date();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching metrics:', err);
    } finally {
      this.loading = false;
    }
  }

  // Fetch attribution models
  async fetchAttributionModels() {
    try {
      const response = await fetch('/api/v1/attribution/models');
      if (!response.ok) throw new Error('Failed to fetch attribution models');

      const data = await response.json();
      this.attributionModels = data.models;
    } catch (err) {
      console.error('Error fetching attribution models:', err);
    }
  }

  // Fetch insights
  async fetchInsights() {
    try {
      const response = await fetch('/analytics/insights?date_range=last_7_days');
      if (!response.ok) throw new Error('Failed to fetch insights');

      const data = await response.json();
      this.insights = data.insights;
    } catch (err) {
      console.error('Error fetching insights:', err);
    }
  }

  // Fetch campaigns
  async fetchCampaigns() {
    try {
      const response = await fetch('/api/v1/campaigns?status=active');
      if (!response.ok) throw new Error('Failed to fetch campaigns');

      const data = await response.json();
      this.campaigns = data.campaigns;
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  }

  // Initialize dashboard
  async initialize() {
    await Promise.all([
      this.fetchMetrics(),
      this.fetchAttributionModels(),
      this.fetchInsights(),
      this.fetchCampaigns()
    ]);
  }

  // Real-time updates
  startRealtimeUpdates() {
    // Fetch updates every 30 seconds
    const intervalId = setInterval(() => {
      this.fetchMetrics();
      this.fetchInsights();
    }, 30000);

    return () => clearInterval(intervalId);
  }
}

export const dashboardStore = new DashboardStore();
