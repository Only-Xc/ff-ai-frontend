import {
  getWorkflowAdminDashboardRequest,
  getWorkflowAppDraftRequest,
  getWorkflowAppRequest,
  listWorkflowAdminAppsRequest,
  listWorkflowAdminTenantsRequest,
  workflowAdminKeys,
  type AdminTenant,
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
} from '@ff-ai-frontend/api'

export { workflowAdminKeys }

export const workflowAdminApps_list = request(listWorkflowAdminAppsRequest)
export const workflowAdminDashboard_get = request(getWorkflowAdminDashboardRequest)
export const workflowAdminTenants_list = request(listWorkflowAdminTenantsRequest)
export const workflowAdminApp_get = request(getWorkflowAppRequest)
export const workflowAdminAppDraft_get = request(getWorkflowAppDraftRequest)

/** List of admin tenants (lifted for type re-export). */
export type WorkflowAdminTenant = AdminTenant
