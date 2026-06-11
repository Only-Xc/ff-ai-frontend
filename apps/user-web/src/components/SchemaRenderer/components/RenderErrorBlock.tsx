import { Alert } from 'antd'
import { useTranslation } from 'react-i18next'

import type { SchemaRenderError } from '../types'

interface RenderErrorBlockProps {
  title?: string
  errors: SchemaRenderError[]
}

export function RenderErrorBlock({
  title,
  errors,
}: RenderErrorBlockProps) {
  const { t } = useTranslation()
  const description =
    errors.length === 0
      ? undefined
      : errors.map((error) => `${error.path}: ${error.message}`).join('\n')

  return (
    <Alert
      showIcon
      type="error"
      title={title ?? t('pages.schema.renderFailed')}
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
