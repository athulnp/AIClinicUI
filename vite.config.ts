import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'https://localhost:5001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      // In production, use the API base URL from environment variable
      // The actual API URL should be set in .env.production
      // The client code will use import.meta.env.VITE_API_BASE_URL
    },
  }
})
