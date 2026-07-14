import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Input,
  Modal,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  approveException,
  getExceptions,
  grcReports_exceptions,
  rejectException,
  revokeException,
  type GrcException,
  type ExceptionStatus,
} from '@/api/grc'
import { adminUsers_list } from '@/api/rbac'
import { useAuthStore } from '@/store/useAuth'

const STATUS_COLORS: Record<string, string> = {
  requested: 'blue',
  active: 'green',
  rejected: 'red',
  revoked: 'orange',
  expired: 'default',
}

const STATUS_OPTIONS: ExceptionStatus[] = [
  'requested',
  'active',
  'rejected',
  'revoked',
  'expired',
]

type ReasonAction = { type: 'reject' | 'revoke'; id: string }

export function ExceptionManagement() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const orgId = useAuthStore((state) => state.organizationIds[0])

  const [statusFilter, setStatusFilter] = useState<ExceptionStatus | undefined>()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [reasonAction, setReasonAction] = useState<ReasonAction | null>(null)
  const [reason, setReason] = useState('')
  const [detailRow, setDetailRow] = useState<GrcException | null>(null)

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['grc', 'exceptions', statusFilter, keyword, page, pageSize, orgId],
    placeholderData: keepPreviousData,
    queryFn: () =>
      getExceptions({
        status: statusFilter,
        organization_id: orgId ?? undefined,
        keyword: keyword || undefined,
        skip: (page - 1) * pageSize,
        limit: pageSize,
      }),
  })

  // Stats come from the dedicated report endpoint so they reflect the whole
  // dataset rather than the current page.
  const { data: report } = useQuery({
    queryKey: ['grc', 'exceptions', 'report', orgId],
    queryFn: () => grcReports_exceptions(30, orgId ?? undefined),
  })

  // Cache the user directory so the detail drawer can show human-readable
  // names / emails instead of raw UUIDs for requester / approver / revoker.
  const { data: usersResp } = useQuery({
    queryKey: ['rbac', 'users', 'grc-exception-lookup'],
    queryFn: () => adminUsers_list({ skip: 0, limit: 500 }),
    staleTime: 5 * 60 * 1000,
  })
  const userMap = new Map((usersResp?.data ?? []).map((u) => [u.id, u]))
  const userLabel = (id?: string | null) => {
    if (!id) return '-'
    const u = userMap.get(id)
    if (!u) return id
    return u.full_name || u.email || id
  }

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['grc', 'exceptions'] })

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveException(id),
    onSuccess: () => {
      message.success(t('pages.grc.exceptions.exceptionApproved'))
      invalidate()
    },
    onError: (err: Error) => message.error(err.message),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectException(id, reason),
    onSuccess: () => {
      message.success(t('pages.grc.exceptions.exceptionRejected'))
      invalidate()
    },
    onError: (err: Error) => message.error(err.message),
  })

  const revokeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      revokeException(id, reason),
    onSuccess: () => {
      message.success(t('pages.grc.exceptions.exceptionRevoked'))
      invalidate()
    },
    onError: (err: Error) => message.error(err.message),
  })

  const openReason = (type: 'reject' | 'revoke', id: string) => {
    setReason('')
    setReasonAction({ type, id })
  }

  const submitReason = () => {
    if (!reasonAction) return
    if (!reason.trim()) {
      message.error(t('pages.grc.exceptions.reasonRequired'))
      return
    }
    const payload = { id: reasonAction.id, reason: reason.trim() }
    if (reasonAction.type === 'reject') rejectMutation.mutate(payload)
    else revokeMutation.mutate(payload)
    setReasonAction(null)
  }

  const getStatusTag = (s: string) => {
    const label = t(
      `pages.grc.exceptions.status${s.charAt(0).toUpperCase() + s.slice(1)}`,
      s,
    )
    return <Tag color={STATUS_COLORS[s] ?? 'default'}>{label}</Tag>
  }

  const columns = [
    {
      title: t('pages.grc.exceptions.exceptionNo'),
      dataIndex: 'exception_no',
      key: 'no',
      width: 180,
    },
    {
      title: t('pages.grc.exceptions.justification'),
      dataIndex: 'justification',
      key: 'justification',
      ellipsis: true,
    },
    {
      title: t('pages.grc.exceptions.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => getStatusTag(s),
    },
    {
      title: t('pages.grc.exceptions.expiresAt'),
      key: 'expires',
      width: 170,
      render: (r: GrcException) =>
        r.expires_at ? dayjs(r.expires_at).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: t('pages.grc.exceptions.used'),
      dataIndex: 'used_count',
      key: 'used',
      width: 80,
    },
    {
      title: t('pages.grc.exceptions.maxUses'),
      dataIndex: 'max_uses',
      key: 'max',
      width: 90,
      render: (v: number | null) => v ?? '-',
    },
    {
      title: t('pages.grc.common.actions'),
      key: 'actions',
      width: 240,
      render: (_: unknown, r: GrcException) => (
        <Space>
          <Button size="small" onClick={() => setDetailRow(r)}>
            {t('pages.grc.common.detail')}
          </Button>
          {r.status === 'requested' && (
            <>
              <Button
                size="small"
                type="primary"
                loading={approveMutation.isPending}
                onClick={() => approveMutation.mutate(r.id)}
              >
                {t('pages.grc.exceptions.approve')}
              </Button>
              <Button
                size="small"
                danger
                onClick={() => openReason('reject', r.id)}
              >
                {t('pages.grc.exceptions.reject')}
              </Button>
            </>
          )}
          {r.status === 'active' && (
            <Button
              size="small"
              danger
              onClick={() => openReason('revoke', r.id)}
            >
              {t('pages.grc.exceptions.revoke')}
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title={t('routes.grc.exceptions.title')}
        subtitle={t('routes.grc.exceptions.subtitle')}
      />

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder={t('pages.grc.exceptions.searchPlaceholder')}
          style={{ width: 260 }}
          onSearch={(value) => {
            setKeyword(value.trim())
            setPage(1)
          }}
        />
        <Select
          allowClear
          placeholder={t('pages.grc.exceptions.filterStatus')}
          style={{ width: 160 }}
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: getStatusTag(s) }))}
        />
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          {t('pages.grc.common.refresh')}
        </Button>
      </Space>

      <div style={{ marginBottom: 16 }}>
        <Space size="large">
          <Statistic
            title={t('pages.grc.exceptions.statTotal')}
            value={report?.total ?? 0}
          />
          <Statistic
            title={t('pages.grc.exceptions.statActive')}
            value={report?.active_count ?? 0}
            styles={{ content: { color: '#389e0d' } }}
          />
          <Statistic
            title={t('pages.grc.exceptions.statRequested')}
            value={report?.by_status?.requested ?? 0}
            styles={{ content: { color: '#1890ff' } }}
          />
          <Statistic
            title={t('pages.grc.exceptions.statRevoked')}
            value={report?.by_status?.revoked ?? 0}
            styles={{ content: { color: '#faad14' } }}
          />
          <Statistic
            title={t('pages.grc.exceptions.statExpired')}
            value={report?.expired_count ?? 0}
            styles={{ content: { color: '#8c8c8c' } }}
          />
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isFetching}
        pagination={{
          current: page,
          pageSize,
          total: data?.count ?? 0,
          showSizeChanger: true,
          showTotal: (total) => t('pages.grc.common.totalItems', { count: total }),
          onChange: (nextPage, nextSize) => {
            setPage(nextPage)
            setPageSize(nextSize)
          },
        }}
      />

      <Modal
        open={reasonAction !== null}
        title={t(
          reasonAction?.type === 'reject'
            ? 'pages.grc.exceptions.rejectTitle'
            : 'pages.grc.exceptions.revokeTitle',
        )}
        onOk={submitReason}
        onCancel={() => setReasonAction(null)}
        okText={t('pages.grc.common.submit')}
        cancelText={t('pages.grc.common.cancel')}
        confirmLoading={rejectMutation.isPending || revokeMutation.isPending}
      >
        <Input.TextArea
          rows={4}
          value={reason}
          placeholder={t('pages.grc.exceptions.reasonPlaceholder')}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>

      <Drawer
        open={detailRow !== null}
        title={detailRow?.exception_no}
        size="large"
        onClose={() => setDetailRow(null)}
      >
        {detailRow && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('pages.grc.exceptions.exceptionNo')}>
              {detailRow.exception_no}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.grc.exceptions.status')}>
              {getStatusTag(detailRow.status)}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.grc.exceptions.justification')}>
              {detailRow.justification || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.grc.exceptions.scope')}>
              <Typography.Text
                code
                copyable={Object.keys(detailRow.scope ?? {}).length > 0}
              >
                {JSON.stringify(detailRow.scope ?? {}, null, 2)}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.grc.exceptions.compensatingControls')}>
              <Typography.Text
                code
                copyable={Object.keys(detailRow.compensating_controls ?? {}).length > 0}
              >
                {JSON.stringify(detailRow.compensating_controls ?? {}, null, 2)}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.grc.exceptions.startsAt')}>
              {detailRow.starts_at
                ? dayjs(detailRow.starts_at).format('YYYY-MM-DD HH:mm')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.grc.exceptions.expiresAt')}>
              {detailRow.expires_at
                ? dayjs(detailRow.expires_at).format('YYYY-MM-DD HH:mm')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.grc.exceptions.usedCount')}>
              {detailRow.used_count} / {detailRow.max_uses ?? '∞'}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.grc.exceptions.reviewCase')}>
              <Typography.Link href={`/grc/reviews/${detailRow.review_case_id}`}>
                {detailRow.review_case_id}
              </Typography.Link>
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.grc.exceptions.ruleId')}>
              <Typography.Text copyable>{detailRow.rule_id}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.grc.exceptions.ruleVersionId')}>
              <Typography.Text copyable>{detailRow.rule_version_id}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.grc.exceptions.requestedBy')}>
              {userLabel(detailRow.requested_by)}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.grc.exceptions.approvedBy')}>
              {userLabel(detailRow.approved_by)}
            </Descriptions.Item>
            {detailRow.revoked_by && (
              <Descriptions.Item label={t('pages.grc.exceptions.revokedBy')}>
                {userLabel(detailRow.revoked_by)}
              </Descriptions.Item>
            )}
            {detailRow.revoked_reason && (
              <Descriptions.Item label={t('pages.grc.exceptions.revokedReason')}>
                {detailRow.revoked_reason}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('pages.grc.exceptions.createdAt')}>
              {dayjs(detailRow.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.grc.exceptions.updatedAt')}>
              {dayjs(detailRow.updated_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  )
}

export default ExceptionManagement
