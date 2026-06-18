import {
  BarChartOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  ReloadOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Pagination,
  Space,
  Table,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  PageContainer,
  PageHeader,
  TableScrollYWrapper,
} from '@ff-ai-frontend/components'
import { numberUtils } from '@ff-ai-frontend/utils'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

import {
  tenantBillingKeys,
  tenantBilling_balance,
  tenantBilling_records,
  type BillingResourceType,
  type TenantBillingQuery,
  type TenantBillingRecord,
} from '@/api/billing-center'
import { DictSelect } from '@ff-ai-frontend/dictionaries'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { i18n } from '@/i18n'

import { BillingMetricCard } from './components/BillingMetricCard'
import { BillingRecordDetailDrawer } from './components/BillingRecordDetailDrawer'
import { ResourceTypeTag } from './components/ResourceTypeTag'
import { type BillingFilterValues, normalizeFilters } from './utils/filters'

const { RangePicker } = DatePicker

const mainMetricAccents = {
  balance: 'var(--admin-primary)',
  cost: 'var(--blue)',
  compute_token: 'var(--admin-primary)',
  storage_gb: 'var(--blue)',
  network_egress_gb: 'var(--green)',
  compute_hour: 'var(--orange)',
}

function getAgentDisplay(record: TenantBillingRecord, t: TFunction) {
  if (record.agent_name) return record.agent_name
  if (record.agent_id) return record.agent_id

  return t('pages.billing.tenantLevelCost')
}

function formatBillingDateTime(value: string | null | undefined): string {
  if (!value) return '-'

  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format(i18n.t('common.dateTime.longFormat'))
}

