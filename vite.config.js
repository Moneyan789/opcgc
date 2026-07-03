import { defineConfig } from 'vite';
export default defineConfig({
  root: '.',
  server: {
    port: 8083,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true }
    }
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096
  }
});
