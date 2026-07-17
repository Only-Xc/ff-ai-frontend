import { createRequest, path } from '../client.js'

export type DataSourceType = 'postgresql' | 'http_api'
export type DataSourceStatus = 'active' | 'draft' | 'degraded'
export type DataSourceHealth = 'healthy' | 'unknown' | 'unhealthy'

export interface PostgreSQLDataSourceConfig {
  type: 'postgresql'
  host: string
  port: number
  database: string
  username: string
  credential_ref?: string | null
  schema_name: string
  ssl_mode: 'disable' | 'prefer' | 'require' | 'verify-ca' | 'verify-full'
  connect_timeout_seconds: number
  pool_size: number
}

export interface HttpApiDataSourceConfig {
  type: 'http_api'
  base_url: string
  health_method: 'GET' | 'POST'
  health_path: string
  health_query: Record<string, unknown>
  health_body?: Record<string, unknown> | null
  health_expected_status: number
  metadata_path?: string | null
  auth_type: 'none' | 'bearer' | 'api_key'
  auth_header: string
  credential_ref?: string | null
  timeout_seconds: number
  verify_tls: boolean
}

export type DataSourceConfig =
  | PostgreSQLDataSourceConfig
  | HttpApiDataSourceConfig

export type AdminDataSourceConfig =
  | Omit<PostgreSQLDataSourceConfig, 'type' | 'credential_ref'>
  | Omit<HttpApiDataSourceConfig, 'type' | 'credential_ref'>

