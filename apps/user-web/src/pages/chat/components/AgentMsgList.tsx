import { memo, useState, useEffect } from 'react'
import { theme } from 'antd'
import {
  Bubble,
  type BubbleItemType,
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

export interface AgentMsgListProps {
  items: BubbleItemType[]
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

  const getRole = (className: string): BubbleListProps['role'] => ({
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
            components={{
              think: ThinkComponent,
              code: CodeComponent,
            }}
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
      extra: (content: string) => <Actions items={userActionItems(content)} />,
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
      footer: (content: string) => <Actions items={userActionItems(content)} />,
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
  })

  return (
    <div className="min-h-0">
      <Bubble.List
        autoScroll
        items={items}
        role={getRole(isDark ? 'x-markdown-dark' : 'x-markdown-light')}
        styles={{
          root: { height: '100%' },
          scroll: { height: '100%' },
          content: {
            fontSize: '16px',
          },
        }}
      />
    </div>
  )
}
