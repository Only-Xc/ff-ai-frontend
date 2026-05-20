import { ApiOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Form,
  Pagination,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import {
  tenantAgents_list,
  type AgentStatus,
  type TenantAgent,
} from '@/api/agentTicket'
import { TableScrollYWrapper } from '@/components/TableScrollYWrapper'
import { usePaginationParams } from '@/hooks/usePaginationParams'

import { formatDateTime, formatNullableText } from './format'
import { agentStatusFilterOptions } from './filterOptions'
import { AgentStatusTag } from './status'

interface AgentFilterValues {
  status?: AgentStatus
}

function openEndpointUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function AgentList() {
  const navigate = useNavigate()
  const [form] = Form.useForm<AgentFilterValues>()
  const [status, setStatus] = useState<AgentStatus>()
  const pagination = usePaginationParams()

  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: [
      'tenant-agents',
      status ?? 'all',
      pagination.query.skip,
      pagination.query.limit,
    ],
    queryFn: () =>
      tenantAgents_list({
        status,
        ...pagination.query,
      }),
  })

  const columns = useMemo<TableProps<TenantAgent>['columns']>(
    () => [
      {
        title: '应用名称',
        dataIndex: 'name',
        width: 300,
        ellipsis: true,
        render: (value: string, record) => (
          <Space direction="vertical" size={2}>
            <Typography.Text strong>
              {formatNullableText(value)}
            </Typography.Text>
            <Typography.Text copyable type="secondary">
              {record.agent_id}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: '运行状态',
        dataIndex: 'status',
        width: 120,
        render: (_, record) => <AgentStatusTag status={record.status} />,
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        width: 180,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '最近一次调用时间',
        dataIndex: 'last_invoked_at',
        width: 180,
        render: (value: string | null) => formatDateTime(value),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 220,
        render: (_, record) => (
          <Space size={4}>
            <Button
              icon={<EyeOutlined />}
              type="link"
              onClick={() =>
                void navigate(`/agent-ticket/agents/${record.agent_id}`)
              }
            >
              查看应用
            </Button>
            <Tooltip title={record.endpoint_url ? undefined : '无可用地址'}>
              <span>
                <Button
                  disabled={!record.endpoint_url}
                  icon={<ApiOutlined />}
                  type="link"
                  onClick={() => {
                    if (record.endpoint_url) {
                      openEndpointUrl(record.endpoint_url)
                    }
                  }}
                >
                  API 文档
                </Button>
              </span>
            </Tooltip>
          </Space>
        ),
      },
    ],
    [navigate],
  )

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4 px-5">
        <Form
          form={form}
          layout="inline"
          className="flex-1"
          onFinish={(values) => {
            setStatus(values.status)
            pagination.reset()
          }}
        >
          <Form.Item name="status">
            <Select<AgentStatus>
              allowClear
              className="w-40"
              options={agentStatusFilterOptions}
              placeholder="全部状态"
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
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
              >
                查询
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
          title="智能体列表加载失败"
          type="error"
        />
      ) : null}

      <TableScrollYWrapper
        className="min-h-0 flex-1 border-t border-t-(--ant-color-border-secondary)"
        refreshKey={`${data?.data.length ?? 0}:${isLoading}`}
      >
        <Table<TenantAgent>
          columns={columns}
          dataSource={data?.data ?? []}
          loading={isLoading}
          pagination={false}
          rowKey="agent_id"
          scroll={{ x: 1000 }}
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

export default AgentList
