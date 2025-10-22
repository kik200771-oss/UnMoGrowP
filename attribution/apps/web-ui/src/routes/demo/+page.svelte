<!--
  Public Demo Page - UnMoGrowP Attribution Platform

  Shows live system metrics and capabilities without requiring authentication
  Perfect for showcasing the platform's monitoring and performance features
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { api } from '$lib/api/client';
  import MetricsOverview from '$lib/components/dashboard/MetricsOverview.svelte';
  import CustomersTable from '$lib/components/dashboard/CustomersTable.svelte';

  // State using Svelte 5 runes
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let systemHealth = $state<any>(null);
  let systemMetrics = $state<any>(null);
  let detailedMetrics = $state<any>(null);
  let liveData = $state({
    requests: 0,
    uptime: 0,
    memory: 0,
    rps: 0,
    errors: 0
  });

  let refreshInterval: number;
  let metricsInterval: number;

  onMount(async () => {
    // Load initial data
    await loadSystemData();

    // Setup auto-refresh every 5 seconds
    refreshInterval = setInterval(loadSystemData, 5000);

    // Setup metrics updates every 2 seconds for live feel
    metricsInterval = setInterval(loadLiveMetrics, 2000);
  });

  onDestroy(() => {
    if (refreshInterval) clearInterval(refreshInterval);
    if (metricsInterval) clearInterval(metricsInterval);
  });

  async function loadSystemData() {
    try {
      isLoading = true;
      error = null;

      // Load system health
      const healthResponse = await fetch('http://localhost:8080/health');
      if (healthResponse.ok) {
        systemHealth = await healthResponse.json();
      }

      // Load detailed metrics
      const metricsResponse = await fetch('http://localhost:8080/metrics/detailed');
      if (metricsResponse.ok) {
        detailedMetrics = await metricsResponse.json();
        if (detailedMetrics.success) {
          systemMetrics = detailedMetrics.data.system_metrics;
        }
      }

    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load system data';
      console.error('Error loading system data:', err);
    } finally {
      isLoading = false;
    }
  }

  async function loadLiveMetrics() {
    try {
      const response = await fetch('http://localhost:8080/metrics');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const metrics = data.data;
          liveData = {
            requests: metrics.request_count || 0,
            uptime: metrics.uptime_seconds || 0,
            memory: Math.round(metrics.memory_usage_mb || 0),
            rps: Math.round((metrics.requests_per_second || 0) * 100) / 100,
            errors: metrics.error_count || 0
          };
        }
      }
    } catch (err) {
      // Silently fail for live updates
      console.warn('Failed to update live metrics:', err);
    }
  }

  // Computed values
  const uptimeFormatted = $derived(() => {
    const minutes = Math.floor(liveData.uptime / 60);
    const seconds = liveData.uptime % 60;
    return `${minutes}m ${seconds}s`;
  });

  const healthStatus = $derived(() => {
    if (!systemHealth?.data) return 'unknown';
    return systemHealth.data.status || 'unknown';
  });

  const healthColor = $derived(() => {
    const status = healthStatus();
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  });
</script>

<svelte:head>
  <title>UnMoGrowP Attribution Platform - Live Demo</title>
  <meta name="description" content="Live demo of UnMoGrowP Attribution Platform with real-time metrics" />
</svelte:head>

