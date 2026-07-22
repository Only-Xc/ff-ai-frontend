import { ArrowUpOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Alert, Button, Input, Skeleton, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'

import {
  pluginCatalogKeys,
  plugins_sendWorkflowMessage,
  plugins_workflowConfig,
} from '@/api/plugins'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  simulated?: boolean
}

export default function WorkflowChat() {
  const { t } = useTranslation()
  const { workflowAppId = '' } = useParams()
  const decodedWorkflowAppId = useMemo(
    () => decodeURIComponent(workflowAppId),
    [workflowAppId],
  )
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string>()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const configQuery = useQuery({
    queryKey: pluginCatalogKeys.workflow(decodedWorkflowAppId),
    queryFn: () => plugins_workflowConfig(decodedWorkflowAppId),
    enabled: Boolean(decodedWorkflowAppId),
  })
  const messageMutation = useMutation({
    mutationFn: (message: string) =>
      plugins_sendWorkflowMessage(decodedWorkflowAppId, {
        message,
        conversation_id: conversationId,
        request_id: crypto.randomUUID(),
      }),
    onSuccess: (result) => {
      setConversationId(result.conversation_id)
      setMessages((current) => [
        ...current,
        {
          id: result.request_id,
          role: 'assistant',
          content: result.answer,
          simulated: result.simulated,
        },
      ])
    },
  })

  const send = (value = input) => {
    const message = value.trim()
    if (!message || messageMutation.isPending) return
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'user', content: message },
    ])
    setInput('')
    messageMutation.mutate(message)
  }

  if (configQuery.isPending) return <Skeleton active paragraph={{ rows: 10 }} />
  if (configQuery.isError || !configQuery.data) {
    return (
      <Alert
        message={t('pages.workflowChat.loadFailed')}
        showIcon
        type="error"
      />
    )
  }

  const config = configQuery.data
  const displayMessages = messages.length
    ? messages
    : config.opening_statement
      ? [
          {
            id: 'opening',
            role: 'assistant' as const,
            content: config.opening_statement,
          },
        ]
      : []

  return (
    <div className="mx-auto flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full max-w-5xl flex-col border-x border-(--border) bg-(--panel)">
      <header className="flex shrink-0 items-center justify-between border-b border-(--border) px-5 py-3">
        <div className="min-w-0">
          <Typography.Title className="mb-0! truncate text-lg!" level={1}>
            {config.name}
          </Typography.Title>
          <Typography.Text type="secondary">
            {config.description ?? t('pages.workflowChat.subtitle')}
          </Typography.Text>
        </div>
        <Tag color={config.runtime_mode === 'mock' ? 'gold' : 'green'}>
          {config.runtime_mode === 'mock'
            ? t('pages.workflowChat.simulation')
            : t('pages.workflowChat.connected')}
        </Tag>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        {displayMessages.map((item) => (
          <div
            className={`flex gap-3 ${item.role === 'user' ? 'flex-row-reverse' : ''}`}
            key={item.id}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-(--border) bg-(--panel)">
              {item.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
            </span>
            <div
              className={`max-w-[78%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-6 ${
                item.role === 'user'
                  ? 'bg-(--admin-primary) text-white'
                  : 'border border-(--border) bg-(--background) text-(--text-strong)'
              }`}
            >
              {item.content}
              {item.simulated ? (
                <div className="mt-2 text-xs opacity-70">
                  {t('pages.workflowChat.simulatedReply')}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {messageMutation.isError ? (
          <Alert
            message={t('pages.workflowChat.sendFailed')}
            showIcon
            type="error"
          />
        ) : null}
      </main>

      <footer className="shrink-0 border-t border-(--border) p-4">
        {config.suggested_questions.length && !messages.length ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {config.suggested_questions.map((question) => (
              <Button
                key={question}
                size="small"
                onClick={() => send(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 5 }}
            placeholder={t('pages.workflowChat.placeholder')}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onPressEnter={(event) => {
              if (!event.shiftKey) {
                event.preventDefault()
                send()
              }
            }}
          />
          <Button
            aria-label={t('pages.workflowChat.send')}
            disabled={!input.trim()}
            icon={<ArrowUpOutlined />}
            loading={messageMutation.isPending}
            type="primary"
            onClick={() => send()}
          />
        </div>
      </footer>
    </div>
  )
}
