import {
  createRequestClient,
  errorHandlerPlugin,
  normalizeRequestError,
  restfulPlugin,
} from '@ff-ai-frontend/utils'

import { globalMessage } from './message'

function handleRequestError(error: unknown) {
  const { status, message, canceled } = normalizeRequestError(error)

  if (canceled) return

  if (status === 401) {
    globalMessage.error('考试插件会话已过期，请从平台应用重新打开。')
    return
  }

  if (status === 403) {
    globalMessage.error('当前账号没有访问考试插件的权限。')
    return
  }

  globalMessage.error(message || '请求失败，请稍后重试。')
}

export const requestClient = createRequestClient({
  withCredentials: true,
  plugins: [restfulPlugin(), errorHandlerPlugin(handleRequestError)],
})
