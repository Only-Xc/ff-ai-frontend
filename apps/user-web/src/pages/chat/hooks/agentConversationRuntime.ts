import { toMediaAttachment } from '../../../api/media.ts'
import type { InboundEvent, UIMessage } from '../../../api/types.ts'

const EMPTY_MESSAGES: UIMessage[] = []

interface ConversationStreamError {
  kind: 'message_too_big'
}

export interface LiveState {
  // Live 状态只关心当前页面内这次会话的 websocket 增量。
  messages: UIMessage[]
  isStreaming: boolean
  streamError: ConversationStreamError | null
}

interface StreamBuffer {
  messageId: string
  parts: string[]
}

export interface ConversationRuntime {
  // 当前流式 assistant 占位消息的缓冲区。
  buffer: StreamBuffer | null
  // 当前正在运行的 run_id，用于 stop 时优先发送 cancel。
  currentRunId: string | null
  // 草稿会话发送后，等待页面切到正式 chatId 的过渡标记。
  pendingChatId: string | null
}

export type LiveAction =
  | { type: 'chat_reset' }
  | {
      type: 'state_restored'
      messages: UIMessage[]
      isStreaming: boolean
    }
  | {
      type: 'turn_started'
      userMessage: UIMessage
      assistantMessage: UIMessage
    }
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
  | { type: 'stream_error'; error: ConversationStreamError }
  | { type: 'error_dismissed' }

export const INITIAL_LIVE_STATE: LiveState = {
  messages: EMPTY_MESSAGES,
  isStreaming: false,
  streamError: null,
}

