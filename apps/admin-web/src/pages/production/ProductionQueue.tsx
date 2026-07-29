import { ReloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Alert, Button, Empty, Input, Select, Space, Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'

import {
  productionApprovals_list,
  productionKeys,
  type ProductionActivationStatus,
  type ProductionApproval,
  type ProductionApprovalQuery,
  type ProductionApprovalStatus,
} from '@/api/production'
import { usePaginationParams } from '@/hooks/usePaginationParams'

import { approvalStatusColor, approvalStatusLabel } from './status'

const STATUS_OPTIONS: {
  labelKey: string
  value: ProductionApprovalStatus | ''
}[] = [
  { labelKey: 'common.filters.all', value: '' },
  { labelKey: 'pages.production.status.PENDING', value: 'PENDING' },
  { labelKey: 'pages.production.status.IN_REVIEW', value: 'IN_REVIEW' },
  { labelKey: 'pages.production.status.APPROVED', value: 'APPROVED' },
  { labelKey: 'pages.production.status.REJECTED', value: 'REJECTED' },
  { labelKey: 'pages.production.status.CANCELLED', value: 'CANCELLED' },
  {
    labelKey: 'pages.production.status.PRECHECK_BLOCKED',
    value: 'PRECHECK_BLOCKED',
  },
]

export function ProductionQueue() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { current, pageSize, setCurrent, skip, limit } = usePaginationParams()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    ProductionApprovalStatus | ''
  >('')

  const queryParams: ProductionApprovalQuery = useMemo(
    () => ({
      skip,
      limit,
      ...(statusFilter
        ? { status: statusFilter as ProductionApprovalStatus }
        : {}),
      ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
    }),
    [skip, limit, statusFilter, keyword],
  )

  const { data, isFetching, refetch } = useQuery({
    queryKey: productionKeys.list(queryParams),
    queryFn: () => productionApprovals_list(queryParams),
    placeholderData: keepPreviousData,
  })

  const items = data?.data ?? []
  const total = data?.count ?? 0

  // 当整个列表所有行的 task_id 都为空/null/未写入时,整列(包括表头)隐藏
  const hasAnyTaskId = items.some(
    (it) => it.task_id != null && it.task_id !== '',
  )

  const columns: TableProps<ProductionApproval>['columns'] = useMemo(
    () =>
      [
        {
          title: t('pages.production.queue.approvalNo'),
          dataIndex: 'approval_no',
          key: 'approval_no',
          width: 180,
          render: (v: string, row: ProductionApproval) => (
            <a onClick={() => navigate(`/production/approvals/${row.id}`)}>
              {v}
            </a>
          ),
        },
        {
          title: t('pages.production.queue.targetType'),
          dataIndex: 'target_type',
          key: 'target_type',
          width: 100,
          render: (v: string) => (
            <Tag color={v === 'workflow' ? 'purple' : 'blue'}>
              {v === 'workflow' ? 'Workflow' : 'Agent'}
            </Tag>
          ),
        },
        {
          title: t('pages.production.queue.agent'),
          dataIndex: 'agent_id',
          key: 'agent_id',
          width: 200,
        },
        {
          title: t('pages.production.queue.taskId'),
          dataIndex: 'task_id',
          key: 'task_id',
          width: 160,
          render: (v: string) => <span className="font-mono text-xs">{v}</span>,
        },
        {
          title: t('pages.production.queue.status'),
          dataIndex: 'status',
          key: 'status',
          width: 140,
          render: (v: ProductionApprovalStatus) => (
            <Tag color={approvalStatusColor(v)}>
              {approvalStatusLabel(t, v)}
            </Tag>
          ),
        },
        {
          title: t('pages.production.detail.activationStatus'),
          dataIndex: 'activation_status',
          key: 'activation_status',
          width: 120,
          render: (v: ProductionActivationStatus) => (
            <Tag
              color={v === 'ACTIVE' ? 'green' : v === 'FAILED' ? 'red' : 'gold'}
            >
              {t(`pages.production.detail.activation.${v}`, v)}
            </Tag>
          ),
        },
        {
          title: t('pages.production.queue.riskLevel'),
          dataIndex: 'risk_level',
          key: 'risk_level',
          width: 120,
          render: (v: string, row: ProductionApproval) =>
            v ? (
              <Space size={4}>
                <Tag color={row.risk_score >= 50 ? 'red' : 'gold'}>{v}</Tag>
                <span className="text-xs text-gray-500">{row.risk_score}</span>
              </Space>
            ) : (
              <span className="text-gray-400">—</span>
            ),
        },
        {
          title: t('pages.production.queue.createdAt'),
          dataIndex: 'created_at',
          key: 'created_at',
          width: 170,
          render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
        },
      ].filter((col) => {
        // task_id 列:整列级隐藏,仅当列表里没有任何一行有 task_id 时才移除
        if (col.key === 'task_id' && !hasAnyTaskId) return false
        return true
      }),
    [t, navigate, hasAnyTaskId],
  )

  return (
    <PageContainer className="min-h-full p-4">
      <PageHeader
        title={
          <Space>
            <SafetyCertificateOutlined />
            {t('routes.production.approvals.title')}
          </Space>
        }
        subtitle={t('routes.production.approvals.subtitle')}
      >
        <Space>
          <Input.Search
            allowClear
            placeholder={t('pages.production.queue.keywordPlaceholder')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 220 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS.map((item) => ({
              value: item.value,
              label:
                item.value === '' ? t('common.filters.all') : t(item.labelKey),
            }))}
            style={{ width: 180 }}
            placeholder={t('pages.production.queue.status')}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void refetch()}
            loading={isFetching}
          >
            {t('common.actions.refresh')}
          </Button>
        </Space>
      </PageHeader>
      <Alert
        className="mb-4"
        type="info"
        showIcon
        message={t('pages.production.queue.intro')}
      />
      {items.length === 0 && !isFetching ? (
        <Empty description={t('pages.production.queue.empty')} />
      ) : (
        <Table<ProductionApproval>
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={items}
          pagination={{
            current,
            pageSize,
            total,
            onChange: setCurrent,
          }}
        />
      )}
    </PageContainer>
  )
}

export default ProductionQueue
