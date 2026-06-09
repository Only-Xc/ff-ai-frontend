import { Button, theme } from 'antd'
import { CheckOutlined, FileTextOutlined } from '@ant-design/icons'
import { XMarkdown } from '@ant-design/x-markdown'
import { DictTag } from '@ff-ai-frontend/dictionaries'

import type { TaskConfirmationViewState } from '@/pages/chat/types'
import '@/assets/x-markdown-light.css'
import '@/assets/x-markdown-dark.css'

type PendingTaskConfirmation = TaskConfirmationViewState['pendingTask']

export interface TaskConfirmationSidebarProps {
  pending: PendingTaskConfirmation | null
  submitting: boolean
  onConfirm: () => void
}

export function TaskConfirmationSidebar({
  pending,
  submitting,
  onConfirm,
}: TaskConfirmationSidebarProps) {
  const { theme: antdTheme, token } = theme.useToken()
  const markdownClassName =
    antdTheme.id === 0
      ? 'x-markdown-light x-markdown-compact'
      : 'x-markdown-dark x-markdown-compact'

  if (!pending) return null

  return (
    <aside
      className="flex h-full w-120 shrink-0 flex-col border-l border-l-(--ant-color-border-secondary)"
      style={{ background: token.colorBgContainer }}
    >
      <div className="flex shrink-0 items-start gap-3 border-b border-b-(--ant-color-border-secondary) px-4 py-3">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-md"
          style={{
            background: token.colorPrimaryBg,
            color: token.colorPrimary,
          }}
        >
          <FileTextOutlined />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-(--text-strong)">
              待确认工单
            </span>
            <DictTag type="pending_task_type" value={pending.task_type} />
          </div>
          <div className="wrap-break-word text-sm text-(--text)">
            {pending.title}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
        <XMarkdown paragraphTag="div" className={markdownClassName}>
          {pending.markdown}
        </XMarkdown>
      </div>

      <div className="flex shrink-0 justify-end border-t border-t-(--ant-color-border-secondary) px-4 py-3">
        <Button
          type="primary"
          icon={<CheckOutlined />}
          loading={submitting}
          disabled={submitting}
          onClick={onConfirm}
        >
          确认创建
        </Button>
      </div>
    </aside>
  )
}
