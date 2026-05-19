import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { conversations_delete, conversations_list } from '@/api/chat'

import type { ChatSummary } from '@/api/types'
import type { AgentClient } from '@/pages/chat/hooks/agentClient'

const SESSION_QUERY_KEY = ['sessions'] as const

export interface AgentSessionsState {
  // 侧边栏展示用的会话列表。
  sessions: ChatSummary[]
  loading: boolean
}

export interface AgentSessionsActions {
  refresh: () => Promise<unknown>
  createChat: () => Promise<string>
  deleteChat: (key: string) => Promise<void>
}

export function useAgentSessions(client: AgentClient): {
  state: AgentSessionsState
  actions: AgentSessionsActions
} {
  const queryClient = useQueryClient()

  // 会话列表完全走 HTTP 查询；不混入 websocket live 状态。
  const {
    data: sessions = [],
    isLoading: loading,
    refetch: refresh,
  } = useQuery<ChatSummary[]>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: conversations_list,
  })

  const createChatMutation = useMutation({
    mutationFn: async () => {
      // newChat 从 websocket 协议拿到真正的 chatId。
      const chatId = await client.newChat()

      const key = `websocket:${chatId}`
      const now = new Date().toISOString()

      return {
        key,
        channel: 'websocket',
        chatId,
        createdAt: now,
        updatedAt: now,
        title: '',
        preview: '',
      } satisfies ChatSummary
    },
    onSuccess: (session) => {
      // 立即把新会话插入列表顶部，避免用户等待下一次 refresh。
      queryClient.setQueryData<ChatSummary[]>(SESSION_QUERY_KEY, (current) => [
        session,
        ...(current ?? []).filter((item) => item.key !== session.key),
      ])
    },
  })

  const deleteChatMutation = useMutation({
    mutationFn: conversations_delete,
    onSuccess: (_deleted, key) => {
      // 删除成功后同步裁掉本地缓存里的会话行。
      queryClient.setQueryData<ChatSummary[]>(SESSION_QUERY_KEY, (current) =>
        (current ?? []).filter((session) => session.key !== key),
      )
    },
  })

  const createChat = useCallback(async (): Promise<string> => {
    const session = await createChatMutation.mutateAsync()

    return session.chatId
  }, [createChatMutation])

  const deleteChat = useCallback(
    async (key: string) => {
      await deleteChatMutation.mutateAsync(key)
    },
    [deleteChatMutation],
  )

  return {
    state: {
      sessions,
      loading,
    },
    actions: {
      refresh,
      createChat,
      deleteChat,
    },
  }
}

export function sessionTitle(session: ChatSummary): string {
  // 标题为空时退化成 chatId 短码，保证侧边栏始终有可见标签。
  const content = (session.title ?? session.preview).replace(/\s+/g, ' ').trim()

  if (!content) {
    return `会话 ${session.chatId?.slice(0, 6)}`
  }

  return content.length > 48 ? `${content.slice(0, 45)}...` : content
}
