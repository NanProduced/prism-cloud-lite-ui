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
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        xfwd: true,
      },
      // OAuth2 endpoints
      '/oauth2': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        xfwd: true,
      },
      // Gateway Service logout
      '/logout': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
        xfwd: true,
      },
      // Business API
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: false,
        secure: false,
        xfwd: true,
      },
    },
  },
})
