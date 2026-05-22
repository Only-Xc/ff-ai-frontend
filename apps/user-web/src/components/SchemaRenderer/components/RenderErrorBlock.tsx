import { Alert } from 'antd'

import type { SchemaRenderError } from '../types'

interface RenderErrorBlockProps {
  title?: string
  errors: SchemaRenderError[]
}

export function RenderErrorBlock({
  title = 'Schema 渲染失败',
  errors,
}: RenderErrorBlockProps) {
  const description =
    errors.length === 0
      ? undefined
      : errors.map((error) => `${error.path}: ${error.message}`).join('\n')

  return (
    <Alert
      showIcon
      type="error"
      message={title}
      description={
        description ? (
          <pre className="m-0 whitespace-pre-wrap font-mono text-xs">
            {description}
          </pre>
        ) : undefined
      }
    />
  )
}
