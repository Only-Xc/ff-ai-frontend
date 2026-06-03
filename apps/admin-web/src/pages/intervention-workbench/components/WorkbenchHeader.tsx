import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Space, Typography } from 'antd'
import type { ReactNode } from 'react'

import type { AdminTaskStatus } from '@/api/ticket-kanban'
import { DictTag } from '@ff-ai-frontend/dictionaries'

interface WorkbenchHeaderProps {
  actions?: ReactNode
  className?: string
  displayTitle: string
  isFetching: boolean
  onBack: () => void
  onRefresh: () => void
  status?: AdminTaskStatus
}

function StatusTag({ status }: { status: AdminTaskStatus }) {
  return <DictTag type="task_status" value={status} />
}

export function WorkbenchHeader({
  actions,
  className,
  displayTitle,
  isFetching,
  onBack,
  onRefresh,
  status,
}: WorkbenchHeaderProps) {
  return (
    <header className={`relative rounded-xl px-4 py-3 ${className ?? ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Space size={12}>
          <Button
            aria-label="返回工单"
            className="cursor-pointer"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Typography.Title level={3} className="m-0! text-xl!">
                {displayTitle}
              </Typography.Title>
              {status ? <StatusTag status={status} /> : null}
            </div>
            <Typography.Text className="text-(--muted)!">
              人工介入工作台
            </Typography.Text>
          </div>
        </Space>
        <Space wrap size={8}>
          {actions}
          <Button
            className="cursor-pointer"
            icon={<ReloadOutlined />}
            loading={isFetching}
            onClick={onRefresh}
          >
            刷新
          </Button>
        </Space>
      </div>
    </header>
  )
}