export function createConversationRuntime(): ConversationRuntime {
  return {
    buffer: null,
    currentRunId: null,
    pendingChatId: null,
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

function clearRuntimeBuffer(runtime: ConversationRuntime): void {
  runtime.buffer = null
}

function clearRuntimeStreamingState(runtime: ConversationRuntime): void {
  runtime.currentRunId = null
  runtime.buffer = null
}

function ensureRuntimeBuffer(
  runtime: ConversationRuntime,
  createMessageId: () => string,
): StreamBuffer {
  const messageId = runtime.buffer?.messageId ?? createMessageId()

  runtime.buffer ??= {
    messageId,
    parts: [],
  }

  return runtime.buffer
}

function restoreRuntimeBufferFromState(
  state: LiveState,
  runtime: ConversationRuntime,
): void {
  if (runtime.buffer) return

  for (let index = state.messages.length - 1; index >= 0; index -= 1) {
    const message = state.messages[index]

    if (message.role !== 'assistant' || !message.isStreaming) {
      continue
    }

    runtime.buffer = {
      messageId: message.id,
      parts: message.content ? [message.content] : [],
    }
    return
  }
}

function createStructuredMessage(
  event: Extract<InboundEvent, { event: 'message' }>,
  createMessageId: () => string,
  now: number,
): UIMessage | null {
  const media = event.media_urls?.length
    ? event.media_urls.map((item) => toMediaAttachment(item))
    : event.media?.map((url) => toMediaAttachment({ url }))
  const hasMedia = !!media && media.length > 0
  const hasButtons = !!event.buttons?.length

  // 纯文本 message 仅作为协议兼容帧保留，不参与正文展示。
  if (!hasMedia && !hasButtons) {
    return null
  }

  return {
    id: createMessageId(),
    role: 'assistant',
    content: hasButtons ? (event.button_prompt ?? event.text) : event.text,
    createdAt: now,
    ...(hasButtons ? { buttons: event.buttons } : {}),
    ...(hasMedia ? { media } : {}),
  }
}

export function liveReducer(state: LiveState, action: LiveAction): LiveState {
  if (action.type === 'chat_reset') {
    return INITIAL_LIVE_STATE
  }

  if (action.type === 'state_restored') {
    return {
      messages: action.messages,
      isStreaming: action.isStreaming,
      streamError: null,
    }
  }

  if (action.type === 'turn_started') {
    // 用户发送后立刻插入 user + assistant 占位，形成 optimistic UI。

    return {
      messages: [
        ...state.messages,
        action.userMessage,
        action.assistantMessage,
      ],
      isStreaming: true,
      streamError: null,
    }
  }

  if (action.type === 'delta_received') {
    // delta 只负责更新一条流式 assistant 消息，不做最终汇总。
    return {
      ...state,
      isStreaming: true,
      messages: upsertStreamingMessage(state.messages, action),
    }
  }

  if (action.type === 'message_received') {
    // 结构化 message 默认作为独立 assistant 消息追加。
    // 如果本轮没有 delta，直接替换 optimistic assistant 占位。
    return {
      ...state,
      isStreaming: true,
      messages: appendOrReplaceMessage(state.messages, action),
    }
  }

  if (action.type === 'stream_canceled') {
    // canceled 会结束 streaming，并额外插入一条可见的取消痕迹消息。
    return {
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
      isStreaming: false,
      streamError: state.streamError,
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
      isStreaming: false,
    }
  }

  if (action.type === 'stream_error') {
    return {
      ...state,
      streamError: action.error,
    }
  }

  return {
    ...state,
    streamError: null,
  }
}

interface HandleConversationEventOptions {
  event: InboundEvent
  runtime: ConversationRuntime
  dispatch: (action: LiveAction) => void
  createMessageId: () => string
  now: number
}

function handleConversationEvent({
  event,
  runtime,
  dispatch,
  createMessageId,
  now,
}: HandleConversationEventOptions): void {
  if (event.event === 'attached' || event.event === 'error') {
    return
  }

  if (event.event === 'delta') {
    // delta 是流式正文的唯一来源。
    if (event.run_id) {
      runtime.currentRunId = event.run_id
    }

    const buffer = ensureRuntimeBuffer(runtime, createMessageId)
    buffer.parts.push(event.text)

    dispatch({
      type: 'delta_received',
      messageId: buffer.messageId,
      content: buffer.parts.join(''),
      createdAt: now,
    })
    return
  }

  if (event.event === 'stream_end') {
    runtime.currentRunId = event.run_id ?? runtime.currentRunId
    clearRuntimeBuffer(runtime)
    dispatch({ type: 'stream_finished' })
    return
  }

  if (event.event === 'turn_end') {
    clearRuntimeStreamingState(runtime)
    dispatch({ type: 'stream_ended' })
    return
  }

  if (event.event === 'canceled') {
    clearRuntimeStreamingState(runtime)
    dispatch({
      type: 'stream_canceled',
      messageId: createMessageId(),
      content: '此条消息已取消',
      createdAt: now,
    })
    return
  }

  if (event.event !== 'message') {
    return
  }

  runtime.currentRunId = event.run_id ?? runtime.currentRunId

  if (event.kind === 'tool_hint' || event.kind === 'progress') {
    return
  }

  const message = createStructuredMessage(event, createMessageId, now)
  const shouldReplacePlaceholder = !!runtime.buffer && runtime.buffer.parts.length === 0

  if (!message) {
    return
  }

  dispatch({
    type: 'message_received',
    message,
    ...(shouldReplacePlaceholder
      ? { replaceMessageId: runtime.buffer?.messageId }
      : {}),
  })

  if (shouldReplacePlaceholder) {
    clearRuntimeBuffer(runtime)
  }
}

interface ConversationEventOptions {
  state: LiveState
  event: InboundEvent
  runtime: ConversationRuntime
  createMessageId: () => string
  now: number
}

function collectConversationActions({
  state,
  event,
  runtime,
  createMessageId,
  now,
}: ConversationEventOptions): LiveAction[] {
  const actions: LiveAction[] = []

  if (event.event === 'delta') {
    restoreRuntimeBufferFromState(state, runtime)
  }

  handleConversationEvent({
    event,
    runtime,
    dispatch: (action) => {
      actions.push(action)
    },
    createMessageId,
    now,
  })

  return actions
}

interface ApplyConversationEventOptions extends ConversationEventOptions {
  dispatch: (action: LiveAction) => void
}

export function applyConversationEvent({
  dispatch,
  ...options
}: ApplyConversationEventOptions): void {
  for (const action of collectConversationActions(options)) {
    dispatch(action)
  }
}

export function syncConversationRuntimeFromState(
  state: LiveState,
  runtime: ConversationRuntime,
): void {
  restoreRuntimeBufferFromState(state, runtime)
}

export function reduceConversationEvent({
  state,
  ...options
}: ConversationEventOptions): LiveState {
  return collectConversationActions({
    state,
    ...options,
  }).reduce(liveReducer, state)
}

interface StopConversationClient {
  cancelRun: (runId: string) => void
  sendMessage: (chatId: string, content: string) => void
}

interface StopConversationOptions {
  chatId: string | null
  runtime: ConversationRuntime
  dispatch: (action: LiveAction) => void
  client: StopConversationClient
}

export function stopConversation({
  chatId,
  runtime,
  dispatch,
  client,
}: StopConversationOptions): void {
  if (!chatId) return

  // 先在本地把 streaming 收口，再尝试终止服务端当前 run。
  dispatch({ type: 'stream_ended' })

  if (runtime.currentRunId) {
    client.cancelRun(runtime.currentRunId)
    runtime.currentRunId = null
    return
  }

  client.sendMessage(chatId, '/stop')
}
