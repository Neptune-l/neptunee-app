import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BASE = '/neptunee-app/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        id: BASE,
        name: 'Neptune 自律百宝箱',
        short_name: '自律百宝箱',
        description: '习惯打卡、任务、专注计时、记账与数据统计，完全离线的个人自律工具。',
        lang: 'zh-CN',
        start_url: BASE,
        scope: BASE,
        theme_color: '#FFF7F4',
        background_color: '#FFF7F4',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        categories: ['productivity', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        // webmanifest 也要进预缓存，否则离线安装后清单会 404
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // 单页应用：离线时任何导航都回落到 index.html
        navigateFallback: `${BASE}index.html`,
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  build: {
    target: 'es2020',
    // 数据都来自本地 IndexedDB，但图表动了 canvas，sourcemap 便于在手机上排查问题
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // React 运行时单独成块，业务代码更新时这部分的浏览器缓存不会失效
          'react-vendor': ['react', 'react-dom'],
          'idb': ['idb'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
