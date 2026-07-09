import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Dropdown,
  Empty,
  Input,
  Pagination,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { MenuProps } from 'antd'
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
  onCreate,
  onDelete,
  onEdit,
  onKeywordChange,
  onPageChange,
  onRetry,
  onSelect,
}: KnowledgeSpacesProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[color-mix(in_srgb,var(--ant-color-bg-container)_97%,var(--ant-color-bg-layout))]">
      <div className="shrink-0 border-b border-b-(--ant-color-border-secondary) px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Input.Search
            allowClear
            className="min-w-0 flex-1 [&_.ant-input-affix-wrapper]:h-8 [&_.ant-input-group-addon]:w-8 [&_.ant-input-group-addon]:p-0 [&_.ant-input-search-button]:h-8 [&_.ant-input-search-button]:w-8 [&_.ant-input-search-button]:min-w-8 [&_.ant-input-search-button]:px-0 [&_.ant-input]:text-[12px]"
            enterButton={
              <Button
                aria-label={t('pages.knowledge.actions.search')}
                className="h-8! w-8! min-w-8! px-0!"
                icon={<SearchOutlined />}
              />
            }
            placeholder={t('pages.knowledge.filters.searchDatasets')}
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            onSearch={onKeywordChange}
          />
          <Tooltip title={t('pages.knowledge.actions.createDataset')}>
            <Button
              aria-label={t('pages.knowledge.actions.createDataset')}
              className="h-8 w-8 shrink-0"
              icon={<PlusOutlined />}
              type="primary"
              onClick={onCreate}
            />
          </Tooltip>
        </div>
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

      <div className="min-h-0 flex-1 overflow-auto">
        {datasets.length === 0 && !loading ? (
          <Empty
            className="px-4 py-14"
            description={t('pages.knowledge.empty.noDatasets')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button icon={<PlusOutlined />} type="primary" onClick={onCreate}>
              {t('pages.knowledge.actions.createDataset')}
            </Button>
          </Empty>
        ) : (
          <div className="space-y-1.5 p-2.5">
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
                    'group relative flex cursor-pointer rounded-lg border px-2.5 py-2.5 transition-[background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--ant-color-bg-container)',
                    isSelected
                      ? 'border-[color-mix(in_srgb,var(--ant-color-primary)_34%,var(--ant-color-border))] bg-[color-mix(in_srgb,var(--ant-color-primary)_7%,var(--ant-color-bg-container))] shadow-[inset_2px_0_0_var(--ant-color-primary),0_1px_2px_rgb(15_23_42/0.04)]'
                      : 'border-[color-mix(in_srgb,var(--ant-color-border-secondary)_72%,transparent)] bg-(--ant-color-bg-container) hover:border-[color-mix(in_srgb,var(--ant-color-primary)_22%,var(--ant-color-border))] hover:bg-[color-mix(in_srgb,var(--ant-color-primary)_3%,var(--ant-color-bg-container))]',
                  ].join(' ')}
                  key={dataset.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(dataset.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') onSelect(dataset.id)
                  }}
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <Text
                          className="block max-w-60 text-[13px] leading-5 text-(--text-strong)"
                          ellipsis
                          strong
                        >
                          {dataset.name}
                        </Text>
                      </div>
                      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                        <Button
                          icon={<MoreOutlined />}
                          className="h-7 w-7 opacity-70 transition-opacity group-hover:opacity-100"
                          size="small"
                          type="text"
                          onClick={(event) => event.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                    <Space wrap size={[4, 4]}>
                      <Tag className="m-0! rounded-md! border-transparent! bg-[color-mix(in_srgb,var(--ant-color-info)_9%,var(--ant-color-bg-container))]! px-1.5! py-0! text-[11px] leading-5! text-(--ant-color-info)!">
                        {getLabel(
                          dataset.permission,
                          KNOWLEDGE_PERMISSION_LABEL_KEYS,
                          t,
                        )}
                      </Tag>
                      <Tag className="m-0! rounded-md! border-transparent! bg-[color-mix(in_srgb,var(--ant-color-success)_9%,var(--ant-color-bg-container))]! px-1.5! py-0! text-[11px] leading-5! text-(--ant-color-success)!">
                        {getLabel(
                          dataset.chunk_method,
                          KNOWLEDGE_CHUNK_METHOD_LABEL_KEYS,
                          t,
                        )}
                      </Tag>
                    </Space>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] leading-4 text-(--muted)">
                      <span className="rounded-md bg-[color-mix(in_srgb,var(--ant-color-fill-tertiary)_58%,transparent)] px-2 py-1">
                        <span className="mr-1 text-[13px] font-semibold text-(--text-strong)">
                          {dataset.document_count ?? '-'}
                        </span>
                        {t('pages.knowledge.metrics.documents')}
                      </span>
                      <span className="rounded-md bg-[color-mix(in_srgb,var(--ant-color-fill-tertiary)_58%,transparent)] px-2 py-1">
                        <span className="mr-1 text-[13px] font-semibold text-(--text-strong)">
                          {dataset.chunk_count ?? '-'}
                        </span>
                        {t('pages.knowledge.metrics.chunks')}
                      </span>
                      <span className="col-span-2 truncate px-0.5 text-[10px] leading-4">
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

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-t-(--ant-color-border-secondary) bg-(--ant-color-bg-container) px-3 py-2.5">
        <Text className="shrink-0 text-[12px] leading-5 text-(--muted)!">
          {t('common.labels.totalCount', { total })}
        </Text>
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
