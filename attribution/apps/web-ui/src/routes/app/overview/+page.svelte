<!--
  Overview Page - Main Dashboard (AppsFlyer-inspired structure)

  This is the main dashboard page that users see after logging in.
  Structure inspired by AppsFlyer's Overview page with our custom design.

  Key sections:
  - Performance Summary (KPIs)
  - Install Sources (Traffic attribution)
  - Geographical Performance
  - Time-based Analytics
  - Revenue Tracking
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import AppLayout from '$lib/components/layout/AppLayout.svelte';

  // State for different time periods
  let selectedPeriod = $state('7d');
  let selectedMetric = $state('installs');
  let showFilters = $state(false);

  // Mock data - in real app this comes from API
  let kpiData = $state({
    installs: {
      value: 125340,
      change: 15.3,
      trend: 'up'
    },
    sessions: {
      value: 450120,
      change: 8.7,
      trend: 'up'
    },
    revenue: {
      value: 89450.50,
      change: -2.1,
      trend: 'down'
    },
    arpu: {
      value: 2.59,
      change: 12.4,
      trend: 'up'
    }
  });

  let installSources = $state([
    {
      name: 'Facebook Ads',
      icon: '📘',
      installs: 45600,
      percentage: 36.4,
      cost: 54720.00,
      ecpi: 1.20,
      trend: 'up'
    },
    {
      name: 'Google UAC',
      icon: '🔍',
      installs: 38200,
      percentage: 30.5,
      cost: 68760.00,
      ecpi: 1.80,
      trend: 'stable'
    },
    {
      name: 'Unity Ads',
      icon: '🎮',
      installs: 28400,
      percentage: 22.6,
      cost: 25560.00,
      ecpi: 0.90,
      trend: 'up'
    },
    {
      name: 'Organic',
      icon: '🌱',
      installs: 13140,
      percentage: 10.5,
      cost: 0,
      ecpi: 0,
      trend: 'stable'
    }
  ]);

  let geoData = $state([
    { country: 'United States', code: 'US', installs: 32500, revenue: 28450.00, flag: '🇺🇸' },
    { country: 'Germany', code: 'DE', installs: 18200, revenue: 15220.00, flag: '🇩🇪' },
    { country: 'United Kingdom', code: 'GB', installs: 14800, revenue: 12840.00, flag: '🇬🇧' },
    { country: 'France', code: 'FR', installs: 12100, revenue: 9860.00, flag: '🇫🇷' },
    { country: 'Japan', code: 'JP', installs: 9400, revenue: 11200.00, flag: '🇯🇵' }
  ]);

  // Chart data (simplified for demo)
  let chartData = $state({
    dates: ['Oct 16', 'Oct 17', 'Oct 18', 'Oct 19', 'Oct 20', 'Oct 21', 'Oct 22'],
    installs: [1520, 1680, 1450, 1890, 1650, 1920, 1750],
    revenue: [3240, 3680, 3120, 4250, 3890, 4520, 4180]
  });

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: amount < 1 ? 2 : 0,
      maximumFractionDigits: amount < 1 ? 2 : 0
    }).format(amount);
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  }

  function formatPercentage(num: number): string {
    return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
  }

  function getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  }

  function getTrendColor(trend: string): string {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  }

  onMount(() => {
    // Initialize any charts or real-time data here
  });
</script>

<svelte:head>
  <title>Overview | UnMoGrowP Attribution</title>
  <meta name="description" content="App performance overview and key metrics" />
</svelte:head>

