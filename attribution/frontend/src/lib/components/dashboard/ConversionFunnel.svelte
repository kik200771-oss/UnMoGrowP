<script lang="ts">
  interface Props {
    data?: any;
    loading?: boolean;
  }

  let { data = null, loading = false }: Props = $props();
</script>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversion Funnel</h3>
  {#if loading}
    <div class="space-y-3">
      {#each Array(5) as _}
        <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      {/each}
    </div>
  {:else if data?.stages}
    <div class="space-y-3">
      {#each data.stages as stage, i}
        <div class="relative">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{stage.name}</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{stage.count.toLocaleString()}</span>
          </div>
          <div class="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <div class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 flex items-center justify-end pr-4"
                 style="width: {stage.percentage}%">
              <span class="text-sm font-medium text-white">{stage.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="h-64 flex items-center justify-center text-gray-400">No funnel data</div>
  {/if}
</div>
