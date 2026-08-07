import {
  DeleteOutlined,
  DatabaseOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Checkbox,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { listPublishedDataEndpoints } from '@/api/dataAccess'
import { knowledgeDatasets_list } from '@/api/knowledge'
import {
  getWorkflowDraft,
  updateWorkflowDraft,
  workflowKeys,
} from '@/api/workflow'

const { Text, Title } = Typography

const KNOWLEDGE_RETRIEVAL_TIMEOUT_MS = 120_000

interface ResourceBinding {
  resource_type: string
  resource_id: string
  resource_version?: string | null
  schema_hash?: string
  required?: boolean
  config?: Record<string, unknown>
  [key: string]: unknown
}

interface KnowledgeFormRow {
  resource_id: string
  resource_version?: string
  binding_key: string
  required: boolean
  retrieval_modes: string[]
  candidate_k: number
  top_k: number
  rerank_enabled: boolean
}

interface DataFormRow {
  resource_id: string
  resource_version: string
  binding_key: string
  required: boolean
  allowed_fields: string[]
  max_rows: number
}

interface FormValues {
  knowledge: KnowledgeFormRow[]
  data: DataFormRow[]
}

function stringConfig(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asBindings(value: unknown): ResourceBinding[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  const bindings = (value as { bindings?: unknown }).bindings
  return Array.isArray(bindings)
    ? bindings.filter((binding): binding is ResourceBinding =>
        Boolean(
          binding &&
          typeof binding === 'object' &&
          !Array.isArray(binding) &&
          typeof (binding as ResourceBinding).resource_type === 'string' &&
          typeof (binding as ResourceBinding).resource_id === 'string',
        ),
      )
    : []
}

function toFormValues(bindings: ResourceBinding[]): FormValues {
  return {
    knowledge: bindings
      .filter((binding) => binding.resource_type === 'knowledge')
      .map((binding) => ({
        resource_id: binding.resource_id,
        resource_version: binding.resource_version ?? '',
        binding_key: stringConfig(binding.config?.binding_key),
        required: Boolean(binding.config?.required ?? binding.required ?? true),
        retrieval_modes: Array.isArray(binding.config?.retrieval_modes)
          ? (binding.config.retrieval_modes as string[])
          : ['bm25', 'vector', 'graph'],
        candidate_k: Number(binding.config?.candidate_k ?? 30),
        top_k: Number(binding.config?.top_k ?? 8),
        rerank_enabled: Boolean(
          (binding.config?.rerank as { enabled?: boolean } | undefined)
            ?.enabled ?? true,
        ),
      })),
    data: bindings
      .filter((binding) => binding.resource_type === 'data_endpoint')
      .map((binding) => ({
        resource_id: binding.resource_id,
        resource_version: binding.resource_version ?? '',
        binding_key: stringConfig(binding.config?.binding_key),
        required: Boolean(binding.config?.required ?? binding.required ?? true),
        allowed_fields: Array.isArray(binding.config?.allowed_fields)
          ? (binding.config.allowed_fields as string[])
          : [],
        max_rows: Number(binding.config?.max_rows ?? 100),
      })),
  }
}

export interface ResourceBindingsDrawerProps {
  appId: string
  open: boolean
  onClose: () => void
}

export default function ResourceBindingsDrawer({
  appId,
  open,
  onClose,
}: ResourceBindingsDrawerProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<FormValues>()

  const draftQuery = useQuery({
    queryKey: workflowKeys.draft(appId),
    queryFn: () => getWorkflowDraft(appId),
    enabled: open,
  })
  const datasetsQuery = useQuery({
    queryKey: ['workflow', 'binding-datasets'],
    queryFn: () => knowledgeDatasets_list({ page: 1, page_size: 100 }),
    enabled: open,
  })
  const endpointsQuery = useQuery({
    queryKey: ['workflow', 'binding-data-endpoints'],
    queryFn: listPublishedDataEndpoints,
    enabled: open,
  })

  useEffect(() => {
    if (!open || !draftQuery.data) return
    form.setFieldsValue(
      toFormValues(asBindings(draftQuery.data.resource_bindings_json)),
    )
  }, [draftQuery.data, form, open])

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const draft = draftQuery.data
      if (!draft) throw new Error('Workflow draft is unavailable')
      const current = asBindings(draft.resource_bindings_json)
      const untouched = current.filter(
        (binding) =>
          !['knowledge', 'data_endpoint'].includes(binding.resource_type),
      )
      const knowledge: ResourceBinding[] = values.knowledge.map((row) => {
        const datasetVersion = (datasetsQuery.data?.data ?? []).find(
          (dataset) => dataset.id === row.resource_id,
        )
        const resourceVersion =
          datasetVersion?.version_id ||
          row.resource_version?.trim() ||
          (datasetVersion?.update_time == null
            ? undefined
            : String(datasetVersion.update_time))
        return {
          resource_type: 'knowledge',
          resource_id: row.resource_id,
          resource_version: resourceVersion,
          config: {
            binding_key: row.binding_key.trim(),
            required: row.required,
            retrieval_modes: row.retrieval_modes,
            candidate_k: row.candidate_k,
            top_k: row.top_k,
            fusion: { algorithm: 'rrf', k: 60 },
            dedup: { key: 'content_hash' },
            rerank: { enabled: row.rerank_enabled, top_n: row.top_k },
            timeout_ms: KNOWLEDGE_RETRIEVAL_TIMEOUT_MS,
          },
        }
      })
      const data: ResourceBinding[] = values.data.map((row) => ({
        resource_type: 'data_endpoint',
        resource_id: row.resource_id,
        resource_version: row.resource_version,
        config: {
          binding_key: row.binding_key.trim(),
          required: row.required,
          allowed_fields: row.allowed_fields,
          max_rows: row.max_rows,
          timeout_ms: 10000,
        },
      }))
      return updateWorkflowDraft(
        appId,
        {
          resource_bindings_json: {
            bindings: [...untouched, ...knowledge, ...data],
          },
        },
        draft.revision,
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workflowKeys.draft(appId),
      })
      void message.success(t('pages.flowise.resources.saved'))
      onClose()
    },
    onError: (error: Error) => {
      void message.error(
        error.message || t('pages.flowise.resources.saveError'),
      )
    },
  })

  const datasetOptions = (datasetsQuery.data?.data ?? []).map((dataset) => ({
    value: dataset.id,
    label: dataset.name,
  }))
  const endpointOptions = (endpointsQuery.data ?? []).map((endpoint) => ({
    value: endpoint.endpoint_code,
    label: endpoint.name,
    version: String(endpoint.published_version),
    fields: endpoint.available_fields,
  }))

  return (
    <Drawer
      open={open}
      width="min(760px, 94vw)"
      title={t('pages.flowise.resources.title')}
      onClose={onClose}
      loading={draftQuery.isLoading}
      extra={
        <Button
          type="primary"
          loading={saveMutation.isPending}
          onClick={() => void form.submit()}
        >
          {t('common.save')}
        </Button>
      }
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        initialValues={{ knowledge: [], data: [] }}
        onFinish={saveMutation.mutate}
      >
        <Title level={5}>{t('pages.flowise.resources.knowledge')}</Title>
        <Text type="secondary">{t('pages.flowise.resources.bindingHint')}</Text>
        <Form.List name="knowledge">
          {(fields, { add, remove }) => (
            <Space
              direction="vertical"
              size="middle"
              style={{ width: '100%', marginTop: 12 }}
            >
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  style={{
                    borderTop: '1px solid var(--ant-color-border-secondary)',
                    paddingTop: 12,
                  }}
                >
                  <Space align="start" wrap style={{ width: '100%' }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'resource_id']}
                      label={t('pages.flowise.resources.dataset')}
                      rules={[{ required: true }]}
                      style={{ width: 240 }}
                    >
                      <Select
                        loading={datasetsQuery.isLoading}
                        options={datasetOptions}
                        onChange={(resourceId: string) => {
                          const dataset = (
                            datasetsQuery.data?.data ?? []
                          ).find((item) => item.id === resourceId)
                          form.setFieldValue(
                            ['knowledge', name, 'resource_version'],
                            dataset?.version_id ||
                              (dataset?.update_time == null
                                ? undefined
                                : String(dataset.update_time)),
                          )
                          if (
                            !form.getFieldValue([
                              'knowledge',
                              name,
                              'binding_key',
                            ])
                          ) {
                            form.setFieldValue(
                              ['knowledge', name, 'binding_key'],
                              `knowledge_${resourceId
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, '_')
                                .slice(-8)}`,
                            )
                          }
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'binding_key']}
                      label="Binding Key"
                      rules={[
                        {
                          required: true,
                          pattern: /^[a-z][a-z0-9_.-]{0,63}$/,
                        },
                      ]}
                    >
                      <Input style={{ width: 190 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'resource_version']}
                      hidden
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'required']}
                      label={t('pages.flowise.resources.required')}
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Space>
                  <Space wrap>
                    <Form.Item
                      {...restField}
                      name={[name, 'retrieval_modes']}
                      label={t('pages.flowise.resources.modes')}
                      rules={[{ required: true }]}
                    >
                      <Checkbox.Group
                        options={[
                          { label: 'BM25', value: 'bm25' },
                          {
                            label: t('pages.flowise.resources.vector'),
                            value: 'vector',
                          },
                          {
                            label: t('pages.flowise.resources.graph'),
                            value: 'graph',
                          },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'candidate_k']}
                      label="Candidate K"
                    >
                      <InputNumber min={1} max={100} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'top_k']}
                      label="Top K"
                    >
                      <InputNumber min={1} max={50} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'rerank_enabled']}
                      label="Rerank"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Space>
                </div>
              ))}
              <Button
                icon={<PlusOutlined />}
                onClick={() =>
                  add({
                    required: true,
                    retrieval_modes: ['bm25', 'vector', 'graph'],
                    candidate_k: 30,
                    top_k: 8,
                    rerank_enabled: true,
                  })
                }
              >
                {t('pages.flowise.resources.addKnowledge')}
              </Button>
            </Space>
          )}
        </Form.List>

        <Divider />
        <Title level={5}>{t('pages.flowise.resources.dataEndpoints')}</Title>
        <Form.List name="data">
          {(fields, { add, remove }) => (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  style={{
                    borderTop: '1px solid var(--ant-color-border-secondary)',
                    paddingTop: 12,
                  }}
                >
                  <Space align="start" wrap>
                    <Form.Item
                      {...restField}
                      name={[name, 'resource_id']}
                      label={t('pages.flowise.resources.endpoint')}
                      rules={[{ required: true }]}
                      style={{ width: 240 }}
                    >
                      <Select
                        loading={endpointsQuery.isLoading}
                        options={endpointOptions}
                        onChange={(resourceId: string) => {
                          const option = endpointOptions.find(
                            (item) => item.value === resourceId,
                          )
                          form.setFieldValue(
                            ['data', name, 'resource_version'],
                            option?.version ?? '',
                          )
                          form.setFieldValue(
                            ['data', name, 'allowed_fields'],
                            option?.fields ?? [],
                          )
                          if (
                            !form.getFieldValue(['data', name, 'binding_key'])
                          )
                            form.setFieldValue(
                              ['data', name, 'binding_key'],
                              `data_${resourceId
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, '_')
                                .slice(0, 48)}`,
                            )
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'binding_key']}
                      label="Binding Key"
                      rules={[
                        {
                          required: true,
                          pattern: /^[a-z][a-z0-9_.-]{0,63}$/,
                        },
                      ]}
                    >
                      <Input style={{ width: 190 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'resource_version']}
                      hidden
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'required']}
                      label={t('pages.flowise.resources.required')}
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Space>
                  <Space wrap>
                    <Form.Item
                      {...restField}
                      name={[name, 'allowed_fields']}
                      label={t('pages.flowise.resources.allowedFields')}
                    >
                      <Select mode="tags" style={{ minWidth: 320 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'max_rows']}
                      label={t('pages.flowise.resources.maxRows')}
                    >
                      <InputNumber min={1} max={1000} />
                    </Form.Item>
                  </Space>
                </div>
              ))}
              <Button
                icon={<DatabaseOutlined />}
                onClick={() =>
                  add({ required: true, allowed_fields: [], max_rows: 100 })
                }
              >
                {t('pages.flowise.resources.addData')}
              </Button>
            </Space>
          )}
        </Form.List>
      </Form>
    </Drawer>
  )
}
