import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Auth Service: User registration, OIDC endpoints, JWK sets
      '/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/oauth2': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
      },
      // Gateway Service: OAuth2 login callback
      '/login': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
      },
      // Gateway Service: User logout
      '/logout': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
      },
      // Gateway Service: Business API (/api/v1/*)
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
