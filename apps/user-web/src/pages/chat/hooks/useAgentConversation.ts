import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { splitSessionKey } from '@/api/chat'
import { i18n } from '@/i18n'
import { toMediaAttachment } from '@/api/media'
import { useMenuStore } from '@/store/useMenu'
import type {
  TaskConfirmationViewState,
  UIMessage,
} from '@/pages/chat/types'
import type { Task } from '@ff-ai-frontend/api'
import type {
  InboundEvent,
  InboundTaskProcessingEvent,
} from '@/pages/chat/hooks/agentTypes'
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

function sanitizeAgentLabel(value: string): string {
  return value
    .replaceAll('Hermes Agent', 'Agent')
    .replaceAll('Hermes/LLM', 'Agent/LLM')
    .replaceAll('Hermes', 'Agent')
}

function normalizeErrorMessage(detail: unknown): string {
  const raw = typeof detail === 'string' ? detail.trim() : ''
  let message = raw
  let code = ''

  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const parsedDetail = parsed.detail ?? parsed.message ?? parsed.error
      if (typeof parsed.code === 'string') {
        code = parsed.code
      }
      if (typeof parsedDetail === 'string' && parsedDetail.trim()) {
        message = parsedDetail.trim()
      }
    } catch {
      message = raw
    }
  } else if (raw.includes('{') && raw.includes('}')) {
    try {
      const embedded = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
      const parsed = JSON.parse(embedded) as Record<string, unknown>
      if (typeof parsed.code === 'string') {
        code = parsed.code
      }
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        message = parsed.message.trim()
      }
    } catch {
      message = raw
    }
  }

  const normalized = `${raw} ${message} ${code}`.toLowerCase()
  if (
    normalized.includes('429') ||
    normalized.includes('too many requests') ||
    normalized.includes('quota') ||
    normalized.includes('额度')
  ) {
    return 'Agent/LLM 当前返回 429 Too Many Requests：模型额度或流量可能已用完，也可能是请求过于频繁。请稍后重试，或更换可用的模型/API Key 后再提交。'
  }
  if (
    normalized.includes('401') ||
    normalized.includes('api_key_disabled') ||
    normalized.includes('api key is disabled')
  ) {
    return 'Agent/LLM 认证失败：上游服务返回 401。这通常表示运行环境里的 API Key 无效、已失效，或某个工具侧凭据与主模型凭据不一致；不能仅凭该错误判断凭据的具体状态。'
  }
  if (normalized.includes('unsupported content type')) {
    return '请求格式不符合接口预期：Content-Type 不被后端支持。请刷新页面后重试；如果仍出现，需要检查当前请求是否按 JSON 或正确的上传格式发送。'
  }
  return sanitizeAgentLabel(message) || '执行失败，请稍后重试。'
}

function toChatTask(event: InboundTaskProcessingEvent): Task {
  return {
    title: event.title,
    status: event.status,
    task_id: event.task_id,
    tenant_id: event.tenant_id,
    agent_id: event.agent_id ?? null,
    task_type: event.task_type,
    created_at: event.created_at,
    updated_at: event.updated_at,
    last_error: event.last_error,
    retry_count: event.retry_count,
    current_node: event.current_node,
    web_url: event.web_url,
    logs: Array.isArray(event.logs) ? event.logs : undefined,
  }
}

