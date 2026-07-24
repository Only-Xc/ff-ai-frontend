import { ArrowLeftOutlined } from '@ant-design/icons'
import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Empty, Skeleton, Space, Tag } from 'antd'
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

  // Draft view: embed design chatflow; Version view: embed runtime chatflow
  const useFlowiseEmbed = Boolean(appId)
  const versionChatflowId = data?.flowise_runtime_chatflow_id ?? null

  return (
    <PageContainer className="p-5">
      <PageHeader title={t('pages.flowise.viewTitle')}>
        <Space wrap>
          {data?.source === 'version' ? (
            <Tag color="blue">
              {t('pages.flowise.frozenVersion', {
                version: data.version ?? '—',
              })}
            </Tag>
          ) : data?.source === 'draft' ? (
            <Tag>{t('pages.flowise.savedDraft')}</Tag>
          ) : null}
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => void navigate(-1)}
          >
            {t('common.actions.back')}
          </Button>
        </Space>
      </PageHeader>

      {useFlowiseEmbed ? (
        <FlowiseEmbedCanvas
          appId={appId!}
          chatflowId={versionId ? versionChatflowId : undefined}
        />
      ) : isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : isError ? (
        <Alert
          type="error"
          showIcon
          message={t('pages.flowise.graphLoadError')}
        />
      ) : !data || data.graph_json.nodes.length === 0 ? (
        <Empty description={t('pages.flowise.emptyGraph')} />
      ) : (
        <FlowiseReadonlyCanvas
          graph={data.graph_json}
          ariaLabel={t('pages.flowise.canvasAriaLabel')}
        />
      )}
    </PageContainer>
  )
}
