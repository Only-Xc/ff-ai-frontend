import { Badge, Empty } from 'antd'
import type { CSSProperties } from 'react'
import { Virtuoso } from 'react-virtuoso'

import type { AdminTask } from '@/api/ticket-kanban'

import { laneColorMap, type LaneConfig } from '../constants'
import { TaskCard } from './TaskCard'

function VirtualTaskList({ tasks }: { tasks: AdminTask[] }) {
  if (!tasks.length) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center p-3">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无工单" />
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 p-2">
      <Virtuoso
        className="h-full [scrollbar-color:var(--scrollbar-thumb)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:size-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-(--scrollbar-thumb) [&::-webkit-scrollbar-thumb:hover]:bg-(--scrollbar-thumb-hover)"
        data={tasks}
        itemContent={(_, task) => (
          <div className="px-2 pb-3 pt-1">
            <TaskCard task={task} />
          </div>
        )}
        computeItemKey={(_, task) => task.task_id}
        style={{ height: '100%' }}
      />
    </div>
  )
}

export function TicketLane({
  lane,
  tasks,
}: {
  lane: LaneConfig
  tasks: AdminTask[]
}) {
  return (
    <section
      className="flex min-h-0 min-w-65 flex-col rounded-lg border border-(--border) bg-[color-mix(in_srgb,var(--bg)_82%,var(--border))] shadow-[0_1px_2px_rgb(15_23_42/0.04)]"
      style={{ '--lane-color': laneColorMap[lane.color] } as CSSProperties}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 rounded-t-lg border-b border-(--border-strong) bg-(--panel) px-2.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-[7px] border border-[color-mix(in_srgb,var(--lane-color)_20%,var(--border))] bg-[color-mix(in_srgb,var(--lane-color)_12%,var(--panel))] text-[15px] text-(--lane-color)">
            {lane.icon}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold leading-5 text-(--text-strong)">
              {lane.title}
            </div>
            <div className="truncate text-[10px] font-medium uppercase leading-3 tracking-normal text-(--muted)">
              {lane.description}
            </div>
          </div>
        </div>
        <Badge
          count={tasks.length}
          showZero
          color="var(--admin-primary)"
          overflowCount={999}
        />
      </header>

      <VirtualTaskList tasks={tasks} />
    </section>
  )
}
