<script lang="ts">
  interface Props {
    data?: any;
    loading?: boolean;
  }

  let { data = null, loading = false }: Props = $props();
</script>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Customer Journeys</h3>
  {#if loading}
    <div class="space-y-4">
      {#each Array(5) as _}
        <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      {/each}
    </div>
  {:else if data?.journeys}
    <div class="space-y-4">
      {#each data.journeys.slice(0, 5) as journey}
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-900 dark:text-white">{journey.name}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400">{journey.count} conversions</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            {#each journey.touchpoints as touchpoint, i}
              <div class="flex items-center gap-1">
                <span class="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  {touchpoint}
                </span>
                {#if i < journey.touchpoints.length - 1}
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="h-64 flex items-center justify-center text-gray-400">No journey data</div>
  {/if}
</div>
