import { CloseOutlined } from '@ant-design/icons'
import { Button, Drawer, Empty, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DOCUMENT_RUN_STATUS_COLORS,
  DOCUMENT_RUN_STATUS_LABEL_KEYS,
  KNOWLEDGE_CHUNK_METHOD_LABEL_KEYS,
  KNOWLEDGE_PERMISSION_LABEL_KEYS,
} from '../constants'
import type { KnowledgeInspectorTarget } from '../types'
import {
  formatFileSize,
  formatKnowledgeDateTime,
  formatSearchScore,
} from '../utils/format'

const { Paragraph, Text } = Typography

type Translate = (key: string) => string

type DatasetInspectorTarget = Extract<
  KnowledgeInspectorTarget,
  { type: 'dataset' }
>

type DocumentInspectorTarget = Extract<
  KnowledgeInspectorTarget,
  { type: 'document' }
>

type SearchResultInspectorTarget = Extract<
  KnowledgeInspectorTarget,
  { type: 'search-result' }
>

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

function getLabel(
  value: string | null | undefined,
  labelMap: Record<string, string>,
  t: Translate,
) {
  if (!value) return t('pages.knowledge.empty.noValue')

  return t(labelMap[value] ?? value)
}

export function KnowledgeInspector({
  open,
  target,
  onClose,
}: KnowledgeInspectorProps) {
  const { t } = useTranslation()

  return (
    <Drawer
      closable={false}
      destroyOnHidden
      className="[&_.ant-drawer-body]:overflow-x-hidden [&_.ant-drawer-body]:overflow-y-auto [&_.ant-drawer-body]:bg-(--ant-color-bg-container) [&_.ant-drawer-body]:p-0 [&_.ant-drawer-body]:[scrollbar-gutter:stable] [&_.ant-drawer-content]:overflow-hidden"
      open={open}
      placement="right"
      width={680}
      onClose={onClose}
    >
      {!target ? (
        <EmptyInspector
          closeLabel={t('common.actions.close')}
          onClose={onClose}
        />
      ) : null}

      {target?.type === 'dataset' ? (
        <DatasetInspector onClose={onClose} t={t} target={target} />
      ) : null}

      {target?.type === 'document' ? (
        <DocumentInspector onClose={onClose} t={t} target={target} />
      ) : null}

      {target?.type === 'search-result' ? (
        <SearchResultInspector onClose={onClose} t={t} target={target} />
      ) : null}
    </Drawer>
  )
}

function EmptyInspector({
  closeLabel,
  onClose,
}: {
  closeLabel: string
  onClose: () => void
}) {
  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex justify-end">
        <InspectorCloseButton closeLabel={closeLabel} onClose={onClose} />
      </div>
      <div className="flex min-h-[240px] items-center justify-center">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    </div>
  )
}

function DatasetInspector({
  onClose,
  t,
  target,
}: {
  onClose: () => void
  t: Translate
  target: DatasetInspectorTarget
}) {
  const updatedAt = formatKnowledgeDateTime(target.dataset.update_time)

  return (
    <InspectorLayout
      closeLabel={t('common.actions.close')}
      raw={target.dataset}
      title={target.dataset.name}
      typeLabel={t('pages.knowledge.inspector.dataset')}
      onClose={onClose}
      t={t}
    >
      <InspectorSection title={t('pages.knowledge.inspector.overview')}>
        <FieldGrid>
          <InspectorField label={t('pages.knowledge.fields.id')}>
            <Text copyable>{target.dataset.id}</Text>
          </InspectorField>
          <InspectorField label={t('pages.knowledge.fields.updatedAt')}>
            {updatedAt}
          </InspectorField>
          <InspectorField label={t('pages.knowledge.fields.permission')}>
            {getLabel(
              target.dataset.permission,
              KNOWLEDGE_PERMISSION_LABEL_KEYS,
              t,
            )}
          </InspectorField>
          <InspectorField label={t('pages.knowledge.fields.chunkMethod')}>
            {getLabel(
              target.dataset.chunk_method,
              KNOWLEDGE_CHUNK_METHOD_LABEL_KEYS,
              t,
            )}
          </InspectorField>
          <InspectorField label={t('pages.knowledge.fields.embeddingModel')}>
            {target.dataset.embedding_model ??
              t('pages.knowledge.empty.noValue')}
          </InspectorField>
          <InspectorField label={t('pages.knowledge.metrics.documents')}>
            {target.dataset.document_count ??
              t('pages.knowledge.empty.noValue')}
          </InspectorField>
        </FieldGrid>
      </InspectorSection>

      <InspectorSection title={t('pages.knowledge.inspector.content')}>
        <LongText>
          {target.dataset.description ?? t('pages.knowledge.empty.noValue')}
        </LongText>
      </InspectorSection>
    </InspectorLayout>
  )
}

