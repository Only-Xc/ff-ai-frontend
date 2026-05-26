import { Descriptions, Form, Input, Modal } from 'antd'
import type { DescriptionsProps } from 'antd'
import { useEffect } from 'react'

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
  const [form] = Form.useForm<DemoteFormValues>()

  useEffect(() => {
    if (!candidate) {
      form.resetFields()
      return
    }

    form.setFieldsValue({
      reason: getLifecycleActionReason(candidate),
    })
  }, [candidate, form])

  const handleSubmit = async () => {
    if (!candidate) return

    const values = await form.validateFields()
    await onSubmit(values, candidate)
  }

  const descriptionItems: DescriptionsProps['items'] = candidate
    ? [
        {
          key: 'agent',
          label: '应用',
          children: candidate.name,
        },
        {
          key: 'agent_id',
          label: '应用 ID',
          children: <CopyableText value={candidate.agent_id} />,
        },
        {
          key: 'tenant_id',
          label: '租户',
          children: <CopyableText value={candidate.tenant_id} />,
        },
        {
          key: 'impact',
          label: '影响',
          children: '销毁常驻容器并释放 Pod 资源，下次调用时按需创建沙盒。',
        },
      ]
    : []

  return (
    <Modal
      title="确认降级智能体"
      open={Boolean(candidate)}
      okText="确认降级"
      okButtonProps={{ danger: true, loading: pending }}
      cancelText="取消"
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
              label="降级原因"
              rules={[{ required: true, message: '请输入降级原因' }]}
            >
              <Input.TextArea rows={4} maxLength={200} showCount />
            </Form.Item>
          </Form>
        </div>
      ) : null}
    </Modal>
  )
}
