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
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
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
      '/api': { target, changeOrigin: true },
    },
  },
})
