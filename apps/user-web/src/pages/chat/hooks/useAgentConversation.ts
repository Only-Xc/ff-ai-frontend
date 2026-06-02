import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { splitSessionKey } from '@/api/chat'
import { toMediaAttachment } from '@/api/media'
import type { TaskConfirmationViewState, UIMessage } from '@/pages/chat/types'
import type { InboundEvent } from '@/pages/chat/hooks/agentTypes'
import type { AgentClient, SendOptions } from '@/pages/chat/hooks/agentClient'
import {
  createConversationRuntime,
  liveReducer,
  type ConversationRuntime,
} from '@/pages/chat/hooks/agentConversationRuntime'
import { useConversationHistory } from '@/pages/chat/hooks/useConversationHistory'
import type { SessionHistoryData } from '@/pages/chat/hooks/useConversationHistory'

function createMessageId(): string {
  return `msg-${uuidV4()}`
}

export interface AgentConversationViewState {
  // 页面最终消费的是当前会话消息 store。
  messages: UIMessage[]
  loading: boolean
  isStreaming: boolean
  hasPendingToolCalls: boolean
  taskConfirmation: TaskConfirmationViewState
}

export interface AgentConversationActions {
  send: (content: string, options?: SendOptions) => void
  stop: () => void
  confirmTask: () => void
  openTaskConfirmationModal: () => void
  closeTaskConfirmationModal: () => void
}

export interface UseAgentConversationOptions {
  client: AgentClient
  conversationId: string | null
  streamingChatIdSet: ReadonlySet<string>
  skipInitialHistoryLoadRef?: RefObject<unknown>
  // 首次对话结束后的 session_updated 用它触发列表元数据刷新。
  onSessionUpdated?: () => void
  onSessionStreamingChange?: (chatId: string, isStreaming: boolean) => void
}

