import { ReloadOutlined, RedoOutlined } from '@ant-design/icons'
import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Descriptions,
  Drawer,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'

import {
  pluginKeys,
  plugins_operations,
  plugins_retryOperation,
  type PluginOperation,
} from '@/api/plugins'
import { PluginCenterTabs } from './components/PluginCenterTabs'

const ACTIVE_STATUSES = new Set(['pending', 'running', 'rolling_back'])
const RETRYABLE_STATUSES = new Set(['failed', 'rolled_back', 'cancelled'])

function displayUnknown(value: unknown): string {
  if (value == null) return '-'
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
    return String(value)
  return JSON.stringify(value)
}

function statusColor(status: string) {
  if (status === 'succeeded') return 'green'
  if (RETRYABLE_STATUSES.has(status)) return 'red'
  if (ACTIVE_STATUSES.has(status)) return 'processing'
  return 'default'
}

export default function PluginOperations() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<string>()
  const [selected, setSelected] = useState<PluginOperation>()
  const operationsQuery = useQuery({
    queryKey: pluginKeys.operations(undefined, status),
    queryFn: () => plugins_operations({ status, limit: 200 }),
    refetchInterval: (query) =>
      query.state.data?.data.some((item) => ACTIVE_STATUSES.has(item.status))
        ? 3000
        : false,
  })
  const retryMutation = useMutation({
    mutationFn: (operationId: string) => plugins_retryOperation(operationId),
    onSuccess: async (operation) => {
      message.success('重试作业已提交')
      setSelected(operation)
      await queryClient.invalidateQueries({ queryKey: pluginKeys.all })
    },
  })

  const columns: TableProps<PluginOperation>['columns'] = [
    {
      title: '作业 / Trace',
      dataIndex: 'trace_id',
      key: 'trace_id',
      width: 250,
      render: (value: string, record) => (
        <Tooltip title={value}>
          <Button
            className="block h-auto! w-full overflow-hidden p-0! text-left font-mono text-xs"
            type="link"
            onClick={() => setSelected(record)}
          >
            <span className="block truncate">{value}</span>
          </Button>
        </Tooltip>
      ),
    },
    {
      title: '作业类型',
      dataIndex: 'operation',
      key: 'operation',
      ellipsis: true,
      width: 150,
      render: (value: string) => <Tooltip title={value}>{value}</Tooltip>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (value: string) => <Tag color={statusColor(value)}>{value}</Tag>,
    },
    {
      title: '当前步骤',
      dataIndex: 'current_step',
      key: 'current_step',
      ellipsis: true,
      width: 180,
      render: (value: string | null) => (
        <Tooltip title={value ?? undefined}>{value ?? '-'}</Tooltip>
      ),
    },
    {
      title: '错误码',
      dataIndex: 'last_error',
      key: 'last_error',
      ellipsis: true,
      width: 180,
      render: (value: Record<string, unknown> | null) => {
        const code = displayUnknown(value?.code)
        return <Tooltip title={code === '-' ? undefined : code}>{code}</Tooltip>
      },
    },
    {
      title: '尝试',
      dataIndex: 'attempt_count',
      key: 'attempt_count',
      width: 90,
      render: (value: number, record) => `${value}/${record.max_attempts}`,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 170,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      fixed: 'right',
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          disabled={!RETRYABLE_STATUSES.has(record.status)}
          icon={<RedoOutlined />}
          loading={retryMutation.isPending && selected?.id === record.id}
          size="small"
          onClick={() => retryMutation.mutate(record.id)}
        >
          重试
        </Button>
      ),
    },
  ]

  return (
    <PageContainer className="p-5">
      <PageHeader
        subtitle="统一查看插件安装与生命周期作业、失败步骤和重试记录。"
        title="插件作业中心"
      >
        <Space>
          <Button
            icon={<ReloadOutlined />}
            loading={operationsQuery.isFetching}
            onClick={() => void operationsQuery.refetch()}
          >
            刷新
          </Button>
        </Space>
      </PageHeader>
      <PluginCenterTabs />
      <div className="mb-4 flex items-center gap-3">
        <Select
          allowClear
          className="w-52"
          options={[
            'pending',
            'running',
            'succeeded',
            'failed',
            'rolled_back',
            'cancelled',
          ].map((value) => ({ label: value, value }))}
          placeholder="全部作业状态"
          value={status}
          onChange={setStatus}
        />
        <Typography.Text type="secondary">
          共 {operationsQuery.data?.count ?? 0} 条
        </Typography.Text>
      </div>
      {operationsQuery.isError ? (
        <Alert
          className="mb-4"
          showIcon
          title="插件作业加载失败"
          type="error"
        />
      ) : null}
      <Table
        columns={columns}
        dataSource={operationsQuery.data?.data ?? []}
        loading={operationsQuery.isPending}
        pagination={{ pageSize: 20 }}
        rowKey="id"
        scroll={{ x: 1250 }}
        size="small"
        tableLayout="fixed"
      />
      <Drawer
        open={Boolean(selected)}
        title="作业详情"
        size={680}
        onClose={() => setSelected(undefined)}
      >
        {selected ? (
          <div className="flex flex-col gap-5">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Trace ID">
                <Typography.Text copyable code>
                  {selected.trace_id}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="安装实例">
                <Typography.Text copyable>
                  {selected.installation_id}
                </Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="操作 / 状态">
                {selected.operation}{' '}
                <Tag color={statusColor(selected.status)}>
                  {selected.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前步骤">
                {selected.current_step ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label="开始 / 完成">
                {selected.started_at
                  ? dayjs(selected.started_at).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}{' '}
                /{' '}
                {selected.completed_at
                  ? dayjs(selected.completed_at).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
            <Steps
              current={Math.max(
                0,
                selected.steps.findIndex(
                  (step) => step.name === selected.current_step,
                ),
              )}
              orientation="vertical"
              items={selected.steps.map((step) => ({
                title: displayUnknown(step.name),
                description: step.error
                  ? JSON.stringify(step.error)
                  : undefined,
                status:
                  step.status === 'succeeded'
                    ? 'finish'
                    : step.status === 'failed'
                      ? 'error'
                      : step.status === 'running'
                        ? 'process'
                        : 'wait',
              }))}
              size="small"
            />
            {selected.last_error ? (
              <Alert
                description={
                  <pre className="m-0 whitespace-pre-wrap text-xs">
                    {JSON.stringify(selected.last_error, null, 2)}
                  </pre>
                }
                message="最近错误"
                showIcon
                type="error"
              />
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </PageContainer>
  )
}