<AppLayout>
  <div class="overview-page">

    <!-- Filters and Controls -->
    <div class="page-controls">
      <div class="time-filters">
        <button
          class="filter-btn"
          class:active={selectedPeriod === '1d'}
          onclick={() => selectedPeriod = '1d'}
        >
          Today
        </button>
        <button
          class="filter-btn"
          class:active={selectedPeriod === '7d'}
          onclick={() => selectedPeriod = '7d'}
        >
          7 Days
        </button>
        <button
          class="filter-btn"
          class:active={selectedPeriod === '30d'}
          onclick={() => selectedPeriod = '30d'}
        >
          30 Days
        </button>
        <button
          class="filter-btn"
          class:active={selectedPeriod === 'custom'}
          onclick={() => selectedPeriod = 'custom'}
        >
          Custom
        </button>
      </div>

      <div class="action-buttons">
        <button class="action-btn secondary" onclick={() => showFilters = !showFilters}>
          🔽 Filters
        </button>
        <button class="action-btn primary">
          📊 Export Data
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <section class="kpi-section">
      <h2 class="section-title">Performance Overview</h2>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-icon">📱</span>
            <span class="kpi-label">Installs</span>
          </div>
          <div class="kpi-value">{formatNumber(kpiData.installs.value)}</div>
          <div class="kpi-change {getTrendColor(kpiData.installs.trend)}">
            <span class="trend-icon">{getTrendIcon(kpiData.installs.trend)}</span>
            <span>{formatPercentage(kpiData.installs.change)} vs last period</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-icon">🎯</span>
            <span class="kpi-label">Sessions</span>
          </div>
          <div class="kpi-value">{formatNumber(kpiData.sessions.value)}</div>
          <div class="kpi-change {getTrendColor(kpiData.sessions.trend)}">
            <span class="trend-icon">{getTrendIcon(kpiData.sessions.trend)}</span>
            <span>{formatPercentage(kpiData.sessions.change)} vs last period</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-icon">💰</span>
            <span class="kpi-label">Revenue</span>
          </div>
          <div class="kpi-value">{formatCurrency(kpiData.revenue.value)}</div>
          <div class="kpi-change {getTrendColor(kpiData.revenue.trend)}">
            <span class="trend-icon">{getTrendIcon(kpiData.revenue.trend)}</span>
            <span>{formatPercentage(kpiData.revenue.change)} vs last period</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-icon">👤</span>
            <span class="kpi-label">ARPU</span>
          </div>
          <div class="kpi-value">{formatCurrency(kpiData.arpu.value)}</div>
          <div class="kpi-change {getTrendColor(kpiData.arpu.trend)}">
            <span class="trend-icon">{getTrendIcon(kpiData.arpu.trend)}</span>
            <span>{formatPercentage(kpiData.arpu.change)} vs last period</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Install Sources -->
    <section class="sources-section">
      <h2 class="section-title">Install Sources</h2>

      <div class="sources-table">
        <div class="table-header">
          <div class="col-source">Media Source</div>
          <div class="col-installs">Installs</div>
          <div class="col-percentage">Share</div>
          <div class="col-cost">Cost</div>
          <div class="col-ecpi">eCPI</div>
          <div class="col-trend">Trend</div>
        </div>

        {#each installSources as source}
          <div class="table-row">
            <div class="col-source">
              <span class="source-icon">{source.icon}</span>
              <span class="source-name">{source.name}</span>
            </div>
            <div class="col-installs">{formatNumber(source.installs)}</div>
            <div class="col-percentage">
              <div class="percentage-bar">
                <div class="percentage-fill" style="width: {source.percentage}%"></div>
              </div>
              <span class="percentage-text">{source.percentage.toFixed(1)}%</span>
            </div>
            <div class="col-cost">{source.cost > 0 ? formatCurrency(source.cost) : 'Free'}</div>
            <div class="col-ecpi">{source.ecpi > 0 ? formatCurrency(source.ecpi) : '-'}</div>
            <div class="col-trend {getTrendColor(source.trend)}">
              {getTrendIcon(source.trend)}
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- Geography Performance -->
    <section class="geo-section">
      <h2 class="section-title">Top Countries</h2>

      <div class="geo-grid">
        {#each geoData as country}
          <div class="geo-card">
            <div class="geo-header">
              <span class="country-flag">{country.flag}</span>
              <div class="country-info">
                <span class="country-name">{country.country}</span>
                <span class="country-code">{country.code}</span>
              </div>
            </div>

            <div class="geo-metrics">
              <div class="geo-metric">
                <span class="metric-label">Installs</span>
                <span class="metric-value">{formatNumber(country.installs)}</span>
              </div>
              <div class="geo-metric">
                <span class="metric-label">Revenue</span>
                <span class="metric-value">{formatCurrency(country.revenue)}</span>
              </div>
              <div class="geo-metric">
                <span class="metric-label">ARPU</span>
                <span class="metric-value">{formatCurrency(country.revenue / country.installs)}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- Performance Chart -->
    <section class="chart-section">
      <h2 class="section-title">Performance Trends</h2>

      <div class="chart-container">
        <div class="chart-placeholder">
          <div class="chart-header">
            <div class="metric-selector">
              <button
                class="metric-btn"
                class:active={selectedMetric === 'installs'}
                onclick={() => selectedMetric = 'installs'}
              >
                📱 Installs
              </button>
              <button
                class="metric-btn"
                class:active={selectedMetric === 'revenue'}
                onclick={() => selectedMetric = 'revenue'}
              >
                💰 Revenue
              </button>
            </div>
          </div>

          <div class="chart-content">
            <div class="chart-mock">
              <!-- This would be replaced with actual chart library like Chart.js or D3 -->
              <div class="chart-bars">
                {#each chartData.dates as date, i}
                  <div class="chart-bar">
                    <div
                      class="bar-fill"
                      style="height: {selectedMetric === 'installs'
                        ? (chartData.installs[i] / Math.max(...chartData.installs)) * 100
                        : (chartData.revenue[i] / Math.max(...chartData.revenue)) * 100}%"
                    ></div>
                    <span class="bar-label">{date}</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</AppLayout>

<style>
  .overview-page {
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Page Controls */
  .page-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .time-filters {
    display: flex;
    gap: 0.5rem;
  }

  .filter-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #e2e8f0;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
  }

  .filter-btn.active {
    background: #4299e1;
    color: white;
    border-color: #4299e1;
  }

  .filter-btn:hover:not(.active) {
    background: #f7fafc;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .action-btn.primary {
    background: #4299e1;
    color: white;
    border-color: #4299e1;
  }

  .action-btn.secondary {
    background: white;
    color: #4a5568;
  }

  .action-btn:hover {
    transform: translateY(-1px);
  }

  /* Section Titles */
  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0 0 1.5rem 0;
  }

  /* KPI Section */
  .kpi-section {
    margin-bottom: 3rem;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .kpi-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .kpi-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .kpi-icon {
    font-size: 1.25rem;
  }

  .kpi-label {
    font-size: 0.9rem;
    color: #718096;
    font-weight: 500;
  }

  .kpi-value {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  .kpi-change {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .trend-icon {
    font-size: 0.9rem;
  }

  /* Sources Section */
  .sources-section {
    margin-bottom: 3rem;
  }

  .sources-table {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }

  .table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 0.8fr;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: #f7fafc;
    font-weight: 600;
    font-size: 0.85rem;
    color: #4a5568;
  }

  .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 0.8fr;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #f1f5f9;
    align-items: center;
  }

  .table-row:hover {
    background: #f7fafc;
  }

  .col-source {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .source-icon {
    font-size: 1.25rem;
  }

  .source-name {
    font-weight: 500;
    color: #2d3748;
  }

  .percentage-bar {
    width: 100%;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.25rem;
  }

  .percentage-fill {
    height: 100%;
    background: linear-gradient(90deg, #4299e1, #3182ce);
  }

  .percentage-text {
    font-size: 0.8rem;
    color: #4a5568;
  }

  /* Geography Section */
  .geo-section {
    margin-bottom: 3rem;
  }

  .geo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
  }

  .geo-card {
    background: white;
    border-radius: 12px;
    padding: 1.25rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .geo-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .country-flag {
    font-size: 1.5rem;
  }

  .country-info {
    display: flex;
    flex-direction: column;
  }

  .country-name {
    font-weight: 600;
    color: #2d3748;
    font-size: 0.9rem;
  }

  .country-code {
    font-size: 0.75rem;
    color: #718096;
  }

  .geo-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .geo-metric {
    text-align: center;
  }

  .geo-metric .metric-label {
    display: block;
    font-size: 0.75rem;
    color: #718096;
    margin-bottom: 0.25rem;
  }

  .geo-metric .metric-value {
    font-weight: 600;
    color: #2d3748;
    font-size: 0.9rem;
  }

  /* Chart Section */
  .chart-section {
    margin-bottom: 3rem;
  }

  .chart-container {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .chart-header {
    margin-bottom: 1.5rem;
  }

  .metric-selector {
    display: flex;
    gap: 0.5rem;
  }

  .metric-btn {
    padding: 0.5rem 1rem;
    border: 1px solid #e2e8f0;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.85rem;
  }

  .metric-btn.active {
    background: #4299e1;
    color: white;
    border-color: #4299e1;
  }

  .chart-content {
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chart-mock {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: end;
    justify-content: center;
  }

  .chart-bars {
    display: flex;
    gap: 1rem;
    align-items: end;
    height: 80%;
    width: 100%;
    justify-content: space-around;
  }

  .chart-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    min-width: 40px;
  }

  .bar-fill {
    width: 20px;
    background: linear-gradient(180deg, #4299e1, #3182ce);
    border-radius: 2px 2px 0 0;
    min-height: 2px;
  }

  .bar-label {
    margin-top: 0.5rem;
    font-size: 0.7rem;
    color: #718096;
    transform: rotate(-45deg);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .page-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .time-filters,
    .action-buttons {
      justify-content: center;
    }

    .kpi-grid {
      grid-template-columns: 1fr;
    }

    .table-header,
    .table-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .geo-grid {
      grid-template-columns: 1fr;
    }

    .chart-bars {
      gap: 0.5rem;
    }

    .bar-label {
      font-size: 0.6rem;
    }
  }
</style>