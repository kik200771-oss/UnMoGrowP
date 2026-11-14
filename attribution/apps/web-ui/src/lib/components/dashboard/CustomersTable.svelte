<script lang="ts">
  import { api } from '$lib/api/client';
  import { onMount } from 'svelte';
  import type { Customer, ApiResponse } from '$lib/api/client';

  // Props
  interface Props {
    limit?: number;
    autoRefresh?: boolean;
  }
  let { limit = 50, autoRefresh = true }: Props = $props();

  // State
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let customers = $state<Customer[]>([]);
  let selectedCustomer = $state<Customer | null>(null);
  let cacheInfo = $state<{cache_hit: boolean, response_time: string, source: string} | null>(null);
  let totalCount = $state(0);
  let lastUpdated = $state<Date>(new Date());

  // Computed
  const totalRevenue = $derived(() => {
    return customers.reduce((sum, customer) => sum + customer.total_revenue, 0);
  });

  const totalEvents = $derived(() => {
    return customers.reduce((sum, customer) => sum + customer.total_events, 0);
  });

  const totalUsers = $derived(() => {
    return customers.reduce((sum, customer) => sum + customer.total_users, 0);
  });

  // Load customers
  async function loadCustomers() {
    try {
      const response = await api.getCustomers(limit);

      if (response.success && response.data) {
        customers = response.data.customers || [];
        totalCount = response.data.total || customers.length;
        cacheInfo = response.meta ? {
          cache_hit: response.meta.cache_hit || false,
          response_time: response.meta.response_time || '0ms',
          source: response.meta.source || 'unknown'
        } : null;
        error = null;
      } else {
        error = response.error || 'Failed to load customers';
      }
    } catch (err) {
      error = 'Network error loading customers';
      console.error('Customers error:', err);
    } finally {
      isLoading = false;
      lastUpdated = new Date();
    }
  }

  // Auto-refresh setup
  onMount(() => {
    loadCustomers();

    if (autoRefresh) {
      const interval = setInterval(loadCustomers, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  });

  // Manual refresh
  async function refresh() {
    isLoading = true;
    await loadCustomers();
  }

  // Row selection
  function selectCustomer(customer: Customer) {
    selectedCustomer = selectedCustomer?.app_id === customer.app_id ? null : customer;
  }

  // Format platform display
  function formatPlatforms(platforms: string[] | string): string {
    if (Array.isArray(platforms)) {
      return platforms.join(', ');
    }
    return platforms.toString();
  }
</script>

<div class="customers-table-container">
  <!-- Header -->
  <div class="header">
    <div class="title-section">
      <h3>👥 Customers ({totalCount})</h3>
      {#if cacheInfo}
        <div class="cache-badge" class:cached={cacheInfo.cache_hit}>
          {cacheInfo.cache_hit ? '🚀' : '💾'} {cacheInfo.source} ({cacheInfo.response_time})
        </div>
      {/if}
    </div>

    <div class="actions">
      <button onclick={refresh} disabled={isLoading} class="refresh-button">
        {#if isLoading}
          <span class="spinner"></span>
        {:else}
          ↻
        {/if}
        Refresh
      </button>
    </div>
  </div>

  <!-- Summary cards -->
  {#if customers.length > 0}
    <div class="summary-row">
      <div class="summary-card">
        <div class="summary-value">${totalRevenue().toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        <div class="summary-label">Total Revenue</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">{totalEvents().toLocaleString()}</div>
        <div class="summary-label">Total Events</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">{totalUsers().toLocaleString()}</div>
        <div class="summary-label">Total Users</div>
      </div>
    </div>
  {/if}

  <!-- Error state -->
  {#if error}
    <div class="error-message">
      <span>⚠️ {error}</span>
      <button onclick={refresh} class="retry-button">Retry</button>
    </div>
  {:else if customers.length === 0 && !isLoading}
    <!-- Empty state -->
    <div class="empty-state">
      <div class="empty-icon">📊</div>
      <h4>No customers found</h4>
      <p>Start by ingesting some events to see customers appear here.</p>
      <button onclick={refresh} class="refresh-button">Refresh</button>
    </div>
  {:else}
    <!-- Table -->
    <div class="table-container">
      <table class="customers-table">
        <thead>
          <tr>
            <th>App ID</th>
            <th>Platforms</th>
            <th>Events</th>
            <th>Users</th>
            <th>Revenue</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each customers as customer (customer.app_id)}
            <tr
              class="customer-row"
              class:selected={selectedCustomer?.app_id === customer.app_id}
              onclick={() => selectCustomer(customer)}
            >
              <td class="app-id">
                <div class="app-info">
                  <strong>{customer.app_id}</strong>
                  {#if customer.app_id.includes('demo')}
                    <span class="demo-badge">Demo</span>
                  {/if}
                </div>
              </td>
              <td>
                <div class="platforms">
                  {#each formatPlatforms(customer.platforms).split(', ') as platform}
                    <span class="platform-badge {platform}">{platform}</span>
                  {/each}
                </div>
              </td>
              <td class="metric-cell">
                <div class="metric-value">{customer.total_events.toLocaleString()}</div>
                <div class="metric-trend">+{Math.floor(customer.total_events * 0.05).toLocaleString()} today</div>
              </td>
              <td class="metric-cell">
                <div class="metric-value">{customer.total_users.toLocaleString()}</div>
                <div class="metric-trend">{(customer.total_events / customer.total_users).toFixed(1)} events/user</div>
              </td>
              <td class="metric-cell revenue">
                <div class="metric-value">${customer.total_revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                <div class="metric-trend">${(customer.total_revenue / customer.total_users).toFixed(2)} per user</div>
              </td>
              <td class="actions-cell">
                <button class="action-button">📊 Analytics</button>
                <button class="action-button">🎯 Attribution</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- Selected customer details -->
  {#if selectedCustomer}
    <div class="customer-details">
      <h4>📋 {selectedCustomer.app_id} Details</h4>
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Total Events:</span>
          <span class="detail-value">{selectedCustomer.total_events.toLocaleString()}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Unique Users:</span>
          <span class="detail-value">{selectedCustomer.total_users.toLocaleString()}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Revenue:</span>
          <span class="detail-value">${selectedCustomer.total_revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Platforms:</span>
          <span class="detail-value">{formatPlatforms(selectedCustomer.platforms)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Avg Revenue/User:</span>
          <span class="detail-value">${(selectedCustomer.total_revenue / selectedCustomer.total_users).toFixed(2)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Avg Events/User:</span>
          <span class="detail-value">{(selectedCustomer.total_events / selectedCustomer.total_users).toFixed(1)}</span>
        </div>
      </div>
    </div>
  {/if}

  <!-- Footer -->
  <div class="footer">
    <small>
      Last updated: {lastUpdated.toLocaleTimeString()}
      • Showing {customers.length} of {totalCount} customers
      {#if cacheInfo}
        • Cache hit rate: {cacheInfo.cache_hit ? 'Hit' : 'Miss'}
      {/if}
    </small>
  </div>

  <!-- Loading overlay -->
  {#if isLoading}
    <div class="loading-overlay">
      <div class="spinner large"></div>
      <div>Loading customers...</div>
    </div>
  {/if}
</div>

<style>
  .customers-table-container {
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

  .title-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title-section h3 {
    margin: 0;
    color: var(--text-primary);
  }

  .cache-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    background: var(--surface-variant);
    color: var(--text-secondary);
  }

  .cache-badge.cached {
    background: #e8f5e8;
    color: #2e7d32;
  }

  .refresh-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .refresh-button:hover {
    background: var(--surface-variant);
  }

  .refresh-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .summary-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .summary-card {
    padding: 16px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--surface-variant) 0%, var(--surface) 100%);
    text-align: center;
    border: 1px solid var(--border);
  }

  .summary-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .summary-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
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
    margin-bottom: 16px;
  }

  .retry-button {
    padding: 4px 8px;
    border: 1px solid #c62828;
    border-radius: 4px;
    background: transparent;
    color: #c62828;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-secondary);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
  }

  .table-container {
    overflow-x: auto;
  }

  .customers-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }

  .customers-table th {
    text-align: left;
    padding: 12px;
    background: var(--surface-variant);
    color: var(--text-primary);
    font-weight: 600;
    border-bottom: 2px solid var(--border);
  }

  .customer-row {
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .customer-row:hover {
    background: var(--surface-variant);
  }

  .customer-row.selected {
    background: #e3f2fd;
    outline: 2px solid #2196f3;
  }

  .customer-row td {
    padding: 12px;
    border-bottom: 1px solid var(--border);
  }

  .app-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .demo-badge {
    padding: 2px 6px;
    font-size: 0.7rem;
    background: #fff3e0;
    color: #e65100;
    border-radius: 3px;
    font-weight: 500;
  }

  .platforms {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .platform-badge {
    padding: 2px 6px;
    font-size: 0.75rem;
    border-radius: 3px;
    font-weight: 500;
  }

  .platform-badge.ios { background: #e8f5e8; color: #2e7d32; }
  .platform-badge.android { background: #e1f5fe; color: #0277bd; }
  .platform-badge.web { background: #fce4ec; color: #c2185b; }

  .metric-cell {
    text-align: right;
  }

  .metric-value {
    font-weight: 600;
    color: var(--text-primary);
  }

  .metric-trend {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .revenue .metric-value {
    color: #4caf50;
  }

  .actions-cell {
    display: flex;
    gap: 8px;
  }

  .action-button {
    padding: 4px 8px;
    font-size: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--surface);
    color: var(--text-primary);
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .action-button:hover {
    background: var(--surface-variant);
  }

  .customer-details {
    margin-top: 20px;
    padding: 20px;
    background: var(--surface-variant);
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .customer-details h4 {
    margin: 0 0 16px 0;
    color: var(--text-primary);
  }

  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
  }

  .detail-label {
    color: var(--text-secondary);
  }

  .detail-value {
    font-weight: 600;
    color: var(--text-primary);
  }

  .footer {
    margin-top: 16px;
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
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    border-radius: 12px;
    color: var(--text-secondary);
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border);
    border-top: 2px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .spinner.large {
    width: 32px;
    height: 32px;
    border-width: 3px;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Dark mode */
  :global(.dark) .cache-badge.cached {
    background: #1b5e20;
    color: #4caf50;
  }

  :global(.dark) .demo-badge {
    background: #3e2723;
    color: #ff8a65;
  }

  :global(.dark) .customer-row.selected {
    background: #0d47a1;
  }

  :global(.dark) .loading-overlay {
    background: rgba(0, 0, 0, 0.9);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .actions-cell {
      flex-direction: column;
    }

    .summary-row {
      grid-template-columns: 1fr;
    }

    .details-grid {
      grid-template-columns: 1fr;
    }
  }
</style>