import { EditOutlined } from '@ant-design/icons'
import { Button, Skeleton, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import type { KnowledgeDataset } from '@/api/knowledge'

import {
  KNOWLEDGE_CHUNK_METHOD_LABEL_KEYS,
  KNOWLEDGE_PERMISSION_LABEL_KEYS,
} from '../constants'
import { formatKnowledgeDateTime } from '../utils/format'

const { Text } = Typography

export interface OverviewPanelProps {
  dataset: KnowledgeDataset
  loading?: boolean
  onEdit: () => void
}

export function OverviewPanel({
  dataset,
  loading,
  onEdit,
}: OverviewPanelProps) {
  const { t } = useTranslation()

  const emptyValue = t('pages.knowledge.empty.noValue')
  const updatedAt = formatKnowledgeDateTime(dataset.update_time)
  const description = formatOptionalText(dataset.description, emptyValue)
  const permissionLabel = dataset.permission
    ? t(
        KNOWLEDGE_PERMISSION_LABEL_KEYS[dataset.permission] ??
          dataset.permission,
      )
    : emptyValue
  const chunkMethodLabel = dataset.chunk_method
    ? t(
        KNOWLEDGE_CHUNK_METHOD_LABEL_KEYS[dataset.chunk_method] ??
          dataset.chunk_method,
      )
    : emptyValue
  const delimiter = dataset.parser_config?.delimiter

  const metricCards = [
    {
      key: 'documents',
      label: t('pages.knowledge.metrics.documents'),
      value: dataset.document_count,
      accentClass: 'bg-(--ant-color-primary)',
    },
    {
      key: 'chunks',
      label: t('pages.knowledge.metrics.chunks'),
      value: dataset.chunk_count,
      accentClass: 'bg-(--ant-color-warning)',
    },
  ]

  return (
    <div className="h-full min-h-0 space-y-4 overflow-auto">
      <div className="rounded-lg border border-(--ant-color-border-secondary) bg-[color-mix(in_srgb,var(--ant-color-bg-container)_97%,var(--ant-color-bg-layout))] p-4 shadow-[0_1px_2px_rgb(15_23_42/0.03)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="m-0 min-w-0 truncate text-[18px] font-semibold leading-6 text-(--text-strong)">
                {dataset.name}
              </h2>
              <Tag className="m-0! rounded-md! border-transparent! bg-[color-mix(in_srgb,var(--ant-color-info)_9%,var(--ant-color-bg-container))]! px-2! py-0.5! text-[12px] leading-5! text-(--ant-color-info)!">
                {permissionLabel}
              </Tag>
            </div>
            <p className="m-0 mt-1 max-w-3xl text-[13px] leading-5 text-(--muted)">
              {description}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <span className="rounded-md bg-[color-mix(in_srgb,var(--ant-color-fill-tertiary)_62%,transparent)] px-2 py-1 text-[12px] leading-5 text-(--muted)">
              {t('pages.knowledge.fields.updatedAt')}: {updatedAt}
            </span>
            <Button icon={<EditOutlined />} size="small" onClick={onEdit}>
              {t('pages.knowledge.actions.editDataset')}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 max-[520px]:grid-cols-1">
        {metricCards.map((metric) => (
          <div
            className="relative min-h-[76px] overflow-hidden rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) px-3 py-3 shadow-[0_1px_2px_rgb(15_23_42/0.03)]"
            key={metric.key}
          >
            <span
              className={[
                'absolute left-0 top-3 h-10 w-1 rounded-r-full',
                metric.accentClass,
              ].join(' ')}
            />
            <div className="flex items-center justify-between gap-2 pl-2">
              <span className="truncate text-[12px] font-medium leading-5 text-(--muted)">
                {metric.label}
              </span>
              <span
                className={[
                  'size-2 shrink-0 rounded-full shadow-[0_0_0_3px_color-mix(in_srgb,var(--ant-color-fill-tertiary)_70%,transparent)]',
                  metric.accentClass,
                ].join(' ')}
              />
            </div>
            <div className="mt-2 pl-2">
              {loading ? (
                <Skeleton.Input active className="h-7! w-16!" size="small" />
              ) : (
                <span className="text-[22px] font-semibold leading-7 text-(--text-strong)">
                  {metric.value.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 min-[1180px]:grid-cols-2">
        <DetailSection title={t('pages.knowledge.detail.basicInfo')}>
          <DetailItem label={t('pages.knowledge.fields.id')}>
            <Text
              copyable
              className="text-[13px] leading-5 text-(--text-strong)!"
            >
              {dataset.id}
            </Text>
          </DetailItem>
          <DetailItem label={t('pages.knowledge.fields.permission')}>
            {permissionLabel}
          </DetailItem>
          <DetailItem label={t('pages.knowledge.fields.name')}>
            {dataset.name}
          </DetailItem>
          <DetailItem label={t('pages.knowledge.fields.updatedAt')}>
            {updatedAt}
          </DetailItem>
          <DetailItem
            className="min-[760px]:col-span-2"
            label={t('pages.knowledge.fields.description')}
          >
            {description}
          </DetailItem>
        </DetailSection>

        <DetailSection title={t('pages.knowledge.detail.parseConfig')}>
          <DetailItem label={t('pages.knowledge.fields.embeddingModel')}>
            {dataset.embedding_model ?? emptyValue}
          </DetailItem>
          <DetailItem label={t('pages.knowledge.fields.chunkMethod')}>
            {chunkMethodLabel}
          </DetailItem>
          <DetailItem label={t('pages.knowledge.fields.chunkTokenNum')}>
            {dataset.parser_config?.chunk_token_num ?? emptyValue}
          </DetailItem>
          <DetailItem label={t('pages.knowledge.fields.delimiter')}>
            {delimiter ? <Text code>{delimiter}</Text> : emptyValue}
          </DetailItem>
        </DetailSection>
      </div>
    </div>
  )
}

function DetailSection({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) {
  return (
    <section className="rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) p-3.5 shadow-[0_1px_2px_rgb(15_23_42/0.03)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-(--ant-color-primary)" />
        <h3 className="m-0 text-[13px] font-semibold leading-5 text-(--text-strong)">
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2.5 max-[760px]:grid-cols-1">
        {children}
      </div>
    </section>
  )
}

function DetailItem({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label: string
}) {
  return (
    <div
      className={[
        'min-w-0 rounded-md border border-[color-mix(in_srgb,var(--ant-color-border-secondary)_70%,transparent)] bg-[color-mix(in_srgb,var(--ant-color-fill-quaternary)_55%,transparent)] px-3 py-2.5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mb-1 text-[11px] font-medium leading-4 text-(--muted)">
        {label}
      </div>
      <div className="min-h-5 break-words text-[13px] leading-5 text-(--text-strong)">
        {children}
      </div>
    </div>
  )
}

function formatOptionalText(
  value: string | null | undefined,
  fallback: string,
) {
  const trimmed = value?.trim()

  if (!trimmed) return fallback

  return trimmed
}
