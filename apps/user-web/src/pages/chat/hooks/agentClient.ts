import {
  EventEmitter,
  WebSocketWrapper,
  type WebSocketWrapperState,
} from '@ff-ai-frontend/utils'

import type {
  ConnectionStatus,
  InboundEvent,
  Outbound,
  OutboundImageGeneration,
  OutboundMessage,
  InboundAttachedEvent,
  OutboundTaskConfirm,
} from '@/pages/chat/hooks/agentTypes'
import { ExecutableQueue } from '@/utils/executableQueue'
import { i18n } from '@/i18n'
import { globalNotification } from '@/utils/message'

type Unsubscribe = () => void
type EventHandler = (ev: InboundEvent) => void

interface AgentChatListenerOptions {
  chatId: string
  handler: EventHandler
}

interface AgentChatEvent {
  chatId: string
  event: InboundEvent
}

interface AgentClientEventMap {
  chat: AgentChatEvent
}

interface PendingNewChat {
  resolve: (chatId: string) => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
}

interface AgentClientOptions {
  url: string
}

export interface AgentClient {
  attach: (chatId: string) => void
  close: () => void
  connect: () => void
  cancelChat: (chatId: string) => void
  cancelRun: (runId: string) => void
  detach: (chatId: string) => void
  newChat: (timeoutMs?: number) => Promise<string>
  on: (type: 'chat', options: AgentChatListenerOptions) => Unsubscribe
  sendMessage: (chatId: string, content: string, options?: SendOptions) => void
  taskConfirm: (confirmationId: string) => void
}

const NEW_CHAT_TIMEOUT_MS = 5_000 // new-chat 到 attached 的超时时间
const RECONNECT_INTERVAL_MS = 500 // 初始重连间隔
const MAX_RECONNECT_INTERVAL_MS = 15_000 // 最大重连间隔

function removeEmptyFields<T extends object>(payload: T): T {
  const cleaned: Partial<T> = {}

  for (const key of Object.keys(payload) as (keyof T)[]) {
    const value = payload[key]

    if (value == null || (Array.isArray(value) && value.length === 0)) {
      continue
    }

    cleaned[key] = value
  }

  return cleaned as T
}

function parseInboundEvent(data: MessageEvent['data']): InboundEvent | null {
  if (typeof data !== 'string') return null

  try {
    return JSON.parse(data) as InboundEvent
  } catch {
    return null
  }
}

/**
 * Agent WebSocket 客户端。
 *
 * 职责：
 * 1. 对外提供 newChat / attach / detach / sendMessage / cancelRun / cancelChat 等通信能力。
 * 2. 维护连接状态、重连后的会话恢复和待发送队列。
 * 3. 识别 attached 回执的来源，并按 chat_id 分发服务端事件。
 */
class WebSocketAgentClient implements AgentClient {
  private readonly emitter = new EventEmitter<AgentClientEventMap>() // 负责管理agent服务端事件（或内部事件）
  private readonly subscribedChatIds = new Set<string>() // 当chat激活时将进行记录，方便后期如果断网重连之后的处理
  private readonly pendingAttachAckChatIds = new Set<string>() // 区分 attach 和 new_chat 的逻辑
  private readonly sendQueue = new ExecutableQueue<Outbound>()
  private readonly socket: WebSocketWrapper
  private closedByUser = false
  private pendingNewChat: PendingNewChat | null = null // new-chat 到 attached 之间的状态管理（因为new-chat没有id，防止匹配不到attached传回来的chatId）
  private _status: ConnectionStatus = 'idle'

  constructor(options: AgentClientOptions) {
    this.socket = new WebSocketWrapper(options.url, {
      autoConnect: false,
      heartbeatInterval: 0,
      maxReconnectAttempts: Number.POSITIVE_INFINITY,
      maxReconnectInterval: MAX_RECONNECT_INTERVAL_MS,
      reconnectInterval: RECONNECT_INTERVAL_MS,
      shouldReconnect: () => !this.closedByUser,
    })
    this.bindSocket()
  }

  attach(chatId: string): void {
    // attach 的语义是“订阅这个会话的后续事件”，不是拉历史消息。
    this.subscribedChatIds.add(chatId)

    if (this._status !== 'open') return

    this.pendingAttachAckChatIds.add(chatId)
    this.queueSend({ type: 'attach', chat_id: chatId })
  }

  detach(chatId: string): void {
    this.subscribedChatIds.delete(chatId)
    this.pendingAttachAckChatIds.delete(chatId)
  }

