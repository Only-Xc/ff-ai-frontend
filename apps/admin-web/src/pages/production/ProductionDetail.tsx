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
  Typography,
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

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

interface AccessRoleSnapshot {
  id: string
  code?: string
  name?: string
}

function readAccessRoles(value: unknown): AccessRoleSnapshot[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const role = item as Record<string, unknown>
    const id = readOptionalString(role.id)
    if (!id) return []
    return [
      {
        id,
        code: readOptionalString(role.code),
        name: readOptionalString(role.name),
      },
    ]
  })
}

function formatBytes(value: unknown): string {
  const bytes = readNumber(value)
  if (bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GiB`
}

function MetadataText({ value }: { value: unknown }) {
  const text = readOptionalString(value)
  return text ? (
    <Typography.Text copyable={{ text }} ellipsis={{ tooltip: text }}>
      {text}
    </Typography.Text>
  ) : (
    <>—</>
  )
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
  const artifact = data.artifact_snapshot ?? {}
  const runtime = data.runtime_snapshot ?? {}
  const accessScope = readOptionalString(artifact.access_scope)
  const accessRoles = readAccessRoles(artifact.roles)
  const accessRoleIds = readStringArray(artifact.role_ids)
  const hasArtifact = Object.keys(artifact).length > 0
  const hasRuntime = Object.keys(runtime).length > 0
  const hasAccessPolicy = accessScope === 'tenant' || accessScope === 'roles'

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
                      v{approval.deployment_version}
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

                {approval.target_type === 'workflow' && (
                  <Card title={t('pages.production.detail.accessPolicy')}>
                    {hasAccessPolicy ? (
                      <Descriptions column={2} bordered size="small">
                        <Descriptions.Item
                          label={t('pages.production.detail.accessScope')}
                        >
                          <Tag
                            color={accessScope === 'roles' ? 'blue' : 'green'}
                          >
                            {t(
                              accessScope === 'roles'
                                ? 'pages.production.detail.accessScopeRoles'
                                : 'pages.production.detail.accessScopeTenant',
                            )}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.allowedRoles')}
                        >
                          {accessScope === 'tenant' ? (
                            '—'
                          ) : accessRoles.length > 0 ? (
                            <Space direction="vertical" size={2}>
                              {accessRoles.map((role) => (
                                <Typography.Text
                                  key={role.id}
                                  copyable={{ text: role.id }}
                                >
                                  {role.name ?? role.code ?? role.id}
                                  {role.name && role.code
                                    ? ` (${role.code})`
                                    : ''}
                                </Typography.Text>
                              ))}
                            </Space>
                          ) : accessRoleIds.length > 0 ? (
                            <Space direction="vertical" size={2}>
                              {accessRoleIds.map((roleId) => (
                                <Typography.Text
                                  key={roleId}
                                  copyable={{ text: roleId }}
                                >
                                  {roleId}
                                </Typography.Text>
                              ))}
                            </Space>
                          ) : (
                            '—'
                          )}
                        </Descriptions.Item>
                      </Descriptions>
                    ) : (
                      <Empty
                        description={t(
                          'pages.production.detail.accessPolicyLegacy',
                        )}
                      />
                    )}
                  </Card>
                )}

                {approval.target_type === 'workflow' && (
                  <Card title={t('pages.production.detail.artifactMetadata')}>
                    {hasArtifact ? (
                      <Descriptions column={2} bordered size="small">
                        <Descriptions.Item
                          label={t('pages.production.detail.imageName')}
                          span={2}
                        >
                          <MetadataText value={artifact.image_name} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.ociDigest')}
                          span={2}
                        >
                          <MetadataText value={artifact.oci_digest} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.artifactLocation')}
                          span={2}
                        >
                          <MetadataText
                            value={
                              readOptionalString(artifact.artifact_bucket) &&
                              readOptionalString(artifact.artifact_prefix)
                                ? `s3://${readOptionalString(artifact.artifact_bucket)}/${readOptionalString(artifact.artifact_prefix)}`
                                : undefined
                            }
                          />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.imageObjectKey')}
                          span={2}
                        >
                          <MetadataText value={artifact.image_object_key} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.artifactSha256')}
                          span={2}
                        >
                          <MetadataText value={artifact.artifact_sha256} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.artifactSize')}
                        >
                          {formatBytes(artifact.artifact_size_bytes)}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.buildFinishedAt')}
                        >
                          {readOptionalString(artifact.build_finished_at)
                            ? dayjs(
                                readOptionalString(artifact.build_finished_at),
                              ).format('YYYY-MM-DD HH:mm:ss')
                            : '—'}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.runtimeBaseImage')}
                          span={2}
                        >
                          <MetadataText value={artifact.runtime_base_image} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.runtimeBaseDigest')}
                          span={2}
                        >
                          <MetadataText value={artifact.runtime_base_digest} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.releaseId')}
                        >
                          <MetadataText value={artifact.release_id} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.flowId')}
                        >
                          <MetadataText value={artifact.flow_id} />
                        </Descriptions.Item>
                      </Descriptions>
                    ) : (
                      <Empty
                        description={t(
                          'pages.production.detail.artifactMetadataEmpty',
                        )}
                      />
                    )}
                  </Card>
                )}

                {approval.target_type === 'workflow' && (
                  <Card title={t('pages.production.detail.runtimeMetadata')}>
                    {hasRuntime ? (
                      <Descriptions column={2} bordered size="small">
                        <Descriptions.Item
                          label={t('pages.production.detail.runtimeStatus')}
                        >
                          <Tag
                            color={
                              runtime.healthy === true ? 'green' : 'orange'
                            }
                          >
                            {readOptionalString(runtime.status) ?? '—'}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.containerPort')}
                        >
                          {readNumber(runtime.container_port) || '—'}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.containerName')}
                        >
                          <MetadataText value={runtime.container_name} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.containerId')}
                        >
                          <MetadataText value={runtime.container_id} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.networkName')}
                        >
                          <MetadataText value={runtime.network_name} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.networkAlias')}
                        >
                          <MetadataText value={runtime.network_alias} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.runtimeImage')}
                          span={2}
                        >
                          <MetadataText value={runtime.image} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t(
                            'pages.production.detail.runtimeImageDigest',
                          )}
                          span={2}
                        >
                          <MetadataText value={runtime.image_digest} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.upstreamUrl')}
                          span={2}
                        >
                          <MetadataText value={runtime.upstream_url} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.healthUrl')}
                          span={2}
                        >
                          <MetadataText value={runtime.health_url} />
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t('pages.production.detail.predictionPath')}
                          span={2}
                        >
                          <MetadataText value={runtime.prediction_path} />
                        </Descriptions.Item>
                      </Descriptions>
                    ) : (
                      <Empty
                        description={t(
                          'pages.production.detail.runtimeMetadataEmpty',
                        )}
                      />
                    )}
                  </Card>
                )}
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
