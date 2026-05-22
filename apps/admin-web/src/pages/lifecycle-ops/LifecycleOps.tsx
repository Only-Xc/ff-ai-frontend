import { ReloadOutlined } from '@ant-design/icons'
import { Alert, App, Button, Form, Pagination, Tabs, Typography } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import pickBy from 'lodash-es/pickBy'
import trim from 'lodash-es/trim'
import { useMemo, useState } from 'react'
import { useEventCallback } from 'usehooks-ts'

import {
  adminAgents_demote,
  adminAgents_getLifecycleCandidates,
  adminAgents_promote,
  type HotLifecycleCandidate,
  type IdleLifecycleCandidate,
  type PromoteAgentPayload,
} from '@/api/adminAgents'
import { PageContainer } from '@/components/Container'
import { PageHeader } from '@/components/Header'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { useAuthStore } from '@/store/useAuth'

import { LifecycleActionModals } from './components/LifecycleActionModals'
import { LifecycleCandidateTables } from './components/LifecycleCandidateTables'
import { LifecycleFilterBar } from './components/LifecycleFilterBar'
import { LifecycleSummary } from './components/LifecycleSummary'
import { DEFAULT_FILTER_VALUES, DEFAULT_PROMOTE_VALUES } from './constants'
import { useLifecycleOpsStyles } from './styles'
import type {
  CandidateTab,
  DemoteFormValues,
  FilterValues,
  PromoteFormValues,
} from './types'
import {
  getDemoteReason,
  getPromoteReason,
  slicePage,
} from './utils/lifecycleCandidates'
import { formatNumber, getErrorMessage } from './utils/lifecycleFormatters'

