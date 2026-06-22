import {
  createConversationRequest,
  deleteConversationRequest,
  getConversationDetailRequest,
  getConversationMessagesRequest,
  getConversationPendingTaskRequest,
  listConversationsRequest,
} from '@ff-ai-frontend/api'

import { useAuthStore } from '@/store/useAuth'

import { request } from './_request'

export { splitSessionKey } from '@ff-ai-frontend/api'

export type {
  ChatSummary,
  ConversationDeleteResponse,
  ConversationSessionsResponse,
  CreateSessionData,
  PendingTaskConfirmation,
  SessionDetail,
  SessionMediaUrl,
  SessionMessageItem,
  SessionMessages,
  SessionRow,
} from '@ff-ai-frontend/api'

export const conversationKeys = {
  all: ['conversations'] as const,
  list: () => [...conversationKeys.all, 'list'] as const,
  detail: (conversationId: string | null | undefined) =>
    [...conversationKeys.all, 'detail', conversationId] as const,
  messages: (conversationId: string | null | undefined) =>
    [...conversationKeys.all, 'messages', conversationId] as const,
}

export const conversations_list = request(listConversationsRequest)
export const conversations_create = request(createConversationRequest)
export const conversations_delete = request(deleteConversationRequest)
export const conversations_detail = request(getConversationDetailRequest)
export const conversations_message = request(getConversationMessagesRequest)
export const conversations_pending_task = request(getConversationPendingTaskRequest)

export function deriveWsUrl(
  options: { chatId?: string; clientId?: string } = {},
): string {
  const url = new URL('/api/chat/ws', window.location.origin)

  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('token', useAuthStore.getState().accessToken)

  // 客户端标识；不传则服务端生成 anon-xxxx，并在 ready 中回传
  if (options.clientId) {
    url.searchParams.set('client_id', options.clientId)
  }

  // 默认会话路由键
  if (options.chatId) {
    url.searchParams.set('chat_id', options.chatId)
  }

  return url.toString()
}
