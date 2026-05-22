import { Alert, Button, Spin } from 'antd'

import { TicketKanbanControls } from './components/TicketKanbanControls'
import { TicketLane } from './components/TicketLane'
import { TicketMetricCards } from './components/TicketMetricCards'
import { lanes } from './constants'
import { useTicketKanbanData } from './useTicketKanbanData'

export function TicketKanban() {
  const {
    countByKey,
    currentStatusValue,
    isError,
    isLoading,
    isRefreshing,
    refetch,
    setStatusValue,
    statsLoading,
    tasksByLane,
    total,
  } = useTicketKanbanData()

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3">
      <div className="grid min-w-330 grid-cols-5 gap-2.5">
        <TicketMetricCards
          countByKey={countByKey}
          currentCount={total}
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
            title="工单看板加载失败"
            action={
              <Button size="small" onClick={() => void refetch()}>
                重试
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
        <div className="grid h-full min-h-0 min-w-330 grid-cols-5 gap-2.5">
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
  )
}

export default TicketKanban
