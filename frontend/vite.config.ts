import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const backend = process.env.BACKEND_URL ?? 'http://127.0.0.1:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: backend, ws: true },
      '/healthz': backend,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    css: false,
  },
});
