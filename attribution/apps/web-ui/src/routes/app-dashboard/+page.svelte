<!--
  Mobile Game Developer Dashboard - UnMoGrowP Attribution Platform

  This is the main dashboard that mobile app/game developers see after logging in.
  Similar to AppsFlyer's main dashboard interface.

  Features:
  - App overview with key metrics
  - Traffic source attribution
  - Campaign performance
  - Revenue tracking by channel
  - Real-time analytics
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api/client';
  import { auth, authState } from '$lib/stores/auth';

  // Mock data for mobile attribution - in real app this comes from API
  let selectedApp = $state('my-awesome-game');
  let timeRange = $state('7d'); // 1d, 7d, 30d, custom
  let isLoading = $state(false);
  let lastUpdated = $state(new Date());

  // Sample data for mobile game attribution
  let appData = $state({
    appName: 'My Awesome Game',
    appId: 'com.company.awesomegame',
    platform: 'iOS & Android',
    installs: {
      total: 125340,
      today: 1250,
      growth: 15.3
    },
    revenue: {
      total: 89450.50,
      today: 3240.80,
      arpu: 2.59
    },
    retention: {
      day1: 45.2,
      day7: 18.7,
      day30: 8.3
    },
    conversion: {
      installToRegistration: 68.4,
      registrationToFirstPurchase: 12.8,
      overallConversion: 8.8
    }
  });

  let trafficSources = $state([
    {
      name: 'Facebook Ads',
      logo: '📘',
      installs: 45600,
      spend: 54720.00,
      cpi: 1.20,
      ltv: 8.50,
      roas: 7.08,
      status: 'profitable'
    },
    {
      name: 'Google UAC',
      logo: '🅖',
      installs: 38200,
      spend: 68760.00,
      cpi: 1.80,
      ltv: 6.20,
      roas: 3.44,
      status: 'profitable'
    },
    {
      name: 'Unity Ads',
      logo: '🎮',
      installs: 28400,
      spend: 25560.00,
      cpi: 0.90,
      ltv: 4.10,
      roas: 4.56,
      status: 'profitable'
    },
    {
      name: 'TikTok Ads',
      logo: '🎵',
      installs: 13140,
      spend: 19710.00,
      cpi: 1.50,
      ltv: 3.80,
      roas: 2.53,
      status: 'breakeven'
    },
    {
      name: 'Organic',
      logo: '🌱',
      installs: 22580,
      spend: 0,
      cpi: 0,
      ltv: 12.30,
      roas: 999,
      status: 'excellent'
    }
  ]);

  let recentCampaigns = $state([
    {
      id: 'fb_holiday_promo',
      name: 'Holiday Promo Campaign',
      network: 'Facebook',
      status: 'active',
      budget: 5000,
      spent: 3240,
      installs: 2700,
      cpi: 1.20,
      startDate: '2025-10-20'
    },
    {
      id: 'google_lookalike',
      name: 'Lookalike Audience Test',
      network: 'Google',
      status: 'active',
      budget: 2500,
      spent: 1890,
      installs: 1050,
      cpi: 1.80,
      startDate: '2025-10-18'
    },
    {
      id: 'unity_rewarded',
      name: 'Rewarded Video Campaign',
      network: 'Unity',
      status: 'paused',
      budget: 1000,
      spent: 945,
      installs: 1050,
      cpi: 0.90,
      startDate: '2025-10-15'
    }
  ]);

  // Auth check
  const authStateValue = $derived($authState);
  const isAuthenticated = $derived(authStateValue.isAuthenticated);
  const user = $derived(authStateValue.user);

  onMount(() => {
    if (!isAuthenticated) {
      goto('/login');
      return;
    }

    // Load user's apps and data
    loadDashboardData();

    // Auto refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  });

  async function loadDashboardData() {
    // In real app, this would load user's actual app data
    lastUpdated = new Date();
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'profitable': return 'text-green-600';
      case 'excellent': return 'text-blue-600';
      case 'breakeven': return 'text-yellow-600';
      case 'unprofitable': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  function getStatusBadge(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<svelte:head>
  <title>App Dashboard - {appData.appName} | UnMoGrowP</title>
  <meta name="description" content="Mobile attribution dashboard for {appData.appName}" />
</svelte:head>

<div class="dashboard-container">
  <!-- Header -->
  <header class="dashboard-header">
    <div class="header-content">
      <div class="app-selector">
        <div class="app-info">
          <div class="app-icon">📱</div>
          <div>
            <h1 class="app-name">{appData.appName}</h1>
            <p class="app-id">{appData.appId} • {appData.platform}</p>
          </div>
        </div>

        <div class="header-controls">
          <select bind:value={timeRange} class="time-selector">
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="custom">Custom range</option>
          </select>

          <button class="refresh-btn" onclick={loadDashboardData}>
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Dashboard Content -->
  <main class="dashboard-main">

    <!-- Key Metrics Overview -->
    <section class="metrics-overview">
      <h2 class="section-title">📊 Key Performance Metrics</h2>

      <div class="metrics-grid">
        <!-- Installs -->
        <div class="metric-card installs">
          <div class="metric-header">
            <span class="metric-icon">📱</span>
            <span class="metric-label">Total Installs</span>
          </div>
          <div class="metric-value">{formatNumber(appData.installs.total)}</div>
          <div class="metric-detail">
            <span class="metric-today">+{formatNumber(appData.installs.today)} today</span>
            <span class="metric-growth positive">+{appData.installs.growth}%</span>
          </div>
        </div>

        <!-- Revenue -->
        <div class="metric-card revenue">
          <div class="metric-header">
            <span class="metric-icon">💰</span>
            <span class="metric-label">Total Revenue</span>
          </div>
          <div class="metric-value">{formatCurrency(appData.revenue.total)}</div>
          <div class="metric-detail">
            <span class="metric-today">+{formatCurrency(appData.revenue.today)} today</span>
            <span class="metric-arpu">ARPU: {formatCurrency(appData.revenue.arpu)}</span>
          </div>
        </div>

        <!-- Retention -->
        <div class="metric-card retention">
          <div class="metric-header">
            <span class="metric-icon">📈</span>
            <span class="metric-label">Retention Rates</span>
          </div>
          <div class="retention-breakdown">
            <div class="retention-item">
              <span class="retention-period">D1</span>
              <span class="retention-value">{appData.retention.day1}%</span>
            </div>
            <div class="retention-item">
              <span class="retention-period">D7</span>
              <span class="retention-value">{appData.retention.day7}%</span>
            </div>
            <div class="retention-item">
              <span class="retention-period">D30</span>
              <span class="retention-value">{appData.retention.day30}%</span>
            </div>
          </div>
        </div>

        <!-- Conversions -->
        <div class="metric-card conversions">
          <div class="metric-header">
            <span class="metric-icon">🎯</span>
            <span class="metric-label">Conversion Funnel</span>
          </div>
          <div class="conversion-funnel">
            <div class="funnel-step">
              <span class="funnel-label">Install → Registration</span>
              <span class="funnel-rate">{appData.conversion.installToRegistration}%</span>
            </div>
            <div class="funnel-step">
              <span class="funnel-label">Registration → Purchase</span>
              <span class="funnel-rate">{appData.conversion.registrationToFirstPurchase}%</span>
            </div>
            <div class="funnel-step overall">
              <span class="funnel-label">Overall Conversion</span>
              <span class="funnel-rate">{appData.conversion.overallConversion}%</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Traffic Sources Performance -->
    <section class="traffic-sources">
      <h2 class="section-title">📍 Traffic Source Performance</h2>

      <div class="sources-table">
        <div class="table-header">
          <div class="col-source">Source</div>
          <div class="col-installs">Installs</div>
          <div class="col-spend">Spend</div>
          <div class="col-cpi">CPI</div>
          <div class="col-ltv">LTV</div>
          <div class="col-roas">ROAS</div>
          <div class="col-status">Status</div>
        </div>

        {#each trafficSources as source}
          <div class="table-row">
            <div class="col-source">
              <span class="source-logo">{source.logo}</span>
              <span class="source-name">{source.name}</span>
            </div>
            <div class="col-installs">{formatNumber(source.installs)}</div>
            <div class="col-spend">{formatCurrency(source.spend)}</div>
            <div class="col-cpi">{source.cpi > 0 ? formatCurrency(source.cpi) : 'Free'}</div>
            <div class="col-ltv">{formatCurrency(source.ltv)}</div>
            <div class="col-roas">
              {source.roas > 100 ? '∞' : source.roas.toFixed(2)}x
            </div>
            <div class="col-status">
              <span class="status-badge {getStatusColor(source.status)}">{source.status}</span>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- Recent Campaigns -->
    <section class="recent-campaigns">
      <h2 class="section-title">🚀 Recent Campaigns</h2>

      <div class="campaigns-grid">
        {#each recentCampaigns as campaign}
          <div class="campaign-card">
            <div class="campaign-header">
              <h3 class="campaign-name">{campaign.name}</h3>
              <span class="campaign-status {getStatusBadge(campaign.status)}">{campaign.status}</span>
            </div>
            <div class="campaign-network">📊 {campaign.network}</div>

            <div class="campaign-metrics">
              <div class="campaign-metric">
                <span class="metric-name">Budget</span>
                <span class="metric-value">{formatCurrency(campaign.budget)}</span>
              </div>
              <div class="campaign-metric">
                <span class="metric-name">Spent</span>
                <span class="metric-value">{formatCurrency(campaign.spent)}</span>
              </div>
              <div class="campaign-metric">
                <span class="metric-name">Installs</span>
                <span class="metric-value">{formatNumber(campaign.installs)}</span>
              </div>
              <div class="campaign-metric">
                <span class="metric-name">CPI</span>
                <span class="metric-value">{formatCurrency(campaign.cpi)}</span>
              </div>
            </div>

            <div class="campaign-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: {(campaign.spent / campaign.budget) * 100}%"></div>
              </div>
              <span class="progress-text">{Math.round((campaign.spent / campaign.budget) * 100)}% spent</span>
            </div>
          </div>
        {/each}
      </div>
    </section>

  </main>

  <!-- Footer with last updated -->
  <footer class="dashboard-footer">
    <p>Last updated: {lastUpdated.toLocaleTimeString()} • Data refreshes every 30 seconds</p>
  </footer>
</div>

<style>
  .dashboard-container {
    min-height: 100vh;
    background: #f8fafc;
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* Header Styles */
  .dashboard-header {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 1.5rem 0;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .app-selector {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .app-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .app-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .app-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a202c;
    margin: 0;
  }

  .app-id {
    color: #718096;
    margin: 0.25rem 0 0 0;
    font-size: 0.9rem;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .time-selector {
    padding: 0.5rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    font-size: 0.9rem;
  }

  .refresh-btn {
    padding: 0.5rem 1rem;
    background: #4299e1;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
  }

  .refresh-btn:hover {
    background: #3182ce;
  }

  /* Main Content */
  .dashboard-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0 0 1.5rem 0;
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .metric-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .metric-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .metric-icon {
    font-size: 1.25rem;
  }

  .metric-label {
    font-size: 0.9rem;
    color: #718096;
    font-weight: 500;
  }

  .metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  .metric-detail {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
  }

  .metric-today {
    color: #4a5568;
  }

  .metric-growth.positive {
    color: #38a169;
    font-weight: 600;
  }

  .metric-arpu {
    color: #4a5568;
  }

  /* Retention specific */
  .retention-breakdown {
    display: flex;
    gap: 1rem;
  }

  .retention-item {
    text-align: center;
    flex: 1;
  }

  .retention-period {
    display: block;
    font-size: 0.8rem;
    color: #718096;
    margin-bottom: 0.25rem;
  }

  .retention-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #4299e1;
  }

  /* Conversion funnel */
  .conversion-funnel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .funnel-step {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
  }

  .funnel-step.overall {
    border-top: 1px solid #e2e8f0;
    margin-top: 0.5rem;
    padding-top: 1rem;
    font-weight: 600;
  }

  .funnel-label {
    font-size: 0.85rem;
    color: #4a5568;
  }

  .funnel-rate {
    font-weight: 600;
    color: #2d3748;
  }

  /* Traffic Sources Table */
  .sources-table {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    margin-bottom: 3rem;
  }

  .table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: #f7fafc;
    font-weight: 600;
    font-size: 0.85rem;
    color: #4a5568;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1.2fr 0.8fr 0.8fr 0.8fr 1fr;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    align-items: center;
  }

  .table-row:hover {
    background: #f7fafc;
  }

  .col-source {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .source-logo {
    font-size: 1.25rem;
  }

  .source-name {
    font-weight: 500;
  }

  .status-badge {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  /* Campaigns Grid */
  .campaigns-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .campaign-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .campaign-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .campaign-name {
    font-size: 1rem;
    font-weight: 600;
    color: #2d3748;
    margin: 0;
  }

  .campaign-status {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .campaign-network {
    color: #718096;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .campaign-metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .campaign-metric {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .campaign-metric .metric-name {
    font-size: 0.8rem;
    color: #718096;
  }

  .campaign-metric .metric-value {
    font-weight: 600;
    color: #2d3748;
  }

  .campaign-progress {
    margin-top: 1rem;
  }

  .progress-bar {
    width: 100%;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4299e1, #3182ce);
    transition: width 0.3s;
  }

  .progress-text {
    font-size: 0.8rem;
    color: #718096;
  }

  /* Footer */
  .dashboard-footer {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    color: #718096;
    font-size: 0.85rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header-content,
    .dashboard-main {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .app-selector {
      flex-direction: column;
      align-items: stretch;
    }

    .header-controls {
      justify-content: center;
    }

    .metrics-grid {
      grid-template-columns: 1fr;
    }

    .table-header,
    .table-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .campaigns-grid {
      grid-template-columns: 1fr;
    }
  }
</style>