export function LifecycleOps() {
  const { styles } = useLifecycleOpsStyles()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const operatorId = useAuthStore((state) => state.user?.id)
  const [filterForm] = Form.useForm<FilterValues>()
  const [demoteForm] = Form.useForm<DemoteFormValues>()
  const [promoteForm] = Form.useForm<PromoteFormValues>()
  const [activeTab, setActiveTab] = useState<CandidateTab>('idle')
  const [queryParams, setQueryParams] = useState<FilterValues>(
    DEFAULT_FILTER_VALUES,
  )
  const idlePagination = usePaginationParams({ defaultPageSize: 10 })
  const hotPagination = usePaginationParams({ defaultPageSize: 10 })
  const [demoteCandidate, setDemoteCandidate] =
    useState<IdleLifecycleCandidate>()
  const [promoteCandidate, setPromoteCandidate] =
    useState<HotLifecycleCandidate>()

  const candidatesQuery = useQuery({
    queryKey: [
      'adminAgentLifecycleCandidates',
      queryParams.idle_days,
      queryParams.min_daily_invocations,
    ],
    queryFn: () => adminAgents_getLifecycleCandidates(queryParams),
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  })

  const idleCandidates = useMemo(
    () => candidatesQuery.data?.pools.idle ?? [],
    [candidatesQuery.data?.pools.idle],
  )
  const hotCandidates = useMemo(
    () => candidatesQuery.data?.pools.hot ?? [],
    [candidatesQuery.data?.pools.hot],
  )
  const pagedIdleCandidates = useMemo(
    () =>
      slicePage(
        idleCandidates,
        idlePagination.skip,
        idlePagination.limit,
      ),
    [idleCandidates, idlePagination.limit, idlePagination.skip],
  )
  const pagedHotCandidates = useMemo(
    () =>
      slicePage(hotCandidates, hotPagination.skip, hotPagination.limit),
    [hotCandidates, hotPagination.limit, hotPagination.skip],
  )

  const invalidateCandidates = useEventCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ['adminAgentLifecycleCandidates'],
    })
  })

  const resetPaginations = useEventCallback(() => {
    idlePagination.reset()
    hotPagination.reset()
  })

  const closeDemoteModal = useEventCallback(() => {
    setDemoteCandidate(undefined)
    demoteForm.resetFields()
  })

  const closePromoteModal = useEventCallback(() => {
    setPromoteCandidate(undefined)
    promoteForm.resetFields()
  })

  const openDemoteModal = useEventCallback(
    (candidate: IdleLifecycleCandidate) => {
      setDemoteCandidate(candidate)
      demoteForm.setFieldsValue({
        reason: getDemoteReason(candidate),
      })
    },
  )

  const openPromoteModal = useEventCallback(
    (candidate: HotLifecycleCandidate) => {
      setPromoteCandidate(candidate)
      promoteForm.setFieldsValue({
        ...DEFAULT_PROMOTE_VALUES,
        reason: getPromoteReason(candidate),
      })
    },
  )

  const demoteMutation = useMutation({
    mutationFn: async (values: DemoteFormValues) => {
      if (!demoteCandidate) throw new Error('请选择降级应用')

      return adminAgents_demote(demoteCandidate.agent_id, {
        reason: trim(values.reason),
        ...(operatorId ? { operator_id: operatorId } : {}),
      })
    },
    onError: (error) => {
      void message.error(getErrorMessage(error))
    },
    onSuccess: (result) => {
      invalidateCandidates()
      closeDemoteModal()
      void message.success(result.message || '已降级为沙盒')
    },
  })

  const promoteMutation = useMutation({
    mutationFn: async (values: PromoteFormValues) => {
      if (!promoteCandidate) throw new Error('请选择晋升应用')

      const resources = pickBy({
        cpu: trim(values.cpu),
        memory: trim(values.memory),
      }) as NonNullable<PromoteAgentPayload['resources']>

      return adminAgents_promote(promoteCandidate.agent_id, {
        reason: trim(values.reason),
        replicas: values.replicas,
        ...(Object.keys(resources).length ? { resources } : {}),
        ...(operatorId ? { operator_id: operatorId } : {}),
      })
    },
    onError: (error) => {
      void message.error(getErrorMessage(error))
    },
    onSuccess: (result) => {
      invalidateCandidates()
      closePromoteModal()
      void message.success(
        result.task_id
          ? `部署任务已创建：${result.task_id}`
          : result.message || '部署任务已创建',
      )
    },
  })

  const handleFilterSubmit = useEventCallback((values: FilterValues) => {
    setQueryParams({
      idle_days: values.idle_days ?? DEFAULT_FILTER_VALUES.idle_days,
      min_daily_invocations:
        values.min_daily_invocations ??
        DEFAULT_FILTER_VALUES.min_daily_invocations,
    })
    resetPaginations()
  })

  const handleFilterReset = useEventCallback(() => {
    filterForm.setFieldsValue(DEFAULT_FILTER_VALUES)
    setQueryParams(DEFAULT_FILTER_VALUES)
    resetPaginations()
  })

  const handleDemoteSubmit = useEventCallback(async () => {
    const values = await demoteForm.validateFields()
    demoteMutation.mutate(values)
  })

  const handlePromoteSubmit = useEventCallback(async () => {
    const values = await promoteForm.validateFields()
    promoteMutation.mutate(values)
  })

  const activePagination =
    activeTab === 'idle' ? idlePagination : hotPagination
  const activeTotal =
    activeTab === 'idle' ? idleCandidates.length : hotCandidates.length

  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <PageHeader
        title="生命周期调度"
        subtitle={`当前阈值：沉寂 ${queryParams.idle_days} 天，日均调用 ${formatNumber(queryParams.min_daily_invocations)} 次。`}
      >
        <LifecycleSummary
          hotCandidates={hotCandidates}
          idleCandidates={idleCandidates}
          queryParams={queryParams}
        />
      </PageHeader>

      <PageContainer className="flex min-h-0 flex-1 flex-col overflow-hidden bg-(--ant-color-bg-container) shadow-[0_1px_2px_rgb(15_23_42/0.04),0_12px_32px_rgb(15_23_42/0.05)] [backdrop-filter:blur(18px)]">
        <div className="flex h-full min-h-0 w-full flex-col">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-b-(--ant-color-border-secondary) px-5 py-3">
            <LifecycleFilterBar
              form={filterForm}
              className={`${styles.filterBar} flex-1`}
              onReset={handleFilterReset}
              onSubmit={handleFilterSubmit}
            />
          </div>

          {candidatesQuery.isError ? (
            <Alert
              showIcon
              className="mx-5 mb-4 shrink-0"
              action={
                <Button
                  icon={<ReloadOutlined />}
                  size="small"
                  onClick={() => void candidatesQuery.refetch()}
                >
                  重试
                </Button>
              }
              title="生命周期候选池加载失败"
              description={getErrorMessage(candidatesQuery.error)}
              type="error"
            />
          ) : null}

          <Tabs
            className={`${styles.tabs} shrink-0`}
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as CandidateTab)}
            items={[
              {
                key: 'idle',
                label: `沉寂应用 (${idleCandidates.length})`,
                children: null,
              },
              {
                key: 'hot',
                label: `火爆应用 (${hotCandidates.length})`,
                children: null,
              },
            ]}
            tabBarGutter={20}
          />

          <LifecycleCandidateTables
            activeTab={activeTab}
            activeTotal={activeTotal}
            demoteCandidateId={demoteCandidate?.agent_id}
            demotePending={demoteMutation.isPending}
            hotCandidates={pagedHotCandidates}
            idleCandidates={pagedIdleCandidates}
            idleDays={queryParams.idle_days}
            isLoading={candidatesQuery.isLoading}
            promoteCandidateId={promoteCandidate?.agent_id}
            promotePending={promoteMutation.isPending}
            onOpenDemote={openDemoteModal}
            onOpenPromote={openPromoteModal}
          />

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-t-(--ant-color-border-secondary) px-5 py-3">
            <Typography.Text className="text-(--muted)!">
              共 {activeTotal} 条
            </Typography.Text>
            <Pagination {...activePagination.props} total={activeTotal} />
          </div>
        </div>
      </PageContainer>

      <LifecycleActionModals
        demoteCandidate={demoteCandidate}
        demoteForm={demoteForm}
        demotePending={demoteMutation.isPending}
        promoteCandidate={promoteCandidate}
        promoteForm={promoteForm}
        promotePending={promoteMutation.isPending}
        onCancelDemote={closeDemoteModal}
        onCancelPromote={closePromoteModal}
        onSubmitDemote={() => void handleDemoteSubmit()}
        onSubmitPromote={() => void handlePromoteSubmit()}
      />
    </div>
  )
}

export default LifecycleOps
