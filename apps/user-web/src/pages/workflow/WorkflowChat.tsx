import { SendOutlined, StopOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Input, List, Space, Tag, Typography } from 'antd'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { v4 as uuidv4 } from 'uuid'

import {
  createChatSSEUrl,
  getRuntimeConfig,
  workflowKeys,
} from '@/api/workflow'

const { Text, Paragraph } = Typography

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  citations?: Array<{ document: string; score: number }>
  status?: 'streaming' | 'done' | 'error'
}

interface SSEEventData {
  run_id?: string
  conversation_id?: string
  delta?: string
  citations?: Array<{ document: string; score: number }>
  status?: string
}

export default function WorkflowChat() {
  const { t } = useTranslation()
  const { appId } = useParams<{ appId: string }>()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const abortRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: runtimeConfig } = useQuery({
    queryKey: [...workflowKeys.all, 'runtime-config', appId],
    queryFn: () => getRuntimeConfig(appId!),
    enabled: !!appId,
  })

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input,
    }
    const assistantMsgId = uuidv4()
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      status: 'streaming',
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput('')
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const requestId = uuidv4()
      const response = await fetch(createChatSSEUrl(appId!), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
        },
        body: JSON.stringify({
          request_id: requestId,
          input: input,
          conversation_id: conversationId,
        }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            continue
          }
          if (!line.startsWith('data: ')) continue
          const dataStr = line.slice(6)
          try {
            const data = JSON.parse(dataStr) as SSEEventData

            if (data.run_id && !conversationId && data.conversation_id) {
              setConversationId(data.conversation_id)
            }

            if (data.delta) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + data.delta }
                    : m,
                ),
              )
            } else if (data.citations) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, citations: data.citations }
                    : m,
                ),
              )
            } else if (data.status === 'COMPLETED' || data.status === 'FAILED') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, status: data.status === 'COMPLETED' ? 'done' : 'error' }
                    : m,
                ),
              )
            }
          } catch {
            // skip non-JSON lines
          }
        }
        scrollToBottom()
      }

      // Mark as done if not already
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId && m.status === 'streaming'
            ? { ...m, status: 'done' }
            : m,
        ),
      )
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: t('pages.workflow.chatError'), status: 'error' }
              : m,
          ),
        )
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
      scrollToBottom()
    }
  }

  const handleStop = () => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }

  const config = runtimeConfig

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0' }}>
        <Space>
          <Text strong style={{ fontSize: 16 }}>
            {config?.name ?? t('pages.workflow.chat')}
          </Text>
          {config?.description && (
            <Text type="secondary">{config.description}</Text>
          )}
        </Space>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* Opening message */}
        {messages.length === 0 && config?.opening_message && (
          <Card style={{ marginBottom: 16, background: '#f9f9f9' }}>
            <Paragraph>{config.opening_message}</Paragraph>
            {config.suggested_questions && config.suggested_questions.length > 0 && (
              <Space wrap>
                {config.suggested_questions.map((q: string, i: number) => (
                  <Tag
                    key={i}
                    color="blue"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setInput(q)}
                  >
                    {q}
                  </Tag>
                ))}
              </Space>
            )}
          </Card>
        )}

        <List
          dataSource={messages}
          renderItem={(msg) => (
            <List.Item
              style={{
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                border: 'none',
                padding: '4px 0',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: msg.role === 'user' ? '#1677ff' : '#f4f4f5',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content || (msg.status === 'streaming' ? '...' : '')}
                {msg.citations && msg.citations.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                    {msg.citations.map((c, i) => (
                      <div key={i}>
                        [{c.document}] score: {c.score.toFixed(2)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid #f0f0f0' }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
            placeholder={t('pages.workflow.chatPlaceholder')}
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button
              type="default"
              danger
              icon={<StopOutlined />}
              onClick={handleStop}
            >
              {t('pages.workflow.stop')}
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => { void handleSend() }}
              disabled={!input.trim()}
            />
          )}
        </Space.Compact>
      </div>
    </div>
  )
}
