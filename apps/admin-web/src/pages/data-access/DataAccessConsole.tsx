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
import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { useAuthStore } from '@/store/useAuth'

import { useAccessEndpoints } from './hooks/useAccessEndpoints'
import { useDataSources } from './hooks/useDataSources'
import { useDataIngestionIntegrations } from './hooks/useDataIngestionIntegrations'
import { useFieldPolicies } from './hooks/useFieldPolicies'
import { useDataAccessLogs } from './hooks/useDataAccessLogs'
import {
  buildFieldPolicyCreateBody,
  buildFieldPolicyUpdateBody,
  fieldPolicyToRecord,
} from './utils/fieldPolicies'
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
  { labelKey: string; color: string }
> = {
  active: { labelKey: 'pages.dataAccess.status.source.active', color: 'green' },
  draft: { labelKey: 'pages.dataAccess.status.source.draft', color: 'default' },
  degraded: {
    labelKey: 'pages.dataAccess.status.source.degraded',
    color: 'red',
  },
}

const HEALTH_META: Record<HealthStatus, { labelKey: string; color: string }> = {
  healthy: {
    labelKey: 'pages.dataAccess.status.health.healthy',
    color: 'green',
  },
  unknown: {
    labelKey: 'pages.dataAccess.status.health.unknown',
    color: 'default',
  },
  unhealthy: {
    labelKey: 'pages.dataAccess.status.health.unhealthy',
    color: 'red',
  },
}

const ENDPOINT_STATUS_META: Record<
  EndpointStatus,
  { labelKey: string; color: string }
> = {
  published: {
    labelKey: 'pages.dataAccess.status.endpoint.published',
    color: 'green',
  },
  draft: { labelKey: 'pages.dataAccess.status.endpoint.draft', color: 'gold' },
  deprecated: {
    labelKey: 'pages.dataAccess.status.endpoint.deprecated',
    color: 'default',
  },
}

const POLICY_STATUS_META: Record<
  PolicyStatus,
  { labelKey: string; color: string }
> = {
  published: {
    labelKey: 'pages.dataAccess.status.policy.published',
    color: 'green',
  },
  draft: { labelKey: 'pages.dataAccess.status.policy.draft', color: 'gold' },
}

const USAGE_TARGET_META: Record<
  UsageTargetType,
  { labelKey: string; color: string }
> = {
  endpoint: {
    labelKey: 'pages.dataAccess.usage.target.endpoint',
    color: 'blue',
  },
  database: {
    labelKey: 'pages.dataAccess.usage.target.database',
    color: 'cyan',
  },
}

const WORKSPACE_META: Record<
  WorkspaceKey,
  { createLabelKey?: string; searchPlaceholderKey: string }
> = {
  sources: {
    createLabelKey: 'pages.dataAccess.actions.createSource',
    searchPlaceholderKey: 'pages.dataAccess.search.sources',
  },
  endpoints: {
    createLabelKey: 'pages.dataAccess.actions.createEndpoint',
    searchPlaceholderKey: 'pages.dataAccess.search.endpoints',
  },
  policies: {
    createLabelKey: 'pages.dataAccess.actions.createPolicy',
    searchPlaceholderKey: 'pages.dataAccess.search.policies',
  },
  usage: {
    searchPlaceholderKey: 'pages.dataAccess.search.usage',
  },
}

const I18N_VALUE_PREFIX = 'i18n:'

function localizeRecordValue(
  value: string,
  translate: (key: string) => string,
) {
  return value.startsWith(I18N_VALUE_PREFIX)
    ? translate(value.slice(I18N_VALUE_PREFIX.length))
    : value
}

