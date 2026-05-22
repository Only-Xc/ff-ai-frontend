import { useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'

import {
  adminTasks_list,
  adminTasks_listAll,
  type AdminTaskStatusFilter,
} from '@/api/adminTasks'

import { countQueryConfigs, type MetricKey } from './constants'
import { groupTasksByLane } from './utils'

function normalizeStatusFilter(value: AdminTaskStatusFilter | 'all') {
  return value === 'all' ? undefined : value
}

function createEmptyCountByKey() {
  return countQueryConfigs.reduce(
    (result, item) => ({
      ...result,
      [item.key]: 0,
    }),
    {} as Record<MetricKey, number>,
  )
}

export function useTicketKanbanData() {
  const [status, setStatus] = useState<AdminTaskStatusFilter | undefined>(
    'active',
  )
  const currentStatusValue: AdminTaskStatusFilter | 'all' = status ?? 'all'

  const listQuery = useQuery({
    queryKey: ['admin-tasks', status ?? 'all'],
    queryFn: () => adminTasks_listAll({ status }),
  })

  const countQueries = useQueries({
    queries: countQueryConfigs.map((item) => ({
      queryKey: ['admin-tasks-count', item.key],
      queryFn: () =>
        adminTasks_list({
          status: item.status,
          skip: 0,
          limit: 1,
        }),
    })),
  })

  const tasks = useMemo(() => listQuery.data?.data ?? [], [listQuery.data?.data])
  const tasksByLane = useMemo(() => groupTasksByLane(tasks), [tasks])

  const countByKey = useMemo(() => {
    return countQueryConfigs.reduce((result, item, index) => {
      result[item.key] = countQueries[index]?.data?.count ?? 0

      return result
    }, createEmptyCountByKey())
  }, [countQueries])

  return {
    countByKey,
    currentStatusValue,
    isError: listQuery.isError,
    isLoading: listQuery.isLoading,
    isRefreshing: listQuery.isFetching && !listQuery.isLoading,
    refetch: listQuery.refetch,
    setStatusValue: (value: AdminTaskStatusFilter | 'all') => {
      setStatus(normalizeStatusFilter(value))
    },
    statsLoading: countQueries.some((query) => query.isLoading),
    tasksByLane,
    total: listQuery.data?.count ?? 0,
  }
}
