import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { v4 as uuidV4 } from 'uuid'

import { conversations_message, splitSessionKey } from '@/api/chat'
import { toMediaAttachment } from '@/api/media'
import type { SessionMessagesResponse } from '@/api/chat'
import type { InboundEvent, UIMessage } from '@/api/types'
import type {
  AgentClient,
  SendImage,
  SendOptions,
  StreamError,
} from '@/pages/chat/hooks/agentClient'
import {
  applyConversationEvent,
  createConversationRuntime,
  INITIAL_LIVE_STATE,
  liveReducer,
  reduceConversationEvent,
  stopConversation,
  type ConversationRuntime,
} from '@/pages/chat/hooks/agentConversationRuntime'
import { RequestError } from '@ff-ai-frontend/utils'

const EMPTY_MESSAGES: UIMessage[] = []
type MessageIdPrefix = 'hist' | 'msg'
type UIMessageDraft = Omit<UIMessage, 'id'>
type ChatEvent = InboundEvent

interface SessionHistoryData {
  messages: UIMessage[]
  hasPendingToolCalls: boolean
}

interface CachedConversationState {
  messages: UIMessage[]
  isStreaming: boolean
}

interface OptimisticTurn {
  userMessage: UIMessage
  assistantMessage: UIMessage
}

const CONVERSATION_MESSAGES_QUERY_KEY = ['conversation-messages'] as const

function createMessageId(prefix: MessageIdPrefix): string {
  return `${prefix}-${uuidV4()}`
}

function assignHistoryMessageIds(messages: UIMessageDraft[]): UIMessage[] {
  return messages.map((message) => ({
    ...message,
    id: createMessageId('hist'),
  }))
}

function createCachedConversationState(
  messages: UIMessage[],
  isStreaming: boolean,
): CachedConversationState {
  return {
    messages,
    isStreaming,
  }
}

function createOptimisticTurn(
  content: string,
  images?: SendImage[],
): OptimisticTurn {
  const now = Date.now()
  const hasImages = !!images && images.length > 0

  return {
    userMessage: {
      id: createMessageId('msg'),
      role: 'user',
      content,
      createdAt: now,
      ...(hasImages ? { images: images.map((image) => image.preview) } : {}),
    },
    assistantMessage: {
      id: createMessageId('msg'),
      role: 'assistant',
      content: '',
      isStreaming: true,
      createdAt: now,
    },
  }
}

function shouldRestoreOptimisticConversation(
  currentChatId: string | null,
  pendingChatId: string | null,
  snapshot: CachedConversationState | null,
): currentChatId is string {
  return !!currentChatId && pendingChatId === currentChatId && !!snapshot
}

function shouldPreserveCurrentConversation(
  currentChatId: string | null,
  ownerChatId: string | null,
  messages: UIMessage[],
): currentChatId is string {
  return !!currentChatId && ownerChatId === currentChatId && messages.length > 0
}

function shouldKeepLiveStateDuringHistoryHydration(
  currentChatId: string,
  messagesFromHistory: UIMessage[],
  liveMessages: UIMessage[],
  hydratingChatId: string | null,
): boolean {
  return (
    messagesFromHistory.length === 0 &&
    liveMessages.length > 0 &&
    hydratingChatId !== currentChatId
  )
}

async function fetchSessionHistory(
  key: string,
): Promise<SessionHistoryData> {
  try {
    const body = await conversations_message(key)

    return mapSessionHistory(body)
  } catch (error) {
    if (error instanceof RequestError && error.status === 404) {
      return {
        messages: EMPTY_MESSAGES,
        hasPendingToolCalls: false,
      }
    }

    throw error
  }
}

function shouldPreserveSnapshotOnSessionUpdated(
  targetChatId: string,
  ownerChatId: string | null,
  liveState: AgentConversationViewStateLike,
  cachedState: CachedConversationState | null,
): boolean {
  if (ownerChatId === targetChatId && liveState.isStreaming) {
    return true
  }

  return cachedState?.isStreaming === true
}

interface AgentConversationViewStateLike {
  messages: UIMessage[]
  isStreaming: boolean
}

