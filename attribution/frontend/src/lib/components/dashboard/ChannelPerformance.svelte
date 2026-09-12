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
        type: 'bar',
        data: {
          labels: data.channels?.map((c: any) => c.name) || [],
          datasets: [{
            label: 'Conversions',
            data: data.channels?.map((c: any) => c.conversions) || [],
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  });
</script>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Channel Performance</h3>
  {#if loading}
    <div class="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
  {:else if data}
    <div class="h-64"><canvas bind:this={chartCanvas}></canvas></div>
  {:else}
    <div class="h-64 flex items-center justify-center text-gray-400">No channel data</div>
  {/if}
</div>
