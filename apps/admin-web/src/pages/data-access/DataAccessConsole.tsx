import {
  ApiOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  EditOutlined,
  EyeOutlined,
  FileProtectOutlined,
  FilterOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  Checkbox,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'

import {
  initialDataSources,
  initialEndpoints,
  initialPolicies,
  initialUsageRecords,
  p0Capabilities,
} from './mock'
import type {
  AccessEndpointRecord,
  DataSourceFormValues,
  DataSourceRecord,
  DataSourceStatus,
  EndpointFormValues,
  EndpointStatus,
  FieldPolicyRecord,
  HealthStatus,
  PolicyFormValues,
  PolicyStatus,
  UsageRecord,
  UsageTargetType,
  WorkspaceKey,
} from './types'

const SOURCE_TYPE_META = {
  postgresql: { label: 'PostgreSQL', color: 'blue' },
  'http-api': { label: 'HTTP API', color: 'cyan' },
} as const

const SOURCE_STATUS_META: Record<
  DataSourceStatus,
  { label: string; color: string }
> = {
  active: { label: '已启用', color: 'green' },
  draft: { label: '草稿', color: 'default' },
  degraded: { label: '异常', color: 'red' },
}

const HEALTH_META: Record<HealthStatus, { label: string; color: string }> = {
  healthy: { label: '健康', color: 'green' },
  unknown: { label: '未测试', color: 'default' },
  unhealthy: { label: '连接失败', color: 'red' },
}

const ENDPOINT_STATUS_META: Record<
  EndpointStatus,
  { label: string; color: string }
> = {
  published: { label: '已发布', color: 'green' },
  draft: { label: '草稿', color: 'gold' },
  deprecated: { label: '已废弃', color: 'default' },
}

const POLICY_STATUS_META: Record<
  PolicyStatus,
  { label: string; color: string }
> = {
  published: { label: '已发布', color: 'green' },
  draft: { label: '草稿', color: 'gold' },
}

const USAGE_TARGET_META: Record<
  UsageTargetType,
  { label: string; color: string }
> = {
  endpoint: { label: '接口', color: 'blue' },
  database: { label: '数据库', color: 'cyan' },
}

const WORKSPACE_META: Record<
  WorkspaceKey,
  { createLabel?: string; searchPlaceholder: string }
> = {
  sources: {
    createLabel: '新建数据源',
    searchPlaceholder: '搜索数据源名称、地址或负责人',
  },
  endpoints: {
    createLabel: '新建端点',
    searchPlaceholder: '搜索端点名称、编码或数据源',
  },
  policies: {
    createLabel: '新建策略',
    searchPlaceholder: '搜索策略、端点或主体',
  },
  usage: {
    searchPlaceholder: '搜索使用人、账号或访问对象',
  },
}

interface MetricTileProps {
  icon: ReactNode
  label: string
  value: number
  note: string
  tone: 'blue' | 'green' | 'orange' | 'purple'
}

function MetricTile({ icon, label, note, tone, value }: MetricTileProps) {
  const toneClasses = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    orange: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    purple: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  }

  return (
    <div className="flex min-h-22 items-center gap-3 rounded-lg border border-(--border) bg-(--panel) px-4 py-3">
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-lg ${toneClasses[tone]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-(--text-strong)">
            {value}
          </span>
          <span className="truncate text-sm font-medium text-(--text-strong)">
            {label}
          </span>
        </div>
        <div className="mt-0.5 truncate text-xs text-(--muted)">{note}</div>
      </div>
    </div>
  )
}

interface FoundationItemProps {
  icon: ReactNode
  name: string
  role: string
  status: string
  statusColor: string
}

function FoundationItem({
  icon,
  name,
  role,
  status,
  statusColor,
}: FoundationItemProps) {
  return (
    <div className="flex min-h-18 items-start gap-3 rounded-lg border border-(--border) bg-(--control-subtle-bg) px-3.5 py-3">
      <div className="mt-0.5 text-lg text-(--admin-primary)">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-(--text-strong)">{name}</span>
          <Tag className="m-0! rounded-md!" color={statusColor}>
            {status}
          </Tag>
        </div>
        <div className="mt-1 text-xs leading-5 text-(--muted)">{role}</div>
      </div>
    </div>
  )
}

export function DataAccessConsole() {
  const { message } = App.useApp()
  const [sourceForm] = Form.useForm<DataSourceFormValues>()
  const [endpointForm] = Form.useForm<EndpointFormValues>()
  const [policyForm] = Form.useForm<PolicyFormValues>()
  const [workspace, setWorkspace] = useState<WorkspaceKey>('sources')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>()
  const [sources, setSources] = useState(initialDataSources)
  const [endpoints, setEndpoints] = useState(initialEndpoints)
  const [policies, setPolicies] = useState(initialPolicies)
  const [usageRecords] = useState(initialUsageRecords)
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [endpointModalOpen, setEndpointModalOpen] = useState(false)
  const [policyModalOpen, setPolicyModalOpen] = useState(false)
  const [editingSourceId, setEditingSourceId] = useState<string>()
  const [editingEndpointId, setEditingEndpointId] = useState<string>()
  const [editingPolicyId, setEditingPolicyId] = useState<string>()
  const [previewEndpoint, setPreviewEndpoint] = useState<AccessEndpointRecord>()
  const [p0DrawerOpen, setP0DrawerOpen] = useState(false)
  const [testingSourceId, setTestingSourceId] = useState<string>()
  const [simulationPolicy, setSimulationPolicy] = useState<FieldPolicyRecord>()
  const [simulationFields, setSimulationFields] = useState<string[]>([])
  const [simulationDecision, setSimulationDecision] = useState<{
    effect: 'ALLOW' | 'DENY'
    deniedFields: string[]
  }>()

  const healthySourceCount = sources.filter(
    (source) => source.health === 'healthy',
  ).length
  const publishedEndpointCount = endpoints.filter(
    (endpoint) => endpoint.status === 'published',
  ).length
  const publishedPolicyCount = policies.filter(
    (policy) => policy.status === 'published',
  ).length

  const normalizedSearch = searchText.trim().toLowerCase()

  const filteredSources = useMemo(
    () =>
      sources.filter((source) => {
        const matchesStatus = !statusFilter || source.status === statusFilter
        const matchesSearch =
          !normalizedSearch ||
          [source.name, source.endpoint, source.owner].some((value) =>
            value.toLowerCase().includes(normalizedSearch),
          )
        return matchesStatus && matchesSearch
      }),
    [normalizedSearch, sources, statusFilter],
  )

  const filteredEndpoints = useMemo(
    () =>
      endpoints.filter((endpoint) => {
        const matchesStatus = !statusFilter || endpoint.status === statusFilter
        const matchesSearch =
          !normalizedSearch ||
          [endpoint.name, endpoint.code, endpoint.sourceName].some((value) =>
            value.toLowerCase().includes(normalizedSearch),
          )
        return matchesStatus && matchesSearch
      }),
    [endpoints, normalizedSearch, statusFilter],
  )

  const filteredPolicies = useMemo(
    () =>
      policies.filter((policy) => {
        const matchesStatus = !statusFilter || policy.status === statusFilter
        const matchesSearch =
          !normalizedSearch ||
          [policy.name, policy.endpointCode, policy.subject].some((value) =>
            value.toLowerCase().includes(normalizedSearch),
          )
        return matchesStatus && matchesSearch
      }),
    [normalizedSearch, policies, statusFilter],
  )

  const filteredUsageRecords = useMemo(
    () =>
      usageRecords.filter((record) => {
        const matchesType = !statusFilter || record.targetType === statusFilter
        const matchesSearch =
          !normalizedSearch ||
          [
            record.userName,
            record.userAccount,
            record.targetName,
            record.targetCode,
          ].some((value) => value.toLowerCase().includes(normalizedSearch))
        return matchesType && matchesSearch
      }),
    [normalizedSearch, statusFilter, usageRecords],
  )

  const runConnectionTest = (source: DataSourceRecord) => {
    setTestingSourceId(source.id)
    window.setTimeout(() => {
      setTestingSourceId(undefined)
      if (source.id === 'src-partner-api') {
        void message.error('连接测试失败：上游在 5 秒内未响应')
        return
      }

      setSources((current) =>
        current.map((item) =>
          item.id === source.id
            ? {
                ...item,
                health: 'healthy',
                latencyMs: item.type === 'postgresql' ? 21 : 86,
                lastTestedAt: '刚刚',
                status: item.status === 'draft' ? 'active' : item.status,
              }
            : item,
        ),
      )
      void message.success(`${source.name} 连接测试通过`)
    }, 850)
  }

  const openCreateDataSource = () => {
    setEditingSourceId(undefined)
    sourceForm.setFieldsValue({
      name: undefined,
      type: 'postgresql',
      environment: '开发',
      endpoint: undefined,
      owner: undefined,
    })
    setSourceDrawerOpen(true)
  }

  const openEditDataSource = (source: DataSourceRecord) => {
    setEditingSourceId(source.id)
    sourceForm.setFieldsValue({
      name: source.name,
      type: source.type,
      environment: source.environment,
      endpoint: source.endpoint,
      owner: source.owner,
    })
    setSourceDrawerOpen(true)
  }

  const submitDataSource = (values: DataSourceFormValues) => {
    if (editingSourceId) {
      setSources((current) =>
        current.map((source) =>
          source.id === editingSourceId ? { ...source, ...values } : source,
        ),
      )
      void message.success('数据源配置已更新')
    } else {
      setSources((current) => [
        {
          id: `src-${Date.now()}`,
          ...values,
          status: 'draft',
          health: 'unknown',
        },
        ...current,
      ])
      void message.success('数据源草稿已创建')
    }

    setEditingSourceId(undefined)
    setSourceDrawerOpen(false)
    sourceForm.resetFields()
  }

  const openCreateEndpoint = () => {
    setEditingEndpointId(undefined)
    endpointForm.setFieldsValue({
      name: undefined,
      code: undefined,
      sourceId: undefined,
      mode: 'PASSTHROUGH',
    })
    setEndpointModalOpen(true)
  }

  const openEditEndpoint = (endpoint: AccessEndpointRecord) => {
    setEditingEndpointId(endpoint.id)
    endpointForm.setFieldsValue({
      name: endpoint.name,
      code: endpoint.code,
      sourceId: endpoint.sourceId,
      mode: endpoint.mode,
    })
    setEndpointModalOpen(true)
  }

  const submitEndpoint = (values: EndpointFormValues) => {
    const source = sources.find((item) => item.id === values.sourceId)
    if (!source) return

    if (editingEndpointId) {
      setEndpoints((current) =>
        current.map((endpoint) =>
          endpoint.id === editingEndpointId
            ? {
                ...endpoint,
                ...values,
                sourceName: source.name,
                updatedAt: '刚刚',
              }
            : endpoint,
        ),
      )
      void message.success('接入端点配置已更新')
    } else {
      setEndpoints((current) => [
        {
          id: `endpoint-${Date.now()}`,
          ...values,
          sourceName: source.name,
          fieldCount: 0,
          status: 'draft',
          version: 1,
          requestCountToday: 0,
          updatedAt: '刚刚',
        },
        ...current,
      ])
      void message.success('接入端点草稿已创建')
    }

    setEditingEndpointId(undefined)
    endpointForm.resetFields()
    setEndpointModalOpen(false)
  }

  const publishEndpoint = (endpoint: AccessEndpointRecord) => {
    setEndpoints((current) =>
      current.map((item) =>
        item.id === endpoint.id
          ? { ...item, status: 'published', updatedAt: '刚刚' }
          : item,
      ),
    )
    void message.success(`${endpoint.name} 已发布`)
  }

  const openCreatePolicy = () => {
    setEditingPolicyId(undefined)
    policyForm.setFieldsValue({
      name: undefined,
      endpointCode: undefined,
      subject: undefined,
      allowedFields: [],
    })
    setPolicyModalOpen(true)
  }

  const openEditPolicy = (policy: FieldPolicyRecord) => {
    setEditingPolicyId(policy.id)
    policyForm.setFieldsValue({
      name: policy.name,
      endpointCode: policy.endpointCode,
      subject: policy.subject,
      allowedFields: policy.allowedFields,
    })
    setPolicyModalOpen(true)
  }

  const submitPolicy = (values: PolicyFormValues) => {
    if (editingPolicyId) {
      setPolicies((current) =>
        current.map((policy) =>
          policy.id === editingPolicyId
            ? { ...policy, ...values, updatedAt: '刚刚' }
            : policy,
        ),
      )
      void message.success('字段策略配置已更新')
    } else {
      setPolicies((current) => [
        {
          id: `policy-${Date.now()}`,
          ...values,
          deniedFields: [],
          status: 'draft',
          version: 1,
          updatedAt: '刚刚',
        },
        ...current,
      ])
      void message.success('字段策略草稿已创建')
    }

    setEditingPolicyId(undefined)
    policyForm.resetFields()
    setPolicyModalOpen(false)
  }

  const publishPolicy = (policy: FieldPolicyRecord) => {
    setPolicies((current) =>
      current.map((item) =>
        item.id === policy.id
          ? { ...item, status: 'published', updatedAt: '刚刚' }
          : item,
      ),
    )
    void message.success(`${policy.name} 已发布`)
  }

  const openSimulation = (policy: FieldPolicyRecord) => {
    setSimulationPolicy(policy)
    setSimulationFields(policy.allowedFields.slice(0, 2))
    setSimulationDecision(undefined)
  }

  const runPolicySimulation = () => {
    if (!simulationPolicy) return
    const deniedFields = simulationFields.filter(
      (field) => !simulationPolicy.allowedFields.includes(field),
    )
    setSimulationDecision({
      effect: deniedFields.length ? 'DENY' : 'ALLOW',
      deniedFields,
    })
  }

  const sourceColumns: TableProps<DataSourceRecord>['columns'] = [
    {
      title: '数据源',
      dataIndex: 'name',
      width: 240,
      render: (value: string, record) => (
        <Space orientation="vertical" size={1}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text className="max-w-55" ellipsis type="secondary">
            {record.endpoint}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (value: DataSourceRecord['type']) => (
        <Tag color={SOURCE_TYPE_META[value].color}>
          {SOURCE_TYPE_META[value].label}
        </Tag>
      ),
    },
    { title: '环境', dataIndex: 'environment', width: 90 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: DataSourceStatus) => (
        <Tag color={SOURCE_STATUS_META[value].color}>
          {SOURCE_STATUS_META[value].label}
        </Tag>
      ),
    },
    {
      title: '连接健康',
      dataIndex: 'health',
      width: 150,
      render: (value: HealthStatus, record) => (
        <Space size={6}>
          <Tag color={HEALTH_META[value].color}>{HEALTH_META[value].label}</Tag>
          {record.latencyMs ? (
            <Typography.Text type="secondary">
              {record.latencyMs} ms
            </Typography.Text>
          ) : null}
        </Space>
      ),
    },
    { title: '负责人', dataIndex: 'owner', width: 130 },
    {
      title: '最近测试',
      dataIndex: 'lastTestedAt',
      width: 120,
      render: (value?: string) => value ?? '-',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 190,
      render: (_, record) => (
        <Space size={2}>
          <Button
            icon={<SyncOutlined />}
            loading={testingSourceId === record.id}
            type="link"
            onClick={() => runConnectionTest(record)}
          >
            测试
          </Button>
          <Button
            icon={<SettingOutlined />}
            type="link"
            onClick={() => openEditDataSource(record)}
          >
            配置
          </Button>
        </Space>
      ),
    },
  ]

  const endpointColumns: TableProps<AccessEndpointRecord>['columns'] = [
    {
      title: '接入端点',
      dataIndex: 'name',
      width: 230,
      render: (value: string, record) => (
        <Space orientation="vertical" size={1}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text code>{record.code}</Typography.Text>
        </Space>
      ),
    },
    { title: '数据源', dataIndex: 'sourceName', width: 170 },
    {
      title: '模式',
      dataIndex: 'mode',
      width: 130,
      render: (value: AccessEndpointRecord['mode']) => (
        <Tag color={value === 'PASSTHROUGH' ? 'blue' : 'cyan'}>{value}</Tag>
      ),
    },
    {
      title: '字段',
      dataIndex: 'fieldCount',
      width: 90,
      render: (value: number) => `${value} 个`,
    },
    {
      title: '版本',
      dataIndex: 'version',
      width: 80,
      render: (value: number) => `v${value}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: EndpointStatus) => (
        <Tag color={ENDPOINT_STATUS_META[value].color}>
          {ENDPOINT_STATUS_META[value].label}
        </Tag>
      ),
    },
    {
      title: '今日请求',
      dataIndex: 'requestCountToday',
      width: 110,
      align: 'right',
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 130 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 250,
      render: (_, record) => (
        <Space size={2}>
          <Button
            icon={<EyeOutlined />}
            type="link"
            onClick={() => setPreviewEndpoint(record)}
          >
            预览
          </Button>
          <Button
            icon={<EditOutlined />}
            type="link"
            onClick={() => openEditEndpoint(record)}
          >
            编辑
          </Button>
          {record.status === 'draft' ? (
            <Button
              icon={<RocketOutlined />}
              type="link"
              onClick={() => publishEndpoint(record)}
            >
              发布
            </Button>
          ) : null}
        </Space>
      ),
    },
  ]

  const policyColumns: TableProps<FieldPolicyRecord>['columns'] = [
    {
      title: '字段策略',
      dataIndex: 'name',
      width: 230,
      render: (value: string, record) => (
        <Space orientation="vertical" size={1}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">
            {record.endpointCode}
          </Typography.Text>
        </Space>
      ),
    },
    { title: '绑定主体', dataIndex: 'subject', width: 220 },
    {
      title: '允许字段',
      dataIndex: 'allowedFields',
      width: 270,
      render: (value: string[]) => (
        <div className="flex max-w-64 flex-wrap gap-1">
          {value.slice(0, 3).map((field) => (
            <Tag key={field} className="m-0! rounded-md!">
              {field}
            </Tag>
          ))}
          {value.length > 3 ? (
            <Tag className="m-0!">+{value.length - 3}</Tag>
          ) : null}
        </div>
      ),
    },
    {
      title: '拒绝字段',
      dataIndex: 'deniedFields',
      width: 160,
      render: (value: string[]) =>
        value.length ? <Tag color="red">{value.length} 个</Tag> : '-',
    },
    {
      title: '版本',
      dataIndex: 'version',
      width: 80,
      render: (value: number) => `v${value}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: PolicyStatus) => (
        <Tag color={POLICY_STATUS_META[value].color}>
          {POLICY_STATUS_META[value].label}
        </Tag>
      ),
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 130 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 250,
      render: (_, record) => (
        <Space size={2}>
          <Button
            icon={<SafetyCertificateOutlined />}
            type="link"
            onClick={() => openSimulation(record)}
          >
            模拟
          </Button>
          <Button
            icon={<EditOutlined />}
            type="link"
            onClick={() => openEditPolicy(record)}
          >
            编辑
          </Button>
          {record.status === 'draft' ? (
            <Button
              icon={<RocketOutlined />}
              type="link"
              onClick={() => publishPolicy(record)}
            >
              发布
            </Button>
          ) : null}
        </Space>
      ),
    },
  ]

  const p0Columns: TableProps<(typeof p0Capabilities)[number]>['columns'] = [
    { title: '#', dataIndex: 'id', width: 54 },
    { title: '模块', dataIndex: 'module', width: 120 },
    { title: 'P0 能力', dataIndex: 'name' },
    { title: '实现方式', dataIndex: 'implementation', width: 170 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value: string) => (
        <Tag color={value === '待接入' ? 'blue' : 'gold'}>{value}</Tag>
      ),
    },
  ]

  const usageColumns: TableProps<UsageRecord>['columns'] = [
    {
      title: '使用人',
      dataIndex: 'userName',
      width: 260,
      render: (value: string, record) => (
        <Space orientation="vertical" size={1}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">
            {record.userAccount}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '访问类型',
      dataIndex: 'targetType',
      width: 130,
      render: (value: UsageTargetType) => (
        <Tag color={USAGE_TARGET_META[value].color}>
          {USAGE_TARGET_META[value].label}
        </Tag>
      ),
    },
    {
      title: '访问对象',
      dataIndex: 'targetName',
      render: (value: string, record) => (
        <Space orientation="vertical" size={1}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text code>{record.targetCode}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '使用时间',
      dataIndex: 'usedAt',
      width: 190,
    },
  ]

  const statusOptions =
    workspace === 'sources'
      ? Object.entries(SOURCE_STATUS_META).map(([value, meta]) => ({
          value,
          label: meta.label,
        }))
      : workspace === 'endpoints'
        ? Object.entries(ENDPOINT_STATUS_META).map(([value, meta]) => ({
            value,
            label: meta.label,
          }))
        : workspace === 'policies'
          ? Object.entries(POLICY_STATUS_META).map(([value, meta]) => ({
              value,
              label: meta.label,
            }))
          : Object.entries(USAGE_TARGET_META).map(([value, meta]) => ({
              value,
              label: meta.label,
            }))

  const openCreate = () => {
    if (workspace === 'sources') openCreateDataSource()
    if (workspace === 'endpoints') openCreateEndpoint()
    if (workspace === 'policies') openCreatePolicy()
  }

  return (
    <div className="h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full overflow-y-auto pb-4 pe-1 [scrollbar-gutter:stable]">
      <PageHeader
        className="mb-3 rounded-lg border border-(--border) bg-(--panel) px-4 py-3"
        title="数据接入控制台"
        subtitle="统一管理数据源、接入端点与字段权限策略，首版覆盖功能表中的 P0 核心工作流。"
      >
        <Space wrap>
          <Button
            icon={<FileProtectOutlined />}
            onClick={() => setP0DrawerOpen(true)}
          >
            查看 P0 范围
          </Button>
          {WORKSPACE_META[workspace].createLabel ? (
            <Button icon={<PlusOutlined />} type="primary" onClick={openCreate}>
              {WORKSPACE_META[workspace].createLabel}
            </Button>
          ) : null}
        </Space>
      </PageHeader>

      <div className="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[620px]:grid-cols-1">
        <MetricTile
          icon={<DatabaseOutlined />}
          label="数据源"
          note="PostgreSQL / HTTP API"
          tone="blue"
          value={sources.length}
        />
        <MetricTile
          icon={<CheckCircleOutlined />}
          label="连接健康"
          note={`${sources.length - healthySourceCount} 个需处理`}
          tone="green"
          value={healthySourceCount}
        />
        <MetricTile
          icon={<ApiOutlined />}
          label="已发布端点"
          note={`今日 ${endpoints.reduce((sum, item) => sum + item.requestCountToday, 0).toLocaleString()} 次请求`}
          tone="purple"
          value={publishedEndpointCount}
        />
        <MetricTile
          icon={<SafetyCertificateOutlined />}
          label="生效策略"
          note="字段权限默认拒绝"
          tone="orange"
          value={publishedPolicyCount}
        />
      </div>

      <PageContainer className="mt-2.5 rounded-lg! p-3.5">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <Typography.Text strong>核心链路</Typography.Text>
            <Typography.Text className="ms-2 text-xs!" type="secondary">
              P0 基础组件与自研安全边界
            </Typography.Text>
          </div>
          <Tag className="m-0! rounded-md!" color="purple">
            P0 · 16 项
          </Tag>
        </div>
        <div className="grid grid-cols-3 gap-2.5 max-[980px]:grid-cols-1">
          <FoundationItem
            icon={<CloudServerOutlined />}
            name="Apache APISIX"
            role="JWT 校验与路由转发，放行后进入自研字段权限网关。"
            status="待接入"
            statusColor="blue"
          />
          <FoundationItem
            icon={<LinkOutlined />}
            name="Apache OpenDAL"
            role="统一数据访问底座，支撑 PostgreSQL 等连接器适配。"
            status="待接入"
            statusColor="blue"
          />
          <FoundationItem
            icon={<SafetyCertificateOutlined />}
            name="自研数据网关"
            role="租户识别、端点校验、参数化查询与统一拒绝响应。"
            status="方案就绪"
            statusColor="green"
          />
        </div>
      </PageContainer>

      <PageContainer className="mt-2.5 min-h-110 rounded-lg! p-0">
        <Tabs
          activeKey={workspace}
          className="[&_.ant-tabs-nav]:mb-0! [&_.ant-tabs-nav]:px-4 [&_.ant-tabs-tab]:py-3! [&_.ant-tabs-content-holder]:min-h-0"
          items={[
            { key: 'sources', label: `数据源 (${sources.length})` },
            { key: 'endpoints', label: `接入端点 (${endpoints.length})` },
            { key: 'policies', label: `字段策略 (${policies.length})` },
            { key: 'usage', label: `使用记录 (${usageRecords.length})` },
          ]}
          onChange={(key) => {
            setWorkspace(key as WorkspaceKey)
            setSearchText('')
            setStatusFilter(undefined)
          }}
        />

        <div className="flex flex-wrap items-center gap-2 border-y border-(--border) bg-(--control-subtle-bg) px-4 py-2.5">
          <Input
            allowClear
            className="max-w-88"
            prefix={<SearchOutlined className="text-(--dark-text)" />}
            placeholder={WORKSPACE_META[workspace].searchPlaceholder}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <Select
            allowClear
            className="w-34"
            options={statusOptions}
            placeholder={workspace === 'usage' ? '全部类型' : '全部状态'}
            suffixIcon={<FilterOutlined />}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <div className="ms-auto">
            <Tooltip title="刷新当前列表">
              <Button
                aria-label="刷新当前列表"
                icon={<ReloadOutlined />}
                onClick={() => void message.success('列表已刷新')}
              />
            </Tooltip>
          </div>
        </div>

        <div className="min-h-0 overflow-hidden px-4 pb-4 pt-3">
          {workspace === 'sources' ? (
            <Table
              columns={sourceColumns}
              dataSource={filteredSources}
              pagination={{ pageSize: 6, showSizeChanger: false }}
              rowKey="id"
              scroll={{ x: 1180 }}
              size="small"
            />
          ) : null}
          {workspace === 'endpoints' ? (
            <Table
              columns={endpointColumns}
              dataSource={filteredEndpoints}
              pagination={{ pageSize: 6, showSizeChanger: false }}
              rowKey="id"
              scroll={{ x: 1180 }}
              size="small"
            />
          ) : null}
          {workspace === 'policies' ? (
            <Table
              columns={policyColumns}
              dataSource={filteredPolicies}
              pagination={{ pageSize: 6, showSizeChanger: false }}
              rowKey="id"
              scroll={{ x: 1220 }}
              size="small"
            />
          ) : null}
          {workspace === 'usage' ? (
            <Table
              columns={usageColumns}
              dataSource={filteredUsageRecords}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              rowKey="id"
              scroll={{ x: 900 }}
              size="small"
            />
          ) : null}
        </div>
      </PageContainer>

      <Drawer
        destroyOnHidden
        forceRender
        open={sourceDrawerOpen}
        size="large"
        title={editingSourceId ? '配置数据源' : '新建数据源'}
        extra={
          <Button type="primary" onClick={() => sourceForm.submit()}>
            {editingSourceId ? '保存配置' : '保存草稿'}
          </Button>
        }
        onClose={() => {
          setSourceDrawerOpen(false)
          setEditingSourceId(undefined)
          sourceForm.resetFields()
        }}
      >
        <Alert
          showIcon
          className="mb-5"
          title="P0 连接器范围"
          description="首版开放 PostgreSQL 与 HTTP API。连接凭据仅保存配置状态，不在页面回显。"
          type="info"
        />
        <Form
          form={sourceForm}
          layout="vertical"
          requiredMark="optional"
          onFinish={submitDataSource}
        >
          <Form.Item
            label="数据源名称"
            name="name"
            rules={[{ required: true, message: '请输入数据源名称' }]}
          >
            <Input placeholder="例如：客户中心只读库" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-3 max-[560px]:grid-cols-1">
            <Form.Item
              label="连接器类型"
              name="type"
              rules={[{ required: true }]}
            >
              <Select
                options={Object.entries(SOURCE_TYPE_META).map(
                  ([value, meta]) => ({
                    value,
                    label: meta.label,
                  }),
                )}
              />
            </Form.Item>
            <Form.Item
              label="环境"
              name="environment"
              rules={[{ required: true }]}
            >
              <Select
                options={['生产', '预发', '开发'].map((value) => ({ value }))}
              />
            </Form.Item>
          </div>
          <Form.Item
            label="连接地址"
            name="endpoint"
            rules={[{ required: true, message: '请输入连接地址' }]}
          >
            <Input placeholder="db.internal:5432 或 https://api.example.com" />
          </Form.Item>
          <Form.Item
            label="负责人"
            name="owner"
            rules={[{ required: true, message: '请输入负责人或团队' }]}
          >
            <Input placeholder="例如：数据平台组" />
          </Form.Item>
          <Form.Item label="访问凭据状态">
            <Input.Password disabled placeholder="保存后配置 · 不回显原值" />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        destroyOnHidden
        forceRender
        open={endpointModalOpen}
        title={editingEndpointId ? '编辑接入端点' : '新建接入端点'}
        okText={editingEndpointId ? '保存修改' : '保存草稿'}
        cancelText="取消"
        onCancel={() => {
          setEndpointModalOpen(false)
          setEditingEndpointId(undefined)
          endpointForm.resetFields()
        }}
        onOk={() => endpointForm.submit()}
      >
        <Form form={endpointForm} layout="vertical" onFinish={submitEndpoint}>
          <Form.Item label="端点名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="例如：客户标签查询" />
          </Form.Item>
          <Form.Item
            label="端点编码"
            name="code"
            rules={[
              { required: true },
              {
                pattern: /^[a-z][a-z0-9-]+$/,
                message: '使用小写字母、数字和连字符',
              },
            ]}
          >
            <Input placeholder="customer-tags" />
          </Form.Item>
          <Form.Item
            label="数据源"
            name="sourceId"
            rules={[{ required: true }]}
          >
            <Select
              options={sources.map((source) => ({
                value: source.id,
                label: source.name,
              }))}
            />
          </Form.Item>
          <Form.Item label="接入模式" name="mode" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'PASSTHROUGH', label: '实时透传' },
                { value: 'LANDING', label: '落地数据查询' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        destroyOnHidden
        open={Boolean(previewEndpoint)}
        size="large"
        title="接入端点预览"
        extra={
          previewEndpoint ? (
            <Button
              icon={<EditOutlined />}
              type="primary"
              onClick={() => {
                const endpoint = previewEndpoint
                setPreviewEndpoint(undefined)
                openEditEndpoint(endpoint)
              }}
            >
              编辑配置
            </Button>
          ) : null
        }
        onClose={() => setPreviewEndpoint(undefined)}
      >
        {previewEndpoint ? (
          <Space className="w-full" orientation="vertical" size={18}>
            <Alert
              showIcon
              type={previewEndpoint.status === 'published' ? 'success' : 'info'}
              title={
                previewEndpoint.status === 'published'
                  ? '该端点已发布，可通过数据网关访问'
                  : '该端点仍为草稿，发布后才会对外提供服务'
              }
            />
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                {
                  key: 'name',
                  label: '端点名称',
                  children: previewEndpoint.name,
                },
                {
                  key: 'code',
                  label: '端点编码',
                  children: (
                    <Typography.Text code>
                      {previewEndpoint.code}
                    </Typography.Text>
                  ),
                },
                {
                  key: 'source',
                  label: '数据源',
                  children: previewEndpoint.sourceName,
                },
                {
                  key: 'mode',
                  label: '接入模式',
                  children: previewEndpoint.mode,
                },
                {
                  key: 'version',
                  label: '版本',
                  children: `v${previewEndpoint.version}`,
                },
                {
                  key: 'fields',
                  label: '公开字段',
                  children: `${previewEndpoint.fieldCount} 个`,
                },
                {
                  key: 'status',
                  label: '状态',
                  children: (
                    <Tag
                      color={ENDPOINT_STATUS_META[previewEndpoint.status].color}
                    >
                      {ENDPOINT_STATUS_META[previewEndpoint.status].label}
                    </Tag>
                  ),
                },
                {
                  key: 'requests',
                  label: '今日请求',
                  children: previewEndpoint.requestCountToday.toLocaleString(),
                },
              ]}
              size="small"
            />
            <div>
              <Typography.Text strong>调用路径</Typography.Text>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-(--border) bg-(--control-subtle-bg) p-3 text-xs leading-5 text-(--text)">
                {`POST /api/v1/data-gateway/endpoints/${previewEndpoint.code}/query`}
              </pre>
            </div>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        destroyOnHidden
        forceRender
        open={policyModalOpen}
        title={editingPolicyId ? '编辑字段策略' : '新建字段策略'}
        okText={editingPolicyId ? '保存修改' : '保存草稿'}
        cancelText="取消"
        onCancel={() => {
          setPolicyModalOpen(false)
          setEditingPolicyId(undefined)
          policyForm.resetFields()
        }}
        onOk={() => policyForm.submit()}
      >
        <Form form={policyForm} layout="vertical" onFinish={submitPolicy}>
          <Form.Item label="策略名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="例如：客服只读字段" />
          </Form.Item>
          <Form.Item
            label="接入端点"
            name="endpointCode"
            rules={[{ required: true }]}
          >
            <Select
              options={endpoints.map((endpoint) => ({
                value: endpoint.code,
                label: `${endpoint.name} (${endpoint.code})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="绑定主体"
            name="subject"
            rules={[{ required: true }]}
          >
            <Input placeholder="角色：customer_service" />
          </Form.Item>
          <Form.Item
            label="允许返回字段"
            name="allowedFields"
            rules={[{ required: true }]}
          >
            <Select mode="tags" placeholder="输入字段名后回车" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        destroyOnHidden
        open={Boolean(simulationPolicy)}
        size="large"
        title="字段权限模拟"
        extra={
          <Button type="primary" onClick={runPolicySimulation}>
            执行模拟
          </Button>
        }
        onClose={() => setSimulationPolicy(undefined)}
      >
        {simulationPolicy ? (
          <Space className="w-full" orientation="vertical" size={18}>
            <div className="rounded-lg border border-(--border) bg-(--control-subtle-bg) p-4">
              <Typography.Title level={5} className="mt-0! mb-1!">
                {simulationPolicy.name}
              </Typography.Title>
              <Typography.Text type="secondary">
                {simulationPolicy.subject} · {simulationPolicy.endpointCode}
              </Typography.Text>
            </div>
            <div>
              <Typography.Text strong>本次请求字段</Typography.Text>
              <Checkbox.Group
                className="mt-3 grid w-full grid-cols-2 gap-2 max-[520px]:grid-cols-1"
                options={Array.from(
                  new Set([
                    ...simulationPolicy.allowedFields,
                    ...simulationPolicy.deniedFields,
                    'mobile',
                    'id_card',
                  ]),
                )}
                value={simulationFields}
                onChange={setSimulationFields}
              />
            </div>
            {simulationDecision ? (
              <Alert
                showIcon
                type={
                  simulationDecision.effect === 'ALLOW' ? 'success' : 'error'
                }
                title={
                  simulationDecision.effect === 'ALLOW'
                    ? 'ALLOW · 请求允许'
                    : 'DENY · FIELD_PERMISSION_DENIED'
                }
                description={
                  simulationDecision.effect === 'ALLOW'
                    ? `允许返回 ${simulationFields.length} 个字段，网关将生成字段白名单。`
                    : `字段 ${simulationDecision.deniedFields.join('、')} 无权限，请求已在网关拒绝；downstream_called=false。`
                }
              />
            ) : (
              <Alert
                showIcon
                type="info"
                title="模拟不会调用下游"
                description="系统仅执行租户、端点与字段策略决策，不访问真实数据源。"
              />
            )}
          </Space>
        ) : null}
      </Drawer>

      <Drawer
        destroyOnHidden
        open={p0DrawerOpen}
        size="large"
        title="数据接入层 P0 开发范围"
        onClose={() => setP0DrawerOpen(false)}
      >
        <Alert
          showIcon
          className="mb-4"
          title="本界面基于 Excel 中 16 条 P0 需求构建"
          description="当前为前端交互版本，外部组件与控制面 API 均以 mock 状态展示。"
          type="info"
        />
        <Table
          columns={p0Columns}
          dataSource={p0Capabilities}
          pagination={false}
          rowKey="id"
          scroll={{ x: 680 }}
          size="small"
        />
      </Drawer>
    </div>
  )
}

export default DataAccessConsole
