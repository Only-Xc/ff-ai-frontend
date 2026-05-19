import { WebSocketWrapper } from '@ff-ai-frontend/utils'
import type { WebSocketWrapperState } from '@ff-ai-frontend/utils'

import type {
  ConnectionStatus,
  InboundEvent,
  Outbound,
  OutboundImageGeneration,
  OutboundMedia,
  UIImage,
} from '@/api/types'
import { ExecutableQueue } from '@/utils/executableQueue'

const NEW_CHAT_TIMEOUT_MS = 5_000
const RECONNECT_INTERVAL_MS = 500
const MAX_RECONNECT_INTERVAL_MS = 15_000
const MESSAGE_TOO_BIG_CODE = 1009

type Unsubscribe = () => void
type EventHandler = (ev: InboundEvent) => void
type StatusHandler = (status: ConnectionStatus) => void
type ReadyEvent = Extract<InboundEvent, { event: 'ready' }>
type AttachedEvent = Extract<InboundEvent, { event: 'attached' }>

export interface StreamError {
  kind: 'message_too_big'
}

interface PendingNewChat {
  resolve: (chatId: string) => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export interface AgentClientOptions {
  url: string
  reconnect?: boolean
  maxBackoffMs?: number
}

export interface AgentClient {
  readonly status: ConnectionStatus
  readonly defaultChatId: string | null
  attach: (chatId: string) => void
  close: () => void
  connect: () => void
  cancelRun: (runId: string) => void
  newChat: (timeoutMs?: number) => Promise<string>
  onChat: (chatId: string, handler: EventHandler) => Unsubscribe
  onError: (handler: (error: StreamError) => void) => Unsubscribe
  onStatus: (handler: StatusHandler) => Unsubscribe
  sendMessage: (
    chatId: string,
    content: string,
    media?: OutboundMedia[],
    options?: { imageGeneration?: OutboundImageGeneration },
  ) => void
}

// 这一层只负责 websocket 协议抽象：
// 1. 管理连接和重连
// 2. 把服务端事件路由到具体 chat_id
// 3. 暴露 newChat / attach / sendMessage / cancelRun 等能力
class WebSocketAgentClient implements AgentClient {
  // 每个 chat_id 可以有多个订阅方，但当前页面通常只会有一个消费 hook。
  private readonly chatHandlers = new Map<string, Set<EventHandler>>()
  private readonly errorHandlers = new Set<(error: StreamError) => void>()
  // 已知会话会在重连成功后自动补发 attach。
  private readonly knownChats = new Set<string>()
  // attach 回执和 new_chat 回执都长成 attached，需要单独跟踪显式 attach。
  private readonly pendingAttachAcks = new Set<string>()
  private readonly reconnect: boolean
  private readonly sendQueue = new ExecutableQueue<Outbound>()
  private readonly socket: WebSocketWrapper
  private readonly statusHandlers = new Set<StatusHandler>()
  private closedByUser = false
  private pendingNewChat: PendingNewChat | null = null
  private readyChatId: string | null = null
  private status_: ConnectionStatus = 'idle'

  constructor(options: AgentClientOptions) {
    this.reconnect = options.reconnect ?? true
    this.socket = new WebSocketWrapper(options.url, {
      autoConnect: false,
      heartbeatInterval: 0,
      maxReconnectAttempts: this.reconnect ? Number.POSITIVE_INFINITY : 0,
      maxReconnectInterval: options.maxBackoffMs ?? MAX_RECONNECT_INTERVAL_MS,
      reconnectInterval: RECONNECT_INTERVAL_MS,
      shouldReconnect: () => !this.closedByUser && this.reconnect,
    })
    this.bindSocket()
  }

  get status(): ConnectionStatus {
    return this.status_
  }

  get defaultChatId(): string | null {
    return this.readyChatId
  }

  attach(chatId: string): void {
    // attach 的语义是“订阅这个会话的后续事件”，不是拉历史消息。
    this.rememberKnownChat(chatId)
    this.attachIfOpen(chatId)
  }

  close(): void {
    this.closedByUser = true
    this.rejectPendingNewChat(new Error('socket closed'))
    this.pendingAttachAcks.clear()
    this.sendQueue.clear()
    this.socket.destroy()
    this.setStatus('closed')
  }