  newChat(timeoutMs = NEW_CHAT_TIMEOUT_MS): Promise<string> {
    // 协议保证同一时间只挂一个 new_chat 请求，避免 attached 无法归因。
    if (this.pendingNewChat) {
      return Promise.reject(new Error('newChat already in flight'))
    }

    // new_chat 需要和本次连接上的 attached 一一对应。
    if (this._status !== 'open') {
      return Promise.reject(new Error('socket not open'))
    }

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(
        () => this.rejectPendingNewChat(new Error('newChat timed out')),
        timeoutMs,
      )

      this.pendingNewChat = { resolve, reject, timer }

      if (!this.socket.sendJson({ type: 'new_chat' })) {
        this.rejectPendingNewChat(new Error('socket not open'))
      }
    })
  }

  sendMessage(chatId: string, content: string, options?: SendOptions): void {
    // 消息发送同样会把 chat 记入订阅集合，防止断线后漏掉重订阅。
    this.subscribedChatIds.add(chatId)
    const frame = removeEmptyFields<OutboundMessage>({
      type: 'message',
      chat_id: chatId,
      content,
      attachment_ids: options?.attachmentIds,
      image_generation: options?.imageGeneration,
      webui: true,
    })

    this.queueSend(frame)
  }

  cancelRun(runId: string): void {
    this.queueSend({ type: 'cancel', run_id: runId })
  }

  cancelChat(chatId: string): void {
    this.queueSend({ type: 'cancel', chat_id: chatId })
  }

  taskConfirm(confirmationId: string): void {
    const frame: OutboundTaskConfirm = {
      type: 'task_confirmation',
      confirmation_id: confirmationId,
    }

    this.queueSend(frame)
  }

  connect(): void {
    this.closedByUser = false
    this.socket.connect()
  }

  close(): void {
    this.closedByUser = true
    this.rejectPendingNewChat(new Error('socket closed'))
    this.pendingAttachAckChatIds.clear()
    this.sendQueue.clear()
    this.socket.destroy()
    this._status = 'closed'
  }

  on(_type: 'chat', options: AgentChatListenerOptions): Unsubscribe {
    const { chatId, handler } = options

    // 订阅 chat 的同时立刻确保服务端已 attach。
    this.attach(chatId)

    return this.emitter.on('chat', (payload) => {
      if (payload.chatId === chatId) {
        handler(payload.event)
      }
    })
  }

  private bindSocket(): void {
    // WebSocketWrapper 暴露的是底层连接事件，这里把它们收窄成页面需要的语义。
    this.socket.on('open', () => {
      this.handleSocketOpen()
    })
    this.socket.on('message', (event) => {
      this.handleSocketMessage(event)
    })
    this.socket.on('error', () => {
      this._status = 'error'
    })
    this.socket.on('close', (event) => {
      this.handleSocketClose(event)
    })
    this.socket.on('stateChange', ({ current }) => {
      this.handleSocketStateChange(current)
    })
  }

  private handleSocketOpen(): void {
    // 重连后先恢复订阅，再把断线期间缓存的帧一次性发出去。
    for (const chatId of this.subscribedChatIds) {
      this.pendingAttachAckChatIds.add(chatId)
      this.socket.sendJson({ type: 'attach', chat_id: chatId })
    }

    this.flushQueue()
  }

  private handleSocketClose(event: CloseEvent): void {
    // 连接断掉时，正在等待的新会话创建也要立即失败返回。
    this.rejectPendingNewChat(new Error('socket closed'))
    this.pendingAttachAckChatIds.clear()

    if (event.code === 1009) {
      globalNotification.error({
        message: i18n.t('pages.chat.agentClient.payloadTooLarge.title'),
        description: i18n.t(
          'pages.chat.agentClient.payloadTooLarge.description',
        ),
        placement: 'topRight',
      })
    }
  }

  private handleSocketMessage(event: MessageEvent): void {
    const parsed = parseInboundEvent(event.data)

    if (!parsed) return

    const eventHandlers: Partial<
      Record<InboundEvent['event'], (event: InboundEvent) => void>
    > = {
      attached: (event) =>
        this.handleAttachedEvent(event as InboundAttachedEvent),
    }
    const handler = eventHandlers[parsed.event]

    if (handler) {
      handler(parsed)
      return
    }

    this.dispatchChatEvent(parsed)
  }

  private handleSocketStateChange(state: WebSocketWrapperState): void {
    if (state === 'connecting') {
      this._status = 'connecting'
      return
    }

    if (state === 'reconnecting') {
      this._status = 'reconnecting'
      return
    }

    if (state === 'open') {
      this._status = 'open'
      return
    }

    if (state === 'closed' || state === 'closing') {
      this._status = 'closed'
    }
  }

  private queueSend(frame: Outbound): void {
    // 队列负责把“连接未就绪”的发送请求转成“连接恢复后补发”。
    this.sendQueue.executeOrEnqueue(frame, (item) => this.socket.sendJson(item))
  }

  private flushQueue(): void {
    this.sendQueue.flush((frame) => this.socket.sendJson(frame))
  }

  private handleAttachedEvent(event: InboundAttachedEvent): void {
    const wasSubscribedChat = this.subscribedChatIds.has(event.chat_id)
    const isAttachAck = this.pendingAttachAckChatIds.delete(event.chat_id)

    this.subscribedChatIds.add(event.chat_id)

    // new_chat 成功后的首次确认
    if (!wasSubscribedChat && !isAttachAck) {
      this.resolvePendingNewChat(event.chat_id)
    }

    this.dispatchChatEvent(event)
  }

  private dispatchChatEvent(event: InboundEvent): void {
    const chatId = 'chat_id' in event ? event.chat_id : null

    if (!chatId) return

    // 带 chat_id 的事件统一按会话路由分发。
    this.emitter.emit('chat', { chatId, event })
  }

  private rejectPendingNewChat(error: Error): void {
    if (!this.pendingNewChat) return

    clearTimeout(this.pendingNewChat.timer)
    this.pendingNewChat.reject(error)
    this.pendingNewChat = null
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

export interface SendOptions {
  attachmentIds?: string[]
  imageGeneration?: OutboundImageGeneration
}
