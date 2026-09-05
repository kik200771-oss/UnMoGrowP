<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api/client';
  import { auth, authState } from '$lib/stores/auth';
  import MetricsOverview from '$lib/components/dashboard/MetricsOverview.svelte';
  import CustomersTable from '$lib/components/dashboard/CustomersTable.svelte';

  // State using Svelte 5 runes
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let systemHealth = $state<any>(null);
  let showPerformanceTest = $state(false);
  let performanceResults = $state<any>(null);

  // Subscribe to auth state using Svelte 5 runes
  const authStateValue = $derived($authState);
  const isAuthenticated = $derived(authStateValue.isAuthenticated);
  const user = $derived(authStateValue.user);

  // Check authentication and load system health
  onMount(async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login...');
      goto('/login');
      return;
    }

    // Load system health
    await loadSystemHealth();
  });

  async function loadSystemHealth() {
    try {
      const response = await api.health();
      if (response.success) {
        systemHealth = response.data;
      }
    } catch (err) {
      console.error('Failed to load system health:', err);
    }
  }

  // Performance testing
  async function runPerformanceTest() {
    performanceResults = null;
    showPerformanceTest = true;

    try {
      const results = await api.runPerformanceTest(20);
      performanceResults = results;
    } catch (err) {
      error = 'Performance test failed';
      console.error('Performance test error:', err);
    }
  }

  // Test event generation
  async function generateTestEvent() {
    try {
      const testEvent = api.generateTestEvent('demo-app-test');
      const response = await api.ingestEvent(testEvent);

      if (response.success) {
        // Show success notification or refresh components
        console.log('Test event generated successfully');
      } else {
        error = response.error || 'Failed to generate test event';
      }
    } catch (err) {
      error = 'Failed to generate test event';
      console.error('Test event error:', err);
    }
  }

  // Cache management
  async function invalidateCache() {
    try {
      const response = await api.invalidateCache('*');
      if (response.success) {
        console.log('Cache invalidated successfully');
        // Refresh components to show updated data
      } else {
        error = response.error || 'Failed to invalidate cache';
      }
    } catch (err) {
      error = 'Failed to invalidate cache';
      console.error('Cache invalidation error:', err);
    }
  }
</script>

<svelte:head>
  <title>Dashboard - UnMoGrowP Attribution Platform</title>
  <meta name="description" content="Real-time attribution analytics dashboard with Redis caching" />
</svelte:head>

