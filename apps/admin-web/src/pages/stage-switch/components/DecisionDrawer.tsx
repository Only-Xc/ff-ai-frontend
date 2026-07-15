import { Alert, Button, Drawer, Form, Input, Radio, Space } from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  StageSwitchDecision,
  StageSwitchDecisionCreate,
} from '@/api/stage-switch'
import { useLocale } from '@/i18n/useLocale'

interface DecisionFormValues {
  decision: StageSwitchDecision
  rationale: string
}

interface DecisionDrawerProps {
  open: boolean
  pending: boolean
  requestVersion: number
  nodeVersion: number
  onClose: () => void
  onSubmit: (values: StageSwitchDecisionCreate) => void | Promise<void>
}

export function DecisionDrawer({
  nodeVersion,
  onClose,
  onSubmit,
  open,
  pending,
  requestVersion,
}: DecisionDrawerProps) {
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
      expected_request_version: requestVersion,
      expected_node_version: nodeVersion,
    })
  }

  return (
    <Drawer
      destroyOnHidden
      open={open}
      placement={direction === 'rtl' ? 'left' : 'right'}
      width={520}
      title={t('pages.stageSwitch.decisionDrawer.title')}
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
            {t('pages.stageSwitch.decisionDrawer.submit')}
          </Button>
        </div>
      }
    >
      <Alert
        showIcon
        className="mb-4"
        type="info"
        title={t('pages.stageSwitch.decisionDrawer.versionNotice')}
      />
      <Form
        form={form}
        layout="vertical"
        initialValues={{ decision: 'APPROVED' }}
      >
        <Form.Item
          name="decision"
          label={t('pages.stageSwitch.decisionDrawer.decision')}
          rules={[
            {
              required: true,
              message: t('pages.stageSwitch.decisionDrawer.decisionRequired'),
            },
          ]}
        >
          <Radio.Group buttonStyle="solid">
            <Space wrap>
              <Radio.Button value="APPROVED">
                {t('pages.stageSwitch.actions.approve')}
              </Radio.Button>
              <Radio.Button value="REJECTED">
                {t('pages.stageSwitch.actions.reject')}
              </Radio.Button>
            </Space>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="rationale"
          label={t('pages.stageSwitch.decisionDrawer.rationale')}
          rules={[
            {
              required: true,
              whitespace: true,
              message: t('pages.stageSwitch.decisionDrawer.rationaleRequired'),
            },
            {
              min: 1,
              max: 2000,
              message: t('pages.stageSwitch.decisionDrawer.rationaleLength'),
            },
          ]}
        >
          <Input.TextArea
            autoSize={{ minRows: 5, maxRows: 12 }}
            maxLength={2000}
            showCount
            placeholder={t(
              'pages.stageSwitch.decisionDrawer.rationalePlaceholder',
            )}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
