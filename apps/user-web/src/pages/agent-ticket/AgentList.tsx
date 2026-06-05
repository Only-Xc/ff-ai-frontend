import {
  EyeOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Form,
  Pagination,
  Space,
  Table,
  Tooltip,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'

import {
  tenantAgentKeys,
  tenantAgents_list,
  type AgentStatusFilter,
  type TenantAgent,
} from '@/api/agent-ticket'
import {
  tenantApps_add,
  tenantApps_delete,
  type TenantAppQuery,
} from '@/api/tenant-apps'
import { DictSelect } from '@ff-ai-frontend/dictionaries'
import { TableScrollYWrapper } from '@/components/TableScrollYWrapper'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { useMenuStore } from '@/store/useMenu'

import { AgentStatusTag } from './components/status'
import { formatDateTime } from './utils/format'
import { globalMessage } from '@/utils/message'

interface AgentFilterValues {
  status?: AgentStatusFilter
}

export function AgentList() {
  const navigate = useNavigate()
  const [form] = Form.useForm<AgentFilterValues>()
  const [status, setStatus] = useState<AgentStatusFilter>()
  const pagination = usePaginationParams()
  const retryMenu = useMenuStore((state) => state.retryMenu)
  const listParams = {
    status: status ?? '',
    ...pagination.query,
  }

  const { data, isError, isFetching, refetch } = useQuery({
    queryKey: tenantAgentKeys.list(listParams),
    queryFn: () => tenantAgents_list(listParams),
    placeholderData: keepPreviousData,
  })

  const collectMutation = useMutation({
    mutationFn: (data: TenantAppQuery) => tenantApps_add(data),
    onSuccess: (_) => {
      globalMessage.success('收藏成功')
      void refetch()
      void retryMenu()
    },
  })

  const cancelCollectMutation = useMutation({
    mutationFn: (id: string) => tenantApps_delete(id),
    onSuccess: (_) => {
      globalMessage.success('取消收藏成功')
      void refetch()
      void retryMenu()
    },
  })

  const collectToggle = useCallback((record: TenantAgent) => {
    if (record.is_favorited) {
      cancelCollectMutation.mutate(record.agent_id)
    } else {
      collectMutation.mutate({
        title: record.name,
        type: 'app',
        order: 0,
        agent_id: record.agent_id,
        icon_url: '',
      })
    }
  }, [cancelCollectMutation, collectMutation])

  const columns = useMemo<TableProps<TenantAgent>['columns']>(
    () => [
      {
        title: '应用名称',
        dataIndex: 'name',
        ellipsis: true,
        render: (value: string, record) => (
          <Space orientation="vertical" size={2}>
            {record.endpoint_url ? (
              <Tooltip placement="top" title="点击预览">
                <Typography.Link
                  href={record.endpoint_url}
                  target="_blank"
                  strong
                >
                  {value}
                </Typography.Link>
              </Tooltip>
            ) : (
              <Typography.Text strong>{value}</Typography.Text>
            )}
            <Typography.Text copyable type="secondary">
              {record.agent_id}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: '运行状态',
        dataIndex: 'status',
        width: 100,
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
        width: 240,
        render: (_, record) => (
          <Space size={4}>
            <Button
              icon={<EyeOutlined />}
              type="link"
              onClick={() =>
                void navigate(`/agent-ticket/agents/${record.agent_id}`)
              }
            >
              详情
            </Button>
            <Button
              icon={record.is_favorited ? <StarFilled /> : <StarOutlined />}
              type="link"
              onClick={() => collectToggle(record)}
            >
              {record.is_favorited ? '取消收藏' : '收藏'}
            </Button>
          </Space>
        ),
      },
    ],
    [collectToggle, navigate],
  )

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4 px-5">
        <Form className="flex-1" form={form} layout="inline">
          <Form.Item name="status">
            <DictSelect<AgentStatusFilter>
              allowClear
              className="w-35!"
              placeholder="全部状态"
              type="agent_status"
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
          title="智能体列表加载失败"
          type="error"
        />
      ) : null}

      <TableScrollYWrapper
        className="min-h-0 flex-1 border-t border-t-(--ant-color-border-secondary)"
        refreshKey={`${data?.data.length ?? 0}:${isFetching}`}
      >
        <Table<TenantAgent>
          columns={columns}
          dataSource={data?.data ?? []}
          loading={isFetching}
          pagination={false}
          rowKey="agent_id"
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