<div class="dashboard-page">
  <!-- Page header -->
  <header class="page-header">
    <div class="header-content">
      <h1>📊 Attribution Dashboard</h1>
      <div class="header-info">
        {#if user}
          <span class="user-welcome">Welcome, {user.name || user.email}!</span>
        {/if}
        {#if systemHealth}
          <div class="system-status" class:healthy={systemHealth.status === 'healthy'}>
            <span class="status-dot"></span>
            System {systemHealth.status}
            <small>v{systemHealth.version}</small>
          </div>
        {/if}
      </div>
    </div>

    <!-- Action buttons -->
    <div class="header-actions">
      <button onclick={generateTestEvent} class="action-btn primary">
        🧪 Generate Test Event
      </button>

      <button onclick={() => showPerformanceTest = !showPerformanceTest} class="action-btn">
        📈 Performance Test
      </button>

      <button onclick={invalidateCache} class="action-btn secondary">
        🗑️ Clear Cache
      </button>
    </div>
  </header>

  <!-- Error message -->
  {#if error}
    <div class="error-banner">
      <span>⚠️ {error}</span>
      <button onclick={() => error = null} class="close-btn">×</button>
    </div>
  {/if}

  <!-- Performance test panel -->
  {#if showPerformanceTest}
    <div class="performance-panel">
      <h3>🚀 API Performance Test</h3>

      {#if performanceResults}
        <div class="performance-results">
          <div class="result-item">
            <span class="result-label">Total Requests:</span>
            <span class="result-value">{performanceResults.total_requests}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Successful:</span>
            <span class="result-value success">{performanceResults.successful}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Failed:</span>
            <span class="result-value error">{performanceResults.failed}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Avg Response Time:</span>
            <span class="result-value">{performanceResults.avg_response_time}ms</span>
          </div>
          <div class="result-item">
            <span class="result-label">Cache Hits:</span>
            <span class="result-value cache">{performanceResults.cache_hits} ({(performanceResults.cache_hits / performanceResults.total_requests * 100).toFixed(1)}%)</span>
          </div>
        </div>
      {/if}

      <div class="test-actions">
        <button onclick={runPerformanceTest} class="test-btn">
          Run Test (20 requests)
        </button>
        <button onclick={() => showPerformanceTest = false} class="close-btn">
          Close
        </button>
      </div>
    </div>
  {/if}

  <!-- Main dashboard content -->
  <div class="dashboard-content">
    <!-- Metrics Overview Section -->
    <section class="dashboard-section">
      <MetricsOverview refreshInterval={30000} />
    </section>

    <!-- Customers Table Section -->
    <section class="dashboard-section">
      <CustomersTable limit={50} autoRefresh={true} />
    </section>

    <!-- System Health Section -->
    {#if systemHealth}
      <section class="dashboard-section system-health">
        <h3>🔧 System Health</h3>
        <div class="health-grid">
          <div class="health-item">
            <span class="health-label">Database:</span>
            <span class="health-status {systemHealth.database?.status}">
              {systemHealth.database?.status || 'unknown'}
            </span>
          </div>
          <div class="health-item">
            <span class="health-label">Cache:</span>
            <span class="health-status {systemHealth.cache?.status}">
              {systemHealth.cache?.status || 'unknown'}
            </span>
          </div>
          <div class="health-item">
            <span class="health-label">Version:</span>
            <span class="health-status">{systemHealth.version}</span>
          </div>
          <div class="health-item">
            <span class="health-label">Uptime:</span>
            <span class="health-status">{Math.floor((Date.now() - systemHealth.timestamp * 1000) / 1000)}s</span>
          </div>
        </div>
      </section>
    {/if}
  </div>

  <!-- Loading overlay -->
  {#if isLoading}
    <div class="loading-overlay">
      <div class="spinner"></div>
      <div>Loading dashboard...</div>
    </div>
  {/if}
</div>

<style>
  .dashboard-page {
    min-height: 100vh;
    background: var(--background);
    color: var(--text-primary);
    position: relative;
  }

  .page-header {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .page-header h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .header-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .user-welcome {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .system-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 6px;
    background: var(--surface-variant);
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .system-status.healthy {
    background: #e8f5e8;
    color: #2e7d32;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-secondary);
  }

  .system-status.healthy .status-dot {
    background: #4caf50;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .header-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .action-btn {
    padding: 10px 16px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
  }

  .action-btn:hover {
    background: var(--surface-variant);
    transform: translateY(-1px);
  }

  .action-btn.primary {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .action-btn.primary:hover {
    background: var(--primary-dark);
  }

  .action-btn.secondary {
    background: #ff5722;
    color: white;
    border-color: #ff5722;
  }

  .action-btn.secondary:hover {
    background: #e64a19;
  }

  .error-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: #ffebee;
    color: #c62828;
    border: 1px solid #ffcdd2;
    margin: 0 24px 24px;
    border-radius: 8px;
  }

  .close-btn {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 4px;
  }

  .performance-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
    margin: 0 24px 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .performance-panel h3 {
    margin: 0 0 16px 0;
    color: var(--text-primary);
  }

  .performance-results {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .result-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--surface-variant);
    border-radius: 6px;
  }

  .result-label {
    color: var(--text-secondary);
  }

  .result-value {
    font-weight: 600;
    color: var(--text-primary);
  }

  .result-value.success { color: #4caf50; }
  .result-value.error { color: #f44336; }
  .result-value.cache { color: #2196f3; }

  .test-actions {
    display: flex;
    gap: 12px;
  }

  .test-btn {
    padding: 8px 16px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .test-btn:hover {
    background: var(--primary-dark);
  }

  .dashboard-content {
    padding: 0 24px;
  }

  .dashboard-section {
    margin-bottom: 32px;
  }

  .system-health {
    background: var(--surface);
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .system-health h3 {
    margin: 0 0 16px 0;
    color: var(--text-primary);
  }

  .health-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .health-item {
    display: flex;
    justify-content: space-between;
    padding: 12px;
    background: var(--surface-variant);
    border-radius: 6px;
  }

  .health-label {
    color: var(--text-secondary);
  }

  .health-status {
    font-weight: 600;
    color: var(--text-primary);
  }

  .health-status.healthy { color: #4caf50; }
  .health-status.fallback_mode { color: #ff9800; }
  .health-status.unavailable { color: #f44336; }

  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 1000;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--border);
    border-top: 4px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Dark mode */
  :global(.dark) .error-banner {
    background: #3e2723;
    color: #ff8a80;
    border-color: #5d4037;
  }

  :global(.dark) .system-status.healthy {
    background: #1b5e20;
    color: #4caf50;
  }

  :global(.dark) .loading-overlay {
    background: rgba(0, 0, 0, 0.9);
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .page-header {
      padding: 16px;
    }

    .header-content {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;
    }

    .header-actions {
      justify-content: center;
    }

    .dashboard-content {
      padding: 0 16px;
    }

    .performance-results {
      grid-template-columns: 1fr;
    }

    .health-grid {
      grid-template-columns: 1fr;
    }
  }
</style>