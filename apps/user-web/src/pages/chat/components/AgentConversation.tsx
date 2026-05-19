import { Alert, Spin } from 'antd'
import { AgentWelcome } from './AgentWelcome'
import { AgentMsgList } from './AgentMsgList'
import { AgentSender } from './AgentSender'

import type { AgentConversationState } from '@/pages/chat/hooks/useAgent'

interface AgentConversationProps {
  conversation: AgentConversationState
}

export function AgentConversation({ conversation }: AgentConversationProps) {
  const {
    bubbleItems,
    dismissStreamError,
    loading,
    messages,
    sender,
    streamError,
  } = conversation

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
          {streamError ? (
            <Alert
              showIcon
              closable
              type="error"
              title="连接异常"
              description={
                streamError.kind === 'message_too_big'
                  ? '发送内容超过服务端限制，请减少附件大小后重试。'
                  : '消息发送失败，请稍后重试。'
              }
              onClose={dismissStreamError}
              className="mb-2"
            />
          ) : null}
          <AgentSender
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