export interface AgentConversationViewState {
  // 页面最终消费的是当前会话的单一内存消息列表。
  messages: UIMessage[]
  loading: boolean
  isStreaming: boolean
  streamingByChatId: Record<string, boolean>
  streamError: StreamError | null
  hasPendingToolCalls: boolean
}

export interface AgentConversationActions {
  send: (content: string, images?: SendImage[], options?: SendOptions) => void
  sendToChat: (
    targetChatId: string,
    content: string,
    images?: SendImage[],
    options?: SendOptions,
  ) => void
  stop: () => void
  dismissStreamError: () => void
}

export interface UseAgentConversationOptions {
  client: AgentClient
  key: string | null
  // 首次对话结束后的 session_updated 用它触发列表元数据刷新。
  onSessionUpdated?: () => void
}

function mapSessionHistory(body: SessionMessagesResponse): SessionHistoryData {
  // 服务端历史消息先映射成统一的 UIMessage，方便页面和 live 消息共用同一套渲染。
  const messageDrafts: UIMessageDraft[] = body.messages.flatMap((message) => {
    if (message.role !== 'user' && message.role !== 'assistant') {
      return []
    }

    if (typeof message.content !== 'string') {
      return []
    }

    const media =
      Array.isArray(message.media_urls) && message.media_urls.length > 0
        ? message.media_urls.map((item) => toMediaAttachment(item))
        : undefined
    const images =
      message.role === 'user' && media?.every((item) => item.kind === 'image')
        ? media.map((item) => ({ url: item.url, name: item.name }))
        : undefined

    return [
      {
        role: message.role,
        content: message.content,
        createdAt: message.timestamp
          ? Date.parse(message.timestamp)
          : Date.now(),
        ...(images ? { images } : {}),
        ...(media ? { media } : {}),
      },
    ]
  })
  const messages = assignHistoryMessageIds(messageDrafts)

  const lastConversationMessage = [...body.messages]
    .reverse()
    .find((message) => message.role === 'user' || message.role === 'assistant')
  const hasPendingToolCalls =
    lastConversationMessage?.role === 'assistant' &&
    Array.isArray(lastConversationMessage.tool_calls) &&
    lastConversationMessage.tool_calls.length > 0

  return {
    messages,
    hasPendingToolCalls,
  }
}

