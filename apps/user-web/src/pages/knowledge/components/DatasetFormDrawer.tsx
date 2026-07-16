import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Skeleton,
  Space,
} from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  KnowledgeChunkMethod,
  KnowledgeDataset,
  KnowledgeDatasetCreatePayload,
  KnowledgePermission,
} from '@/api/knowledge'

import {
  KNOWLEDGE_CHUNK_METHOD_LABEL_KEYS,
  KNOWLEDGE_PERMISSION_LABEL_KEYS,
} from '../constants'

interface DatasetFormValues {
  chunk_method?: KnowledgeChunkMethod
  chunk_token_num?: number
  delimiter?: string
  description?: string
  embedding_model?: string
  name: string
  permission?: KnowledgePermission
}

export interface DatasetFormDrawerProps {
  confirmLoading?: boolean
  dataset?: KnowledgeDataset
  loading?: boolean
  loadError?: boolean
  mode: 'create' | 'edit'
  open: boolean
  onClose: () => void
  onRetry?: () => void
  onSubmit: (payload: KnowledgeDatasetCreatePayload) => void
}

function toFormValues(dataset?: KnowledgeDataset): Partial<DatasetFormValues> {
  return {
    chunk_method: dataset?.chunk_method ?? 'naive',
    chunk_token_num: dataset?.parser_config?.chunk_token_num ?? 256,
    delimiter: dataset?.parser_config?.delimiter ?? '\n',
    description: dataset?.description ?? undefined,
    embedding_model: dataset?.embedding_model ?? undefined,
    name: dataset?.name ?? '',
    permission: dataset?.permission ?? 'me',
  }
}

function toPayload(values: DatasetFormValues): KnowledgeDatasetCreatePayload {
  return {
    chunk_method: values.chunk_method,
    description: values.description,
    embedding_model: values.embedding_model,
    name: values.name,
    parser_config: {
      chunk_token_num: values.chunk_token_num,
      delimiter: values.delimiter,
    },
    permission: values.permission,
  }
}

export function DatasetFormDrawer({
  confirmLoading,
  dataset,
  loading,
  loadError,
  mode,
  open,
  onClose,
  onRetry,
  onSubmit,
}: DatasetFormDrawerProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<DatasetFormValues>()

  useEffect(() => {
    if (!open) return

    form.setFieldsValue(toFormValues(dataset))
  }, [dataset, form, open])

  const permissionOptions = Object.entries(KNOWLEDGE_PERMISSION_LABEL_KEYS).map(
    ([value, labelKey]) => ({
      label: t(labelKey),
      value,
    }),
  )

  const chunkMethodOptions = Object.entries(
    KNOWLEDGE_CHUNK_METHOD_LABEL_KEYS,
  ).map(([value, labelKey]) => ({
    label: t(labelKey),
    value,
  }))

  return (
    <Drawer
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>{t('common.actions.cancel')}</Button>
          <Button
            loading={confirmLoading}
            type="primary"
            onClick={() => void form.submit()}
          >
            {t('common.actions.save')}
          </Button>
        </Space>
      }
      open={open}
      placement="right"
      title={
        mode === 'create'
          ? t('pages.knowledge.drawer.createTitle')
          : t('pages.knowledge.drawer.editTitle')
      }
      width={560}
      onClose={onClose}
    >
      {loading ? <Skeleton active paragraph={{ rows: 10 }} /> : null}

      {loadError ? (
        <Alert
          showIcon
          action={
            <Button size="small" onClick={onRetry}>
              {t('common.actions.retry')}
            </Button>
          }
          className="mb-4"
          message={t('pages.knowledge.errors.datasetDetailLoadFailed')}
          type="error"
        />
      ) : null}

      {!loading ? (
        <Form
          form={form}
          layout="vertical"
          initialValues={toFormValues(dataset)}
          onFinish={(values) => onSubmit(toPayload(values))}
        >
          <Form.Item
            label={t('pages.knowledge.fields.name')}
            name="name"
            rules={[
              {
                required: true,
                message: t('pages.knowledge.validation.nameRequired'),
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t('pages.knowledge.fields.description')}
            name="description"
          >
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
          </Form.Item>

          <Form.Item
            label={t('pages.knowledge.fields.permission')}
            name="permission"
          >
            <Select options={permissionOptions} />
          </Form.Item>

          <Form.Item
            label={t('pages.knowledge.fields.embeddingModel')}
            name="embedding_model"
          >
            <Input placeholder="text-embedding-v4@Tongyi-Qianwen" />
          </Form.Item>

          <Form.Item
            label={t('pages.knowledge.fields.chunkMethod')}
            name="chunk_method"
          >
            <Select options={chunkMethodOptions} />
          </Form.Item>

          <Form.Item
            label={t('pages.knowledge.fields.chunkTokenNum')}
            name="chunk_token_num"
          >
            <InputNumber className="w-full" min={1} />
          </Form.Item>

          <Form.Item
            label={t('pages.knowledge.fields.delimiter')}
            name="delimiter"
          >
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
        </Form>
      ) : null}
    </Drawer>
  )
}
