import { format, isValid } from 'date-fns'

import type { AdminTask, AdminTaskStatus } from '@/api/adminTasks'

import { lanes, type LaneId } from './constants'

const statusLaneMap = Object.fromEntries(
  lanes.flatMap((lane) => lane.statuses.map((status) => [status, lane.id])),
) as Record<AdminTaskStatus, LaneId>

export function getLaneId(status: AdminTaskStatus): LaneId {
  return statusLaneMap[status] ?? 'deploying'
}

export function groupTasksByLane(tasks: AdminTask[]) {
  const groupedTasks = Object.fromEntries(
    lanes.map((lane) => [lane.id, [] as AdminTask[]]),
  ) as Record<LaneId, AdminTask[]>

  tasks.forEach((task) => {
    groupedTasks[getLaneId(task.status)].push(task)
  })

  return groupedTasks
}

export function formatDateTime(value?: string) {
  if (!value) return '-'

  const date = new Date(value)

  if (!isValid(date)) return '-'

  return format(date, 'MM/dd HH:mm')
}

export function formatCount(value?: number) {
  return value ?? 0
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0%'

  return `${Math.round(value)}%`
}

export function getMetricPercent(value: number, total: number) {
  if (!total) return 0

  return Math.min(100, Math.max(0, (value / total) * 100))
}