export function useAgentConversation({
  client,
  key,
  onSessionUpdated,
}: UseAgentConversationOptions): {
  state: AgentConversationViewState
  actions: AgentConversationActions
} {
  const chatId = splitSessionKey(key).chatId || null
  const queryClient = useQueryClient()
  // 历史消息
  const historyQuery = useQuery<SessionHistoryData>({
    queryKey: [...CONVERSATION_MESSAGES_QUERY_KEY, key],
    queryFn: () => fetchSessionHistory(key!),
    enabled: !!key,
  })
  const [liveState, dispatch] = useReducer(liveReducer, INITIAL_LIVE_STATE)
  const liveStateRef = useRef(liveState)
  const conversationCacheRef = useRef<Map<string, CachedConversationState>>(new Map())
  const runtimeCacheRef = useRef<Map<string, ConversationRuntime>>(new Map())
  const sessionKeyByChatIdRef = useRef<Map<string, string>>(new Map())
  const chatSubscriptionRef = useRef<Map<string, () => void>>(new Map())
  const runtimeRef = useRef<ConversationRuntime>(createConversationRuntime())
  const hydratingChatIdRef = useRef<string | null>(chatId)
  const stateOwnerChatIdRef = useRef<string | null>(chatId)
  const [streamingByChatId, setStreamingByChatId] = useState<Record<string, boolean>>({})
  const historyMessages = historyQuery.data?.messages ?? EMPTY_MESSAGES

  const setSessionStreaming = useCallback((targetChatId: string, isStreaming: boolean) => {
    setStreamingByChatId((current) => {
      if (isStreaming) {
        if (current[targetChatId] === true) return current

        return {
          ...current,
          [targetChatId]: true,
        }
      }

      if (!(targetChatId in current)) return current

      const next = { ...current }
      delete next[targetChatId]
      return next
    })
  }, [])

  const persistConversationSnapshot = useCallback(
    (
      targetChatId: string,
      snapshot: CachedConversationState,
      runtime: ConversationRuntime,
    ) => {
      conversationCacheRef.current.set(targetChatId, snapshot)
      runtimeCacheRef.current.set(targetChatId, runtime)
      setSessionStreaming(targetChatId, snapshot.isStreaming)
    },
    [setSessionStreaming],
  )

  const clearConversationSnapshot = useCallback(
    (targetChatId: string) => {
      conversationCacheRef.current.delete(targetChatId)
      runtimeCacheRef.current.delete(targetChatId)
      setSessionStreaming(targetChatId, false)
    },
    [setSessionStreaming],
  )

  const restoreConversationSnapshot = useCallback(
    (snapshot: CachedConversationState, runtime?: ConversationRuntime) => {
      dispatch({
        type: 'state_restored',
        messages: snapshot.messages,
        isStreaming: snapshot.isStreaming,
      })

      if (runtime) {
        runtimeRef.current = runtime
      }
    },
    [],
  )

  const getConversationMessages = useCallback((targetChatId: string): UIMessage[] => {
    const cachedState = conversationCacheRef.current.get(targetChatId)

    if (cachedState) {
      return cachedState.messages
    }

    return stateOwnerChatIdRef.current === targetChatId
      ? liveStateRef.current.messages
      : EMPTY_MESSAGES
  }, [])

  const handleSessionUpdatedEvent = useCallback(
    (targetChatId: string) => {
      const cachedState = conversationCacheRef.current.get(targetChatId) ?? null
      const shouldPreserveSnapshot = shouldPreserveSnapshotOnSessionUpdated(
        targetChatId,
        stateOwnerChatIdRef.current,
        liveStateRef.current,
        cachedState,
      )

      if (!shouldPreserveSnapshot) {
        clearConversationSnapshot(targetChatId)
      }

      if (!shouldPreserveSnapshot && stateOwnerChatIdRef.current === targetChatId) {
        hydratingChatIdRef.current = targetChatId
        runtimeRef.current = createConversationRuntime()
      }

      const sessionKey = sessionKeyByChatIdRef.current.get(targetChatId)

      if (sessionKey) {
        void queryClient.invalidateQueries({
          queryKey: [...CONVERSATION_MESSAGES_QUERY_KEY, sessionKey],
        })
      }

      onSessionUpdated?.()
    },
    [clearConversationSnapshot, onSessionUpdated, queryClient],
  )

  const resetConversationForChat = useCallback((targetChatId: string | null) => {
    hydratingChatIdRef.current = targetChatId
    stateOwnerChatIdRef.current = targetChatId
    runtimeRef.current = createConversationRuntime()
    dispatch({ type: 'chat_reset' })
  }, [])

  const restoreOptimisticConversation = useCallback(
    (targetChatId: string, snapshot: CachedConversationState) => {
      hydratingChatIdRef.current = null
      stateOwnerChatIdRef.current = targetChatId
      const cachedRuntime = runtimeCacheRef.current.get(targetChatId)
      runtimeRef.current.pendingChatId = null
      restoreConversationSnapshot(snapshot, cachedRuntime)
    },
    [restoreConversationSnapshot],
  )

  const restoreConversationFromCache = useCallback(
    (targetChatId: string, snapshot: CachedConversationState) => {
      hydratingChatIdRef.current = null

      const currentState = liveStateRef.current

      if (
        currentState.messages !== snapshot.messages ||
        currentState.isStreaming !== snapshot.isStreaming
      ) {
        restoreConversationSnapshot(snapshot)
      }

      const cachedRuntime = runtimeCacheRef.current.get(targetChatId)

      if (cachedRuntime) {
        runtimeRef.current = cachedRuntime
      }
    },
    [restoreConversationSnapshot],
  )

  const restoreConversationFromHistory = useCallback(
    (messages: UIMessage[], isStreaming: boolean) => {
      hydratingChatIdRef.current = null
      restoreConversationSnapshot(
        createCachedConversationState(messages, isStreaming),
      )
      runtimeRef.current = createConversationRuntime()
    },
    [restoreConversationSnapshot],
  )

  const cacheCurrentConversationIfNeeded = useCallback(() => {
    const ownerChatId = stateOwnerChatIdRef.current
    const currentState = liveStateRef.current

    if (!ownerChatId || currentState.messages.length === 0) {
      return {
        ownerChatId,
        currentState,
      }
    }

    persistConversationSnapshot(
      ownerChatId,
      createCachedConversationState(
        currentState.messages,
        currentState.isStreaming,
      ),
      runtimeRef.current,
    )

    return {
      ownerChatId,
      currentState,
    }
  }, [persistConversationSnapshot])

  const applyEventToCurrentConversation = useCallback((event: ChatEvent) => {
    applyConversationEvent({
      state: liveStateRef.current,
      event,
      runtime: runtimeRef.current,
      dispatch,
      createMessageId: () => createMessageId('msg'),
      now: Date.now(),
    })
  }, [])

  const applyEventToCachedConversation = useCallback(
    (
      targetChatId: string,
      event: ChatEvent,
    ) => {
      const cachedRuntime =
        runtimeCacheRef.current.get(targetChatId) ?? createConversationRuntime()
      const cachedState =
        conversationCacheRef.current.get(targetChatId) ?? INITIAL_LIVE_STATE
      const nextState = reduceConversationEvent({
        state: {
          ...cachedState,
          streamError: null,
        },
        event,
        runtime: cachedRuntime,
        createMessageId: () => createMessageId('msg'),
        now: Date.now(),
      })

      if (nextState.messages.length === 0 && !nextState.isStreaming) {
        clearConversationSnapshot(targetChatId)
        return
      }

      persistConversationSnapshot(
        targetChatId,
        createCachedConversationState(
          nextState.messages,
          nextState.isStreaming,
        ),
        cachedRuntime,
      )
    },
    [clearConversationSnapshot, persistConversationSnapshot],
  )

  const handleSubscribedChatEvent = useCallback(
    (
      subscribedChatId: string,
      event: ChatEvent,
    ) => {
      const eventChatId = 'chat_id' in event ? event.chat_id : subscribedChatId

      if (!eventChatId) {
        return
      }

      if (event.event === 'session_updated') {
        handleSessionUpdatedEvent(eventChatId)
        return
      }

      if (eventChatId === stateOwnerChatIdRef.current) {
        applyEventToCurrentConversation(event)
        return
      }

      applyEventToCachedConversation(eventChatId, event)
    },
    [
      applyEventToCachedConversation,
      applyEventToCurrentConversation,
      handleSessionUpdatedEvent,
    ],
  )

  useEffect(() => {
    liveStateRef.current = liveState
  }, [liveState])

  useEffect(() => {
    const { ownerChatId: currentOwnerChatId, currentState } =
      cacheCurrentConversationIfNeeded()
    const optimisticTargetChatId = runtimeRef.current.pendingChatId
    const optimisticCachedState = optimisticTargetChatId
      ? (conversationCacheRef.current.get(optimisticTargetChatId) ?? null)
      : null

    // 新会话首条消息发送后，优先恢复刚刚同步写入的 optimistic 会话缓存。
    if (
      shouldRestoreOptimisticConversation(
        chatId,
        optimisticTargetChatId,
        optimisticCachedState,
      )
    ) {
      restoreOptimisticConversation(chatId, optimisticCachedState!)
      return
    }

    if (
      shouldPreserveCurrentConversation(
        chatId,
        currentOwnerChatId,
        currentState.messages,
      )
    ) {
      hydratingChatIdRef.current = null
      runtimeRef.current.pendingChatId = null
      return
    }

    resetConversationForChat(chatId)
  }, [
    cacheCurrentConversationIfNeeded,
    chatId,
    resetConversationForChat,
    restoreOptimisticConversation,
  ])

  useEffect(() => {
    const currentChatId = chatId

    if (!currentChatId || historyQuery.isLoading) return

    const cachedState = conversationCacheRef.current.get(currentChatId)
    const currentState = liveStateRef.current

    if (cachedState && cachedState.messages.length > 0) {
      restoreConversationFromCache(currentChatId, cachedState)

      return
    }

    if (
      shouldKeepLiveStateDuringHistoryHydration(
        currentChatId,
        historyMessages,
        currentState.messages,
        hydratingChatIdRef.current,
      )
    ) {
      return
    }

    restoreConversationFromHistory(
      historyMessages,
      historyQuery.data?.hasPendingToolCalls ?? false,
    )
  }, [
    chatId,
    historyMessages,
    historyQuery.data?.hasPendingToolCalls,
    historyQuery.isLoading,
    restoreConversationFromCache,
    restoreConversationFromHistory,
  ])

  useEffect(() => {
    const ownerChatId = stateOwnerChatIdRef.current

    if (!ownerChatId || liveState.messages.length === 0) return

    persistConversationSnapshot(
      ownerChatId,
      createCachedConversationState(
        liveState.messages,
        liveState.isStreaming,
      ),
      runtimeRef.current,
    )
  }, [liveState.isStreaming, liveState.messages, persistConversationSnapshot])

  useEffect(() => {
    if (!chatId || !key) return

    sessionKeyByChatIdRef.current.set(chatId, key)
  }, [chatId, key])

  useEffect(() => {
    return client.onError((error) => {
      // websocket 层错误不改消息列表，只更新错误提示状态。
      dispatch({ type: 'stream_error', error })
    })
  }, [client])

  useEffect(() => {
    const subscriptions = chatSubscriptionRef.current

    return () => {
      for (const unsubscribe of subscriptions.values()) {
        unsubscribe()
      }
      subscriptions.clear()
    }
  }, [client])

  useEffect(() => {
    if (!chatId) return

    if (!chatSubscriptionRef.current.has(chatId)) {
      const unsubscribe = client.onChat(chatId, (event) => {
        handleSubscribedChatEvent(chatId, event)
      })

      chatSubscriptionRef.current.set(chatId, unsubscribe)
    }
  }, [
    chatId,
    client,
    handleSubscribedChatEvent,
  ])

  const sendToChat = useCallback<AgentConversationActions['sendToChat']>(
    (targetChatId, content, images, options) => {
      const hasImages = !!images && images.length > 0
      const text = content.trim()

      if (!hasImages && !text) return

      const baseMessages = getConversationMessages(targetChatId)
      const { userMessage, assistantMessage } = createOptimisticTurn(
        content,
        images,
      )

      runtimeRef.current.buffer = {
        messageId: assistantMessage.id,
        parts: [],
      }
      runtimeRef.current.pendingChatId = targetChatId
      stateOwnerChatIdRef.current = targetChatId
      persistConversationSnapshot(
        targetChatId,
        createCachedConversationState(
          [...baseMessages, userMessage, assistantMessage],
          true,
        ),
        runtimeRef.current,
      )

      dispatch({
        type: 'turn_started',
        userMessage,
        assistantMessage,
      })

      const media = hasImages ? images.map((image) => image.media) : undefined

      // 真正的消息发送仍然走 AgentClient，对话 hook 只负责页面状态。
      client.sendMessage(targetChatId, content, media, options)
    },
    [client, getConversationMessages, persistConversationSnapshot],
  )

  const send = useCallback<AgentConversationActions['send']>(
    (content, images, options) => {
      if (!chatId) return

      sendToChat(chatId, content, images, options)
    },
    [chatId, sendToChat],
  )

  const stop = useCallback(() => {
    stopConversation({
      chatId,
      runtime: runtimeRef.current,
      dispatch,
      client,
    })
  }, [chatId, client])

  const dismissStreamError = useCallback(() => {
    dispatch({ type: 'error_dismissed' })
  }, [])

  return {
    state: {
      messages: liveState.messages,
      loading:
        key ? historyQuery.isLoading && liveState.messages.length === 0 : false,
      isStreaming: liveState.isStreaming,
      streamingByChatId,
      streamError: liveState.streamError,
      hasPendingToolCalls: key
        ? (historyQuery.data?.hasPendingToolCalls ?? false)
        : false,
    },
    actions: {
      send,
      sendToChat,
      stop,
      dismissStreamError,
    },
  }
}
