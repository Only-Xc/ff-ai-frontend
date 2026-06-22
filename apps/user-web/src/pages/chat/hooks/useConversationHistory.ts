import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'

import {
  conversations_message,
  conversations_pending_task,
  type SessionMessages,
} from '@/api/chat'
import { toMediaAttachment } from '@/api/media'
import type {
  TaskConfirmationViewState,
  UIMessage,
} from '@/pages/chat/types'
import type { Task } from '@ff-ai-frontend/api'
import { RequestError } from '@ff-ai-frontend/utils'

const EMPTY_MESSAGES: UIMessage[] = []

export interface SessionHistoryData {
  messages: UIMessage[]
  hasPendingToolCalls: boolean
  pendingTask: TaskConfirmationViewState['pendingTask']
}

export const EMPTY_HISTORY: SessionHistoryData = {
  messages: EMPTY_MESSAGES,
  hasPendingToolCalls: false,
  pendingTask: null,
}

interface UseConversationHistoryOptions {
  conversationId: string | null
  skipInitialLoadRef?: RefObject<unknown>
}

export interface ConversationHistoryApi {
  curHistory: SessionHistoryData
  loading: boolean
  loadHistory: (targetConversationId: string) => Promise<SessionHistoryData>
  getHistory: (targetConversationId: string) => SessionHistoryData
  setPendingTask: (
    targetConversationId: string,
    pendingTask: SessionHistoryData['pendingTask'],
  ) => void
  setHistory: (
    targetConversationId: string,
    history: SessionHistoryData,
  ) => void
  updateHistory: (
    targetConversationId: string,
    updater: (current: SessionHistoryData) => SessionHistoryData,
  ) => void
}

export function mapSessionMessagesToHistory(
  body: SessionMessages,
): SessionHistoryData {
  const messages: UIMessage[] = body.messages.flatMap((message) => {
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
    const isTaskMessage =
      message.role === 'assistant' &&
      (message.kind === 'task-created' || message.kind === 'task-info-update')
    const task = isTaskMessage ? (message.metadata as Task) : null

    return [
      {
        id: message.bubble_id,
        role: message.role,
        content: message.content,
        createdAt: message.timestamp
          ? Date.parse(message.timestamp)
          : Date.now(),
        ...(task ? { task } : {}),
        ...(images ? { images } : {}),
        ...(media ? { media } : {}),
      },
    ]
  })

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
    pendingTask: null,
  }
}

async function requestSessionHistory(
  conversationId: string,
): Promise<SessionHistoryData> {
  try {
    return mapSessionMessagesToHistory(
      await conversations_message(conversationId),
    )
  } catch (error) {
    if (error instanceof RequestError && error.status === 404) {
      return EMPTY_HISTORY
    }

    throw error
  }
}

export function useConversationHistory({
  conversationId,
  skipInitialLoadRef,
}: UseConversationHistoryOptions): ConversationHistoryApi {
  const [chatHistoryMap, setChatHistoryMap] = useState<
    Record<string, SessionHistoryData>
  >({})
  const chatHistoryMapRef =
    useRef<Record<string, SessionHistoryData>>(chatHistoryMap)
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

  const commitHistory = useCallback(
    (targetConversationId: string, history: SessionHistoryData) => {
      const nextChatHistoryMap = {
        ...chatHistoryMapRef.current,
        [targetConversationId]: history,
      }

      chatHistoryMapRef.current = nextChatHistoryMap
      setChatHistoryMap(nextChatHistoryMap)
    },
    [],
  )

  const updateHistory = useCallback<ConversationHistoryApi['updateHistory']>(
    (targetConversationId, updater) => {
      commitHistory(
        targetConversationId,
        updater(
          chatHistoryMapRef.current[targetConversationId] ?? EMPTY_HISTORY,
        ),
      )
    },
    [commitHistory],
  )

  const setPendingTask = useCallback<ConversationHistoryApi['setPendingTask']>(
    (targetConversationId, pendingTask) => {
      updateHistory(targetConversationId, (current) => ({
        ...current,
        pendingTask,
      }))
    },
    [updateHistory],
  )

  const loadPendingTask = useCallback(
    async (targetConversationId: string) => {
      const pendingTask = await conversations_pending_task(targetConversationId)

      setPendingTask(targetConversationId, pendingTask)

      return pendingTask
    },
    [setPendingTask],
  )

  const loadHistory = useCallback(
    async (targetConversationId: string) => {
      if (targetConversationId in chatHistoryMapRef.current) {
        return chatHistoryMapRef.current[targetConversationId]
      }

      setLoadingMap((currentLoadingMap) => ({
        ...currentLoadingMap,
        [targetConversationId]: true,
      }))

      try {
        const history = await requestSessionHistory(targetConversationId)
        const currentPendingTask =
          chatHistoryMapRef.current[targetConversationId]?.pendingTask

        const nextHistory = currentPendingTask
          ? {
              ...history,
              pendingTask: currentPendingTask,
            }
          : history

        commitHistory(targetConversationId, nextHistory)
        return nextHistory
      } finally {
        setLoadingMap((currentLoadingMap) => ({
          ...currentLoadingMap,
          [targetConversationId]: false,
        }))
      }
    },
    [commitHistory],
  )

  const loadConversationDetail = useCallback(
    async (targetConversationId: string) => {
      await loadHistory(targetConversationId)
      await loadPendingTask(targetConversationId)
    },
    [loadHistory, loadPendingTask],
  )

  useEffect(() => {
    if (!conversationId || skipInitialLoadRef?.current) return

    void loadConversationDetail(conversationId)
  }, [conversationId, loadConversationDetail, skipInitialLoadRef])

  const getHistory = useCallback<ConversationHistoryApi['getHistory']>(
    (targetConversationId) =>
      chatHistoryMapRef.current[targetConversationId] ?? EMPTY_HISTORY,
    [],
  )

  const curHistory = conversationId
    ? chatHistoryMap[conversationId] ?? EMPTY_HISTORY
    : EMPTY_HISTORY
  const loading = conversationId
    ? loadingMap[conversationId] === true && curHistory.messages.length === 0
    : false

  return useMemo(
    () => ({
      curHistory,
      loading,
      loadHistory,
      getHistory,
      setPendingTask,
      setHistory: commitHistory,
      updateHistory,
    }),
    [
      commitHistory,
      curHistory,
      getHistory,
      loadHistory,
      loading,
      setPendingTask,
      updateHistory,
    ],
  )
}
