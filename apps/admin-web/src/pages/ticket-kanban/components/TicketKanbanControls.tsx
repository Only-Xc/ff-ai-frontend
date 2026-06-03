import { ReloadOutlined } from '@ant-design/icons'
import { Button, Tooltip, Typography } from 'antd'

import type { AdminTaskStatusFilter } from '@/api/ticket-kanban'
import { DictSelect } from '@ff-ai-frontend/dictionaries'

interface TicketKanbanControlsProps {
  isRefreshing: boolean
  total: number
  value: AdminTaskStatusFilter | 'all'
  onChange: (value: AdminTaskStatusFilter | 'all') => void
  onRefresh: () => void
}

export function TicketKanbanControls({
  isRefreshing,
  total,
  value,
  onChange,
  onRefresh,
}: TicketKanbanControlsProps) {
  return (
    <div className="flex min-h-14.5 min-w-0 items-center gap-2 rounded-lg border border-(--border) bg-(--panel) px-2 py-2 shadow-[0_1px_2px_rgb(15_23_42/0.05)]">
      <DictSelect<AdminTaskStatusFilter | 'all'>
        className="h-10 flex-1"
        type="task_status_filter"
        value={value}
        onChange={onChange}
      />
      <div className="flex h-10 w-20 items-center justify-center">
        <Typography.Text className="whitespace-nowrap text-[13px]! leading-5! text-(--muted)!">
          共 {total} 条
        </Typography.Text>
      </div>
      <Tooltip title="刷新">
        <Button
          aria-label="刷新"
          className="inline-flex h-10! w-10! shrink-0 basis-10! items-center justify-center"
          icon={<ReloadOutlined />}
          loading={isRefreshing}
          onClick={onRefresh}
        />
      </Tooltip>
    </div>
  )
}
