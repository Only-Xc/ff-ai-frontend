import {
  BarChartOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  SearchOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Pagination,
  Select,
  Space,
  Table,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  tenantBilling_balance,
  tenantBilling_records,
  type BillingResourceType,
  type TenantBillingRecord,
} from '@/api/billing'
import { PageContainer } from '@/components/Container'
import { PageHeader } from '@/components/Header'
import { TableScrollYWrapper } from '@/components/TableScrollYWrapper'
import { usePaginationParams } from '@/hooks/usePaginationParams'

import { BillingMetricCard } from './components/BillingMetricCard'
import { ResourceTypeTag } from './components/ResourceTypeTag'
import {
  formatAmount,
  formatBillingDateTime,
  formatCurrency,
} from './utils/billingFormat'
import {
  type BillingFilters,
  type BillingFilterValues,
  normalizeFilters,
} from './utils/filters'

const { RangePicker } = DatePicker

const billingResourceTypeOptions: {
  label: string
  value: BillingResourceType
}[] = [
  { label: '大模型推理 Token', value: 'compute_token' },
  { label: '存储空间', value: 'storage_gb' },
  { label: '网络出口流量', value: 'network_egress_gb' },
  { label: '计算核时', value: 'compute_hour' },
]

const mainMetricAccents = {
  balance: 'var(--admin-primary)',
  cost: 'var(--blue)',
}

const resourceMetricAccents = [
  'var(--admin-primary)',
  'var(--blue)',
  'var(--green)',
  'var(--orange)',
]

function formatNullableText(value: string | null | undefined): string {
  const content = value?.trim()

  if (content) return content

  return '-'
}

function getAgentDisplay(record: TenantBillingRecord) {
  if (record.agent_name) return record.agent_name
  if (record.agent_id) return record.agent_id

  return '租户级消费'
}

