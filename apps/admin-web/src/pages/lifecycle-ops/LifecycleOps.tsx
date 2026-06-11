import { ReloadOutlined } from '@ant-design/icons'
import { Alert, App, Button, Form, Pagination, Tabs, Typography } from 'antd'
import { useMutation } from '@tanstack/react-query'
import pickBy from 'lodash-es/pickBy'
import trim from 'lodash-es/trim'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEventCallback } from 'usehooks-ts'

import {
  adminAgents_demote,
  adminAgents_promote,
  type HotLifecycleCandidate,
  type IdleLifecycleCandidate,
  type PromoteAgentPayload,
} from '@/api/lifecycle-ops'
import { PageContainer } from '@/components/Container'
import { PageHeader } from '@/components/Header'
import { useAuthStore } from '@/store/useAuth'

import { DemoteAgentModal } from './components/DemoteAgentModal'
import { LifecycleCandidateTables } from './components/LifecycleCandidateTables'
import { LifecycleFilterBar } from './components/LifecycleFilterBar'
import { LifecycleSummary } from './components/LifecycleSummary'
import { PromoteAgentModal } from './components/PromoteAgentModal'
import { DEFAULT_FILTER_VALUES } from './constants'
import { useLifecycleCandidates } from './hooks/useLifecycleCandidates'
import { useLifecycleOpsStyles } from './styles'
import type {
  CandidateTab,
  DemoteFormValues,
  FilterValues,
  PromoteFormValues,
} from './types'
import { numberUtils } from '@ff-ai-frontend/utils'
import { getErrorMessage } from './utils'