export function useAgentConversation({
  client,
  conversationId,
  streamingChatIdSet,
  skipInitialHistoryLoadRef,
  onSessionUpdated,
  onSessionStreamingChange,
}: UseAgentConversationOptions): {
  state: AgentConversationViewState
  actions: AgentConversationActions
} {
  const chatId = splitSessionKey(conversationId).chatId || null
  const conversationHistory = useConversationHistory({
    conversationId,
    skipInitialLoadRef: skipInitialHistoryLoadRef,
  })

  const runtimeMapRef = useRef<Map<string, ConversationRuntime>>(new Map()) // delta 的缓冲区
  const subscriptionMapRef = useRef<Map<string, () => void>>(new Map()) // 记录会话的订阅
  const [taskConfirmationModalOpen, setTaskConfirmationModalOpen] =
    useState(false)
  const [taskConfirmationSubmitting, setTaskConfirmationSubmitting] =
    useState(false)

  const curHistory = conversationHistory.curHistory
  const currentMessages = curHistory.messages
  const currentIsStreaming = chatId ? streamingChatIdSet.has(chatId) : false
  const currentTaskConfirmation: TaskConfirmationViewState = {
    pendingTask: curHistory.pendingTask,
    submitting: taskConfirmationSubmitting,
    modalOpen: taskConfirmationModalOpen,
  }

  const getConversationRuntime = useCallback(
    (targetConversationId: string): ConversationRuntime => {
      let runtime = runtimeMapRef.current.get(targetConversationId)

      if (!runtime) {
        runtime = createConversationRuntime()
        runtimeMapRef.current.set(targetConversationId, runtime)
      }

      return runtime
    },
    [],
  )

  useEffect(() => {
    const subscriptionMap = subscriptionMapRef.current

    return () => {
      for (const [subscribedConversationId, unsubscribe] of subscriptionMap) {
        const subscribedChatId = splitSessionKey(subscribedConversationId).chatId

        unsubscribe()

        if (subscribedChatId) {
          client.detach(subscribedChatId)
        }
      }
      subscriptionMap.clear()
    }
  }, [client])

  const ensureChatSubscription = useCallback(
    (targetConversationId: string) => {
      const targetChatId = splitSessionKey(targetConversationId).chatId

      if (!targetChatId) return

      if (subscriptionMapRef.current.has(targetConversationId)) return

      const unsubscribe = client.on('chat', {
        chatId: targetChatId,
        handler: (event) => {
          const eventChatId = 'chat_id' in event ? event.chat_id : targetChatId

          if (!eventChatId) {
            return
          }

          const eventConversationId =
            eventChatId === targetChatId
              ? targetConversationId
              : `websocket:${eventChatId}`
          const now = Date.now()
          const eventStrategies: Partial<
            Record<InboundEvent['event'], () => void | SessionHistoryData>
          > = {
            session_updated: () => {
              onSessionStreamingChange?.(eventChatId, false)
              runtimeMapRef.current.delete(eventConversationId)
              onSessionUpdated?.()
            },
            attached: () => conversationHistory.getHistory(eventConversationId),
            task_confirmation_required: () => {
              if (event.event !== 'task_confirmation_required') return

              const strategyRuntime =
                getConversationRuntime(eventConversationId)
              const streamingMessageId =
                strategyRuntime.buffer?.messageId ?? null
              const pendingTask: SessionHistoryData['pendingTask'] = {
                confirmation_id: event.confirmation_id,
                title: event.title,
                task_type: event.task_type,
                markdown: event.markdown,
              }
              const state = conversationHistory.getHistory(eventConversationId)

              strategyRuntime.currentRunId = null
              strategyRuntime.buffer = null
              onSessionStreamingChange?.(eventChatId, false)
              if (eventConversationId === conversationId) {
                setTaskConfirmationSubmitting(false)
                setTaskConfirmationModalOpen(false)
              }

              return {
                ...liveReducer(state, {
                  type: 'discard_empty_streaming_message',
                  messageId: streamingMessageId,
                }),
                pendingTask,
              }
            },
            delta: () => {
              if (event.event !== 'delta') return

              const strategyRuntime =
                getConversationRuntime(eventConversationId)
              const state = conversationHistory.getHistory(eventConversationId)

              if (event.run_id) {
                strategyRuntime.currentRunId = event.run_id
              }
              onSessionStreamingChange?.(eventChatId, true)

              if (!strategyRuntime.buffer) {
                for (
                  let index = state.messages.length - 1;
                  index >= 0;
                  index -= 1
                ) {
                  const message = state.messages[index]

                  if (message.role !== 'assistant' || !message.isStreaming) {
                    continue
                  }

                  strategyRuntime.buffer = {
                    messageId: message.id,
                    parts: message.content ? [message.content] : [],
                  }
                  break
                }
              }

              const messageId =
                strategyRuntime.buffer?.messageId ?? createMessageId()

              strategyRuntime.buffer ??= {
                messageId,
                parts: [],
              }
              strategyRuntime.buffer.parts.push(event.text)

              return liveReducer(state, {
                type: 'delta_received',
                messageId: strategyRuntime.buffer.messageId,
                content: strategyRuntime.buffer.parts.join(''),
                createdAt: now,
              })
            },
            stream_end: () => {
              if (event.event !== 'stream_end') return

              const strategyRuntime =
                getConversationRuntime(eventConversationId)
              const state = conversationHistory.getHistory(eventConversationId)

              strategyRuntime.currentRunId =
                event.run_id ?? strategyRuntime.currentRunId
              strategyRuntime.buffer = null

              return liveReducer(state, { type: 'stream_finished' })
            },
            turn_end: () => {
              const strategyRuntime =
                getConversationRuntime(eventConversationId)
              const state = conversationHistory.getHistory(eventConversationId)

              strategyRuntime.currentRunId = null
              strategyRuntime.buffer = null
              onSessionStreamingChange?.(eventChatId, false)

              return liveReducer(state, { type: 'stream_ended' })
            },
            canceled: () => {
              const strategyRuntime =
                getConversationRuntime(eventConversationId)
              const state = conversationHistory.getHistory(eventConversationId)

              strategyRuntime.currentRunId = null
              strategyRuntime.buffer = null
              onSessionStreamingChange?.(eventChatId, false)

              return liveReducer(state, {
                type: 'stream_canceled',
                messageId: createMessageId(),
                content: '此条消息已取消',
                createdAt: now,
              })
            },
            error: () => {
              const strategyRuntime =
                getConversationRuntime(eventConversationId)
              const state = conversationHistory.getHistory(eventConversationId)

              strategyRuntime.currentRunId = null
              strategyRuntime.buffer = null
              onSessionStreamingChange?.(eventChatId, false)

              return liveReducer(state, { type: 'stream_ended' })
            },
            message: () => {
              if (event.event !== 'message') return

              const strategyRuntime =
                getConversationRuntime(eventConversationId)
              const state = conversationHistory.getHistory(eventConversationId)

              strategyRuntime.currentRunId =
                event.run_id ?? strategyRuntime.currentRunId
              onSessionStreamingChange?.(eventChatId, true)

              if (event.kind === 'tool_hint' || event.kind === 'progress') {
                return state
              }

              const media = event.media_urls?.length
                ? event.media_urls.map((item) => toMediaAttachment(item))
                : event.media?.map((url) => toMediaAttachment({ url }))
              const hasMedia = !!media && media.length > 0
              const hasButtons = !!event.buttons?.length
              const isTaskConfirmation = event.kind === 'task_confirmation'
              const isTaskCreated = event.kind === 'task-created'

              if (
                !hasMedia &&
                !hasButtons &&
                !isTaskConfirmation &&
                !isTaskCreated
              ) {
                return state
              }

              const shouldReplacePlaceholder =
                !!strategyRuntime.buffer &&
                strategyRuntime.buffer.parts.length === 0
              const nextState = liveReducer(state, {
                type: 'message_received',
                message: {
                  id: createMessageId(),
                  role: 'assistant',
                  content: hasButtons
                    ? (event.button_prompt ?? event.text)
                    : event.text,
                  ...(isTaskCreated ? { kind: 'task-created' as const } : {}),
                  createdAt: now,
                  ...(hasButtons ? { buttons: event.buttons } : {}),
                  ...(hasMedia ? { media } : {}),
                },
                ...(shouldReplacePlaceholder
                  ? { replaceMessageId: strategyRuntime.buffer?.messageId }
                  : {}),
              })

              if (shouldReplacePlaceholder) {
                strategyRuntime.buffer = null
              }
              if (isTaskCreated && eventConversationId === conversationId) {
                setTaskConfirmationSubmitting(false)
                setTaskConfirmationModalOpen(false)
              }

              return isTaskCreated
                ? {
                    ...nextState,
                    pendingTask: null,
                  }
                : nextState
            },
          }
          const nextConversation = eventStrategies[event.event]?.()

          if (nextConversation) {
            conversationHistory.setHistory(eventConversationId, nextConversation)
          }
        },
      })

      subscriptionMapRef.current.set(targetConversationId, unsubscribe)
    },
    [
      client,
      conversationId,
      conversationHistory,
      getConversationRuntime,
      setTaskConfirmationModalOpen,
      setTaskConfirmationSubmitting,
      onSessionStreamingChange,
      onSessionUpdated,
    ],
  )

  useEffect(() => {
    if (!conversationId) return

    ensureChatSubscription(conversationId)
  }, [conversationId, ensureChatSubscription])

  useEffect(() => {
    setTaskConfirmationSubmitting(false)
    setTaskConfirmationModalOpen(false)
  }, [
    conversationId,
    setTaskConfirmationModalOpen,
    setTaskConfirmationSubmitting,
  ])

  useEffect(() => {
    if (!chatId || !curHistory.hasPendingToolCalls) return

    onSessionStreamingChange?.(chatId, true)
  }, [chatId, curHistory.hasPendingToolCalls, onSessionStreamingChange])

  useEffect(() => {
    for (const subscribedConversationId of Array.from(
      subscriptionMapRef.current.keys(),
    )) {
      if (subscribedConversationId === conversationId) continue

      const subscribedChatId = splitSessionKey(subscribedConversationId).chatId

      if (subscribedChatId && streamingChatIdSet.has(subscribedChatId)) {
        continue
      }

      const unsubscribe = subscriptionMapRef.current.get(
        subscribedConversationId,
      )

      if (!unsubscribe) continue

      unsubscribe()
      subscriptionMapRef.current.delete(subscribedConversationId)

      if (subscribedChatId) {
        client.detach(subscribedChatId)
      }
    }
  }, [client, conversationId, streamingChatIdSet])

  const send = useCallback<AgentConversationActions['send']>(
    (content, options) => {
      if (!conversationId || !chatId) return

      const hasAttachments = !!options?.attachmentIds?.length
      const text = content.trim()

      if (!hasAttachments && !text) return

      const baseHistory = conversationHistory.getHistory(conversationId)
      const now = Date.now()
      const userMessage: UIMessage = {
        id: createMessageId(),
        role: 'user',
        content,
        createdAt: now,
      }
      const assistantMessage: UIMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: '',
        isStreaming: true,
        createdAt: now,
      }
      const runtime = getConversationRuntime(conversationId)

      runtime.buffer = {
        messageId: assistantMessage.id,
        parts: [],
      }
      conversationHistory.setHistory(conversationId, {
        ...baseHistory,
        messages: [...baseHistory.messages, userMessage, assistantMessage],
        hasPendingToolCalls: false,
      })
      onSessionStreamingChange?.(chatId, true)

      // 真正的消息发送仍然走 AgentClient，对话 hook 只负责页面状态。
      client.sendMessage(chatId, content, options)
    },
    [
      chatId,
      client,
      conversationId,
      conversationHistory,
      getConversationRuntime,
      onSessionStreamingChange,
    ],
  )

  const stop = useCallback(() => {
    if (!conversationId || !chatId) return

    const runtime = getConversationRuntime(conversationId)
    const now = Date.now()
    const nextConversation = liveReducer(
      conversationHistory.getHistory(conversationId),
      {
        type: 'stream_canceled',
        messageId: createMessageId(),
        content: '此条消息已取消',
        createdAt: now,
      },
    )

    conversationHistory.setHistory(conversationId, nextConversation)
    onSessionStreamingChange?.(chatId, false)

    if (runtime.currentRunId) {
      client.cancelRun(runtime.currentRunId)
      runtime.currentRunId = null
      return
    }

    client.cancelChat(chatId)
  }, [
    chatId,
    client,
    conversationId,
    conversationHistory,
    getConversationRuntime,
    onSessionStreamingChange,
  ])

  const openTaskConfirmationModal = useCallback(() => {
    if (!conversationId) return

    setTaskConfirmationModalOpen(
      !!conversationHistory.getHistory(conversationId).pendingTask,
    )
  }, [
    conversationHistory,
    conversationId,
    setTaskConfirmationModalOpen,
  ])

  const closeTaskConfirmationModal = useCallback(() => {
    setTaskConfirmationModalOpen(false)
  }, [setTaskConfirmationModalOpen])

  const confirmTask = useCallback<AgentConversationActions['confirmTask']>(
    () => {
      if (!conversationId) return

      const pendingTask =
        conversationHistory.getHistory(conversationId).pendingTask

      if (!pendingTask) return

      setTaskConfirmationSubmitting(true)

      try {
        client.taskConfirm(pendingTask.confirmation_id)
      } catch {
        setTaskConfirmationSubmitting(false)
      }
    },
    [client, conversationHistory, conversationId, setTaskConfirmationSubmitting],
  )

  return {
    state: {
      messages: currentMessages,
      loading: conversationId
        ? conversationHistory.loading && currentMessages.length === 0
        : false,
      isStreaming: currentIsStreaming,
      hasPendingToolCalls: conversationId
        ? conversationHistory.curHistory.hasPendingToolCalls
        : false,
      taskConfirmation: currentTaskConfirmation,
    },
    actions: {
      send,
      stop,
      confirmTask,
      openTaskConfirmationModal,
      closeTaskConfirmationModal,
    },
  }
}