<div class="demo-container">
  <!-- Header -->
  <header class="demo-header">
    <div class="header-content">
      <div class="title-section">
        <h1>🚀 UnMoGrowP Attribution Platform</h1>
        <p class="subtitle">Live System Demo & Performance Metrics</p>
        <div class="status-badge {healthColor()}">
          <span class="status-dot"></span>
          System Status: {healthStatus().toUpperCase()}
        </div>
      </div>

      <div class="live-stats">
        <div class="stat-item">
          <span class="stat-value">{liveData.requests}</span>
          <span class="stat-label">Requests</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{uptimeFormatted()}</span>
          <span class="stat-label">Uptime</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{liveData.memory}MB</span>
          <span class="stat-label">Memory</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{liveData.rps}</span>
          <span class="stat-label">RPS</span>
        </div>
      </div>
    </div>
  </header>

  <!-- Error State -->
  {#if error}
    <div class="error-banner">
      ⚠️ {error}
      <button onclick={loadSystemData} class="retry-btn">Retry</button>
    </div>
  {/if}

  <!-- Loading State -->
  {#if isLoading && !systemMetrics}
    <div class="loading-section">
      <div class="spinner"></div>
      <p>Loading system metrics...</p>
    </div>
  {:else}
    <!-- Main Content -->
    <main class="demo-content">

      <!-- Platform Overview -->
      <section class="overview-section">
        <h2>📊 Real-time Platform Metrics</h2>
        <p>This is a live view of our attribution platform's performance and capabilities.</p>

        <!-- Metrics Overview Component -->
        <div class="metrics-container">
          <MetricsOverview refreshInterval={5000} />
        </div>
      </section>

      <!-- System Performance -->
      <section class="performance-section">
        <h2>⚡ System Performance</h2>

        <div class="performance-grid">
          {#if systemMetrics}
            <div class="perf-card">
              <div class="perf-icon">🔥</div>
              <div class="perf-content">
                <div class="perf-value">{systemMetrics.goroutines}</div>
                <div class="perf-label">Active Goroutines</div>
                <div class="perf-trend">Go Runtime</div>
              </div>
            </div>

            <div class="perf-card">
              <div class="perf-icon">💾</div>
              <div class="perf-content">
                <div class="perf-value">{Math.round(systemMetrics.memory_alloc_mb * 100) / 100}MB</div>
                <div class="perf-label">Memory Allocated</div>
                <div class="perf-trend">Heap Usage</div>
              </div>
            </div>

            <div class="perf-card">
              <div class="perf-icon">⏱️</div>
              <div class="perf-content">
                <div class="perf-value">{systemMetrics.average_response_ms}ms</div>
                <div class="perf-label">Avg Response Time</div>
                <div class="perf-trend">API Performance</div>
              </div>
            </div>

            <div class="perf-card">
              <div class="perf-icon">📈</div>
              <div class="perf-content">
                <div class="perf-value">{Math.round(systemMetrics.error_rate * 100) / 100}%</div>
                <div class="perf-label">Error Rate</div>
                <div class="perf-trend">
                  {systemMetrics.error_rate === 0 ? 'Excellent' : 'Needs attention'}
                </div>
              </div>
            </div>
          {/if}
        </div>
      </section>

      <!-- Customer Data Demo -->
      <section class="customers-section">
        <h2>👥 Customer Portfolio</h2>
        <p>Sample customer data showing our attribution tracking capabilities.</p>

        <div class="customers-container">
          <CustomersTable />
        </div>
      </section>

      <!-- Platform Features -->
      <section class="features-section">
        <h2>🎯 Platform Features</h2>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🚀</div>
            <h3>High Performance</h3>
            <p>Built with Go + Redis for sub-millisecond response times</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Real-time Analytics</h3>
            <p>Live attribution tracking with comprehensive metrics</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Enterprise Security</h3>
            <p>JWT authentication with role-based access control</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Auto-scaling</h3>
            <p>Redis caching with automatic fallback mechanisms</p>
          </div>
        </div>
      </section>

      <!-- Technical Stack -->
      <section class="tech-stack-section">
        <h2>🏗️ Technical Architecture</h2>

        <div class="tech-grid">
          <div class="tech-item">
            <span class="tech-label">Backend:</span>
            <span class="tech-value">Go + Fiber v3</span>
          </div>
          <div class="tech-item">
            <span class="tech-label">Frontend:</span>
            <span class="tech-value">Svelte 5 + SvelteKit</span>
          </div>
          <div class="tech-item">
            <span class="tech-label">Cache:</span>
            <span class="tech-value">Redis + Auto-fallback</span>
          </div>
          <div class="tech-item">
            <span class="tech-label">Database:</span>
            <span class="tech-value">ClickHouse Analytics</span>
          </div>
        </div>
      </section>

    </main>
  {/if}

  <!-- Footer -->
  <footer class="demo-footer">
    <div class="footer-content">
      <p>🚀 <strong>UnMoGrowP Attribution Platform</strong> - Production-Ready Analytics Engine</p>
      <div class="footer-links">
        <a href="/login">Login</a>
        <a href="/register">Sign Up</a>
        <a href="/dashboard-redis">Admin Dashboard</a>
        <a href="http://localhost:8080/metrics" target="_blank">Raw Metrics API</a>
      </div>
    </div>
  </footer>
</div>

<style>
  .demo-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* Header Styles */
  .demo-header {
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 2rem 0;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 2rem;
  }

  .title-section h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    background: linear-gradient(45deg, #fff, #f0f0f0);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    font-size: 1.2rem;
    opacity: 0.9;
    margin: 0 0 1rem 0;
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 25px;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    animation: pulse 2s infinite;
  }

  .live-stats {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .stat-item {
    text-align: center;
  }

  .stat-value {
    display: block;
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.8rem;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Content Styles */
  .demo-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .demo-content section {
    margin-bottom: 3rem;
  }

  .demo-content h2 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .demo-content p {
    opacity: 0.9;
    line-height: 1.6;
    margin-bottom: 2rem;
  }

  /* Loading & Error States */
  .loading-section {
    text-align: center;
    padding: 4rem 2rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  .error-banner {
    background: rgba(220, 53, 69, 0.8);
    padding: 1rem 2rem;
    margin: 1rem 2rem;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .retry-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
  }

  .retry-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Component Containers */
  .metrics-container,
  .customers-container {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Performance Grid */
  .performance-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .perf-card {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    transition: transform 0.2s, background 0.2s;
  }

  .perf-card:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.15);
  }

  .perf-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .perf-content {
    flex: 1;
  }

  .perf-value {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .perf-label {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .perf-trend {
    font-size: 0.8rem;
    opacity: 0.7;
  }

  /* Features Grid */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .feature-card {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    transition: transform 0.2s;
  }

  .feature-card:hover {
    transform: translateY(-4px);
  }

  .feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .feature-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
  }

  .feature-card p {
    margin: 0;
    opacity: 0.8;
    line-height: 1.5;
  }

  /* Tech Stack */
  .tech-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }

  .tech-item {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .tech-label {
    font-weight: 600;
    opacity: 0.8;
  }

  .tech-value {
    font-weight: 500;
  }

  /* Footer */
  .demo-footer {
    background: rgba(0, 0, 0, 0.3);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 2rem 0;
    margin-top: 4rem;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    text-align: center;
  }

  .footer-links {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
    gap: 2rem;
    flex-wrap: wrap;
  }

  .footer-links a {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-links a:hover {
    color: white;
  }

  /* Animations */
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      text-align: center;
    }

    .title-section h1 {
      font-size: 2rem;
    }

    .live-stats {
      justify-content: center;
    }

    .demo-content {
      padding: 1rem;
    }

    .performance-grid,
    .features-grid {
      grid-template-columns: 1fr;
    }
  }
</style>