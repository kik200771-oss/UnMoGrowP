<script lang="ts">
  import { onMount } from 'svelte';
  import Chart from 'chart.js/auto';

  interface Props {
    data?: any;
    loading?: boolean;
  }

  let { data = null, loading = false }: Props = $props();
  let chartCanvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  $effect(() => {
    if (chartCanvas && data && !loading) {
      if (chart) chart.destroy();

      const ctx = chartCanvas.getContext('2d');
      if (!ctx) return;

      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels || [],
          datasets: [{
            label: 'Revenue',
            data: data.values || [],
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `Revenue: $${context.parsed.y.toLocaleString()}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => `$${(value as number / 1000).toFixed(0)}K`
              }
            }
          }
        }
      });
    }
  });
</script>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Analytics</h3>
  {#if loading}
    <div class="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
  {:else if data}
    <div class="h-64"><canvas bind:this={chartCanvas}></canvas></div>
  {:else}
    <div class="h-64 flex items-center justify-center text-gray-400">No data</div>
  {/if}
</div>
