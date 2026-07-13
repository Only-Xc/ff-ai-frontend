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
  DOCUMENT_RUN_STATUS_COLORS,
  DOCUMENT_RUN_STATUS_LABEL_KEYS,
} from '../constants'
import { formatFileSize, formatKnowledgeDateTime } from '../utils/format'

const { Text } = Typography

export interface DocumentsPanelProps {
  documents: KnowledgeDocument[]
  error?: boolean
  loading?: boolean
  page: number
  pageSize: number
  selectedDocumentIds: string[]
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
}

function canParse(document: KnowledgeDocument) {
  return document.run !== 'RUNNING'
}

export function DocumentsPanel({
  documents,
  error,
  loading,
  page,
  pageSize,
  selectedDocumentIds,
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
}: DocumentsPanelProps) {
  const { t } = useTranslation()

  const selectedParseableIds = documents
    .filter((item) => selectedDocumentIds.includes(item.id) && canParse(item))
    .map((item) => item.id)

  const columns = useMemo<TableProps<KnowledgeDocument>['columns']>(
    () => [
      {
        title: t('pages.knowledge.documents.columns.name'),
        dataIndex: 'name',
        width: 260,
        ellipsis: true,
        render: (_, record) => (
          <Space className="w-full min-w-0" direction="vertical" size={0}>
            <Text className="block" ellipsis={{ tooltip: record.name }} strong>
              {record.name}
            </Text>
            <Text
              copyable
              className="block text-xs"
              ellipsis={{ tooltip: record.id }}
              type="secondary"
            >
              {record.id}
            </Text>
          </Space>
        ),
      },
      {
        title: t('pages.knowledge.documents.columns.stage'),
        dataIndex: 'run',
        width: 140,
        render: (_, record) => (
          <Tag color={DOCUMENT_RUN_STATUS_COLORS[record.run]}>
            {t(DOCUMENT_RUN_STATUS_LABEL_KEYS[record.run])}
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
        render: (_, record) => formatFileSize(record.size),
      },
      {
        title: t('pages.knowledge.documents.columns.parser'),
        width: 140,
        dataIndex: 'chunk_method',
        render: (value: string) => value || '-',
      },
      {
        title: t('pages.knowledge.documents.columns.uploadedAt'),
        width: 180,
        dataIndex: 'create_time',
        render: (value: number | string | null) =>
          formatKnowledgeDateTime(value),
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
              type={record.run === 'FAIL' ? 'primary' : 'default'}
              onClick={() => onParse(record)}
            >
              {record.run === 'FAIL'
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
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="mb-3 flex shrink-0 justify-end">
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={onRetry}>
            {t('common.actions.refresh')}
          </Button>
          <Button
            icon={<UploadOutlined />}
            type="primary"
            onClick={onOpenUpload}
          >
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
        <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-[color-mix(in_srgb,var(--ant-color-primary)_20%,var(--ant-color-border))] bg-[color-mix(in_srgb,var(--ant-color-primary)_6%,var(--ant-color-bg-container))] px-3 py-2">
          <Text className="text-[12px] font-medium text-(--text-strong)!">
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

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container)">
        {documents.length === 0 && !loading ? (
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
          <Table<KnowledgeDocument>
            columns={columns}
            dataSource={documents}
            loading={loading}
            pagination={false}
            rowKey="id"
            rowSelection={{
              selectedRowKeys: selectedDocumentIds,
              onChange: (keys) => onSelectionChange(keys.map(String)),
            }}
            scroll={{ x: 1170, y: 'calc(100vh - 390px)' }}
            size="small"
          />
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 pt-3">
        <Text className="text-[12px] text-(--muted)!">
          {t('common.labels.totalCount', { total })}
        </Text>
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
