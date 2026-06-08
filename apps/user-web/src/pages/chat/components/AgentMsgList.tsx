import { memo, useState, useEffect, useMemo, useRef } from 'react'
import { theme } from 'antd'
import {
  Bubble,
  Actions,
  type BubbleListProps,
  ThoughtChain,
  type ThoughtChainItemProps,
  Think,
  CodeHighlighter,
} from '@ant-design/x'
import {
  ExclamationCircleOutlined,
  GlobalOutlined,
  RedoOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import { XMarkdown } from '@ant-design/x-markdown'
import type { ComponentProps } from '@ant-design/x-markdown'
import { Virtuoso } from 'react-virtuoso'
import { TaskCard } from './TaskCard'
import type { AgentBubbleItem } from '@/pages/chat/hooks/useAgent'
import type { ChatTask } from '@/pages/chat/types'
import '@/assets/x-markdown-light.css'
import '@/assets/x-markdown-dark.css'

const DARK_CODE_HIGHLIGHTER_STYLE = {
  'code[class*="language-"]': {
    background: 'transparent',
    color: '#e6edf3',
    textShadow: 'none',
    fontFamily:
      '"Fira Code", "Fira Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: 1.5,
    tabSize: 2,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    background: '#0d1117',
    color: '#e6edf3',
    fontFamily:
      '"Fira Code", "Fira Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: 1.5,
    tabSize: 2,
    hyphens: 'none',
    padding: '1em',
    textShadow: 'none',
    overflow: 'auto',
    borderRadius: '0.3em',
    margin: 0,
  },
  comment: { color: 'hsl(230, 8%, 62%)', fontStyle: 'italic' },
  prolog: { color: 'hsl(230, 8%, 62%)' },
  doctype: { color: 'hsl(230, 8%, 62%)' },
  cdata: { color: 'hsl(230, 8%, 62%)' },
  punctuation: { color: 'hsl(230, 12%, 78%)' },
  property: { color: 'hsl(5, 82%, 68%)' },
  tag: { color: 'hsl(5, 82%, 68%)' },
  boolean: { color: 'hsl(35, 96%, 62%)' },
  number: { color: 'hsl(35, 96%, 62%)' },
  constant: { color: 'hsl(35, 96%, 62%)' },
  symbol: { color: 'hsl(35, 96%, 62%)' },
  deleted: { color: 'hsl(5, 82%, 68%)' },
  selector: { color: 'hsl(119, 34%, 64%)' },
  'attr-name': { color: 'hsl(35, 96%, 62%)' },
  string: { color: 'hsl(119, 34%, 64%)' },
  char: { color: 'hsl(119, 34%, 64%)' },
  builtin: { color: 'hsl(35, 96%, 62%)' },
  inserted: { color: 'hsl(119, 34%, 64%)' },
  operator: { color: 'hsl(221, 90%, 72%)' },
  entity: { color: 'hsl(230, 12%, 78%)', cursor: 'help' },
  url: { color: 'hsl(198, 88%, 66%)' },
  variable: { color: 'hsl(35, 96%, 62%)' },
  atrule: { color: 'hsl(35, 96%, 62%)' },
  'attr-value': { color: 'hsl(119, 34%, 64%)' },
  function: { color: 'hsl(221, 90%, 72%)' },
  'class-name': { color: 'hsl(35, 96%, 62%)' },
  keyword: { color: 'hsl(301, 58%, 68%)' },
  regex: { color: 'hsl(119, 34%, 64%)' },
  important: { color: 'hsl(5, 82%, 68%)', fontWeight: 'bold' },
}

const THOUGHT_CHAIN_CONFIG = {
  loading: {
    title: '正在调用模型',
    status: 'loading',
  },
  updating: {
    title: '正在调用模型',
    status: 'loading',
  },
  success: {
    title: '大模型执行完成',
    status: 'success',
  },
  error: {
    title: '执行失败',
    status: 'error',
  },
  abort: {
    title: '已经终止',
    status: 'abort',
  },
}

const ThinkComponent = memo((props: ComponentProps) => {
  const [title, setTitle] = useState(`'深度思考中'...`)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (props.streamStatus === 'done') {
      setTitle('深度思考完成')
      setLoading(false)
    }
  }, [props.streamStatus])

  return (
    <Think title={title} loading={loading}>
      {props.children}
    </Think>
  )
})

