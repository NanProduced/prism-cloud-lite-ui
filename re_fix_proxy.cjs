const fs = require('fs');
const path = require('path');

const consoleSrc = 'C:\\Users\\nanpr\\javaProject\\prism-cloud-console\\src';
const consoleRoot = 'C:\\Users\\nanpr\\javaProject\\prism-cloud-console';

// 1. Rewrite vite.config.ts with 127.0.0.1
const viteConfig = `
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      "/auth": {
        target: "http://127.0.0.1:8082",
        changeOrigin: true,
        secure: false
      },
      "/oauth2": {
        target: "http://127.0.0.1:8082",
        changeOrigin: true,
        secure: false
      },
      "/api": {
        target: "http://127.0.0.1:8082",
        changeOrigin: true,
        secure: false
      }
    }
  }
})
`;
fs.writeFileSync(path.join(consoleRoot, 'vite.config.ts'), viteConfig.trim(), 'utf8');

// 2. Add a fallback route to App.tsx
const appTsx = `
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import UserManagement from "./pages/UserManagement";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin-login" element={<Login />} />
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="settings" element={<div className="p-8">Settings (TODO)</div>} />
          <Route path="logs" element={<div className="p-8">Audit Logs (TODO)</div>} />
        </Route>
        <Route path="*" element={
          <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 text-white p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">404 - Proxy or Route Error</h1>
            <p className="text-zinc-400 mb-6">Current URL: {window.location.pathname}</p>
            <p className="text-sm text-red-500 max-w-md">
              If you see this on an /oauth2 path, it means your Vite Proxy is NOT working. 
              Please ensure backend is on 8082 and restart Vite.
            </p>
            <a href="/" className="mt-6 text-blue-500 underline">Back to Home</a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
`;
fs.writeFileSync(path.join(consoleSrc, 'App.tsx'), appTsx.trim(), 'utf8');

console.log('Fixed Proxy Target and added Fallback Route.');
