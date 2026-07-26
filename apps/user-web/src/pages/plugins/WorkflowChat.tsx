import {
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Empty, Input, Skeleton, Tag, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { v4 as uuidV4 } from 'uuid'

import {
  pluginCatalogKeys,
  plugins_deleteWorkflowConversation,
  plugins_streamWorkflowMessage,
  plugins_workflowConfig,
  plugins_workflowConversations,
  plugins_workflowMessages,
} from '@/api/plugins'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function eventText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

export default function WorkflowChat() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { workflowAppId = '' } = useParams()
  const decodedWorkflowAppId = useMemo(
    () => decodeURIComponent(workflowAppId),
    [workflowAppId],
  )
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string>()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [sendError, setSendError] = useState(false)

  const configQuery = useQuery({
    queryKey: pluginCatalogKeys.workflow(decodedWorkflowAppId),
    queryFn: () => plugins_workflowConfig(decodedWorkflowAppId),
    enabled: Boolean(decodedWorkflowAppId),
  })
  const conversationsQuery = useQuery({
    queryKey: pluginCatalogKeys.workflowConversations(decodedWorkflowAppId),
    queryFn: () => plugins_workflowConversations(decodedWorkflowAppId),
    enabled: Boolean(decodedWorkflowAppId),
  })
  const messagesQuery = useQuery({
    queryKey: pluginCatalogKeys.workflowMessages(
      decodedWorkflowAppId,
      conversationId ?? '',
    ),
    queryFn: () =>
      plugins_workflowMessages(decodedWorkflowAppId, conversationId ?? ''),
    enabled: Boolean(decodedWorkflowAppId && conversationId),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      plugins_deleteWorkflowConversation(decodedWorkflowAppId, id),
    onSuccess: async (_result, deletedId) => {
      if (conversationId === deletedId) {
        setConversationId(undefined)
        setMessages([])
      }
      await queryClient.invalidateQueries({
        queryKey: pluginCatalogKeys.workflowConversations(decodedWorkflowAppId),
      })
    },
  })

  useEffect(() => {
    if (!conversationId || !messagesQuery.data) return
    setMessages(messagesQuery.data.messages)
  }, [conversationId, messagesQuery.data])

  const startNewConversation = () => {
    if (isStreaming) return
    setConversationId(undefined)
    setMessages([])
    setSendError(false)
  }

  const send = async (value = input) => {
    const message = value.trim()
    if (!message || isStreaming) return
    const requestId = uuidV4()
    const assistantId = `assistant-${requestId}`
    let resolvedConversationId = conversationId
    setMessages((current) => [
      ...current,
      { id: `user-${requestId}`, role: 'user', content: message },
      { id: assistantId, role: 'assistant', content: '' },
    ])
    setInput('')
    setSendError(false)
    setIsStreaming(true)

    try {
      await plugins_streamWorkflowMessage(
        decodedWorkflowAppId,
        {
          message,
          conversation_id: conversationId,
          request_id: requestId,
        },
        ({ type, data }) => {
          if (type === 'meta') {
            resolvedConversationId = eventText(data.conversation_id)
            setConversationId(resolvedConversationId || undefined)
          } else if (type === 'token') {
            const delta = eventText(data.delta)
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantId
                  ? { ...item, content: item.content + delta }
                  : item,
              ),
            )
          } else if (type === 'answer') {
            const answer = eventText(data.text)
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantId ? { ...item, content: answer } : item,
              ),
            )
          } else if (type === 'error') {
            throw new Error(
              eventText(data.message, 'Workflow execution failed'),
            )
          }
        },
      )
      await queryClient.invalidateQueries({
        queryKey: pluginCatalogKeys.workflowConversations(decodedWorkflowAppId),
      })
      if (resolvedConversationId) {
        await queryClient.invalidateQueries({
          queryKey: pluginCatalogKeys.workflowMessages(
            decodedWorkflowAppId,
            resolvedConversationId,
          ),
        })
      }
    } catch {
      setSendError(true)
      setMessages((current) =>
        current.filter((item) => item.id !== assistantId || item.content),
      )
    } finally {
      setIsStreaming(false)
    }
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
    <div className="grid h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full grid-cols-[260px_minmax(0,1fr)] overflow-hidden border border-(--border) bg-(--panel) max-md:grid-cols-1 max-md:grid-rows-[34vh_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-r border-(--border) bg-(--background) max-md:border-r-0 max-md:border-b">
        <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
          <Typography.Title className="mb-0! text-base!" level={2}>
            {t('pages.workflowChat.history')}
          </Typography.Title>
          <Button
            aria-label={t('pages.workflowChat.newConversation')}
            icon={<PlusOutlined />}
            size="small"
            title={t('pages.workflowChat.newConversation')}
            onClick={startNewConversation}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {conversationsQuery.data?.conversations.length ? (
            conversationsQuery.data.conversations.map((conversation) => (
              <div
                className={`mb-1 flex items-center gap-1 rounded-md border px-2 py-1 ${
                  conversation.id === conversationId
                    ? 'border-(--admin-primary) bg-(--panel)'
                    : 'border-transparent hover:bg-(--panel)'
                }`}
                key={conversation.id}
              >
                <button
                  className="min-w-0 flex-1 truncate bg-transparent px-1 py-2 text-left text-sm text-(--text-strong)"
                  type="button"
                  onClick={() => setConversationId(conversation.id)}
                >
                  {conversation.title}
                </button>
                <Button
                  aria-label={t('pages.workflowChat.deleteConversation')}
                  danger
                  icon={<DeleteOutlined />}
                  loading={
                    deleteMutation.isPending &&
                    deleteMutation.variables === conversation.id
                  }
                  size="small"
                  title={t('pages.workflowChat.deleteConversation')}
                  type="text"
                  onClick={() => deleteMutation.mutate(conversation.id)}
                />
              </div>
            ))
          ) : (
            <Empty
              description={t('pages.workflowChat.noHistory')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-(--border) px-5 py-3">
          <div className="min-w-0">
            <Typography.Title className="mb-0! truncate text-lg!" level={1}>
              {config.name}
            </Typography.Title>
            <Typography.Text className="block truncate" type="secondary">
              {config.description ?? t('pages.workflowChat.subtitle')}
            </Typography.Text>
          </div>
          <Tag color="green">{t('pages.workflowChat.connected')}</Tag>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          {messagesQuery.isFetching && conversationId ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : null}
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
                {item.content || t('pages.workflowChat.thinking')}
              </div>
            </div>
          ))}
          {sendError ? (
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
                  onClick={() => void send(question)}
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
                  void send()
                }
              }}
            />
            <Button
              aria-label={t('pages.workflowChat.send')}
              disabled={!input.trim()}
              icon={<ArrowUpOutlined />}
              loading={isStreaming}
              type="primary"
              onClick={() => void send()}
            />
          </div>
        </footer>
      </section>
    </div>
  )
}