const CodeComponent = memo((props: ComponentProps) => {
  const { className, children } = props
  const lang = className?.match(/language-(\w+)/)?.[1] ?? ''

  const { theme: antdTheme } = theme.useToken()
  const isDark = antdTheme.id !== 0

  if (typeof children !== 'string') return null
  return (
    <CodeHighlighter
      lang={lang}
      highlightProps={
        isDark ? { style: DARK_CODE_HIGHLIGHTER_STYLE } : undefined
      }
      styles={
        isDark
          ? {
              header: {
                background: '#161b22',
                color: '#c9d1d9',
              },
              code: {
                background: '#0d1117',
                borderColor: '#30363d',
              },
            }
          : undefined
      }
    >
      {children}
    </CodeHighlighter>
  )
})

const MARKDOWN_COMPONENTS = {
  think: ThinkComponent,
  code: CodeComponent,
}

const STREAMING_RENDER_INTERVAL = 50
const VIRTUOSO_DEFAULT_ITEM_HEIGHT = 160
const VIRTUOSO_OVERSCAN = { main: 800, reverse: 800 }
const VIRTUOSO_VIEWPORT_PRELOAD = { top: 1200, bottom: 1600 }

type AgentBubbleRole = NonNullable<BubbleListProps['role']>
type AgentBubbleRoleConfig = AgentBubbleRole[string]

export interface AgentMsgListProps {
  items: AgentBubbleItem[]
}

interface AgentMessageBubbleProps {
  item: AgentBubbleItem
  role: AgentBubbleRole
}

interface RenderedBubbleProps {
  item: AgentBubbleItem
  roleConfig?: AgentBubbleRoleConfig
}

function getTypingKey(typing: AgentBubbleItem['typing']) {
  if (!typing || typeof typing !== 'object') return String(typing)

  return JSON.stringify(typing) ?? ''
}

function getTaskKey(item: AgentBubbleItem) {
  return item.task ? JSON.stringify(item.task) : ''
}

function isSameBubbleItem(prev: AgentBubbleItem, next: AgentBubbleItem) {
  return (
    prev.key === next.key &&
    prev.role === next.role &&
    prev.content === next.content &&
    prev.loading === next.loading &&
    prev.streaming === next.streaming &&
    getTypingKey(prev.typing) === getTypingKey(next.typing) &&
    getTaskKey(prev) === getTaskKey(next)
  )
}

const RenderedBubble = memo(function RenderedBubble({
  item,
  roleConfig,
}: RenderedBubbleProps) {
  const { key, ...bubbleProps } = item

  return <Bubble key={key} {...roleConfig} {...bubbleProps} />
}, areRenderedBubblePropsEqual)

function areRenderedBubblePropsEqual(
  prev: RenderedBubbleProps,
  next: RenderedBubbleProps,
) {
  return (
    prev.roleConfig === next.roleConfig &&
    isSameBubbleItem(prev.item, next.item)
  )
}

function useThrottledValue<T>(value: T, interval: number, enabled: boolean) {
  const [throttledValue, setThrottledValue] = useState(value)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestValueRef = useRef(value)
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    latestValueRef.current = value

    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      lastUpdateRef.current = Date.now()
      setThrottledValue(value)
      return
    }

    const now = Date.now()
    const elapsed = now - lastUpdateRef.current

    if (elapsed >= interval) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      lastUpdateRef.current = now
      setThrottledValue(value)
      return
    }

    timeoutRef.current ??= setTimeout(() => {
      timeoutRef.current = null
      lastUpdateRef.current = Date.now()
      setThrottledValue(latestValueRef.current)
    }, interval - elapsed)
  }, [enabled, interval, value])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return throttledValue
}

const AgentMessageBubble = memo(function AgentMessageBubble({
  item,
  role,
}: AgentMessageBubbleProps) {
  const content = typeof item.content === 'string' ? item.content : ''
  const isStreamingAi =
    item.role === 'ai' &&
    typeof item.content === 'string' &&
    ((item.streaming ?? false) || (item.loading ?? false))
  const throttledContent = useThrottledValue(
    content,
    STREAMING_RENDER_INTERVAL,
    isStreamingAi,
  )
  const bubbleItem = useMemo(
    () => (isStreamingAi ? { ...item, content: throttledContent } : item),
    [isStreamingAi, item, throttledContent],
  )
  const roleConfig =
    typeof bubbleItem.role === 'string' ? role[bubbleItem.role] : undefined

  return (
    <div className="py-1 text-base">
      <RenderedBubble item={bubbleItem} roleConfig={roleConfig} />
    </div>
  )
}, areMessageBubblePropsEqual)

