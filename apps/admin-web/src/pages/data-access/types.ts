export type DataSourceType = 'postgresql' | 'http-api'
export type DataSourceStatus = 'active' | 'draft' | 'degraded'
export type HealthStatus = 'healthy' | 'unknown' | 'unhealthy'

export interface DataSourceRecord {
  id: string
  name: string
  type: DataSourceType
  environment: '生产' | '预发' | '开发'
  endpoint: string
  status: DataSourceStatus
  health: HealthStatus
  latencyMs?: number
  lastTestedAt?: string
  owner: string
}

export type EndpointStatus = 'published' | 'draft' | 'deprecated'
export type EndpointMode = 'PASSTHROUGH' | 'LANDING'

export interface AccessEndpointRecord {
  id: string
  code: string
  name: string
  sourceId: string
  sourceName: string
  mode: EndpointMode
  fieldCount: number
  status: EndpointStatus
  version: number
  requestCountToday: number
  updatedAt: string
}

export type PolicyStatus = 'published' | 'draft'

export interface FieldPolicyRecord {
  id: string
  name: string
  endpointCode: string
  subject: string
  allowedFields: string[]
  deniedFields: string[]
  status: PolicyStatus
  version: number
  updatedAt: string
}

export interface P0Capability {
  id: number
  module: string
  name: string
  implementation: string
  status: '待接入' | '待开发'
}

export interface DataSourceFormValues {
  name: string
  type: DataSourceType
  environment: DataSourceRecord['environment']
  endpoint: string
  owner: string
}

export interface EndpointFormValues {
  name: string
  code: string
  sourceId: string
  mode: EndpointMode
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
