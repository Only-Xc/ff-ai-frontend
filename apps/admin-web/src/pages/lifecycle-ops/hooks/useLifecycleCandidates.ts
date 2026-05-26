import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useEventCallback } from 'usehooks-ts'

import {
  adminAgentsKeys,
  adminAgents_getHotLifecycleCandidates,
  adminAgents_getIdleLifecycleCandidates,
  type LifecycleHotCandidateListQuery,
  type LifecycleIdleCandidateListQuery,
} from '@/api/lifecycle-ops'
import { usePaginationParams } from '@/hooks/usePaginationParams'

import { DEFAULT_FILTER_VALUES } from '../constants'
import type { CandidateTab, FilterValues } from '../types'

export function useLifecycleCandidates() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<CandidateTab>('idle')
  const [queryParams, setQueryParams] = useState<FilterValues>(
    DEFAULT_FILTER_VALUES,
  )
  const idlePagination = usePaginationParams()
  const hotPagination = usePaginationParams()

  const idleListParams = useMemo<LifecycleIdleCandidateListQuery>(
    () => ({
      idle_days: queryParams.idle_days,
      ...idlePagination.query,
    }),
    [idlePagination.query, queryParams.idle_days],
  )

  const hotListParams = useMemo<LifecycleHotCandidateListQuery>(
    () => ({
      min_daily_invocations: queryParams.min_daily_invocations,
      ...hotPagination.query,
    }),
    [hotPagination.query, queryParams.min_daily_invocations],
  )

  const idleListQuery = useQuery({
    queryKey: adminAgentsKeys.lifecycleIdleList(idleListParams),
    queryFn: () => adminAgents_getIdleLifecycleCandidates(idleListParams),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })

  const hotListQuery = useQuery({
    queryKey: adminAgentsKeys.lifecycleHotList(hotListParams),
    queryFn: () => adminAgents_getHotLifecycleCandidates(hotListParams),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })

  const invalidateCandidates = useEventCallback(() => {
    void Promise.all([
      queryClient.invalidateQueries({
        queryKey: adminAgentsKeys.lifecycleIdleLists(),
      }),
      queryClient.invalidateQueries({
        queryKey: adminAgentsKeys.lifecycleHotLists(),
      }),
    ])
  })

  const resetPaginations = useEventCallback(() => {
    idlePagination.reset()
    hotPagination.reset()
  })

  const handleFilterChange = useEventCallback((values: FilterValues) => {
    setQueryParams({
      idle_days: values.idle_days ?? DEFAULT_FILTER_VALUES.idle_days,
      min_daily_invocations:
        values.min_daily_invocations ??
        DEFAULT_FILTER_VALUES.min_daily_invocations,
    })
    resetPaginations()
  })

  const handleFilterReset = useEventCallback(() => {
    setQueryParams(DEFAULT_FILTER_VALUES)
    resetPaginations()
  })

  const refetchAll = useEventCallback(() => {
    void Promise.all([idleListQuery.refetch(), hotListQuery.refetch()])
  })

  return {
    activePagination: activeTab === 'idle' ? idlePagination : hotPagination,
    activeTab,
    activeTotal:
      activeTab === 'idle'
        ? idleListQuery.data?.count ?? 0
        : hotListQuery.data?.count ?? 0,
    currentError: idleListQuery.error ?? hotListQuery.error,
    handleFilterChange,
    handleFilterReset,
    hotCandidates: hotListQuery.data?.data ?? [],
    hotListQuery,
    idleCandidates: idleListQuery.data?.data ?? [],
    idleListQuery,
    invalidateCandidates,
    isActiveTabLoading:
      activeTab === 'idle' ? idleListQuery.isFetching : hotListQuery.isFetching,
    isRefreshing: idleListQuery.isFetching || hotListQuery.isFetching,
    queryParams,
    refetchAll,
    setActiveTab,
  }
}
