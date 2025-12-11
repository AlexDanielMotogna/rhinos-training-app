import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['robots.txt', 'teamtrainer-logo.svg'],
      manifest: {
        name: 'TeamTrainer',
        short_name: 'TeamTrainer',
        description: 'Team Training App - Works Offline',
        theme_color: '#ffffffff',
        background_color: '#ffffffff',
        display: 'standalone',
        icons: [
          {
            src: '/teamtrainer-logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/teamtrainer-logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        // Cache strategies
        runtimeCaching: [
          {
            // API calls (excluding SSE endpoints)
            urlPattern: ({ url }) => {
              // Match both localhost and production API URLs
              const isApiUrl = url.pathname.startsWith('/api/') &&
                !url.pathname.startsWith('/api/sse/');

              // Check if it's localhost or Railway domain
              const isValidOrigin = url.origin === 'http://localhost:5000' ||
                url.hostname.includes('railway.app');

              return isApiUrl && isValidOrigin;
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            // Images from Cloudinary
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // YouTube embeds
            urlPattern: /^https:\/\/www\.youtube\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'youtube-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
        // Maximum cache size
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      },
      devOptions: {
        enabled: true, // Enable in dev mode for testing
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
