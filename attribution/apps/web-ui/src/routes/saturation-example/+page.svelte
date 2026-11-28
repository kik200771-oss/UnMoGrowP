<!--
Multi-Period Saturation Chart Example
UnMoGrowP Attribution Platform
-->

<script>
import { onMount } from 'svelte';
import MultiPeriodSaturationChart from '$lib/components/analytics/MultiPeriodSaturationChart.svelte';

// Example campaign data
let selectedCampaign = $state('campaign_001');
let selectedPlatform = $state('facebook');
let currentSpend = $state(1500);
let targetSpend = $state(3000);

// Campaign options for demo
const campaigns = [
    { id: 'campaign_001', name: 'Q4 Holiday Campaign' },
    { id: 'campaign_002', name: 'New Product Launch' },
    { id: 'campaign_003', name: 'Brand Awareness Drive' }
];

const platforms = [
    { id: 'facebook', name: 'Facebook Ads' },
    { id: 'google', name: 'Google Ads' },
    { id: 'tiktok', name: 'TikTok Ads' }
];
</script>

<div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Page Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">
                🎯 Multi-Period Saturation Analysis
            </h1>
            <p class="mt-2 text-lg text-gray-600">
                Advanced traffic saturation modeling with ensemble predictions across multiple time periods
            </p>
        </div>

        <!-- Configuration Panel -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Campaign Configuration</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Campaign Selection -->
                <div>
                    <label for="campaign" class="block text-sm font-medium text-gray-700 mb-2">
                        Campaign
                    </label>
                    <select
                        id="campaign"
                        bind:value={selectedCampaign}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {#each campaigns as campaign}
                            <option value={campaign.id}>{campaign.name}</option>
                        {/each}
                    </select>
                </div>

                <!-- Platform Selection -->
                <div>
                    <label for="platform" class="block text-sm font-medium text-gray-700 mb-2">
                        Platform
                    </label>
                    <select
                        id="platform"
                        bind:value={selectedPlatform}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {#each platforms as platform}
                            <option value={platform.id}>{platform.name}</option>
                        {/each}
                    </select>
                </div>

                <!-- Current Spend -->
                <div>
                    <label for="current-spend" class="block text-sm font-medium text-gray-700 mb-2">
                        Current Daily Spend ($)
                    </label>
                    <input
                        id="current-spend"
                        type="number"
                        bind:value={currentSpend}
                        min="100"
                        max="10000"
                        step="100"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <!-- Target Spend -->
                <div>
                    <label for="target-spend" class="block text-sm font-medium text-gray-700 mb-2">
                        Target Daily Spend ($)
                    </label>
                    <input
                        id="target-spend"
                        type="number"
                        bind:value={targetSpend}
                        min="100"
                        max="10000"
                        step="100"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <!-- Current Configuration Summary -->
            <div class="mt-4 p-4 bg-blue-50 rounded-lg">
                <div class="flex items-center justify-between">
                    <div class="text-sm text-blue-800">
                        <strong>Analysis:</strong> {campaigns.find(c => c.id === selectedCampaign)?.name}
                        on {platforms.find(p => p.id === selectedPlatform)?.name}
                    </div>
                    <div class="text-sm text-blue-600">
                        Spend increase: {((targetSpend - currentSpend) / currentSpend * 100).toFixed(0)}%
                    </div>
                </div>
            </div>
        </div>

        <!-- Saturation Chart Component -->
        <MultiPeriodSaturationChart
            campaignId={selectedCampaign}
            platform={selectedPlatform}
            currentSpend={currentSpend}
            targetSpend={targetSpend}
        />

        <!-- Information Panel -->
        <div class="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h3 class="text-xl font-semibold text-gray-900 mb-4">
                📈 How Multi-Period Analysis Works
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="font-medium text-gray-800 mb-2">Time Periods Analyzed:</h4>
                    <ul class="space-y-2 text-sm text-gray-600">
                        <li><strong>🟡 7 days:</strong> Short-term trends and immediate saturation signals</li>
                        <li><strong>🟠 14 days:</strong> Medium-term performance and cost efficiency patterns</li>
                        <li><strong>🔴 30 days:</strong> Long-term saturation curves and stable performance</li>
                        <li><strong>🟣 Adaptive:</strong> AI-selected optimal period based on data quality</li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-medium text-gray-800 mb-2">Ensemble Prediction:</h4>
                    <ul class="space-y-2 text-sm text-gray-600">
                        <li><strong>🎯 Weighted Consensus:</strong> Combines all period predictions</li>
                        <li><strong>📊 Confidence Intervals:</strong> Shows prediction uncertainty</li>
                        <li><strong>⚠️ Risk Assessment:</strong> Evaluates saturation probability</li>
                        <li><strong>💡 Recommendations:</strong> Actionable spend optimization insights</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
/* Custom styles for the example page */
.min-h-screen {
    min-height: 100vh;
}
</style>