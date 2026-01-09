import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    {
      name: 'redirect-root',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/') {
            req.url = '/landing.html'
          }
          next()
        })
      },
    },
    react(),
  ],
  build: {
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'landing.html'),
        app: resolve(__dirname, 'index.html'),
      },
    },
  },
})