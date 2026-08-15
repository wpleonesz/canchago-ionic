/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  server: {
    port: 5173,
    strictPort: true,
    // La cookie de sesión de canchago es HttpOnly + sin CORS: este proxy hace que /api/*
    // parezca mismo origen desde el navegador, evitando el problema por completo (ver
    // spec/constitution/tech-stack.md §6 y spec/features/002-autenticacion/plan.md).
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
