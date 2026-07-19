import {
  createAdminAccessEndpointRequest,
  createAdminDataSourceRequest,
  createFieldPolicyRequest,
  deleteAdminAccessEndpointRequest,
  deleteAdminDataSourceRequest,
  deleteFieldPolicyRequest,
  deprecateAdminAccessEndpointRequest,
  discoverAdminDataSourceMetadataRequest,
  getDataIngestionIntegrationsRequest,
  listAdminAccessEndpointsRequest,
  listAdminDataSourcesRequest,
  listDataAccessAccessLogsRequest,
  listFieldPoliciesRequest,
  publishAdminAccessEndpointRequest,
  publishFieldPolicyRequest,
  simulateFieldPolicyRequest,
  testAdminDataSourceRequest,
  updateAdminAccessEndpointRequest,
  updateAdminDataSourceRequest,
  updateFieldPolicyRequest,
  type AdminAccessEndpointCreateBody,
  type AdminAccessEndpointListQuery,
  type AdminAccessEndpointUpdateBody,
  type AdminDataSourceCreateBody,
  type AdminDataSourceListQuery,
  type AdminDataSourceUpdateBody,
  type DataAccessAccessLogList,
  type DataAccessAccessLogListQuery,
  type FieldPolicy,
  type FieldPolicyCreateBody,
  type FieldPolicyList,
  type FieldPolicyListQuery,
  type FieldPolicyPublishBody,
  type FieldPolicyPublishResult,
  type FieldPolicySimulateBody,
  type FieldPolicySimulationResult,
  type FieldPolicyUpdateBody,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  AccessEndpointMode,
  AccessEndpointParameter,
  AccessEndpointParameterType,
  AccessEndpointQuerySpec,
  AccessEndpointStatus,
  AdminAccessEndpoint,
  AdminAccessEndpointCreateBody,
  AdminAccessEndpointList,
  AdminAccessEndpointListQuery,
  AdminAccessEndpointSnapshot,
  AdminAccessEndpointUpdateBody,
  AdminAccessEndpointVersion,
  AdminDataSource,
  AdminDataSourceCreateBody,
  AdminDataSourceList,
  AdminDataSourceListQuery,
  AdminDataSourceUpdateBody,
  DataSourceConfig,
  DataSourceConnectionTestResult,
  DataSourceHealth,
  DataSourceMetadataResult,
  DataSourceStatus,
  DataSourceType,
  DataIngestionIntegrationStatus,
  DataIngestionIntegrationStatusItem,
  DataIngestionIntegrationStatusReason,
  DataIngestionIntegrationsStatus,
  HttpApiDataSourceConfig,
  PostgreSQLDataSourceConfig,
} from '@ff-ai-frontend/api'

export const adminDataSources_list = request(
  (params: AdminDataSourceListQuery) => listAdminDataSourcesRequest(params),
)
export const adminDataIngestionIntegrations_get = request(
  getDataIngestionIntegrationsRequest,
)
export const adminDataSources_create = request(
  (data: AdminDataSourceCreateBody) => createAdminDataSourceRequest(data),
)
export const adminDataSources_update = request(
  (sourceId: string, data: AdminDataSourceUpdateBody) =>
    updateAdminDataSourceRequest(sourceId, data),
)
export const adminDataSources_delete = request((sourceId: string) =>
  deleteAdminDataSourceRequest(sourceId),
)
export const adminDataSources_test = request((sourceId: string) =>
  testAdminDataSourceRequest(sourceId),
)
export const adminDataSources_discoverMetadata = request((sourceId: string) =>
  discoverAdminDataSourceMetadataRequest(sourceId),
)
export const adminAccessEndpoints_list = request(
  (params: AdminAccessEndpointListQuery) =>
    listAdminAccessEndpointsRequest(params),
)
export const adminAccessEndpoints_create = request(
  (data: AdminAccessEndpointCreateBody) =>
    createAdminAccessEndpointRequest(data),
)
export const adminAccessEndpoints_update = request(
  (endpointId: string, data: AdminAccessEndpointUpdateBody) =>
    updateAdminAccessEndpointRequest(endpointId, data),
)
export const adminAccessEndpoints_delete = request((endpointId: string) =>
  deleteAdminAccessEndpointRequest(endpointId),
)
export const adminAccessEndpoints_publish = request((endpointId: string) =>
  publishAdminAccessEndpointRequest(endpointId),
)
export const adminAccessEndpoints_deprecate = request((endpointId: string) =>
  deprecateAdminAccessEndpointRequest(endpointId),
)

