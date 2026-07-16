import { useTranslation } from 'react-i18next'
import {
  Modal,
  Form,
  Input,
  Button,
  message,
} from 'antd'
import { useMutation } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid'

import { grcEvaluations_create } from '@/api/grc'

interface RunEvaluationModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function RunEvaluationModal({ open, onClose, onSuccess }: RunEvaluationModalProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm()

  const mutation = useMutation({
    mutationFn: grcEvaluations_create,
    onSuccess: () => {
      message.success(t('pages.grc.evaluations.runSuccess'))
      onSuccess?.()
      onClose()
      form.resetFields()
    },
  })

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const snapshot = values.input_snapshot
        ? (() => {
            try {
              return JSON.parse(values.input_snapshot)
            } catch {
              message.error(t('pages.grc.rules.invalidJson'))
              return {}
            }
          })()
        : {}

      mutation.mutate({
        agent_id: values.agent_id,
        task_id: values.task_id || undefined,
        trigger_type: 'manual',
        idempotency_key: uuidv4(),
        input_snapshot: snapshot,
      })
    })
  }

  return (
    <Modal
      title={t('pages.grc.evaluations.manualRunTitle')}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('pages.grc.evaluations.backToList')}
        </Button>,
        <Button key="run" type="primary" loading={mutation.isPending} onClick={handleSubmit}>
          {t('pages.grc.evaluations.manualRun')}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={{ input_snapshot: '' }}>
        <Form.Item
          name="agent_id"
          label={t('pages.grc.evaluations.agentId')}
          rules={[{ required: true, message: 'Agent ID is required' }]}
        >
          <Input placeholder="agent-001" />
        </Form.Item>
        <Form.Item name="task_id" label={t('pages.grc.evaluations.taskId')}>
          <Input placeholder="task-xxx (optional)" />
        </Form.Item>
        <Form.Item name="input_snapshot" label={t('pages.grc.evaluations.inputSnapshot')}>
          <Input.TextArea rows={4} placeholder='{ "data_classification": "restricted" }' />
        </Form.Item>
        <Form.Item
          label={t('pages.grc.evaluations.idempotencyKey')}
          name="idempotency_key"
          initialValue={uuidv4()}
        >
          <Input disabled />
        </Form.Item>
      </Form>
    </Modal>
  )
}
