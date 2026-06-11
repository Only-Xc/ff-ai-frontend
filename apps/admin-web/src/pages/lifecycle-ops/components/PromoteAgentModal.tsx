import { Descriptions, Form, Input, InputNumber, Modal } from 'antd'
import type { DescriptionsProps } from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import type { HotLifecycleCandidate } from '@/api/lifecycle-ops'
import { numberUtils } from '@ff-ai-frontend/utils'

import { DEFAULT_PROMOTE_VALUES } from '../constants'
import type { PromoteFormValues } from '../types'
import { getLifecycleActionReason } from '../utils'
import { CopyableText } from './CopyableText'

interface PromoteAgentModalProps {
  candidate?: HotLifecycleCandidate
  pending: boolean
  onCancel: () => void
  onSubmit: (
    values: PromoteFormValues,
    candidate: HotLifecycleCandidate,
  ) => void | Promise<void>
}

export function PromoteAgentModal({
  candidate,
  pending,
  onCancel,
  onSubmit,
}: PromoteAgentModalProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<PromoteFormValues>()

  useEffect(() => {
    if (!candidate) {
      form.resetFields()
      return
    }

    form.setFieldsValue({
      ...DEFAULT_PROMOTE_VALUES,
      reason: getLifecycleActionReason(candidate, t),
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
          key: 'metrics',
          label: t('pages.lifecycle.modals.promote.metrics'),
          children: t('pages.lifecycle.modals.promote.metricsValue', {
            avgDuration: numberUtils.formatNumber(candidate.avg_duration_ms),
            dailyInvocations: numberUtils.formatNumber(
              candidate.daily_invocations,
            ),
          }),
        },
      ]
    : []

  return (
    <Modal
      title={t('pages.lifecycle.modals.promote.title')}
      open={Boolean(candidate)}
      okText={t('pages.lifecycle.modals.promote.ok')}
      okButtonProps={{ loading: pending }}
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
            <div className="grid grid-cols-3 gap-3 max-[640px]:grid-cols-1">
              <Form.Item
                name="replicas"
                label={t('pages.lifecycle.modals.promote.replicas')}
                rules={[
                  {
                    required: true,
                    message: t(
                      'pages.lifecycle.modals.promote.replicasRequired',
                    ),
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  max={10}
                  precision={0}
                  className="w-full"
                />
              </Form.Item>
              <Form.Item name="cpu" label="CPU">
                <Input placeholder={DEFAULT_PROMOTE_VALUES.cpu} />
              </Form.Item>
              <Form.Item
                name="memory"
                label={t('pages.lifecycle.modals.promote.memory')}
              >
                <Input placeholder={DEFAULT_PROMOTE_VALUES.memory} />
              </Form.Item>
            </div>
            <Form.Item
              name="reason"
              label={t('pages.lifecycle.modals.promote.reason')}
              rules={[
                {
                  required: true,
                  message: t('pages.lifecycle.modals.promote.reasonRequired'),
                },
              ]}
            >
              <Input.TextArea rows={4} maxLength={200} showCount />
            </Form.Item>
          </Form>
        </div>
      ) : null}
    </Modal>
  )
}
