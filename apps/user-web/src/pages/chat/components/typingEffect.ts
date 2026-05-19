import type { UIMessage } from '@/api/types'

export function canUseTypingEffect(
  message: UIMessage & { id: `hist-${string}` },
): false
export function canUseTypingEffect(message: UIMessage): boolean
export function canUseTypingEffect(message: UIMessage): boolean {
  return (
    message.role === 'assistant' &&
    !message.isStreaming &&
    message.kind !== 'trace' &&
    !message.id.startsWith('hist-')
  )
}
