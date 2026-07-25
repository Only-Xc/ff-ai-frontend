import { ArrowLeftOutlined } from '@ant-design/icons'
import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Empty, Skeleton } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import {
  workflowAdminAppGraph_get,
  workflowAdminKeys,
  workflowAdminVersionGraph_get,
} from '@/api/workflow-admin'

import { FlowiseEmbedCanvas } from './FlowiseEmbedCanvas'
import { FlowiseReadonlyCanvas } from './FlowiseReadonlyCanvas'
import './FlowiseReadonlyCanvas.css'

export default function FlowiseReviewPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { appId } = useParams<{ appId: string }>()
  const [searchParams] = useSearchParams()
  const versionId = searchParams.get('versionId')?.trim() ?? undefined
  const fallbackPath = versionId
    ? '/production/approvals'
    : '/workflow-admin/apps'

  // For version views, fetch the frozen graph JSON
  const { data, isLoading, isError } = useQuery({
    queryKey: versionId
      ? workflowAdminKeys.versionGraph(versionId)
      : workflowAdminKeys.appGraph(appId ?? ''),
    queryFn: () =>
      versionId
        ? workflowAdminVersionGraph_get(versionId)
        : workflowAdminAppGraph_get(appId!),
    enabled: Boolean(versionId ?? appId),
    retry: false,
  })
  const readonlyFallback = data ? (
    <>
      <PageHeader title={data.name} />
      {data.graph_json.nodes.length === 0 ? (
        <Empty description={t('pages.flowise.emptyGraph')} />
      ) : (
        <FlowiseReadonlyCanvas
          graph={data.graph_json}
          ariaLabel={t('pages.flowise.canvasAriaLabel')}
        />
      )}
    </>
  ) : null
  const canEmbedFlowise =
    data?.source === 'draft' || Boolean(data?.flowise_runtime_chatflow_id)

  return (
    <PageContainer className="p-5">
      <div className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            if (window.history.length > 1) {
              void navigate(-1)
              return
            }
            void navigate(fallbackPath)
          }}
        >
          {t('common.actions.back')}
        </Button>
      </div>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : isError ? (
        <Alert
          type="error"
          showIcon
          message={t('pages.flowise.graphLoadError')}
        />
      ) : !data ? (
        <Empty description={t('pages.flowise.emptyGraph')} />
      ) : canEmbedFlowise ? (
        <FlowiseEmbedCanvas
          appId={appId ?? data.app_id}
          versionId={versionId}
          fallback={readonlyFallback}
        />
      ) : (
        readonlyFallback
      )}
    </PageContainer>
  )
}
