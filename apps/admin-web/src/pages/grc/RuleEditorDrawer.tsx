import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { App, Alert, Button, Drawer, Form, Input, InputNumber, Popconfirm, Select, Space, Switch, Typography } from 'antd'
import { useMutation } from '@tanstack/react-query'

import {
  type GrcRule,
  type GrcRuleCreate,
  type GrcRuleUpdate,
  type GrcRuleVersionCreate,
  grcRule_create,
  grcRule_update,
  grcRule_validate,
  grcRuleVersion_create,
  grcRuleVersion_publish,
  grcRuleVersion_retire,
} from '@/api/grc'

const CATEGORIES = ['privacy', 'security', 'safety', 'model', 'data', 'tool', 'deployment', 'access_control', 'logging', 'human_oversight', 'legal', 'operational']
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const EVALUATOR_TYPES = ['builtin', 'json_logic', 'manual']
const BUILTIN_EVALUATORS = [
  'plaintext_secrets_detected',
  'external_network_allowed',
  'human_oversight_present',
  'restricted_data_no_external_send',
  'pii_has_mitigation',
  'model_in_approved_list',
  'deployment_artifact_complete',
  'audit_logging_enabled',
  'min_permissions',
  'owner_sla_rollback',
]

const EVALUATOR_EXAMPLES: Record<string, {
  requiredFields: string[]
  applicableScope: Record<string, unknown>
  evidenceRequirements: Record<string, unknown>
}> = {
  plaintext_secrets_detected: { requiredFields: [], applicableScope: {}, evidenceRequirements: {} },
  external_network_allowed: {
    requiredFields: ['applicable_scope.allowed_domains'],
    applicableScope: { allowed_domains: ['api.company.com', 'auth.company.com'] },
    evidenceRequirements: {},
  },
  human_oversight_present: {
    requiredFields: ['evidence_requirements.stop_control|approval_step|owner'],
    applicableScope: {},
    evidenceRequirements: { stop_control: true, approval_step: true, owner: true },
  },
  restricted_data_no_external_send: {
    requiredFields: ['applicable_scope.approved_models'],
    applicableScope: { approved_models: ['claude-opus-4-8'] },
    evidenceRequirements: {},
  },
  pii_has_mitigation: { requiredFields: [], applicableScope: {}, evidenceRequirements: {} },
  model_in_approved_list: {
    requiredFields: ['applicable_scope.approved_models'],
    applicableScope: { approved_models: ['anthropic/claude-opus-4-8'] },
    evidenceRequirements: {},
  },
  deployment_artifact_complete: { requiredFields: [], applicableScope: {}, evidenceRequirements: {} },
  audit_logging_enabled: { requiredFields: [], applicableScope: {}, evidenceRequirements: {} },
  min_permissions: {
    requiredFields: ['applicable_scope.required_permissions|denied_permissions'],
    applicableScope: { required_permissions: ['read:knowledge'], denied_permissions: ['admin:system'] },
    evidenceRequirements: {},
  },
  owner_sla_rollback: { requiredFields: [], applicableScope: {}, evidenceRequirements: {} },
}

const formatJson = (value: Record<string, unknown>) => JSON.stringify(value, null, 2)

type RuleVersionFormValues = Omit<GrcRuleVersionCreate, 'applicable_scope' | 'evaluator_config' | 'evidence_requirements'> & {
  evaluator?: string
  applicable_scope?: string
  evidence_requirements?: string
}

const parseJsonObject = (value?: string) => {
  if (!value?.trim()) return {}
  return JSON.parse(value) as Record<string, unknown>
}

const buildVersionPayload = (data: RuleVersionFormValues): GrcRuleVersionCreate => {
  const {
    evaluator,
    applicable_scope,
    evidence_requirements,
    ...rest
  } = data

  return {
    ...rest,
    applicable_scope: parseJsonObject(applicable_scope),
    evaluator_config: evaluator ? { evaluator } : {},
    evidence_requirements: parseJsonObject(evidence_requirements),
  }
}

