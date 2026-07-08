import {
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Empty,
  Pagination,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type { KnowledgeDocument } from '@/api/knowledge'

import {
  DOCUMENT_STATUS_FILTERS,
  INGESTION_STAGE_COLORS,
  INGESTION_STAGE_LABEL_KEYS,
} from '../constants'
import type {
  KnowledgeDocumentStatusFilter,
  NormalizedKnowledgeDocument,
} from '../types'
import { formatFileSize, formatKnowledgeDateTime } from '../utils/format'

const { Text } = Typography

export interface DocumentsPanelProps {
  documents: NormalizedKnowledgeDocument[]
  error?: boolean
  loading?: boolean
  page: number
  pageSize: number
  selectedDocumentIds: string[]
  statusFilter: KnowledgeDocumentStatusFilter
  total: number
  onBatchDelete: (documentIds: string[]) => void
  onBatchParse: (documentIds: string[]) => void
  onDelete: (document: KnowledgeDocument) => void
  onOpenDetail: (document: KnowledgeDocument) => void
  onOpenUpload: () => void
  onPageChange: (page: number, pageSize: number) => void
  onParse: (document: KnowledgeDocument) => void
  onRetry: () => void
  onSelectionChange: (documentIds: string[]) => void
  onStatusFilterChange: (filter: KnowledgeDocumentStatusFilter) => void
}

function canParse(document: NormalizedKnowledgeDocument) {
  return document.ingestionStage !== 'parsing'
}

export function DocumentsPanel({
  documents,
  error,
  loading,
  page,
  pageSize,
  selectedDocumentIds,
  statusFilter,
  total,
  onBatchDelete,
  onBatchParse,
  onDelete,
  onOpenDetail,
  onOpenUpload,
  onPageChange,
  onParse,
  onRetry,
  onSelectionChange,
  onStatusFilterChange,
}: DocumentsPanelProps) {
  const { t } = useTranslation()

  const filteredDocuments = useMemo(
    () =>
      statusFilter === 'all'
        ? documents
        : documents.filter((item) => item.ingestionStage === statusFilter),
    [documents, statusFilter],
  )

  const selectedParseableIds = filteredDocuments
    .filter((item) => selectedDocumentIds.includes(item.id) && canParse(item))
    .map((item) => item.id)

  const columns = useMemo<TableProps<NormalizedKnowledgeDocument>['columns']>(
    () => [
      {
        title: t('pages.knowledge.documents.columns.name'),
        dataIndex: 'displayName',
        width: 260,
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Text className="max-w-64" ellipsis strong>
              {record.displayName}
            </Text>
            <Text copyable className="text-xs" type="secondary">
              {record.id}
            </Text>
          </Space>
        ),
      },
      {
        title: t('pages.knowledge.documents.columns.stage'),
        dataIndex: 'ingestionStage',
        width: 140,
        render: (_, record) => (
          <Tag color={INGESTION_STAGE_COLORS[record.ingestionStage]}>
            {t(INGESTION_STAGE_LABEL_KEYS[record.ingestionStage])}
          </Tag>
        ),
      },
      {
        align: 'right',
        title: t('pages.knowledge.documents.columns.chunks'),
        dataIndex: 'chunk_count',
        width: 110,
        render: (value: number | null | undefined) => value ?? '-',
      },
      {
        title: t('pages.knowledge.documents.columns.size'),
        width: 120,
        render: (_, record) => formatFileSize(record.size_bytes ?? record.size),
      },
      {
        title: t('pages.knowledge.documents.columns.parser'),
        width: 140,
        render: (_, record) => record.parser_id ?? record.chunk_method ?? '-',
      },
      {
        title: t('pages.knowledge.documents.columns.uploadedAt'),
        width: 180,
        render: (_, record) => formatKnowledgeDateTime(record.displayCreatedAt),
      },
      {
        title: t('pages.knowledge.documents.columns.action'),
        fixed: 'right',
        key: 'action',
        width: 220,
        render: (_, record) => (
          <Space size="small">
            <Button
              disabled={!canParse(record)}
              icon={<PlayCircleOutlined />}
              size="small"
              type={record.ingestionStage === 'failed' ? 'primary' : 'default'}
              onClick={() => onParse(record)}
            >
              {record.ingestionStage === 'failed'
                ? t('pages.knowledge.actions.retryParse')
                : t('pages.knowledge.actions.parse')}
            </Button>
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => onOpenDetail(record)}
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => onDelete(record)}
            />
          </Space>
        ),
      },
    ],
    [onDelete, onOpenDetail, onParse, t],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col py-2">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <Segmented
          options={DOCUMENT_STATUS_FILTERS.map((item) => ({
            label: t(item.labelKey),
            value: item.key,
          }))}
          value={statusFilter}
          onChange={onStatusFilterChange}
        />
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={onRetry}>
            {t('common.actions.refresh')}
          </Button>
          <Button icon={<UploadOutlined />} type="primary" onClick={onOpenUpload}>
            {t('pages.knowledge.actions.uploadDocuments')}
          </Button>
        </Space>
      </div>

      {error ? (
        <Alert
          showIcon
          action={
            <Button size="small" onClick={onRetry}>
              {t('common.actions.retry')}
            </Button>
          }
          className="mb-3"
          message={t('pages.knowledge.errors.documentsLoadFailed')}
          type="error"
        />
      ) : null}

      {selectedDocumentIds.length > 0 ? (
        <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-(--ant-color-border-secondary) px-3 py-2">
          <Text type="secondary">
            {t('pages.knowledge.selection.selectedCount', {
              count: selectedDocumentIds.length,
            })}
          </Text>
          <Space size="small">
            <Button
              icon={<PlayCircleOutlined />}
              size="small"
              onClick={() => onBatchParse(selectedParseableIds)}
            >
              {t('pages.knowledge.actions.batchParse')}
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => onBatchDelete(selectedDocumentIds)}
            >
              {t('common.actions.delete')}
            </Button>
            <Button size="small" onClick={() => onSelectionChange([])}>
              {t('pages.knowledge.actions.clearSelection')}
            </Button>
          </Space>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        {filteredDocuments.length === 0 && !loading ? (
          <Empty
            className="py-16"
            description={t('pages.knowledge.empty.noDocuments')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={onOpenUpload}>
              {t('pages.knowledge.actions.uploadDocuments')}
            </Button>
          </Empty>
        ) : (
          <Table<NormalizedKnowledgeDocument>
            columns={columns}
            dataSource={filteredDocuments}
            loading={loading}
            pagination={false}
            rowKey="id"
            rowSelection={{
              selectedRowKeys: selectedDocumentIds,
              onChange: (keys) => onSelectionChange(keys.map(String)),
            }}
            scroll={{ x: 1170, y: 'calc(100vh - 420px)' }}
            size="small"
          />
        )}
      </div>

      <div className="flex shrink-0 justify-end pt-3">
        <Pagination
          current={page}
          pageSize={pageSize}
          showSizeChanger
          total={total}
          onChange={onPageChange}
        />
      </div>
    </div>
  )
}
