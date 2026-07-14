import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Segmented, Select, Space, Table, Tag } from 'antd'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { grcReviewCases_list } from '@/api/grc'
import { useAuthStore } from '@/store/useAuth'
import type { GrcReviewCase, GrcReviewCaseListQuery, ReviewStatus } from '@ff-ai-frontend/api'

dayjs.extend(relativeTime)

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  OPEN: 'blue',
  IN_REVIEW: 'processing',
  APPROVED: 'green',
  APPROVED_WITH_CONDITIONS: 'cyan',
  REJECTED: 'red',
  REMEDIATION_REQUIRED: 'orange',
  EXCEPTION_REQUESTED: 'purple',
  EXCEPTION_ACTIVE: 'geekblue',
  EXPIRED: 'default',
  CANCELLED: 'default',
}

const STATUS_OPTIONS: ReviewStatus[] = [
  'DRAFT',
  'OPEN',
  'IN_REVIEW',
  'APPROVED',
  'APPROVED_WITH_CONDITIONS',
  'REJECTED',
  'REMEDIATION_REQUIRED',
  'EXCEPTION_REQUESTED',
  'EXCEPTION_ACTIVE',
  'EXPIRED',
  'CANCELLED',
]

export function ReviewQueue() {
  const { t } = useTranslation()
  const orgId = useAuthStore(state => state.organizationIds[0])

  const [tab, setTab] = useState<'myTodo' | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | undefined>()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['grc', 'reviews', tab, statusFilter, keyword, page, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params: GrcReviewCaseListQuery = {
        status: statusFilter,
        organization_id: orgId ?? undefined,
        keyword: keyword || undefined,
        skip: (page - 1) * pageSize,
        limit: pageSize,
      }
      // For "myTodo", filter by current user as assignee
      if (tab === 'myTodo') {
        const uid = useAuthStore.getState().user?.id
        if (uid) params.assignee_id = uid
      }
      const res = await grcReviewCases_list(params)
      return res
    },
  })

  const getStatusTag = (status: string) => {
    const key = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    const label = t(`pages.grc.reviews.status${key}`, status)
    return <Tag color={STATUS_COLORS[status] ?? 'default'}>{label}</Tag>
  }

  const columns = [
    {
      title: t('pages.grc.reviews.tableCaseNo'),
      dataIndex: 'case_no',
      key: 'case_no',
      width: 160,
      render: (v: string, r: GrcReviewCase) => (
        <a href={`/grc/reviews/${r.id}`}>{v}</a>
      ),
    },
    {
      title: t('pages.grc.reviews.title'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('pages.grc.reviews.riskLevel'),
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 100,
      render: (level: string) => {
        const color =
          level === 'CRITICAL'
            ? 'red'
            : level === 'HIGH'
              ? 'orange'
              : level === 'MEDIUM'
                ? 'blue'
                : 'green'
        return (
          <Tag color={color}>{t(`pages.grc.riskLevel.${level.toLowerCase()}`)}</Tag>
        )
      },
    },
    {
      title: t('pages.grc.reviews.riskScore'),
      dataIndex: 'risk_score',
      key: 'risk_score',
      width: 100,
      sorter: (a: GrcReviewCase, b: GrcReviewCase) => a.risk_score - b.risk_score,
    },
    {
      title: t('pages.grc.reviews.status'),
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (s: string) => getStatusTag(s),
    },
    {
      title: t('pages.grc.reviews.sla'),
      key: 'sla',
      width: 140,
      render: (r: GrcReviewCase) => {
        if (!r.due_at) return '-'
        const isOverdue =
          new Date(r.due_at) < new Date() &&
          !['APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED'].includes(r.status)
        return (
          <Tag color={isOverdue ? 'red' : 'default'}>
            {dayjs(r.due_at).fromNow()}
          </Tag>
        )
      },
    },
    {
      title: t('pages.grc.reviews.opened'),
      dataIndex: 'opened_at',
      key: 'opened',
      width: 120,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title={t('routes.grc.reviews.title')}
        subtitle={t('routes.grc.reviews.subtitle')}
      />
      <Space wrap style={{ marginBottom: 16 }}>
        <Segmented
          value={tab}
          onChange={value => {
            setTab(value as 'myTodo' | 'all')
            setPage(1)
          }}
          options={[
            { label: t('pages.grc.reviews.all'), value: 'all' },
            { label: t('pages.grc.reviews.myTodo'), value: 'myTodo' },
          ]}
        />
        <Input.Search
          allowClear
          placeholder={t('pages.grc.reviews.searchPlaceholder')}
          style={{ width: 240 }}
          onSearch={value => {
            setKeyword(value.trim())
            setPage(1)
          }}
        />
        <Select
          allowClear
          placeholder={t('pages.grc.reviews.filterStatus')}
          style={{ width: 160 }}
          value={statusFilter}
          onChange={value => {
            setStatusFilter(value)
            setPage(1)
          }}
          options={STATUS_OPTIONS.map(s => ({ value: s, label: getStatusTag(s) }))}
        />
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          {t('pages.grc.common.refresh')}
        </Button>
      </Space>
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
          showTotal: total => t('pages.grc.common.totalItems', { count: total }),
          onChange: (nextPage, nextSize) => {
            setPage(nextPage)
            setPageSize(nextSize)
          },
        }}
        onRow={(r) => ({
          onClick: () => {
            window.location.href = `/grc/reviews/${r.id}`
          },
        })}
      />
    </PageContainer>
  )
}

export default ReviewQueue
