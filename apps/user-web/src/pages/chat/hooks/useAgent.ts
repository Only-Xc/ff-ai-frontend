import { useCallback, useMemo, useState } from 'react'

import type { BubbleItemType } from '@ant-design/x'

import type { ChatSummary, UIMessage } from '@/api/types'
import { useAgentConversation } from '@/pages/chat/hooks/useAgentConversation'
import { useAgentSender } from '@/pages/chat/hooks/useAgentSender'
import type {
  AgentClientValue,
  StreamError,
} from '@/pages/chat/hooks/agentClient'
import { useAgentSessions } from '@/pages/chat/hooks/useAgentSessions'

interface AgentSenderState {
  loading: boolean
  value: string
  onChange: (value: string) => void
  onSubmit: (content: string) => void
  onCancel: () => void
}

// 提供给页面组件直接消费的对话视图模型。
export interface AgentConversationState {
  loading: boolean
  messages: UIMessage[]
  bubbleItems: BubbleItemType[]
  streamError: StreamError | null
  dismissStreamError: () => void
  sender: AgentSenderState
}

export interface AgentSessionsView {
  items: ChatSummary[]
  loading: boolean
  activeKey: string | null
}

export interface AgentActions {
  selectSession: (key: string) => void
  startNewChat: () => void
  deleteSession: (key: string) => void
}

// 只有完整结束的 assistant 回复才使用打字机效果。
function canUseTypingEffect(message: UIMessage): boolean {
  return (
    message.role === 'assistant' &&
    !message.isStreaming &&
    message.kind !== 'trace' &&
    !message.id.startsWith('hist-')
  )
}

function toBubbleItem(message: UIMessage): BubbleItemType {
  return {
    key: message.id,
    role: message.role === 'user' ? 'user' : 'ai',
    content:
      message.kind === 'trace'
        ? (message.traces ?? [message.content]).join('\n')
        : message.content,
    loading: !!message.isStreaming,
    streaming: !!message.isStreaming,
    typing: canUseTypingEffect(message)
      ? { effect: 'typing', step: 4, interval: 24 }
      : false,
  }
}

export function useAgent(agentClient: AgentClientValue) {
  // 会话列表相关逻辑固定收敛在 sessions hook 内部。
  const {
    state: { loading: sessionsLoading, sessions },
    actions: { createChat, deleteChat, refresh },
  } = useAgentSessions(agentClient.client)

  // undefined：默认跟随列表第一项
  // null：明确进入“新建对话草稿态”
  const [selectedKey, setSelectedKey] = useState<string | null | undefined>()
  const activeKey = selectedKey === undefined ? (sessions[0]?.key ?? null) : selectedKey

  // 先解出当前激活的会话对象，后续页面状态都从它派生。
  const activeSession = useMemo<ChatSummary | null>(() => {
    if (!activeKey) return null

    return sessions.find((session) => session.key === activeKey) ?? null
  }, [activeKey, sessions])

  const sessionKey = activeSession?.key ?? null

  const selectSession = useCallback((key: string) => {
    setSelectedKey(key)
  }, [])

  const startNewChat = useCallback(() => {
    setSelectedKey(null)
  }, [])

  // 草稿态发送前要先创建真正的 chat，再把页面切过去。
  const createActiveChat = useCallback(async (): Promise<string | null> => {
    try {
      const createdChatId = await createChat()

      setSelectedKey(`websocket:${createdChatId}`)

      return createdChatId
    } catch {
      return null
    }
  }, [createChat])

  const deleteSession = useCallback(
    (key: string) => {
      const activeIndex = sessions.findIndex((session) => session.key === key)
      // 删除当前激活会话时，先把焦点挪到相邻会话，避免页面悬空。
      const fallbackKey =
        activeKey === key
          ? (sessions[activeIndex + 1]?.key ??
            sessions[activeIndex - 1]?.key ??
            null)
          : activeKey

      if (activeKey === key && selectedKey !== undefined) {
        setSelectedKey(fallbackKey)
      }

      void deleteChat(key).catch(() => {
        if (activeKey === key && selectedKey !== undefined) {
          setSelectedKey(key)
        }
      })
    },
    [activeKey, deleteChat, selectedKey, sessions],
  )

  const handleSessionUpdated = useCallback(() => {
    void refresh()
  }, [refresh])

  // 当前会话的历史加载和 websocket 实时事件都由 conversation hook 承接。
  const {
    actions: {
      dismissStreamError,
      send,
      sendToChat,
      stop,
    },
    state: {
      isStreaming,
      loading: detailLoading,
      messages: detailMessages,
      streamingByChatId,
      streamError,
    },
  } = useAgentConversation({
    client: agentClient.client,
    key: sessionKey,
    onSessionUpdated: handleSessionUpdated,
  })

  const bubbleItems = useMemo<BubbleItemType[]>(
    () => detailMessages.map((message) => toBubbleItem(message)),
    [detailMessages],
  )
  const sessionItems = useMemo<ChatSummary[]>(
    () =>
      sessions.map((session) => ({
        ...session,
        isStreaming: streamingByChatId[session.chatId] ?? false,
      })),
    [sessions, streamingByChatId],
  )

  // “正在创建会话”和“正在流式回复”是两类不同的阻塞状态：
  // 前者解决草稿态重复点发送，后者解决一轮消息未结束前再次提交。
  const [creatingChat, setCreatingChat] = useState(false)
  const submitMessage = useCallback(
    async (content: string) => {
      if (activeSession) {
        send(content)
        return
      }

      if (creatingChat) return

      setCreatingChat(true)

      try {
        const createdChatId = await createActiveChat()

        if (createdChatId) {
          sendToChat(createdChatId, content)
        }
      } finally {
        setCreatingChat(false)
      }
    },
    [activeSession, creatingChat, createActiveChat, send, sendToChat],
  )
  const senderDisabled = detailLoading || isStreaming || creatingChat
  const senderLoading = isStreaming || creatingChat

  const agentSender = useAgentSender({
    disabled: senderDisabled,
    submit: submitMessage,
    cancel: stop,
  })

  // 把底层多个 hook 的结果整理成页面组件直接可用的聚合对象。
  const conversation = useMemo<AgentConversationState>(
    () => ({
      loading: detailLoading,
      messages: detailMessages,
      bubbleItems,
      streamError,
      dismissStreamError,
      sender: {
        loading: senderLoading,
        value: agentSender.inputValue,
        onChange: agentSender.setInputValue,
        onSubmit: agentSender.submit,
        onCancel: agentSender.cancel,
      },
    }),
    [
      agentSender.cancel,
      agentSender.inputValue,
      agentSender.setInputValue,
      agentSender.submit,
      bubbleItems,
      detailLoading,
      detailMessages,
      dismissStreamError,
      senderLoading,
      streamError,
    ],
  )

  return {
    sessions: {
      items: sessionItems,
      loading: sessionsLoading,
      activeKey,
    } satisfies AgentSessionsView,
    conversation,
    actions: {
      selectSession,
      startNewChat,
      deleteSession,
    } satisfies AgentActions,
  }
}
