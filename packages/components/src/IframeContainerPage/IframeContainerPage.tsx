import { Button, Result } from 'antd'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

import { PageContainer } from '../PageContainer/index.js'
import { useComponentsI18n } from '../locale/index.js'
import { WujieReact, type WujieReactProps } from './WujieReact.js'
import { wujieIframeAttrs } from './iframeConfig.js'
import { getTaskPreviewUrl } from './taskPreviewUrl.js'

export interface IframeContainerPageProps
  extends Omit<WujieReactProps, 'attrs' | 'name' | 'url'> {
  backPath?: string
  backText?: ReactNode
  getPreviewUrl?: (taskId: string) => string
  missingTitle?: ReactNode
  taskId?: string
}

export function IframeContainerPage({
  backPath = '/chat',
  backText,
  getPreviewUrl = getTaskPreviewUrl,
  missingTitle,
  taskId,
  ...wujieProps
}: IframeContainerPageProps) {
  const { t } = useComponentsI18n()
  const navigate = useNavigate()

  if (!taskId) {
    return (
      <Result
        extra={
          <Button type="primary" onClick={() => void navigate(backPath)}>
            {backText ?? t('TaskPreview.backToWorkspace')}
          </Button>
        }
        status="warning"
        title={missingTitle ?? t('TaskPreview.missingAppId')}
      />
    )
  }

  return (
    <PageContainer className="h-full w-full overflow-hidden">
      <WujieReact
        key={taskId}
        attrs={wujieIframeAttrs}
        degrade
        name={`iframe-container-${taskId}`}
        url={getPreviewUrl(taskId)}
        {...wujieProps}
      />
    </PageContainer>
  )
}

export default IframeContainerPage
