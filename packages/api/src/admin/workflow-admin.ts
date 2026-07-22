// Workflow 管理台 API（spec: Workflow 平台应用与管理台补丁）
//
// 后端业务逻辑全部位于 monorepo（ff_workflow 模块）的 /api/v1/workflow-admin。
// 主后端 ff-ai-platform 仅做透传 + `admin.workflow_admin.read` 权限拦截。
// 前端调用的实际路径 = `/api/v1/workflow-admin/{path}`。

import { createRequest } from '../client.js'

const WORKFLOW_ADMIN_PREFIX = '/api/v1/workflow-admin'

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** Workflow 应用状态（与 monorepo 一致） */
export type WorkflowAppStatus =
  | 'draft'
  | 'pending_approval'
  | 'published'
  | 'active'
  | 'disabled'

/** 平台应用目录条目状态 */
export type CatalogStatus = 'active' | 'pending_approval' | 'disabled'

/** 单条 Workflow 应用（管理台视图） */
export interface AdminWorkflowApp {
  id: string
  org_id: string
  name: string
  icon?: string | null
  description?: string | null
  app_type: string
  owner_id: string
  status: WorkflowAppStatus
  active_version_id?: string | null
  catalog_status: CatalogStatus | null
  created_at: string
  updated_at: string
}

/** 应用列表响应 */
export interface AdminWorkflowAppListResponse {
  items: AdminWorkflowApp[]
  total: number
  page: number
  page_size: number
  /** 视图范围：global（跨租户）/ tenant（单租户） */
  scope: 'global' | 'tenant'
  /** 当前 scope 下的 org_id；scope=tenant 时强制为 caller_org_id */
  org_id: string | null
}

/** 单个指标 */
export interface AdminDashboardMetric {
  label: string
  value: number
  unit: string
}

/** Dashboard 响应 */
export interface AdminDashboardResponse {
  org_id: string | null
  scope: 'global' | 'tenant'
  metrics: AdminDashboardMetric[]
  generated_at: string
}

/** 单个租户 */
export interface AdminTenant {
  id: string
  name: string
  code?: string | null
  workflow_app_count: number
}

/** 租户列表响应 */
export interface AdminTenantListResponse {
  items: AdminTenant[]
  total: number
}

/** apps 列表查询参数 */
export interface AdminWorkflowAppQuery {
  org_id?: string
  page?: number
  page_size?: number
  search?: string
  status?: WorkflowAppStatus
}

/** dashboard 查询参数 */
export interface AdminDashboardQuery {
  org_id?: string
}

/** Workflow 画布草稿响应（只读查看用） */
export interface WorkflowDraftResponse {
  app_id: string
  revision: number
  graph_json: { nodes: WorkflowGraphNode[]; edges: WorkflowGraphEdge[] } | null
  feature_config_json: Record<string, unknown> | null
  resource_bindings_json: Record<string, unknown> | null
  updated_by: string | null
  updated_at: string
}

/** 画布节点 */
export interface WorkflowGraphNode {
  id: string
  type: string
  position?: { x: number; y: number }
  config?: Record<string, unknown>
}

/** 画布边 */
export interface WorkflowGraphEdge {
  id: string
  source: string
  target: string
  branch?: string
}

// ---------------------------------------------------------------------------
// API 调用
// ---------------------------------------------------------------------------

/** 跨租户 Workflow 应用列表（system_admin 可省略 org_id 查全部） */
export const listWorkflowAdminAppsRequest = (
  params?: AdminWorkflowAppQuery,
) =>
  createRequest<AdminWorkflowAppListResponse>(
    'GET',
    `${WORKFLOW_ADMIN_PREFIX}/apps`,
    { params },
  )

/** 管理台 Dashboard 指标 */
export const getWorkflowAdminDashboardRequest = (
  params?: AdminDashboardQuery,
) =>
  createRequest<AdminDashboardResponse>(
    'GET',
    `${WORKFLOW_ADMIN_PREFIX}/dashboard`,
    { params },
  )

/** 可选租户列表（system_admin 看到全部，tenant_admin 仅自己） */
export const listWorkflowAdminTenantsRequest = () =>
  createRequest<AdminTenantListResponse>(
    'GET',
    `${WORKFLOW_ADMIN_PREFIX}/tenants`,
  )

/** 获取单个 Workflow 应用详情（通过 admin proxy，支持跨租户） */
export const getWorkflowAppRequest = (appId: string) =>
  createRequest<AdminWorkflowApp>(
    'GET',
    `${WORKFLOW_ADMIN_PREFIX}/apps/${appId}`,
  )

/** 获取 Workflow 画布草稿（只读查看用，通过 admin proxy） */
export const getWorkflowAppDraftRequest = (appId: string) =>
  createRequest<WorkflowDraftResponse>(
    'GET',
    `${WORKFLOW_ADMIN_PREFIX}/apps/${appId}/draft`,
  )

// ---------------------------------------------------------------------------
// React Query keys
// ---------------------------------------------------------------------------

export const workflowAdminKeys = {
  all: ['workflow-admin'] as const,
  apps: (params?: AdminWorkflowAppQuery) =>
    [...workflowAdminKeys.all, 'apps', params ?? {}] as const,
  dashboard: (params?: AdminDashboardQuery) =>
    [...workflowAdminKeys.all, 'dashboard', params ?? {}] as const,
  tenants: () => [...workflowAdminKeys.all, 'tenants'] as const,
  appDetail: (appId: string) => [...workflowAdminKeys.all, 'app', appId] as const,
  appDraft: (appId: string) => [...workflowAdminKeys.all, 'draft', appId] as const,
}
