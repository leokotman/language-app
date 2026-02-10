import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(() => {
  // PWA: minify and workbox mode kept false/'development' until workbox-build/terser
  // "Unexpected early exit" is fixed. Then use mode: defineConfig(({ mode }) => ...) and set
  // minify: mode === 'production', workbox.mode: mode === 'production' ? 'production' : 'development'
  const pwaMinify = false
  const pwaWorkboxMode = 'development' as const
  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      minify: pwaMinify,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        mode: pwaWorkboxMode,
      },
      manifest: {
        name: 'Language Learning App',
        short_name: 'LangApp',
        theme_color: '#1976d2',
        icons: [
          {
            src: '/vite.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  }
})
