<!--
Multi-Period Saturation Chart Component
UnMoGrowP Attribution Platform - Svelte 5

Отображает прогнозы SaturationModel для всех 4 периодов:
- Last 7 days
- Last 14 days
- Last 30 days
- Adaptive period

+ Ensemble прогноз с confidence intervals
-->

<script>
import { onMount } from 'svelte';
import * as echarts from 'echarts';
import { getSaturationAnalytics } from '$lib/api/client.js';

// Props
export let campaignId = 'campaign_001';
export let platform = 'facebook';
export let currentSpend = 1000;
export let targetSpend = 2000;
export let predictionData = null;

// Svelte 5 runes
let chartContainer = $state(null);
let selectedPeriod = $state('ensemble');
let showConfidenceIntervals = $state(true);
let isLoading = $state(false);

// Computed values
const periods = $derived(() => {
    if (!predictionData?.periods) return [];

    return predictionData.periods.map(period => ({
        key: period.period,
        name: formatPeriodName(period.period),
        days: period.days,
        confidence: period.confidence,
        data: generateTrajectoryFromPrediction(period),
        optimal: period.saturation_point,
        quality: getQualityFromConfidence(period.confidence)
    }));
});

const ensembleData = $derived(() => {
    return predictionData?.ensemble ? {
        consensus_trajectory: generateTrajectoryFromEnsemble(predictionData.ensemble),
        ensemble_confidence: predictionData.ensemble.confidence_interval.lower / predictionData.ensemble.predicted_cpa,
        recommended_spend: predictionData.ensemble.optimal_spend,
        risk_level: predictionData.ensemble.risk_level,
        period_weights: {
            '7d': 0.25,
            '14d': 0.30,
            '30d': 0.25,
            'adaptive': 0.20
        }
    } : null;
});

const currentMetrics = $derived(() => {
    if (!selectedPeriod || !predictionData) return null;

    const data = selectedPeriod === 'ensemble'
        ? ensembleData?.consensus_trajectory
        : predictionData.predictions_by_period[selectedPeriod]?.spend_trajectory;

    if (!data) return null;

    // Находим ближайший spend level к текущему
    const closest = data.reduce((prev, curr) =>
        Math.abs(curr.spend - currentSpend) < Math.abs(prev.spend - currentSpend)
            ? curr : prev
    );

    return closest;
});

// Chart instance
let chart = null;

onMount(() => {
    if (chartContainer) {
        chart = echarts.init(chartContainer);
        updateChart();
    }

    return () => {
        if (chart) {
            chart.dispose();
        }
    };
});

// Update chart when data changes
$effect(() => {
    if (chart && predictionData) {
        updateChart();
    }
});

function formatPeriodName(key) {
    const names = {
        '7d': 'Short Term (7d)',
        '14d': 'Medium Term (14d)',
        '30d': 'Long Term (30d)',
        'adaptive': 'Adaptive Period'
    };
    return names[key] || key;
}

function generateTrajectoryFromPrediction(period) {
    // Generate spend trajectory based on prediction data
    const trajectory = [];
    const stepSize = 100; // $100 increments
    const maxSpend = period.saturation_point * 1.5;

    for (let spend = 500; spend <= maxSpend; spend += stepSize) {
        // Simple logistic curve simulation based on saturation point
        const saturation = Math.min(spend / period.saturation_point, 2.0);
        const cpi = period.predicted_cpa * (1 + Math.log(saturation + 0.1) * 0.3);

        trajectory.push({
            spend,
            predicted_cpi: Math.max(cpi, period.predicted_cpa * 0.8),
            saturation_level: Math.min(saturation / 2, 1.0),
            efficiency_rating: saturation < 0.8 ? 'high' : saturation < 1.2 ? 'medium' : 'low'
        });
    }

    return trajectory;
}

function generateTrajectoryFromEnsemble(ensemble) {
    // Generate consensus trajectory from ensemble prediction
    const trajectory = [];
    const stepSize = 100;
    const maxSpend = ensemble.optimal_spend * 1.5;

    for (let spend = 500; spend <= maxSpend; spend += stepSize) {
        const saturation = spend / ensemble.optimal_spend;
        const cpi = ensemble.predicted_cpa * (1 + Math.log(saturation + 0.1) * 0.25);

        trajectory.push({
            spend,
            predicted_cpi: Math.max(cpi, ensemble.predicted_cpa * 0.85),
            saturation_level: Math.min(saturation, 1.0),
            efficiency_rating: saturation < 0.9 ? 'high' : saturation < 1.1 ? 'medium' : 'low'
        });
    }

    return trajectory;
}

function getQualityFromConfidence(confidence) {
    if (confidence >= 0.9) return 'excellent';
    if (confidence >= 0.8) return 'good';
    if (confidence >= 0.6) return 'fair';
    return 'poor';
}

function updateChart() {
    if (!chart || !predictionData) return;

    const option = createChartOption();
    chart.setOption(option);
}