function DocumentInspector({
  onClose,
  t,
  target,
}: {
  onClose: () => void
  t: Translate
  target: DocumentInspectorTarget
}) {
  return (
    <InspectorLayout
      closeLabel={t('common.actions.close')}
      raw={target.document}
      title={target.document.name}
      trailing={
        <Tag
          className="m-0! rounded-md!"
          color={DOCUMENT_RUN_STATUS_COLORS[target.document.run]}
        >
          {t(DOCUMENT_RUN_STATUS_LABEL_KEYS[target.document.run])}
        </Tag>
      }
      typeLabel={t('pages.knowledge.inspector.document')}
      onClose={onClose}
      t={t}
    >
      <InspectorSection title={t('pages.knowledge.inspector.overview')}>
        <FieldGrid>
          <InspectorField label={t('pages.knowledge.fields.id')}>
            <Text copyable>{target.document.id}</Text>
          </InspectorField>
          <InspectorField label={t('pages.knowledge.documents.columns.stage')}>
            {target.document.run}
          </InspectorField>
          <InspectorField label={t('pages.knowledge.documents.columns.chunks')}>
            {target.document.chunk_count}
          </InspectorField>
          <InspectorField label={t('pages.knowledge.documents.columns.size')}>
            {formatFileSize(target.document.size)}
          </InspectorField>
          <InspectorField label={t('pages.knowledge.documents.columns.parser')}>
            {target.document.chunk_method}
          </InspectorField>
          <InspectorField label={t('pages.knowledge.fields.updatedAt')}>
            {formatKnowledgeDateTime(target.document.update_time)}
          </InspectorField>
        </FieldGrid>
      </InspectorSection>

      <InspectorSection title={t('pages.knowledge.inspector.content')}>
        <LongText>
          {target.document.progress_msg || t('pages.knowledge.empty.noValue')}
        </LongText>
      </InspectorSection>
    </InspectorLayout>
  )
}

function SearchResultInspector({
  onClose,
  t,
  target,
}: {
  onClose: () => void
  t: Translate
  target: SearchResultInspectorTarget
}) {
  return (
    <InspectorLayout
      closeLabel={t('common.actions.close')}
      raw={target.result}
      title={target.result.document_keyword}
      trailing={
        <Tag className="m-0! rounded-md!" color="processing">
          {formatSearchScore(target.result.similarity)}
        </Tag>
      }
      typeLabel={t('pages.knowledge.inspector.searchResult')}
      onClose={onClose}
      t={t}
    >
      <InspectorSection title={t('pages.knowledge.inspector.overview')}>
        <FieldGrid>
          <InspectorField label={t('pages.knowledge.retrieval.score')}>
            {formatSearchScore(target.result.similarity)}
          </InspectorField>
          <InspectorField label={t('pages.knowledge.fields.chunkId')}>
            <Text copyable>{target.result.id}</Text>
          </InspectorField>
        </FieldGrid>
      </InspectorSection>

      <InspectorSection title={t('pages.knowledge.inspector.content')}>
        <LongText copyable>
          {target.result.content || t('pages.knowledge.empty.noValue')}
        </LongText>
      </InspectorSection>
    </InspectorLayout>
  )
}

function InspectorLayout({
  children,
  closeLabel,
  raw,
  title,
  trailing,
  typeLabel,
  onClose,
  t,
}: {
  children: ReactNode
  closeLabel: string
  raw: unknown
  title: ReactNode
  trailing?: ReactNode
  typeLabel: string
  onClose: () => void
  t: Translate
}) {
  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[13px] font-medium leading-5 text-(--muted)">
              {typeLabel}
            </span>
            {trailing ? <span className="shrink-0">{trailing}</span> : null}
          </div>
          <div className="break-words text-[17px] font-semibold leading-6 text-(--text-strong)">
            {title}
          </div>
        </div>
        <InspectorCloseButton closeLabel={closeLabel} onClose={onClose} />
      </div>

      <div className="space-y-4">
        {children}
        <InspectorSection title={t('pages.knowledge.inspector.rawData')}>
          <pre className="max-w-full whitespace-pre-wrap break-words rounded-md bg-(--ant-color-fill-quaternary) p-3 text-[13px] leading-5 text-(--text-strong)">
            {stringifyRaw(raw)}
          </pre>
        </InspectorSection>
      </div>
    </div>
  )
}

function InspectorCloseButton({
  closeLabel,
  onClose,
}: {
  closeLabel: string
  onClose: () => void
}) {
  return (
    <Button
      aria-label={closeLabel}
      className="h-7 w-7 shrink-0 p-0 text-(--muted)!"
      icon={<CloseOutlined />}
      size="small"
      title={closeLabel}
      type="text"
      onClick={onClose}
    />
  )
}

function InspectorSection({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) {
  return (
    <section className="border-t border-t-(--ant-color-border-secondary) pt-4">
      <h3 className="m-0 mb-3 text-[14px] font-semibold leading-5 text-(--text-strong)">
        {title}
      </h3>
      {children}
    </section>
  )
}

function FieldGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-[560px]:grid-cols-1">
      {children}
    </div>
  )
}

function InspectorField({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[13px] font-medium leading-5 text-(--muted)">
        {label}
      </div>
      <div className="min-h-5 break-words text-[14px] leading-6 text-(--text-strong)">
        {children}
      </div>
    </div>
  )
}

function LongText({
  children,
  copyable,
}: {
  children: ReactNode
  copyable?: boolean
}) {
  return (
    <Paragraph
      className="mb-0! whitespace-pre-wrap break-words text-[14px] leading-6 text-(--text-strong)"
      copyable={copyable}
    >
      {children}
    </Paragraph>
  )
}
