import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: parseInt(process.env.VITE_PORT || '5173'),
		host: true,
		proxy: {
			'/api': {
				target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
				changeOrigin: true
			},
			'/analytics': {
				target: process.env.VITE_ANALYTICS_PROXY_TARGET || 'http://localhost:8091',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/analytics/, '/api/v1/analytics')
			}
		}
	},
	optimizeDeps: {
		include: ['chart.js', 'd3']
	},
	build: {
		target: 'esnext',
		rollupOptions: {
			output: {
				manualChunks: {
					'chart-js': ['chart.js', 'chartjs-adapter-date-fns'],
					'd3-viz': ['d3']
				}
			}
		}
	}
});
