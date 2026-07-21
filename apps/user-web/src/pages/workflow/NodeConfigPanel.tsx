import { Form, Input, InputNumber, Select, Switch } from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface NodeConfigPanelProps {
  nodeId: string
  nodeType: string
  config: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
}

export function NodeConfigPanel({
  nodeType,
  config,
  onChange,
}: NodeConfigPanelProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm()

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
              label={t('pages.workflow.nodeFields.datasetIds')}
            >
              <Select mode="tags" />
            </Form.Item>
            <Form.Item name="top_k" label={t('pages.workflow.nodeFields.topK')}>
              <InputNumber min={1} max={20} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="score_threshold"
              label={t('pages.workflow.nodeFields.scoreThreshold')}
            >
              <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="query_variable"
              label={t('pages.workflow.nodeFields.queryVariable')}
            >
              <Input placeholder="sys.query" />
            </Form.Item>
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
