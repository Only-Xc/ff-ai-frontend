import {
  ArrowUpOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  MessageOutlined,
  PlusOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Empty, Input, Skeleton, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
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

function formatConversationTime(value: string) {
  const date = dayjs(value)
  if (!date.isValid()) return ''
  if (date.isSame(dayjs(), 'day')) return date.format('HH:mm')
  if (date.isSame(dayjs(), 'year')) return date.format('MMM D')
  return date.format('YYYY-MM-DD')
}

export default function WorkflowChat() {
  const { workflowAppId = '' } = useParams()
  const decodedWorkflowAppId = useMemo(
    () => decodeURIComponent(workflowAppId),
    [workflowAppId],
  )

  return (
    <WorkflowChatView
      key={decodedWorkflowAppId}
      workflowAppId={decodedWorkflowAppId}
    />
  )
}

function WorkflowChatView({ workflowAppId }: { workflowAppId: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const decodedWorkflowAppId = workflowAppId
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string>()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [sendError, setSendError] = useState(false)
  const streamControllerRef = useRef<AbortController | null>(null)

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

  useEffect(
    () => () => {
      streamControllerRef.current?.abort()
    },
    [],
  )

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
    const streamController = new AbortController()
    let resolvedConversationId = conversationId
    streamControllerRef.current = streamController
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
          } else if (type === 'answer_replace') {
            const replacement = eventText(data.text)
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantId
                  ? { ...item, content: replacement }
                  : item,
              ),
            )
          } else if (type === 'error') {
            throw new Error(
              eventText(data.message, 'Workflow execution failed'),
            )
          }
        },
        streamController.signal,
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
      if (streamController.signal.aborted) return
      setSendError(true)
      setMessages((current) =>
        current.filter((item) => item.id !== assistantId || item.content),
      )
    } finally {
      if (streamControllerRef.current === streamController) {
        streamControllerRef.current = null
        setIsStreaming(false)
      }
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
  const conversations = conversationsQuery.data?.conversations ?? []
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
    <div className="grid h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full grid-cols-[292px_minmax(0,1fr)] overflow-hidden rounded-lg border border-(--border) bg-(--panel) max-md:grid-cols-1 max-md:grid-rows-[38vh_minmax(0,1fr)] max-md:rounded-none">
      <aside className="flex min-h-0 flex-col border-r border-(--border) bg-[color-mix(in_srgb,var(--background)_72%,var(--panel))] max-md:border-r-0 max-md:border-b">
        <div className="border-b border-(--border) px-4 pt-4 pb-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Typography.Title className="mb-0! text-[15px]!" level={2}>
              {t('pages.workflowChat.history')}
            </Typography.Title>
            <span
              className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--border)_74%,transparent)] bg-(--panel) px-2 text-[11px] font-semibold tabular-nums text-(--muted)"
              title={t('pages.workflowChat.historyCount', {
                count: conversations.length,
              })}
            >
              {conversations.length}
            </span>
          </div>
          <Button
            aria-label={t('pages.workflowChat.newConversation')}
            block
            icon={<PlusOutlined />}
            title={t('pages.workflowChat.newConversation')}
            type="primary"
            onClick={startNewConversation}
          >
            {t('pages.workflowChat.newConversation')}
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {conversations.length ? (
            <>
              <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-normal text-(--muted)">
                {t('pages.workflowChat.recent')}
              </div>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {conversations.map((conversation) => {
                  const active = conversation.id === conversationId
                  const updatedAt = formatConversationTime(
                    conversation.updated_at || conversation.created_at,
                  )
                  return (
                    <li key={conversation.id}>
                      <div
                        className={`group relative flex min-h-15 items-stretch overflow-hidden rounded-lg border transition-[background-color,border-color,box-shadow] duration-150 ${
                          active
                            ? 'border-[color-mix(in_srgb,var(--admin-primary)_32%,var(--border))] bg-[color-mix(in_srgb,var(--admin-primary)_9%,var(--panel))] shadow-[inset_3px_0_0_var(--admin-primary),0_1px_2px_rgb(15_23_42/0.04)]'
                            : 'border-transparent hover:border-[color-mix(in_srgb,var(--border)_80%,transparent)] hover:bg-(--panel)'
                        }`}
                      >
                        <button
                          aria-current={active ? 'page' : undefined}
                          className="flex min-w-0 flex-1 items-center gap-3 border-0 bg-transparent px-3 py-2.5 text-left text-(--text-strong) outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--focus-ring)"
                          title={conversation.title}
                          type="button"
                          onClick={() => setConversationId(conversation.id)}
                        >
                          <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-md border ${
                              active
                                ? 'border-[color-mix(in_srgb,var(--admin-primary)_24%,transparent)] bg-[color-mix(in_srgb,var(--admin-primary)_12%,var(--panel))] text-(--admin-primary)'
                                : 'border-(--border) bg-(--background) text-(--muted)'
                            }`}
                          >
                            <MessageOutlined />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium leading-5">
                              {conversation.title}
                            </span>
                            {updatedAt ? (
                              <span className="mt-0.5 flex items-center gap-1 text-[11px] leading-4 text-(--muted)">
                                <ClockCircleOutlined className="text-[10px]" />
                                <time dateTime={conversation.updated_at}>
                                  {t('pages.workflowChat.updated', {
                                    time: updatedAt,
                                  })}
                                </time>
                              </span>
                            ) : null}
                          </span>
                        </button>
                        <Button
                          aria-label={t(
                            'pages.workflowChat.deleteConversation',
                          )}
                          className="my-auto mr-1.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
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
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <Empty
              className="mt-8"
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
