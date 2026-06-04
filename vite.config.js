import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.png'],
      manifest: {
        name: 'WisiQR',
        short_name: 'WisiQR',
        description: 'QR Code Generator by WiSiVERSE',
        theme_color: '#E8352A',
        background_color: '#FFFFFF',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-icon.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-icon.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-icon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
