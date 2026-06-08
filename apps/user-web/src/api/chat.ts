import { requestClient } from '@/utils/request'

import type { ChatSummary } from '@/pages/chat/types'
import { useAuthStore } from '@/store/useAuth'

interface SessionRow {
  key: string
  created_at: string | null
  updated_at: string | null
  title?: string
  preview?: string
}

export interface CreateSessionData {
  project_id?: string
  title: string
}

export interface SessionDetail {
  key: string
  created_at: string | null
  updated_at: string | null
}

export interface SessionMediaUrl {
  url: string
  name?: string
}

export interface SessionMessageItem {
  bubble_id: string
  role: string // 角色
  content: string // 内容
  metadata?: unknown
  kind?: string | null
  timestamp?: string // 时间
  tool_calls?: unknown
  tool_call_id?: string | null
  name?: string | null
  reply_to?: string | null
  media?: string[] | null
  media_urls?: SessionMediaUrl[] | null
}

export interface SessionMessages {
  key: string
  created_at: string | null
  updated_at: string | null
  messages: SessionMessageItem[]
}

export interface PendingTaskConfirmation {
  conversation_id: string
  chat_id: string
  pending_task_confirmation: {
    confirmation_id: string
    title: string
    task_type: 'process' | 'container' | 'direct_result'
    markdown: string
  } | null
}

export const conversationKeys = {
  all: ['conversations'] as const,
  list: () => [...conversationKeys.all, 'list'] as const,
  detail: (conversationId: string | null | undefined) =>
    [...conversationKeys.all, 'detail', conversationId] as const,
  messages: (conversationId: string | null | undefined) =>
    [...conversationKeys.all, 'messages', conversationId] as const,
}

export function splitSessionKey(key: string | null): {
  channel: string
  chatId: string
} {
  if (!key) {
    return { channel: '', chatId: '' }
  }

  const index = key.indexOf(':')

  if (index === -1) {
    return { channel: '', chatId: key }
  }

  return {
    channel: key.slice(0, index),
    chatId: key.slice(index + 1),
  }
}

export function conversations_list(): Promise<ChatSummary[]> {
  return requestClient<{ sessions: SessionRow[] }>({
    url: '/api/conversations',
    method: 'GET',
  }).then((data) =>
    data.sessions.map(
      (row): ChatSummary => ({
        key: row.key,
        ...splitSessionKey(row.key),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        title: row.title ?? '',
        preview: row.preview ?? '',
      }),
    ),
  )
}

export function conversations_create(data: CreateSessionData) {
  return requestClient({
    url: '/api/conversations',
    method: 'POST',
    data,
  })
}

export function conversations_detail(
  conversationId: string,
): Promise<SessionDetail> {
  return requestClient({
    url: `/api/conversations/${conversationId}`,
    method: 'GET',
  })
}

export function conversations_message(
  conversationId: string,
): Promise<SessionMessages> {
  return requestClient({
    url: `/api/conversations/${conversationId}/messages`,
    method: 'GET',
  })
}

export function conversations_delete(conversationId: string): Promise<boolean> {
  return requestClient<{ deleted: boolean }>({
    url: `/api/conversations/${conversationId}`,
    method: 'DELETE',
  }).then((res) => res.deleted)
}

export function conversations_pending_task(
  conversationId: string,
): Promise<PendingTaskConfirmation['pending_task_confirmation']> {
  return requestClient<PendingTaskConfirmation>({
    url: `/api/conversations/${conversationId}/pending-task-confirmation`,
    method: 'GET',
  }).then((res) => res.pending_task_confirmation)
}

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
