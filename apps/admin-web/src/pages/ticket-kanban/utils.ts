import dayjs from 'dayjs'

import type { Task, TaskStatus } from '@/api/ticket-kanban'

import { lanes, type LaneId } from './constants'

const statusLaneMap = Object.fromEntries(
  lanes.flatMap((lane) => lane.statuses.map((status) => [status, lane.id])),
) as Record<TaskStatus, LaneId>

export function getLaneId(status: TaskStatus): LaneId {
  return statusLaneMap[status] ?? 'deploying'
}

export function groupTasksByLane(tasks: Task[]) {
  const groupedTasks = Object.fromEntries(
    lanes.map((lane) => [lane.id, [] as Task[]]),
  ) as Record<LaneId, Task[]>

  tasks.forEach((task) => {
    groupedTasks[getLaneId(task.status)].push(task)
  })

  return groupedTasks
}

export function formatDateTime(value?: string) {
  if (!value) return '-'

  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format('MM/DD HH:mm')
}

export function formatCount(value?: number) {
  return value ?? 0
}
