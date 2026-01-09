import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rewrite-landing',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/') {
            req.url = '/landing.html';
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/') {
            req.url = '/landing.html';
          }
          next();
        });
      }
    }
  ],
})
