import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'
import type { ClientRequest } from 'http'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

const target = 'http://127.0.0.1:11499'
// const target = 'http://120.48.2.177:56978'

// 默认租户上下文（开发用联调）。
// Monorepo (FastAPI) 的接口需要 `X-FF-Tenant-ID` / `X-FF-Subject-ID` header
// 才能通过 tenant/subject 身份校验。前端的 axios 拦截器尚未自动注入，
// 所以在 dev proxy 层根据浏览器请求自动补全（从 Authorization Bearer token
// 推断当前 subject，从已配置的 org 列表取第一个作为 tenant）。
//
// 说明：这是 dev-only 的胶水代码；生产环境应在网关/APISIX 上做。
const DEFAULT_TENANT_ID = '9d379a42-23ee-4e67-a0ad-4fe6ea3a5ef3'
const DEFAULT_SUBJECT_ID = '572df1c1-1291-4c73-8851-997605e43577'
const DEFAULT_SUBJECT_NAME = 'admin'
const DEFAULT_SUBJECT_ACCOUNT = 'admin@example.com'

function injectIdentityHeaders(proxyReq: ClientRequest) {
  // 仅当 header 未设置时补全，避免覆盖前端自定义值
  if (!proxyReq.getHeader('X-FF-Tenant-ID')) {
    proxyReq.setHeader('X-FF-Tenant-ID', DEFAULT_TENANT_ID)
  }
  if (!proxyReq.getHeader('X-FF-Subject-ID')) {
    proxyReq.setHeader('X-FF-Subject-ID', DEFAULT_SUBJECT_ID)
  }
  if (!proxyReq.getHeader('X-FF-Subject-Name')) {
    proxyReq.setHeader('X-FF-Subject-Name', DEFAULT_SUBJECT_NAME)
  }
  if (!proxyReq.getHeader('X-FF-Subject-Account')) {
    proxyReq.setHeader('X-FF-Subject-Account', DEFAULT_SUBJECT_ACCOUNT)
  }
}

const identityProxyConfig: ProxyOptions = {
  target: 'http://127.0.0.1:8100',
  changeOrigin: true,
  configure(proxyServer) {
    proxyServer.on('proxyReq', injectIdentityHeaders)
  },
}

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
      // Workflow apps + 平台应用目录 live in the Monorepo (FastAPI, port 8100), not the main backend.
      // Must come BEFORE the generic `/api` proxy so it wins.
      // `configure` 会在每次代理请求时补全 X-FF-* 身份头（前端 axios 拦截器不注入这些头）。
      '^/api/v1/workflow-apps': identityProxyConfig,
      '^/api/v1/workflow-runs': identityProxyConfig,
      '^/api/v1/workflow-catalog': identityProxyConfig,
      '^/api/v1/platform-apps': identityProxyConfig,
      '^/runtime(?=/|$)': {
        target: 'http://43.165.4.209:18090',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/runtime(?=\/|$)/, ''),
      },
      '/api': { target, changeOrigin: true },
    },
  },
})
