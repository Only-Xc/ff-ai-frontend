import { Button, Form, Input, Modal } from 'antd'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
        title={t('pages.intervention.actions.reprompt')}
        open={repromptOpen}
        onCancel={closeRepromptModal}
        footer={[
          <Button key="cancel" onClick={closeRepromptModal}>
            {t('common.actions.cancel')}
          </Button>,
          <Button
            key="submit"
            loading={repromptPending}
            type="primary"
            onClick={() => void submitReprompt()}
          >
            {t('pages.intervention.modals.reprompt.submit')}
          </Button>,
        ]}
      >
        <Form form={repromptForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label={t('pages.intervention.modals.reprompt.promptHint')}
            name="prompt_hint"
            rules={[
              {
                required: true,
                message: t(
                  'pages.intervention.modals.reprompt.promptHintRequired',
                ),
              },
            ]}
          >
            <Input.TextArea
              autoSize={{ minRows: 6, maxRows: 12 }}
              placeholder={t(
                'pages.intervention.modals.reprompt.promptHintPlaceholder',
              )}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('pages.intervention.actions.reject')}
        open={rejectOpen}
        onCancel={closeRejectModal}
        footer={[
          <Button key="cancel" onClick={closeRejectModal}>
            {t('common.actions.cancel')}
          </Button>,
          <Button
            key="submit"
            danger
            loading={rejectPending}
            type="primary"
            onClick={() => void submitReject()}
          >
            {t('pages.intervention.modals.reject.submit')}
          </Button>,
        ]}
      >
        <Form form={rejectForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label={t('pages.intervention.modals.reject.reason')}
            name="reason"
            rules={[
              {
                required: true,
                message: t('pages.intervention.modals.reject.reasonRequired'),
              },
            ]}
          >
            <Input.TextArea
              autoSize={{ minRows: 4, maxRows: 10 }}
              placeholder={t(
                'pages.intervention.modals.reject.reasonPlaceholder',
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
