import type {
  AccessEndpointMode as ApiAccessEndpointMode,
  AccessEndpointParameterType,
  AccessEndpointStatus as ApiAccessEndpointStatus,
  AdminAccessEndpoint,
  AdminDataSource,
  DataSourceHealth,
  FieldPolicySubjectType,
  DataSourceType as ApiDataSourceType,
} from '@/api/data-access'

export type DataSourceType = ApiDataSourceType
export type DataSourceStatus = 'active' | 'draft' | 'degraded'
export type HealthStatus = DataSourceHealth

export type DataSourceRecord = AdminDataSource

export type EndpointStatus = ApiAccessEndpointStatus
export type EndpointMode = ApiAccessEndpointMode
export type AccessEndpointRecord = AdminAccessEndpoint

export type PolicyStatus = 'published' | 'draft'

export interface FieldPolicyRecord {
  id: string
  name: string
  endpointCode: string
  endpointVersion: number
  gatewayUrl: string
  subject: string
  subjectType: FieldPolicySubjectType
  subjectId: string
  allowedFields: string[]
  deniedFields: string[]
  status: PolicyStatus
  version: number
  updatedAt: string
}

export interface DataSourceFormValues {
  name: string
  code: string
  type: DataSourceType
  credentialRef?: string
  host?: string
  port?: number
  database?: string
  username?: string
  schemaName?: string
  sslMode?: 'disable' | 'prefer' | 'require' | 'verify-ca' | 'verify-full'
  connectTimeoutSeconds?: number
  poolSize?: number
  baseUrl?: string
  healthMethod?: 'GET' | 'POST'
  healthPath?: string
  healthQueryJson?: string
  healthBodyJson?: string
  healthExpectedStatus?: number
  metadataPath?: string
  authType?: 'none' | 'bearer' | 'api_key'
  authHeader?: string
  timeoutSeconds?: number
  verifyTls?: boolean
}

export interface EndpointFormValues {
  name: string
  code: string
  sourceId: string
  mode: EndpointMode
  table?: string
  path?: string
  method?: 'GET' | 'POST'
  availableFields: string[]
  parameters: EndpointParameterFormValues[]
}

export interface EndpointParameterFormValues {
  name: string
  type: AccessEndpointParameterType
  required: boolean
  target: string
}

export interface PolicyFormValues {
  name: string
  endpointCode: string
  subject: string
  allowedFields: string[]
}

export type UsageTargetType = 'endpoint' | 'database'

export interface UsageRecord {
  id: string
  userName: string
  userAccount: string
  targetType: UsageTargetType
  targetName: string
  targetCode: string
  usedAt: string
}

export type WorkspaceKey = 'sources' | 'endpoints' | 'policies' | 'usage'
