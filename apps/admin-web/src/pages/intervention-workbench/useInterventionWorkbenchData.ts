import { App } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import {
  adminTasks_getSnapshot,
  adminTasksKeys,
  adminTasks_reject,
  adminTasks_reprompt,
} from '@/api/ticket-kanban'
import { useAuthStore } from '@/store/useAuth'

import {
  buildCloneCommand,
  buildContextText,
  buildErrorItems,
  buildPayloadText,
  buildSnapshotItems,
} from './utils'

export interface RepromptFormValues {
  prompt_hint: string
}

export interface RejectFormValues {
  reason: string
}

export function useInterventionWorkbenchData() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const { taskId = '' } = useParams<{ taskId: string }>()
  const snapshotTaskId = taskId.trim()
  const operatorId = useAuthStore((state) => state.user?.id)

  const snapshotQuery = useQuery({
    queryKey: adminTasksKeys.snapshot(snapshotTaskId),
    queryFn: () => adminTasks_getSnapshot(snapshotTaskId),
    enabled: Boolean(snapshotTaskId),
  })

  const snapshot = snapshotQuery.data
  const canOperate = snapshot?.status === 'PENDING_APPROVAL'
  const displayTitle = snapshot?.title?.trim() ? snapshot.title : taskId
  const snapshotItems = useMemo(
    () => buildSnapshotItems(snapshot, t),
    [snapshot, t],
  )
  const errorItems = useMemo(
    () => buildErrorItems(snapshot?.error, t),
    [snapshot?.error, t],
  )
  const contextText = useMemo(
    () => buildContextText(snapshot?.error?.context),
    [snapshot?.error?.context],
  )
  const payloadText = useMemo(
    () => buildPayloadText(snapshot?.payload_summary),
    [snapshot?.payload_summary],
  )
  const cloneCommand = useMemo(
    () => (snapshot ? buildCloneCommand(snapshot) : ''),
    [snapshot],
  )

  const invalidateTaskQueries = () => {
    void queryClient.invalidateQueries({ queryKey: adminTasksKeys.lists() })
    void queryClient.invalidateQueries({ queryKey: adminTasksKeys.stats() })
    void queryClient.invalidateQueries({
      queryKey: adminTasksKeys.snapshot(snapshotTaskId),
    })
  }

  const repromptMutation = useMutation({
    mutationFn: (values: RepromptFormValues) =>
      adminTasks_reprompt(snapshotTaskId, {
        prompt_hint: values.prompt_hint.trim(),
        ...(operatorId ? { operator_id: operatorId } : {}),
      }),
    onSuccess: (result) => {
      invalidateTaskQueries()
      void message.success(
        result.message || t('pages.intervention.success.reprompt'),
      )
      void navigate('/tickets')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (values: RejectFormValues) =>
      adminTasks_reject(snapshotTaskId, {
        reason: values.reason.trim(),
        ...(operatorId ? { operator_id: operatorId } : {}),
      }),
    onSuccess: (result) => {
      invalidateTaskQueries()
      void message.success(
        result.message || t('pages.intervention.success.reject'),
      )
      void navigate('/tickets')
    },
  })

  return {
    canOperate,
    cloneCommand,
    contextText,
    displayTitle,
    errorItems,
    goBack: () => {
      void navigate('/tickets')
    },
    isFetching: snapshotQuery.isFetching,
    isLoading: snapshotQuery.isLoading,
    payloadText,
    refetch: snapshotQuery.refetch,
    rejectPending: rejectMutation.isPending,
    repromptPending: repromptMutation.isPending,
    snapshot,
    snapshotError: snapshotQuery.error,
    snapshotItems,
    snapshotIsError: snapshotQuery.isError,
    submitReject: (values: RejectFormValues) => rejectMutation.mutate(values),
    submitReprompt: (values: RepromptFormValues) =>
      repromptMutation.mutate(values),
    taskId: snapshotTaskId,
  }
}
