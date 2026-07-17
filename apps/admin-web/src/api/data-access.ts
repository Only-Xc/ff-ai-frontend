import {
  createAdminAccessEndpointRequest,
  createAdminDataSourceRequest,
  deleteAdminAccessEndpointRequest,
  deleteAdminDataSourceRequest,
  deprecateAdminAccessEndpointRequest,
  discoverAdminDataSourceMetadataRequest,
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
  type DataAccessContextHeaders,
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
  HttpApiDataSourceConfig,
  PostgreSQLDataSourceConfig,
} from '@ff-ai-frontend/api'

const localContextHeaders: DataAccessContextHeaders | undefined = import.meta
  .env.PROD
  ? undefined
  : {
      'X-FF-Tenant-ID': 'local-admin',
      'X-FF-Subject-ID': 'admin-web',
      'X-FF-Subject-Type': 'user',
    }

const listDataSourcesRequest = (params: AdminDataSourceListQuery) =>
  listAdminDataSourcesRequest(params, localContextHeaders)

const createDataSourceRequest = (data: AdminDataSourceCreateBody) =>
  createAdminDataSourceRequest(data, localContextHeaders)

const updateDataSourceRequest = (
  sourceId: string,
  data: AdminDataSourceUpdateBody,
) => updateAdminDataSourceRequest(sourceId, data, localContextHeaders)

const deleteDataSourceRequest = (sourceId: string) =>
  deleteAdminDataSourceRequest(sourceId, localContextHeaders)

const testDataSourceRequest = (sourceId: string) =>
  testAdminDataSourceRequest(sourceId, localContextHeaders)

const discoverDataSourceMetadataRequest = (sourceId: string) =>
  discoverAdminDataSourceMetadataRequest(sourceId, localContextHeaders)

const listAccessEndpointsRequest = (params: AdminAccessEndpointListQuery) =>
  listAdminAccessEndpointsRequest(params, localContextHeaders)

const createAccessEndpointRequest = (data: AdminAccessEndpointCreateBody) =>
  createAdminAccessEndpointRequest(data, localContextHeaders)

const updateAccessEndpointRequest = (
  endpointId: string,
  data: AdminAccessEndpointUpdateBody,
) => updateAdminAccessEndpointRequest(endpointId, data, localContextHeaders)

const deleteAccessEndpointRequest = (endpointId: string) =>
  deleteAdminAccessEndpointRequest(endpointId, localContextHeaders)

const publishAccessEndpointRequest = (endpointId: string) =>
  publishAdminAccessEndpointRequest(endpointId, localContextHeaders)

const deprecateAccessEndpointRequest = (endpointId: string) =>
  deprecateAdminAccessEndpointRequest(endpointId, localContextHeaders)

export const adminDataSourceKeys = {
  all: ['admin-data-sources'] as const,
  lists: () => [...adminDataSourceKeys.all, 'list'] as const,
  list: (query: AdminDataSourceListQuery) =>
    [...adminDataSourceKeys.lists(), query] as const,
}

export const adminAccessEndpointKeys = {
  all: ['admin-access-endpoints'] as const,
  lists: () => [...adminAccessEndpointKeys.all, 'list'] as const,
  list: (query: AdminAccessEndpointListQuery) =>
    [...adminAccessEndpointKeys.lists(), query] as const,
}

export const adminDataSources_list = request(listDataSourcesRequest)
export const adminDataSources_create = request(createDataSourceRequest)
export const adminDataSources_update = request(updateDataSourceRequest)
export const adminDataSources_delete = request(deleteDataSourceRequest)
export const adminDataSources_test = request(testDataSourceRequest)
export const adminDataSources_discoverMetadata = request(
  discoverDataSourceMetadataRequest,
)
export const adminAccessEndpoints_list = request(listAccessEndpointsRequest)
export const adminAccessEndpoints_create = request(createAccessEndpointRequest)
export const adminAccessEndpoints_update = request(updateAccessEndpointRequest)
export const adminAccessEndpoints_delete = request(deleteAccessEndpointRequest)
export const adminAccessEndpoints_publish = request(
  publishAccessEndpointRequest,
)
export const adminAccessEndpoints_deprecate = request(
  deprecateAccessEndpointRequest,
)
