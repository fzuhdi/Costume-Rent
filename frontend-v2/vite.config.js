import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const devPort = Number(process.env.VITE_DEV_PORT || process.env.PORT || 5174);

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: devPort,
    strictPort: true,
  },
});
