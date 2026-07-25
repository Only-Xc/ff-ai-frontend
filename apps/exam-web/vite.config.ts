import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

const target = process.env.VITE_PLATFORM_API_BASE_URL ?? 'http://127.0.0.1:11499'

export default defineConfig({
  base: '/api/v1/plugins/exam/ui/',
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
      '/api': {
        target,
        changeOrigin: true,
      },
    },
  },
})
