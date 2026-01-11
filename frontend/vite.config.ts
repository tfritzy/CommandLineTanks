import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rewrite-middleware',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/deploy' || req.url?.startsWith('/game/')) {
            req.url = '/app.html';
          }
          next();
        });
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html'),
      },
    },
  },
})