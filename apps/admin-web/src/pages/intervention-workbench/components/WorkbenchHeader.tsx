import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Space, Typography } from 'antd'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import type { TaskStatus } from '@/api/ticket-kanban'
import { DictTag } from '@ff-ai-frontend/dictionaries'

interface WorkbenchHeaderProps {
  actions?: ReactNode
  className?: string
  displayTitle: string
  isFetching: boolean
  onBack: () => void
  onRefresh: () => void
  status?: TaskStatus
}

function StatusTag({ status }: { status: TaskStatus }) {
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
  const { t } = useTranslation()

  return (
    <header className={`relative rounded-xl px-4 py-3 ${className ?? ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Space size={12}>
          <Button
            aria-label={t('pages.intervention.header.back')}
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
              {t('pages.intervention.header.subtitle')}
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
            {t('common.actions.refresh')}
          </Button>
        </Space>
      </div>
    </header>
  )
}