function createChartOption() {
    const series = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffa726'];

    // Add individual period lines
    periods.forEach((period, index) => {
        if (selectedPeriod === 'all' || selectedPeriod === period.key) {
            series.push({
                name: period.name,
                type: 'line',
                data: period.data.map(d => [d.spend, d.predicted_cpi]),
                smooth: true,
                lineStyle: {
                    width: selectedPeriod === period.key ? 3 : 2,
                    opacity: selectedPeriod === period.key ? 1 : 0.6
                },
                itemStyle: {
                    color: colors[index]
                },
                emphasis: {
                    focus: 'series'
                }
            });
        }
    });

    // Add ensemble line
    if (ensembleData && (selectedPeriod === 'ensemble' || selectedPeriod === 'all')) {
        series.push({
            name: 'Ensemble Prediction',
            type: 'line',
            data: ensembleData.consensus_trajectory.map(d => [d.spend, d.predicted_cpi]),
            smooth: true,
            lineStyle: {
                width: 4,
                color: '#2c3e50'
            },
            itemStyle: {
                color: '#2c3e50'
            },
            emphasis: {
                focus: 'series'
            }
        });

        // Add confidence intervals if enabled
        if (showConfidenceIntervals && ensembleData.confidence_intervals) {
            const upperBound = ensembleData.confidence_intervals.map(d => [d.spend, d.upper_bound]);
            const lowerBound = ensembleData.confidence_intervals.map(d => [d.spend, d.lower_bound]);

            series.push({
                name: 'Confidence Interval',
                type: 'line',
                data: upperBound,
                lineStyle: {
                    opacity: 0
                },
                stack: 'confidence',
                symbol: 'none'
            });

            series.push({
                name: 'Confidence Band',
                type: 'line',
                data: lowerBound,
                lineStyle: {
                    opacity: 0
                },
                areaStyle: {
                    color: 'rgba(44, 62, 80, 0.1)'
                },
                stack: 'confidence',
                symbol: 'none'
            });
        }
    }

    // Add current spend indicator
    series.push({
        name: 'Current Spend',
        type: 'line',
        markLine: {
            data: [{
                xAxis: currentSpend,
                lineStyle: {
                    color: '#e74c3c',
                    type: 'dashed',
                    width: 2
                },
                label: {
                    formatter: `Current: $${(currentSpend / 1000).toFixed(0)}K`
                }
            }]
        }
    });

    return {
        title: {
            text: 'CPA Saturation Curve Prediction',
            subtext: `Campaign: ${campaignId}`,
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                let html = `<div style="font-size: 14px;">`;
                html += `<strong>Spend: $${(params[0].value[0] / 1000).toFixed(0)}K</strong><br/>`;

                params.forEach(param => {
                    if (param.seriesName !== 'Current Spend') {
                        const cpi = param.value[1];
                        html += `${param.marker} ${param.seriesName}: $${cpi.toFixed(2)}<br/>`;
                    }
                });

                html += `</div>`;
                return html;
            }
        },
        legend: {
            top: 40,
            type: 'scroll'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '8%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: 'Daily Ad Spend ($)',
            nameLocation: 'middle',
            nameGap: 30,
            axisLabel: {
                formatter: function(value) {
                    return '$' + (value / 1000).toFixed(0) + 'K';
                }
            }
        },
        yAxis: {
            type: 'value',
            name: 'Cost Per Install ($)',
            nameLocation: 'middle',
            nameGap: 40,
            axisLabel: {
                formatter: function(value) {
                    return '$' + value.toFixed(2);
                }
            }
        },
        series: series,
        animation: true,
        animationDuration: 1000
    };
}

function getConfidenceColor(confidence) {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
}

