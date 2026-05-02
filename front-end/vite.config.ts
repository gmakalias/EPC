import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Port 5173 is the Vite default, matching your docker-compose ports
    port: 5173,
    host: true, // Necessary for Docker to expose the port
    proxy: {
      '/api': {
        // Use the Docker service name 'api' instead of localhost
        target: 'http://api:3000', 
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
      },
    },
  },
});