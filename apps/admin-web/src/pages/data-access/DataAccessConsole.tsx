import {
  ApiOutlined,
  CheckCircleOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  StopOutlined,
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
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'

import { initialPolicies, initialUsageRecords } from './mock'
import { useAccessEndpoints } from './hooks/useAccessEndpoints'
import { useDataSources } from './hooks/useDataSources'
import { useDataIngestionIntegrations } from './hooks/useDataIngestionIntegrations'
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
import {
  accessEndpointFormToPayload,
  accessEndpointToFormValues,
} from './utils/accessEndpoints'
import {
  dataSourceConnectionLabel,
  dataSourceFormToPayload,
  dataSourceToFormValues,
} from './utils/dataSources'

const SOURCE_TYPE_META = {
  postgresql: { label: 'PostgreSQL', color: 'blue' },
  http_api: { label: 'HTTP API', color: 'cyan' },
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
    searchPlaceholder: '搜索数据源名称、编码或连接地址',
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

function validateOptionalJsonObject(_rule: unknown, value?: string) {
  if (!value?.trim()) return Promise.resolve()
  try {
    const parsed: unknown = JSON.parse(value)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return Promise.reject(new Error('请输入 JSON 对象'))
    }
    return Promise.resolve()
  } catch {
    return Promise.reject(new Error('JSON 格式不正确'))
  }
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

interface OverflowTextProps {
  children: ReactNode
  className?: string
  code?: boolean
  strong?: boolean
  type?: 'secondary'
}

function OverflowText({
  children,
  className,
  code,
  strong,
  type,
}: OverflowTextProps) {
  const text =
    typeof children === 'string' || typeof children === 'number'
      ? String(children)
      : undefined

  return (
    <Tooltip title={text}>
      <Typography.Text
        className={`block! max-w-full! ${className ?? ''}`}
        code={code}
        ellipsis
        strong={strong}
        type={type}
      >
        {children}
      </Typography.Text>
    </Tooltip>
  )
}

export function DataAccessConsole() {
  const { message, modal } = App.useApp()
  const { t } = useTranslation()
  const [sourceForm] = Form.useForm<DataSourceFormValues>()
  const sourceType = Form.useWatch('type', sourceForm)
  const sourceAuthType = Form.useWatch('authType', sourceForm)
  const sourceHealthMethod = Form.useWatch('healthMethod', sourceForm)
  const [endpointForm] = Form.useForm<EndpointFormValues>()
  const endpointSourceId = Form.useWatch('sourceId', endpointForm)
  const [policyForm] = Form.useForm<PolicyFormValues>()
  const [workspace, setWorkspace] = useState<WorkspaceKey>('sources')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>()
  const {
    sources,
    total: sourceTotal,
    listQuery: sourceListQuery,
    createSource,
    createPending,
    updateSource,
    updatePending,
    deleteSource,
    deletePendingId,
    testSource,
    testingSourceId,
    discoverMetadata,
    metadataMutation,
  } = useDataSources()
  const {
    endpoints,
    total: endpointTotal,
    listQuery: endpointListQuery,
    createEndpoint,
    createPending: createEndpointPending,
    updateEndpoint,
    updatePending: updateEndpointPending,
    deleteEndpoint,
    deletingEndpointId,
    publishEndpoint,
    publishingEndpointId,
    deprecateEndpoint,
    deprecatingEndpointId,
  } = useAccessEndpoints()
  const integrationsQuery = useDataIngestionIntegrations()
  const [policies, setPolicies] = useState(initialPolicies)
  const [usageRecords] = useState(initialUsageRecords)
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false)
  const [endpointModalOpen, setEndpointModalOpen] = useState(false)
  const [policyModalOpen, setPolicyModalOpen] = useState(false)
  const [editingSourceId, setEditingSourceId] = useState<string>()
  const [editingEndpointId, setEditingEndpointId] = useState<string>()
  const [editingPolicyId, setEditingPolicyId] = useState<string>()
  const [previewEndpoint, setPreviewEndpoint] = useState<AccessEndpointRecord>()
  const [metadataSource, setMetadataSource] = useState<DataSourceRecord>()
  const [simulationPolicy, setSimulationPolicy] = useState<FieldPolicyRecord>()
  const [simulationFields, setSimulationFields] = useState<string[]>([])
  const [simulationDecision, setSimulationDecision] = useState<{
    effect: 'ALLOW' | 'DENY'
    deniedFields: string[]
  }>()

  const apisixIntegrationStatus = integrationsQuery.isPending
    ? 'checking'
    : (integrationsQuery.data?.apisix.status ?? 'unavailable')
  const apisixStatusMeta = {
    connected: {
      color: 'green',
      label: t('pages.dataAccess.status.connected'),
    },
    not_configured: {
      color: 'blue',
      label: t('pages.dataAccess.status.notConfigured'),
    },
    checking: {
      color: 'processing',
      label: t('pages.dataAccess.status.checking'),
    },
    unavailable: {
      color: 'red',
      label: t('pages.dataAccess.status.unavailable'),
    },
  }[apisixIntegrationStatus]

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
  const sourceById = useMemo(
    () => new Map(sources.map((source) => [source.id, source])),
    [sources],
  )
  const endpointSourceType = endpointSourceId
    ? sourceById.get(endpointSourceId)?.source_type
    : undefined

  const filteredSources = useMemo(
    () =>
      sources.filter((source) => {
        const matchesStatus = !statusFilter || source.status === statusFilter
        const matchesSearch =
          !normalizedSearch ||
          [source.name, source.code, dataSourceConnectionLabel(source)].some(
            (value) => value.toLowerCase().includes(normalizedSearch),
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
          [
            endpoint.name,
            endpoint.endpoint_code,
            sourceById.get(endpoint.source_id)?.name ?? '',
          ].some((value) => value.toLowerCase().includes(normalizedSearch))
        return matchesStatus && matchesSearch
      }),
    [endpoints, normalizedSearch, sourceById, statusFilter],
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

  const runConnectionTest = async (source: DataSourceRecord) => {
    try {
      const result = await testSource(source.id)
      if (result.success) {
        void message.success(
          `${source.name} 连接测试通过${result.latency_ms === null ? '' : `，${result.latency_ms} ms`}`,
        )
      } else {
        void message.error(result.message)
      }
    } catch {
      // 统一请求客户端已处理错误反馈。
    }
  }

  const openCreateDataSource = () => {
    setEditingSourceId(undefined)
    sourceForm.setFieldsValue({
      name: undefined,
      code: undefined,
      type: 'postgresql',
      port: 5432,
      schemaName: 'public',
      sslMode: 'prefer',
      connectTimeoutSeconds: 5,
      poolSize: 5,
      healthMethod: 'GET',
      healthPath: '/',
      healthExpectedStatus: 200,
      authType: 'none',
      authHeader: 'Authorization',
      timeoutSeconds: 10,
      verifyTls: true,
    })
    setSourceDrawerOpen(true)
  }

  const openEditDataSource = (source: DataSourceRecord) => {
    setEditingSourceId(source.id)
    sourceForm.setFieldsValue(dataSourceToFormValues(source))
    setSourceDrawerOpen(true)
  }

  const submitDataSource = async (values: DataSourceFormValues) => {
    try {
      const payload = dataSourceFormToPayload(values)
      if (editingSourceId) {
        await updateSource({
          sourceId: editingSourceId,
          data: { name: payload.name, config: payload.config },
        })
        void message.success('数据源配置已更新')
      } else {
        await createSource(payload)
        void message.success('数据源草稿已创建')
      }
    } catch {
      return
    }

    setEditingSourceId(undefined)
    setSourceDrawerOpen(false)
    sourceForm.resetFields()
  }

  const confirmDeleteDataSource = (source: DataSourceRecord) => {
    modal.confirm({
      title: '删除数据源',
      content: `确认删除“${source.name}”？已被接入端点引用的数据源无法删除。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await deleteSource(source.id)
        void message.success('数据源已删除')
      },
    })
  }

  const openMetadata = async (source: DataSourceRecord) => {
    setMetadataSource(source)
    metadataMutation.reset()
    try {
      await discoverMetadata(source.id)
    } catch {
      // 统一请求客户端已处理错误反馈。
    }
  }

  const openCreateEndpoint = () => {
    setEditingEndpointId(undefined)
    endpointForm.setFieldsValue({
      name: undefined,
      code: undefined,
      sourceId: undefined,
      mode: 'PASSTHROUGH',
      method: 'GET',
      availableFields: [],
      parameters: [],
    })
    setEndpointModalOpen(true)
  }

  const openEditEndpoint = (endpoint: AccessEndpointRecord) => {
    setEditingEndpointId(endpoint.id)
    endpointForm.setFieldsValue(accessEndpointToFormValues(endpoint))
    setEndpointModalOpen(true)
  }

  const submitEndpoint = async (values: EndpointFormValues) => {
    const sourceType = sourceById.get(values.sourceId)?.source_type
    if (!sourceType) {
      void message.error('请选择有效的数据源')
      return
    }
    const payload = accessEndpointFormToPayload(values, sourceType)
    try {
      if (editingEndpointId) {
        const { endpoint_code: _endpointCode, ...updatePayload } = payload
        await updateEndpoint({
          endpointId: editingEndpointId,
          data: updatePayload,
        })
        void message.success('接入端点配置已更新')
      } else {
        await createEndpoint(payload)
        void message.success('接入端点草稿已创建')
      }
    } catch {
      return
    }

    setEditingEndpointId(undefined)
    endpointForm.resetFields()
    setEndpointModalOpen(false)
  }

  const confirmPublishEndpoint = (endpoint: AccessEndpointRecord) => {
    const version = endpoint.published_version + 1
    modal.confirm({
      title: endpoint.published_version
        ? `发布端点新版本 v${version}`
        : '发布接入端点',
      content: `发布后将生成不可变快照 v${version}，确认继续？`,
      okText: '确认发布',
      cancelText: '取消',
      onOk: async () => {
        await publishEndpoint(endpoint.id)
        void message.success(`${endpoint.name} 已发布 v${version}`)
      },
    })
  }

  const confirmDeleteEndpoint = (endpoint: AccessEndpointRecord) => {
    modal.confirm({
      title: '删除接入端点草稿',
      content: `确认删除“${endpoint.name}”？该操作无法撤销。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await deleteEndpoint(endpoint.id)
        void message.success('接入端点草稿已删除')
      },
    })
  }

  const confirmDeprecateEndpoint = (endpoint: AccessEndpointRecord) => {
    modal.confirm({
      title: '废弃已发布端点',
      content: `废弃“${endpoint.name}”后将不再接受新调用，历史版本会保留。`,
      okText: '确认废弃',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        await deprecateEndpoint(endpoint.id)
        void message.success(`${endpoint.name} 已废弃`)
      },
    })
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
      align: 'center',
      render: (value: string, record) => (
        <Space
          align="center"
          className="min-w-0 max-w-full"
          orientation="vertical"
          size={1}
        >
          <OverflowText strong>{value}</OverflowText>
          <OverflowText type="secondary">
            {dataSourceConnectionLabel(record)}
          </OverflowText>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'source_type',
      width: 120,
      align: 'center',
      render: (value: DataSourceRecord['source_type']) => (
        <Tag color={SOURCE_TYPE_META[value].color}>
          {SOURCE_TYPE_META[value].label}
        </Tag>
      ),
    },
    {
      title: '编码',
      dataIndex: 'code',
      width: 150,
      align: 'center',
      render: (value: string) => <OverflowText code>{value}</OverflowText>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
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
      align: 'center',
      render: (value: HealthStatus, record) => (
        <Space align="center" size={6}>
          <Tag color={HEALTH_META[value].color}>{HEALTH_META[value].label}</Tag>
          {record.latency_ms !== null ? (
            <Typography.Text type="secondary">
              {record.latency_ms} ms
            </Typography.Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: '最近测试',
      dataIndex: 'last_tested_at',
      width: 170,
      align: 'center',
      render: (value: string | null) =>
        value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 290,
      align: 'center',
      render: (_, record) => (
        <Space size={2}>
          <Button
            icon={<SyncOutlined />}
            loading={testingSourceId === record.id}
            type="link"
            onClick={() => void runConnectionTest(record)}
          >
            测试
          </Button>
          <Button
            icon={<EyeOutlined />}
            type="link"
            onClick={() => void openMetadata(record)}
          >
            元数据
          </Button>
          <Button
            icon={<SettingOutlined />}
            type="link"
            onClick={() => openEditDataSource(record)}
          >
            配置
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            loading={deletePendingId === record.id}
            type="link"
            onClick={() => confirmDeleteDataSource(record)}
          >
            删除
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
      align: 'center',
      render: (value: string, record) => (
        <Space
          align="center"
          className="min-w-0 max-w-full"
          orientation="vertical"
          size={1}
        >
          <OverflowText strong>{value}</OverflowText>
          <OverflowText code>{record.endpoint_code}</OverflowText>
        </Space>
      ),
    },
    {
      title: '数据源',
      dataIndex: 'source_id',
      width: 170,
      align: 'center',
      render: (value: string) => (
        <OverflowText>
          {sourceById.get(value)?.name ?? '未知数据源'}
        </OverflowText>
      ),
    },
    {
      title: '模式',
      dataIndex: 'mode',
      width: 130,
      align: 'center',
      render: (value: AccessEndpointRecord['mode']) => (
        <Tag color="blue">{value}</Tag>
      ),
    },
    {
      title: '字段',
      dataIndex: 'available_fields',
      width: 90,
      align: 'center',
      render: (value: string[]) => `${value.length} 个`,
    },
    {
      title: '版本',
      dataIndex: 'published_version',
      width: 80,
      align: 'center',
      render: (value: number) => (value ? `v${value}` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 130,
      align: 'center',
      render: (value: EndpointStatus, record) => (
        <Space align="center" orientation="vertical" size={2}>
          <Tag color={ENDPOINT_STATUS_META[value].color}>
            {ENDPOINT_STATUS_META[value].label}
          </Tag>
          {value === 'published' && record.has_draft_changes ? (
            <Typography.Text type="warning">有待发布修改</Typography.Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 170,
      align: 'center',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 360,
      align: 'center',
      render: (_, record) => {
        const canPublish =
          record.status === 'draft' ||
          (record.status === 'published' && record.has_draft_changes)
        return (
          <Space size={0}>
            <Button
              icon={<EyeOutlined />}
              type="link"
              onClick={() => setPreviewEndpoint(record)}
            >
              预览
            </Button>
            {record.status !== 'deprecated' ? (
              <Button
                icon={<EditOutlined />}
                type="link"
                onClick={() => openEditEndpoint(record)}
              >
                编辑
              </Button>
            ) : null}
            {canPublish ? (
              <Button
                icon={<RocketOutlined />}
                loading={publishingEndpointId === record.id}
                type="link"
                onClick={() => confirmPublishEndpoint(record)}
              >
                {record.published_version ? '发布新版' : '发布'}
              </Button>
            ) : null}
            {record.published_version === 0 ? (
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={deletingEndpointId === record.id}
                type="link"
                onClick={() => confirmDeleteEndpoint(record)}
              >
                删除
              </Button>
            ) : null}
            {record.status === 'published' ? (
              <Button
                danger
                icon={<StopOutlined />}
                loading={deprecatingEndpointId === record.id}
                type="link"
                onClick={() => confirmDeprecateEndpoint(record)}
              >
                废弃
              </Button>
            ) : null}
          </Space>
        )
      },
    },
  ]

  const policyColumns: TableProps<FieldPolicyRecord>['columns'] = [
    {
      title: '字段策略',
      dataIndex: 'name',
      width: 230,
      align: 'center',
      render: (value: string, record) => (
        <Space
          align="center"
          className="min-w-0 max-w-full"
          orientation="vertical"
          size={1}
        >
          <OverflowText strong>{value}</OverflowText>
          <OverflowText type="secondary">{record.endpointCode}</OverflowText>
        </Space>
      ),
    },
    {
      title: '绑定主体',
      dataIndex: 'subject',
      width: 220,
      align: 'center',
      render: (value: string) => <OverflowText>{value}</OverflowText>,
    },
    {
      title: '允许字段',
      dataIndex: 'allowedFields',
      width: 270,
      align: 'center',
      render: (value: string[]) => (
        <div className="flex max-w-64 flex-wrap justify-center gap-1">
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
      align: 'center',
      render: (value: string[]) =>
        value.length ? <Tag color="red">{value.length} 个</Tag> : '-',
    },
    {
      title: '版本',
      dataIndex: 'version',
      width: 80,
      align: 'center',
      render: (value: number) => `v${value}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (value: PolicyStatus) => (
        <Tag color={POLICY_STATUS_META[value].color}>
          {POLICY_STATUS_META[value].label}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 130,
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 250,
      align: 'center',
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

  const usageColumns: TableProps<UsageRecord>['columns'] = [
    {
      title: '使用人',
      dataIndex: 'userName',
      width: 260,
      align: 'center',
      render: (value: string, record) => (
        <Space
          align="center"
          className="min-w-0 max-w-full"
          orientation="vertical"
          size={1}
        >
          <OverflowText strong>{value}</OverflowText>
          <OverflowText type="secondary">{record.userAccount}</OverflowText>
        </Space>
      ),
    },
    {
      title: '访问类型',
      dataIndex: 'targetType',
      width: 130,
      align: 'center',
      render: (value: UsageTargetType) => (
        <Tag color={USAGE_TARGET_META[value].color}>
          {USAGE_TARGET_META[value].label}
        </Tag>
      ),
    },
    {
      title: '访问对象',
      dataIndex: 'targetName',
      align: 'center',
      render: (value: string, record) => (
        <Space
          align="center"
          className="min-w-0 max-w-full"
          orientation="vertical"
          size={1}
        >
          <OverflowText strong>{value}</OverflowText>
          <OverflowText code>{record.targetCode}</OverflowText>
        </Space>
      ),
    },
    {
      title: '使用时间',
      dataIndex: 'usedAt',
      width: 190,
      align: 'center',
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
          value={sourceTotal}
        />
        <MetricTile
          icon={<CheckCircleOutlined />}
          label="连接健康"
          note={`${Math.max(sourceTotal - healthySourceCount, 0)} 个需处理`}
          tone="green"
          value={healthySourceCount}
        />
        <MetricTile
          icon={<ApiOutlined />}
          label="已发布端点"
          note={`${endpoints.filter((item) => item.has_draft_changes).length} 个端点有待发布修改`}
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
            role={t('pages.dataAccess.apisix.role')}
            status={apisixStatusMeta.label}
            statusColor={apisixStatusMeta.color}
          />
          <FoundationItem
            icon={<LinkOutlined />}
            name="Apache OpenDAL"
            role="统一 Operator 创建、能力检测与资源释放，通过稳定 SPI 接入连接器。"
            status="已接入"
            statusColor="green"
          />
          <FoundationItem
            icon={<SafetyCertificateOutlined />}
            name="自研数据网关"
            role="租户识别、端点校验、参数化查询与统一拒绝响应。"
            status="已接入"
            statusColor="green"
          />
        </div>
      </PageContainer>

      <PageContainer className="mt-2.5 min-h-110 rounded-lg! p-0">
        <Tabs
          activeKey={workspace}
          className="[&_.ant-tabs-nav]:mb-0! [&_.ant-tabs-nav]:px-4 [&_.ant-tabs-tab]:py-3! [&_.ant-tabs-content-holder]:min-h-0"
          items={[
            { key: 'sources', label: `数据源 (${sourceTotal})` },
            { key: 'endpoints', label: `接入端点 (${endpointTotal})` },
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
                loading={workspace === 'sources' && sourceListQuery.isFetching}
                onClick={() => {
                  if (workspace === 'sources') {
                    void sourceListQuery.refetch()
                    return
                  }
                  void message.success('列表已刷新')
                }}
              />
            </Tooltip>
          </div>
        </div>

        <div className="min-h-0 overflow-hidden px-4 pb-4 pt-3">
          {workspace === 'sources' ? (
            <Space className="w-full" orientation="vertical" size={10}>
              {sourceListQuery.isError ? (
                <Alert
                  showIcon
                  action={
                    <Button
                      size="small"
                      onClick={() => void sourceListQuery.refetch()}
                    >
                      重试
                    </Button>
                  }
                  title="数据源列表加载失败"
                  type="error"
                />
              ) : null}
              <Table
                className="w-full"
                columns={sourceColumns}
                dataSource={filteredSources}
                loading={sourceListQuery.isLoading}
                pagination={{ pageSize: 6, showSizeChanger: false }}
                rowKey="id"
                scroll={{ x: 1240 }}
                size="small"
                tableLayout="fixed"
              />
            </Space>
          ) : null}
          {workspace === 'endpoints' ? (
            <Space className="w-full" orientation="vertical" size={10}>
              {endpointListQuery.isError ? (
                <Alert
                  showIcon
                  action={
                    <Button
                      size="small"
                      onClick={() => void endpointListQuery.refetch()}
                    >
                      重试
                    </Button>
                  }
                  title="接入端点列表加载失败"
                  type="error"
                />
              ) : null}
              <Table
                className="w-full"
                columns={endpointColumns}
                dataSource={filteredEndpoints}
                loading={endpointListQuery.isLoading}
                pagination={{ pageSize: 6, showSizeChanger: false }}
                rowKey="id"
                scroll={{ x: 1260 }}
                size="small"
                tableLayout="fixed"
              />
            </Space>
          ) : null}
          {workspace === 'policies' ? (
            <Table
              columns={policyColumns}
              dataSource={filteredPolicies}
              pagination={{ pageSize: 6, showSizeChanger: false }}
              rowKey="id"
              scroll={{ x: 1220 }}
              size="small"
              tableLayout="fixed"
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
              tableLayout="fixed"
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
          <Button
            loading={createPending || updatePending}
            type="primary"
            onClick={() => sourceForm.submit()}
          >
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
          description="首版开放 PostgreSQL 与 HTTP API。敏感凭据可在创建时明文录入，保存后列表不回显原值。"
          type="info"
        />
        <Form
          form={sourceForm}
          layout="vertical"
          requiredMark="optional"
          onFinish={(values) => void submitDataSource(values)}
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
              extra="同一租户内必须唯一，创建后不可修改。建议使用稳定的英文业务标识。"
              label="数据源编码"
              name="code"
              rules={[
                { required: true, message: '请输入数据源编码' },
                {
                  pattern: /^[a-z][a-z0-9_-]*$/,
                  message: '使用小写字母开头，只包含字母、数字、下划线或连字符',
                },
              ]}
            >
              <Input
                disabled={Boolean(editingSourceId)}
                placeholder="customer-db"
              />
            </Form.Item>
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
          </div>
          {sourceType === 'postgresql' ? (
            <>
              <div className="grid grid-cols-[1fr_140px] gap-x-3 max-[560px]:grid-cols-1">
                <Form.Item
                  label="主机"
                  name="host"
                  rules={[
                    { required: true, message: '请输入 PostgreSQL 主机' },
                  ]}
                >
                  <Input placeholder="db.internal" />
                </Form.Item>
                <Form.Item
                  label="端口"
                  name="port"
                  rules={[{ required: true }]}
                >
                  <InputNumber className="w-full" max={65535} min={1} />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-x-3 max-[560px]:grid-cols-1">
                <Form.Item
                  label="数据库"
                  name="database"
                  rules={[{ required: true, message: '请输入数据库名' }]}
                >
                  <Input placeholder="customer" />
                </Form.Item>
                <Form.Item
                  label="Schema"
                  name="schemaName"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="public" />
                </Form.Item>
              </div>
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入只读用户名' }]}
              >
                <Input placeholder="reader" />
              </Form.Item>
              <div className="grid grid-cols-3 gap-x-3 max-[700px]:grid-cols-1">
                <Form.Item label="SSL 模式" name="sslMode">
                  <Select
                    options={['disable', 'prefer', 'require'].map((value) => ({
                      value,
                    }))}
                  />
                </Form.Item>
                <Form.Item label="连接超时（秒）" name="connectTimeoutSeconds">
                  <InputNumber className="w-full" max={60} min={1} />
                </Form.Item>
                <Form.Item label="连接池大小" name="poolSize">
                  <InputNumber className="w-full" max={20} min={1} />
                </Form.Item>
              </div>
            </>
          ) : (
            <>
              <Form.Item
                extra="Base URL 定义上游主机和可选路径前缀；探测路径只用于连接测试，不限制端点路径。"
                label="Base URL"
                name="baseUrl"
                rules={[
                  { required: true, message: '请输入 HTTP API 地址' },
                  { type: 'url', message: '请输入完整的 HTTP(S) URL' },
                ]}
              >
                <Input placeholder="https://api.example.com" />
              </Form.Item>
              <div className="grid grid-cols-[140px_1fr_140px] gap-x-3 max-[700px]:grid-cols-1">
                <Form.Item label="探测方法" name="healthMethod">
                  <Select
                    options={[
                      { value: 'GET', label: 'GET' },
                      { value: 'POST', label: 'POST' },
                    ]}
                    onChange={(value) => {
                      if (value === 'GET') {
                        sourceForm.setFieldValue('healthBodyJson', undefined)
                      }
                    }}
                  />
                </Form.Item>
                <Form.Item
                  label="探测路径"
                  name="healthPath"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="/health" />
                </Form.Item>
                <Form.Item
                  label="预期状态码"
                  name="healthExpectedStatus"
                  rules={[{ required: true }]}
                >
                  <InputNumber className="w-full" max={599} min={100} />
                </Form.Item>
              </div>
              <Form.Item
                extra="可选，必须是 JSON 对象，GET 和 POST 探测均可使用。"
                label="探测 Query 参数"
                name="healthQueryJson"
                rules={[{ validator: validateOptionalJsonObject }]}
              >
                <Input.TextArea
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  placeholder={'{"scope":"read"}'}
                />
              </Form.Item>
              {sourceHealthMethod === 'POST' ? (
                <Form.Item
                  extra="仅用于无副作用的 POST 探测，必须是 JSON 对象。"
                  label="探测 JSON Body"
                  name="healthBodyJson"
                  rules={[{ validator: validateOptionalJsonObject }]}
                >
                  <Input.TextArea
                    autoSize={{ minRows: 3, maxRows: 8 }}
                    placeholder={'{"conversation_id":"health-check"}'}
                  />
                </Form.Item>
              ) : null}
              <Form.Item
                extra="可选；留空时使用上述探测请求的 JSON 响应推断元数据。"
                label="元数据路径"
                name="metadataPath"
              >
                <Input placeholder="/metadata" />
              </Form.Item>
              <div className="grid grid-cols-2 gap-x-3 max-[560px]:grid-cols-1">
                <Form.Item label="鉴权方式" name="authType">
                  <Select
                    options={[
                      { label: '无鉴权', value: 'none' },
                      { label: 'Bearer Token', value: 'bearer' },
                      { label: 'API Key', value: 'api_key' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="鉴权请求头" name="authHeader">
                  <Input placeholder="Authorization / X-API-Key" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-x-3 max-[560px]:grid-cols-1">
                <Form.Item label="超时（秒）" name="timeoutSeconds">
                  <InputNumber className="w-full" max={60} min={1} />
                </Form.Item>
                <Form.Item
                  label="TLS 证书校验"
                  name="verifyTls"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="开" unCheckedChildren="关" />
                </Form.Item>
              </div>
            </>
          )}
          {sourceType === 'postgresql' || sourceAuthType !== 'none' ? (
            <Form.Item
              extra={
                editingSourceId
                  ? '留空将保留已有凭据；填写新值会覆盖原凭据。'
                  : '可直接填写数据库密码、Bearer Token 本体或 API Key，保存后不会在列表回显。'
              }
              label="凭据 Token / 密码 / API Key"
              name="credentialRef"
              rules={[
                {
                  required:
                    sourceType === 'http_api' &&
                    sourceAuthType !== 'none' &&
                    !editingSourceId,
                  message: '开启鉴权时需要填写凭据',
                },
              ]}
            >
              <Input.Password placeholder="粘贴 token、API key 或数据库密码" />
            </Form.Item>
          ) : null}
        </Form>
      </Drawer>

      <Modal
        destroyOnHidden
        footer={null}
        open={Boolean(metadataSource)}
        title={`${metadataSource?.name ?? ''} · 元数据`}
        width={760}
        onCancel={() => {
          setMetadataSource(undefined)
          metadataMutation.reset()
        }}
      >
        {metadataMutation.isError ? (
          <Alert
            showIcon
            className="mb-3"
            title="元数据探测失败"
            type="error"
          />
        ) : null}
        <Table
          columns={[
            { title: '资源', dataIndex: 'resource', width: 180 },
            { title: '资源类型', dataIndex: 'resourceType', width: 120 },
            { title: '字段', dataIndex: 'field', width: 180 },
            { title: '数据类型', dataIndex: 'dataType', width: 150 },
            {
              title: '可空',
              dataIndex: 'nullable',
              width: 80,
              render: (nullable: boolean) => (nullable ? '是' : '否'),
            },
          ]}
          dataSource={(metadataMutation.data?.resources ?? []).flatMap(
            (resource) =>
              resource.fields.length > 0
                ? resource.fields.map((field) => ({
                    key: `${resource.name}-${field.name}`,
                    resource: resource.name,
                    resourceType: resource.resource_type,
                    field: field.name,
                    dataType: field.data_type,
                    nullable: field.nullable,
                  }))
                : [
                    {
                      key: resource.name,
                      resource: resource.name,
                      resourceType: resource.resource_type,
                      field: '-',
                      dataType: '-',
                      nullable: true,
                    },
                  ],
          )}
          loading={metadataMutation.isPending}
          pagination={false}
          scroll={{ y: 440 }}
          size="small"
        />
      </Modal>

      <Modal
        centered
        destroyOnHidden
        forceRender
        confirmLoading={createEndpointPending || updateEndpointPending}
        open={endpointModalOpen}
        title={editingEndpointId ? '编辑接入端点' : '新建接入端点'}
        okText={editingEndpointId ? '保存修改' : '保存草稿'}
        cancelText="取消"
        width={760}
        onCancel={() => {
          setEndpointModalOpen(false)
          setEditingEndpointId(undefined)
          endpointForm.resetFields()
        }}
        onOk={() => endpointForm.submit()}
      >
        <Form
          form={endpointForm}
          layout="vertical"
          onFinish={(values) => void submitEndpoint(values)}
        >
          <div className="grid grid-cols-2 gap-x-3 max-[640px]:grid-cols-1">
            <Form.Item
              label="端点名称"
              name="name"
              rules={[{ required: true, message: '请输入端点名称' }]}
            >
              <Input placeholder="例如：客户资料查询" />
            </Form.Item>
            <Form.Item
              extra="同一租户内必须唯一，创建后不可修改，并用于网关调用路径。"
              label="端点编码"
              name="code"
              rules={[
                { required: true, message: '请输入端点编码' },
                {
                  pattern: /^[a-z][a-z0-9_-]*$/,
                  message: '以小写字母开头，只包含字母、数字、下划线或连字符',
                },
              ]}
            >
              <Input
                disabled={Boolean(editingEndpointId)}
                placeholder="customer-profile"
              />
            </Form.Item>
            <Form.Item
              label="数据源"
              name="sourceId"
              rules={[{ required: true, message: '请选择数据源' }]}
            >
              <Select
                placeholder="选择已配置的数据源"
                options={sources.map((source) => ({
                  value: source.id,
                  label: `${source.name} · ${SOURCE_TYPE_META[source.source_type].label}`,
                }))}
                onChange={() => {
                  endpointForm.setFieldsValue({
                    table: undefined,
                    path: undefined,
                    parameters: [],
                  })
                }}
              />
            </Form.Item>
            <Form.Item
              label="接入模式"
              name="mode"
              rules={[{ required: true }]}
            >
              <Select options={[{ value: 'PASSTHROUGH', label: '实时透传' }]} />
            </Form.Item>
          </div>

          {endpointSourceType === 'postgresql' ? (
            <Form.Item
              extra="可使用 schema.table，例如 public.customers"
              label="查询表"
              name="table"
              rules={[
                { required: true, message: '请输入要查询的表' },
                {
                  pattern:
                    /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/,
                  message: '仅支持 table 或 schema.table 格式',
                },
              ]}
            >
              <Input placeholder="public.customers" />
            </Form.Item>
          ) : null}

          {endpointSourceType === 'http_api' ? (
            <div className="grid grid-cols-[1fr_140px] gap-x-3 max-[640px]:grid-cols-1">
              <Form.Item
                label="API 路径"
                name="path"
                rules={[
                  { required: true, message: '请输入 API 路径' },
                  { pattern: /^\/[^\s]*$/, message: '路径必须以 / 开头' },
                ]}
              >
                <Input placeholder="/customers/profile" />
              </Form.Item>
              <Form.Item
                label="请求方法"
                name="method"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: 'GET', label: 'GET' },
                    { value: 'POST', label: 'POST' },
                  ]}
                />
              </Form.Item>
            </div>
          ) : null}

          <Form.Item
            extra="输入后按回车添加，这些是端点允许返回的字段"
            label="公开字段"
            name="availableFields"
            rules={[
              {
                required: true,
                type: 'array',
                min: 1,
                message: '请至少配置一个公开字段',
              },
            ]}
          >
            <Select
              mode="tags"
              placeholder="customer_id, name, status"
              tokenSeparators={[',', ' ']}
            />
          </Form.Item>

          <Form.List name="parameters">
            {(fields, { add, remove }) => (
              <Space className="w-full" orientation="vertical" size={8}>
                <div className="flex items-center justify-between">
                  <Typography.Text strong>请求参数</Typography.Text>
                  <Button
                    icon={<PlusOutlined />}
                    size="small"
                    type="dashed"
                    onClick={() =>
                      add({
                        name: '',
                        type: 'string',
                        required: false,
                        target:
                          endpointSourceType === 'http_api' ? 'query' : '',
                      })
                    }
                  >
                    添加参数
                  </Button>
                </div>
                {fields.length === 0 ? (
                  <Alert
                    showIcon
                    title="该端点当前不接收请求参数"
                    type="info"
                  />
                ) : null}
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    className="grid grid-cols-[1fr_130px_1fr_76px_32px] items-start gap-2 rounded-lg border border-(--border) p-2 max-[700px]:grid-cols-2"
                  >
                    <Form.Item
                      {...restField}
                      className="mb-0!"
                      name={[name, 'name']}
                      rules={[
                        { required: true, message: '请输入参数名' },
                        {
                          pattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
                          message: '参数名格式不正确',
                        },
                      ]}
                    >
                      <Input placeholder="customer_id" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      className="mb-0!"
                      name={[name, 'type']}
                      rules={[{ required: true }]}
                    >
                      <Select
                        options={[
                          { value: 'string', label: '字符串' },
                          { value: 'integer', label: '整数' },
                          { value: 'number', label: '数值' },
                          { value: 'boolean', label: '布尔' },
                          { value: 'uuid', label: 'UUID' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      className="mb-0!"
                      name={[name, 'target']}
                      rules={[{ required: true, message: '请配置映射' }]}
                    >
                      {endpointSourceType === 'http_api' ? (
                        <Select
                          options={[
                            { value: 'query', label: 'Query 参数' },
                            { value: 'body', label: 'Body 字段' },
                          ]}
                        />
                      ) : (
                        <Input placeholder="对应列，customer_id" />
                      )}
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      className="mb-0!"
                      name={[name, 'required']}
                      valuePropName="checked"
                    >
                      <Checkbox>必填</Checkbox>
                    </Form.Item>
                    <Button
                      danger
                      aria-label="删除参数"
                      icon={<DeleteOutlined />}
                      type="text"
                      onClick={() => remove(name)}
                    />
                  </div>
                ))}
              </Space>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Drawer
        destroyOnHidden
        open={Boolean(previewEndpoint)}
        size="large"
        title="接入端点预览"
        extra={
          previewEndpoint && previewEndpoint.status !== 'deprecated' ? (
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
              type={
                previewEndpoint.status === 'published'
                  ? 'success'
                  : previewEndpoint.status === 'deprecated'
                    ? 'warning'
                    : 'info'
              }
              title={
                previewEndpoint.status === 'published'
                  ? previewEndpoint.has_draft_changes
                    ? '该端点已发布，当前配置有待发布修改'
                    : '该端点已发布，可通过数据网关访问'
                  : previewEndpoint.status === 'deprecated'
                    ? '该端点已废弃，历史发布快照仍保留'
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
                      {previewEndpoint.endpoint_code}
                    </Typography.Text>
                  ),
                },
                {
                  key: 'source',
                  label: '数据源',
                  children:
                    sourceById.get(previewEndpoint.source_id)?.name ??
                    '未知数据源',
                },
                {
                  key: 'mode',
                  label: '接入模式',
                  children: previewEndpoint.mode,
                },
                {
                  key: 'version',
                  label: '版本',
                  children: previewEndpoint.published_version
                    ? `v${previewEndpoint.published_version}`
                    : '尚未发布',
                },
                {
                  key: 'fields',
                  label: '公开字段',
                  children: previewEndpoint.available_fields.length
                    ? previewEndpoint.available_fields.join(', ')
                    : '-',
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
              ]}
              size="small"
            />
            <div>
              <Typography.Text strong>调用路径</Typography.Text>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-(--border) bg-(--control-subtle-bg) p-3 text-xs leading-5 text-(--text)">
                {`POST /api/v1/data-gateway/endpoints/${previewEndpoint.endpoint_code}/query`}
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
                value: endpoint.endpoint_code,
                label: `${endpoint.name} (${endpoint.endpoint_code})`,
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
    </div>
  )
}

export default DataAccessConsole
