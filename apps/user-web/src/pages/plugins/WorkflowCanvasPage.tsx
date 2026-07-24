import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Space, Spin, Typography } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import {
  buildFlowiseEditorUrl,
  createFlowiseBrowserSession,
  flowiseKeys,
} from '@/api/flowise'

const { Title } = Typography

export default function WorkflowCanvasPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { workflowAppId = '' } = useParams()
  const appId = decodeURIComponent(workflowAppId)
  const [iframeKey, setIframeKey] = useState(0)
  const sessionQuery = useQuery({
    queryKey: flowiseKeys.browserSession(appId),
    queryFn: () => createFlowiseBrowserSession(appId),
    enabled: Boolean(appId),
    retry: false,
  })
  const iframeSrc = sessionQuery.data
    ? buildFlowiseEditorUrl(
        sessionQuery.data.chatflow_id,
        sessionQuery.data.user,
      )
    : ''

  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 flex-col p-6">
      <header className="mb-4 flex shrink-0 items-center justify-between gap-4">
        <Space>
          <Button
            aria-label={t('common.back', 'Back')}
            icon={<ArrowLeftOutlined />}
            onClick={() => void navigate('/platform-apps')}
          />
          <Title className="mb-0! text-lg!" level={1}>
            {t('routes.workflowChat.title', 'Workflow App')}
          </Title>
        </Space>
        <Button
          aria-label={t('pages.flowise.reload', 'Reload canvas')}
          disabled={!sessionQuery.data}
          icon={<ReloadOutlined />}
          onClick={() => setIframeKey((current) => current + 1)}
        />
      </header>

      {sessionQuery.isPending ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Spin
            size="large"
            tip={t('pages.flowise.loadingSession', 'Loading editor session...')}
          />
        </div>
      ) : sessionQuery.isError || !sessionQuery.data ? (
        <Alert
          action={
            <Button size="small" onClick={() => void sessionQuery.refetch()}>
              {t('common.actions.retry', 'Retry')}
            </Button>
          }
          message={t(
            'pages.flowise.sessionError',
            'Failed to load editor session',
          )}
          showIcon
          type="error"
        />
      ) : (
        <iframe
          key={iframeKey}
          className="min-h-0 flex-1 border-0"
          src={iframeSrc}
          title={t('routes.workflowChat.title', 'Workflow App')}
        />
      )}
    </div>
  )
}
