import {
  getWorkflowAdminDashboardRequest,
  getWorkflowAppDraftRequest,
  getWorkflowAppGraphRequest,
  getWorkflowAppRequest,
  getWorkflowVersionGraphRequest,
  listWorkflowAdminAppsRequest,
  listWorkflowAdminTenantsRequest,
  workflowAdminKeys,
  type AdminDashboardQuery,
  type AdminDashboardResponse,
  type AdminTenant,
  type AdminTenantListResponse,
  type AdminWorkflowApp,
  type AdminWorkflowAppListResponse,
  type AdminWorkflowAppQuery,
  type CatalogStatus,
  type WorkflowAppStatus,
  type WorkflowDraftResponse,
  type WorkflowGraphEdge,
  type WorkflowGraphNode,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  AdminDashboardMetric,
  AdminDashboardQuery,
  AdminDashboardResponse,
  AdminTenant,
  AdminTenantListResponse,
  AdminWorkflowApp,
  AdminWorkflowAppListResponse,
  AdminWorkflowAppQuery,
  CatalogStatus,
  WorkflowAppStatus,
  WorkflowDraftResponse,
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowReadonlyGraph,
  WorkflowReadonlyGraphResponse,
} from '@ff-ai-frontend/api'

export { workflowAdminKeys }

export const workflowAdminApps_list = request(listWorkflowAdminAppsRequest)
export const workflowAdminDashboard_get = request(
  getWorkflowAdminDashboardRequest,
)
export const workflowAdminTenants_list = request(
  listWorkflowAdminTenantsRequest,
)
export const workflowAdminApp_get = request(getWorkflowAppRequest)
export const workflowAdminAppDraft_get = request(getWorkflowAppDraftRequest)
export const workflowAdminAppGraph_get = request(getWorkflowAppGraphRequest)
export const workflowAdminVersionGraph_get = request(
  getWorkflowVersionGraphRequest,
)

/** List of admin tenants (lifted for type re-export). */
export type WorkflowAdminTenant = AdminTenant
