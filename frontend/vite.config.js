import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const devPort = Number(process.env.VITE_DEV_PORT || process.env.PORT || 5173);
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://backend:8080';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: devPort,
    watch: { usePolling: true },
    proxy: {
      '/api': proxyTarget,
      '/uploads': proxyTarget,
    }
  },
});
