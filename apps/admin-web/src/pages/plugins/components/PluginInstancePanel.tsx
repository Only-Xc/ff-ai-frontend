import { ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Empty,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

import {
  pluginKeys,
  plugins_audits,
  plugins_config,
  plugins_logs,
  plugins_operations,
  plugins_retryOperation,
  plugins_updateConfig,
  type PluginInstallation,
  type PluginManifest,
} from '@/api/plugins'

interface ConfigValues {
  values_json: string
  [key: `secret_${string}`]: string
}

export interface PluginInstancePanelProps {
  pluginId: string
  installation?: PluginInstallation
  manifest: PluginManifest
  resourceNames: string[]
}

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

export function PluginInstancePanel({
  pluginId,
  installation,
  manifest,
  resourceNames,
}: PluginInstancePanelProps) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<ConfigValues>()
  const [resourceName, setResourceName] = useState<string>()
  const installationId = installation?.id
  const configQuery = useQuery({
    queryKey: pluginKeys.config(pluginId, installationId),
    queryFn: () => plugins_config(pluginId, installationId!),
    enabled: Boolean(installationId),
  })
  const operationsQuery = useQuery({
    queryKey: pluginKeys.operations(installationId),
    queryFn: () =>
      plugins_operations({ installation_id: installationId, limit: 100 }),
    enabled: Boolean(installationId),
    refetchInterval: (query) =>
      query.state.data?.data.some((item) =>
        ['pending', 'running', 'rolling_back'].includes(item.status),
      )
        ? 3000
        : false,
  })
  const auditsQuery = useQuery({
    queryKey: pluginKeys.audits(pluginId, installationId),
    queryFn: () => plugins_audits(pluginId, installationId),
    enabled: Boolean(installationId),
  })
  const logsQuery = useQuery({
    queryKey: [
      ...pluginKeys.runtime(pluginId, installationId),
      'logs',
      resourceName,
    ],
    queryFn: () => plugins_logs(pluginId, installationId!, resourceName!, 300),
    enabled: Boolean(installationId && resourceName),
  })
  const updateConfigMutation = useMutation({
    mutationFn: async (values: ConfigValues) => {
      const parsed: unknown = JSON.parse(values.values_json || '{}')
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object')
        throw new Error('配置必须是 JSON 对象')
      const secrets = Object.fromEntries(
        manifest.secrets
          .map(
            (secret) =>
              [secret.key, values[`secret_${secret.key}`]?.trim()] as const,
          )
          .filter(([, value]) => Boolean(value)),
      )
      return plugins_updateConfig(
        pluginId,
        installationId!,
        parsed as Record<string, unknown>,
        secrets,
      )
    },
    onSuccess: async () => {
      message.success('配置已保存，密钥已按只写方式更新')
      for (const secret of manifest.secrets)
        form.setFieldValue(`secret_${secret.key}`, '')
      await queryClient.invalidateQueries({
        queryKey: pluginKeys.config(pluginId, installationId),
      })
      await queryClient.invalidateQueries({
        queryKey: pluginKeys.audits(pluginId, installationId),
      })
    },
  })
  const retryMutation = useMutation({
    mutationFn: plugins_retryOperation,
    onSuccess: async () => {
      message.success('重试作业已提交')
      await queryClient.invalidateQueries({
        queryKey: pluginKeys.operations(installationId),
      })
    },
  })

  useEffect(() => {
    if (configQuery.data)
      form.setFieldValue(
        'values_json',
        JSON.stringify(configQuery.data.values, null, 2),
      )
  }, [configQuery.data, form])
  useEffect(() => {
    if (!resourceNames.includes(resourceName ?? ''))
      setResourceName(resourceNames[0])
  }, [resourceName, resourceNames])

  if (!installation) return <Empty description="请选择安装实例" />

  return (
    <Tabs
      items={[
        {
          key: 'operations',
          label: `最近作业 (${operationsQuery.data?.count ?? 0})`,
          children: (
            <Table
              dataSource={operationsQuery.data?.data ?? []}
              loading={operationsQuery.isPending}
              pagination={false}
              rowKey="id"
              size="small"
              columns={[
                {
                  title: 'Trace ID',
                  dataIndex: 'trace_id',
                  render: (value: string) => (
                    <Typography.Text copyable code>
                      {value}
                    </Typography.Text>
                  ),
                },
                { title: '操作', dataIndex: 'operation' },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: (value: string) => (
                    <Tag
                      color={
                        value === 'succeeded'
                          ? 'green'
                          : value === 'failed'
                            ? 'red'
                            : 'processing'
                      }
                    >
                      {value}
                    </Tag>
                  ),
                },
                {
                  title: '步骤',
                  dataIndex: 'current_step',
                  render: (value: string | null) => value ?? '-',
                },
                {
                  title: '错误',
                  render: (_: unknown, item) =>
                    displayUnknown(item.last_error?.message),
                },
                {
                  title: '操作',
                  render: (_: unknown, item) => (
                    <Button
                      disabled={
                        !['failed', 'rolled_back', 'cancelled'].includes(
                          item.status,
                        )
                      }
                      loading={retryMutation.isPending}
                      size="small"
                      onClick={() => retryMutation.mutate(item.id)}
                    >
                      重试
                    </Button>
                  ),
                },
              ]}
            />
          ),
        },
        {
          key: 'config',
          label: '配置与密钥',
          children: (
            <Form
              form={form}
              layout="vertical"
              onFinish={(values) => updateConfigMutation.mutate(values)}
            >
              <Alert
                className="mb-4"
                showIcon
                title="密钥字段只写不读；留空表示保持现值。"
                type="info"
              />
              <Form.Item
                label="租户配置 JSON"
                name="values_json"
                rules={[{ required: true }]}
              >
                <Input.TextArea className="font-mono" rows={10} />
              </Form.Item>
              {manifest.secrets.map((secret) => (
                <Form.Item
                  extra={secret.description}
                  key={secret.key}
                  label={`${secret.key}${configQuery.data?.secret_keys.includes(secret.key) ? '（已配置）' : ''}`}
                  name={`secret_${secret.key}`}
                >
                  <Input.Password
                    autoComplete="new-password"
                    placeholder="输入新值以更新"
                  />
                </Form.Item>
              ))}
              <Button
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={updateConfigMutation.isPending}
                type="primary"
              >
                保存配置
              </Button>
            </Form>
          ),
        },
        {
          key: 'logs',
          label: '运行日志',
          children: resourceNames.length ? (
            <div className="flex flex-col gap-3">
              <Space>
                <Select
                  className="w-64"
                  options={resourceNames.map((value) => ({
                    label: value,
                    value,
                  }))}
                  value={resourceName}
                  onChange={setResourceName}
                />
                <Button
                  icon={<ReloadOutlined />}
                  loading={logsQuery.isFetching}
                  onClick={() => void logsQuery.refetch()}
                >
                  刷新日志
                </Button>
              </Space>
              {logsQuery.isError ? (
                <Alert showIcon title="日志读取失败" type="error" />
              ) : null}
              <pre className="max-h-[520px] min-h-48 overflow-auto rounded border border-(--border) bg-black p-4 text-xs text-green-300">
                {logsQuery.data?.content ?? '暂无日志'}
              </pre>
            </div>
          ) : (
            <Empty description="该实例没有可读取日志的应用资源" />
          ),
        },
        {
          key: 'audit',
          label: `审计 (${auditsQuery.data?.count ?? 0})`,
          children: (
            <Table
              dataSource={auditsQuery.data?.data ?? []}
              loading={auditsQuery.isPending}
              pagination={{ pageSize: 20 }}
              rowKey="id"
              size="small"
              columns={[
                {
                  title: '时间',
                  dataIndex: 'created_at',
                  render: (value: string) =>
                    dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
                },
                { title: '动作', dataIndex: 'action' },
                { title: '状态', dataIndex: 'status' },
                {
                  title: 'Trace ID',
                  dataIndex: 'trace_id',
                  render: (value: string | null) =>
                    value ? (
                      <Typography.Text copyable code>
                        {value}
                      </Typography.Text>
                    ) : (
                      '-'
                    ),
                },
                {
                  title: '错误码',
                  dataIndex: 'error_code',
                  render: (value: string | null) => value ?? '-',
                },
              ]}
            />
          ),
        },
      ]}
    />
  )
}
