import { CopyOutlined, SearchOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Collapse,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Space,
  Typography,
} from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { KnowledgeDataset } from '@/api/knowledge'
import { globalMessage } from '@/utils/message'

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

function stringifyRaw(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
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

  const handleFinish = (values: RetrievalFormValues) => {
    setHasSearched(true)
    onSearch(values)
  }

  return (
    <div className="grid min-h-0 grid-cols-[360px_minmax(0,1fr)] gap-4 py-2 max-[1100px]:grid-cols-1">
      <div className="rounded-lg border border-(--ant-color-border-secondary) p-4">
        <Space className="mb-4 w-full" direction="vertical" size={2}>
          <Text strong>{dataset.name}</Text>
          <Text copyable type="secondary">
            {dataset.id}
          </Text>
        </Space>

        <Form
          form={form}
          initialValues={{ top_k: 5 }}
          layout="vertical"
          onFinish={handleFinish}
        >
          <Form.Item
            label={t('pages.knowledge.retrieval.query')}
            name="query"
            rules={[
              {
                required: true,
                message: t('pages.knowledge.validation.queryRequired'),
              },
            ]}
          >
            <Input.TextArea autoSize={{ minRows: 6, maxRows: 12 }} />
          </Form.Item>

          <Form.Item label="Top K" name="top_k">
            <InputNumber className="w-full" max={20} min={1} />
          </Form.Item>

          <Button
            block
            icon={<SearchOutlined />}
            loading={loading}
            type="primary"
            onClick={() => void form.submit()}
          >
            {t('pages.knowledge.actions.search')}
          </Button>
        </Form>
      </div>

      <div className="min-h-0 overflow-auto rounded-lg border border-(--ant-color-border-secondary) p-4">
        {error ? (
          <Alert
            showIcon
            className="mb-4"
            message={t('pages.knowledge.errors.searchFailed')}
            type="error"
          />
        ) : null}

        {hasSearched && !loading && results.length === 0 && !error ? (
          <Empty
            className="py-16"
            description={t('pages.knowledge.empty.noSearchResults')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : null}

        {!hasSearched && !loading ? (
          <Empty
            className="py-16"
            description={t('pages.knowledge.retrieval.empty')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : null}

        <List
          dataSource={results}
          loading={loading}
          renderItem={(item, index) => (
            <List.Item
              actions={[
                <Button
                  icon={<CopyOutlined />}
                  key="copy"
                  size="small"
                  onClick={() => {
                    void navigator.clipboard.writeText(item.displayContent)
                    globalMessage.success(t('pages.knowledge.feedback.copied'))
                  }}
                />,
                <Button
                  key="inspect"
                  size="small"
                  onClick={() => onInspectResult(item)}
                >
                  {t('common.actions.detail')}
                </Button>,
              ]}
            >
              <List.Item.Meta
                description={
                  <Space wrap size={[8, 4]}>
                    <Text type="secondary">
                      #{index + 1}
                    </Text>
                    <Text type="secondary">
                      {item.displayDocumentName}
                    </Text>
                    <Text type="secondary">
                      {formatSearchScore(item.displayScore)}
                    </Text>
                    {item.displayChunkId ? (
                      <Text copyable type="secondary">
                        {item.displayChunkId}
                      </Text>
                    ) : null}
                  </Space>
                }
                title={
                  <Paragraph className="mb-0!" ellipsis={{ rows: 4 }}>
                    {item.displayContent || '-'}
                  </Paragraph>
                }
              />
              <Collapse
                ghost
                className="w-full"
                items={[
                  {
                    key: 'raw',
                    label: t('pages.knowledge.retrieval.rawFields'),
                    children: (
                      <pre className="max-h-80 overflow-auto rounded bg-(--ant-color-fill-tertiary) p-3 text-xs">
                        {stringifyRaw(item)}
                      </pre>
                    ),
                  },
                ]}
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  )
}
