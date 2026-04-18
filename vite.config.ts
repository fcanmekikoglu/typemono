import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  server: { port: 3000 },
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'images/ios/16.png',
        'images/ios/32.png',
        'images/ios/152.png',
        'images/ios/167.png',
        'images/ios/180.png',
      ],
      devOptions: { enabled: false },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg,ico}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
      manifest: {
        name: 'Typemono',
        short_name: 'Typemono',
        description: 'Minimalist, monochrome PWA markdown editor',
        theme_color: '#0a1418',
        background_color: '#0a1418',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/images/android/launchericon-48x48.png', sizes: '48x48', type: 'image/png' },
          { src: '/images/android/launchericon-72x72.png', sizes: '72x72', type: 'image/png' },
          { src: '/images/android/launchericon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/images/android/launchericon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/images/android/launchericon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/images/android/launchericon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/images/android/launchericon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
