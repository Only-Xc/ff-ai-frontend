import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { App, Button, Drawer, Form, Input, InputNumber, Popconfirm, Select, Space, Switch } from 'antd'
import { useMutation } from '@tanstack/react-query'

import {
  type GrcRule,
  type GrcRuleCreate,
  type GrcRuleUpdate,
  type GrcRuleVersionCreate,
  grcRule_create,
  grcRule_update,
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

type RuleVersionFormValues = Omit<GrcRuleVersionCreate, 'applicable_scope' | 'evaluator_config' | 'evidence_requirements'> & {
  evaluator?: string
  applicable_scope?: string
  evidence_requirements?: string
}

const parseJsonObject = (value?: string) => {
  if (!value?.trim()) return {}
  return JSON.parse(value) as Record<string, unknown>
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
    mutationFn: (data: RuleVersionFormValues) => {
      const {
        evaluator,
        applicable_scope,
        evidence_requirements,
        ...rest
      } = data
      return grcRuleVersion_create(rule!.id, {
        ...rest,
        applicable_scope: parseJsonObject(applicable_scope),
        evaluator_config: evaluator ? { evaluator } : {},
        evidence_requirements: parseJsonObject(evidence_requirements),
      })
    },
    onSuccess: () => {
      message.success(t('pages.grc.rules.versionCreated'))
      onSuccess()
      versionForm.resetFields()
      setShowVersionForm(false)
    },
    onError: (error) => {
      message.error(error instanceof SyntaxError ? t('pages.grc.rules.invalidJson') : t('pages.grc.rules.versionCreateFailed'))
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
                onClick={() => {
                  versionForm.validateFields().then(values => {
                    versionMutation.mutate(values as RuleVersionFormValues)
                  })
                }}
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