function getQualityBadge(quality) {
    const badges = {
        'excellent': 'bg-green-100 text-green-800',
        'good': 'bg-blue-100 text-blue-800',
        'fair': 'bg-yellow-100 text-yellow-800',
        'poor': 'bg-red-100 text-red-800'
    };
    return badges[quality] || 'bg-gray-100 text-gray-800';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// API call to get predictions
async function loadPredictions() {
    if (!campaignId) return;

    isLoading = true;

    try {
        const data = await getSaturationAnalytics({
            campaign_id: campaignId,
            platform: platform,
            current_spend: currentSpend,
            target_spend: targetSpend
        });

        predictionData = data;
    } catch (error) {
        console.error('Failed to load saturation predictions:', error);
        // Show error message to user if needed
    } finally {
        isLoading = false;
    }
}

// Load predictions when component mounts or parameters change
$effect(() => {
    if (campaignId && platform && currentSpend > 0 && targetSpend > currentSpend) {
        loadPredictions();
    }
});
</script>

<!-- Main Container -->
<div class="bg-white rounded-lg shadow-lg p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
        <div>
            <h3 class="text-xl font-semibold text-gray-900">
                Multi-Period Saturation Analysis
            </h3>
            <p class="text-sm text-gray-600 mt-1">
                CPA growth prediction across different time horizons
            </p>
        </div>

        <div class="flex items-center space-x-4">
            <!-- Period Selector -->
            <select
                bind:value={selectedPeriod}
                class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="ensemble">🎯 Ensemble Prediction</option>
                <option value="all">📊 All Periods</option>
                {#each periods as period}
                    <option value={period.key}>
                        {period.name} ({period.confidence.toFixed(0)}% confidence)
                    </option>
                {/each}
            </select>

            <!-- Confidence Intervals Toggle -->
            {#if selectedPeriod === 'ensemble'}
                <label class="flex items-center">
                    <input
                        type="checkbox"
                        bind:checked={showConfidenceIntervals}
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="ml-2 text-sm text-gray-700">Show confidence bands</span>
                </label>
            {/if}
        </div>
    </div>

    <!-- Chart Container -->
    {#if isLoading}
        <div class="flex items-center justify-center h-96">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">Loading saturation predictions...</span>
        </div>
    {:else if predictionData}
        <div bind:this={chartContainer} class="w-full h-96 mb-6"></div>

        <!-- Current Metrics Card -->
        {#if currentMetrics}
            <div class="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 class="font-medium text-blue-900 mb-2">
                    Current Spend Analysis
                </h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div class="text-sm text-blue-600">Current Spend</div>
                        <div class="text-lg font-semibold">{formatCurrency(currentSpend)}</div>
                    </div>
                    <div>
                        <div class="text-sm text-blue-600">Predicted CPI</div>
                        <div class="text-lg font-semibold">${currentMetrics.predicted_cpi?.toFixed(2)}</div>
                    </div>
                    <div>
                        <div class="text-sm text-blue-600">Saturation Level</div>
                        <div class="text-lg font-semibold">
                            {(currentMetrics.saturation_level * 100).toFixed(0)}%
                        </div>
                    </div>
                    <div>
                        <div class="text-sm text-blue-600">Efficiency</div>
                        <div class="text-lg font-semibold capitalize">
                            {currentMetrics.efficiency_rating?.replace('_', ' ')}
                        </div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Period Comparison Table -->
        <div class="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Period
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Confidence
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data Points
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fit Quality
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Optimal Spend
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    {#each periods as period}
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">
                                    {period.name}
                                </div>
                                <div class="text-sm text-gray-500">
                                    {period.days} days
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium {getConfidenceColor(period.confidence)}">
                                    {(period.confidence * 100).toFixed(0)}%
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {period.data.length}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getQualityBadge(period.quality)}">
                                    {period.quality}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(period.optimal)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                    onclick={() => selectedPeriod = period.key}
                                    class="text-blue-600 hover:text-blue-900 font-medium"
                                >
                                    View Details
                                </button>
                            </td>
                        </tr>
                    {/each}

                    {#if ensembleData}
                        <tr class="bg-blue-50 hover:bg-blue-100">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-blue-900">
                                    🎯 Ensemble Prediction
                                </div>
                                <div class="text-sm text-blue-600">
                                    Weighted consensus
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-blue-600">
                                    {(ensembleData.ensemble_confidence * 100).toFixed(0)}%
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                All periods
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    ensemble
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-900">
                                {formatCurrency(ensembleData.recommended_spend)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                    onclick={() => selectedPeriod = 'ensemble'}
                                    class="text-blue-600 hover:text-blue-900 font-medium"
                                >
                                    View Consensus
                                </button>
                            </td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>

        <!-- Recommendations Section -->
        {#if ensembleData}
            <div class="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <h4 class="text-lg font-semibold text-gray-900 mb-4">
                    🎯 Ensemble Recommendations
                </h4>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600">
                            {formatCurrency(ensembleData.recommended_spend)}
                        </div>
                        <div class="text-sm text-gray-600">Recommended Daily Spend</div>
                    </div>

                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">
                            {(ensembleData.ensemble_confidence * 100).toFixed(0)}%
                        </div>
                        <div class="text-sm text-gray-600">Prediction Confidence</div>
                    </div>

                    <div class="text-center">
                        <div class="text-2xl font-bold
                            {ensembleData.risk_level === 'low' ? 'text-green-600' :
                              ensembleData.risk_level === 'medium' ? 'text-yellow-600' : 'text-red-600'}">
                            {ensembleData.risk_level.toUpperCase()}
                        </div>
                        <div class="text-sm text-gray-600">Risk Level</div>
                    </div>
                </div>

                <!-- Period Weights -->
                <div class="mt-4">
                    <div class="text-sm font-medium text-gray-700 mb-2">Model Weights:</div>
                    <div class="flex space-x-4">
                        {#each Object.entries(ensembleData.period_weights) as [period, weight]}
                            <div class="text-xs text-gray-600">
                                {formatPeriodName(period)}: {(weight * 100).toFixed(0)}%
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    {:else}
        <div class="text-center text-gray-500 py-12">
            No prediction data available. Please select a campaign to analyze.
        </div>
    {/if}
</div>

<style>
/* Additional custom styles if needed */
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>