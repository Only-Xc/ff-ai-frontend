import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Popconfirm,
  Result,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { isRequestError } from '@ff-ai-frontend/utils'
import {
  stageSwitchDecision_submit,
  stageSwitchExecution_retry,
  stageSwitchKeys,
  stageSwitchRequest_cancel,
  stageSwitchRequest_get,
  type StageSwitchDecisionCreate,
  type StageSwitchNode,
  type StageSwitchRequestDetail,
} from '@/api/stage-switch'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/store/useAuth'

import { ApprovalProgress } from './components/ApprovalProgress'
import { DecisionDrawer } from './components/DecisionDrawer'
import {
  approvalStatusColor,
  approvalStatusLabel,
  canCancelRequest,
  canRetryExecution,
  decisionColor,
  decisionLabel,
  directionColor,
  directionLabel,
  executionStatusColor,
  executionStatusLabel,
} from './status'

function formatDateTime(value: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

/** The node currently awaiting a decision (PENDING/OVERDUE), lowest sequence first. */
function findActiveNode(
  detail: StageSwitchRequestDetail | undefined,
): StageSwitchNode | undefined {
  if (!detail) return undefined
  return [...detail.nodes]
    .sort((a, b) => a.sequence - b.sequence)
    .find((node) => node.status === 'PENDING' || node.status === 'OVERDUE')
}

export default function RequestDetail() {
  const { requestId = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const { hasPermission } = usePermission()
  const currentUserId = useAuthStore((state) => state.user?.id)

  const [decisionOpen, setDecisionOpen] = useState(false)

  const detailQuery = useQuery({
    queryKey: stageSwitchKeys.request(requestId),
    queryFn: () => stageSwitchRequest_get(requestId),
    enabled: !!requestId,
  })

  const detail = detailQuery.data
  const request = detail?.request
  const activeNode = findActiveNode(detail)

  const invalidateDetail = () => {
    void queryClient.invalidateQueries({
      queryKey: stageSwitchKeys.request(requestId),
    })
    void queryClient.invalidateQueries({ queryKey: stageSwitchKeys.taskLists() })
    void queryClient.invalidateQueries({
      queryKey: stageSwitchKeys.requestLists(),
    })
  }

  const decideMutation = useMutation({
    mutationFn: (values: StageSwitchDecisionCreate) =>
      stageSwitchDecision_submit(requestId, values),
    onSuccess: () => {
      void message.success(t('pages.stageSwitch.messages.decisionSubmitted'))
      setDecisionOpen(false)
      invalidateDetail()
    },
    onError: (error) => {
      // 409 = optimistic version conflict: request/node changed under us.
      if (isRequestError(error) && error.status === 409) {
        setDecisionOpen(false)
        modal.warning({
          title: t('pages.stageSwitch.messages.versionConflictTitle'),
          content: t('pages.stageSwitch.messages.versionConflictContent'),
          okText: t('common.actions.refresh'),
          onOk: () => detailQuery.refetch(),
        })
        return
      }
      void message.error(
        error instanceof Error
          ? error.message
          : t('common.errors.operationFailed'),
      )
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () =>
      stageSwitchRequest_cancel(requestId, {
        rationale: t('pages.stageSwitch.messages.cancelRationale'),
      }),
    onSuccess: () => {
      void message.success(t('pages.stageSwitch.messages.cancelSuccess'))
      invalidateDetail()
    },
    onError: (error) => {
      void message.error(
        error instanceof Error
          ? error.message
          : t('common.errors.operationFailed'),
      )
    },
  })

  const retryMutation = useMutation({
    mutationFn: () => stageSwitchExecution_retry(requestId),
    onSuccess: () => {
      void message.success(t('pages.stageSwitch.messages.retrySuccess'))
      invalidateDetail()
    },
    onError: (error) => {
      void message.error(
        error instanceof Error
          ? error.message
          : t('common.errors.operationFailed'),
      )
    },
  })

  if (detailQuery.isLoading) {
    return (
      <PageContainer className="flex min-h-100 items-center justify-center p-5">
        <Spin />
      </PageContainer>
    )
  }

  if (detailQuery.isError || !detail || !request) {
    return (
      <PageContainer className="p-5">
        <Result
          status={detailQuery.isError ? 'error' : '404'}
          title={
            detailQuery.isError
              ? t('pages.stageSwitch.detail.loadFailed')
              : t('pages.stageSwitch.detail.notFound')
          }
          subTitle={
            detailQuery.error instanceof Error
              ? detailQuery.error.message
              : undefined
          }
          extra={
            <Space>
              <Button onClick={() => void navigate('/stage-switch/requests')}>
                {t('pages.stageSwitch.detail.backToList')}
              </Button>
              {detailQuery.isError ? (
                <Button
                  type="primary"
                  onClick={() => void detailQuery.refetch()}
                >
                  {t('common.actions.retry')}
                </Button>
              ) : null}
            </Space>
          }
        />
      </PageContainer>
    )
  }

  // Business eligibility: server-derived flag OR (current user is a PENDING
  // assignee on the active node) as a defensive fallback.
  const isAssigneeOfActiveNode =
    !!activeNode &&
    !!currentUserId &&
    detail.assignees.some(
      (assignee) =>
        assignee.node_id === activeNode.id &&
        assignee.user_id === currentUserId &&
        assignee.assignee_status === 'PENDING',
    )
  const canDecide =
    hasPermission('admin.stage_switch.approve') &&
    !!activeNode &&
    (request.can_current_user_decide || isAssigneeOfActiveNode)

  const showCancel =
    hasPermission('admin.stage_switch.cancel') &&
    canCancelRequest(request.approval_status)
  const showRetry =
    hasPermission('admin.stage_switch.retry') &&
    canRetryExecution(request.execution_status)

  return (
    <PageContainer className="p-5">
      <PageHeader
        title={request.request_no}
        subtitle={t('pages.stageSwitch.detail.subtitle', {
          agentId: request.agent_id,
        })}
      >
        <Space wrap>
          <Button onClick={() => void navigate('/stage-switch/requests')}>
            {t('pages.stageSwitch.detail.backToList')}
          </Button>
          {showRetry ? (
            <Popconfirm
              title={t('pages.stageSwitch.detail.retryConfirm')}
              okText={t('common.actions.confirm')}
              cancelText={t('common.actions.cancel')}
              onConfirm={() => retryMutation.mutate()}
            >
              <Button loading={retryMutation.isPending}>
                {t('pages.stageSwitch.actions.retry')}
              </Button>
            </Popconfirm>
          ) : null}
          {showCancel ? (
            <Popconfirm
              title={t('pages.stageSwitch.detail.cancelConfirm')}
              okText={t('common.actions.confirm')}
              cancelText={t('common.actions.cancel')}
              okButtonProps={{ danger: true }}
              onConfirm={() => cancelMutation.mutate()}
            >
              <Button danger loading={cancelMutation.isPending}>
                {t('pages.stageSwitch.actions.cancel')}
              </Button>
            </Popconfirm>
          ) : null}
          {canDecide ? (
            <Button type="primary" onClick={() => setDecisionOpen(true)}>
              {t('pages.stageSwitch.actions.decide')}
            </Button>
          ) : null}
        </Space>
      </PageHeader>

      {request.execution_status === 'FAILED' ||
      request.execution_status === 'CONFLICT' ? (
        <Alert
          showIcon
          className="mb-4"
          type="error"
          title={t('pages.stageSwitch.detail.executionFailedNotice')}
        />
      ) : null}

      <Card size="small" className="mb-4">
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 2, md: 3 }}
          items={[
            {
              key: 'direction',
              label: t('pages.stageSwitch.columns.direction'),
              children: (
                <Tag color={directionColor(request.direction)}>
                  {directionLabel(request.direction, t)}
                </Tag>
              ),
            },
            {
              key: 'stageChange',
              label: t('pages.stageSwitch.columns.stageChange'),
              children: t('pages.stageSwitch.columns.stageChangeValue', {
                source: request.source_stage,
                target: request.target_stage,
              }),
            },
            {
              key: 'agent',
              label: t('pages.stageSwitch.columns.agentId'),
              children: request.agent_id,
            },
            {
              key: 'approvalStatus',
              label: t('pages.stageSwitch.columns.approvalStatus'),
              children: (
                <Tag color={approvalStatusColor(request.approval_status)}>
                  {approvalStatusLabel(request.approval_status, t)}
                </Tag>
              ),
            },
            {
              key: 'executionStatus',
              label: t('pages.stageSwitch.columns.executionStatus'),
              children: (
                <Tag color={executionStatusColor(request.execution_status)}>
                  {executionStatusLabel(request.execution_status, t)}
                </Tag>
              ),
            },
            {
              key: 'createdAt',
              label: t('pages.stageSwitch.columns.createdAt'),
              children: formatDateTime(request.created_at),
            },
            {
              key: 'submittedAt',
              label: t('pages.stageSwitch.detail.submittedAt'),
              children: formatDateTime(request.submitted_at),
            },
            {
              key: 'approvedAt',
              label: t('pages.stageSwitch.detail.approvedAt'),
              children: formatDateTime(request.approved_at),
            },
            {
              key: 'reason',
              label: t('pages.stageSwitch.detail.reason'),
              span: { xs: 1, sm: 2, md: 3 },
              children: request.reason || '-',
            },
          ]}
        />
      </Card>

      <Card
        size="small"
        className="mb-4"
        title={t('pages.stageSwitch.detail.approvalProgress')}
      >
        <ApprovalProgress nodes={detail.nodes} assignees={detail.assignees} />
      </Card>

      <Card
        size="small"
        title={t('pages.stageSwitch.detail.decisionHistory')}
      >
        {detail.decisions.length > 0 ? (
          <Timeline
            items={[...detail.decisions]
              .sort((a, b) => dayjs(b.decided_at).valueOf() - dayjs(a.decided_at).valueOf())
              .map((record) => ({
                color: decisionColor(record.decision),
                children: (
                  <div>
                    <Space wrap>
                      <Tag color={decisionColor(record.decision)}>
                        {decisionLabel(record.decision, t)}
                      </Tag>
                      <Typography.Text type="secondary">
                        {record.decided_by}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        {formatDateTime(record.decided_at)}
                      </Typography.Text>
                    </Space>
                    {record.rationale ? (
                      <Typography.Paragraph className="mt-1 mb-0">
                        {record.rationale}
                      </Typography.Paragraph>
                    ) : null}
                  </div>
                ),
              }))}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('pages.stageSwitch.detail.noDecisions')}
          />
        )}
      </Card>

      <DecisionDrawer
        open={decisionOpen}
        pending={decideMutation.isPending}
        requestVersion={request.version}
        nodeVersion={activeNode?.version ?? 0}
        onClose={() => setDecisionOpen(false)}
        onSubmit={(values) => decideMutation.mutate(values)}
      />
    </PageContainer>
  )
}
