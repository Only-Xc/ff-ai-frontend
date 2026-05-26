import { Descriptions, Form, Input, InputNumber, Modal } from 'antd'
import type { DescriptionsProps } from 'antd'
import { useEffect } from 'react'

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
  const [form] = Form.useForm<PromoteFormValues>()

  useEffect(() => {
    if (!candidate) {
      form.resetFields()
      return
    }

    form.setFieldsValue({
      ...DEFAULT_PROMOTE_VALUES,
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
          key: 'metrics',
          label: '调用表现',
          children: `${numberUtils.formatNumber(candidate.daily_invocations)} 次/天，平均 ${numberUtils.formatNumber(candidate.avg_duration_ms)} ms`,
        },
      ]
    : []

  return (
    <Modal
      title="晋升为常驻服务"
      open={Boolean(candidate)}
      okText="创建部署任务"
      okButtonProps={{ loading: pending }}
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
            <div className="grid grid-cols-3 gap-3 max-[640px]:grid-cols-1">
              <Form.Item
                name="replicas"
                label="副本数"
                rules={[{ required: true, message: '请输入副本数' }]}
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
              <Form.Item name="memory" label="内存">
                <Input placeholder={DEFAULT_PROMOTE_VALUES.memory} />
              </Form.Item>
            </div>
            <Form.Item
              name="reason"
              label="晋升原因"
              rules={[{ required: true, message: '请输入晋升原因' }]}
            >
              <Input.TextArea rows={4} maxLength={200} showCount />
            </Form.Item>
          </Form>
        </div>
      ) : null}
    </Modal>
  )
}
