import { Result } from 'antd'

import { useComponentsI18n } from '../locale/index.js'
import { WujieReact, type WujieReactProps } from './WujieReact.js'
import { wujieIframeAttrs } from './iframeConfig.js'
import { getTaskPreviewUrl } from './taskPreviewUrl.js'

export interface IframeStandalonePageProps
  extends Omit<WujieReactProps, 'attrs' | 'name' | 'url'> {
  getPreviewUrl?: (taskId: string) => string
  missingTitle?: string
  taskId?: string
}

export function IframeStandalonePage({
  getPreviewUrl = getTaskPreviewUrl,
  missingTitle,
  taskId: taskIdProp,
  ...wujieProps
}: IframeStandalonePageProps) {
  const { t } = useComponentsI18n()
  const taskId = taskIdProp?.trim()

  if (!taskId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-(--panel)">
        <Result
          status="warning"
          title={missingTitle ?? t('TaskPreview.missingAppId')}
        />
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-hidden bg-(--panel)">
      <WujieReact
        key={taskId}
        attrs={wujieIframeAttrs}
        degrade
        name={`iframe-container-${taskId}`}
        url={getPreviewUrl(taskId)}
        {...wujieProps}
      />
    </div>
  )
}
