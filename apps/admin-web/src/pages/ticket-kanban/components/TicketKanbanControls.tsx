import { ReloadOutlined } from '@ant-design/icons'
import { Button, Tooltip, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

import type { TaskStatusFilter } from '@/api/ticket-kanban'
import { DictSelect } from '@ff-ai-frontend/dictionaries'

interface TicketKanbanControlsProps {
  isRefreshing: boolean
  total: number
  value: TaskStatusFilter | 'all'
  onChange: (value: TaskStatusFilter | 'all') => void
  onRefresh: () => void
}

export function TicketKanbanControls({
  isRefreshing,
  total,
  value,
  onChange,
  onRefresh,
}: TicketKanbanControlsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-14.5 min-w-0 items-center gap-2 rounded-lg border border-(--border) bg-(--panel) px-2 py-2 shadow-[0_1px_2px_rgb(15_23_42/0.05)]">
      <DictSelect<TaskStatusFilter | 'all'>
        className="h-10 flex-1"
        type="task_status_filter"
        value={value}
        onChange={onChange}
      />
      <div className="flex h-10 w-20 items-center justify-center">
        <Typography.Text className="whitespace-nowrap text-[13px]! leading-5! text-(--muted)!">
          {t('common.labels.totalCount', { total })}
        </Typography.Text>
      </div>
      <Tooltip title={t('common.actions.refresh')}>
        <Button
          aria-label={t('common.actions.refresh')}
          className="inline-flex h-10! w-10! shrink-0 basis-10! items-center justify-center"
          icon={<ReloadOutlined />}
          loading={isRefreshing}
          onClick={onRefresh}
        />
      </Tooltip>
    </div>
  )
}
