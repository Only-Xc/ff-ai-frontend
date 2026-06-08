import type { PendingTaskConfirmation } from '@/api/chat'
import type { ChatTask } from '@/pages/chat/types'

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
  bubble_id: string
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
  kind?: 'tool_hint' | 'progress' | 'task_confirmation' | ''
}

export interface InboundTaskProcessingEvent extends ChatTask {
  event: 'task-created' | 'task-info-update'
  chat_id: string
  conversation_id?: string
  'message-type'?: string
  bubble_id: string
  text: string
}

export interface InboundDeltaEvent {
  event: 'delta'
  chat_id: string
  bubble_id: string
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
  conversation_id?: string
  confirmation_id: string
  title: string
  task_type: NonNullable<PendingTaskConfirmation['pending_task_confirmation']>['task_type']
  markdown: string
  'message-type'?: string
}

export type InboundEvent =
  | InboundRuntimeModelUpdatedEvent
  | InboundAttachedEvent
  | InboundMessageEvent
  | InboundTaskProcessingEvent
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

export type OutboundCancel =
  | {
      type: 'cancel'
      run_id: string
    }
  | {
      type: 'cancel'
      chat_id: string
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
