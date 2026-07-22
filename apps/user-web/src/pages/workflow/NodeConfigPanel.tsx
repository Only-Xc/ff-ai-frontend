import { DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { knowledgeDatasets_list } from '@/api/knowledge'
import { testWorkflowNode } from '@/api/workflow'

const { Text } = Typography

interface MetadataCondition {
  field: string
  op: string
  value: string
}

interface NodeConfigPanelProps {
  appId?: string
  nodeId: string
  nodeType: string
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function NodeConfigPanel({
  appId,
  nodeId,
  nodeType,
  config,
  onChange,
}: NodeConfigPanelProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [testQuery, setTestQuery] = useState('')
  const [testResult, setTestResult] = useState<{
    status: string
    output?: Record<string, unknown>
    latency_ms?: number
    error?: string
  } | null>(null)

  // 数据集列表（仅 knowledge_retrieval 节点时加载）
  const datasetsQuery = useQuery({
    queryKey: ['knowledge', 'datasets', 'for-workflow'],
    queryFn: () => knowledgeDatasets_list({ page: 1, page_size: 100 }),
    enabled: nodeType === 'knowledge_retrieval',
  })

  // 单节点测试
  const testMutation = useMutation({
    mutationFn: () =>
      testWorkflowNode(appId!, nodeId, {
        test_input: { 'sys.query': testQuery },
      }),
    onSuccess: (res) => {
      setTestResult(res as unknown as typeof testResult)
    },
    onError: (err: Error) => {
      setTestResult({ status: 'failed', error: err.message })
    },
  })

  useEffect(() => {
    form.setFieldsValue(config)
  }, [config, form])

  const handleValuesChange = (_: unknown, allValues: Record<string, unknown>) => {
    onChange(allValues)
  }

  const renderFields = () => {
    switch (nodeType) {
      case 'user_input':
        return (
          <>
            <Form.Item
              name="required_variables"
              label={t('pages.workflow.nodeFields.requiredVariables')}
            >
              <Select mode="tags" placeholder="sys.query" />
            </Form.Item>
            <Form.Item
              name="custom_variables"
              label={t('pages.workflow.nodeFields.customVariables')}
            >
              <Select mode="tags" />
            </Form.Item>
          </>
        )
      case 'permission_gate':
        return (
          <>
            <Form.Item
              name="required_roles"
              label={t('pages.workflow.nodeFields.requiredRoles')}
            >
              <Select mode="tags" />
            </Form.Item>
            <Form.Item
              name="deny_roles"
              label={t('pages.workflow.nodeFields.denyRoles')}
            >
              <Select mode="tags" />
            </Form.Item>
            <Form.Item
              name="org_restricted"
              label={t('pages.workflow.nodeFields.orgRestricted')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </>
        )
      case 'knowledge_retrieval':
        return (
          <>
            <Form.Item
              name="dataset_ids"
              label={t('pages.workflow.nodeFields.datasets')}
            >
              <Select
                mode="multiple"
                showSearch
                optionFilterProp="label"
                loading={datasetsQuery.isFetching}
                placeholder={t('pages.workflow.nodeFields.datasetsPlaceholder')}
                options={(datasetsQuery.data?.data ?? []).map((ds) => ({
                  value: ds.id,
                  label: `${ds.name} (${ds.document_count} docs)`,
                }))}
              />
            </Form.Item>
            <Form.Item name="top_k" label={t('pages.workflow.nodeFields.topK')}>
              <InputNumber min={1} max={20} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="score_threshold"
              label={t('pages.workflow.nodeFields.scoreThreshold')}
            >
              <InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="query_variable"
              label={t('pages.workflow.nodeFields.queryVariable')}
            >
              <Input placeholder="sys.query" />
            </Form.Item>
            <Form.Item
              name="timeout_s"
              label={t('pages.workflow.nodeFields.timeoutSeconds')}
            >
              <InputNumber min={5} max={120} style={{ width: '100%' }} />
            </Form.Item>

            {/* 元数据过滤 */}
            <Divider orientation="left" plain style={{ margin: '12px 0 8px' }}>
              {t('pages.workflow.nodeFields.metadataFilter')}
            </Divider>
            <MetadataFilterConfig config={config} onChange={onChange} />

            {/* 单节点测试 */}
            <Divider orientation="left" plain style={{ margin: '12px 0 8px' }}>
              {t('pages.workflow.nodeFields.testNode')}
            </Divider>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Input.TextArea
                rows={2}
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder={t('pages.workflow.nodeFields.testQueryPlaceholder')}
              />
              <Button
                block
                icon={<SearchOutlined />}
                loading={testMutation.isPending}
                disabled={!testQuery.trim() || !appId}
                onClick={() => {
                  setTestResult(null)
                  testMutation.mutate()
                }}
              >
                {t('pages.workflow.nodeFields.testNode')}
              </Button>
              {testResult && <NodeTestResult result={testResult} t={t} />}
            </Space>
          </>
        )
      case 'data_source_query':
        return (
          <>
            <Form.Item
              name="endpoint_id"
              label={t('pages.workflow.nodeFields.endpointId')}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="field_whitelist"
              label={t('pages.workflow.nodeFields.fieldWhitelist')}
            >
              <Select mode="tags" />
            </Form.Item>
            <Form.Item name="max_rows" label={t('pages.workflow.nodeFields.maxRows')}>
              <InputNumber min={1} max={500} style={{ width: '100%' }} />
            </Form.Item>
          </>
        )
      case 'variable_transform':
        return (
          <Form.Item
            name="transforms"
            label={t('pages.workflow.nodeFields.transforms')}
          >
            <Input.TextArea
              rows={6}
              placeholder='[{"target": "var", "source": "{{path}}"}]'
            />
          </Form.Item>
        )
      case 'template':
        return (
          <>
            <Form.Item
              name="template"
              label={t('pages.workflow.nodeFields.template')}
            >
              <Input.TextArea rows={6} placeholder="{{variable}}" />
            </Form.Item>
            <Form.Item
              name="output_variable"
              label={t('pages.workflow.nodeFields.outputVariable')}
            >
              <Input placeholder="prompt_fragment" />
            </Form.Item>
            <Form.Item
              name="required_variables"
              label={t('pages.workflow.nodeFields.requiredVariables')}
            >
              <Select mode="tags" />
            </Form.Item>
          </>
        )
      case 'condition':
        return (
          <>
            <Form.Item
              name="conditions"
              label={t('pages.workflow.nodeFields.conditions')}
            >
              <Input.TextArea
                rows={6}
                placeholder='[{"branch_id": "yes", "variable": "x", "operator": "eq", "value": "1"}]'
              />
            </Form.Item>
            <Form.Item
              name="default_branch"
              label={t('pages.workflow.nodeFields.defaultBranch')}
            >
              <Input placeholder="default" />
            </Form.Item>
          </>
        )
      case 'llm':
        return (
          <>
            <Form.Item
              name="system_prompt"
              label={t('pages.workflow.nodeFields.systemPrompt')}
            >
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item
              name="temperature"
              label={t('pages.workflow.nodeFields.temperature')}
            >
              <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="max_tokens"
              label={t('pages.workflow.nodeFields.maxTokens')}
            >
              <InputNumber min={1} max={32768} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="model" label={t('pages.workflow.nodeFields.model')}>
              <Input placeholder="deepseek-chat" />
            </Form.Item>
          </>
        )
      case 'answer':
        return (
          <>
            <Form.Item
              name="template"
              label={t('pages.workflow.nodeFields.answerTemplate')}
            >
              <Input.TextArea rows={4} placeholder="{{text}}" />
            </Form.Item>
            <Form.Item
              name="include_citations"
              label={t('pages.workflow.nodeFields.includeCitations')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="include_structured"
              label={t('pages.workflow.nodeFields.includeStructured')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </>
        )
      default:
        return <p>{t('pages.workflow.noConfig')}</p>
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      size="small"
    >
      {renderFields()}
    </Form>
  )
}

// ─── 元数据过滤配置组件 ───────────────────────────────────────────────────────

function MetadataFilterConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}) {
  const { t } = useTranslation()
  const filter = (config.metadata_filter as {
    conditions?: MetadataCondition[]
    logic?: string
  }) || { conditions: [], logic: 'AND' }
  const conditions = filter.conditions ?? []
  const logic = filter.logic ?? 'AND'

  const updateFilter = (newConditions: MetadataCondition[], newLogic: string) => {
    onChange({
      ...config,
      metadata_filter:
        newConditions.length > 0
          ? { conditions: newConditions, logic: newLogic }
          : undefined,
    })
  }

  const addCondition = () => {
    updateFilter([...conditions, { field: '', op: 'eq', value: '' }], logic)
  }

  const removeCondition = (index: number) => {
    updateFilter(conditions.filter((_, i) => i !== index), logic)
  }

  const updateCondition = (index: number, patch: Partial<MetadataCondition>) => {
    const updated = conditions.map((c, i) => (i === index ? { ...c, ...patch } : c))
    updateFilter(updated, logic)
  }

  return (
    <div>
      {conditions.length > 1 && (
        <Form.Item style={{ marginBottom: 8 }}>
          <Select
            value={logic}
            onChange={(v) => updateFilter(conditions, v)}
            options={[
              { value: 'AND', label: t('pages.workflow.nodeFields.logicAnd') },
              { value: 'OR', label: t('pages.workflow.nodeFields.logicOr') },
            ]}
            size="small"
            style={{ width: 100 }}
          />
        </Form.Item>
      )}
      {conditions.map((cond, idx) => (
        <Space key={idx} style={{ display: 'flex', marginBottom: 6 }} align="start">
          <Input
            size="small"
            style={{ width: 90 }}
            placeholder="field"
            value={cond.field}
            onChange={(e) => updateCondition(idx, { field: e.target.value })}
          />
          <Select
            size="small"
            style={{ width: 90 }}
            value={cond.op}
            onChange={(v) => updateCondition(idx, { op: v })}
            options={[
              { value: 'eq', label: '=' },
              { value: 'contains', label: 'contains' },
              { value: 'gt', label: '>' },
              { value: 'lt', label: '<' },
            ]}
          />
          <Input
            size="small"
            style={{ width: 90 }}
            placeholder="value"
            value={cond.value}
            onChange={(e) => updateCondition(idx, { value: e.target.value })}
          />
          <Button
            size="small"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeCondition(idx)}
          />
        </Space>
      ))}
      <Button
        size="small"
        type="dashed"
        icon={<PlusOutlined />}
        onClick={addCondition}
        block
      >
        {t('pages.workflow.nodeFields.addField')}
      </Button>
    </div>
  )
}

// ─── 节点测试结果展示 ─────────────────────────────────────────────────────────

function NodeTestResult({
  result,
  t,
}: {
  result: {
    status: string
    output?: Record<string, unknown>
    latency_ms?: number
    error?: string
  }
  t: (key: string) => string
}) {
  if (result.status === 'failed') {
    return (
      <Alert
        type="error"
        showIcon
        message={result.error || 'Test failed'}
        style={{ marginTop: 8 }}
      />
    )
  }

  const output = result.output ?? {}
  const count = (output.count as number) ?? 0
  const chunks = (output.chunks as Array<{ score?: number; content?: string; document_name?: string }>) ?? []
  const bestScore = chunks.length > 0
    ? Math.max(...chunks.map((c) => c.score ?? 0))
    : 0

  return (
    <div
      style={{
        marginTop: 8,
        padding: 10,
        borderRadius: 6,
        background: '#f6f8fa',
        fontSize: 12,
      }}
    >
      <Text strong style={{ fontSize: 12 }}>
        {t('pages.workflow.nodeFields.testResult')}
      </Text>
      <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Tag color="blue">
          {t('pages.workflow.nodeFields.hitCount')}: {count}
        </Tag>
        <Tag color="green">
          {t('pages.workflow.nodeFields.bestScore')}: {bestScore.toFixed(2)}
        </Tag>
        <Tag>
          {t('pages.workflow.nodeFields.latency')}: {result.latency_ms ?? 0}ms
        </Tag>
      </div>
      {chunks.slice(0, 3).map((chunk, i) => (
        <div
          key={i}
          style={{
            marginTop: 6,
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid #e8e8e8',
            background: '#fff',
          }}
        >
          <Text type="secondary" style={{ fontSize: 11 }}>
            #{i + 1} [{chunk.document_name}] score={chunk.score?.toFixed(2)}
          </Text>
          <div style={{ fontSize: 12, marginTop: 2 }}>
            {(chunk.content ?? '').slice(0, 120)}
            {(chunk.content ?? '').length > 120 ? '...' : ''}
          </div>
        </div>
      ))}
    </div>
  )
}
