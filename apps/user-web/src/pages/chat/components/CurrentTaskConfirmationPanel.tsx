import { Button, Tag, theme } from 'antd'
import { CheckOutlined, FileTextOutlined } from '@ant-design/icons'

import type { TaskConfirmationViewState } from '@/pages/chat/types'

type PendingTaskConfirmation = NonNullable<
  TaskConfirmationViewState['pendingTask']
>

export interface CurrentTaskConfirmationPanelProps {
  pending: PendingTaskConfirmation
  submitting: boolean
  onRequestConfirm: () => void
}

const TASK_TYPE_LABELS: Record<PendingTaskConfirmation['task_type'], string> = {
  process: '流程工单',
  container: '容器工单',
  direct_result: '直接结果',
}

export function CurrentTaskConfirmationPanel({
  pending,
  submitting,
  onRequestConfirm,
}: CurrentTaskConfirmationPanelProps) {
  const { token } = theme.useToken()

  return (
    <div
      className="mb-2 rounded-lg border px-3 py-2"
      style={{
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-md"
            style={{
              background: token.colorPrimaryBg,
              color: token.colorPrimary,
            }}
          >
            <FileTextOutlined />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-sm font-semibold text-(--text-strong)">
                当前待确认工单
              </span>
              <Tag className="shrink-0" color="processing">
                {TASK_TYPE_LABELS[pending.task_type]}
              </Tag>
              <span className="truncate text-sm text-(--text)">
                {pending.title}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end">
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            loading={submitting}
            disabled={submitting}
            onClick={onRequestConfirm}
          >
            确认
          </Button>
        </div>
      </div>

    </div>
  )
}
