import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',      // listen on all interfaces, not just localhost
    port: 5173,
    watch: {
      usePolling: true,    // fallback for Docker volume mounts on Windows/macOS
    },
    proxy: {
      '/api': 'http://backend:8080',
      '/uploads': 'http://backend:8080',
    }
  },
})