import { createRequest, path } from '../client.js'
import type { TaskType } from '../tenant/agent-ticket.js'

export interface SessionRow {
  key: string
  created_at: string | null
  updated_at: string | null
  title?: string
  preview?: string
}

export interface ConversationSessionsResponse {
  sessions: SessionRow[]
}

export interface ChatSummary {
  key: string
  channel: string
  chatId: string
  createdAt: string | null
  updatedAt: string | null
  title?: string
  preview: string
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
    task_type: TaskType
    markdown: string
  } | null
}

export interface ConversationDeleteResponse {
  deleted: boolean
}

export type PendingTask =
  PendingTaskConfirmation['pending_task_confirmation']

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

function toChatSummary(row: SessionRow): ChatSummary {
  return {
    key: row.key,
    ...splitSessionKey(row.key),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    title: row.title ?? '',
    preview: row.preview ?? '',
  }
}

export const listConversationsRequest = () =>
  createRequest<ChatSummary[]>(
    'GET',
    '/api/conversations',
    undefined,
    (response: ConversationSessionsResponse) =>
      response.sessions.map(toChatSummary),
  )

export const createConversationRequest = (data: CreateSessionData) =>
  createRequest<unknown>('POST', '/api/conversations', { data })

export const getConversationDetailRequest = (conversationId: string) =>
  createRequest<SessionDetail>('GET', path`/api/conversations/${conversationId}`)

export const getConversationMessagesRequest = (conversationId: string) =>
  createRequest<SessionMessages>(
    'GET',
    path`/api/conversations/${conversationId}/messages`,
  )

export const deleteConversationRequest = (conversationId: string) =>
  createRequest<boolean>(
    'DELETE',
    path`/api/conversations/${conversationId}`,
    undefined,
    (response: ConversationDeleteResponse) => response.deleted,
  )

export const getConversationPendingTaskRequest = (conversationId: string) =>
  createRequest<PendingTask>(
    'GET',
    path`/api/conversations/${conversationId}/pending-task-confirmation`,
    undefined,
    (response: PendingTaskConfirmation) => response.pending_task_confirmation,
  )