  connect(): void {
    this.closedByUser = false
    this.socket.connect()
  }

  cancelRun(runId: string): void {
    this.queueSend({ type: 'cancel', run_id: runId })
  }

  newChat(timeoutMs = NEW_CHAT_TIMEOUT_MS): Promise<string> {
    // 协议保证同一时间只挂一个 new_chat 请求，避免 attached 无法归因。
    if (this.pendingNewChat) {
      return Promise.reject(new Error('newChat already in flight'))
    }

    // new_chat 需要和本次连接上的 attached 一一对应。
    if (this.status_ !== 'open') {
      return Promise.reject(new Error('socket not open'))
    }

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(
        () => this.rejectPendingNewChat(new Error('newChat timed out')),
        timeoutMs,
      )

      this.pendingNewChat = { resolve, reject, timer }

      if (!this.sendFrame({ type: 'new_chat' })) {
        this.rejectPendingNewChat(new Error('socket not open'))
      }
    })
  }

  onChat(chatId: string, handler: EventHandler): Unsubscribe {
    let handlers = this.chatHandlers.get(chatId)

    if (!handlers) {
      handlers = new Set<EventHandler>()
      this.chatHandlers.set(chatId, handlers)
    }

    handlers.add(handler)
    // 订阅 chat 的同时立刻确保服务端已 attach。
    this.attach(chatId)

    return () => {
      const current = this.chatHandlers.get(chatId)

      if (!current) return

      current.delete(handler)

      if (current.size === 0) {
        this.chatHandlers.delete(chatId)
      }
    }
  }

  onError(handler: (error: StreamError) => void): Unsubscribe {
    this.errorHandlers.add(handler)

    return () => {
      this.errorHandlers.delete(handler)
    }
  }

  onStatus(handler: StatusHandler): Unsubscribe {
    this.statusHandlers.add(handler)
    handler(this.status_)

    return () => {
      this.statusHandlers.delete(handler)
    }
  }

  sendMessage(
    chatId: string,
    content: string,
    media?: OutboundMedia[],
    options?: { imageGeneration?: OutboundImageGeneration },
  ): void {
    // 消息发送同样会把 chat 记入 knownChats，防止断线后漏掉重订阅。
    this.rememberKnownChat(chatId)
    this.queueSend({
      type: 'message',
      chat_id: chatId,
      content,
      ...(media && media.length > 0 ? { media } : {}),
      ...(options?.imageGeneration
        ? { image_generation: options.imageGeneration }
        : {}),
      webui: true,
    })
  }

  private bindSocket(): void {
    // WebSocketWrapper 暴露的是底层连接事件，这里把它们收窄成页面需要的语义。
    this.socket.on('open', () => {
      this.handleSocketOpen()
    })
    this.socket.on('message', (event) => {
      this.handleMessage(event)
    })
    this.socket.on('error', () => {
      this.setStatus('error')
    })
    this.socket.on('close', (event) => {
      this.handleSocketClose(event)
    })
    this.socket.on('stateChange', ({ current }) => {
      this.syncStatusFromSocketState(current)
    })
  }

  private attachIfOpen(chatId: string): void {
    if (this.status_ !== 'open') return

    this.markAttachPending(chatId)
    this.queueSend({ type: 'attach', chat_id: chatId })
  }

  private consumePendingAttachAck(chatId: string): boolean {
    return this.pendingAttachAcks.delete(chatId)
  }

  private dispatch(chatId: string, event: InboundEvent): void {
    const handlers = this.chatHandlers.get(chatId)

    if (!handlers) return

    for (const handler of handlers) {
      handler(event)
    }
  }

  private emitError(error: StreamError): void {
    for (const handler of this.errorHandlers) {
      try {
        handler(error)
      } catch {
        // 错误通知不影响连接维护。
      }
    }
  }

  private flushQueue(): void {
    this.sendQueue.flush((frame) => this.sendFrame(frame))
  }

  private handleSocketClose(event: CloseEvent): void {
    // 连接断掉时，正在等待的新会话创建也要立即失败返回。
    this.rejectPendingNewChat(new Error('socket closed'))
    this.pendingAttachAcks.clear()

    if (event.code === MESSAGE_TOO_BIG_CODE) {
      this.emitError({ kind: 'message_too_big' })
    }
  }

  private handleMessage(event: MessageEvent): void {
    const parsed = this.parseInboundEvent(event.data)

    if (!parsed) return

    if (parsed.event === 'ready') {
      this.handleReadyEvent(parsed)
      return
    }

    if (parsed.event === 'attached') {
      this.handleAttachedEvent(parsed)
      return
    }

    this.dispatchChatEvent(parsed)
  }

  private handleSocketOpen(): void {
    // 重连后先恢复订阅，再把断线期间缓存的帧一次性发出去。
    for (const chatId of this.knownChats) {
      this.markAttachPending(chatId)
      this.sendFrame({ type: 'attach', chat_id: chatId })
    }

    this.flushQueue()
  }

  private hasKnownChat(chatId: string): boolean {
    return this.knownChats.has(chatId)
  }

  private queueSend(frame: Outbound): void {
    // 队列负责把“连接未就绪”的发送请求转成“连接恢复后补发”。
    this.sendQueue.executeOrEnqueue(frame, (item) => this.sendFrame(item))
  }

  private rejectPendingNewChat(error: Error): void {
    if (!this.pendingNewChat) return

    clearTimeout(this.pendingNewChat.timer)
    this.pendingNewChat.reject(error)
    this.pendingNewChat = null
  }

  private sendFrame(frame: Outbound): boolean {
    return this.socket.sendJson(frame)
  }

  private parseInboundEvent(data: MessageEvent['data']): InboundEvent | null {
    if (typeof data !== 'string') return null

    try {
      return JSON.parse(data) as InboundEvent
    } catch {
      return null
    }
  }

  private handleReadyEvent(event: ReadyEvent): void {
    // ready 只声明“默认 chat 路由键已经可用”。
    this.readyChatId = event.chat_id
    this.rememberKnownChat(event.chat_id)
  }

  private handleAttachedEvent(event: AttachedEvent): void {
    // attached 既可能来自显式 attach，也可能来自 new_chat 成功后的首次确认。
    const wasKnownChat = this.hasKnownChat(event.chat_id)
    const isAttachAck = this.consumePendingAttachAck(event.chat_id)

    this.rememberKnownChat(event.chat_id)

    if (!wasKnownChat && !isAttachAck) {
      this.resolvePendingNewChat(event.chat_id)
    }

    this.dispatch(event.chat_id, event)
  }

  private dispatchChatEvent(event: InboundEvent): void {
    const chatId = 'chat_id' in event ? event.chat_id : null

    if (!chatId) return

    // 除 ready 之外，其余带 chat_id 的事件统一按会话路由分发。
    this.dispatch(chatId, event)
  }

  private syncStatusFromSocketState(state: WebSocketWrapperState): void {
    if (state === 'connecting') {
      this.setStatus('connecting')
      return
    }

    if (state === 'reconnecting') {
      this.setStatus('reconnecting')
      return
    }

    if (state === 'open') {
      this.setStatus('open')
      return
    }

    if (state === 'closed' || state === 'closing') {
      this.setStatus('closed')
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status_ === status) return

    this.status_ = status

    for (const handler of this.statusHandlers) {
      handler(status)
    }
  }

  private markAttachPending(chatId: string): void {
    this.pendingAttachAcks.add(chatId)
  }

  private rememberKnownChat(chatId: string): void {
    this.knownChats.add(chatId)
  }

  private resolvePendingNewChat(chatId: string): void {
    if (!this.pendingNewChat) return

    clearTimeout(this.pendingNewChat.timer)
    this.pendingNewChat.resolve(chatId)
    this.pendingNewChat = null
  }
}

export interface AgentClientValue {
  client: AgentClient
}

export function createAgentClient(options: AgentClientOptions): AgentClient {
  return new WebSocketAgentClient(options)
}

export interface SendImage {
  media: OutboundMedia
  preview: UIImage
}

export interface SendOptions {
  imageGeneration?: OutboundImageGeneration
}
