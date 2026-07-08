import { Alert, Button, Descriptions, Skeleton, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

import type { KnowledgeDataset } from '@/api/knowledge'

import { formatKnowledgeDateTime } from '../utils/format'

export interface SettingsPanelProps {
  dataset?: KnowledgeDataset
  error?: boolean
  loading?: boolean
  onEdit: () => void
  onRetry: () => void
}

export function SettingsPanel({
  dataset,
  error,
  loading,
  onEdit,
  onRetry,
}: SettingsPanelProps) {
  const { t } = useTranslation()

  if (loading) return <Skeleton active className="py-4" paragraph={{ rows: 8 }} />

  if (error) {
    return (
      <Alert
        showIcon
        action={
          <Button size="small" onClick={onRetry}>
            {t('common.actions.retry')}
          </Button>
        }
        className="mt-4"
        message={t('pages.knowledge.errors.datasetDetailLoadFailed')}
        type="error"
      />
    )
  }

  if (!dataset) return null

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-end">
        <Button type="primary" onClick={onEdit}>
          {t('pages.knowledge.actions.editDataset')}
        </Button>
      </div>

      <Descriptions
        bordered
        column={1}
        items={[
          {
            key: 'id',
            label: 'ID',
            children: <Typography.Text copyable>{dataset.id}</Typography.Text>,
          },
          {
            key: 'name',
            label: t('pages.knowledge.fields.name'),
            children: dataset.name,
          },
          {
            key: 'description',
            label: t('pages.knowledge.fields.description'),
            children: dataset.description ?? '-',
          },
          {
            key: 'permission',
            label: t('pages.knowledge.fields.permission'),
            children: dataset.permission ?? '-',
          },
          {
            key: 'embedding_model',
            label: t('pages.knowledge.fields.embeddingModel'),
            children: dataset.embedding_model ?? '-',
          },
          {
            key: 'chunk_method',
            label: t('pages.knowledge.fields.chunkMethod'),
            children: dataset.chunk_method ?? '-',
          },
          {
            key: 'chunk_token_num',
            label: t('pages.knowledge.fields.chunkTokenNum'),
            children: dataset.parser_config?.chunk_token_num ?? '-',
          },
          {
            key: 'delimiter',
            label: t('pages.knowledge.fields.delimiter'),
            children: dataset.parser_config?.delimiter ?? '-',
          },
          {
            key: 'updated_at',
            label: t('pages.knowledge.fields.updatedAt'),
            children: formatKnowledgeDateTime(
              dataset.updated_at ?? dataset.created_at ?? dataset.create_time,
            ),
          },
        ]}
        size="small"
      />
    </div>
  )
}
