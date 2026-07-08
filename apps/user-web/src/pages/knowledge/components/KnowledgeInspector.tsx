import { Descriptions, Drawer, Empty, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

import type { KnowledgeInspectorTarget } from '../types'
import { formatFileSize, formatKnowledgeDateTime, formatSearchScore } from '../utils/format'

export interface KnowledgeInspectorProps {
  open: boolean
  target: KnowledgeInspectorTarget
  onClose: () => void
}

function stringifyRaw(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function KnowledgeInspector({
  open,
  target,
  onClose,
}: KnowledgeInspectorProps) {
  const { t } = useTranslation()

  return (
    <Drawer
      destroyOnHidden
      open={open}
      placement="right"
      title={t('pages.knowledge.inspector.title')}
      width={560}
      onClose={onClose}
    >
      {!target ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : null}

      {target?.type === 'dataset' ? (
        <Descriptions
          bordered
          column={1}
          items={[
            {
              key: 'id',
              label: 'ID',
              children: <Typography.Text copyable>{target.dataset.id}</Typography.Text>,
            },
            {
              key: 'name',
              label: t('pages.knowledge.fields.name'),
              children: target.dataset.name,
            },
            {
              key: 'embedding_model',
              label: t('pages.knowledge.fields.embeddingModel'),
              children: target.dataset.embedding_model ?? '-',
            },
            {
              key: 'updated_at',
              label: t('pages.knowledge.fields.updatedAt'),
              children: formatKnowledgeDateTime(
                target.dataset.updated_at ??
                  target.dataset.created_at ??
                  target.dataset.create_time,
              ),
            },
            {
              key: 'raw',
              label: t('pages.knowledge.retrieval.rawFields'),
              children: (
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs">
                  {stringifyRaw(target.dataset)}
                </pre>
              ),
            },
          ]}
          size="small"
        />
      ) : null}

      {target?.type === 'document' ? (
        <Descriptions
          bordered
          column={1}
          items={[
            {
              key: 'id',
              label: 'ID',
              children: <Typography.Text copyable>{target.document.id}</Typography.Text>,
            },
            {
              key: 'name',
              label: t('pages.knowledge.documents.columns.name'),
              children: target.document.name ?? target.document.filename ?? '-',
            },
            {
              key: 'status',
              label: t('pages.knowledge.documents.columns.stage'),
              children:
                target.document.parse_status ??
                target.document.status ??
                target.document.run ??
                '-',
            },
            {
              key: 'chunks',
              label: t('pages.knowledge.documents.columns.chunks'),
              children: target.document.chunk_count ?? '-',
            },
            {
              key: 'size',
              label: t('pages.knowledge.documents.columns.size'),
              children: formatFileSize(
                target.document.size_bytes ?? target.document.size,
              ),
            },
            {
              key: 'error',
              label: t('pages.knowledge.fields.error'),
              children: target.document.error ?? '-',
            },
            {
              key: 'raw',
              label: t('pages.knowledge.retrieval.rawFields'),
              children: (
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs">
                  {stringifyRaw(target.document)}
                </pre>
              ),
            },
          ]}
          size="small"
        />
      ) : null}

      {target?.type === 'search-result' ? (
        <Descriptions
          bordered
          column={1}
          items={[
            {
              key: 'content',
              label: t('pages.knowledge.retrieval.content'),
              children: target.result.displayContent || '-',
            },
            {
              key: 'score',
              label: t('pages.knowledge.retrieval.score'),
              children: formatSearchScore(target.result.displayScore),
            },
            {
              key: 'chunk_id',
              label: 'Chunk ID',
              children: target.result.displayChunkId ? (
                <Typography.Text copyable>
                  {target.result.displayChunkId}
                </Typography.Text>
              ) : (
                '-'
              ),
            },
            {
              key: 'raw',
              label: t('pages.knowledge.retrieval.rawFields'),
              children: (
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs">
                  {stringifyRaw(target.result)}
                </pre>
              ),
            },
          ]}
          size="small"
        />
      ) : null}
    </Drawer>
  )
}