function areMessageBubblePropsEqual(
  prev: AgentMessageBubbleProps,
  next: AgentMessageBubbleProps,
) {
  return prev.role === next.role && isSameBubbleItem(prev.item, next.item)
}

export function AgentMsgList({ items }: AgentMsgListProps) {
  const { theme: antdTheme, token } = theme.useToken()
  const isDark = antdTheme.id !== 0

  const aiActionItems = (content: string) => [
    {
      key: 'copy',
      actionRender: () => {
        return <Actions.Copy text={content} />
      },
    },
    {
      key: 'retry',
      icon: <RedoOutlined />,
      label: '刷新',
    },
  ]

  const userActionItems = (content: string) => [
    {
      key: 'copy',
      actionRender: () => {
        return <Actions.Copy text={content} />
      },
    },
  ]

  const role = useMemo<AgentBubbleRole>(() => {
    const className = isDark ? 'x-markdown-dark' : 'x-markdown-light'

    return {
      ai: {
        placement: 'start',
        variant: 'borderless',
        avatar: <RobotOutlined />,
        style: {
          maxWidth: '760px',
          margin: '0 auto',
          paddingInline: '8px 0',
        },
        header: (_, { status }) => {
          const config =
            THOUGHT_CHAIN_CONFIG[status as keyof typeof THOUGHT_CHAIN_CONFIG]
          return config ? (
            <ThoughtChain.Item
              style={{
                marginBottom: 8,
              }}
              status={config.status as ThoughtChainItemProps['status']}
              variant="solid"
              icon={<GlobalOutlined />}
              title={config.title}
            />
          ) : null
        },
        footer: (content: string) => <Actions items={aiActionItems(content)} />,
        contentRender: (content: string, { status }) => {
          return (
            <XMarkdown
              paragraphTag="div"
              components={MARKDOWN_COMPONENTS}
              className={className}
              streaming={{
                hasNextChunk: status === 'updating',
                enableAnimation: true,
              }}
            >
              {content}
            </XMarkdown>
          )
        },
      },
      user: {
        placement: 'end',
        avatar: false,
        style: {
          maxWidth: '760px',
          margin: '0 auto',
        },
        styles: {
          content: {
            fontSize: '16px',
          },
        },
        extra: (content: string) => (
          <Actions items={userActionItems(content)} />
        ),
      },
      task: {
        placement: 'start',
        variant: 'borderless',
        avatar: <RobotOutlined />,
        style: {
          maxWidth: '760px',
          margin: '0 auto',
          paddingInline: '8px 0',
        },
        contentRender: (content: ChatTask) => (
          <div className="w-full min-w-90">
            <TaskCard task={content} />
          </div>
        ),
      },
      error: {
        placement: 'start',
        variant: 'outlined',
        avatar: <ExclamationCircleOutlined />,
        style: {
          maxWidth: '760px',
          margin: '0 auto',
          paddingInline: '8px 0',
        },
        header: () => (
          <div
            className="mb-2 text-sm font-medium"
            style={{ color: token.colorError }}
          >
            执行失败
          </div>
        ),
        footer: (content: string) => (
          <Actions items={userActionItems(content)} />
        ),
        styles: {
          body: {
            background: token.colorErrorBg,
            borderColor: token.colorErrorBorder,
            borderWidth: 1,
            borderStyle: 'solid',
            borderRadius: token.borderRadiusLG,
          },
          content: {
            color: token.colorErrorText,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          },
        },
      },
    }
  }, [
    isDark,
    token.borderRadiusLG,
    token.colorError,
    token.colorErrorBg,
    token.colorErrorBorder,
    token.colorErrorText,
  ])

  return (
    <div className="min-h-0 flex-1 py-2">
      <Virtuoso
        className="h-full [scrollbar-color:var(--scrollbar-thumb)_transparent] scrollbar-thin [&::-webkit-scrollbar]:size-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-(--scrollbar-thumb) [&::-webkit-scrollbar-thumb:hover]:bg-(--scrollbar-thumb-hover)"
        computeItemKey={(_, item: AgentBubbleItem) => item.key}
        data={items}
        defaultItemHeight={VIRTUOSO_DEFAULT_ITEM_HEIGHT}
        followOutput={(isAtBottom) => (isAtBottom ? 'smooth' : false)}
        increaseViewportBy={VIRTUOSO_VIEWPORT_PRELOAD}
        itemContent={(_, item: AgentBubbleItem) => (
          <AgentMessageBubble item={item} role={role} />
        )}
        overscan={VIRTUOSO_OVERSCAN}
        style={{ height: '100%' }}
      />
    </div>
  )
}
