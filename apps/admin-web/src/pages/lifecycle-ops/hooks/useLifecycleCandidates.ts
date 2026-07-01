import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useEventCallback } from 'usehooks-ts'

import {
  adminAgentsKeys,
  adminAgents_getHotLifecycleCandidates,
  adminAgents_getIdleLifecycleCandidates,
  adminAgents_getObserveLifecycleCandidates,
  type LifecycleHotCandidateListQuery,
  type LifecycleIdleCandidateListQuery,
  type LifecycleObserveCandidateListQuery,
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
  const observePagination = usePaginationParams()
  const hotPagination = usePaginationParams()

  const idleListParams = useMemo<LifecycleIdleCandidateListQuery>(
    () => ({
      idle_days: queryParams.idle_days,
      ...buildLifecycleFilterParams(queryParams),
      ...idlePagination.query,
    }),
    [idlePagination.query, queryParams],
  )

  const hotListParams = useMemo<LifecycleHotCandidateListQuery>(
    () => ({
      min_daily_invocations: queryParams.min_daily_invocations,
      ...buildLifecycleFilterParams(queryParams),
      ...hotPagination.query,
    }),
    [hotPagination.query, queryParams],
  )

  const observeListParams = useMemo<LifecycleObserveCandidateListQuery>(
    () => ({
      idle_days: queryParams.idle_days,
      min_daily_invocations: queryParams.min_daily_invocations,
      ...buildLifecycleFilterParams(queryParams),
      ...observePagination.query,
    }),
    [observePagination.query, queryParams],
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

  const observeListQuery = useQuery({
    queryKey: adminAgentsKeys.lifecycleObserveList(observeListParams),
    queryFn: () => adminAgents_getObserveLifecycleCandidates(observeListParams),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })

  const invalidateCandidates = useEventCallback(() => {
    void Promise.all([
      queryClient.invalidateQueries({
        queryKey: adminAgentsKeys.lifecycleIdleLists(),
      }),
      queryClient.invalidateQueries({
        queryKey: adminAgentsKeys.lifecycleObserveLists(),
      }),
      queryClient.invalidateQueries({
        queryKey: adminAgentsKeys.lifecycleHotLists(),
      }),
    ])
  })

  const resetPaginations = useEventCallback(() => {
    idlePagination.reset()
    observePagination.reset()
    hotPagination.reset()
  })

  const handleFilterChange = useEventCallback((values: FilterValues) => {
    setQueryParams({
      idle_days: values.idle_days ?? DEFAULT_FILTER_VALUES.idle_days,
      min_daily_invocations:
        values.min_daily_invocations ??
        DEFAULT_FILTER_VALUES.min_daily_invocations,
      invoked_range: values.invoked_range ?? null,
      runtime_status: values.runtime_status,
      tenant_keyword: values.tenant_keyword?.trim() || undefined,
    })
    resetPaginations()
  })

  const handleFilterReset = useEventCallback(() => {
    setQueryParams(DEFAULT_FILTER_VALUES)
    resetPaginations()
  })

  const refetchAll = useEventCallback(() => {
    void Promise.all([
      idleListQuery.refetch(),
      observeListQuery.refetch(),
      hotListQuery.refetch(),
    ])
  })

  return {
    activePagination:
      activeTab === 'idle'
        ? idlePagination
        : activeTab === 'observe'
          ? observePagination
          : hotPagination,
    activeTab,
    activeTotal:
      activeTab === 'idle'
        ? idleListQuery.data?.count ?? 0
        : activeTab === 'observe'
          ? observeListQuery.data?.count ?? 0
        : hotListQuery.data?.count ?? 0,
    currentError: idleListQuery.error ?? observeListQuery.error ?? hotListQuery.error,
    handleFilterChange,
    handleFilterReset,
    hotCandidates: hotListQuery.data?.data ?? [],
    hotListQuery,
    idleCandidates: idleListQuery.data?.data ?? [],
    idleListQuery,
    invalidateCandidates,
    isActiveTabLoading:
      activeTab === 'idle'
        ? idleListQuery.isFetching
        : activeTab === 'observe'
          ? observeListQuery.isFetching
          : hotListQuery.isFetching,
    isRefreshing:
      idleListQuery.isFetching ||
      observeListQuery.isFetching ||
      hotListQuery.isFetching,
    observeCandidates: observeListQuery.data?.data ?? [],
    observeListQuery,
    queryParams,
    refetchAll,
    setActiveTab,
  }
}

function buildLifecycleFilterParams(queryParams: FilterValues) {
  const [start, end] = queryParams.invoked_range ?? []
  return {
    ...(queryParams.tenant_keyword
      ? { tenant_keyword: queryParams.tenant_keyword }
      : {}),
    ...(queryParams.runtime_status
      ? { runtime_status: queryParams.runtime_status }
      : {}),
    ...(start && dayjs(start).isValid()
      ? { invoked_from: dayjs(start).format('YYYY-MM-DD') }
      : {}),
    ...(end && dayjs(end).isValid()
      ? { invoked_to: dayjs(end).format('YYYY-MM-DD') }
      : {}),
  }
}
