export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed'
  | 'error'

export interface InboundRuntimeModelUpdatedEvent {
  event: 'runtime_model_updated'
  model_name?: string
  preset_name?: string
}

export interface InboundAttachedEvent {
  event: 'attached'
  chat_id: string
}

export interface InboundMessageEvent {
  event: 'message'
  chat_id: string
  run_id?: string
  text: string
  reply_to?: string
  media?: string[]
  media_urls?: { url: string; name?: string }[]
  buttons?: string[][]
  /** Original prompt before the websocket text fallback appends buttons. */
  button_prompt?: string
  /** Present when the frame is an agent breadcrumb (e.g. tool hint,
   * generic progress line) rather than a conversational reply. */
  kind?: 'tool_hint' | 'progress' | 'task-created' | 'task_confirmation' | ''
}

export interface InboundDeltaEvent {
  event: 'delta'
  chat_id: string
  run_id?: string
  text: string
  stream_id?: string
}

export interface InboundStreamEndEvent {
  event: 'stream_end'
  chat_id: string
  run_id?: string
  stream_id?: string
}

export interface InboundTurnEndEvent {
  event: 'turn_end'
  chat_id: string
  run_id?: string
}

export interface InboundSessionUpdatedEvent {
  event: 'session_updated'
  chat_id: string
}

export interface InboundCanceledEvent {
  event: 'canceled'
  chat_id: string
  run_id?: string
}

export interface InboundErrorEvent {
  event: 'error'
  chat_id?: string
  detail?: string
}

export interface InboundTaskConfirmEvent {
  event: 'task_confirmation_required'
  chat_id?: string
  confirmation_id: string
}

export type InboundEvent =
  | InboundRuntimeModelUpdatedEvent
  | InboundAttachedEvent
  | InboundMessageEvent
  | InboundDeltaEvent
  | InboundStreamEndEvent
  | InboundTurnEndEvent
  | InboundSessionUpdatedEvent
  | InboundCanceledEvent
  | InboundErrorEvent
  | InboundTaskConfirmEvent

export interface OutboundImageGeneration {
  enabled: true
  aspect_ratio?: string | null
}

export interface OutboundNewChat {
  type: 'new_chat'
}

export interface OutboundAttach {
  type: 'attach'
  chat_id: string
}

export interface OutboundCancel {
  type: 'cancel'
  run_id: string
}

export interface OutboundTaskConfirm {
  type: 'task_confirmation'
  confirmation_id: string
}

export interface OutboundMessage {
  type: 'message'
  chat_id: string
  content: string
  attachment_ids?: string[]
  image_generation?: OutboundImageGeneration
  webui?: true
}

export type Outbound =
  | OutboundNewChat
  | OutboundAttach
  | OutboundCancel
  | OutboundTaskConfirm
  | OutboundMessage