export interface AdminDataSource {
  id: string
  tenant_id: string
  name: string
  code: string
  source_type: DataSourceType
  status: DataSourceStatus
  config: AdminDataSourceConfig
  has_credential: boolean
  health: DataSourceHealth
  latency_ms: number | null
  last_tested_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminDataSourceList {
  data: AdminDataSource[]
  count: number
}

export interface AdminDataSourceListQuery {
  skip?: number
  limit?: number
  source_type?: DataSourceType
  status?: DataSourceStatus
  search?: string
}

export interface AdminDataSourceCreateBody {
  name: string
  code: string
  config: DataSourceConfig
}

export interface AdminDataSourceUpdateBody {
  name?: string
  config?: DataSourceConfig
}

export interface DataSourceConnectionTestResult {
  success: boolean
  latency_ms: number | null
  message: string
}

export interface DataSourceMetadataField {
  name: string
  data_type: string
  nullable: boolean
}

export interface DataSourceMetadataResource {
  name: string
  resource_type: string
  fields: DataSourceMetadataField[]
}

export interface DataSourceMetadataResult {
  resources: DataSourceMetadataResource[]
}

export type AccessEndpointStatus = 'deprecated' | 'draft' | 'published'
export type AccessEndpointMode = 'PASSTHROUGH'
export type AccessEndpointParameterType =
  | 'boolean'
  | 'integer'
  | 'number'
  | 'string'
  | 'uuid'

export interface AccessEndpointParameter {
  name: string
  type: AccessEndpointParameterType
  required: boolean
}

export interface PostgreSQLAccessEndpointQuerySpec {
  type: 'postgresql'
  table: string
  parameter_columns: Record<string, string>
  default_fields: string[]
}

export interface HttpApiAccessEndpointQuerySpec {
  type: 'http_api'
  path: string
  method: 'GET' | 'POST'
  parameter_locations: Record<string, 'body' | 'query'>
  default_fields: string[]
}

export type AccessEndpointQuerySpec =
  | HttpApiAccessEndpointQuerySpec
  | PostgreSQLAccessEndpointQuerySpec

export interface AdminAccessEndpoint {
  id: string
  tenant_id: string
  source_id: string
  name: string
  endpoint_code: string
  mode: AccessEndpointMode
  status: AccessEndpointStatus
  query_spec: AccessEndpointQuerySpec
  allowed_parameters: AccessEndpointParameter[]
  available_fields: string[]
  published_version: number
  has_draft_changes: boolean
  created_at: string
  updated_at: string
}

export interface AdminAccessEndpointList {
  data: AdminAccessEndpoint[]
  count: number
}

export interface AdminAccessEndpointListQuery {
  skip?: number
  limit?: number
  status?: AccessEndpointStatus
  search?: string
}

export interface AdminAccessEndpointCreateBody {
  source_id: string
  name: string
  endpoint_code: string
  mode: AccessEndpointMode
  query_spec: AccessEndpointQuerySpec
  allowed_parameters: AccessEndpointParameter[]
  available_fields: string[]
}

export type AdminAccessEndpointUpdateBody = Omit<
  AdminAccessEndpointCreateBody,
  'endpoint_code'
>

export interface AdminAccessEndpointSnapshot {
  endpoint_id: string
  tenant_id: string
  endpoint_code: string
  version: number
  status: 'published'
  source_id: string
  mode: AccessEndpointMode
  query_spec: AccessEndpointQuerySpec
  allowed_parameters: AccessEndpointParameter[]
  available_fields: string[]
}

export interface AdminAccessEndpointVersion {
  id: string
  endpoint_id: string
  tenant_id: string
  version: number
  snapshot: AdminAccessEndpointSnapshot
  published_by: string
  published_at: string
}

export type DataAccessContextHeaders = Record<string, string> & {
  'X-FF-Tenant-ID': string
  'X-FF-Subject-ID': string
  'X-FF-Subject-Type': 'user' | 'service'
}

export const listAdminDataSourcesRequest = (
  params: AdminDataSourceListQuery,
  headers?: DataAccessContextHeaders,
) =>
  createRequest<AdminDataSourceList>('GET', '/api/v1/data-sources', {
    params,
    headers,
  })

export const createAdminDataSourceRequest = (
  data: AdminDataSourceCreateBody,
  headers?: DataAccessContextHeaders,
) =>
  createRequest<AdminDataSource>('POST', '/api/v1/data-sources', {
    data,
    headers,
  })

export const updateAdminDataSourceRequest = (
  sourceId: string,
  data: AdminDataSourceUpdateBody,
  headers?: DataAccessContextHeaders,
) =>
  createRequest<AdminDataSource>(
    'PATCH',
    path`/api/v1/data-sources/${sourceId}`,
    { data, headers },
  )

export const deleteAdminDataSourceRequest = (
  sourceId: string,
  headers?: DataAccessContextHeaders,
) =>
  createRequest<void>('DELETE', path`/api/v1/data-sources/${sourceId}`, {
    headers,
  })

export const testAdminDataSourceRequest = (
  sourceId: string,
  headers?: DataAccessContextHeaders,
) =>
  createRequest<DataSourceConnectionTestResult>(
    'POST',
    path`/api/v1/data-sources/${sourceId}/test`,
    { headers },
  )

export const discoverAdminDataSourceMetadataRequest = (
  sourceId: string,
  headers?: DataAccessContextHeaders,
) =>
  createRequest<DataSourceMetadataResult>(
    'GET',
    path`/api/v1/data-sources/${sourceId}/metadata`,
    { headers },
  )

export const listAdminAccessEndpointsRequest = (
  params: AdminAccessEndpointListQuery,
  headers?: DataAccessContextHeaders,
) =>
  createRequest<AdminAccessEndpointList>('GET', '/api/v1/access-endpoints', {
    params,
    headers,
  })

export const createAdminAccessEndpointRequest = (
  data: AdminAccessEndpointCreateBody,
  headers?: DataAccessContextHeaders,
) =>
  createRequest<AdminAccessEndpoint>('POST', '/api/v1/access-endpoints', {
    data,
    headers,
  })

export const updateAdminAccessEndpointRequest = (
  endpointId: string,
  data: AdminAccessEndpointUpdateBody,
  headers?: DataAccessContextHeaders,
) =>
  createRequest<AdminAccessEndpoint>(
    'PATCH',
    path`/api/v1/access-endpoints/${endpointId}`,
    { data, headers },
  )

export const deleteAdminAccessEndpointRequest = (
  endpointId: string,
  headers?: DataAccessContextHeaders,
) =>
  createRequest<void>('DELETE', path`/api/v1/access-endpoints/${endpointId}`, {
    headers,
  })

export const publishAdminAccessEndpointRequest = (
  endpointId: string,
  headers?: DataAccessContextHeaders,
) =>
  createRequest<AdminAccessEndpointVersion>(
    'POST',
    path`/api/v1/access-endpoints/${endpointId}/publish`,
    { headers },
  )

export const deprecateAdminAccessEndpointRequest = (
  endpointId: string,
  headers?: DataAccessContextHeaders,
) =>
  createRequest<AdminAccessEndpoint>(
    'POST',
    path`/api/v1/access-endpoints/${endpointId}/deprecate`,
    { headers },
  )
