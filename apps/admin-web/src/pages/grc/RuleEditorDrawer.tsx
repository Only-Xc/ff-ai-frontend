import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { App, Button, Drawer, Form, Input, InputNumber, Popconfirm, Select, Space, Switch, Tag, Typography } from 'antd'
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

import { RuleTestPanel } from './RuleTestPanel'
import { RuleTemplatePicker } from './RuleTemplatePicker'
import type { RuleTemplate } from './ruleTemplates'

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

const JSON_LOGIC_EXAMPLE = {
  expression: {
    and: [
      { '==': [{ var: 'data_classification' }, 'restricted'] },
      { '!': { in: [{ var: 'target_model' }, { var: 'approved_models' }] } },
    ],
  },
  fail_message: '受限数据不能发送给未批准模型',
  pass_message: '数据路由合规',
}

const JSON_LOGIC_TEST_SNAPSHOT_EXAMPLE = {
  data_classification: 'restricted',
  target_model: 'gpt-x',
  approved_models: ['claude-opus-4-8'],
}

const MANUAL_EXAMPLE = {
  review_required: true,
  review_template: '请检查业务目标、用户影响、风险缓解措施。',
}

const formatJson = (value: unknown) => JSON.stringify(value, null, 2)

type RuleVersionFormValues = Omit<GrcRuleVersionCreate, 'applicable_scope' | 'evaluator_config' | 'evidence_requirements'> & {
  evaluator?: string
  applicable_scope?: string
  evidence_requirements?: string
  json_expression?: string
  json_fail_message?: string
  json_pass_message?: string
  manual_review_template?: string
  test_input_snapshot?: string
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
    json_expression,
    json_fail_message,
    json_pass_message,
    manual_review_template,
    test_input_snapshot: _,
    ...rest
  } = data

  let evaluator_config: Record<string, unknown> = {}
  if (rest.evaluator_type === 'json_logic') {
    const expression = json_expression?.trim() ? JSON.parse(json_expression) : {}
    evaluator_config = { expression }
    if (json_fail_message) evaluator_config.fail_message = json_fail_message
    if (json_pass_message) evaluator_config.pass_message = json_pass_message
  } else if (rest.evaluator_type === 'manual') {
    evaluator_config = {
      review_required: true,
      review_template: manual_review_template || MANUAL_EXAMPLE.review_template,
    }
  } else if (rest.evaluator_type === 'builtin' && evaluator) {
    evaluator_config = { evaluator }
  }

  return {
    ...rest,
    applicable_scope: parseJsonObject(applicable_scope),
    evaluator_config,
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
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)

  const handleTemplateSelect = (template: RuleTemplate) => {
    // Apply template values to the version form
    const formValues: Record<string, unknown> = {
      evaluator_type: template.evaluator_type,
      severity: template.severity,
      risk_score: template.risk_score,
      block_on_fail: template.block_on_fail,
      applicable_scope: JSON.stringify(template.applicable_scope),
      evidence_requirements: JSON.stringify(template.evidence_requirements),
    }

    if (template.evaluator_type === 'builtin' && template.evaluator) {
      formValues.evaluator = template.evaluator
    } else if (template.evaluator_type === 'json_logic') {
      const cfg = template.evaluator_config ?? {}
      formValues.json_expression = JSON.stringify(cfg.expression ?? {}, null, 2)
      formValues.json_fail_message = (cfg as Record<string, unknown>).fail_message ?? ''
      formValues.json_pass_message = (cfg as Record<string, unknown>).pass_message ?? ''
    } else if (template.evaluator_type === 'manual') {
      formValues.manual_review_template = template.review_template ?? ''
    }

    versionForm.setFieldsValue(formValues)
    message.success(t('pages.grc.rules.templateApplied'))
  }

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

  const applyBuiltinExample = (evaluator: string) => {
    const example = EVALUATOR_EXAMPLES[evaluator]
    if (!example) return
    versionForm.setFieldsValue({
      applicable_scope: formatJson(example.applicableScope),
      evidence_requirements: formatJson(example.evidenceRequirements),
    })
  }

  const applyJsonLogicExample = () => {
    versionForm.setFieldsValue({
      json_expression: formatJson(JSON_LOGIC_EXAMPLE.expression),
      json_fail_message: JSON_LOGIC_EXAMPLE.fail_message,
      json_pass_message: JSON_LOGIC_EXAMPLE.pass_message,
      test_input_snapshot: formatJson(JSON_LOGIC_TEST_SNAPSHOT_EXAMPLE),
    })
  }

  const applyManualExample = () => {
    versionForm.setFieldsValue({
      manual_review_template: MANUAL_EXAMPLE.review_template,
      test_input_snapshot: formatJson({
        business_purpose: '客户支持自动化',
        user_impact: '可能影响最终用户回答',
        mitigations: ['人工复核', '紧急停止开关'],
      }),
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
          <Button type="dashed" block onClick={() => setShowVersionForm(!showVersionForm)} style={{ marginBottom: 8 }}>
            {showVersionForm ? t('pages.grc.rules.hide') : t('pages.grc.rules.newVersion')}
          </Button>
          <Button type="dashed" block onClick={() => setShowTemplatePicker(true)}>
            {t('pages.grc.rules.fromTemplate')}
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
                json_expression: '',
                json_fail_message: '',
                json_pass_message: '',
                manual_review_template: MANUAL_EXAMPLE.review_template,
                test_input_snapshot: '{}',
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
                  if (evaluatorType === 'json_logic') {
                    return (
                      <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                        title={t('pages.grc.rules.jsonLogicGuideTitle')}
                        description={(
                          <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                            <Typography.Text>{t('pages.grc.rules.jsonLogicGuideDescription')}</Typography.Text>
                            <div>
                              <Typography.Text strong>{t('pages.grc.rules.jsonLogicExpressionExample')}</Typography.Text>
                              <Typography.Paragraph code copyable style={{ marginBottom: 4 }}>{formatJson(JSON_LOGIC_EXAMPLE.expression)}</Typography.Paragraph>
                            </div>
                            <Button size="small" onClick={applyJsonLogicExample}>
                              {t('pages.grc.rules.applyJsonLogicExample')}
                            </Button>
                          </Space>
                        )}
                      />
                    )
                  }
                  if (evaluatorType === 'manual') {
                    return (
                      <Alert
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                        title={t('pages.grc.rules.manualGuideTitle')}
                        description={(
                          <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                            <Typography.Text>{t('pages.grc.rules.manualGuideDescription')}</Typography.Text>
                            <Typography.Text>
                              {t('pages.grc.rules.manualPendingDescription')}
                            </Typography.Text>
                            <Button size="small" onClick={applyManualExample}>
                              {t('pages.grc.rules.applyManualExample')}
                            </Button>
                          </Space>
                        )}
                      />
                    )
                  }
                  const evaluator = getFieldValue('evaluator')
                  const example = EVALUATOR_EXAMPLES[evaluator]
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
                          <Button size="small" onClick={() => applyBuiltinExample(evaluator)}>
                            {t('pages.grc.rules.applyEvaluatorExample')}
                          </Button>
                        </Space>
                      )}
                    />
                  )
                }}
              </Form.Item>

              {/* json_logic-specific fields */}
              <Form.Item noStyle shouldUpdate={(prev, next) => prev.evaluator_type !== next.evaluator_type}>
                {({ getFieldValue }) => getFieldValue('evaluator_type') === 'json_logic' && (
                  <>
                    <Form.Item
                      name="json_expression"
                      label={t('pages.grc.rules.jsonLogicExpression')}
                      tooltip={t('pages.grc.rules.jsonLogicExpressionTip')}
                      rules={[{ required: true, message: t('pages.grc.rules.jsonLogicExpression') }]}
                    >
                      <Input.TextArea rows={6} placeholder='{ "and": [ { "==": [{"var":"x"}, 1] } ] }' />
                    </Form.Item>
                    <Form.Item name="json_fail_message" label={t('pages.grc.rules.jsonLogicFailMessage')}>
                      <Input />
                    </Form.Item>
                    <Form.Item name="json_pass_message" label={t('pages.grc.rules.jsonLogicPassMessage')}>
                      <Input />
                    </Form.Item>
                  </>
                )}
              </Form.Item>

              {/* manual-specific fields */}
              <Form.Item noStyle shouldUpdate={(prev, next) => prev.evaluator_type !== next.evaluator_type}>
                {({ getFieldValue }) => getFieldValue('evaluator_type') === 'manual' && (
                  <Form.Item
                    name="manual_review_template"
                    label={t('pages.grc.rules.manualReviewTemplate')}
                    tooltip={t('pages.grc.rules.manualReviewTemplateTip')}
                  >
                    <Input.TextArea rows={4} placeholder={MANUAL_EXAMPLE.review_template} />
                  </Form.Item>
                )}
              </Form.Item>

              {/* Builtin scope/evidence fields (also shown for json_logic as advanced) */}
              <Form.Item noStyle shouldUpdate={(prev, next) => prev.evaluator_type !== next.evaluator_type}>
                {({ getFieldValue }) => getFieldValue('evaluator_type') === 'builtin' && (
                  <>
                    <Form.Item
                      name="applicable_scope"
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
                  </>
                )}
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

              {/* Test rule section - extracted to RuleTestPanel */}
              <RuleTestPanel
                evaluatorType={versionForm.getFieldValue('evaluator_type') ?? 'builtin'}
                evaluatorConfig={
                  versionForm.getFieldValue('evaluator_type') === 'json_logic'
                    ? (() => {
                        try {
                          const expr = versionForm.getFieldValue('json_expression')
                          const cfg: Record<string, unknown> = { expression: expr ? JSON.parse(expr) : {} }
                          const fail = versionForm.getFieldValue('json_fail_message')
                          const pass = versionForm.getFieldValue('json_pass_message')
                          if (fail) cfg.fail_message = fail
                          if (pass) cfg.pass_message = pass
                          return cfg
                        } catch {
                          return {}
                        }
                      })()
                    : versionForm.getFieldValue('evaluator_type') === 'manual'
                      ? { review_required: true, review_template: versionForm.getFieldValue('manual_review_template') || MANUAL_EXAMPLE.review_template }
                      : { evaluator: versionForm.getFieldValue('evaluator') }
                }
                applicableScope={parseJsonObject(versionForm.getFieldValue('applicable_scope'))}
                evidenceRequirements={parseJsonObject(versionForm.getFieldValue('evidence_requirements'))}
              />

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
      <RuleTemplatePicker
        open={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelect={handleTemplateSelect}
      />
    </Drawer>
  )
}
