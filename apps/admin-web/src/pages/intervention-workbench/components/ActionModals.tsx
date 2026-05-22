import { Button, Form, Input, Modal } from 'antd'

import type {
  RejectFormValues,
  RepromptFormValues,
} from '../useInterventionWorkbenchData'

interface ActionModalsProps {
  onCloseReject: () => void
  onCloseReprompt: () => void
  onSubmitReject: (values: RejectFormValues) => void
  onSubmitReprompt: (values: RepromptFormValues) => void
  rejectOpen: boolean
  rejectPending: boolean
  repromptOpen: boolean
  repromptPending: boolean
}

export function ActionModals({
  onCloseReject,
  onCloseReprompt,
  onSubmitReject,
  onSubmitReprompt,
  rejectOpen,
  rejectPending,
  repromptOpen,
  repromptPending,
}: ActionModalsProps) {
  const [repromptForm] = Form.useForm<RepromptFormValues>()
  const [rejectForm] = Form.useForm<RejectFormValues>()

  const closeRepromptModal = () => {
    onCloseReprompt()
    repromptForm.resetFields()
  }

  const closeRejectModal = () => {
    onCloseReject()
    rejectForm.resetFields()
  }

  const submitReprompt = async () => {
    const values = await repromptForm.validateFields()

    onSubmitReprompt(values)
  }

  const submitReject = async () => {
    const values = await rejectForm.validateFields()

    onSubmitReject(values)
  }

  return (
    <>
      <Modal
        title="注入 Prompt 重跑"
        open={repromptOpen}
        onCancel={closeRepromptModal}
        footer={[
          <Button key="cancel" onClick={closeRepromptModal}>
            取消
          </Button>,
          <Button
            key="submit"
            loading={repromptPending}
            type="primary"
            onClick={() => void submitReprompt()}
          >
            提交重跑
          </Button>,
        ]}
      >
        <Form form={repromptForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Prompt 提示"
            name="prompt_hint"
            rules={[{ required: true, message: '请输入 Prompt 提示' }]}
          >
            <Input.TextArea
              autoSize={{ minRows: 6, maxRows: 12 }}
              placeholder="描述错误根因和期望修复方向"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="驳回关闭"
        open={rejectOpen}
        onCancel={closeRejectModal}
        footer={[
          <Button key="cancel" onClick={closeRejectModal}>
            取消
          </Button>,
          <Button
            key="submit"
            danger
            loading={rejectPending}
            type="primary"
            onClick={() => void submitReject()}
          >
            确认驳回
          </Button>,
        ]}
      >
        <Form form={rejectForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="驳回原因"
            name="reason"
            rules={[{ required: true, message: '请输入驳回原因' }]}
          >
            <Input.TextArea
              autoSize={{ minRows: 4, maxRows: 10 }}
              placeholder="填写关闭工单的原因"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
