import { useAuthStore } from '@/store/useAuth'
import {
  authPlugin,
  createRequestClient,
  dedupePlugin,
  errorHandlerPlugin,
  normalizeRequestError,
  restfulPlugin,
} from '@ff-ai-frontend/utils'
import type { RequestConfig } from '@ff-ai-frontend/utils'
import { globalMessage } from '@/utils/message'

function shouldSkipGlobalErrorToast(config?: RequestConfig) {
  return config?.meta?.skipGlobalErrorToast === true
}

function handleRequestError(error: unknown, config?: RequestConfig) {
  const { status, message, canceled } = normalizeRequestError(error)

  if (canceled) return

  const skipToast = shouldSkipGlobalErrorToast(config)

  switch (status) {
    case 401:
      useAuthStore.getState().clearAuth()
      window.location.assign('/login')
      return

    case 403:
      globalMessage.error('无权限访问')
      return

    case 500:
    case 502:
    case 503:
    case 504:
      if (!skipToast) {
        globalMessage.error(message || '服务异常，请稍后重试')
      }
      return
    default: {
      if (!skipToast) {
        globalMessage.error(message || '请求失败，请稍后重试')
      }
    }
  }
}

export const requestClient = createRequestClient({
  plugins: [
    dedupePlugin(),
    authPlugin({
      format: (token) => `Bearer ${token}`,
      getToken: () => useAuthStore.getState().accessToken,
      headerName: 'Authorization',
    }),
    restfulPlugin(),
    errorHandlerPlugin(handleRequestError),
  ],
})

export const aiApiClient = createRequestClient({
  plugins: [
    dedupePlugin(),
    authPlugin({
      format: (token) => `Bearer ${token}`,
      getToken: () => useAuthStore.getState().accessToken,
      headerName: 'Authorization',
    }),
  ],
})

export type { RequestConfig }
