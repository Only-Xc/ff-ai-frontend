import { XMarkdown } from '@ant-design/x-markdown'
import { theme } from 'antd'

import type { MarkdownBlockProps } from '../types'

interface MarkdownBlockComponentProps {
  props: MarkdownBlockProps
}

export function MarkdownBlock({ props }: MarkdownBlockComponentProps) {
  const { theme: antdTheme } = theme.useToken()
  const isDark = antdTheme.id !== 0

  return (
    <div className="text-sm leading-6">
      <XMarkdown
        paragraphTag="div"
        className={isDark ? 'x-markdown x-markdown-dark' : 'x-markdown x-markdown-light'}
      >
      {props.content}
      </XMarkdown>
    </div>
  )
}
