import { Alert, Button, Drawer, Form, Input, Radio } from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  ProductionApprovalDecisionPayload,
  ProductionDecision,
} from '@/api/production'
import { useLocale } from '@/i18n/useLocale'

interface DecisionFormValues {
  decision: ProductionDecision
  rationale: string
}

interface ApprovalDecisionDrawerProps {
  open: boolean
  pending: boolean
  expectedVersion: number
  onClose: () => void
  onSubmit: (values: ProductionApprovalDecisionPayload) => void | Promise<void>
}

export function ApprovalDecisionDrawer({
  expectedVersion,
  onClose,
  onSubmit,
  open,
  pending,
}: ApprovalDecisionDrawerProps) {
  const { t } = useTranslation()
  const { direction } = useLocale()
  const [form] = Form.useForm<DecisionFormValues>()

  useEffect(() => {
    if (!open) form.resetFields()
  }, [form, open])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    await onSubmit({
      decision: values.decision,
      rationale: values.rationale.trim(),
      expected_version: expectedVersion,
    })
  }

  return (
    <Drawer
      destroyOnHidden
      open={open}
      placement={direction === 'rtl' ? 'left' : 'right'}
      width={520}
      title={t('pages.production.decisionDrawer.title')}
      closable={!pending}
      maskClosable={!pending}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button disabled={pending} onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button
            loading={pending}
            type="primary"
            onClick={() => void handleSubmit()}
          >
            {t('pages.production.decisionDrawer.submit')}
          </Button>
        </div>
      }
    >
      <Alert
        showIcon
        className="mb-4"
        type="info"
        message={t('pages.production.decisionDrawer.versionNotice', {
          version: expectedVersion,
        })}
      />
      <Form<DecisionFormValues>
        form={form}
        layout="vertical"
        initialValues={{ decision: 'APPROVED' }}
      >
        <Form.Item
          label={t('pages.production.decisionDrawer.decision')}
          name="decision"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio.Button value="APPROVED">
              {t('pages.production.decisionDrawer.approve')}
            </Radio.Button>
            <Radio.Button value="REJECTED">
              {t('pages.production.decisionDrawer.reject')}
            </Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label={t('pages.production.decisionDrawer.rationale')}
          name="rationale"
          rules={[
            { required: true, message: t('pages.production.decisionDrawer.rationaleRequired') },
            { max: 2000 },
          ]}
        >
          <Input.TextArea rows={6} maxLength={2000} showCount />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
