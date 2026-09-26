<script lang="ts">
  interface Props {
    data?: any;
    loading?: boolean;
  }

  let { data = null, loading = false }: Props = $props();

  function getRiskColor(risk: string): string {
    switch(risk.toLowerCase()) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Churn Risk</h3>
  {#if loading}
    <div class="space-y-3">
      {#each Array(5) as _}
        <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      {/each}
    </div>
  {:else if data?.users}
    <div class="space-y-3">
      {#each data.users as user}
        <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-900 dark:text-white">{user.email}</span>
            <span class="text-xs font-semibold px-2 py-1 rounded {getRiskColor(user.risk)}">
              {user.risk.toUpperCase()}
            </span>
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400">
            Last seen: {new Date(user.lastSeen).toLocaleDateString()}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="h-64 flex items-center justify-center text-gray-400">No churn data</div>
  {/if}
</div>
