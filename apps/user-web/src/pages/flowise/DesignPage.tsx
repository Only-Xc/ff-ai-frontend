import {
  ArrowLeftOutlined,
  ReloadOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, message, Space, Spin, Typography } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import {
  buildFlowiseEditorUrl,
  createFlowiseBrowserSession,
  flowiseKeys,
  syncFlowiseDraft,
} from '@/api/flowise'
import { publishWorkflow, workflowKeys } from '@/api/workflow'

const { Title } = Typography

/**
 * Flowise Design Page
 *
 * Embeds Flowise Editor in an iframe for workflow design.
 * Designers can:
 * - Create/edit chatflow visually
 * - Save drafts
 * - Submit for production approval
 *
 * Architecture:
 *   user-web → FF-AI Backend (JWT + RBAC) → Flowise Editor (iframe)
 */
export default function FlowiseDesignPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { appId } = useParams<{ appId: string }>()

  const [iframeKey, setIframeKey] = useState(0)

  // Establish the Flowise technical session only after ff-ai authorization.
  const {
    data: browserSession,
    isLoading: sessionLoading,
    refetch: refetchSession,
  } = useQuery({
    queryKey: flowiseKeys.browserSession(appId!),
    queryFn: () => createFlowiseBrowserSession(appId!),
    enabled: !!appId,
    retry: false,
  })

  const publishMutation = useMutation({
    mutationFn: async () => {
      await syncFlowiseDraft(appId!)
      return publishWorkflow(appId!, {
        change_summary: 'Published from Flowise designer',
      })
    },
    onSuccess: () => {
      void message.success(
        t('pages.flowise.publishSuccess', 'Published for approval'),
      )
      void queryClient.invalidateQueries({ queryKey: workflowKeys.apps() })
      void navigate('/workflow')
    },
    onError: (error: Error) => {
      void message.error(
        error.message || t('pages.flowise.publishError', 'Publish failed'),
      )
    },
  })

  // Build iframe URL
  const iframeSrc = browserSession
    ? buildFlowiseEditorUrl(browserSession.ticket)
    : ''

  const handleReload = async () => {
    const { data } = await refetchSession()
    if (data) setIframeKey((k) => k + 1)
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              void navigate('/workflow')
            }}
          >
            {t('common.back', 'Back')}
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {t('pages.flowise.designTitle', 'Workflow Design')}
          </Title>
        </Space>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void handleReload()}
            title={t('pages.flowise.reload', 'Reload canvas')}
          >
            {t('common.reload', 'Reload')}
          </Button>
          <Button
            type="primary"
            icon={<RocketOutlined />}
            loading={publishMutation.isPending}
            onClick={() => publishMutation.mutate()}
          >
            {t('pages.flowise.publish', 'Publish')}
          </Button>
        </Space>
      </div>

      {sessionLoading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60vh',
          }}
        >
          <Spin
            size="large"
            tip={t('pages.flowise.loadingSession', 'Loading editor session...')}
          />
        </div>
      ) : browserSession ? (
        <iframe
          key={iframeKey}
          src={iframeSrc}
          style={{
            width: '100%',
            height: 'calc(100vh - 160px)',
            border: 'none',
            borderRadius: '8px',
          }}
          title="Flowise Editor"
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          {t('pages.flowise.sessionError', 'Failed to load editor session')}
        </div>
      )}
    </div>
  )
}
