/**
 * Test Utilities
 * UnMoGrowP Attribution Platform - Svelte Frontend
 *
 * Common utilities and helpers for testing Svelte components
 */

import { render, type RenderResult } from '@testing-library/svelte';
import type { ComponentType, SvelteComponent } from 'svelte';
import { vi } from 'vitest';

// Mock data generators
export const createMockDashboardStats = (overrides = {}) => ({
	total_events: 1250000,
	active_users: 85000,
	revenue_today: 45000.75,
	conversions: 3420,
	cache_enabled: true,
	...overrides
});

export const createMockApiResponse = (data: any, overrides = {}) => ({
	success: true,
	data,
	meta: {
		cache_hit: true,
		response_time: '125ms',
		source: 'redis',
		timestamp: new Date().toISOString()
	},
	...overrides
});

export const createMockErrorResponse = (error: string) => ({
	success: false,
	error,
	data: null
});

// Component testing utilities
export function renderWithProps<T extends SvelteComponent>(
	Component: ComponentType<T>,
	props: Record<string, any> = {},
	options: any = {}
): RenderResult<T> {
	return render(Component, {
		props,
		...options
	});
}

// API mocking utilities
export const mockApiClient = {
	getDashboardStats: vi.fn(),
	getMetrics: vi.fn(),
	getAnalytics: vi.fn(),
	submitForm: vi.fn(),
	authenticateUser: vi.fn(),
	getCustomers: vi.fn(),

	// Helper to reset all mocks
	reset: () => {
		Object.values(mockApiClient).forEach(mock => {
			if (typeof mock === 'function' && 'mockReset' in mock) {
				mock.mockReset();
			}
		});
	},

	// Helper to setup common responses
	setupSuccess: (data: any) => {
		mockApiClient.getDashboardStats.mockResolvedValue(createMockApiResponse(data));
	},

	setupError: (error: string) => {
		mockApiClient.getDashboardStats.mockResolvedValue(createMockErrorResponse(error));
	},

	setupNetworkError: () => {
		mockApiClient.getDashboardStats.mockRejectedValue(new Error('Network error'));
	}
};

// DOM testing utilities
export const waitForElement = async (selector: string, timeout = 1000) => {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();

		const check = () => {
			const element = document.querySelector(selector);
			if (element) {
				resolve(element);
			} else if (Date.now() - startTime > timeout) {
				reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
			} else {
				setTimeout(check, 10);
			}
		};

		check();
	});
};

export const waitForText = async (text: string, timeout = 1000) => {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();

		const check = () => {
			const element = document.body.textContent?.includes(text);
			if (element) {
				resolve(true);
			} else if (Date.now() - startTime > timeout) {
				reject(new Error(`Text "${text}" not found within ${timeout}ms`));
			} else {
				setTimeout(check, 10);
			}
		};

		check();
	});
};

// Form testing utilities
export const fillForm = async (formData: Record<string, string>) => {
	const { fireEvent } = await import('@testing-library/svelte');

	for (const [name, value] of Object.entries(formData)) {
		const input = document.querySelector(`[name="${name}"]`) as HTMLInputElement;
		if (input) {
			await fireEvent.input(input, { target: { value } });
		}
	}
};

export const submitForm = async (formSelector = 'form') => {
	const { fireEvent } = await import('@testing-library/svelte');
	const form = document.querySelector(formSelector) as HTMLFormElement;
	if (form) {
		await fireEvent.submit(form);
	}
};

// Animation and timing utilities
export const fastForwardTime = (ms: number) => {
	vi.advanceTimersByTime(ms);
};

export const mockTimers = () => {
	vi.useFakeTimers();
	return () => vi.useRealTimers();
};

// Local storage utilities for testing
export const mockLocalStorage = () => {
	const store: Record<string, string> = {};

	const localStorageMock = {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			Object.keys(store).forEach(key => delete store[key]);
		}),
		key: vi.fn((index: number) => Object.keys(store)[index] || null),
		get length() {
			return Object.keys(store).length;
		}
	};

	Object.defineProperty(window, 'localStorage', {
		value: localStorageMock,
		writable: true
	});

	return localStorageMock;
};

// Session storage utilities
export const mockSessionStorage = () => {
	const store: Record<string, string> = {};

	const sessionStorageMock = {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			Object.keys(store).forEach(key => delete store[key]);
		}),
		key: vi.fn((index: number) => Object.keys(store)[index] || null),
		get length() {
			return Object.keys(store).length;
		}
	};

	Object.defineProperty(window, 'sessionStorage', {
		value: sessionStorageMock,
		writable: true
	});

	return sessionStorageMock;
};

// Custom matchers for better assertions
export const customMatchers = {
	toBeVisible: (element: Element) => {
		const isVisible = element && !element.hasAttribute('hidden') &&
			window.getComputedStyle(element).display !== 'none' &&
			window.getComputedStyle(element).visibility !== 'hidden';

		return {
			pass: isVisible,
			message: () => `Expected element to be ${isVisible ? 'hidden' : 'visible'}`
		};
	},

	toHaveLoadingState: (element: Element) => {
		const hasLoading = element.classList.contains('loading') ||
			element.hasAttribute('aria-busy') ||
			element.querySelector('.spinner, .loading') !== null;

		return {
			pass: hasLoading,
			message: () => `Expected element to ${hasLoading ? 'not ' : ''}have loading state`
		};
	}
};

// Test data factories
export const createTestUser = (overrides = {}) => ({
	id: 'user-123',
	email: 'test@example.com',
	name: 'Test User',
	role: 'user',
	createdAt: new Date().toISOString(),
	...overrides
});

export const createTestCustomer = (overrides = {}) => ({
	id: 'customer-456',
	name: 'Test Customer',
	email: 'customer@example.com',
	plan: 'pro',
	status: 'active',
	createdAt: new Date().toISOString(),
	...overrides
});

export const createTestEvent = (overrides = {}) => ({
	id: 'event-789',
	type: 'click',
	userId: 'user-123',
	timestamp: new Date().toISOString(),
	properties: {},
	...overrides
});

// URL and routing utilities for testing
export const createMockLocation = (url: string) => {
	const location = new URL(url, 'http://localhost:3000');

	Object.defineProperty(window, 'location', {
		value: {
			...location,
			assign: vi.fn(),
			replace: vi.fn(),
			reload: vi.fn()
		},
		writable: true
	});

	return window.location;
};

// Error boundary testing
export const triggerError = (component: any, error: Error) => {
	// Simulate component error for error boundary testing
	vi.spyOn(console, 'error').mockImplementation(() => {});
	throw error;
};