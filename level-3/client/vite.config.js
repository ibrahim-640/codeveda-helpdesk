import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // The browser calls /api/..., Vite forwards it to Express without "/api"
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})