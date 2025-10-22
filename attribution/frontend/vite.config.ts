import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5173,
		host: true,
		proxy: {
			'/api': {
				target: 'http://localhost:8080',
				changeOrigin: true
			},
			'/analytics': {
				target: 'http://localhost:8091',
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
