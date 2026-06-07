import { Spin } from 'antd'
import { AgentWelcome } from './AgentWelcome'
import { AgentMsgList } from './AgentMsgList'
import { AgentSender } from './AgentSender'

import type { AgentConversationState } from '@/pages/chat/hooks/useAgent'

interface AgentConversationProps {
  conversation: AgentConversationState
}

export function AgentConversation({ conversation }: AgentConversationProps) {
  const { bubbleItems, loading, messages, sender } = conversation

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex flex-col flex-1 min-h-0 w-full overflow-hidden ">
        {loading ? (
          <div className="flex min-h-full items-center justify-center">
            <Spin />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center gap-5 min-h-full">
            <AgentWelcome></AgentWelcome>
          </div>
        ) : (
          <AgentMsgList items={bubbleItems}></AgentMsgList>
        )}
      </div>
      <div className="p-2 pt-1">
        <div className="max-w-190 mx-auto">
          <AgentSender
            attachments={sender.attachments}
            loading={sender.loading}
            value={sender.value}
            onChange={sender.onChange}
            onSubmit={sender.onSubmit}
            onCancel={sender.onCancel}
          ></AgentSender>
        </div>
      </div>
    </div>
  )
}
