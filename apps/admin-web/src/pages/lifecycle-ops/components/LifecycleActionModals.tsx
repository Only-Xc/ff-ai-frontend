import { Descriptions, Form, Input, InputNumber, Modal } from 'antd'
import type { DescriptionsProps, FormInstance } from 'antd'

import type {
  HotLifecycleCandidate,
  IdleLifecycleCandidate,
} from '@/api/adminAgents'

import { DEFAULT_PROMOTE_VALUES } from '../constants'
import type { DemoteFormValues, PromoteFormValues } from '../types'
import { formatNumber } from '../utils/lifecycleFormatters'
import { CopyableText } from './CopyableText'

interface LifecycleActionModalsProps {
  demoteCandidate?: IdleLifecycleCandidate
  demoteForm: FormInstance<DemoteFormValues>
  demotePending: boolean
  onCancelDemote: () => void
  onCancelPromote: () => void
  onSubmitDemote: () => void
  onSubmitPromote: () => void
  promoteCandidate?: HotLifecycleCandidate
  promoteForm: FormInstance<PromoteFormValues>
  promotePending: boolean
}

function DemoteModalContent({
  candidate,
  form,
}: {
  candidate: IdleLifecycleCandidate
  form: FormInstance<DemoteFormValues>
}) {
  const descriptionItems: DescriptionsProps['items'] = [
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

  return (
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
  )
}

function PromoteModalContent({
  candidate,
  form,
}: {
  candidate: HotLifecycleCandidate
  form: FormInstance<PromoteFormValues>
}) {
  const descriptionItems: DescriptionsProps['items'] = [
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
      children: `${formatNumber(candidate.daily_invocations)} 次/天，平均 ${formatNumber(candidate.avg_duration_ms)} ms`,
    },
  ]

  return (
    <div className="space-y-4">
      <Descriptions column={1} size="small" items={descriptionItems} />
      <Form
        form={form}
        layout="vertical"
        initialValues={DEFAULT_PROMOTE_VALUES}
      >
        <div className="grid grid-cols-3 gap-3 max-[640px]:grid-cols-1">
          <Form.Item
            name="replicas"
            label="副本数"
            rules={[{ required: true, message: '请输入副本数' }]}
          >
            <InputNumber min={1} max={10} precision={0} className="w-full" />
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
  )
}

export function LifecycleActionModals({
  demoteCandidate,
  demoteForm,
  demotePending,
  onCancelDemote,
  onCancelPromote,
  onSubmitDemote,
  onSubmitPromote,
  promoteCandidate,
  promoteForm,
  promotePending,
}: LifecycleActionModalsProps) {
  return (
    <>
      <Modal
        title="确认降级智能体"
        open={Boolean(demoteCandidate)}
        okText="确认降级"
        okButtonProps={{ danger: true, loading: demotePending }}
        cancelText="取消"
        onCancel={onCancelDemote}
        onOk={onSubmitDemote}
      >
        {demoteCandidate ? (
          <DemoteModalContent
            candidate={demoteCandidate}
            form={demoteForm}
          />
        ) : null}
      </Modal>

      <Modal
        title="晋升为常驻服务"
        open={Boolean(promoteCandidate)}
        okText="创建部署任务"
        okButtonProps={{ loading: promotePending }}
        cancelText="取消"
        onCancel={onCancelPromote}
        onOk={onSubmitPromote}
      >
        {promoteCandidate ? (
          <PromoteModalContent
            candidate={promoteCandidate}
            form={promoteForm}
          />
        ) : null}
      </Modal>
    </>
  )
}
