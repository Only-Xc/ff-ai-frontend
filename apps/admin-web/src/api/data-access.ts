import {
  createAdminAccessEndpointRequest,
  createAdminDataSourceRequest,
  deleteAdminAccessEndpointRequest,
  deleteAdminDataSourceRequest,
  deprecateAdminAccessEndpointRequest,
  discoverAdminDataSourceMetadataRequest,
  getDataIngestionIntegrationsRequest,
  listAdminAccessEndpointsRequest,
  listAdminDataSourcesRequest,
  publishAdminAccessEndpointRequest,
  testAdminDataSourceRequest,
  updateAdminAccessEndpointRequest,
  updateAdminDataSourceRequest,
  type AdminAccessEndpointCreateBody,
  type AdminAccessEndpointListQuery,
  type AdminAccessEndpointUpdateBody,
  type AdminDataSourceCreateBody,
  type AdminDataSourceListQuery,
  type AdminDataSourceUpdateBody,
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
