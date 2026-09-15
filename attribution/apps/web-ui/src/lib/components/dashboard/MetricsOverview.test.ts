/**
 * MetricsOverview Component Tests
 * UnMoGrowP Attribution Platform - Svelte Frontend
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';
import MetricsOverview from './MetricsOverview.svelte';

// Mock the API client
const mockApiClient = {
	getDashboardStats: vi.fn()
};

vi.mock('$lib/api/client', () => ({
	api: mockApiClient
}));

describe('MetricsOverview Component', () => {
	const mockStats = {
		total_events: 1250000,
		active_users: 85000,
		revenue_today: 45000.75,
		conversions: 3420
	};

	const mockSuccessResponse = {
		success: true,
		data: mockStats,
		meta: {
			cache_hit: true,
			response_time: '125ms',
			source: 'redis'
		}
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockApiClient.getDashboardStats.mockResolvedValue(mockSuccessResponse);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders the component header', async () => {
		render(MetricsOverview);

		expect(screen.getByText('📊 Platform Metrics')).toBeInTheDocument();
		expect(screen.getByText('Refresh')).toBeInTheDocument();
	});

	it('shows loading state initially', () => {
		render(MetricsOverview);

		expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
		expect(document.querySelector('.loading-overlay')).toBeInTheDocument();
	});

	it('loads and displays dashboard stats', async () => {
		render(MetricsOverview);

		await waitFor(() => {
			expect(screen.getByText('1,250,000')).toBeInTheDocument(); // total_events
			expect(screen.getByText('85,000')).toBeInTheDocument(); // active_users
			expect(screen.getByText('$45,000.75')).toBeInTheDocument(); // revenue_today
			expect(screen.getByText('3,420')).toBeInTheDocument(); // conversions
		});

		expect(mockApiClient.getDashboardStats).toHaveBeenCalledOnce();
	});

	it('displays metric labels correctly', async () => {
		render(MetricsOverview);

		await waitFor(() => {
			expect(screen.getByText('Total Events')).toBeInTheDocument();
			expect(screen.getByText('Active Users')).toBeInTheDocument();
			expect(screen.getByText('Revenue Today')).toBeInTheDocument();
			expect(screen.getByText('Conversions')).toBeInTheDocument();
		});
	});

	it('calculates and displays conversion rate', async () => {
		render(MetricsOverview);

		await waitFor(() => {
			// Conversion rate = (3420 / 85000) * 100 = 4.02%
			expect(screen.getByText('4.02% conversion rate')).toBeInTheDocument();
		});
	});

	it('calculates and displays average revenue per conversion', async () => {
		render(MetricsOverview);

		await waitFor(() => {
			// Average = 45000.75 / 3420 = 13.16
			expect(screen.getByText('Avg: $13.16/conversion')).toBeInTheDocument();
		});
	});

	it('shows cache indicator when cache info is available', async () => {
		render(MetricsOverview);

		await waitFor(() => {
			expect(screen.getByText('🚀 Cached')).toBeInTheDocument();
			expect(screen.getByText('(125ms)')).toBeInTheDocument();
		});
	});

	it('handles error state', async () => {
		const errorResponse = {
			success: false,
			error: 'Failed to load data'
		};
		mockApiClient.getDashboardStats.mockResolvedValue(errorResponse);

		render(MetricsOverview);

		await waitFor(() => {
			expect(screen.getByText('⚠️ Failed to load data')).toBeInTheDocument();
			expect(screen.getByText('Retry')).toBeInTheDocument();
		});
	});

	it('handles network error', async () => {
		mockApiClient.getDashboardStats.mockRejectedValue(new Error('Network error'));

		render(MetricsOverview);

		await waitFor(() => {
			expect(screen.getByText('⚠️ Network error loading stats')).toBeInTheDocument();
		});
	});

	it('can manually refresh data', async () => {
		render(MetricsOverview);

		// Wait for initial load
		await waitFor(() => {
			expect(screen.getByText('1,250,000')).toBeInTheDocument();
		});

		// Reset mock to return different data
		const newStats = { ...mockStats, total_events: 1300000 };
		mockApiClient.getDashboardStats.mockResolvedValue({
			...mockSuccessResponse,
			data: newStats
		});

		// Click refresh button
		const refreshButton = screen.getByText('Refresh');
		await fireEvent.click(refreshButton);

		await waitFor(() => {
			expect(screen.getByText('1,300,000')).toBeInTheDocument();
		});

		expect(mockApiClient.getDashboardStats).toHaveBeenCalledTimes(2);
	});

	it('can retry after error', async () => {
		// Start with error
		mockApiClient.getDashboardStats.mockResolvedValue({
			success: false,
			error: 'Server error'
		});

		render(MetricsOverview);

		await waitFor(() => {
			expect(screen.getByText('⚠️ Server error')).toBeInTheDocument();
		});

		// Fix the API and retry
		mockApiClient.getDashboardStats.mockResolvedValue(mockSuccessResponse);

		const retryButton = screen.getByText('Retry');
		await fireEvent.click(retryButton);

		await waitFor(() => {
			expect(screen.getByText('1,250,000')).toBeInTheDocument();
		});
	});

	it('disables refresh button while loading', async () => {
		render(MetricsOverview);

		const refreshButton = screen.getByText('Refresh');
		expect(refreshButton).toBeDisabled();

		await waitFor(() => {
			expect(refreshButton).not.toBeDisabled();
		});
	});

	it('shows loading animation on refresh button', async () => {
		render(MetricsOverview);

		await waitFor(() => {
			expect(screen.getByText('1,250,000')).toBeInTheDocument();
		});

		const refreshButton = screen.getByText('Refresh');
		await fireEvent.click(refreshButton);

		// Should show loading state
		expect(refreshButton).toHaveClass('loading');
		expect(refreshButton).toBeDisabled();
	});

	it('displays last updated timestamp', async () => {
		render(MetricsOverview);

		await waitFor(() => {
			const lastUpdatedText = screen.getByText(/Last updated:/);
			expect(lastUpdatedText).toBeInTheDocument();
		});
	});

	it('displays source information', async () => {
		render(MetricsOverview);

		await waitFor(() => {
			expect(screen.getByText(/Source: redis/)).toBeInTheDocument();
		});
	});

	it('handles zero values gracefully', async () => {
		const zeroStats = {
			total_events: 0,
			active_users: 0,
			revenue_today: 0,
			conversions: 0
		};

		mockApiClient.getDashboardStats.mockResolvedValue({
			success: true,
			data: zeroStats
		});

		render(MetricsOverview);

		await waitFor(() => {
			expect(screen.getByText('0.00% conversion rate')).toBeInTheDocument();
			expect(screen.getByText('Avg: $0.00/conversion')).toBeInTheDocument();
		});
	});

	it('accepts custom refresh interval prop', () => {
		vi.useFakeTimers();

		render(MetricsOverview, {
			props: { refreshInterval: 5000 }
		});

		expect(mockApiClient.getDashboardStats).toHaveBeenCalledOnce();

		// Fast forward time
		vi.advanceTimersByTime(5000);

		expect(mockApiClient.getDashboardStats).toHaveBeenCalledTimes(2);

		vi.useRealTimers();
	});

	it('cleans up interval on component unmount', () => {
		vi.useFakeTimers();
		const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

		const { unmount } = render(MetricsOverview);
		unmount();

		expect(clearIntervalSpy).toHaveBeenCalled();

		vi.useRealTimers();
		clearIntervalSpy.mockRestore();
	});

	it('has proper CSS classes for metric cards', async () => {
		render(MetricsOverview);

		await waitFor(() => {
			expect(document.querySelector('.metric-card.events')).toBeInTheDocument();
			expect(document.querySelector('.metric-card.users')).toBeInTheDocument();
			expect(document.querySelector('.metric-card.revenue')).toBeInTheDocument();
			expect(document.querySelector('.metric-card.conversions')).toBeInTheDocument();
		});
	});

	it('displays trend information', async () => {
		render(MetricsOverview);

		await waitFor(() => {
			// Check for trend displays (approximate calculations)
			expect(screen.getByText(/\+.*today/)).toBeInTheDocument();
		});
	});
});