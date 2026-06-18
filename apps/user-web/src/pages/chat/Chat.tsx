import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Result, Spin } from 'antd'

import { PageContainer } from '@ff-ai-frontend/components'
import { AgentMsgHistory } from './components/AgentMsgHistory'
import { AgentConversation } from './components/AgentConversation'
import { TaskConfirmationSidebar } from './components/TaskConfirmationSidebar'

import { deriveWsUrl } from '@/api/chat'
import { useAgent } from '@/pages/chat/hooks/useAgent'
import { createAgentClient } from '@/pages/chat/hooks/agentClient'
import type {
  AgentClient,
  AgentClientValue,
} from '@/pages/chat/hooks/agentClient'

type BootState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'auth'; failed?: boolean }
  | { status: 'ready'; client: AgentClient }

export function ChatPage() {
  const { t } = useTranslation()
  const [state, setState] = useState<BootState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    let client: AgentClient | null = null

    const bootstrapTimer = setTimeout(() => {
      setState({ status: 'loading' })

      try {
        if (cancelled) return

        const url = deriveWsUrl()
        client = createAgentClient({ url })

        client.connect()

        setState({
          status: 'ready',
          client,
        })
      } catch (e) {
        if (cancelled) return

        const msg = (e as Error).message

        if (msg.includes('HTTP 401') || msg.includes('HTTP 403')) {
          setState({ status: 'auth', failed: true })
        } else {
          setState({ status: 'error', message: msg })
        }
      }
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(bootstrapTimer)
      client?.close()
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin description={t('pages.chat.connecting')} />
      </div>
    )
  }

  if (state.status === 'auth') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Result
          status="warning"
          title={t('pages.chat.authFailed.title')}
          subTitle={t('pages.chat.authFailed.subtitle')}
        />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Result
          status="error"
          title={t('pages.chat.connectionFailed.title')}
          subTitle={t('pages.chat.connectionFailed.subtitle')}
        />
      </div>
    )
  }

  return <ChatWorkspace client={state.client} />
}

function ChatWorkspace(agentClient: AgentClientValue) {
  const agent = useAgent(agentClient)

  return (
    <PageContainer
      className="overflow-hidden"
      style={{ height: 'calc(100vh - var(--ant-layout-header-height) - 10px)' }}
    >
      <div className="flex flex-row h-full min-h-0 overflow-hidden">
        <div className="w-64.25 h-full shrink-0 border-r border-r-(--ant-color-border-secondary) overflow-auto">
          <AgentMsgHistory
            activeKey={agent.sessions.activeKey}
            loading={agent.sessions.loading}
            sessions={agent.sessions.items}
            streamingChatIdSet={agent.sessions.streamingChatIdSet}
            onDelete={agent.actions.deleteSession}
            onNewChat={agent.actions.startNewChat}
            onSelect={agent.actions.selectSession}
          />
        </div>
        <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden">
          <div className="overflow-hidden flex-1 min-w-0 min-h-0">
            <AgentConversation conversation={agent.conversation} />
            {/* <Splitter
              className="h-full"
              styles={{
                panel: {
                  height: '100%',
                  minHeight: 0,
                  overflow: 'hidden',
                },
                root: {
                  height: '100%',
                },
              }}
            >
              <Splitter.Panel
                defaultSize="50%"
                min="20%"
                max="70%"
                style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}
              >
                <AgentConversation conversation={agent.conversation} />
              </Splitter.Panel>
              <Splitter.Panel
                collapsible
                style={{ height: '100%', minHeight: 0, overflow: 'hidden' }}
              >
                <div className="flex shrink-0 justify-end h-10 px-5 border-b border-b-(--ant-color-border-secondary)">
                  <Space>
                    <Button size="small">打开预览</Button>
                    <Button size="small">提交应用</Button>
                  </Space>
                </div>
                预览区
              </Splitter.Panel>
            </Splitter> */}
          </div>
          <TaskConfirmationSidebar
            pending={agent.conversation.taskConfirmation.pendingTask}
            submitting={agent.conversation.taskConfirmation.submitting}
            onConfirm={agent.conversation.taskConfirmation.onConfirm}
          />
        </div>
      </div>
    </PageContainer>
  )
}

export default ChatPage
