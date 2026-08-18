import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api/* to the Express server (src/server/server.ts, port 3000) during dev.
// Production deployment config is out of scope for this plan.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