function validateOptionalJsonObject(
  value: string | undefined,
  objectMessage: string,
  formatMessage: string,
) {
  if (!value?.trim()) return Promise.resolve()
  try {
    const parsed: unknown = JSON.parse(value)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return Promise.reject(new Error(objectMessage))
    }
    return Promise.resolve()
  } catch {
    return Promise.reject(new Error(formatMessage))
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
  const localizeValue = useCallback(
    (value: string) => localizeRecordValue(value, t),
    [t],
  )
  const [sourceForm] = Form.useForm<DataSourceFormValues>()
  const sourceType = Form.useWatch('type', sourceForm)
  const sourceAuthType = Form.useWatch('authType', sourceForm)
  const sourceHealthMethod = Form.useWatch('healthMethod', sourceForm)
  const [endpointForm] = Form.useForm<EndpointFormValues>()
  const endpointSourceId = Form.useWatch('sourceId', endpointForm)
  const [policyForm] = Form.useForm<PolicyFormValues>()
  const organizations = useAuthStore((state) => state.organizations)
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
  const {
    listQuery: fieldPolicyListQuery,
    records: fieldPolicyRecords,
    policiesCount,
    isLoading: fieldPoliciesLoading,
    isError: fieldPoliciesError,
    refetch: refetchFieldPolicies,
    createPolicy,
    createPending: createPolicyPending,
    updatePolicy,
    updatePending: updatePolicyPending,
    publishingPolicyId,
    publishPolicyAsync,
    simulatePolicy,
    simulating: simulatingPolicy,
  } = useFieldPolicies()
  const {
    listQuery: accessLogsListQuery,
    records: accessLogSourceRecords,
    count: accessLogsCount,
    isLoading: accessLogsLoading,
    isError: accessLogsError,
    refetch: refetchAccessLogs,
  } = useDataAccessLogs()
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
  // Backend FieldPolicyPublic exposes endpoint_id only; resolve the code via
  // the access-endpoints list (same page already loads it) so policy columns
  // are readable instead of showing the UUID.
  const endpointCodeById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const endpoint of endpoints) {
      if (endpoint.id) map[endpoint.id] = endpoint.endpoint_code
    }
    return map
  }, [endpoints])
  const tenantDisplayName = useMemo(() => {
    const tenant =
      organizations.find((item) => item.type === 'tenant' && item.is_primary) ??
      organizations.find((item) => item.type === 'tenant') ??
      organizations.find((item) => item.is_primary) ??
      organizations[0]
    return tenant?.name
  }, [organizations])
  const policies: FieldPolicyRecord[] = useMemo(
    () =>
      fieldPolicyRecords.map((policy) =>
        fieldPolicyToRecord(policy, endpointCodeById, tenantDisplayName),
      ),
    [fieldPolicyRecords, endpointCodeById, tenantDisplayName],
  )
  const policyTotal = policiesCount
  const accessLogRecords: UsageRecord[] = useMemo(
    () =>
      accessLogSourceRecords.map((log) => ({
        id: log.id,
        userName: log.user_name,
        userAccount: log.user_account,
        targetType:
          log.target_type === 'endpoint' ? 'endpoint' : 'database',
        targetName: log.target_name,
        targetCode: log.target_code,
        usedAt: log.accessed_at,
      })),
    [accessLogSourceRecords],
  )
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
          [
            localizeValue(policy.name),
            policy.endpointCode,
            localizeValue(policy.subject),
          ].some((value) => value.toLowerCase().includes(normalizedSearch))
        return matchesStatus && matchesSearch
      }),
    [localizeValue, normalizedSearch, policies, statusFilter],
  )

  const filteredUsageRecords = useMemo(
    () =>
      accessLogRecords.filter((record) => {
        const matchesType = !statusFilter || record.targetType === statusFilter
        const matchesSearch =
          !normalizedSearch ||
          [
            localizeValue(record.userName),
            record.userAccount,
            localizeValue(record.targetName),
            record.targetCode,
          ].some((value) => value.toLowerCase().includes(normalizedSearch))
        return matchesType && matchesSearch
      }),
    [accessLogRecords, localizeValue, normalizedSearch, statusFilter],
  )

  const runConnectionTest = async (source: DataSourceRecord) => {
    try {
      const result = await testSource(source.id)
      if (result.success) {
        void message.success(
          result.latency_ms === null
            ? t('pages.dataAccess.messages.connectionSucceeded', {
                name: source.name,
              })
            : t('pages.dataAccess.messages.connectionSucceededWithLatency', {
                name: source.name,
                latency: result.latency_ms,
              }),
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
        void message.success(t('pages.dataAccess.messages.sourceUpdated'))
      } else {
        await createSource(payload)
        void message.success(t('pages.dataAccess.messages.sourceCreated'))
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
      title: t('pages.dataAccess.confirm.deleteSource.title'),
      content: t('pages.dataAccess.confirm.deleteSource.content', {
        name: source.name,
      }),
      okText: t('pages.dataAccess.actions.delete'),
      okButtonProps: { danger: true },
      cancelText: t('pages.dataAccess.actions.cancel'),
      onOk: async () => {
        await deleteSource(source.id)
        void message.success(t('pages.dataAccess.messages.sourceDeleted'))
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
      void message.error(t('pages.dataAccess.validation.selectValidSource'))
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
        void message.success(t('pages.dataAccess.messages.endpointUpdated'))
      } else {
        await createEndpoint(payload)
        void message.success(t('pages.dataAccess.messages.endpointCreated'))
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
        ? t('pages.dataAccess.confirm.publishEndpoint.newVersionTitle', {
            version,
          })
        : t('pages.dataAccess.confirm.publishEndpoint.title'),
      content: t('pages.dataAccess.confirm.publishEndpoint.content', {
        version,
      }),
      okText: t('pages.dataAccess.actions.confirmPublish'),
      cancelText: t('pages.dataAccess.actions.cancel'),
      onOk: async () => {
        await publishEndpoint(endpoint.id)
        void message.success(
          t('pages.dataAccess.messages.endpointPublished', {
            name: endpoint.name,
            version,
          }),
        )
      },
    })
  }

  const confirmDeleteEndpoint = (endpoint: AccessEndpointRecord) => {
    modal.confirm({
      title: t('pages.dataAccess.confirm.deleteEndpoint.title'),
      content: t('pages.dataAccess.confirm.deleteEndpoint.content', {
        name: endpoint.name,
      }),
      okText: t('pages.dataAccess.actions.delete'),
      okButtonProps: { danger: true },
      cancelText: t('pages.dataAccess.actions.cancel'),
      onOk: async () => {
        await deleteEndpoint(endpoint.id)
        void message.success(t('pages.dataAccess.messages.endpointDeleted'))
      },
    })
  }

  const confirmDeprecateEndpoint = (endpoint: AccessEndpointRecord) => {
    modal.confirm({
      title: t('pages.dataAccess.confirm.deprecateEndpoint.title'),
      content: t('pages.dataAccess.confirm.deprecateEndpoint.content', {
        name: endpoint.name,
      }),
      okText: t('pages.dataAccess.actions.confirmDeprecate'),
      okButtonProps: { danger: true },
      cancelText: t('pages.dataAccess.actions.cancel'),
      onOk: async () => {
        await deprecateEndpoint(endpoint.id)
        void message.success(
          t('pages.dataAccess.messages.endpointDeprecated', {
            name: endpoint.name,
          }),
        )
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
      name: localizeValue(policy.name),
      endpointCode: policy.endpointCode,
      subject: policy.subjectId,
      allowedFields: policy.allowedFields,
    })
    setPolicyModalOpen(true)
  }

  const submitPolicy = (values: PolicyFormValues) => {
    const endpoint = endpoints.find(
      (item) => item.endpoint_code === values.endpointCode,
    )
    if (!endpoint) {
      void message.error(t('pages.dataAccess.validation.selectValidEndpoint'))
      return
    }
    const endpointVersion = endpoint.published_version
    const baseBody = buildFieldPolicyCreateBody({
      endpointCode: values.endpointCode,
      endpointVersion,
      form: values,
    })

    if (editingPolicyId) {
      const current = policies.find((policy) => policy.id === editingPolicyId)
      if (!current) {
        void message.error(t('pages.dataAccess.errors.policyNotFound'))
        return
      }
      const updateBody = buildFieldPolicyUpdateBody({
        endpointCode: values.endpointCode,
        endpointVersion,
        form: values,
        expectedVersion: current.version,
      })
      void updatePolicy({
        policyId: editingPolicyId,
        data: updateBody,
      })
        .then(() => {
          void message.success(t('pages.dataAccess.messages.policyUpdated'))
        })
        .catch((error: unknown) => {
          void message.error(
            error instanceof Error ? error.message : String(error),
          )
        })
        .finally(() => {
          setEditingPolicyId(undefined)
          policyForm.resetFields()
          setPolicyModalOpen(false)
        })
      return
    }

    void createPolicy(baseBody)
      .then(() => {
        void message.success(t('pages.dataAccess.messages.policyCreated'))
      })
      .catch((caught: unknown) => {
        const messageText =
          caught instanceof Error ? caught.message : String(caught)
        void message.error(messageText)
      })
      .finally(() => {
        setEditingPolicyId(undefined)
        policyForm.resetFields()
        setPolicyModalOpen(false)
      })
  }

  const handlePublishPolicy = (policy: FieldPolicyRecord) => {
    void publishPolicyAsync({
      policyId: policy.id,
      data: { expected_version: policy.version },
    })
      .then(() => {
        void message.success(
          t('pages.dataAccess.messages.policyPublished', {
            name: localizeValue(policy.name),
          }),
        )
      })
      .catch((caught: unknown) => {
        const messageText =
          caught instanceof Error ? caught.message : String(caught)
        void message.error(messageText)
      })
  }

  const openSimulation = (policy: FieldPolicyRecord) => {
    setSimulationPolicy(policy)
    setSimulationFields(policy.allowedFields.slice(0, 2))
    setSimulationDecision(undefined)
  }

  const runPolicySimulation = () => {
    if (!simulationPolicy) return
    void simulatePolicy({
      endpoint_code: simulationPolicy.endpointCode,
      endpoint_version: simulationPolicy.endpointVersion,
      subject_type: simulationPolicy.subjectType,
      subject_id: simulationPolicy.subjectId,
      requested_fields: simulationFields,
      policy_id: simulationPolicy.id,
    })
      .then((result) => {
        setSimulationDecision({
          effect: result.effect,
          deniedFields: result.denied_fields,
        })
      })
      .catch((caught: unknown) => {
        const messageText =
          caught instanceof Error ? caught.message : String(caught)
        void message.error(messageText)
      })
  }

  const sourceColumns: TableProps<DataSourceRecord>['columns'] = [
    {
      title: t('pages.dataAccess.columns.source'),
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
      title: t('pages.dataAccess.columns.type'),
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
      title: t('pages.dataAccess.columns.code'),
      dataIndex: 'code',
      width: 150,
      align: 'center',
      render: (value: string) => <OverflowText code>{value}</OverflowText>,
    },
    {
      title: t('pages.dataAccess.columns.status'),
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (value: DataSourceStatus) => (
        <Tag color={SOURCE_STATUS_META[value].color}>
          {t(SOURCE_STATUS_META[value].labelKey)}
        </Tag>
      ),
    },
    {
      title: t('pages.dataAccess.columns.health'),
      dataIndex: 'health',
      width: 150,
      align: 'center',
      render: (value: HealthStatus, record) => (
        <Space align="center" size={6}>
          <Tag color={HEALTH_META[value].color}>
            {t(HEALTH_META[value].labelKey)}
          </Tag>
          {record.latency_ms !== null ? (
            <Typography.Text type="secondary">
              {record.latency_ms} ms
            </Typography.Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: t('pages.dataAccess.columns.lastTested'),
      dataIndex: 'last_tested_at',
      width: 170,
      align: 'center',
      render: (value: string | null) =>
        value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: t('pages.dataAccess.columns.actions'),
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
            {t('pages.dataAccess.actions.test')}
          </Button>
          <Button
            icon={<EyeOutlined />}
            type="link"
            onClick={() => void openMetadata(record)}
          >
            {t('pages.dataAccess.actions.metadata')}
          </Button>
          <Button
            icon={<SettingOutlined />}
            type="link"
            onClick={() => openEditDataSource(record)}
          >
            {t('pages.dataAccess.actions.configure')}
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            loading={deletePendingId === record.id}
            type="link"
            onClick={() => confirmDeleteDataSource(record)}
          >
            {t('pages.dataAccess.actions.delete')}
          </Button>
        </Space>
      ),
    },
  ]

  const endpointColumns: TableProps<AccessEndpointRecord>['columns'] = [
    {
      title: t('pages.dataAccess.columns.endpoint'),
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
      title: t('pages.dataAccess.columns.source'),
      dataIndex: 'source_id',
      width: 170,
      align: 'center',
      render: (value: string) => (
        <OverflowText>
          {sourceById.get(value)?.name ??
            t('pages.dataAccess.common.unknownSource')}
        </OverflowText>
      ),
    },
    {
      title: t('pages.dataAccess.columns.mode'),
      dataIndex: 'mode',
      width: 130,
      align: 'center',
      render: (value: AccessEndpointRecord['mode']) => (
        <Tag color="blue">{value}</Tag>
      ),
    },
    {
      title: t('pages.dataAccess.columns.fields'),
      dataIndex: 'available_fields',
      width: 90,
      align: 'center',
      render: (value: string[]) =>
        t('pages.dataAccess.units.fields', { count: value.length }),
    },
    {
      title: t('pages.dataAccess.columns.version'),
      dataIndex: 'published_version',
      width: 80,
      align: 'center',
      render: (value: number) => (value ? `v${value}` : '-'),
    },
    {
      title: t('pages.dataAccess.columns.status'),
      dataIndex: 'status',
      width: 130,
      align: 'center',
      render: (value: EndpointStatus, record) => (
        <Space align="center" orientation="vertical" size={2}>
          <Tag color={ENDPOINT_STATUS_META[value].color}>
            {t(ENDPOINT_STATUS_META[value].labelKey)}
          </Tag>
          {value === 'published' && record.has_draft_changes ? (
            <Typography.Text type="warning">
              {t('pages.dataAccess.endpoint.hasDraftChanges')}
            </Typography.Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: t('pages.dataAccess.columns.updatedAt'),
      dataIndex: 'updated_at',
      width: 170,
      align: 'center',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('pages.dataAccess.columns.actions'),
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
              {t('pages.dataAccess.actions.preview')}
            </Button>
            {record.status !== 'deprecated' ? (
              <Button
                icon={<EditOutlined />}
                type="link"
                onClick={() => openEditEndpoint(record)}
              >
                {t('pages.dataAccess.actions.edit')}
              </Button>
            ) : null}
            {canPublish ? (
              <Button
                icon={<RocketOutlined />}
                loading={publishingEndpointId === record.id}
                type="link"
                onClick={() => confirmPublishEndpoint(record)}
              >
                {record.published_version
                  ? t('pages.dataAccess.actions.publishNewVersion')
                  : t('pages.dataAccess.actions.publish')}
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
                {t('pages.dataAccess.actions.delete')}
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
                {t('pages.dataAccess.actions.deprecate')}
              </Button>
            ) : null}
          </Space>
        )
      },
    },
  ]

  const policyColumns: TableProps<FieldPolicyRecord>['columns'] = [
    {
      title: t('pages.dataAccess.columns.policy'),
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
          <OverflowText strong>{localizeValue(value)}</OverflowText>
          <OverflowText type="secondary">{record.endpointCode}</OverflowText>
        </Space>
      ),
    },
    {
      title: t('pages.dataAccess.columns.subject'),
      dataIndex: 'subject',
      width: 220,
      align: 'center',
      render: (value: string) => (
        <OverflowText>{localizeValue(value)}</OverflowText>
      ),
    },
    {
      title: t('pages.dataAccess.columns.allowedFields'),
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
      title: t('pages.dataAccess.columns.deniedFields'),
      dataIndex: 'deniedFields',
      width: 160,
      align: 'center',
      render: (value: string[]) =>
        value.length ? (
          <Tag color="red">
            {t('pages.dataAccess.units.fields', { count: value.length })}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: t('pages.dataAccess.columns.version'),
      dataIndex: 'version',
      width: 80,
      align: 'center',
      render: (value: number) => `v${value}`,
    },
    {
      title: t('pages.dataAccess.columns.status'),
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (value: PolicyStatus) => (
        <Tag color={POLICY_STATUS_META[value].color}>
          {t(POLICY_STATUS_META[value].labelKey)}
        </Tag>
      ),
    },
    {
      title: t('pages.dataAccess.columns.updatedAt'),
      dataIndex: 'updatedAt',
      width: 130,
      align: 'center',
      render: (value: string) =>
        value === '__just_now__'
          ? t('pages.dataAccess.time.justNow')
          : localizeValue(value),
    },
    {
      title: t('pages.dataAccess.columns.actions'),
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
            {t('pages.dataAccess.actions.simulate')}
          </Button>
          <Button
            icon={<EditOutlined />}
            type="link"
            onClick={() => openEditPolicy(record)}
          >
            {t('pages.dataAccess.actions.edit')}
          </Button>
          {record.status === 'draft' ? (
            <Button
              icon={<RocketOutlined />}
              loading={publishingPolicyId === record.id}
              type="link"
              onClick={() => handlePublishPolicy(record)}
            >
              {t('pages.dataAccess.actions.publish')}
            </Button>
          ) : null}
        </Space>
      ),
    },
  ]

  const usageColumns: TableProps<UsageRecord>['columns'] = [
    {
      title: t('pages.dataAccess.columns.user'),
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
          <OverflowText strong>{localizeValue(value)}</OverflowText>
          <OverflowText type="secondary">{record.userAccount}</OverflowText>
        </Space>
      ),
    },
    {
      title: t('pages.dataAccess.columns.accessType'),
      dataIndex: 'targetType',
      width: 130,
      align: 'center',
      render: (value: UsageTargetType) => (
        <Tag color={USAGE_TARGET_META[value].color}>
          {t(USAGE_TARGET_META[value].labelKey)}
        </Tag>
      ),
    },
    {
      title: t('pages.dataAccess.columns.accessTarget'),
      dataIndex: 'targetName',
      align: 'center',
      render: (value: string, record) => (
        <Space
          align="center"
          className="min-w-0 max-w-full"
          orientation="vertical"
          size={1}
        >
          <OverflowText strong>{localizeValue(value)}</OverflowText>
          <OverflowText code>{record.targetCode}</OverflowText>
        </Space>
      ),
    },
    {
      title: t('pages.dataAccess.columns.usedAt'),
      dataIndex: 'usedAt',
      width: 190,
      align: 'center',
    },
  ]

  const statusOptions =
    workspace === 'sources'
      ? Object.entries(SOURCE_STATUS_META).map(([value, meta]) => ({
          value,
          label: t(meta.labelKey),
        }))
      : workspace === 'endpoints'
        ? Object.entries(ENDPOINT_STATUS_META).map(([value, meta]) => ({
            value,
            label: t(meta.labelKey),
          }))
        : workspace === 'policies'
          ? Object.entries(POLICY_STATUS_META).map(([value, meta]) => ({
              value,
              label: t(meta.labelKey),
            }))
          : Object.entries(USAGE_TARGET_META).map(([value, meta]) => ({
              value,
              label: t(meta.labelKey),
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
        title={t('pages.dataAccess.title')}
        subtitle={t('pages.dataAccess.subtitle')}
      >
        <Space wrap>
          {WORKSPACE_META[workspace].createLabelKey ? (
            <Button icon={<PlusOutlined />} type="primary" onClick={openCreate}>
              {t(WORKSPACE_META[workspace].createLabelKey)}
            </Button>
          ) : null}
        </Space>
      </PageHeader>

      <div className="grid grid-cols-4 gap-2.5 max-[1100px]:grid-cols-2 max-[620px]:grid-cols-1">
        <MetricTile
          icon={<DatabaseOutlined />}
          label={t('pages.dataAccess.metrics.sources.label')}
          note={t('pages.dataAccess.metrics.sources.note')}
          tone="blue"
          value={sourceTotal}
        />
        <MetricTile
          icon={<CheckCircleOutlined />}
          label={t('pages.dataAccess.metrics.health.label')}
          note={t('pages.dataAccess.metrics.health.note', {
            count: Math.max(sourceTotal - healthySourceCount, 0),
          })}
          tone="green"
          value={healthySourceCount}
        />
        <MetricTile
          icon={<ApiOutlined />}
          label={t('pages.dataAccess.metrics.endpoints.label')}
          note={t('pages.dataAccess.metrics.endpoints.note', {
            count: endpoints.filter((item) => item.has_draft_changes).length,
          })}
          tone="purple"
          value={publishedEndpointCount}
        />
        <MetricTile
          icon={<SafetyCertificateOutlined />}
          label={t('pages.dataAccess.metrics.policies.label')}
          note={t('pages.dataAccess.metrics.policies.note')}
          tone="orange"
          value={publishedPolicyCount}
        />
      </div>

      <PageContainer className="mt-2.5 rounded-lg! p-3.5">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <Typography.Text strong>
            {t('pages.dataAccess.foundation.title')}
          </Typography.Text>
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
            role={t('pages.dataAccess.foundation.openDalRole')}
            status={t('pages.dataAccess.status.connected')}
            statusColor="green"
          />
          <FoundationItem
            icon={<SafetyCertificateOutlined />}
            name={t('pages.dataAccess.foundation.gatewayName')}
            role={t('pages.dataAccess.foundation.gatewayRole')}
            status={t('pages.dataAccess.status.connected')}
            statusColor="green"
          />
        </div>
      </PageContainer>

      <PageContainer className="mt-2.5 min-h-110 rounded-lg! p-0">
        <Tabs
          activeKey={workspace}
          className="[&_.ant-tabs-nav]:mb-0! [&_.ant-tabs-nav]:px-4 [&_.ant-tabs-tab]:py-3! [&_.ant-tabs-content-holder]:min-h-0"
          items={[
            {
              key: 'sources',
              label: t('pages.dataAccess.tabs.sources', { count: sourceTotal }),
            },
            {
              key: 'endpoints',
              label: t('pages.dataAccess.tabs.endpoints', {
                count: endpointTotal,
              }),
            },
            {
              key: 'policies',
              label: t('pages.dataAccess.tabs.policies', {
                count: policyTotal,
              }),
            },
            {
              key: 'usage',
              label: t('pages.dataAccess.tabs.usage', {
                count: accessLogsCount,
              }),
            },
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
            placeholder={t(WORKSPACE_META[workspace].searchPlaceholderKey)}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <Select
            allowClear
            className="w-34"
            options={statusOptions}
            placeholder={
              workspace === 'usage'
                ? t('pages.dataAccess.filters.allTypes')
                : t('pages.dataAccess.filters.allStatuses')
            }
            suffixIcon={<FilterOutlined />}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <div className="ms-auto">
            <Tooltip title={t('pages.dataAccess.actions.refresh')}>
              <Button
                aria-label={t('pages.dataAccess.actions.refresh')}
                icon={<ReloadOutlined />}
                loading={
                  (workspace === 'sources' && sourceListQuery.isFetching) ||
                  (workspace === 'endpoints' &&
                    endpointListQuery.isFetching) ||
                  (workspace === 'policies' &&
                    fieldPolicyListQuery.isFetching) ||
                  (workspace === 'usage' && accessLogsListQuery.isFetching)
                }
                onClick={() => {
                  if (workspace === 'sources') {
                    void sourceListQuery.refetch()
                    return
                  }
                  if (workspace === 'endpoints') {
                    void endpointListQuery.refetch()
                    return
                  }
                  if (workspace === 'policies') {
                    refetchFieldPolicies()
                    return
                  }
                  if (workspace === 'usage') {
                    refetchAccessLogs()
                    return
                  }
                  void message.success(
                    t('pages.dataAccess.messages.listRefreshed'),
                  )
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
                      {t('pages.dataAccess.actions.retry')}
                    </Button>
                  }
                  title={t('pages.dataAccess.errors.sourceList')}
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
                      {t('pages.dataAccess.actions.retry')}
                    </Button>
                  }
                  title={t('pages.dataAccess.errors.endpointList')}
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
            <Space className="w-full" orientation="vertical" size={10}>
              {fieldPoliciesError ? (
                <Alert
                  showIcon
                  action={
                    <Button
                      size="small"
                      onClick={() => refetchFieldPolicies()}
                    >
                      {t('pages.dataAccess.actions.retry')}
                    </Button>
                  }
                  title={t('pages.dataAccess.errors.policyList')}
                  type="error"
                />
              ) : null}
              <Table
                columns={policyColumns}
                dataSource={filteredPolicies}
                loading={fieldPoliciesLoading}
                locale={{
                  emptyText:
                    policyTotal === 0
                      ? t('pages.dataAccess.empty.policies')
                      : undefined,
                }}
                pagination={{ pageSize: 6, showSizeChanger: false }}
                rowKey="id"
                scroll={{ x: 1220 }}
                size="small"
                tableLayout="fixed"
              />
            </Space>
          ) : null}
          {workspace === 'usage' ? (
            <Space className="w-full" orientation="vertical" size={10}>
              {accessLogsError ? (
                <Alert
                  showIcon
                  action={
                    <Button
                      size="small"
                      onClick={() => refetchAccessLogs()}
                    >
                      {t('pages.dataAccess.actions.retry')}
                    </Button>
                  }
                  title={t('pages.dataAccess.errors.usageList')}
                  type="error"
                />
              ) : null}
              <Table
                columns={usageColumns}
                dataSource={filteredUsageRecords}
                loading={accessLogsLoading}
                locale={{
                  emptyText:
                    accessLogsCount === 0
                      ? t('pages.dataAccess.empty.usage')
                      : undefined,
                }}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                rowKey="id"
                scroll={{ x: 900 }}
                size="small"
                tableLayout="fixed"
              />
            </Space>
          ) : null}
        </div>
      </PageContainer>

      <Drawer
        destroyOnHidden
        forceRender
        open={sourceDrawerOpen}
        size="large"
        title={
          editingSourceId
            ? t('pages.dataAccess.sourceForm.editTitle')
            : t('pages.dataAccess.sourceForm.createTitle')
        }
        extra={
          <Button
            loading={createPending || updatePending}
            type="primary"
            onClick={() => sourceForm.submit()}
          >
            {editingSourceId
              ? t('pages.dataAccess.actions.saveConfig')
              : t('pages.dataAccess.actions.saveDraft')}
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
          title={t('pages.dataAccess.sourceForm.connectorTitle')}
          description={t('pages.dataAccess.sourceForm.connectorDescription')}
          type="info"
        />
        <Form
          form={sourceForm}
          layout="vertical"
          requiredMark={(label, { required }) => (
            <Space size={4}>
              {label}
              {!required ? (
                <Typography.Text type="secondary">
                  ({t('pages.dataAccess.common.optional')})
                </Typography.Text>
              ) : null}
            </Space>
          )}
          onFinish={(values) => void submitDataSource(values)}
        >
          <Form.Item
            label={t('pages.dataAccess.sourceForm.name')}
            name="name"
            rules={[
              {
                required: true,
                message: t('pages.dataAccess.validation.sourceNameRequired'),
              },
            ]}
          >
            <Input
              placeholder={t('pages.dataAccess.sourceForm.namePlaceholder')}
            />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-3 max-[560px]:grid-cols-1">
            <Form.Item
              extra={t('pages.dataAccess.sourceForm.codeHelp')}
              label={t('pages.dataAccess.sourceForm.code')}
              name="code"
              rules={[
                {
                  required: true,
                  message: t('pages.dataAccess.validation.sourceCodeRequired'),
                },
                {
                  pattern: /^[a-z][a-z0-9_-]*$/,
                  message: t('pages.dataAccess.validation.codePattern'),
                },
              ]}
            >
              <Input
                disabled={Boolean(editingSourceId)}
                placeholder="customer-db"
              />
            </Form.Item>
            <Form.Item
              label={t('pages.dataAccess.sourceForm.connectorType')}
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
                  label={t('pages.dataAccess.sourceForm.host')}
                  name="host"
                  rules={[
                    {
                      required: true,
                      message: t(
                        'pages.dataAccess.validation.postgresHostRequired',
                      ),
                    },
                  ]}
                >
                  <Input placeholder="db.internal" />
                </Form.Item>
                <Form.Item
                  label={t('pages.dataAccess.sourceForm.port')}
                  name="port"
                  rules={[{ required: true }]}
                >
                  <InputNumber className="w-full" max={65535} min={1} />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-x-3 max-[560px]:grid-cols-1">
                <Form.Item
                  label={t('pages.dataAccess.sourceForm.database')}
                  name="database"
                  rules={[
                    {
                      required: true,
                      message: t(
                        'pages.dataAccess.validation.databaseRequired',
                      ),
                    },
                  ]}
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
                label={t('pages.dataAccess.sourceForm.username')}
                name="username"
                rules={[
                  {
                    required: true,
                    message: t('pages.dataAccess.validation.usernameRequired'),
                  },
                ]}
              >
                <Input placeholder="reader" />
              </Form.Item>
              <div className="grid grid-cols-3 gap-x-3 max-[700px]:grid-cols-1">
                <Form.Item
                  label={t('pages.dataAccess.sourceForm.sslMode')}
                  name="sslMode"
                >
                  <Select
                    options={['disable', 'prefer', 'require'].map((value) => ({
                      value,
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  label={t('pages.dataAccess.sourceForm.connectTimeout')}
                  name="connectTimeoutSeconds"
                >
                  <InputNumber className="w-full" max={60} min={1} />
                </Form.Item>
                <Form.Item
                  label={t('pages.dataAccess.sourceForm.poolSize')}
                  name="poolSize"
                >
                  <InputNumber className="w-full" max={20} min={1} />
                </Form.Item>
              </div>
            </>
          ) : (
            <>
              <Form.Item
                extra={t('pages.dataAccess.sourceForm.baseUrlHelp')}
                label="Base URL"
                name="baseUrl"
                rules={[
                  {
                    required: true,
                    message: t('pages.dataAccess.validation.httpUrlRequired'),
                  },
                  {
                    type: 'url',
                    message: t('pages.dataAccess.validation.httpUrlComplete'),
                  },
                ]}
              >
                <Input placeholder="https://api.example.com" />
              </Form.Item>
              <div className="grid grid-cols-[140px_1fr_140px] gap-x-3 max-[700px]:grid-cols-1">
                <Form.Item
                  label={t('pages.dataAccess.sourceForm.healthMethod')}
                  name="healthMethod"
                >
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
                  label={t('pages.dataAccess.sourceForm.healthPath')}
                  name="healthPath"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="/health" />
                </Form.Item>
                <Form.Item
                  label={t('pages.dataAccess.sourceForm.expectedStatus')}
                  name="healthExpectedStatus"
                  rules={[{ required: true }]}
                >
                  <InputNumber className="w-full" max={599} min={100} />
                </Form.Item>
              </div>
              <Form.Item
                extra={t('pages.dataAccess.sourceForm.healthQueryHelp')}
                label={t('pages.dataAccess.sourceForm.healthQuery')}
                name="healthQueryJson"
                rules={[
                  {
                    validator: (_rule, value?: string) =>
                      validateOptionalJsonObject(
                        value,
                        t('pages.dataAccess.validation.jsonObject'),
                        t('pages.dataAccess.validation.jsonInvalid'),
                      ),
                  },
                ]}
              >
                <Input.TextArea
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  placeholder={'{"scope":"read"}'}
                />
              </Form.Item>
              {sourceHealthMethod === 'POST' ? (
                <Form.Item
                  extra={t('pages.dataAccess.sourceForm.healthBodyHelp')}
                  label={t('pages.dataAccess.sourceForm.healthBody')}
                  name="healthBodyJson"
                  rules={[
                    {
                      validator: (_rule, value?: string) =>
                        validateOptionalJsonObject(
                          value,
                          t('pages.dataAccess.validation.jsonObject'),
                          t('pages.dataAccess.validation.jsonInvalid'),
                        ),
                    },
                  ]}
                >
                  <Input.TextArea
                    autoSize={{ minRows: 3, maxRows: 8 }}
                    placeholder={'{"conversation_id":"health-check"}'}
                  />
                </Form.Item>
              ) : null}
              <Form.Item
                extra={t('pages.dataAccess.sourceForm.metadataPathHelp')}
                label={t('pages.dataAccess.sourceForm.metadataPath')}
                name="metadataPath"
              >
                <Input placeholder="/metadata" />
              </Form.Item>
              <div className="grid grid-cols-2 gap-x-3 max-[560px]:grid-cols-1">
                <Form.Item
                  label={t('pages.dataAccess.sourceForm.authType')}
                  name="authType"
                >
                  <Select
                    options={[
                      {
                        label: t('pages.dataAccess.sourceForm.authNone'),
                        value: 'none',
                      },
                      { label: 'Bearer Token', value: 'bearer' },
                      { label: 'API Key', value: 'api_key' },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  label={t('pages.dataAccess.sourceForm.authHeader')}
                  name="authHeader"
                >
                  <Input placeholder="Authorization / X-API-Key" />
                </Form.Item>
              </div>
              <div className="grid grid-cols-2 gap-x-3 max-[560px]:grid-cols-1">
                <Form.Item
                  label={t('pages.dataAccess.sourceForm.timeout')}
                  name="timeoutSeconds"
                >
                  <InputNumber className="w-full" max={60} min={1} />
                </Form.Item>
                <Form.Item
                  label={t('pages.dataAccess.sourceForm.verifyTls')}
                  name="verifyTls"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren={t('pages.dataAccess.common.on')}
                    unCheckedChildren={t('pages.dataAccess.common.off')}
                  />
                </Form.Item>
              </div>
            </>
          )}
          {sourceType === 'postgresql' || sourceAuthType !== 'none' ? (
            <Form.Item
              extra={
                editingSourceId
                  ? t('pages.dataAccess.sourceForm.credentialEditHelp')
                  : t('pages.dataAccess.sourceForm.credentialCreateHelp')
              }
              label={t('pages.dataAccess.sourceForm.credential')}
              name="credentialRef"
              rules={[
                {
                  required:
                    sourceType === 'http_api' &&
                    sourceAuthType !== 'none' &&
                    !editingSourceId,
                  message: t('pages.dataAccess.validation.credentialRequired'),
                },
              ]}
            >
              <Input.Password
                placeholder={t(
                  'pages.dataAccess.sourceForm.credentialPlaceholder',
                )}
              />
            </Form.Item>
          ) : null}
        </Form>
      </Drawer>

      <Modal
        destroyOnHidden
        footer={null}
        open={Boolean(metadataSource)}
        title={t('pages.dataAccess.metadata.title', {
          name: metadataSource?.name ?? '',
        })}
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
            title={t('pages.dataAccess.metadata.error')}
            type="error"
          />
        ) : null}
        <Table
          columns={[
            {
              title: t('pages.dataAccess.columns.resource'),
              dataIndex: 'resource',
              width: 180,
            },
            {
              title: t('pages.dataAccess.columns.resourceType'),
              dataIndex: 'resourceType',
              width: 120,
            },
            {
              title: t('pages.dataAccess.columns.fields'),
              dataIndex: 'field',
              width: 180,
            },
            {
              title: t('pages.dataAccess.columns.dataType'),
              dataIndex: 'dataType',
              width: 150,
            },
            {
              title: t('pages.dataAccess.columns.nullable'),
              dataIndex: 'nullable',
              width: 80,
              render: (nullable: boolean) =>
                nullable
                  ? t('pages.dataAccess.common.yes')
                  : t('pages.dataAccess.common.no'),
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
        title={
          editingEndpointId
            ? t('pages.dataAccess.endpointForm.editTitle')
            : t('pages.dataAccess.endpointForm.createTitle')
        }
        okText={
          editingEndpointId
            ? t('pages.dataAccess.actions.saveChanges')
            : t('pages.dataAccess.actions.saveDraft')
        }
        cancelText={t('pages.dataAccess.actions.cancel')}
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
              label={t('pages.dataAccess.endpointForm.name')}
              name="name"
              rules={[
                {
                  required: true,
                  message: t(
                    'pages.dataAccess.validation.endpointNameRequired',
                  ),
                },
              ]}
            >
              <Input
                placeholder={t('pages.dataAccess.endpointForm.namePlaceholder')}
              />
            </Form.Item>
            <Form.Item
              extra={t('pages.dataAccess.endpointForm.codeHelp')}
              label={t('pages.dataAccess.endpointForm.code')}
              name="code"
              rules={[
                {
                  required: true,
                  message: t(
                    'pages.dataAccess.validation.endpointCodeRequired',
                  ),
                },
                {
                  pattern: /^[a-z][a-z0-9_-]*$/,
                  message: t('pages.dataAccess.validation.codePattern'),
                },
              ]}
            >
              <Input
                disabled={Boolean(editingEndpointId)}
                placeholder="customer-profile"
              />
            </Form.Item>
            <Form.Item
              label={t('pages.dataAccess.endpointForm.source')}
              name="sourceId"
              rules={[
                {
                  required: true,
                  message: t('pages.dataAccess.validation.sourceRequired'),
                },
              ]}
            >
              <Select
                placeholder={t(
                  'pages.dataAccess.endpointForm.sourcePlaceholder',
                )}
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
              label={t('pages.dataAccess.endpointForm.mode')}
              name="mode"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  {
                    value: 'PASSTHROUGH',
                    label: t('pages.dataAccess.endpointForm.passthrough'),
                  },
                ]}
              />
            </Form.Item>
          </div>

          {endpointSourceType === 'postgresql' ? (
            <Form.Item
              extra={t('pages.dataAccess.endpointForm.tableHelp')}
              label={t('pages.dataAccess.endpointForm.table')}
              name="table"
              rules={[
                {
                  required: true,
                  message: t('pages.dataAccess.validation.tableRequired'),
                },
                {
                  pattern:
                    /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/,
                  message: t('pages.dataAccess.validation.tablePattern'),
                },
              ]}
            >
              <Input placeholder="public.customers" />
            </Form.Item>
          ) : null}

          {endpointSourceType === 'http_api' ? (
            <div className="grid grid-cols-[1fr_140px] gap-x-3 max-[640px]:grid-cols-1">
              <Form.Item
                label={t('pages.dataAccess.endpointForm.apiPath')}
                name="path"
                rules={[
                  {
                    required: true,
                    message: t('pages.dataAccess.validation.apiPathRequired'),
                  },
                  {
                    pattern: /^\/[^\s]*$/,
                    message: t('pages.dataAccess.validation.apiPathPattern'),
                  },
                ]}
              >
                <Input placeholder="/customers/profile" />
              </Form.Item>
              <Form.Item
                label={t('pages.dataAccess.endpointForm.method')}
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
            extra={t('pages.dataAccess.endpointForm.fieldsHelp')}
            label={t('pages.dataAccess.endpointForm.fields')}
            name="availableFields"
            rules={[
              {
                required: true,
                type: 'array',
                min: 1,
                message: t('pages.dataAccess.validation.fieldsRequired'),
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
                  <Typography.Text strong>
                    {t('pages.dataAccess.endpointForm.parameters')}
                  </Typography.Text>
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
                    {t('pages.dataAccess.actions.addParameter')}
                  </Button>
                </div>
                {fields.length === 0 ? (
                  <Alert
                    showIcon
                    title={t('pages.dataAccess.endpointForm.noParameters')}
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
                        {
                          required: true,
                          message: t(
                            'pages.dataAccess.validation.parameterNameRequired',
                          ),
                        },
                        {
                          pattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
                          message: t(
                            'pages.dataAccess.validation.parameterNamePattern',
                          ),
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
                          {
                            value: 'string',
                            label: t('pages.dataAccess.parameterTypes.string'),
                          },
                          {
                            value: 'integer',
                            label: t('pages.dataAccess.parameterTypes.integer'),
                          },
                          {
                            value: 'number',
                            label: t('pages.dataAccess.parameterTypes.number'),
                          },
                          {
                            value: 'boolean',
                            label: t('pages.dataAccess.parameterTypes.boolean'),
                          },
                          { value: 'uuid', label: 'UUID' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      className="mb-0!"
                      name={[name, 'target']}
                      rules={[
                        {
                          required: true,
                          message: t(
                            'pages.dataAccess.validation.mappingRequired',
                          ),
                        },
                      ]}
                    >
                      {endpointSourceType === 'http_api' ? (
                        <Select
                          options={[
                            {
                              value: 'query',
                              label: t('pages.dataAccess.mapping.query'),
                            },
                            {
                              value: 'body',
                              label: t('pages.dataAccess.mapping.body'),
                            },
                          ]}
                        />
                      ) : (
                        <Input
                          placeholder={t(
                            'pages.dataAccess.endpointForm.targetPlaceholder',
                          )}
                        />
                      )}
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      className="mb-0!"
                      name={[name, 'required']}
                      valuePropName="checked"
                    >
                      <Checkbox>
                        {t('pages.dataAccess.endpointForm.required')}
                      </Checkbox>
                    </Form.Item>
                    <Button
                      danger
                      aria-label={t('pages.dataAccess.actions.removeParameter')}
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
        title={t('pages.dataAccess.preview.title')}
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
              {t('pages.dataAccess.actions.editConfig')}
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
                    ? t('pages.dataAccess.preview.publishedWithChanges')
                    : t('pages.dataAccess.preview.published')
                  : previewEndpoint.status === 'deprecated'
                    ? t('pages.dataAccess.preview.deprecated')
                    : t('pages.dataAccess.preview.draft')
              }
            />
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                {
                  key: 'name',
                  label: t('pages.dataAccess.endpointForm.name'),
                  children: previewEndpoint.name,
                },
                {
                  key: 'code',
                  label: t('pages.dataAccess.endpointForm.code'),
                  children: (
                    <Typography.Text code>
                      {previewEndpoint.endpoint_code}
                    </Typography.Text>
                  ),
                },
                {
                  key: 'source',
                  label: t('pages.dataAccess.endpointForm.source'),
                  children:
                    sourceById.get(previewEndpoint.source_id)?.name ??
                    t('pages.dataAccess.common.unknownSource'),
                },
                {
                  key: 'mode',
                  label: t('pages.dataAccess.endpointForm.mode'),
                  children: previewEndpoint.mode,
                },
                {
                  key: 'version',
                  label: t('pages.dataAccess.columns.version'),
                  children: previewEndpoint.published_version
                    ? `v${previewEndpoint.published_version}`
                    : t('pages.dataAccess.preview.notPublished'),
                },
                {
                  key: 'fields',
                  label: t('pages.dataAccess.endpointForm.fields'),
                  children: previewEndpoint.available_fields.length
                    ? previewEndpoint.available_fields.join(', ')
                    : '-',
                },
                {
                  key: 'status',
                  label: t('pages.dataAccess.columns.status'),
                  children: (
                    <Tag
                      color={ENDPOINT_STATUS_META[previewEndpoint.status].color}
                    >
                      {t(ENDPOINT_STATUS_META[previewEndpoint.status].labelKey)}
                    </Tag>
                  ),
                },
              ]}
              size="small"
            />
            <div>
              <Typography.Text strong>
                {t('pages.dataAccess.preview.callPath')}
              </Typography.Text>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-(--border) bg-(--control-subtle-bg) p-3 text-xs leading-5 text-(--text)">
                {`POST /api/v1/data-gateway/${previewEndpoint.endpoint_code}`}
              </pre>
            </div>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        destroyOnHidden
        forceRender
        open={policyModalOpen}
        title={
          editingPolicyId
            ? t('pages.dataAccess.policyForm.editTitle')
            : t('pages.dataAccess.policyForm.createTitle')
        }
        okText={
          editingPolicyId
            ? t('pages.dataAccess.actions.saveChanges')
            : t('pages.dataAccess.actions.saveDraft')
        }
        cancelText={t('pages.dataAccess.actions.cancel')}
        confirmLoading={createPolicyPending || updatePolicyPending}
        onCancel={() => {
          setPolicyModalOpen(false)
          setEditingPolicyId(undefined)
          policyForm.resetFields()
        }}
        onOk={() => policyForm.submit()}
      >
        <Form form={policyForm} layout="vertical" onFinish={submitPolicy}>
          <Form.Item
            label={t('pages.dataAccess.policyForm.name')}
            name="name"
            rules={[{ required: true }]}
          >
            <Input
              placeholder={t('pages.dataAccess.policyForm.namePlaceholder')}
            />
          </Form.Item>
          <Form.Item
            label={t('pages.dataAccess.policyForm.endpoint')}
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
            label={t('pages.dataAccess.policyForm.subject')}
            name="subject"
            rules={[{ required: true }]}
          >
            <Input
              placeholder={t('pages.dataAccess.policyForm.subjectPlaceholder')}
            />
          </Form.Item>
          <Form.Item
            label={t('pages.dataAccess.policyForm.allowedFields')}
            name="allowedFields"
            rules={[{ required: true }]}
          >
            <Select
              mode="tags"
              placeholder={t('pages.dataAccess.policyForm.fieldsPlaceholder')}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        destroyOnHidden
        open={Boolean(simulationPolicy)}
        size="large"
        title={t('pages.dataAccess.simulation.title')}
        extra={
          <Button
            loading={simulatingPolicy}
            type="primary"
            onClick={runPolicySimulation}
          >
            {t('pages.dataAccess.actions.runSimulation')}
          </Button>
        }
        onClose={() => setSimulationPolicy(undefined)}
      >
        {simulationPolicy ? (
          <Space className="w-full" orientation="vertical" size={18}>
            <div className="rounded-lg border border-(--border) bg-(--control-subtle-bg) p-4">
              <Typography.Title level={5} className="mt-0! mb-1!">
                {localizeValue(simulationPolicy.name)}
              </Typography.Title>
              <Typography.Text type="secondary">
                {localizeValue(simulationPolicy.subject)} ·{' '}
                {simulationPolicy.endpointCode}
              </Typography.Text>
            </div>
            <div>
              <Typography.Text strong>
                {t('pages.dataAccess.simulation.requestFields')}
              </Typography.Text>
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
                    ? t('pages.dataAccess.simulation.allowTitle')
                    : t('pages.dataAccess.simulation.denyTitle')
                }
                description={
                  simulationDecision.effect === 'ALLOW'
                    ? t('pages.dataAccess.simulation.allowDescription', {
                        count: simulationFields.length,
                      })
                    : t('pages.dataAccess.simulation.denyDescription', {
                        fields: simulationDecision.deniedFields.join(
                          t('pages.dataAccess.common.listSeparator'),
                        ),
                      })
                }
              />
            ) : (
              <Alert
                showIcon
                type="info"
                title={t('pages.dataAccess.simulation.noDownstreamTitle')}
                description={t(
                  'pages.dataAccess.simulation.noDownstreamDescription',
                )}
              />
            )}
          </Space>
        ) : null}
      </Drawer>
    </div>
  )
}

export default DataAccessConsole
