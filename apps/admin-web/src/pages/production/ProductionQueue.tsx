import { ReloadOutlined } from '@ant-design/icons'
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

  const columns: TableProps<ProductionApproval>['columns'] = [
    {
      title: t('pages.production.queue.approvalNo'),
      dataIndex: 'approval_no',
      key: 'approval_no',
      width: 180,
      render: (v: string, row) => (
        <a onClick={() => navigate(`/production/approvals/${row.id}`)}>{v}</a>
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
    },
    {
      title: t('pages.production.queue.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (v: ProductionApprovalStatus) => (
        <Tag color={approvalStatusColor(v)}>{approvalStatusLabel(t, v)}</Tag>
      ),
    },
    {
      title: t('pages.production.queue.riskLevel'),
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 120,
      render: (v: string, row) =>
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
      title: t('pages.production.queue.qa'),
      dataIndex: 'qa_passed',
      key: 'qa_passed',
      width: 100,
      render: (v: boolean) =>
        v ? (
          <Tag color="green">{t('pages.production.queue.qaPassed')}</Tag>
        ) : (
          <Tag color="red">{t('pages.production.queue.qaFailed')}</Tag>
        ),
    },
    {
      title: t('pages.production.queue.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title={t('routes.production.approvals.title')}
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
