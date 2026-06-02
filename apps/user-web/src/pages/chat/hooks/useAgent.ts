import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { BubbleItemType } from '@ant-design/x'

import type {
  ChatSummary,
  TaskConfirmationViewState,
  UIMessage,
} from '@/pages/chat/types'
import { useAgentConversation } from '@/pages/chat/hooks/useAgentConversation'
import { useAgentSender } from '@/pages/chat/hooks/useAgentSender'
import type {
  AgentSubmitPayload,
  UseAgentSenderResult,
} from '@/pages/chat/hooks/useAgentSender'
import type { AgentClientValue } from '@/pages/chat/hooks/agentClient'
import { useAgentSessions } from '@/pages/chat/hooks/useAgentSessions'

interface AgentSenderState {
  attachments: UseAgentSenderResult['attachments']
  loading: boolean
  value: string
  onChange: (value: string) => void
  onSubmit: (message: string) => void
  onCancel: () => void
}

export interface AgentTaskConfirmationView extends TaskConfirmationViewState {
  onConfirm: () => void
  onOpenModal: () => void
  onCloseModal: () => void
}

// 提供给页面组件直接消费的对话视图模型。
export interface AgentConversationState {
  loading: boolean
  messages: UIMessage[]
  bubbleItems: BubbleItemType[]
  sender: AgentSenderState
  taskConfirmation: AgentTaskConfirmationView
}

export interface AgentSessionsView {
  items: ChatSummary[]
  loading: boolean
  streamingChatIdSet: ReadonlySet<string>
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
    (!message.kind || message.kind === 'message') &&
    !message.id.startsWith('hist-')
  )
}

function toBubbleItem(message: UIMessage): BubbleItemType {
  return {
    key: message.id,
    role:
      message.kind === 'task-created'
        ? 'taskCreated'
        : message.role === 'user'
          ? 'user'
          : 'ai',
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
    state: { loading: sessionsLoading, sessions, streamingChatIdSet },
    actions: { createChat, deleteChat, refresh, setSessionStreaming },
  } = useAgentSessions(agentClient.client)

  // undefined：默认跟随列表第一项
  // null：明确进入“新建对话草稿态”
  const [selectedKey, setSelectedKey] = useState<string | null | undefined>()
  const activeKey =
    selectedKey === undefined ? (sessions[0]?.key ?? null) : selectedKey

  // 先解出当前激活的会话对象，后续页面状态都从它派生。
  const activeSession = useMemo<ChatSummary | null>(() => {
    if (!activeKey) return null

    return sessions.find((session) => session.key === activeKey) ?? null
  }, [activeKey, sessions])

  const conversationId = activeSession?.key ?? null

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

  // 草稿态首条消息会在新会话创建后立即发送，期间跳过空历史加载。
  const [creatingChat, setCreatingChat] = useState(false)
  const pendingFirstRef = useRef<AgentSubmitPayload | null>(null)

  // 当前会话的历史加载和 websocket 实时事件都由 conversation hook 承接。
  const {
    actions: {
      closeTaskConfirmationModal,
      confirmTask,
      openTaskConfirmationModal,
      send,
      stop,
    },
    state: {
      isStreaming,
      loading: detailLoading,
      messages: detailMessages,
      taskConfirmation,
    },
  } = useAgentConversation({
    client: agentClient.client,
    conversationId,
    streamingChatIdSet,
    skipInitialHistoryLoadRef: pendingFirstRef,
    onSessionUpdated: handleSessionUpdated,
    onSessionStreamingChange: setSessionStreaming,
  })

  const bubbleItems = useMemo<BubbleItemType[]>(
    () => detailMessages.map((message) => toBubbleItem(message)),
    [detailMessages],
  )
  useEffect(() => {
    if (!activeSession) return

    const pending = pendingFirstRef.current

    if (!pending) return

    pendingFirstRef.current = null

    const options = pending.attachmentIds?.length
      ? { attachmentIds: pending.attachmentIds }
      : undefined

    send(pending.content, options)
    setCreatingChat(false)
  }, [activeSession, send])

  const submitMessage = useCallback(
    async (payload: AgentSubmitPayload) => {
      const options = payload.attachmentIds?.length
        ? { attachmentIds: payload.attachmentIds }
        : undefined

      if (activeSession) {
        send(payload.content, options)
        return
      }

      if (creatingChat) return

      setCreatingChat(true)
      pendingFirstRef.current = payload

      try {
        const createdChatId = await createActiveChat()

        if (!createdChatId) {
          pendingFirstRef.current = null
          setCreatingChat(false)
        }
      } catch {
        pendingFirstRef.current = null
        setCreatingChat(false)
      }
    },
    [activeSession, creatingChat, createActiveChat, send],
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
      taskConfirmation: {
        ...taskConfirmation,
        onConfirm: confirmTask,
        onOpenModal: openTaskConfirmationModal,
        onCloseModal: closeTaskConfirmationModal,
      },
      sender: {
        attachments: agentSender.attachments,
        loading: senderLoading,
        value: agentSender.inputValue,
        onChange: agentSender.setInputValue,
        onSubmit: agentSender.submitWithAttachments,
        onCancel: agentSender.cancel,
      },
    }),
    [
      agentSender.cancel,
      agentSender.attachments,
      agentSender.inputValue,
      agentSender.setInputValue,
      agentSender.submitWithAttachments,
      bubbleItems,
      closeTaskConfirmationModal,
      confirmTask,
      detailLoading,
      detailMessages,
      openTaskConfirmationModal,
      senderLoading,
      taskConfirmation,
    ],
  )

  return {
    sessions: {
      items: sessions,
      loading: sessionsLoading,
      streamingChatIdSet,
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
