import { useCallback, useRef, useState } from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  conversationKeys,
  conversations_delete,
  conversations_list,
  splitSessionKey,
} from '@/api/chat'

import type { ChatSummary } from '@/pages/chat/types'
import type { AgentClient } from '@/pages/chat/hooks/agentClient'

export interface AgentSessionsState {
  // 侧边栏展示用的会话列表。
  sessions: ChatSummary[]
  loading: boolean
  streamingChatIdSet: ReadonlySet<string>
}

export interface AgentSessionsActions {
  refresh: () => Promise<unknown>
  createChat: () => Promise<string>
  deleteChat: (key: string) => Promise<void>
  setSessionStreaming: (chatId: string, isStreaming: boolean) => void
}

export function useAgentSessions(client: AgentClient): {
  state: AgentSessionsState
  actions: AgentSessionsActions
} {
  const queryClient = useQueryClient()
  const [streamingChatIdSet, setStreamingChatIdSet] = useState<Set<string>>(
    () => new Set(),
  )
  const streamingChatIdSetRef = useRef(streamingChatIdSet)

  // 会话列表来自 HTTP；运行态单独维护，避免列表刷新覆盖本地 streaming 状态。
  const {
    data: sessions = [],
    isLoading: loading,
    refetch: refresh,
  } = useQuery<ChatSummary[]>({
    queryKey: conversationKeys.list(),
    queryFn: () => conversations_list(),
    placeholderData: keepPreviousData,
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
      queryClient.setQueryData<ChatSummary[]>(
        conversationKeys.list(),
        (current) => [
          session,
          ...(current ?? []).filter((item) => item.key !== session.key),
        ],
      )
    },
  })

  const deleteChatMutation = useMutation({
    mutationFn: conversations_delete,
    onSuccess: (_deleted, key) => {
      const deletedChatId = splitSessionKey(key).chatId

      if (deletedChatId) {
        setSessionStreaming(deletedChatId, false)
      }

      // 删除成功后同步裁掉本地缓存里的会话行。
      queryClient.setQueryData<ChatSummary[]>(
        conversationKeys.list(),
        (current) => (current ?? []).filter((session) => session.key !== key),
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

  const setSessionStreaming = useCallback(
    (chatId: string, isStreaming: boolean) => {
      setStreamingChatIdSet(() => {
        const current = streamingChatIdSetRef.current
        const currentIsStreaming = current.has(chatId)

        if (currentIsStreaming === isStreaming) {
          return current
        }

        const next = new Set(current)

        if (isStreaming) {
          next.add(chatId)
        } else {
          next.delete(chatId)
        }

        streamingChatIdSetRef.current = next

        return next
      })
    },
    [],
  )

  return {
    state: {
      sessions,
      loading,
      streamingChatIdSet,
    },
    actions: {
      refresh,
      createChat,
      deleteChat,
      setSessionStreaming,
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
