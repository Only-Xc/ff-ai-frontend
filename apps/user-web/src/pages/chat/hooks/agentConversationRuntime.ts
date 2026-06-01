import type { UIMessage } from '@/pages/chat/types'
import type { SessionHistoryData } from '@/pages/chat/hooks/useConversationHistory'

interface StreamBuffer {
  messageId: string
  parts: string[]
}

export interface ConversationRuntime {
  // 当前流式 assistant 占位消息的缓冲区。
  buffer: StreamBuffer | null
  // 当前正在运行的 run_id，用于 stop 时优先发送 cancel。
  currentRunId: string | null
}

export type LiveAction =
  | {
      type: 'delta_received'
      messageId: string
      content: string
      createdAt: number
    }
  | {
      type: 'message_received'
      message: UIMessage
      replaceMessageId?: string
    }
  | {
      type: 'stream_canceled'
      messageId: string
      content: string
      createdAt: number
    }
  | { type: 'stream_finished' }
  | { type: 'stream_ended' }

export function createConversationRuntime(): ConversationRuntime {
  return {
    buffer: null,
    currentRunId: null,
  }
}

function stopStreamingMessages(messages: UIMessage[]): UIMessage[] {
  return messages.map((message) =>
    message.isStreaming ? { ...message, isStreaming: false } : message,
  )
}

function replaceMessageById(
  messages: UIMessage[],
  messageId: string,
  nextMessage: UIMessage,
): UIMessage[] | null {
  const targetIndex = messages.findIndex((message) => message.id === messageId)

  if (targetIndex === -1) {
    return null
  }

  return messages.map((message, index) =>
    index === targetIndex ? nextMessage : message,
  )
}

function createStreamingAssistantMessage(
  messageId: string,
  content: string,
  createdAt: number,
): UIMessage {
  return {
    id: messageId,
    role: 'assistant',
    content,
    isStreaming: true,
    createdAt,
  }
}

function upsertStreamingMessage(
  messages: UIMessage[],
  action: Extract<LiveAction, { type: 'delta_received' }>,
): UIMessage[] {
  const lastMessage = messages[messages.length - 1]

  if (lastMessage?.id === action.messageId) {
    return [
      ...messages.slice(0, -1),
      { ...lastMessage, content: action.content, isStreaming: true },
    ]
  }

  const replacedMessages = replaceMessageById(
    messages,
    action.messageId,
    createStreamingAssistantMessage(
      action.messageId,
      action.content,
      lastMessage?.createdAt ?? action.createdAt,
    ),
  )

  if (replacedMessages) {
    return replacedMessages
  }

  return [
    ...messages,
    createStreamingAssistantMessage(
      action.messageId,
      action.content,
      action.createdAt,
    ),
  ]
}

function appendOrReplaceMessage(
  messages: UIMessage[],
  action: Extract<LiveAction, { type: 'message_received' }>,
): UIMessage[] {
  if (!action.replaceMessageId) {
    return [...messages, action.message]
  }

  return (
    replaceMessageById(messages, action.replaceMessageId, action.message) ?? [
      ...messages,
      action.message,
    ]
  )
}

export function liveReducer(
  state: SessionHistoryData,
  action: LiveAction,
): SessionHistoryData {
  if (action.type === 'delta_received') {
    // delta 只负责更新一条流式 assistant 消息，不做最终汇总。
    return {
      ...state,
      messages: upsertStreamingMessage(state.messages, action),
      hasPendingToolCalls: false,
    }
  }

  if (action.type === 'message_received') {
    // 结构化 message 默认作为独立 assistant 消息追加。
    // 如果本轮没有 delta，直接替换 optimistic assistant 占位。
    return {
      ...state,
      messages: appendOrReplaceMessage(state.messages, action),
      hasPendingToolCalls: false,
    }
  }

  if (action.type === 'stream_canceled') {
    // canceled 会结束 streaming，并额外插入一条可见的取消痕迹消息。
    return {
      ...state,
      messages: [
        ...stopStreamingMessages(state.messages),
        {
          id: action.messageId,
          role: 'tool',
          kind: 'trace',
          content: action.content,
          traces: [action.content],
          createdAt: action.createdAt,
        },
      ],
      hasPendingToolCalls: false,
    }
  }

  if (action.type === 'stream_finished') {
    // stream_end 只表示本次 delta 流结束，真正收口仍然等 turn_end。
    return state
  }

  if (action.type === 'stream_ended') {
    // turn_end / 本地 stop 都会走到这里，统一清理 streaming 标记。
    return {
      ...state,
      messages: stopStreamingMessages(state.messages),
      hasPendingToolCalls: false,
    }
  }

  return state
}
