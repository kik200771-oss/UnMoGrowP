<script lang="ts">
  import { api } from '$lib/api/client';
  import { onMount, tick } from 'svelte';
  import type { DashboardStats, ApiResponse } from '$lib/api/client';

  // Props
  interface Props {
    refreshInterval?: number;
  }
  let { refreshInterval = 30000 }: Props = $props();

  // State using Svelte 5 runes
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let stats = $state<DashboardStats>({
    total_events: 0,
    active_users: 0,
    revenue_today: 0,
    conversions: 0,
  });
  let lastUpdated = $state<Date>(new Date());
  let cacheInfo = $state<{cache_hit: boolean, response_time: string, source: string} | null>(null);

  // Computed values
  const conversionRate = $derived(() => {
    return stats.active_users > 0
      ? ((stats.conversions / stats.active_users) * 100).toFixed(2)
      : '0.00';
  });

  const averageRevenue = $derived(() => {
    return stats.conversions > 0
      ? (stats.revenue_today / stats.conversions).toFixed(2)
      : '0.00';
  });

  // Load dashboard stats
  async function loadStats() {
    try {
      const response = await api.getDashboardStats();

      if (response.success && response.data) {
        stats = response.data;
        cacheInfo = response.meta ? {
          cache_hit: response.meta.cache_hit || false,
          response_time: response.meta.response_time || '0ms',
          source: response.meta.source || 'unknown'
        } : null;
        error = null;
      } else {
        error = response.error || 'Failed to load stats';
      }
    } catch (err) {
      error = 'Network error loading stats';
      console.error('Stats error:', err);
    } finally {
      isLoading = false;
      lastUpdated = new Date();
    }
  }

  // Auto-refresh
  onMount(() => {
    loadStats();

    const interval = setInterval(loadStats, refreshInterval);
    return () => clearInterval(interval);
  });

  // Refresh manually
  async function refresh() {
    isLoading = true;
    await loadStats();
  }
</script>

<div class="metrics-overview">
  <!-- Header with refresh controls -->
  <div class="header">
    <h2>📊 Platform Metrics</h2>
    <div class="controls">
      {#if cacheInfo}
        <div class="cache-indicator" class:cached={cacheInfo.cache_hit}>
          <span class="status-dot"></span>
          {cacheInfo.cache_hit ? '🚀 Cached' : '💾 Live'}
          <small>({cacheInfo.response_time})</small>
        </div>
      {/if}
      <button
        onclick={refresh}
        disabled={isLoading}
        class="refresh-btn"
        class:loading={isLoading}
      >
        {isLoading ? '🔄' : '↻'} Refresh
      </button>
    </div>
  </div>

  <!-- Error state -->
  {#if error}
    <div class="error-message">
      ⚠️ {error}
      <button onclick={refresh} class="retry-btn">Retry</button>
    </div>
  {:else}
    <!-- Metrics cards -->
    <div class="metrics-grid">
      <!-- Total Events -->
      <div class="metric-card events">
        <div class="metric-icon">📈</div>
        <div class="metric-content">
          <div class="metric-value">{stats.total_events.toLocaleString()}</div>
          <div class="metric-label">Total Events</div>
          <div class="metric-trend">+{((stats.total_events * 0.12) | 0).toLocaleString()} today</div>
        </div>
      </div>

      <!-- Active Users -->
      <div class="metric-card users">
        <div class="metric-icon">👥</div>
        <div class="metric-content">
          <div class="metric-value">{stats.active_users.toLocaleString()}</div>
          <div class="metric-label">Active Users</div>
          <div class="metric-trend">+{((stats.active_users * 0.08) | 0).toLocaleString()} today</div>
        </div>
      </div>

      <!-- Revenue -->
      <div class="metric-card revenue">
        <div class="metric-icon">💰</div>
        <div class="metric-content">
          <div class="metric-value">${stats.revenue_today.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          <div class="metric-label">Revenue Today</div>
          <div class="metric-trend">Avg: ${averageRevenue()}/conversion</div>
        </div>
      </div>

      <!-- Conversions -->
      <div class="metric-card conversions">
        <div class="metric-icon">🎯</div>
        <div class="metric-content">
          <div class="metric-value">{stats.conversions.toLocaleString()}</div>
          <div class="metric-label">Conversions</div>
          <div class="metric-trend">{conversionRate()}% conversion rate</div>
        </div>
      </div>
    </div>

    <!-- Last updated info -->
    <div class="footer">
      <small>
        Last updated: {lastUpdated.toLocaleTimeString()}
        {#if cacheInfo}
          • Source: {cacheInfo.source}
          {#if stats.cache_enabled}
            • Cache: Enabled
          {/if}
        {/if}
      </small>
    </div>
  {/if}

  <!-- Loading overlay -->
  {#if isLoading}
    <div class="loading-overlay">
      <div class="spinner"></div>
      <div>Loading metrics...</div>
    </div>
  {/if}
</div>

<style>
  .metrics-overview {
    position: relative;
    background: var(--surface);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .header h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.5rem;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .cache-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.85rem;
    background: var(--surface-variant);
    color: var(--text-secondary);
  }

  .cache-indicator.cached {
    background: #e8f5e8;
    color: #2e7d32;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-secondary);
  }

  .cache-indicator.cached .status-dot {
    background: #4caf50;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .refresh-btn {
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .refresh-btn:hover {
    background: var(--surface-variant);
    transform: translateY(-1px);
  }

  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .refresh-btn.loading {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .error-message {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #ffebee;
    color: #c62828;
    border-radius: 8px;
    border: 1px solid #ffcdd2;
  }

  .retry-btn {
    padding: 4px 8px;
    border: 1px solid #c62828;
    border-radius: 4px;
    background: transparent;
    color: #c62828;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
  }

  .metric-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .metric-card.events { border-left: 4px solid #2196f3; }
  .metric-card.users { border-left: 4px solid #4caf50; }
  .metric-card.revenue { border-left: 4px solid #ff9800; }
  .metric-card.conversions { border-left: 4px solid #9c27b0; }

  .metric-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .metric-content {
    flex: 1;
  }

  .metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .metric-label {
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  .metric-trend {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .footer {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    text-align: center;
    color: var(--text-secondary);
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border-radius: 12px;
    color: var(--text-secondary);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border);
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* Dark mode support */
  :global(.dark) .cache-indicator.cached {
    background: #1b5e20;
    color: #4caf50;
  }

  :global(.dark) .error-message {
    background: #3e2723;
    color: #ff8a80;
    border-color: #5d4037;
  }

  :global(.dark) .loading-overlay {
    background: rgba(0, 0, 0, 0.8);
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .metrics-grid {
      grid-template-columns: 1fr;
    }

    .header {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .controls {
      justify-content: center;
    }
  }
</style>