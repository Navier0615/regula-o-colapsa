/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/regula-o-colapsa/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // El service worker se actualiza solo al publicar una versión nueva.
      registerType: 'autoUpdate',
      // workbox.globPatterns ya precarga public/ (favicon e íconos). Agregarlos también con
      // includeAssets o desde el manifiesto los duplica en la precaché con revisiones
      // distintas, y Workbox rechaza la instalación del service worker.
      includeManifestIcons: false,
      manifest: {
        id: '/regula-o-colapsa/',
        name: 'Regula o Colapsa',
        short_name: 'Regula o Colapsa',
        description: 'Juego educativo de homeostasis para Teoría General de Sistemas',
        lang: 'es',
        dir: 'ltr',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        // Coherentes con base: la app instalada abre y navega dentro de /regula-o-colapsa/.
        start_url: '/regula-o-colapsa/',
        scope: '/regula-o-colapsa/',
        categories: ['education', 'games'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precarga todo el build (incluida la gráfica, que se carga bajo demanda) para
        // jugar sin conexión después de la primera visita. Con HashRouter solo existe
        // index.html como documento; cualquier navegación sin red cae en él.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
  },
})
