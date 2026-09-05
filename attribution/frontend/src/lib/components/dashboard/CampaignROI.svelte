<script lang="ts">
  interface Props {
    data?: any;
    loading?: boolean;
  }

  let { data = null, loading = false }: Props = $props();

  function formatCurrency(num: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(num);
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign ROI</h3>
  {#if loading}
    <div class="space-y-3">
      {#each Array(5) as _}
        <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      {/each}
    </div>
  {:else if data?.campaigns}
    <div class="space-y-3">
      {#each data.campaigns.slice(0, 5) as campaign}
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-900 dark:text-white">{campaign.name}</span>
            <span class="text-sm font-bold {campaign.roi >= 100 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}">
              {campaign.roi.toFixed(0)}% ROI
            </span>
          </div>
          <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Spend: {formatCurrency(campaign.spend)}</span>
            <span>Revenue: {formatCurrency(campaign.revenue)}</span>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="h-64 flex items-center justify-center text-gray-400">No campaign data</div>
  {/if}
</div>
