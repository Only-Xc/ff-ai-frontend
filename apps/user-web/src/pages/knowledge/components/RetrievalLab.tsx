import {
  CopyOutlined,
  DatabaseOutlined,
  EyeOutlined,
  FileTextOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { KeyboardEvent } from 'react'
import { useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

import type { KnowledgeDataset } from '@/api/knowledge'
import { globalMessage } from '@/utils/message'

import {
  KNOWLEDGE_CHUNK_METHOD_LABEL_KEYS,
  KNOWLEDGE_PERMISSION_LABEL_KEYS,
} from '../constants'
import type { NormalizedKnowledgeSearchResult } from '../types'
import { formatSearchScore } from '../utils/format'

const { Paragraph, Text } = Typography

interface RetrievalFormValues {
  query: string
  top_k: number
}

export interface RetrievalLabProps {
  dataset: KnowledgeDataset
  error?: unknown
  loading?: boolean
  results: NormalizedKnowledgeSearchResult[]
  onInspectResult: (result: NormalizedKnowledgeSearchResult) => void
  onSearch: (payload: { query: string; top_k: number }) => void
}

type Translate = TFunction<'translation', undefined>

function getScoreTone(score?: number) {
  if (typeof score !== 'number') {
    return {
      className:
        'border-(--ant-color-border-secondary)! bg-(--ant-color-fill-quaternary)! text-(--muted)!',
      labelKey: 'pages.knowledge.retrieval.scoreUnknown',
    }
  }

  if (score >= 0.8) {
    return {
      className:
        'border-(--ant-color-success-border)! bg-[color-mix(in_srgb,var(--ant-color-success)_10%,var(--ant-color-bg-container))]! text-(--ant-color-success-text)!',
      labelKey: 'pages.knowledge.retrieval.scoreHigh',
    }
  }

  if (score >= 0.5) {
    return {
      className:
        'border-(--ant-color-info-border)! bg-[color-mix(in_srgb,var(--ant-color-info)_10%,var(--ant-color-bg-container))]! text-(--ant-color-info-text)!',
      labelKey: 'pages.knowledge.retrieval.scoreMedium',
    }
  }

  return {
    className:
      'border-(--ant-color-border-secondary)! bg-(--ant-color-fill-quaternary)! text-(--muted)!',
    labelKey: 'pages.knowledge.retrieval.scoreLow',
  }
}

function getBestScore(results: NormalizedKnowledgeSearchResult[]) {
  const scores = results
    .map((item) => item.displayScore)
    .filter((score): score is number => typeof score === 'number')

  if (scores.length === 0) return undefined

  return Math.max(...scores)
}

export function RetrievalLab({
  dataset,
  error,
  loading,
  results,
  onInspectResult,
  onSearch,
}: RetrievalLabProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<RetrievalFormValues>()
  const [hasSearched, setHasSearched] = useState(false)
  const watchedTopK = Form.useWatch('top_k', form)
  const bestScore = getBestScore(results)

  const handleFinish = (values: RetrievalFormValues) => {
    setHasSearched(true)
    onSearch(values)
  }

  const handleQueryKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      void form.submit()
    }
  }

  const permissionLabel = dataset.permission
    ? t(KNOWLEDGE_PERMISSION_LABEL_KEYS[dataset.permission] ?? dataset.permission)
    : t('pages.knowledge.empty.noValue')
  const chunkMethodLabel = dataset.chunk_method
    ? t(
        KNOWLEDGE_CHUNK_METHOD_LABEL_KEYS[dataset.chunk_method] ??
          dataset.chunk_method,
      )
    : t('pages.knowledge.empty.noValue')

  return (
    <div className="grid h-full min-h-0 grid-cols-[300px_minmax(0,1fr)] gap-4 max-[1100px]:grid-cols-1">
      <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-(--ant-color-border-secondary) bg-[color-mix(in_srgb,var(--ant-color-bg-container)_97%,var(--ant-color-bg-layout))] shadow-[0_1px_2px_rgb(15_23_42/0.03)] max-[1100px]:min-h-[240px]">
        <div className="border-b border-b-(--ant-color-border-secondary) px-3.5 py-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--ant-color-primary)_10%,var(--ant-color-bg-container))] text-(--ant-color-primary)">
              <DatabaseOutlined />
            </span>
            <Text className="min-w-0 flex-1 text-[13px] font-semibold leading-5 text-(--text-strong)!" ellipsis>
              {t('pages.knowledge.retrieval.currentDataset')}
            </Text>
          </div>
          <Text className="block text-[14px] font-semibold leading-5 text-(--text-strong)!" ellipsis>
            {dataset.name}
          </Text>
          <Text copyable className="mt-1 block text-[12px] leading-5 text-(--muted)!" ellipsis>
            {dataset.id}
          </Text>
        </div>

        <div className="space-y-2.5 border-b border-b-(--ant-color-border-secondary) px-3.5 py-3">
          <MetaItem
            label={t('pages.knowledge.fields.permission')}
            value={permissionLabel}
          />
          <MetaItem
            label={t('pages.knowledge.fields.chunkMethod')}
            value={chunkMethodLabel}
          />
          <MetaItem
            label={t('pages.knowledge.fields.embeddingModel')}
            value={dataset.embedding_model ?? t('pages.knowledge.empty.noValue')}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-3.5 py-3">
          <Form
            className="p-3"
            form={form}
            initialValues={{ top_k: 5 }}
            layout="vertical"
            onFinish={handleFinish}
          >
            <Form.Item
              className="mb-3 [&_.ant-form-item-label]:pb-1.5"
              label={t('pages.knowledge.retrieval.query')}
              name="query"
              rules={[
                {
                  required: true,
                  message: t('pages.knowledge.validation.queryRequired'),
                },
              ]}
            >
              <Input.TextArea
                autoSize={{ minRows: 5, maxRows: 9 }}
                className="rounded-md! text-[13px] leading-5"
                placeholder={t('pages.knowledge.retrieval.queryPlaceholder')}
                onKeyDown={handleQueryKeyDown}
              />
            </Form.Item>

            <Form.Item
              className="mb-3 [&_.ant-form-item-label]:pb-1.5"
              label={t('pages.knowledge.retrieval.topK')}
              name="top_k"
            >
              <InputNumber className="w-full rounded-md!" max={20} min={1} />
            </Form.Item>

            <Button
              block
              className="h-9!"
              icon={<SearchOutlined />}
              loading={loading}
              type="primary"
              onClick={() => void form.submit()}
            >
              {t('pages.knowledge.actions.search')}
            </Button>
          </Form>
        </div>
      </aside>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) shadow-[0_1px_2px_rgb(15_23_42/0.03)]">
        <div className="grid shrink-0 grid-cols-3 gap-2 border-b border-b-(--ant-color-border-secondary) bg-[color-mix(in_srgb,var(--ant-color-fill-quaternary)_45%,transparent)] px-3.5 py-3 max-[760px]:grid-cols-1">
          <SummaryMetric
            label={t('pages.knowledge.retrieval.hitCount')}
            value={hasSearched ? results.length.toLocaleString() : '-'}
          />
          <SummaryMetric
            label={t('pages.knowledge.retrieval.bestScore')}
            value={hasSearched ? formatSearchScore(bestScore) : '-'}
          />
          <SummaryMetric
            label={t('pages.knowledge.retrieval.topK')}
            value={watchedTopK ?? 5}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-3.5 py-3 [scrollbar-gutter:stable]">
          {error ? (
            <Alert
              showIcon
              className="mb-3 rounded-lg!"
              message={t('pages.knowledge.errors.searchFailed')}
              type="error"
            />
          ) : null}

          {hasSearched && !loading && results.length === 0 && !error ? (
            <Empty
              className="py-14"
              description={t('pages.knowledge.empty.noSearchResults')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : null}

          {!hasSearched && !loading ? (
            <Empty
              className="py-14"
              description={t('pages.knowledge.retrieval.empty')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : null}

          <div className="space-y-2.5">
            {loading ? (
              <div className="rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) px-3 py-8 text-center text-[13px] text-(--muted)">
                {t('pages.knowledge.retrieval.searching')}
              </div>
            ) : null}
            {results.map((item, index) => (
              <ResultCard
                item={item}
                key={item.displayChunkId ?? `${item.displayDocumentName}-${index}`}
                rank={index + 1}
                t={t}
                onCopy={() => {
                  void navigator.clipboard.writeText(item.displayContent)
                  globalMessage.success(t('pages.knowledge.feedback.copied'))
                }}
                onInspect={() => onInspectResult(item)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function ResultCard({
  item,
  onCopy,
  onInspect,
  rank,
  t,
}: {
  item: NormalizedKnowledgeSearchResult
  onCopy: () => void
  onInspect: () => void
  rank: number
  t: Translate
}) {
  const scoreTone = getScoreTone(item.displayScore)

  return (
    <article
      className="group grid cursor-pointer grid-cols-[44px_minmax(0,1fr)_auto] gap-3 rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) px-3 py-3 transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--ant-color-primary)_24%,var(--ant-color-border))] hover:bg-[color-mix(in_srgb,var(--ant-color-primary)_3%,var(--ant-color-bg-container))] max-[760px]:grid-cols-[36px_minmax(0,1fr)]"
      tabIndex={0}
      onClick={onInspect}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onInspect()
      }}
    >
      <div className="flex size-9 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--ant-color-primary)_9%,var(--ant-color-bg-container))] text-[12px] font-semibold text-(--ant-color-primary)">
        #{rank}
      </div>
      <div className="min-w-0">
        <Paragraph className="mb-2! text-[13px] leading-5 text-(--text-strong)" ellipsis={{ rows: 3 }}>
          {item.displayContent || t('pages.knowledge.empty.noValue')}
        </Paragraph>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[12px] leading-5 text-(--muted)">
          <Tag className="m-0! max-w-[260px] rounded-md! border-transparent! bg-[color-mix(in_srgb,var(--ant-color-fill-tertiary)_72%,transparent)]! px-1.5! py-0! text-[11px] leading-5! text-(--muted)!">
            <FileTextOutlined className="mr-1" />
            <span className="align-middle">{item.displayDocumentName}</span>
          </Tag>
          {item.displayChunkId ? (
            <Text copyable className="max-w-[240px] text-[11px] leading-5 text-(--muted)!" ellipsis>
              {item.displayChunkId}
            </Text>
          ) : null}
        </div>
      </div>
      <div className="flex min-w-[132px] flex-col items-end justify-between gap-2 max-[760px]:col-span-2 max-[760px]:ml-12 max-[760px]:min-w-0 max-[760px]:flex-row">
        <Tag className={`m-0! rounded-md! px-2! py-0.5! text-[11px] leading-5! ${scoreTone.className}`}>
          {t(scoreTone.labelKey)} {formatSearchScore(item.displayScore)}
        </Tag>
        <div className="flex items-center gap-1">
          <Tooltip title={t('pages.knowledge.retrieval.copyContent')}>
            <Button
              icon={<CopyOutlined />}
              size="small"
              type="text"
              onClick={(event) => {
                event.stopPropagation()
                onCopy()
              }}
            />
          </Tooltip>
          <Tooltip title={t('common.actions.detail')}>
            <Button
              icon={<EyeOutlined />}
              size="small"
              type="text"
              onClick={(event) => {
                event.stopPropagation()
                onInspect()
              }}
            />
          </Tooltip>
        </div>
      </div>
    </article>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[color-mix(in_srgb,var(--ant-color-border-secondary)_70%,transparent)] bg-(--ant-color-bg-container) px-2.5 py-2">
      <div className="mb-0.5 text-[11px] font-medium leading-4 text-(--muted)">
        {label}
      </div>
      <div className="truncate text-[12px] leading-5 text-(--text-strong)">
        {value}
      </div>
    </div>
  )
}

function SummaryMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-[color-mix(in_srgb,var(--ant-color-border-secondary)_72%,transparent)] bg-(--ant-color-bg-container) px-3 py-2">
      <div className="text-[11px] font-medium leading-4 text-(--muted)">
        {label}
      </div>
      <div className="mt-0.5 text-[16px] font-semibold leading-6 text-(--text-strong)">
        {value}
      </div>
    </div>
  )
}
