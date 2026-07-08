import { Button, Empty, Space, Statistic, Typography } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type { KnowledgeDataset } from '@/api/knowledge'

import type { NormalizedKnowledgeDocument } from '../types'

const { Text } = Typography

export interface OverviewPanelProps {
  dataset: KnowledgeDataset
  documents: NormalizedKnowledgeDocument[]
  loading?: boolean
  onOpenDocuments: () => void
  onOpenRetrieval: () => void
}

export function OverviewPanel({
  dataset,
  documents,
  loading,
  onOpenDocuments,
  onOpenRetrieval,
}: OverviewPanelProps) {
  const { t } = useTranslation()

  const metrics = useMemo(() => {
    const indexed = documents.filter(
      (item) => item.ingestionStage === 'indexed',
    ).length
    const parsing = documents.filter(
      (item) => item.ingestionStage === 'parsing',
    ).length
    const failed = documents.filter(
      (item) => item.ingestionStage === 'failed',
    ).length
    const chunkCount = documents.reduce(
      (sum, item) => sum + (item.chunk_count ?? 0),
      0,
    )

    return {
      chunkCount,
      failed,
      indexed,
      parsing,
      total: documents.length,
    }
  }, [documents])

  if (!loading && documents.length === 0) {
    return (
      <Empty
        className="py-16"
        description={t('pages.knowledge.empty.noDocuments')}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button type="primary" onClick={onOpenDocuments}>
          {t('pages.knowledge.tabs.documents')}
        </Button>
      </Empty>
    )
  }

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-5 gap-3 max-[1200px]:grid-cols-3 max-[768px]:grid-cols-2">
        <div className="rounded-lg border border-(--ant-color-border-secondary) p-4">
          <Statistic
            loading={loading}
            title={t('pages.knowledge.metrics.documents')}
            value={metrics.total}
          />
        </div>
        <div className="rounded-lg border border-(--ant-color-border-secondary) p-4">
          <Statistic
            loading={loading}
            title={t('pages.knowledge.metrics.indexed')}
            value={metrics.indexed}
          />
        </div>
        <div className="rounded-lg border border-(--ant-color-border-secondary) p-4">
          <Statistic
            loading={loading}
            title={t('pages.knowledge.metrics.parsing')}
            value={metrics.parsing}
          />
        </div>
        <div className="rounded-lg border border-(--ant-color-border-secondary) p-4">
          <Statistic
            loading={loading}
            title={t('pages.knowledge.metrics.failed')}
            value={metrics.failed}
          />
        </div>
        <div className="rounded-lg border border-(--ant-color-border-secondary) p-4">
          <Statistic
            loading={loading}
            title={t('pages.knowledge.metrics.chunks')}
            value={metrics.chunkCount || (dataset.chunk_count ?? 0)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-(--ant-color-border-secondary) p-4">
        <Space className="w-full justify-between" wrap>
          <Space direction="vertical" size={2}>
            <Text strong>{dataset.name}</Text>
            <Text type="secondary">
              {dataset.embedding_model ?? t('pages.knowledge.empty.noValue')}
            </Text>
          </Space>
          <Space wrap>
            <Button onClick={onOpenDocuments}>
              {t('pages.knowledge.tabs.documents')}
            </Button>
            <Button type="primary" onClick={onOpenRetrieval}>
              {t('pages.knowledge.tabs.retrieval')}
            </Button>
          </Space>
        </Space>
      </div>
    </div>
  )
}
