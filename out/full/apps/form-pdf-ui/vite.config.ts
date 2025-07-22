import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vite.dev/config/
export default function ({ mode }) {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	return defineConfig({
		base: '/',
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
			},
			external: ['@editorjs/editorjs/types/tools/inline-tool'],
		},
		server: {
			port: process.env.VITE_PORT! || 3000,
		},
	});
}
