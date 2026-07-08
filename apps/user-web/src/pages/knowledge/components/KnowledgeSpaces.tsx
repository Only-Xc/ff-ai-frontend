import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Checkbox,
  Dropdown,
  Empty,
  Input,
  Pagination,
  Space,
  Tag,
  Typography,
} from 'antd'
import type { MenuProps } from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { KnowledgeDataset } from '@/api/knowledge'

import {
  KNOWLEDGE_CHUNK_METHOD_LABEL_KEYS,
  KNOWLEDGE_PERMISSION_LABEL_KEYS,
} from '../constants'
import { formatKnowledgeDateTime } from '../utils/format'

const { Text } = Typography

export interface KnowledgeSpacesProps {
  datasets: KnowledgeDataset[]
  error?: boolean
  keyword: string
  loading?: boolean
  page: number
  pageSize: number
  selectedDatasetId?: string
  total: number
  onBatchDelete?: (datasetIds: string[]) => void
  onCreate?: () => void
  onDelete?: (dataset: KnowledgeDataset) => void
  onEdit?: (dataset: KnowledgeDataset) => void
  onKeywordChange: (keyword: string) => void
  onPageChange: (page: number, pageSize: number) => void
  onRetry?: () => void
  onSelect: (datasetId: string) => void
}

function getLabel(
  value: string | null | undefined,
  labelMap: Record<string, string>,
  t: (key: string) => string,
) {
  if (!value) return '-'

  return t(labelMap[value] ?? value)
}

export function KnowledgeSpaces({
  datasets,
  error,
  keyword,
  loading,
  page,
  pageSize,
  selectedDatasetId,
  total,
  onBatchDelete,
  onCreate,
  onDelete,
  onEdit,
  onKeywordChange,
  onPageChange,
  onRetry,
  onSelect,
}: KnowledgeSpacesProps) {
  const { t } = useTranslation()
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  const selectedSet = useMemo(
    () => new Set(selectedRowKeys),
    [selectedRowKeys],
  )

  const handleSelectAll = (checked: boolean) => {
    setSelectedRowKeys(checked ? datasets.map((item) => item.id) : [])
  }

  const toggleSelected = (datasetId: string, checked: boolean) => {
    setSelectedRowKeys((current) =>
      checked
        ? Array.from(new Set([...current, datasetId]))
        : current.filter((item) => item !== datasetId),
    )
  }

  const isAllSelected =
    datasets.length > 0 && datasets.every((item) => selectedSet.has(item.id))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-3 border-b border-b-(--ant-color-border-secondary) p-4">
        <div className="flex items-center justify-between gap-2">
          <Text strong>{t('pages.knowledge.spaces.title')}</Text>
          <Button
            icon={<PlusOutlined />}
            size="small"
            type="primary"
            onClick={onCreate}
          >
            {t('pages.knowledge.actions.createDataset')}
          </Button>
        </div>
        <Input.Search
          allowClear
          placeholder={t('pages.knowledge.filters.searchDatasets')}
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          onSearch={onKeywordChange}
        />
      </div>

      {error ? (
        <Alert
          showIcon
          action={
            <Button size="small" onClick={onRetry}>
              {t('common.actions.retry')}
            </Button>
          }
          className="m-4"
          message={t('pages.knowledge.errors.datasetsLoadFailed')}
          type="error"
        />
      ) : null}

      {selectedRowKeys.length > 0 ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-b-(--ant-color-border-secondary) px-4 py-2">
          <Text type="secondary">
            {t('pages.knowledge.selection.selectedCount', {
              count: selectedRowKeys.length,
            })}
          </Text>
          <Space size="small">
            <Button size="small" onClick={() => setSelectedRowKeys([])}>
              {t('pages.knowledge.actions.clearSelection')}
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => onBatchDelete?.(selectedRowKeys)}
            >
              {t('common.actions.delete')}
            </Button>
          </Space>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        {datasets.length === 0 && !loading ? (
          <Empty
            className="px-4 py-12"
            description={t('pages.knowledge.empty.noDatasets')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button icon={<PlusOutlined />} type="primary" onClick={onCreate}>
              {t('pages.knowledge.actions.createDataset')}
            </Button>
          </Empty>
        ) : (
          <div className="divide-y divide-(--ant-color-border-secondary)">
            <label className="flex items-center gap-2 px-4 py-2 text-xs text-(--muted)">
              <Checkbox
                checked={isAllSelected}
                indeterminate={selectedRowKeys.length > 0 && !isAllSelected}
                onChange={(event) => handleSelectAll(event.target.checked)}
              />
              {t('pages.knowledge.selection.selectCurrentPage')}
            </label>
            {datasets.map((dataset) => {
              const menuItems: MenuProps['items'] = [
                {
                  key: 'edit',
                  icon: <EditOutlined />,
                  label: t('common.actions.detail'),
                  onClick: () => onEdit?.(dataset),
                },
                {
                  danger: true,
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: t('common.actions.delete'),
                  onClick: () => onDelete?.(dataset),
                },
              ]

              const isSelected = selectedDatasetId === dataset.id

              return (
                <div
                  className={[
                    'group flex cursor-pointer gap-3 px-4 py-3 transition-colors',
                    isSelected
                      ? 'bg-[color-mix(in_srgb,var(--ant-color-primary)_10%,transparent)]'
                      : 'hover:bg-[color-mix(in_srgb,var(--ant-color-primary)_6%,transparent)]',
                  ].join(' ')}
                  key={dataset.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(dataset.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') onSelect(dataset.id)
                  }}
                >
                  <Checkbox
                    checked={selectedSet.has(dataset.id)}
                    onChange={(event) => {
                      event.stopPropagation()
                      toggleSelected(dataset.id, event.target.checked)
                    }}
                    onClick={(event) => event.stopPropagation()}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Space direction="vertical" size={0}>
                        <Text className="max-w-56" ellipsis strong>
                          {dataset.name}
                        </Text>
                        <Text copyable className="text-xs" type="secondary">
                          {dataset.id}
                        </Text>
                      </Space>
                      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                        <Button
                          icon={<MoreOutlined />}
                          size="small"
                          type="text"
                          onClick={(event) => event.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                    <Space wrap size={[4, 4]}>
                      <Tag>
                        {getLabel(
                          dataset.permission,
                          KNOWLEDGE_PERMISSION_LABEL_KEYS,
                          t,
                        )}
                      </Tag>
                      <Tag>
                        {getLabel(
                          dataset.chunk_method,
                          KNOWLEDGE_CHUNK_METHOD_LABEL_KEYS,
                          t,
                        )}
                      </Tag>
                    </Space>
                    <div className="grid grid-cols-3 gap-2 text-xs text-(--muted)">
                      <span>
                        {t('pages.knowledge.metrics.documents')}:{' '}
                        {dataset.document_count ?? '-'}
                      </span>
                      <span>
                        {t('pages.knowledge.metrics.chunks')}:{' '}
                        {dataset.chunk_count ?? '-'}
                      </span>
                      <span>
                        {formatKnowledgeDateTime(
                          dataset.updated_at ??
                            dataset.created_at ??
                            dataset.create_time,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex shrink-0 justify-end border-t border-t-(--ant-color-border-secondary) p-3">
        <Pagination
          current={page}
          pageSize={pageSize}
          showSizeChanger
          size="small"
          total={total}
          onChange={onPageChange}
        />
      </div>
    </div>
  )
}
