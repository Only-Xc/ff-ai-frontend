import { Checkbox, Descriptions, Form, Input, Modal } from 'antd'
import type { DescriptionsProps } from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { IdleLifecycleCandidate } from '@/api/lifecycle-ops'

import type { DemoteFormValues } from '../types'
import { getLifecycleActionReason } from '../utils'
import { CopyableText } from './CopyableText'

interface DemoteAgentModalProps {
  candidate?: IdleLifecycleCandidate
  pending: boolean
  onCancel: () => void
  onSubmit: (
    values: DemoteFormValues,
    candidate: IdleLifecycleCandidate,
  ) => void | Promise<void>
}

export function DemoteAgentModal({
  candidate,
  pending,
  onCancel,
  onSubmit,
}: DemoteAgentModalProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<DemoteFormValues>()

  useEffect(() => {
    if (!candidate) {
      form.resetFields()
      return
    }

    form.setFieldsValue({
      reason: getLifecycleActionReason(candidate, t),
      preserve_data: true,
      remove_image: false,
    })
  }, [candidate, form, t])

  const handleSubmit = async () => {
    if (!candidate) return

    const values = await form.validateFields()
    await onSubmit(values, candidate)
  }

  const descriptionItems: DescriptionsProps['items'] = candidate
    ? [
        {
          key: 'agent',
          label: t('pages.lifecycle.columns.app'),
          children: candidate.name,
        },
        {
          key: 'agent_id',
          label: t('pages.lifecycle.columns.appId'),
          children: <CopyableText value={candidate.agent_id} />,
        },
        {
          key: 'tenant_id',
          label: t('pages.lifecycle.columns.tenant'),
          children: <CopyableText value={candidate.tenant_id} />,
        },
        {
          key: 'impact',
          label: t('pages.lifecycle.modals.demote.impact'),
          children: t('pages.lifecycle.modals.demote.impactDescription'),
        },
      ]
    : []

  return (
    <Modal
      title={t('pages.lifecycle.modals.demote.title')}
      open={Boolean(candidate)}
      okText={t('pages.lifecycle.modals.demote.ok')}
      okButtonProps={{ danger: true, loading: pending }}
      cancelText={t('common.actions.cancel')}
      confirmLoading={pending}
      closable={!pending}
      maskClosable={!pending}
      keyboard={!pending}
      onCancel={onCancel}
      onOk={() => void handleSubmit()}
    >
      {candidate ? (
        <div className="space-y-4">
          <Descriptions column={1} size="small" items={descriptionItems} />
          <Form form={form} layout="vertical">
            <Form.Item
              name="reason"
              label={t('pages.lifecycle.modals.demote.reason')}
              rules={[
                {
                  required: true,
                  message: t('pages.lifecycle.modals.demote.reasonRequired'),
                },
              ]}
            >
              <Input.TextArea rows={4} maxLength={200} showCount />
            </Form.Item>
            <Form.Item name="preserve_data" valuePropName="checked">
              <Checkbox>{t('pages.lifecycle.modals.demote.preserveData')}</Checkbox>
            </Form.Item>
            <Form.Item name="remove_image" valuePropName="checked">
              <Checkbox>{t('pages.lifecycle.modals.demote.removeImage')}</Checkbox>
            </Form.Item>
          </Form>
        </div>
      ) : null}
    </Modal>
  )
}