export function LifecycleOps() {
  const { t } = useTranslation()
  const { styles } = useLifecycleOpsStyles()
  const { message } = App.useApp()
  const operatorId = useAuthStore((state) => state.user?.id)
  const [filterForm] = Form.useForm<FilterValues>()
  const [demoteCandidate, setDemoteCandidate] =
    useState<IdleLifecycleCandidate>()
  const [promoteCandidate, setPromoteCandidate] =
    useState<HotLifecycleCandidate>()
  const {
    activePagination,
    activeTab,
    activeTotal,
    currentError,
    handleFilterChange: updateFilterQuery,
    handleFilterReset: resetFilterQuery,
    hotCandidates,
    hotListQuery,
    idleCandidates,
    idleListQuery,
    invalidateCandidates,
    isActiveTabLoading,
    isRefreshing,
    queryParams,
    refetchAll,
    setActiveTab,
  } = useLifecycleCandidates()

  const closeDemoteModal = useEventCallback(() => {
    setDemoteCandidate(undefined)
  })

  const closePromoteModal = useEventCallback(() => {
    setPromoteCandidate(undefined)
  })

  const openDemoteModal = useEventCallback(
    (candidate: IdleLifecycleCandidate) => {
      setDemoteCandidate(candidate)
    },
  )

  const openPromoteModal = useEventCallback(
    (candidate: HotLifecycleCandidate) => {
      setPromoteCandidate(candidate)
    },
  )

  const demoteMutation = useMutation({
    mutationFn: async ({
      candidate,
      values,
    }: {
      candidate: IdleLifecycleCandidate
      values: DemoteFormValues
    }) => {
      return adminAgents_demote(candidate.agent_id, {
        reason: trim(values.reason),
        ...(operatorId ? { operator_id: operatorId } : {}),
      })
    },
    onSuccess: (result) => {
      invalidateCandidates()
      closeDemoteModal()
      void message.success(
        result.message || t('pages.lifecycle.messages.demoteSuccess'),
      )
    },
  })

  const promoteMutation = useMutation({
    mutationFn: async ({
      candidate,
      values,
    }: {
      candidate: HotLifecycleCandidate
      values: PromoteFormValues
    }) => {
      const resources = pickBy({
        cpu: trim(values.cpu),
        memory: trim(values.memory),
      }) as NonNullable<PromoteAgentPayload['resources']>

      return adminAgents_promote(candidate.agent_id, {
        reason: trim(values.reason),
        replicas: values.replicas,
        ...(Object.keys(resources).length ? { resources } : {}),
        ...(operatorId ? { operator_id: operatorId } : {}),
      })
    },
    onSuccess: (result) => {
      invalidateCandidates()
      closePromoteModal()
      void message.success(
        result.task_id
          ? t('pages.lifecycle.messages.deploymentCreatedWithTask', {
              taskId: result.task_id,
            })
          : result.message || t('pages.lifecycle.messages.deploymentCreated'),
      )
    },
  })

  const handleFilterReset = useEventCallback(() => {
    filterForm.setFieldsValue(DEFAULT_FILTER_VALUES)
    resetFilterQuery()
  })

  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <PageHeader
        title={t('pages.lifecycle.title')}
        subtitle={t('pages.lifecycle.subtitle', {
          idleDays: queryParams.idle_days,
          minDailyInvocations: numberUtils.formatNumber(
            queryParams.min_daily_invocations,
          ),
        })}
      >
        <LifecycleSummary
          hotCandidates={hotCandidates}
          hotTotal={hotListQuery.data?.count ?? 0}
          idleCandidates={idleCandidates}
          idleTotal={idleListQuery.data?.count ?? 0}
          queryParams={queryParams}
        />
      </PageHeader>

      <PageContainer className="flex min-h-0 flex-1 flex-col overflow-hidden bg-(--ant-color-bg-container) shadow-[0_1px_2px_rgb(15_23_42/0.04)] contain-[paint]">
        <div className="flex h-full min-h-0 w-full flex-col">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-b-(--ant-color-border-secondary) px-5 py-3">
            <LifecycleFilterBar
              form={filterForm}
              className={`${styles.filterBar} flex-1`}
              isRefreshing={isRefreshing}
              onChange={updateFilterQuery}
              onRefresh={refetchAll}
              onReset={handleFilterReset}
            />
          </div>

          {idleListQuery.isError || hotListQuery.isError ? (
            <Alert
              showIcon
              className="mx-5 mb-4 shrink-0"
              action={
                <Button
                  icon={<ReloadOutlined />}
                  size="small"
                  onClick={refetchAll}
                >
                  {t('common.actions.retry')}
                </Button>
              }
              title={t('pages.lifecycle.loadFailed')}
              description={getErrorMessage(currentError, t)}
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
                label: t('pages.lifecycle.tabs.idle', {
                  count: idleListQuery.data?.count ?? 0,
                }),
                children: null,
              },
              {
                key: 'hot',
                label: t('pages.lifecycle.tabs.hot', {
                  count: hotListQuery.data?.count ?? 0,
                }),
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
            hotCandidates={hotCandidates}
            idleCandidates={idleCandidates}
            idleDays={queryParams.idle_days}
            isLoading={isActiveTabLoading}
            promoteCandidateId={promoteCandidate?.agent_id}
            promotePending={promoteMutation.isPending}
            onOpenDemote={openDemoteModal}
            onOpenPromote={openPromoteModal}
          />

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-t-(--ant-color-border-secondary) px-5 py-3">
            <Typography.Text className="text-(--muted)!">
              {t('common.labels.totalCount', { total: activeTotal })}
            </Typography.Text>
            <Pagination {...activePagination.props} total={activeTotal} />
          </div>
        </div>
      </PageContainer>

      <DemoteAgentModal
        candidate={demoteCandidate}
        pending={demoteMutation.isPending}
        onCancel={closeDemoteModal}
        onSubmit={(values, candidate) => {
          demoteMutation.mutate({ values, candidate })
        }}
      />
      <PromoteAgentModal
        candidate={promoteCandidate}
        pending={promoteMutation.isPending}
        onCancel={closePromoteModal}
        onSubmit={(values, candidate) => {
          promoteMutation.mutate({ values, candidate })
        }}
      />
    </div>
  )
}

export default LifecycleOps