export function RuleEditorDrawer({ open, rule, onClose, onSuccess }: {
  open: boolean
  rule: GrcRule | null
  onClose: () => void
  onSuccess: () => void
}) {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [versionForm] = Form.useForm()
  const [showVersionForm, setShowVersionForm] = useState(false)

  const isEdit = !!rule

  const saveMutation = useMutation({
    mutationFn: (data: GrcRuleCreate | GrcRuleUpdate) =>
      isEdit && rule
        ? grcRule_update(rule.id, data as GrcRuleUpdate)
        : grcRule_create(data as GrcRuleCreate),
    onSuccess: () => {
      message.success(isEdit ? t('pages.grc.rules.ruleUpdated') : t('pages.grc.rules.ruleCreated'))
      onSuccess()
      onClose()
    },
  })

  const versionMutation = useMutation({
    mutationFn: (data: GrcRuleVersionCreate) => grcRuleVersion_create(rule!.id, data),
    onSuccess: () => {
      message.success(t('pages.grc.rules.versionCreated'))
      onSuccess()
      versionForm.resetFields()
      setShowVersionForm(false)
    },
    onError: () => {
      message.error(t('pages.grc.rules.versionCreateFailed'))
    },
  })

  const publishMutation = useMutation({
    mutationFn: (version: number) =>
      grcRuleVersion_publish(rule!.id, version, { change_note: '' }),
    onSuccess: () => {
      message.success(t('pages.grc.rules.versionPublished'))
      onSuccess()
    },
  })

  const retireMutation = useMutation({
    mutationFn: (version: number) => grcRuleVersion_retire(rule!.id, version),
    onSuccess: () => {
      message.success(t('pages.grc.rules.versionRetired'))
      onSuccess()
    },
  })

  const handleSubmit = () => {
    form.validateFields().then(values => {
      saveMutation.mutate(values)
    })
  }

  const applyEvaluatorExample = (evaluator: string) => {
    const example = EVALUATOR_EXAMPLES[evaluator]
    if (!example) return
    versionForm.setFieldsValue({
      applicable_scope: formatJson(example.applicableScope),
      evidence_requirements: formatJson(example.evidenceRequirements),
    })
  }

  const handleCreateVersion = () => {
    versionForm.validateFields().then(async values => {
      let payload: GrcRuleVersionCreate
      try {
        payload = buildVersionPayload(values as RuleVersionFormValues)
      } catch {
        message.error(t('pages.grc.rules.invalidJson'))
        return
      }

      try {
        const validation = await grcRule_validate({
          evaluator_type: payload.evaluator_type,
          evaluator_config: payload.evaluator_config,
          applicable_scope: payload.applicable_scope,
          evidence_requirements: payload.evidence_requirements,
        })
        if (!validation.valid) {
          message.error(`${t('pages.grc.rules.validationFailed')}: ${validation.errors.join('; ')}`)
          return
        }
        if (validation.warnings?.length) {
          message.warning(`${t('pages.grc.rules.validationWarnings')}: ${validation.warnings.join('; ')}`)
        } else {
          message.success(t('pages.grc.rules.validationPassed'))
        }
        versionMutation.mutate(payload)
      } catch {
        message.error(t('pages.grc.rules.validationFailed'))
      }
    })
  }

  return (
    <Drawer
      title={isEdit ? `${t('pages.grc.rules.editRule')}: ${rule?.code}` : t('pages.grc.rules.createRule')}
      open={open}
      onClose={onClose}
      size="large"
      footer={
        <Space>
          <Button onClick={onClose}>{t('pages.grc.common.cancel')}</Button>
          <Button type="primary" onClick={handleSubmit} loading={saveMutation.isPending}>
            {t('pages.grc.common.save')}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={isEdit ? { name: rule?.name, description: rule?.description } : { code: '', name: '', category: 'security', description: '' }}>
        {!isEdit && (
          <Form.Item name="code" label={t('pages.grc.rules.ruleCode')} rules={[{ required: true }]}>
            <Input placeholder="GRC-SEC-001" />
          </Form.Item>
        )}
        <Form.Item name="name" label={t('pages.grc.rules.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        {!isEdit && (
          <Form.Item name="category" label={t('pages.grc.rules.category')} rules={[{ required: true }]}>
            <Select options={CATEGORIES.map(c => ({ value: c, label: c }))} />
          </Form.Item>
        )}
        <Form.Item name="description" label={t('pages.grc.rules.description')}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>

      {/* Version management section (edit mode only) */}
      {isEdit && rule && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          {rule.current_version != null && (
            <Space style={{ marginBottom: 16 }}>
              <span>
                {t('pages.grc.rules.version')}: <strong>{rule.current_version}</strong>
              </span>
              <Popconfirm
                title={t('pages.grc.rules.publishConfirm')}
                onConfirm={() => publishMutation.mutate(rule.current_version!)}
                okText={t('pages.grc.common.confirm')}
                cancelText={t('pages.grc.common.cancel')}
              >
                <Button size="small" type="primary" loading={publishMutation.isPending}>
                  {t('pages.grc.rules.publish')}
                </Button>
              </Popconfirm>
              <Popconfirm
                title={t('pages.grc.rules.publishConfirm')}
                onConfirm={() => retireMutation.mutate(rule.current_version!)}
                okText={t('pages.grc.common.confirm')}
                cancelText={t('pages.grc.common.cancel')}
              >
                <Button size="small" danger loading={retireMutation.isPending}>
                  {t('pages.grc.rules.retire')}
                </Button>
              </Popconfirm>
            </Space>
          )}
          <Button type="dashed" block onClick={() => setShowVersionForm(!showVersionForm)}>
            {showVersionForm ? t('pages.grc.rules.hide') : t('pages.grc.rules.newVersion')}
          </Button>
          {showVersionForm && (
            <Form
              form={versionForm}
              layout="vertical"
              style={{ marginTop: 16 }}
              initialValues={{
                version: (rule.current_version ?? 0) + 1,
                severity: 'MEDIUM',
                risk_score: 25,
                evaluator_type: 'builtin',
                evaluator: 'plaintext_secrets_detected',
                applicable_scope: '{}',
                evidence_requirements: '{}',
                block_on_fail: false,
                exception_allowed: true,
              }}
            >
              <Form.Item name="version" label={t('pages.grc.rules.version')} rules={[{ required: true }]}>
                <InputNumber min={1} />
              </Form.Item>
              <Form.Item name="severity" label={t('pages.grc.rules.severity')} rules={[{ required: true }]}>
                <Select options={SEVERITIES.map(s => ({ value: s, label: s }))} />
              </Form.Item>
              <Form.Item name="risk_score" label={t('pages.grc.rules.riskScore')} rules={[{ required: true, type: 'number', min: 0, max: 100 }]}>
                <InputNumber min={0} max={100} />
              </Form.Item>
              <Form.Item name="evaluator_type" label={t('pages.grc.rules.evaluatorType')} rules={[{ required: true }]}>
                <Select options={EVALUATOR_TYPES.map(type => ({ value: type, label: t(`pages.grc.rules.evaluatorType_${type}`) }))} />
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(prev, next) => prev.evaluator_type !== next.evaluator_type}>
                {({ getFieldValue }) => getFieldValue('evaluator_type') === 'builtin' && (
                  <Form.Item name="evaluator" label={t('pages.grc.rules.builtinEvaluator')} rules={[{ required: true }]}>
                    <Select
                      showSearch
                      options={BUILTIN_EVALUATORS.map(evaluator => ({
                        value: evaluator,
                        label: t(`pages.grc.rules.evaluator_${evaluator}`),
                      }))}
                    />
                  </Form.Item>
                )}
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(prev, next) => prev.evaluator_type !== next.evaluator_type || prev.evaluator !== next.evaluator}>
                {({ getFieldValue }) => {
                  const evaluatorType = getFieldValue('evaluator_type')
                  const evaluator = getFieldValue('evaluator')
                  const example = EVALUATOR_EXAMPLES[evaluator]
                  if (evaluatorType !== 'builtin') {
                    return (
                      <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                        title={t('pages.grc.rules.unsupportedEvaluatorType')}
                      />
                    )
                  }
                  if (!example) return null
                  return (
                    <Alert
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                      title={t('pages.grc.rules.evaluatorGuideTitle')}
                      description={(
                        <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                          <Typography.Text>{t(`pages.grc.rules.evaluatorDesc_${evaluator}`)}</Typography.Text>
                          <Typography.Text>
                            {t('pages.grc.rules.evaluatorGuideRequiredFields')}: {example.requiredFields.length ? example.requiredFields.join(', ') : t('pages.grc.rules.noRequiredFields')}
                          </Typography.Text>
                          <div>
                            <Typography.Text strong>{t('pages.grc.rules.evaluatorGuideApplicableScopeExample')}</Typography.Text>
                            <Typography.Paragraph code copyable style={{ marginBottom: 4 }}>{formatJson(example.applicableScope)}</Typography.Paragraph>
                          </div>
                          <div>
                            <Typography.Text strong>{t('pages.grc.rules.evaluatorGuideEvidenceExample')}</Typography.Text>
                            <Typography.Paragraph code copyable style={{ marginBottom: 4 }}>{formatJson(example.evidenceRequirements)}</Typography.Paragraph>
                          </div>
                          <Button size="small" onClick={() => applyEvaluatorExample(evaluator)}>
                            {t('pages.grc.rules.applyEvaluatorExample')}
                          </Button>
                        </Space>
                      )}
                    />
                  )
                }}
              </Form.Item>
              <Form.Item
                label={t('pages.grc.rules.applicableScope')}
                tooltip={t('pages.grc.rules.applicableScopeTip')}
              >
                <Input.TextArea rows={4} placeholder='{ "allowed_domains": ["api.example.com"] }' />
              </Form.Item>
              <Form.Item
                name="evidence_requirements"
                label={t('pages.grc.rules.evidenceRequirements')}
                tooltip={t('pages.grc.rules.evidenceRequirementsTip')}
              >
                <Input.TextArea rows={3} placeholder='{ "required_controls": ["approval_step"] }' />
              </Form.Item>
              <Form.Item name="block_on_fail" label={t('pages.grc.rules.blockOnFail')} valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="exception_allowed" label={t('pages.grc.rules.exceptionAllowed')} valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="change_note" label={t('pages.grc.rules.changeNote')}>
                <Input.TextArea rows={2} />
              </Form.Item>
              <Button
                type="primary"
                loading={versionMutation.isPending}
                onClick={handleCreateVersion}
              >
                {t('pages.grc.rules.createVersion')}
              </Button>
            </Form>
          )}
        </div>
      )}
    </Drawer>
  )
}
