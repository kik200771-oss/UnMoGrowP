<script lang="ts">
  interface Props {
    data?: any;
    loading?: boolean;
  }

  let { data = null, loading = false }: Props = $props();
</script>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Insights</h3>
  {#if loading}
    <div class="space-y-3">
      {#each Array(4) as _}
        <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      {/each}
    </div>
  {:else if data?.insights}
    <div class="space-y-3">
      {#each data.insights as insight}
        <div class="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{insight.title}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{insight.description}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="h-64 flex items-center justify-center text-gray-400">No insights available</div>
  {/if}
</div>