export const adminDataSourceKeys = {
  all: ['admin-data-sources'] as const,
  lists: () => [...adminDataSourceKeys.all, 'list'] as const,
  list: (query: AdminDataSourceListQuery) =>
    [...adminDataSourceKeys.lists(), query] as const,
}

export const adminDataIngestionIntegrationKeys = {
  all: ['admin-data-ingestion-integrations'] as const,
}

export const adminAccessEndpointKeys = {
  all: ['admin-access-endpoints'] as const,
  lists: () => [...adminAccessEndpointKeys.all, 'list'] as const,
  list: (query: AdminAccessEndpointListQuery) =>
    [...adminAccessEndpointKeys.lists(), query] as const,
}

export type {
  FieldPolicy,
  FieldPolicyCreateBody,
  FieldPolicyEffect,
  FieldPolicyList,
  FieldPolicyListQuery,
  FieldPolicyPublishBody,
  FieldPolicyPublishResult,
  FieldPolicySimulateBody,
  FieldPolicySimulationResult,
  FieldPolicyStatus,
  FieldPolicySubjectType,
  FieldPolicyUpdateBody,
  DataAccessAccessLog,
  DataAccessAccessLogList,
  DataAccessAccessLogListQuery,
} from '@ff-ai-frontend/api'

export const adminFieldPolicies_list: (
  params: FieldPolicyListQuery,
) => Promise<FieldPolicyList> = request((params: FieldPolicyListQuery) =>
  listFieldPoliciesRequest(params),
)
export const adminFieldPolicies_create: (
  data: FieldPolicyCreateBody,
) => Promise<FieldPolicy> = request((data: FieldPolicyCreateBody) =>
  createFieldPolicyRequest(data),
)
export const adminFieldPolicies_update: (
  policyId: string,
  data: FieldPolicyUpdateBody,
) => Promise<FieldPolicy> = request(
  (policyId: string, data: FieldPolicyUpdateBody) =>
    updateFieldPolicyRequest(policyId, data),
)
export const adminFieldPolicies_delete: (
  policyId: string,
) => Promise<void> = request((policyId: string) =>
  deleteFieldPolicyRequest(policyId),
)
export const adminFieldPolicies_publish: (
  policyId: string,
  data: FieldPolicyPublishBody,
) => Promise<FieldPolicyPublishResult> = request(
  (policyId: string, data: FieldPolicyPublishBody) =>
    publishFieldPolicyRequest(policyId, data),
)
export const adminFieldPolicies_simulate: (
  data: FieldPolicySimulateBody,
) => Promise<FieldPolicySimulationResult> = request(
  (data: FieldPolicySimulateBody) => simulateFieldPolicyRequest(data),
)

export const adminFieldPolicyKeys = {
  all: ['admin-field-policies'] as const,
  lists: () => [...adminFieldPolicyKeys.all, 'list'] as const,
  list: (query: FieldPolicyListQuery) =>
    [...adminFieldPolicyKeys.lists(), query] as const,
}

export const adminAccessLogs_list: (
  params: DataAccessAccessLogListQuery,
) => Promise<DataAccessAccessLogList> = request(
  (params: DataAccessAccessLogListQuery) =>
    listDataAccessAccessLogsRequest(params),
)

export const adminAccessLogKeys = {
  all: ['admin-data-access-logs'] as const,
  lists: () => [...adminAccessLogKeys.all, 'list'] as const,
  list: (query: DataAccessAccessLogListQuery) =>
    [...adminAccessLogKeys.lists(), query] as const,
}
