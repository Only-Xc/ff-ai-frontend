import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// const target = 'http://127.0.0.1:8000'
const target = 'http://120.48.2.177:56978'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@pages': fileURLToPath(new URL('./pages', import.meta.url)),
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  build: {
    rollupOptions: {
      input: {
        iframe: fileURLToPath(new URL('./pages/iframe.html', import.meta.url)),
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
      },
    },
  },
  server: {
    proxy: {
      '/api/chat/ws': {
        target: target.replace(/^http/, 'ws'),
        ws: true,
        changeOrigin: true,
        bypass: (req) =>
          req.headers.upgrade === 'websocket' ? undefined : req.url,
      },
      '/api/exam': {
        target: 'http://127.0.0.1:8013',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/exam/, '/api/v1'),
      },
      '^/runtime(?=/|$)': {
        target: 'http://43.165.4.209:18090',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/runtime(?=\/|$)/, ''),
      },
      '/api': { target, changeOrigin: true },
    },
  },
})
