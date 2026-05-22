import { App } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'

import {
  adminTasks_getSnapshot,
  adminTasks_reject,
  adminTasks_reprompt,
} from '@/api/adminTasks'
import { useAuthStore } from '@/store/useAuth'

import {
  buildCloneCommand,
  buildContextText,
  buildErrorItems,
  buildPayloadText,
  buildSnapshotItems,
  getErrorMessage,
} from './utils'

export interface RepromptFormValues {
  prompt_hint: string
}

export interface RejectFormValues {
  reason: string
}

export function useInterventionWorkbenchData() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const { taskId = '' } = useParams<{ taskId: string }>()
  const operatorId = useAuthStore((state) => state.user?.id)

  const snapshotQuery = useQuery({
    queryKey: ['admin-task-snapshot', taskId],
    queryFn: () => adminTasks_getSnapshot(taskId),
    enabled: Boolean(taskId),
  })

  const snapshot = snapshotQuery.data
  const canOperate = snapshot?.status === 'PENDING_APPROVAL'
  const displayTitle = snapshot?.title?.trim() ? snapshot.title : taskId
  const snapshotItems = useMemo(() => buildSnapshotItems(snapshot), [snapshot])
  const errorItems = useMemo(
    () => buildErrorItems(snapshot?.error),
    [snapshot?.error],
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
    void queryClient.invalidateQueries({ queryKey: ['admin-tasks'] })
    void queryClient.invalidateQueries({ queryKey: ['admin-tasks-count'] })
    void queryClient.invalidateQueries({
      queryKey: ['admin-task-snapshot', taskId],
    })
  }

  const repromptMutation = useMutation({
    mutationFn: (values: RepromptFormValues) =>
      adminTasks_reprompt(taskId, {
        prompt_hint: values.prompt_hint.trim(),
        ...(operatorId ? { operator_id: operatorId } : {}),
      }),
    onError: (error) => {
      void message.error(getErrorMessage(error))
    },
    onSuccess: (result) => {
      invalidateTaskQueries()
      void message.success(result.message || '已注入 Prompt')
      void navigate('/tickets')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (values: RejectFormValues) =>
      adminTasks_reject(taskId, {
        reason: values.reason.trim(),
        ...(operatorId ? { operator_id: operatorId } : {}),
      }),
    onError: (error) => {
      void message.error(getErrorMessage(error))
    },
    onSuccess: (result) => {
      invalidateTaskQueries()
      void message.success(result.message || '已驳回工单')
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
    taskId,
  }
}
