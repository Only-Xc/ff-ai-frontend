import { ReloadOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Form,
  Pagination,
  Select,
  Space,
  Table,
  Typography,
  Tooltip
} from 'antd'
import type { TableProps } from 'antd'
import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import {
  tenantTaskKeys,
  tenantTasks_list,
  type TaskStatusFilter,
  type TenantTask,
} from '@/api/agent-ticket'
import { TableScrollYWrapper } from '@/components/TableScrollYWrapper'
import { usePaginationParams } from '@/hooks/usePaginationParams'

import { TaskStatusTag, TaskTypeTag } from './components/status'
import { taskStatusFilterOptions } from './constants'
import { formatDateTime } from './utils/format'

type TicketFilterValues = {
  status?: TaskStatusFilter
}

export function TicketList() {
  const [form] = Form.useForm<TicketFilterValues>()
  const [status, setStatus] = useState<TaskStatusFilter>()
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
  const columns = useMemo<TableProps<TenantTask>['columns']>(
    () => [
      {
        title: '需求标题',
        dataIndex: 'title',
        ellipsis: true,
        render: (value: string, record) => (
          <Space orientation="vertical" size={2}>
            <span className="text-(--text) font-medium">
              {record.web_url ? <Tooltip placement="top" title="点击预览"><Typography.Link href={record.web_url} target="_blank">{value}</Typography.Link></Tooltip> : value}
            </span>
            <Typography.Text copyable className="text-(--muted)! text-[13px]!">
              {record.task_id}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: '工单状态',
        dataIndex: 'status',
        width: 130,
        render: (_, record) => <TaskStatusTag status={record.status} />,
      },
      {
        title: '任务类型',
        dataIndex: 'task_type',
        width: 150,
        render: (_, record) => <TaskTypeTag type={record.task_type} />,
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        width: 180,
        render: (value: string) => (
          <span className="text-(--text) text-[14px]">
            {formatDateTime(value)}
          </span>
        ),
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        width: 180,
        render: (value: string) => (
          <span className="text-(--text) text-[14px]">
            {formatDateTime(value)}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4 px-5">
        <Form className="flex-1" form={form} layout="inline">
          <Form.Item name="status">
            <Select<TaskStatusFilter>
              allowClear
              className="w-35!"
              options={taskStatusFilterOptions}
              placeholder="全部状态"
              onChange={(value) => {
                setStatus(value)
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
                重置
              </Button>
              <Button
                icon={<ReloadOutlined />}
                loading={isFetching}
                type="primary"
                onClick={() => void refetch()}
              >
                刷新
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
              重试
            </Button>
          }
          title="工单列表加载失败"
          type="error"
        />
      ) : null}

      <TableScrollYWrapper
        className="min-h-0 flex-1 border-t border-t-(--ant-color-border-secondary)"
        refreshKey={`${data?.data.length ?? 0}:${isFetching}`}
      >
        <Table<TenantTask>
          columns={columns}
          dataSource={data?.data ?? []}
          loading={isFetching}
          pagination={false}
          rowKey="task_id"
        />
      </TableScrollYWrapper>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-t-(--ant-color-border-secondary)">
        <Typography.Text className="text-(--muted)!">
          共 {data?.count ?? 0} 条
        </Typography.Text>
        <Pagination {...pagination.props} total={data?.count ?? 0} />
      </div>
    </div>
  )
}

export default TicketList