function refreshAppMenuForCompletedTask(task: Task) {
  if (task.status === 'COMPLETED' && task.web_url) {
    void useMenuStore.getState().retryMenu()
  }
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
  const [taskConfirmationSubmitting, setTaskConfirmationSubmitting] =
    useState(false)

  const curHistory = conversationHistory.curHistory
  const currentMessages = curHistory.messages
  const currentIsStreaming = chatId ? streamingChatIdSet.has(chatId) : false
  const currentTaskConfirmation: TaskConfirmationViewState = {
    pendingTask: curHistory.pendingTask,
    submitting: taskConfirmationSubmitting,
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
              'conversation_id' in event && event.conversation_id
                ? event.conversation_id
                : eventChatId === targetChatId
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
                strategyRuntime.buffer?.messageId ?? event.bubble_id

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
                content: i18n.t('pages.chat.message.canceled'),
                createdAt: now,
              })
            },
            error: () => {
              if (event.event !== 'error') return

              const strategyRuntime =
                getConversationRuntime(eventConversationId)
              const state = conversationHistory.getHistory(eventConversationId)
              const replaceMessageId = strategyRuntime.buffer?.messageId
              const messageId = event.bubble_id ?? replaceMessageId ?? createMessageId()

              strategyRuntime.currentRunId = null
              strategyRuntime.buffer = null
              onSessionStreamingChange?.(eventChatId, false)

              return liveReducer(
                {
                  ...state,
                  messages: state.messages.map((message) =>
                    message.isStreaming
                      ? { ...message, isStreaming: false }
                      : message,
                  ),
                },
                {
                  type: 'message_received',
                  message: {
                    id: messageId,
                    role: 'assistant',
                    kind: 'error',
                    content: normalizeErrorMessage(event.detail),
                    createdAt: now,
                  },
                  ...(replaceMessageId ? { replaceMessageId } : {}),
                },
              )
            },
            message: () => {
              if (event.event !== 'message') return

              const strategyRuntime =
                getConversationRuntime(eventConversationId)
              const state = conversationHistory.getHistory(eventConversationId)

              strategyRuntime.currentRunId =
                event.run_id ?? strategyRuntime.currentRunId
              onSessionStreamingChange?.(eventChatId, true)

                if (event.kind === 'tool_hint') {
                  return state
                }

                if (event.kind === 'progress') {
                  const progressText = event.text?.trim()

                  if (!progressText) return state

                  const messageId =
                    strategyRuntime.buffer?.messageId ??
                    event.bubble_id ??
                    createMessageId()

                  strategyRuntime.buffer ??= {
                    messageId,
                    parts: [],
                  }
                  strategyRuntime.buffer.parts = [progressText]

                  return liveReducer(state, {
                    type: 'delta_received',
                    messageId,
                    content: progressText,
                    createdAt: now,
                  })
                }

                if (
                  event.kind === 'task-created' ||
                  event.kind === 'task-info-update'
                ) {
                  strategyRuntime.currentRunId = null
                  strategyRuntime.buffer = null
                  onSessionStreamingChange?.(eventChatId, false)

                  if (eventConversationId === conversationId) {
                    setTaskConfirmationSubmitting(false)
                  }

                  const task = toChatTask(
                    event as unknown as InboundTaskProcessingEvent,
                  )
                  refreshAppMenuForCompletedTask(task)

                  return liveReducer(state, {
                    type: 'task_message_upserted',
                    message: {
                      id: event.bubble_id,
                      role: 'assistant',
                      content: event.text,
                      createdAt: now,
                      task,
                    },
                  })
                }

                const media = event.media_urls?.length
                  ? event.media_urls.map((item) => toMediaAttachment(item))
                  : event.media?.map((url) => toMediaAttachment({ url }))
              const hasMedia = !!media && media.length > 0
              const hasButtons = !!event.buttons?.length
              const isTaskConfirmation = event.kind === 'task_confirmation'
              const isErrorMessage = event.kind === 'error'

              if (
                !hasMedia &&
                !hasButtons &&
                !isTaskConfirmation &&
                !isErrorMessage
              ) {
                return state
              }

              const shouldReplacePlaceholder =
                !!strategyRuntime.buffer &&
                strategyRuntime.buffer.parts.length === 0
              const nextState = liveReducer(state, {
                type: 'message_received',
                message: {
                  id: event.bubble_id,
                  role: 'assistant',
                  kind: isErrorMessage ? 'error' : undefined,
                  content: isErrorMessage
                    ? normalizeErrorMessage(event.text)
                    : hasButtons
                      ? (event.button_prompt ?? event.text)
                      : event.text,
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

              return nextState
            },
            'task-created': () => {
              if (event.event !== 'task-created') return

              const strategyRuntime =
                getConversationRuntime(eventConversationId)
              const state = conversationHistory.getHistory(eventConversationId)
              const streamingMessageId =
                strategyRuntime.buffer?.messageId ?? null

              strategyRuntime.currentRunId = null
              strategyRuntime.buffer = null
              onSessionStreamingChange?.(eventChatId, false)

              if (eventConversationId === conversationId) {
                setTaskConfirmationSubmitting(false)
              }

              const nextState = liveReducer(state, {
                type: 'discard_empty_streaming_message',
                messageId: streamingMessageId,
              })

                const task = toChatTask(event)
                refreshAppMenuForCompletedTask(task)

                return liveReducer(nextState, {
                  type: 'task_message_upserted',
                  message: {
                    id: event.bubble_id,
                    role: 'assistant',
                    content: event.text,
                    createdAt: Date.parse(event.created_at) || now,
                    task,
                  },
                })
              },
            'task-info-update': () => {
              if (event.event !== 'task-info-update') return

              const state = conversationHistory.getHistory(eventConversationId)

                const task = toChatTask(event)
                refreshAppMenuForCompletedTask(task)

                return liveReducer(state, {
                  type: 'task_message_upserted',
                  message: {
                    id: event.bubble_id,
                    role: 'assistant',
                    content: event.text,
                    createdAt: Date.parse(event.created_at) || now,
                    task,
                  },
                })
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
  }, [conversationId, setTaskConfirmationSubmitting])

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
        content: i18n.t('pages.chat.message.canceled'),
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

  const confirmTask = useCallback<AgentConversationActions['confirmTask']>(
    () => {
      if (!conversationId) return

      const pendingTask =
        conversationHistory.getHistory(conversationId).pendingTask

      if (!pendingTask) return

      setTaskConfirmationSubmitting(true)

      try {
        const chatId = splitSessionKey(conversationId).chatId
        if (!chatId) {
          setTaskConfirmationSubmitting(false)
          return
        }
        client.taskConfirm(chatId, pendingTask.confirmation_id)
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
    },
  }
}