export function BillingCenter() {
  const [form] = Form.useForm<BillingFilterValues>()
  const [filters, setFilters] = useState<BillingFilters>({})
  const pagination = usePaginationParams()

  const balanceQuery = useQuery({
    queryKey: ['tenant-billing-balance'],
    queryFn: tenantBilling_balance,
  })

  const recordsQuery = useQuery({
    queryKey: [
      'tenant-billing-records',
      filters,
      pagination.query.skip,
      pagination.query.limit,
    ],
    queryFn: () =>
      tenantBilling_records({
        ...filters,
        ...pagination.query,
      }),
  })

  const columns = useMemo<TableProps<TenantBillingRecord>['columns']>(
    () => [
      {
        title: '资源类型',
        dataIndex: 'resource_type',
        width: 170,
        render: (_, record) => <ResourceTypeTag type={record.resource_type} />,
      },
      {
        title: '消费数量',
        dataIndex: 'amount',
        width: 150,
        render: (_, record) => formatAmount(record.amount, record.unit),
      },
      {
        title: '折算费用',
        dataIndex: 'cost',
        width: 130,
        render: (value: number) => (
          <Typography.Text strong>{formatCurrency(value)}</Typography.Text>
        ),
      },
      {
        title: '智能体',
        dataIndex: 'agent_name',
        width: 260,
        ellipsis: true,
        render: (_, record) => (
          <Space orientation="vertical" size={2}>
            <Typography.Text strong>{getAgentDisplay(record)}</Typography.Text>
            {record.agent_id ? (
              <Typography.Text copyable type="secondary">
                {record.agent_id}
              </Typography.Text>
            ) : null}
          </Space>
        ),
      },
      {
        title: '工单',
        dataIndex: 'task_id',
        width: 190,
        render: (value: string | null) => (
          <Typography.Text copyable={Boolean(value)} type="secondary">
            {formatNullableText(value)}
          </Typography.Text>
        ),
      },
      {
        title: '描述',
        dataIndex: 'description',
        ellipsis: true,
        render: (value: string | null) => formatNullableText(value),
      },
      {
        title: '消费时间',
        dataIndex: 'created_at',
        width: 180,
        render: (value: string) => formatBillingDateTime(value),
      },
    ],
    [],
  )

  const balance = balanceQuery.data
  const totalCost = recordsQuery.data?.total_cost

  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <PageHeader
        subtitle="查看资源余额、分项额度、消费总额和消费明细。"
        title="账单中心"
      >
        <span className="inline-flex min-h-7 w-fit items-center gap-1.5 whitespace-nowrap rounded-full border border-[color-mix(in_srgb,var(--border)_74%,transparent)] bg-[color-mix(in_srgb,var(--panel)_78%,transparent)] px-2.5 py-1 text-xs leading-tight text-(--muted) shadow-[0_1px_0_rgb(15_23_42/0.03)] backdrop-blur-md">
          <ClockCircleOutlined className="text-[12px]" />
          余额更新时间：{formatBillingDateTime(balance?.updated_at)}
        </span>
      </PageHeader>

      <div className="mb-3 grid grid-cols-6 gap-3 max-[1280px]:grid-cols-3 max-[768px]:grid-cols-2 max-[640px]:grid-cols-1">
        <BillingMetricCard
          accent={mainMetricAccents.balance}
          caption="可用额度"
          icon={<WalletOutlined />}
          loading={balanceQuery.isLoading}
          title="租户总余额"
          value={formatCurrency(balance?.balance)}
        />
        <BillingMetricCard
          accent={mainMetricAccents.cost}
          caption="筛选口径"
          icon={<BarChartOutlined />}
          loading={recordsQuery.isLoading}
          title="当前筛选消费"
          value={formatCurrency(totalCost)}
        />
        <BillingMetricCard
          accent={resourceMetricAccents[0]}
          icon={<CreditCardOutlined />}
          loading={balanceQuery.isLoading}
          title="大模型推理 Token"
          value={formatCurrency(balance?.balance_by_type.compute_token)}
        />
        <BillingMetricCard
          accent={resourceMetricAccents[1]}
          icon={<CreditCardOutlined />}
          loading={balanceQuery.isLoading}
          title="存储空间"
          value={formatCurrency(balance?.balance_by_type.storage_gb)}
        />
        <BillingMetricCard
          accent={resourceMetricAccents[2]}
          icon={<CreditCardOutlined />}
          loading={balanceQuery.isLoading}
          title="网络出口流量"
          value={formatCurrency(balance?.balance_by_type.network_egress_gb)}
        />
        <BillingMetricCard
          accent={resourceMetricAccents[3]}
          icon={<CreditCardOutlined />}
          loading={balanceQuery.isLoading}
          title="计算核时"
          value={formatCurrency(balance?.balance_by_type.compute_hour)}
        />
      </div>

      <PageContainer className="flex min-h-0 flex-1 flex-col overflow-hidden shadow-[0_1px_0_rgb(15_23_42/0.03)]">
        <div className="shrink-0 pt-5">
          {balanceQuery.isError ? (
            <Alert
              showIcon
              className="mx-5 mb-4"
              action={
                <Button
                  size="small"
                  onClick={() => void balanceQuery.refetch()}
                >
                  重试
                </Button>
              }
              title="租户余额加载失败"
              type="error"
            />
          ) : null}

          <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4 px-5">
            <Form
              form={form}
              layout="inline"
              className="flex-1"
              onFinish={(values) => {
                setFilters(normalizeFilters(values))
                pagination.reset()
              }}
            >
              <Form.Item name="resource_type">
                <Select<BillingResourceType>
                  allowClear
                  className="w-46"
                  options={billingResourceTypeOptions}
                  placeholder="全部资源类型"
                />
              </Form.Item>
              <Form.Item name="agent_id">
                <Input
                  allowClear
                  className="w-56"
                  placeholder="智能体应用 ID"
                />
              </Form.Item>
              <Form.Item name="date_range">
                <RangePicker className="w-72" />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button
                    onClick={() => {
                      form.resetFields()
                      setFilters({})
                      pagination.reset()
                    }}
                  >
                    重置
                  </Button>
                  <Button
                    htmlType="submit"
                    icon={<SearchOutlined />}
                    type="primary"
                  >
                    查询
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>

          {recordsQuery.isError ? (
            <Alert
              showIcon
              className="mx-5 mb-4"
              action={
                <Button
                  size="small"
                  onClick={() => void recordsQuery.refetch()}
                >
                  重试
                </Button>
              }
              title="消费明细加载失败"
              type="error"
            />
          ) : null}
        </div>

        <TableScrollYWrapper
          className="min-h-0 flex-1 border-t border-t-(--ant-color-border-secondary)"
          refreshKey={`${recordsQuery.data?.data.length ?? 0}:${recordsQuery.isLoading}`}
        >
          <Table<TenantBillingRecord>
            columns={columns}
            dataSource={recordsQuery.data?.data ?? []}
            loading={recordsQuery.isLoading}
            pagination={false}
            rowKey="record_id"
            scroll={{ x: 1300 }}
          />
        </TableScrollYWrapper>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-t-(--ant-color-border-secondary) px-5 py-3">
          <Typography.Text className="text-(--muted)!">
            共 {recordsQuery.data?.count ?? 0} 条
          </Typography.Text>
          <Pagination
            {...pagination.props}
            total={recordsQuery.data?.count ?? 0}
          />
        </div>
      </PageContainer>
    </div>
  )
}

export default BillingCenter
