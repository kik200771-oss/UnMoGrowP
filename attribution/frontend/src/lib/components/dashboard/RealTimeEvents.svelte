<script lang="ts">
  interface Props {
    data?: any;
    loading?: boolean;
  }

  let { data = null, loading = false }: Props = $props();
</script>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Real-Time Events</h3>
  {#if loading}
    <div class="space-y-2">
      {#each Array(8) as _}
        <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      {/each}
    </div>
  {:else if data?.events}
    <div class="space-y-2 max-h-96 overflow-y-auto">
      {#each data.events as event}
        <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm">
          <div class="flex items-center justify-between">
            <span class="font-medium text-gray-900 dark:text-white">{event.type}</span>
            <span class="text-xs text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {event.device_id.slice(0, 16)}... • {event.platform}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="h-64 flex items-center justify-center text-gray-400">No real-time events</div>
  {/if}
</div>
