import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@lytenyte": path.resolve(__dirname, "./@"),
    },
  },
  server: {
    proxy: {
      // Auth Service API
      '/auth': {
        target: 'http://127.0.0.1:8082',
        changeOrigin: true,
        secure: false,
      },
      // OAuth2 endpoints
      '/oauth2': {
        target: 'http://127.0.0.1:8082',
        changeOrigin: true,
        secure: false,
      },
      // Gateway Service endpoints (callback, logout)
      '/login': {
        target: 'http://127.0.0.1:8082',
        changeOrigin: true,
        secure: false,
      },
      '/logout': {
        target: 'http://127.0.0.1:8082',
        changeOrigin: true,
        secure: false,
      },
      // Business API
      '/api': {
        target: 'http://127.0.0.1:8082',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
