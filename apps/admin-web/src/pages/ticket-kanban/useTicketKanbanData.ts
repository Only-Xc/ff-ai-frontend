import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import {
  adminTasks_getStats,
  adminTasksKeys,
  adminTasks_list,
  type AdminTaskStats,
  type AdminTaskQuery,
  type TaskStatusFilter,
} from '@/api/ticket-kanban'

import { groupTasksByLane } from './utils'

function normalizeStatusFilter(value: TaskStatusFilter | 'all') {
  return value === 'all' ? undefined : value
}

function createEmptyStats(): AdminTaskStats {
  return {
    total_count: 0,
    active_count: 0,
    failed_count: 0,
    filtered_count: 0,
    pending_approval_count: 0,
  }
}

export function useTicketKanbanData() {
  const [status, setStatus] = useState<TaskStatusFilter | undefined>(
    'active',
  )
  const currentStatusValue: TaskStatusFilter | 'all' = status ?? 'all'
  const listParams = useMemo<AdminTaskQuery>(() => ({ status: status ?? "" }), [status])

  const listQuery = useQuery({
    queryKey: adminTasksKeys.list(listParams),
    queryFn: () =>
      adminTasks_list({
        ...listParams,
        skip: 0,
        limit: 0,
      }),
    placeholderData: keepPreviousData,
  })

  const statsQuery = useQuery({
    queryKey: adminTasksKeys.stats(),
    queryFn: () => adminTasks_getStats(),
  })

  const tasks = useMemo(() => listQuery.data?.data ?? [], [listQuery.data?.data])
  const tasksByLane = useMemo(() => groupTasksByLane(tasks), [tasks])

  const stats = useMemo(
    () => statsQuery.data ?? createEmptyStats(),
    [statsQuery.data],
  )

  return {
    currentStatusValue,
    isError: listQuery.isError,
    isLoading: listQuery.isLoading,
    isRefreshing: listQuery.isFetching || statsQuery.isFetching,
    refetch: () => Promise.all([listQuery.refetch(), statsQuery.refetch()]),
    setStatusValue: (value: TaskStatusFilter | 'all') => {
      setStatus(normalizeStatusFilter(value))
    },
    stats,
    statsLoading: statsQuery.isLoading,
    tasksByLane,
    total: listQuery.data?.count ?? 0,
  }
}
