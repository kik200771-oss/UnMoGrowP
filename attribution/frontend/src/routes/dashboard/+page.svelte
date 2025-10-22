<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api/client';
  import { auth, authState } from '$lib/stores/auth';
  import * as echarts from 'echarts/core';
  import { LineChart } from 'echarts/charts';
  import { GridComponent, TooltipComponent, TitleComponent } from 'echarts/components';
  import { CanvasRenderer } from 'echarts/renderers';
  import type { EChartsOption } from 'echarts';

  // Register ECharts components
  echarts.use([LineChart, GridComponent, TooltipComponent, TitleComponent, CanvasRenderer]);

  // State
  let isLoading = $state(true);
  let stats = $state({
    totalEvents: 0,
    activeUsers: 0,
    revenue: 0,
  });
  let chartInstance: echarts.ECharts | null = null;

  // Subscribe to auth state using Svelte 5 runes
  const authStateValue = $derived($authState);
  const isAuthenticated = $derived(authStateValue.isAuthenticated);
  const user = $derived(authStateValue.user);

  // Check authentication
  onMount(async () => {
    if (!isAuthenticated) {
      await goto('/login');
      return;
    }

    // Fetch dashboard stats
    await loadDashboardData();

    // Initialize chart
    initChart();
  });

  // Redirect if logged out using effect
  $effect(() => {
    if (!isAuthenticated) {
      goto('/login');
    }
  });

  async function loadDashboardData() {
    isLoading = true;
    try {
      const response = await api.getDashboardStats();
      if (response.success && response.data) {
        stats = response.data;
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      isLoading = false;
    }
  }

  function initChart() {
    const chartDom = document.getElementById('events-chart');
    if (!chartDom) return;

    chartInstance = echarts.init(chartDom);

    const option: EChartsOption = {
      title: {
        text: 'Events Over Time',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: 'Events',
          type: 'line',
          smooth: true,
          data: [120, 132, 101, 134, 90, 230, 210],
          areaStyle: {},
          itemStyle: {
            color: 'rgb(109, 140, 248)',
          },
        },
      ],
    };

    chartInstance.setOption(option);

    // Handle window resize
    window.addEventListener('resize', () => {
      chartInstance?.resize();
    });
  }

  async function handleLogout() {
    auth.logout();
    // Navigation handled by reactive statement above
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Navigation Header -->
  <header class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center">
          <span class="text-xl font-bold" style="color: rgb(109, 140, 248);">UnMoGrowP</span>
        </div>
        <div class="flex items-center space-x-4">
          {#if user}
            <span class="text-sm text-gray-600">Welcome, {user.name}</span>
          {/if}
          <button
            onclick={handleLogout}
            class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

    {#if isLoading}
      <div class="flex items-center justify-center h-64">
        <div class="text-gray-500">Loading dashboard data...</div>
      </div>
    {:else}
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Total Events -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm font-medium text-gray-500 mb-2">Total Events</div>
          <div class="text-3xl font-bold text-gray-900">{stats.totalEvents.toLocaleString()}</div>
        </div>

        <!-- Active Users -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm font-medium text-gray-500 mb-2">Active Users</div>
          <div class="text-3xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</div>
        </div>

        <!-- Revenue -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm font-medium text-gray-500 mb-2">Revenue</div>
          <div class="text-3xl font-bold text-gray-900">${stats.revenue.toLocaleString()}</div>
        </div>
      </div>

      <!-- Chart -->
      <div class="bg-white rounded-lg shadow p-6">
        <div id="events-chart" style="width: 100%; height: 400px;"></div>
      </div>

      <!-- Test Event Tracking -->
      <div class="mt-8 bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Test Event Tracking</h2>
        <button
          onclick={async () => {
            const response = await api.trackEvent({
              event_type: 'page_view',
              app_id: 'test-app',
              device_id: 'device-123',
              session_id: 'session-456',
              timestamp: Date.now(),
              platform: 'web',
              os_version: 'N/A',
              app_version: '1.0.0',
              ip: '127.0.0.1',
              user_agent: navigator.userAgent,
            });
            alert(response.success ? 'Event tracked!' : 'Failed to track event');
          }}
          class="px-6 py-2 text-white rounded transition-colors hover:bg-[rgb(38,65,122)]"
          style="background: rgb(48, 80, 147);"
        >
          Send Test Event
        </button>
      </div>
    {/if}
  </main>
</div>

<style>
  /* Additional styles if needed */
</style>
