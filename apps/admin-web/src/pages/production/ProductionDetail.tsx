import { ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Modal,
  Skeleton,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'

import {
  productionApprovals_apply,
  productionApprovals_cancel,
  productionApprovals_get,
  productionApprovals_submitDecision,
  productionKeys,
  type ProductionApprovalDecisionPayload,
} from '@/api/production'

import { ApprovalDecisionDrawer } from './components/ApprovalDecisionDrawer'
import { approvalStatusColor, approvalStatusLabel } from './status'

interface DecisionRecord {
  decision: string
  rationale: string
  decided_by: string
  decided_by_display?: string
  decided_at: string
  request_version: number
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}

function readNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function ProductionDetail() {
  const { t } = useTranslation()
  const { approvalId = '' } = useParams<{ approvalId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [decisionDrawerOpen, setDecisionDrawerOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const { data, isFetching } = useQuery({
    queryKey: productionKeys.detail(approvalId),
    queryFn: () => productionApprovals_get(approvalId),
    enabled: Boolean(approvalId),
  })

  const decisionMutation = useMutation({
    mutationFn: (values: ProductionApprovalDecisionPayload) =>
      productionApprovals_submitDecision(approvalId, values),
    onSuccess: () => {
      message.success(t('pages.production.detail.decisionSuccess'))
      void queryClient.invalidateQueries({
        queryKey: productionKeys.detail(approvalId),
      })
      setDecisionDrawerOpen(false)
    },
    onError: (err: Error) => {
      message.error(err.message || t('common.errors.unknown'))
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (rationale: string) =>
      productionApprovals_cancel(approvalId, { rationale }),
    onSuccess: () => {
      message.success(t('pages.production.detail.cancelSuccess'))
      setCancelModalOpen(false)
      setCancelReason('')
      void queryClient.invalidateQueries({
        queryKey: productionKeys.detail(approvalId),
      })
    },
    onError: (err: Error) => {
      message.error(err.message || t('common.errors.unknown'))
    },
  })

  const applyMutation = useMutation({
    mutationFn: () => productionApprovals_apply(approvalId),
    onSuccess: () => {
      message.success(t('pages.production.detail.reapplySuccess'))
      void queryClient.invalidateQueries({
        queryKey: productionKeys.detail(approvalId),
      })
    },
    onError: (err: Error) => {
      message.error(err.message || t('common.errors.unknown'))
    },
  })

  if (isFetching && !data) {
    return (
      <PageContainer>
        <Skeleton active />
      </PageContainer>
    )
  }
  if (!data) {
    return (
      <PageContainer>
        <Empty description={t('pages.production.detail.notFound')} />
      </PageContainer>
    )
  }

  const approval = data.request
  const decisions: DecisionRecord[] = (data.decisions ?? []).map(
    (decision) => ({
      decision: readString(decision.decision),
      rationale: readString(decision.rationale),
      decided_by: readString(decision.decided_by),
      decided_by_display: readOptionalString(decision.decided_by_display),
      decided_at: readString(decision.decided_at),
      request_version: readNumber(decision.request_version),
    }),
  )
  const qaChecks = (data.qa_result_snapshot?.checks ?? []) as Array<{
    check?: string
    status?: string
    detail?: string
    message?: string
  }>

  const decisionColumns: TableProps<DecisionRecord>['columns'] = [
    {
      title: t('pages.production.detail.decisionDecision'),
      dataIndex: 'decision',
      width: 110,
    },
    {
      title: t('pages.production.detail.decisionDecidedBy'),
      dataIndex: 'decided_by',
      width: 220,
      render: (v: string, record: DecisionRecord) =>
        record.decided_by_display ?? v,
    },
    {
      title: t('pages.production.detail.decisionDecidedAt'),
      dataIndex: 'decided_at',
      width: 170,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: t('pages.production.detail.decisionRationale'),
      dataIndex: 'rationale',
    },
  ]

  const handleCancelOpen = () => {
    setCancelReason('')
    setCancelModalOpen(true)
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${t('pages.production.detail.title')} · ${approval.approval_no}`}
        subtitle={t('pages.production.detail.subtitle')}
      >
        <Space wrap>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => void navigate('/production/approvals')}
          >
            {t('pages.production.detail.backToList')}
          </Button>
          {approval.target_type === 'workflow' &&
            approval.workflow_app_id &&
            approval.workflow_version_id && (
              <Button
                icon={<EyeOutlined />}
                onClick={() => {
                  void navigate(
                    `/workflow-apps/${encodeURIComponent(approval.workflow_app_id!)}/review?versionId=${encodeURIComponent(approval.workflow_version_id!)}`,
                  )
                }}
              >
                {t('pages.production.detail.viewWorkflowSnapshot')}
              </Button>
            )}
          {(approval.available_actions ?? []).includes('APPROVE') && (
            <Button type="primary" onClick={() => setDecisionDrawerOpen(true)}>
              {t('pages.production.detail.makeDecision')}
            </Button>
          )}
          {(approval.available_actions ?? []).includes('CANCEL') && (
            <Button danger onClick={handleCancelOpen}>
              {t('pages.production.detail.cancel')}
            </Button>
          )}
          {(approval.available_actions ?? []).includes('RETRY_ACTIVATION') && (
            <Button
              loading={applyMutation.isPending}
              onClick={() => applyMutation.mutate()}
            >
              {t('pages.production.detail.reapply')}
            </Button>
          )}
        </Space>
      </PageHeader>

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview',
            label: t('pages.production.detail.tabOverview'),
            children: (
              <Space direction="vertical" size="large" className="w-full">
                <Card title={t('pages.production.detail.basicInfo')}>
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item
                      label={t('pages.production.queue.status')}
                    >
                      <Tag color={approvalStatusColor(approval.status)}>
                        {approvalStatusLabel(t, approval.status)}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t('pages.production.queue.targetType')}
                    >
                      <Tag
                        color={
                          approval.target_type === 'workflow'
                            ? 'purple'
                            : 'blue'
                        }
                      >
                        {approval.target_type === 'workflow'
                          ? 'Workflow'
                          : 'Agent'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t('pages.production.detail.version')}
                    >
                      v{approval.version}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t('pages.production.queue.agent')}
                    >
                      {approval.agent_id}
                    </Descriptions.Item>
                    {approval.target_type !== 'workflow' && (
                      <Descriptions.Item
                        label={t('pages.production.queue.taskId')}
                      >
                        {approval.task_id ?? '—'}
                      </Descriptions.Item>
                    )}
                    {approval.target_type === 'workflow' && (
                      <Descriptions.Item
                        label={t('pages.production.detail.workflowAppId')}
                      >
                        {approval.workflow_app_id ?? '—'}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item
                      label={t('pages.production.detail.riskLevel')}
                    >
                      {approval.risk_level || '—'} ({approval.risk_score})
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t('pages.production.detail.qaResult')}
                    >
                      {approval.qa_passed ? (
                        <Tag color="green">
                          {t('pages.production.queue.qaPassed')}
                        </Tag>
                      ) : (
                        <Tag color="red">
                          {t('pages.production.queue.qaFailed')}
                        </Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t('pages.production.detail.createdAt')}
                    >
                      {dayjs(approval.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={t('pages.production.detail.decidedAt')}
                    >
                      {approval.decided_at
                        ? dayjs(approval.decided_at).format(
                            'YYYY-MM-DD HH:mm:ss',
                          )
                        : '—'}
                    </Descriptions.Item>
                    {approval.status === 'APPROVED' && (
                      <Descriptions.Item
                        label={t('pages.production.detail.activationStatus')}
                      >
                        <Tag
                          color={
                            approval.activation_status === 'ACTIVE'
                              ? 'green'
                              : approval.activation_status === 'FAILED'
                                ? 'red'
                                : 'gold'
                          }
                        >
                          {t(
                            `pages.production.detail.activation.${approval.activation_status}`,
                            approval.activation_status,
                          )}
                        </Tag>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>

                <Card title={t('pages.production.detail.qaChecks')}>
                  {qaChecks.length === 0 ? (
                    <Empty
                      description={t('pages.production.detail.qaChecksEmpty')}
                    />
                  ) : (
                    <Table
                      size="small"
                      rowKey={(row, idx) => `${row.check ?? 'check'}-${idx}`}
                      dataSource={qaChecks}
                      pagination={false}
                      columns={[
                        {
                          title: t('pages.production.detail.qaCheckType'),
                          dataIndex: 'check',
                          width: 160,
                        },
                        {
                          title: t('pages.production.detail.qaCheckStatus'),
                          dataIndex: 'status',
                          width: 100,
                          render: (v: string) => (
                            <Tag color={v === 'passed' ? 'green' : 'red'}>
                              {v ?? '—'}
                            </Tag>
                          ),
                        },
                        {
                          title: t('pages.production.detail.qaCheckDetail'),
                          dataIndex: 'detail',
                        },
                      ]}
                    />
                  )}
                </Card>

                <Card title={t('pages.production.detail.approvers')}>
                  <Space wrap>
                    {(data.approver_roles ?? []).map((r) => (
                      <Tag key={`role-${r.id}`}>{r.name}</Tag>
                    ))}
                    {(data.approver_users ?? []).map((u) => (
                      <Tag key={`user-${u.id}`} color="blue">
                        {u.name}
                        {u.email && u.email !== u.name ? `（${u.email}）` : ''}
                      </Tag>
                    ))}
                    {(data.approver_roles ?? []).length === 0 &&
                      (data.approver_users ?? []).length === 0 && (
                        <span className="text-gray-400">—</span>
                      )}
                  </Space>
                </Card>
              </Space>
            ),
          },
          {
            key: 'decisions',
            label: t('pages.production.detail.tabDecisions'),
            children: (
              <Card>
                <Table<DecisionRecord>
                  rowKey={(row, idx) =>
                    `${row.decided_by}-${row.decided_at}-${idx}`
                  }
                  dataSource={decisions}
                  columns={decisionColumns}
                  pagination={false}
                  locale={{
                    emptyText: t('pages.production.detail.decisionsEmpty'),
                  }}
                />
              </Card>
            ),
          },
        ]}
      />

      <ApprovalDecisionDrawer
        open={decisionDrawerOpen}
        pending={decisionMutation.isPending}
        expectedVersion={approval.version}
        onClose={() => setDecisionDrawerOpen(false)}
        onSubmit={(v) => decisionMutation.mutate(v)}
      />

      <Modal
        title={t('pages.production.detail.cancelTitle')}
        open={cancelModalOpen}
        okText={t('common.actions.confirm')}
        cancelText={t('common.actions.cancel')}
        okButtonProps={{ danger: true, loading: cancelMutation.isPending }}
        confirmLoading={cancelMutation.isPending}
        onOk={() =>
          cancelMutation.mutate(cancelReason.trim() || 'cancelled by requester')
        }
        onCancel={() => setCancelModalOpen(false)}
        destroyOnHidden
      >
        <div className="py-2">
          <div className="mb-2">
            {t('pages.production.detail.cancelReasonLabel')}
          </div>
          <Input.TextArea
            rows={4}
            maxLength={2000}
            showCount
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={t('pages.production.detail.cancelReasonRequired')}
          />
        </div>
      </Modal>
    </PageContainer>
  )
}

export default ProductionDetail
