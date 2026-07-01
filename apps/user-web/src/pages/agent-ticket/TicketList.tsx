import { ReloadOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Form,
  Pagination,
  Space,
  Table,
  Typography,
  Tooltip,
} from 'antd'
import type { TableProps } from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import {
  tenantTaskKeys,
  tenantTasks_list,
  type Task,
  type TaskStatusFilter,
  type TenantTaskQuery,
} from '@/api/agent-ticket'
import { DictSelect } from '@ff-ai-frontend/dictionaries'
import { TableScrollYWrapper } from '@ff-ai-frontend/components'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { useAuthStore } from '@/store/useAuth'
import { buildAuthenticatedPreviewUrl } from '@/utils/previewUrl'

import { TaskStatusTag, TaskTypeTag } from './components/status'
import { formatDateTime } from './utils/format'

type TicketFilterValues = Pick<TenantTaskQuery, 'status'>

export function TicketList() {
  const { t } = useTranslation()
  const [form] = Form.useForm<TicketFilterValues>()
  const [status, setStatus] = useState<TaskStatusFilter>()
  const accessToken = useAuthStore((state) => state.accessToken)
  const pagination = usePaginationParams()

  const listParams = {
    status: status ?? '',
    ...pagination.query,
  }

  const { data, isError, isFetching, refetch } = useQuery({
    queryKey: tenantTaskKeys.list(listParams),
    queryFn: () => tenantTasks_list(listParams),
    placeholderData: keepPreviousData,
  })
  const columns = useMemo<TableProps<Task>['columns']>(
    () => [
      {
        title: t('pages.agentTicket.columns.requirementTitle'),
        dataIndex: 'title',
        ellipsis: true,
        render: (value: string, record) => (
          <Space orientation="vertical" size={2}>
            <span className="text-(--text) font-medium">
              {buildAuthenticatedPreviewUrl(record.web_url, accessToken) ? (
                <Tooltip placement="top" title={t('pages.agentTicket.preview')}>
                  <Typography.Link
                    href={buildAuthenticatedPreviewUrl(record.web_url, accessToken)}
                    target="_blank"
                    strong
                  >
                    {value}
                  </Typography.Link>
                </Tooltip>
              ) : (
                <Typography.Text strong>{value}</Typography.Text>
              )}
            </span>
            <Typography.Text copyable className="text-(--muted)! text-[13px]!">
              {record.task_id}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t('pages.agentTicket.columns.ticketStatus'),
        dataIndex: 'status',
        width: 130,
        render: (_, record) => <TaskStatusTag status={record.status} />,
      },
      {
        title: t('pages.agentTicket.columns.taskType'),
        dataIndex: 'task_type',
        width: 150,
        render: (_, record) => <TaskTypeTag type={record.task_type} />,
      },
      {
        title: t('pages.agentTicket.columns.createdAt'),
        dataIndex: 'created_at',
        width: 180,
        render: (value: string) => (
          <span className="text-(--text) text-[14px]">
            {formatDateTime(value)}
          </span>
        ),
      },
      {
        title: t('pages.agentTicket.columns.updatedAt'),
        dataIndex: 'updated_at',
        width: 180,
        render: (value: string) => (
          <span className="text-(--text) text-[14px]">
            {formatDateTime(value)}
          </span>
        ),
      },
    ],
    [accessToken, t],
  )

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4 px-5">
        <Form className="flex-1" form={form} layout="inline">
          <Form.Item name="status">
            <DictSelect<TaskStatusFilter | 'all'>
              allowClear
              className="w-35!"
              excludeValues={['all']}
              placeholder={t('pages.agentTicket.filters.allStatus')}
              type="task_status_filter"
              onChange={(value) => {
                setStatus(value === 'all' ? undefined : value)
                pagination.reset()
              }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                onClick={() => {
                  form.resetFields()
                  setStatus(undefined)
                  pagination.reset()
                }}
              >
                {t('common.actions.reset')}
              </Button>
              <Button
                icon={<ReloadOutlined />}
                loading={isFetching}
                type="primary"
                onClick={() => void refetch()}
              >
                {t('common.actions.refresh')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      {isError ? (
        <Alert
          showIcon
          className="mb-4 shrink-0"
          action={
            <Button size="small" onClick={() => void refetch()}>
              {t('common.actions.retry')}
            </Button>
          }
          title={t('pages.agentTicket.ticketListLoadFailed')}
          type="error"
        />
      ) : null}

      <TableScrollYWrapper
        className="min-h-0 flex-1 border-t border-t-(--ant-color-border-secondary)"
        refreshKey={`${data?.data.length ?? 0}:${isFetching}`}
      >
        <Table<Task>
          columns={columns}
          dataSource={data?.data ?? []}
          loading={isFetching}
          pagination={false}
          rowKey="task_id"
        />
      </TableScrollYWrapper>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-t-(--ant-color-border-secondary)">
        <Typography.Text className="text-(--muted)!">
          {t('common.labels.totalCount', { total: data?.count ?? 0 })}
        </Typography.Text>
        <Pagination {...pagination.props} total={data?.count ?? 0} />
      </div>
    </div>
  )
}

export default TicketList
