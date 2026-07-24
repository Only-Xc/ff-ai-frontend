import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'
import type { ClientRequest, IncomingMessage } from 'node:http'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

const target = 'http://127.0.0.1:11499'
// const target = 'http://120.48.2.177:56978'

// ---------------------------------------------------------------------------
// Dev-only 动态租户解析
// ---------------------------------------------------------------------------
// Monorepo (FastAPI) 的接口需要 X-FF-Tenant-ID / X-FF-Subject-ID header。
// 以下代码从请求的 JWT token 动态解析用户身份和主组织，支持多账号切换。
// 生产环境由 APISIX 网关处理，此代码仅在 dev server 生效。

interface IdentityInfo {
  tenantId: string
  subjectId: string
  subjectName: string
  subjectAccount: string
}

// 缓存：JWT token -> 身份信息（避免每次请求都查后端）
const identityCache = new Map<string, IdentityInfo>()

// Fallback（后端不可达时使用）
const FALLBACK_IDENTITY: IdentityInfo = {
  tenantId: '0a3786a3-e307-4243-8ff1-db9fecf456ba',
  subjectId: 'e4fe8044-78d3-49a5-baf2-92c35147ca51',
  subjectName: 'admin',
  subjectAccount: 'admin@example.com',
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  } catch {
    return null
  }
}

async function resolveIdentity(token: string): Promise<IdentityInfo> {
  if (identityCache.has(token)) return identityCache.get(token)!
  try {
    const resp = await fetch(`${target}/api/v1/rbac/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = (await resp.json()) as {
      user_id?: string
      full_name?: string
      email?: string
      organizations?: Array<{ id: string; is_primary?: boolean }>
    }
    const org =
      data.organizations?.find((o) => o.is_primary) ??
      data.organizations?.[0]
    const info: IdentityInfo = {
      tenantId: org?.id ?? FALLBACK_IDENTITY.tenantId,
      subjectId: data.user_id ?? FALLBACK_IDENTITY.subjectId,
      subjectName: data.full_name || data.email?.split('@')[0] || 'user',
      subjectAccount: data.email ?? FALLBACK_IDENTITY.subjectAccount,
    }
    identityCache.set(token, info)
    return info
  } catch {
    // 后端不可达时从 JWT sub 字段兜底
    const payload = decodeJwtPayload(token)
    return {
      ...FALLBACK_IDENTITY,
      subjectId: (payload?.sub as string) ?? FALLBACK_IDENTITY.subjectId,
    }
  }
}

function injectIdentityHeaders(proxyReq: ClientRequest, req: IncomingMessage) {
  const authHeader = req.headers.authorization
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const cached = identityCache.get(token)
    if (cached) {
      if (!proxyReq.getHeader('X-FF-Tenant-ID'))
        proxyReq.setHeader('X-FF-Tenant-ID', cached.tenantId)
      if (!proxyReq.getHeader('X-FF-Subject-ID'))
        proxyReq.setHeader('X-FF-Subject-ID', cached.subjectId)
      if (!proxyReq.getHeader('X-FF-Subject-Name'))
        proxyReq.setHeader('X-FF-Subject-Name', cached.subjectName)
      if (!proxyReq.getHeader('X-FF-Subject-Account'))
        proxyReq.setHeader('X-FF-Subject-Account', cached.subjectAccount)
      return
    }
    // 缓存未命中：异步解析（下次请求生效），本次用 fallback
    void resolveIdentity(token)
  }
  if (!proxyReq.getHeader('X-FF-Tenant-ID'))
    proxyReq.setHeader('X-FF-Tenant-ID', FALLBACK_IDENTITY.tenantId)
  if (!proxyReq.getHeader('X-FF-Subject-ID'))
    proxyReq.setHeader('X-FF-Subject-ID', FALLBACK_IDENTITY.subjectId)
  if (!proxyReq.getHeader('X-FF-Subject-Name'))
    proxyReq.setHeader('X-FF-Subject-Name', FALLBACK_IDENTITY.subjectName)
  if (!proxyReq.getHeader('X-FF-Subject-Account'))
    proxyReq.setHeader('X-FF-Subject-Account', FALLBACK_IDENTITY.subjectAccount)
}

const identityProxyConfig: ProxyOptions = {
  target: 'http://localhost:8100',
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
      '^/api/v1/workflow-catalog': identityProxyConfig,
      '^/api/v1/platform-apps': identityProxyConfig,
      '^/api/v1/flowise': identityProxyConfig,
      '^/runtime(?=/|$)': {
        target: 'http://43.165.4.209:18090',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/runtime(?=\/|$)/, ''),
      },
      '/api': { target, changeOrigin: true },
    },
  },
})
