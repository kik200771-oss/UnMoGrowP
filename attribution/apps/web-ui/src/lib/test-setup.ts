/**
 * Test Setup for Vitest + Testing Library
 * UnMoGrowP Attribution Platform - Svelte Frontend
 */

import '@testing-library/jest-dom';

// Global test configuration and utilities
declare global {
	// Extend Window interface for test utilities
	interface Window {
		// Add any global test utilities here
	}
}

// Mock environment variables for testing
Object.assign(process.env, {
	NODE_ENV: 'test',
	VITE_API_URL: 'http://localhost:8080/api',
});

// Mock intersectionObserver for components that use it
global.IntersectionObserver = class IntersectionObserver {
	constructor() {}
	disconnect() {}
	observe() {}
	unobserve() {}
};

// Mock requestAnimationFrame for animations
global.requestAnimationFrame = (cb: FrameRequestCallback) => {
	return setTimeout(cb, 0);
};

global.cancelAnimationFrame = (id: number) => {
	clearTimeout(id);
};

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => {},
	}),
});

// Mock ResizeObserver for components that use it
global.ResizeObserver = class ResizeObserver {
	constructor(callback: ResizeObserverCallback) {}
	disconnect() {}
	observe() {}
	unobserve() {}
};

// Mock fetch for API calls in tests
global.fetch = vi.fn();

// Console error filter for known non-critical errors in tests
const originalError = console.error;
console.error = (...args: any[]) => {
	// Filter out known harmless errors in test environment
	const message = args[0];
	if (
		typeof message === 'string' &&
		(message.includes('Error: Not implemented: HTMLCanvasElement.prototype.getContext') ||
			message.includes('Error: Not implemented: HTMLFormElement.prototype.requestSubmit'))
	) {
		return;
	}
	originalError.call(console, ...args);
};