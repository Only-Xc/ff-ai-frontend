import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { App, Button, Space, Statistic, Table, Tag } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  approveException,
  getExceptions,
  rejectException,
  revokeException,
  type GrcException,
  type ExceptionStatus,
} from '@/api/grc'
import { useAuthStore } from '@/store/useAuth'

const STATUS_COLORS: Record<string, string> = {
  requested: 'blue',
  active: 'green',
  rejected: 'red',
  revoked: 'orange',
  expired: 'default',
}

export function ExceptionManagement() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const orgId = useAuthStore((state) => state.organizationIds[0])

  const [statusFilter] = useState<ExceptionStatus | undefined>()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['grc', 'exceptions', statusFilter],
    queryFn: () =>
      getExceptions({
        status: statusFilter,
        organization_id: orgId ?? undefined,
        skip: 0,
        limit: 50,
      }),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveException(id),
    onSuccess: () => {
      message.success(t('pages.grc.exceptions.exceptionApproved'))
      queryClient.invalidateQueries({ queryKey: ['grc', 'exceptions'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectException(id, reason),
    onSuccess: () => {
      message.success(t('pages.grc.exceptions.exceptionRejected'))
      queryClient.invalidateQueries({ queryKey: ['grc', 'exceptions'] })
    },
  })

  const revokeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      revokeException(id, reason),
    onSuccess: () => {
      message.success(t('pages.grc.exceptions.exceptionRevoked'))
      queryClient.invalidateQueries({ queryKey: ['grc', 'exceptions'] })
    },
  })

  const columns = [
    {
      title: t('pages.grc.exceptions.exceptionNo'),
      dataIndex: 'exception_no',
      key: 'no',
      width: 160,
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
      render: (s: string) => {
        const label = t(
          `pages.grc.exceptions.status${s.charAt(0).toUpperCase() + s.slice(1)}`,
          s,
        )
        return <Tag color={STATUS_COLORS[s] ?? 'default'}>{label}</Tag>
      },
    },
    {
      title: t('pages.grc.exceptions.expiresAt'),
      key: 'expires',
      width: 180,
      render: (r: GrcException) =>
        dayjs(r.expires_at).format('YYYY-MM-DD HH:mm'),
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
      width: 80,
    },
    {
      title: t('pages.grc.common.actions'),
      key: 'actions',
      width: 200,
      render: (_: unknown, r: GrcException) => (
        <Space>
          {r.status === 'requested' && (
            <>
              <Button
                size="small"
                type="primary"
                onClick={() => approveMutation.mutate(r.id)}
              >
                {t('pages.grc.exceptions.approve')}
              </Button>
              <Button
                size="small"
                danger
                onClick={() =>
                  rejectMutation.mutate({ id: r.id, reason: t('pages.grc.exceptions.statusRejected') })
                }
              >
                {t('pages.grc.exceptions.reject')}
              </Button>
            </>
          )}
          {r.status === 'active' && (
            <Button
              size="small"
              danger
              onClick={() =>
                revokeMutation.mutate({ id: r.id, reason: t('pages.grc.exceptions.statusRevoked') })
              }
            >
              {t('pages.grc.exceptions.revoke')}
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const stats = useMemo(() => {
    const all = data?.data ?? []
    return {
      total: all.length,
      active: all.filter((e) => e.status === 'active').length,
      requested: all.filter((e) => e.status === 'requested').length,
      expired: all.filter((e) => e.status === 'expired').length,
      revoked: all.filter((e) => e.status === 'revoked').length,
    }
  }, [data])

  return (
    <PageContainer>
      <PageHeader
        title={t('routes.grc.exceptions.title')}
        subtitle={t('routes.grc.exceptions.subtitle')}
      >
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          {t('pages.grc.common.refresh')}
        </Button>
      </PageHeader>

      <Space style={{ marginBottom: 16 }}>
        <Statistic title={t("pages.grc.exceptions.statTotal")} value={stats.total} />
        <Statistic
          title={t("pages.grc.exceptions.statActive")}
          value={stats.active}
          valueStyle={{ color: '#389e0d' }}
        />
        <Statistic
          title={t("pages.grc.exceptions.statRequested")}
          value={stats.requested}
          valueStyle={{ color: '#1890ff' }}
        />
        <Statistic
          title={t("pages.grc.exceptions.statRevoked")}
          value={stats.revoked}
          valueStyle={{ color: '#faad14' }}
        />
        <Statistic
          title={t("pages.grc.exceptions.statExpired")}
          value={stats.expired}
          valueStyle={{ color: '#8c8c8c' }}
        />
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        pagination={{ total: data?.count ?? 0, pageSize: 20 }}
      />
    </PageContainer>
  )
}

export default ExceptionManagement
