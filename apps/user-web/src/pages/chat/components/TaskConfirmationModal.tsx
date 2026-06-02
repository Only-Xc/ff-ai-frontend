import { Button, Modal, theme } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { XMarkdown } from '@ant-design/x-markdown'

import type { TaskConfirmationViewState } from '@/pages/chat/types'
import '@/assets/x-markdown-light.css'
import '@/assets/x-markdown-dark.css'

type PendingTaskConfirmation = TaskConfirmationViewState['pendingTask']

export interface TaskConfirmationModalProps {
  open: boolean
  pending: PendingTaskConfirmation | null
  submitting: boolean
  onConfirm: () => void
  onClose: () => void
}

export function TaskConfirmationModal({
  open,
  pending,
  submitting,
  onConfirm,
  onClose,
}: TaskConfirmationModalProps) {
  const { theme: antdTheme } = theme.useToken()
  const markdownClassName =
    antdTheme.id === 0 ? 'x-markdown-light' : 'x-markdown-dark'

  return (
    <Modal
      title={pending?.title ?? '确认创建工单'}
      open={open && !!pending}
      onCancel={onClose}
      width={720}
      destroyOnHidden
      footer={
        pending
          ? [
              <Button key="cancel" onClick={onClose}>
                取消
              </Button>,
              <Button
                key="confirm"
                type="primary"
                icon={<CheckOutlined />}
                loading={submitting}
                disabled={submitting}
                onClick={onConfirm}
              >
                确认创建
              </Button>,
            ]
          : null
      }
    >
      {pending ? (
        <div className="max-h-[60vh] overflow-auto rounded-md border border-(--border) bg-(--panel) px-4 py-3">
          <XMarkdown paragraphTag="div" className={markdownClassName}>
            {pending.markdown}
          </XMarkdown>
        </div>
      ) : null}
    </Modal>
  )
}