export function BillingCenter() {
  const { t } = useTranslation()
  const [form] = Form.useForm<BillingFilterValues>()
  const pagination = usePaginationParams()
  const filterValues = Form.useWatch([], form)
  const [selectedRecordId, setSelectedRecordId] = useState<string>()

  const paginationReset = pagination.reset

  useEffect(() => {
    paginationReset()
  }, [filterValues, paginationReset])

  const listParams = useMemo<TenantBillingQuery>(
    () => ({
      ...normalizeFilters(filterValues ?? {}),
      ...pagination.query,
    }),
    [filterValues, pagination.query],
  )

  const balanceQuery = useQuery({
    queryKey: tenantBillingKeys.balance(),
    queryFn: tenantBilling_balance,
  })

  const {
    data: recordsData,
    isError: recordsIsError,
    isFetching: recordsIsFetching,
    refetch: refetchRecords,
  } = useQuery({
    queryKey: tenantBillingKeys.list(listParams),
    queryFn: () => tenantBilling_records(listParams),
    placeholderData: keepPreviousData,
  })
  const isRefreshing = balanceQuery.isFetching || recordsIsFetching

  const handleRefresh = () => {
    void Promise.all([balanceQuery.refetch(), refetchRecords()])
  }

  const columns = useMemo<TableProps<TenantBillingRecord>['columns']>(
    () => [
      {
        title: t('pages.billing.columns.task'),
        dataIndex: 'task_id',
        width: 260,
        render: (value: string | null) => (
          <Typography.Text copyable={Boolean(value)}>{value}</Typography.Text>
        ),
      },
      {
        title: t('pages.billing.columns.resourceType'),
        dataIndex: 'resource_type',
        width: 140,
        render: (_, record) => <ResourceTypeTag type={record.resource_type} />,
      },
      {
        title: t('pages.billing.columns.amount'),
        dataIndex: 'amount',
        width: 150,
        render: (_, record) =>
          numberUtils.formatNumber(record.amount, {
            decimals: 4,
            suffix: ' ' + record.unit,
          }),
      },
      {
        title: t('pages.billing.columns.cost'),
        dataIndex: 'cost',
        width: 130,
        render: (value: number) => (
          <Typography.Text strong>
            {numberUtils.formatCurrency(value, {
              decimals: 2,
            })}
          </Typography.Text>
        ),
      },
      {
        title: t('pages.billing.columns.agent'),
        dataIndex: 'agent_name',
        width: 260,
        ellipsis: true,
        render: (_, record) => (
          <Space orientation="vertical" size={2}>
            <Typography.Text strong>
              {getAgentDisplay(record, t)}
            </Typography.Text>
            {record.agent_id ? (
              <Typography.Text copyable type="secondary">
                {record.agent_id}
              </Typography.Text>
            ) : null}
          </Space>
        ),
      },
      {
        title: t('pages.billing.columns.description'),
        dataIndex: 'description',
        render: (value: string | null) => value,
      },
      {
        title: t('pages.billing.columns.createdAt'),
        dataIndex: 'created_at',
        width: 180,
        render: (value: string) => formatBillingDateTime(value),
      },
      {
        title: t('pages.billing.columns.action'),
        key: 'action',
        fixed: 'right',
        width: 96,
        render: (_, record) => (
          <Button
            type="link"
            onClick={() => setSelectedRecordId(record.record_id)}
          >
            {t('common.actions.detail')}
          </Button>
        ),
      },
    ],
    [t],
  )

  const balance = balanceQuery.data
  const totalCost = recordsData?.total_cost

  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <PageHeader
        subtitle={t('pages.billing.subtitle')}
        title={t('pages.billing.title')}
      >
        <span className="inline-flex min-h-7 w-fit items-center gap-1.5 whitespace-nowrap rounded-full border border-[color-mix(in_srgb,var(--border)_74%,transparent)] bg-[color-mix(in_srgb,var(--panel)_78%,transparent)] px-2.5 py-1 text-xs leading-tight text-(--muted) shadow-[0_1px_0_rgb(15_23_42/0.03)] backdrop-blur-md">
          <ClockCircleOutlined className="text-[12px]" />
          {t('pages.billing.balanceUpdatedAt', {
            time: formatBillingDateTime(balance?.updated_at),
          })}
        </span>
      </PageHeader>

      <div className="mb-3 grid grid-cols-6 gap-3 max-[1280px]:grid-cols-3 max-[768px]:grid-cols-2 max-[640px]:grid-cols-1">
        <BillingMetricCard
          accent={mainMetricAccents.balance}
          caption={t('pages.billing.metrics.availableBalance')}
          icon={<WalletOutlined />}
          loading={balanceQuery.isFetching}
          prefix="¥"
          title={t('pages.billing.metrics.tenantBalance')}
          value={numberUtils.formatNumber(balance?.balance, {
            decimals: 2,
          })}
        />
        <BillingMetricCard
          accent={mainMetricAccents.cost}
          caption={t('pages.billing.metrics.filterScope')}
          icon={<BarChartOutlined />}
          loading={recordsIsFetching}
          prefix="¥"
          title={t('pages.billing.metrics.currentCost')}
          value={numberUtils.formatNumber(totalCost, {
            decimals: 2,
          })}
        />
        <BillingMetricCard
          accent={mainMetricAccents.compute_token}
          icon={<CreditCardOutlined />}
          loading={balanceQuery.isFetching}
          prefix="¥"
          title={t('pages.billing.metrics.tokenBalance')}
          value={numberUtils.formatNumber(
            balance?.balance_by_type.compute_token,
            {
              decimals: 2,
            },
          )}
        />
        <BillingMetricCard
          accent={mainMetricAccents.storage_gb}
          icon={<CreditCardOutlined />}
          loading={balanceQuery.isFetching}
          prefix="¥"
          suffix={t('pages.billing.units.perMonth')}
          title={t('pages.billing.metrics.storageBalance')}
          value={numberUtils.formatNumber(balance?.balance_by_type.storage_gb, {
            decimals: 2,
          })}
        />
        <BillingMetricCard
          accent={mainMetricAccents.network_egress_gb}
          icon={<CreditCardOutlined />}
          loading={balanceQuery.isFetching}
          prefix="¥"
          suffix="/ GB"
          title={t('pages.billing.metrics.networkBalance')}
          value={numberUtils.formatNumber(
            balance?.balance_by_type.network_egress_gb,
            {
              decimals: 2,
            },
          )}
        />
        <BillingMetricCard
          accent={mainMetricAccents.compute_hour}
          icon={<CreditCardOutlined />}
          loading={balanceQuery.isFetching}
          suffix={t('pages.billing.units.coreHour')}
          title={t('pages.billing.metrics.computeHourBalance')}
          value={numberUtils.formatNumber(
            balance?.balance_by_type.compute_hour,
            {
              decimals: 2,
            },
          )}
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
                  {t('common.actions.retry')}
                </Button>
              }
              title={t('pages.billing.errors.balanceLoadFailed')}
              type="error"
            />
          ) : null}

          <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4 px-5">
            <Form form={form} layout="inline" className="flex-1">
              <Form.Item name="resource_type">
                <DictSelect<BillingResourceType>
                  allowClear
                  className="w-46"
                  placeholder={t('pages.billing.filters.allResourceTypes')}
                  type="billing_resource_type"
                />
              </Form.Item>
              <Form.Item name="agent_id">
                <Input
                  allowClear
                  className="w-56"
                  placeholder={t('pages.billing.filters.agentId')}
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
                      pagination.reset()
                    }}
                  >
                    {t('common.actions.reset')}
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    loading={isRefreshing}
                    type="primary"
                    onClick={handleRefresh}
                  >
                    {t('common.actions.refresh')}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>

          {recordsIsError ? (
            <Alert
              showIcon
              className="mx-5 mb-4"
              action={
                <Button size="small" onClick={() => void refetchRecords()}>
                  {t('common.actions.retry')}
                </Button>
              }
              title={t('pages.billing.errors.recordsLoadFailed')}
              type="error"
            />
          ) : null}
        </div>

        <TableScrollYWrapper
          className="min-h-0 flex-1 border-t border-t-(--ant-color-border-secondary)"
          refreshKey={`${recordsData?.data.length ?? 0}:${recordsIsFetching}`}
        >
          <Table<TenantBillingRecord>
            columns={columns}
            dataSource={recordsData?.data ?? []}
            loading={recordsIsFetching}
            pagination={false}
            rowKey="record_id"
            scroll={{ x: 1400 }}
          />
        </TableScrollYWrapper>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-t-(--ant-color-border-secondary) px-5 py-3">
          <Typography.Text className="text-(--muted)!">
            {t('common.labels.totalCount', {
              total: recordsData?.count ?? 0,
            })}
          </Typography.Text>
          <Pagination {...pagination.props} total={recordsData?.count ?? 0} />
        </div>
      </PageContainer>

      <BillingRecordDetailDrawer
        formatDateTime={formatBillingDateTime}
        open={Boolean(selectedRecordId)}
        recordId={selectedRecordId}
        onClose={() => setSelectedRecordId(undefined)}
      />
    </div>
  )
}

export default BillingCenter
