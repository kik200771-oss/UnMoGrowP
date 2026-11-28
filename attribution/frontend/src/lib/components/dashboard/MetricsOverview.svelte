<script lang="ts">
  interface MetricData {
    totalEvents: number;
    totalRevenue: number;
    totalConversions: number;
    conversionRate: number;
    averageOrderValue: number;
    activeUsers: number;
    trends: {
      events: number;
      revenue: number;
      conversions: number;
      conversionRate: number;
      aov: number;
      users: number;
    };
  }

  interface Props {
    data?: MetricData | null;
    loading?: boolean;
  }

  let { data = null, loading = false }: Props = $props();

  function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  }

  function formatCurrency(num: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }

  function formatPercent(num: number): string {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  }

  function getTrendColor(trend: number): string {
    return trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  }

  function getTrendIcon(trend: number): string {
    return trend >= 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3';
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
  <!-- Total Events -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      {#if data?.trends && !loading}
        <span class="flex items-center gap-1 text-sm font-medium {getTrendColor(data.trends.events)}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getTrendIcon(data.trends.events)} />
          </svg>
          {formatPercent(data.trends.events)}
        </span>
      {/if}
    </div>
    <div>
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Events</p>
      {#if loading}
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      {:else if data}
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {formatNumber(data.totalEvents)}
        </p>
      {:else}
        <p class="text-2xl font-bold text-gray-400 dark:text-gray-600">--</p>
      {/if}
    </div>
  </div>

  <!-- Total Revenue -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      {#if data?.trends && !loading}
        <span class="flex items-center gap-1 text-sm font-medium {getTrendColor(data.trends.revenue)}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getTrendIcon(data.trends.revenue)} />
          </svg>
          {formatPercent(data.trends.revenue)}
        </span>
      {/if}
    </div>
    <div>
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
      {#if loading}
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      {:else if data}
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(data.totalRevenue)}
        </p>
      {:else}
        <p class="text-2xl font-bold text-gray-400 dark:text-gray-600">--</p>
      {/if}
    </div>
  </div>

  <!-- Total Conversions -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      {#if data?.trends && !loading}
        <span class="flex items-center gap-1 text-sm font-medium {getTrendColor(data.trends.conversions)}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getTrendIcon(data.trends.conversions)} />
          </svg>
          {formatPercent(data.trends.conversions)}
        </span>
      {/if}
    </div>
    <div>
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Conversions</p>
      {#if loading}
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      {:else if data}
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {formatNumber(data.totalConversions)}
        </p>
      {:else}
        <p class="text-2xl font-bold text-gray-400 dark:text-gray-600">--</p>
      {/if}
    </div>
  </div>

  <!-- Conversion Rate -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
          <svg class="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>
      {#if data?.trends && !loading}
        <span class="flex items-center gap-1 text-sm font-medium {getTrendColor(data.trends.conversionRate)}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getTrendIcon(data.trends.conversionRate)} />
          </svg>
          {formatPercent(data.trends.conversionRate)}
        </span>
      {/if}
    </div>
    <div>
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Conversion Rate</p>
      {#if loading}
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      {:else if data}
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {data.conversionRate.toFixed(2)}%
        </p>
      {:else}
        <p class="text-2xl font-bold text-gray-400 dark:text-gray-600">--</p>
      {/if}
    </div>
  </div>

  <!-- Average Order Value -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
          <svg class="w-5 h-5 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      </div>
      {#if data?.trends && !loading}
        <span class="flex items-center gap-1 text-sm font-medium {getTrendColor(data.trends.aov)}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getTrendIcon(data.trends.aov)} />
          </svg>
          {formatPercent(data.trends.aov)}
        </span>
      {/if}
    </div>
    <div>
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Avg Order Value</p>
      {#if loading}
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      {:else if data}
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(data.averageOrderValue)}
        </p>
      {:else}
        <p class="text-2xl font-bold text-gray-400 dark:text-gray-600">--</p>
      {/if}
    </div>
  </div>

  <!-- Active Users -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      </div>
      {#if data?.trends && !loading}
        <span class="flex items-center gap-1 text-sm font-medium {getTrendColor(data.trends.users)}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getTrendIcon(data.trends.users)} />
          </svg>
          {formatPercent(data.trends.users)}
        </span>
      {/if}
    </div>
    <div>
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active Users</p>
      {#if loading}
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      {:else if data}
        <p class="text-2xl font-bold text-gray-900 dark:text-white">
          {formatNumber(data.activeUsers)}
        </p>
      {:else}
        <p class="text-2xl font-bold text-gray-400 dark:text-gray-600">--</p>
      {/if}
    </div>
  </div>
</div>
