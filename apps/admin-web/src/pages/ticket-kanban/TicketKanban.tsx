import { Alert, Button, Spin } from 'antd'
import { useTranslation } from 'react-i18next'

import { TicketKanbanControls } from './components/TicketKanbanControls'
import { TicketLane } from './components/TicketLane'
import { TicketMetricCards } from './components/TicketMetricCards'
import { lanes } from './constants'
import { useTicketKanbanData } from './useTicketKanbanData'

export function TicketKanban() {
  const { t } = useTranslation()
  const {
    currentStatusValue,
    isError,
    isLoading,
    isRefreshing,
    refetch,
    setStatusValue,
    stats,
    statsLoading,
    tasksByLane,
    total,
  } = useTicketKanbanData()

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-2 [scrollbar-color:var(--scrollbar-thumb)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-(--scrollbar-thumb) [&::-webkit-scrollbar-thumb:hover]:bg-(--scrollbar-thumb-hover)">
        <div className="flex h-full min-h-0 w-full min-w-330 flex-col gap-3">
          <div className="grid grid-cols-5 gap-2.5">
            <TicketMetricCards
              currentCount={total}
              stats={stats}
              statsLoading={statsLoading}
            />

            <TicketKanbanControls
              isRefreshing={isRefreshing}
              total={total}
              value={currentStatusValue}
              onChange={setStatusValue}
              onRefresh={() => void refetch()}
            />
          </div>

          {isError ? (
            <div className="shrink-0">
              <Alert
                showIcon
                type="error"
                title={t('pages.tickets.loadFailed')}
                action={
                  <Button size="small" onClick={() => void refetch()}>
                    {t('common.actions.retry')}
                  </Button>
                }
              />
            </div>
          ) : null}

          <Spin
            spinning={isLoading}
            classNames={{
              root: 'min-h-0 flex-1 [&_.ant-spin-container]:h-full [&_.ant-spin-container]:min-h-0',
            }}
          >
            <div className="grid h-full min-h-0 grid-cols-5 gap-2.5">
              {lanes.map((lane) => (
                <TicketLane
                  key={lane.id}
                  lane={lane}
                  tasks={tasksByLane[lane.id]}
                />
              ))}
            </div>
          </Spin>
        </div>
      </div>
    </div>
  )
}

export default TicketKanban
