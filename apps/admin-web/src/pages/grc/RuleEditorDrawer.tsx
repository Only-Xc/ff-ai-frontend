import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { App, Button, Drawer, Form, Input, InputNumber, Select, Space, Switch } from 'antd'
import { useMutation } from '@tanstack/react-query'

import {
  type GrcRule,
  type GrcRuleCreate,
  type GrcRuleVersionCreate,
  grcRule_create,
  grcRuleVersion_create,
} from '@/api/grc'

const CATEGORIES = ['privacy', 'security', 'safety', 'model', 'data', 'tool', 'deployment', 'access_control', 'logging', 'human_oversight', 'legal', 'operational']
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

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

  const createMutation = useMutation({
    mutationFn: (data: GrcRuleCreate) => grcRule_create(data),
    onSuccess: () => {
      message.success(isEdit ? 'Rule updated' : 'Rule created')
      onSuccess()
      onClose()
    },
  })

  const handleSubmit = () => {
    form.validateFields().then(values => {
      createMutation.mutate(values)
    })
  }

  return (
    <Drawer
      title={isEdit ? `Edit: ${rule?.code}` : 'Create Rule'}
      open={open}
      onClose={onClose}
      width={600}
      footer={
        <Space>
          <Button onClick={onClose}>{t('pages.grc.common.cancel')}</Button>
          <Button type="primary" onClick={handleSubmit} loading={createMutation.isPending}>
            {t('pages.grc.common.save')}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={isEdit ? { name: rule?.name, description: rule?.description } : { code: '', name: '', category: 'security', description: '' }}>
        {!isEdit && (
          <Form.Item name="code" label="Rule Code" rules={[{ required: true }]}>
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
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>

      {/* Version creation section */}
      {isEdit && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Button type="dashed" block onClick={() => setShowVersionForm(!showVersionForm)}>
            {showVersionForm ? 'Hide' : 'Create New Version'}
          </Button>
          {showVersionForm && (
            <Form form={versionForm} layout="vertical" style={{ marginTop: 16 }} initialValues={{ version: 1, severity: 'MEDIUM', risk_score: 25, block_on_fail: false, exception_allowed: true }}>
              <Form.Item name="version" label="Version" rules={[{ required: true }]}>
                <InputNumber min={1} />
              </Form.Item>
              <Form.Item name="severity" label="Severity" rules={[{ required: true }]}>
                <Select options={SEVERITIES.map(s => ({ value: s }))} />
              </Form.Item>
              <Form.Item name="risk_score" label="Risk Score" rules={[{ required: true, min: 0, max: 100 }]}>
                <InputNumber />
              </Form.Item>
              <Form.Item name="block_on_fail" label="Block on Fail" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="exception_allowed" label="Exception Allowed" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="change_note" label="Change Note">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Button type="primary" onClick={() => {
                versionForm.validateFields().then(values => {
                  grcRuleVersion_create(rule!.id, values as GrcRuleVersionCreate).then(() => {
                    message.success('Version created')
                    onSuccess()
                  })
                })
              }}>
                Create Version
              </Button>
            </Form>
          )}
        </div>
      )}
    </Drawer>
  )
}
