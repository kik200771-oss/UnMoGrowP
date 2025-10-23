<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  // Import UI components (to be created)
  import MetricsOverview from '$lib/components/dashboard/MetricsOverview.svelte';
  import AttributionChart from '$lib/components/dashboard/AttributionChart.svelte';
  import RevenueAnalytics from '$lib/components/dashboard/RevenueAnalytics.svelte';
  import ConversionFunnel from '$lib/components/dashboard/ConversionFunnel.svelte';
  import CustomerJourneys from '$lib/components/dashboard/CustomerJourneys.svelte';
  import ChannelPerformance from '$lib/components/dashboard/ChannelPerformance.svelte';
  import CampaignROI from '$lib/components/dashboard/CampaignROI.svelte';
  import RealTimeEvents from '$lib/components/dashboard/RealTimeEvents.svelte';
  import PredictiveInsights from '$lib/components/dashboard/PredictiveInsights.svelte';
  import ChurnRiskAnalysis from '$lib/components/dashboard/ChurnRiskAnalysis.svelte';

  // State management
  let loading = $state(true);
  let error = $state<string | null>(null);
  let authenticated = $state(false);
  let selectedDateRange = $state<'24h' | '7d' | '30d' | '90d'>('7d');
  let autoRefresh = $state(true);
  let refreshInterval: number;

  // Dashboard data
  let dashboardData = $state<any>({
    metrics: null,
    attribution: null,
    revenue: null,
    conversions: null,
    journeys: null,
    channels: null,
    campaigns: null,
    realtime: null,
    insights: null,
    churn: null
  });

  // Check authentication
  onMount(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      goto('/login');
      return;
    }

    authenticated = true;
    await loadDashboardData();

    // Setup auto-refresh
    if (autoRefresh) {
      refreshInterval = setInterval(loadDashboardData, 30000) as unknown as number; // Refresh every 30 seconds
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  });

  async function loadDashboardData() {
    try {
      loading = true;
      error = null;

      const token = localStorage.getItem('auth_token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3003';

      // Parallel fetch all dashboard endpoints
      const [
        metricsRes,
        attributionRes,
        revenueRes,
        conversionsRes,
        journeysRes,
        channelsRes,
        campaignsRes,
        realtimeRes,
        insightsRes,
        churnRes
      ] = await Promise.all([
        fetch(`${baseUrl}/api/dashboard/metrics?range=${selectedDateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/attribution/models/compare?range=${selectedDateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/analytics/revenue?range=${selectedDateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/analytics/conversions?range=${selectedDateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/attribution/journeys?range=${selectedDateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/analytics/channels?range=${selectedDateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/attribution/campaigns?range=${selectedDateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/realtime/events`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/ml/insights?range=${selectedDateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${baseUrl}/api/ml/churn?range=${selectedDateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Parse responses
      if (metricsRes.ok) dashboardData.metrics = await metricsRes.json();
      if (attributionRes.ok) dashboardData.attribution = await attributionRes.json();
      if (revenueRes.ok) dashboardData.revenue = await revenueRes.json();
      if (conversionsRes.ok) dashboardData.conversions = await conversionsRes.json();
      if (journeysRes.ok) dashboardData.journeys = await journeysRes.json();
      if (channelsRes.ok) dashboardData.channels = await channelsRes.json();
      if (campaignsRes.ok) dashboardData.campaigns = await campaignsRes.json();
      if (realtimeRes.ok) dashboardData.realtime = await realtimeRes.json();
      if (insightsRes.ok) dashboardData.insights = await insightsRes.json();
      if (churnRes.ok) dashboardData.churn = await churnRes.json();

    } catch (err: any) {
      console.error('Dashboard data load error:', err);
      error = err.message || 'Failed to load dashboard data';
    } finally {
      loading = false;
    }
  }

  function handleDateRangeChange(range: '24h' | '7d' | '30d' | '90d') {
    selectedDateRange = range;
    loadDashboardData();
  }

  function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;
    if (autoRefresh) {
      refreshInterval = setInterval(loadDashboardData, 30000) as unknown as number;
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  }
</script>

<svelte:head>
  <title>Dashboard - UnMoGrowP Attribution</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <!-- Header -->
  <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Attribution Dashboard
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Real-time analytics and insights
          </p>
        </div>

        <div class="flex items-center gap-4">
          <!-- Date Range Selector -->
          <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onclick={() => handleDateRangeChange('24h')}
              class="px-3 py-1.5 text-sm rounded-md transition-colors {selectedDateRange === '24h' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              24h
            </button>
            <button
              onclick={() => handleDateRangeChange('7d')}
              class="px-3 py-1.5 text-sm rounded-md transition-colors {selectedDateRange === '7d' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              7d
            </button>
            <button
              onclick={() => handleDateRangeChange('30d')}
              class="px-3 py-1.5 text-sm rounded-md transition-colors {selectedDateRange === '30d' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              30d
            </button>
            <button
              onclick={() => handleDateRangeChange('90d')}
              class="px-3 py-1.5 text-sm rounded-md transition-colors {selectedDateRange === '90d' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
            >
              90d
            </button>
          </div>

          <!-- Auto Refresh Toggle -->
          <button
            onclick={toggleAutoRefresh}
            class="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors {autoRefresh ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'}"
          >
            <svg class="w-4 h-4 {autoRefresh ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Auto Refresh
          </button>

          <!-- Refresh Button -->
          <button
            onclick={loadDashboardData}
            class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            disabled={loading}
          >
            <svg class="w-4 h-4 {loading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="container mx-auto px-4 py-6">
    {#if error}
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="font-semibold text-red-900 dark:text-red-100">Error loading dashboard</h3>
            <p class="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    {#if loading && !dashboardData.metrics}
      <div class="flex items-center justify-center h-96">
        <div class="text-center">
          <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    {:else}
      <!-- Dashboard Grid Layout -->
      <div class="space-y-6">
        <!-- Row 1: Key Metrics Overview -->
        <section>
          <MetricsOverview data={dashboardData.metrics} {loading} />
        </section>

        <!-- Row 2: Attribution & Revenue Analytics -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttributionChart data={dashboardData.attribution} {loading} />
          <RevenueAnalytics data={dashboardData.revenue} {loading} />
        </div>

        <!-- Row 3: Conversion Funnel & Customer Journeys -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ConversionFunnel data={dashboardData.conversions} {loading} />
          <CustomerJourneys data={dashboardData.journeys} {loading} />
        </div>

        <!-- Row 4: Channel Performance & Campaign ROI -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChannelPerformance data={dashboardData.channels} {loading} />
          <CampaignROI data={dashboardData.campaigns} {loading} />
        </div>

        <!-- Row 5: Real-time Events & Predictive Insights -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RealTimeEvents data={dashboardData.realtime} {loading} />
          <PredictiveInsights data={dashboardData.insights} {loading} />
          <ChurnRiskAnalysis data={dashboardData.churn} {loading} />
        </div>
      </div>
    {/if}
  </main>
</div>
