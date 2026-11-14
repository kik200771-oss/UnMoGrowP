<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  interface AttributionModel {
    name: string;
    value: number;
    percentage: number;
    color: string;
  }

  interface Props {
    data?: {
      models: AttributionModel[];
      total: number;
    } | null;
    loading?: boolean;
  }

  let { data = null, loading = false }: Props = $props();
  let chartCanvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  $effect(() => {
    if (chartCanvas && data && !loading) {
      if (chart) {
        chart.destroy();
      }

      const ctx = chartCanvas.getContext('2d');
      if (!ctx) return;

      chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.models.map(m => m.name),
          datasets: [{
            data: data.models.map(m => m.value),
            backgroundColor: data.models.map(m => m.color),
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.parsed;
                  const percentage = ((value / data.total) * 100).toFixed(1);
                  return `${label}: $${value.toLocaleString()} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chart) {
        chart.destroy();
        chart = null;
      }
    };
  });

  function formatCurrency(num: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Attribution Models Comparison
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Revenue distribution across attribution models
      </p>
    </div>
    <div class="flex items-center gap-2">
      <button class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Export data">
        <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
      <button class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Settings">
        <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  </div>

  {#if loading}
    <div class="h-80 flex items-center justify-center">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-2"></div>
        <p class="text-sm text-gray-600 dark:text-gray-400">Loading chart...</p>
      </div>
    </div>
  {:else if data && data.models.length > 0}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Chart -->
      <div class="h-80 flex items-center justify-center">
        <canvas bind:this={chartCanvas}></canvas>
      </div>

      <!-- Legend -->
      <div class="flex flex-col justify-center space-y-3">
        {#each data.models as model}
          <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-4 h-4 rounded-full" style="background-color: {model.color}"></div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{model.name}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{model.percentage.toFixed(1)}% of total</p>
              </div>
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
              {formatCurrency(model.value)}
            </p>
          </div>
        {/each}

        <!-- Total -->
        <div class="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mt-2">
          <p class="text-sm font-semibold text-blue-900 dark:text-blue-100">Total Revenue</p>
          <p class="text-lg font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(data.total)}
          </p>
        </div>
      </div>
    </div>
  {:else}
    <div class="h-80 flex items-center justify-center">
      <div class="text-center">
        <svg class="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p class="text-gray-600 dark:text-gray-400">No attribution data available</p>
        <p class="text-sm text-gray-500 dark:text-gray-500 mt-2">Data will appear here once events are processed</p>
      </div>
    </div>
  {/if}
</div>
