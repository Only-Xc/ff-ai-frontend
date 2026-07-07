import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Pagination, Select, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import type { TFunction } from 'i18next'

import {
  tenantAttempts_list,
  tenantExamKeys,
  tenantExams_list,
  type TenantAttemptHistoryQuery,
  type TenantAttemptStatus,
  type TenantAttemptSummary,
} from '@/api/exam'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { PageContainer, PageHeader, TableScrollYWrapper } from '@ff-ai-frontend/components'

import { useExamStyles } from './styles'

interface AttemptHistoryFilterValues {
  paper_id?: string
  status?: TenantAttemptStatus
}

export function AttemptHistory() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { styles } = useExamStyles()
  const pagination = usePaginationParams()
  const [form] = Form.useForm<AttemptHistoryFilterValues>()
  const [filters, setFilters] = useState<AttemptHistoryFilterValues>({})

  const listParams = useMemo<TenantAttemptHistoryQuery>(
    () => ({ ...filters, ...pagination.query }),
    [filters, pagination.query],
  )
  const listQuery = useQuery({
    queryKey: tenantExamKeys.myAttempts(listParams),
    queryFn: () => tenantAttempts_list(listParams),
    placeholderData: keepPreviousData,
  })

  const papersQuery = useQuery({
    queryKey: tenantExamKeys.list({ skip: 0, limit: 100, sort: 'created_at:desc' }),
    queryFn: () => tenantExams_list({ skip: 0, limit: 100, sort: 'created_at:desc' }),
  })

  const columns: TableProps<TenantAttemptSummary>['columns'] = [
    {
      title: t('pages.exam.columns.paper'),
      dataIndex: 'paper_title',
      ellipsis: true,
      render: (value: string, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text copyable type="secondary">{record.id}</Typography.Text>
        </Space>
      ),
    },
    {
      title: t('pages.exam.columns.status'),
      dataIndex: 'status',
      width: 120,
      render: (value: TenantAttemptSummary['status']) => (
        <Tag color={value === 'submitted' ? 'green' : 'blue'}>
          {formatAttemptStatus(value, t)}
        </Tag>
      ),
    },
    {
      title: t('pages.exam.columns.score'),
      dataIndex: 'score',
      width: 130,
      render: (_, record) => (record.score === null || record.total_score === null ? '-' : `${record.score} / ${record.total_score}`),
    },
    {
      title: t('pages.exam.columns.pass'),
      dataIndex: 'is_passed',
      width: 100,
      render: (value: boolean | null) => (value === null ? '-' : <Tag color={value ? 'green' : 'red'}>{formatPassStatus(value, t)}</Tag>),
    },
    {
      title: t('pages.exam.columns.submittedAt'),
      dataIndex: 'submitted_at',
      width: 180,
      render: (value: string | null) => formatDateTime(value, t),
    },
    {
      title: t('pages.exam.columns.startedAt'),
      dataIndex: 'started_at',
      width: 180,
      render: (value: string | null) => formatDateTime(value, t),
    },
    {
      title: t('pages.exam.columns.action'),
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => void navigate(record.status === 'submitted' ? `/attempts/${record.id}/result` : `/attempts/${record.id}`)}>
          {record.status === 'submitted'
            ? t('pages.exam.actions.viewResult')
            : t('pages.exam.actions.continue')}
        </Button>
      ),
    },
  ]

  return (
    <div className={styles.pageShell}>
      <PageHeader
        title={t('pages.exam.history.title')}
        subtitle={t('pages.exam.history.subtitle')}
      >
        <Button icon={<ReloadOutlined />} loading={listQuery.isFetching} onClick={() => void listQuery.refetch()}>
          {t('common.actions.refresh')}
        </Button>
      </PageHeader>
      <PageContainer className={styles.workSurface}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-b-(--ant-color-border-secondary) px-5 py-3">
          <Form<AttemptHistoryFilterValues>
            className="flex-1"
            form={form}
            layout="inline"
            onFinish={(values) => {
              setFilters(values)
              pagination.reset()
            }}
          >
            <Form.Item name="paper_id">
              <Select
                allowClear
                className="w-72"
                loading={papersQuery.isFetching}
                options={(papersQuery.data?.data ?? []).map((paper) => ({
                  label: paper.title,
                  value: paper.id,
                }))}
                placeholder={t('pages.exam.filters.paper')}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item name="status">
              <Select
                allowClear
                className="w-36"
                options={[
                  { label: t('pages.exam.status.inProgress'), value: 'in_progress' },
                  { label: t('pages.exam.status.submitted'), value: 'submitted' },
                ]}
                placeholder={t('pages.exam.filters.status')}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button htmlType="submit" type="primary">
                  {t('pages.exam.actions.search')}
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields()
                    setFilters({})
                    pagination.reset()
                  }}
                >
                  {t('common.actions.reset')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
        {listQuery.isError ? (
          <Alert showIcon className="m-5" message={t('pages.exam.errors.historyLoadFailed')} type="error" />
        ) : null}
        <TableScrollYWrapper className="min-h-0 flex-1">
          <Table<TenantAttemptSummary>
            columns={columns}
            dataSource={listQuery.data?.data ?? []}
            loading={listQuery.isFetching}
            pagination={false}
            rowKey="id"
            scroll={{ x: 1100 }}
          />
        </TableScrollYWrapper>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-t-(--ant-color-border-secondary) px-5 py-3">
          <Typography.Text type="secondary">
            {t('common.labels.totalCount', { total: listQuery.data?.count ?? 0 })}
          </Typography.Text>
          <Pagination {...pagination.props} total={listQuery.data?.count ?? 0} />
        </div>
      </PageContainer>
    </div>
  )
}

function formatDateTime(value: string | null, t: TFunction) {
  if (!value) return '-'

  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format(t('common.dateTime.longFormat'))
}

function formatAttemptStatus(status: TenantAttemptStatus, t: TFunction) {
  return status === 'submitted'
    ? t('pages.exam.status.submitted')
    : t('pages.exam.status.inProgress')
}

function formatPassStatus(value: boolean, t: TFunction) {
  return value ? t('pages.exam.pass.passed') : t('pages.exam.pass.failed')
}

export default AttemptHistory
