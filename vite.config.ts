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
          target: 'https://aiclinicos-gyh2afgkedb7epft.southindia-01.azurewebsites.net',
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Origin', 'https://aiclinicos-gyh2afgkedb7epft.southindia-01.azurewebsites.net');
            });
          },
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})

