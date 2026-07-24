import { requestClient } from '@/utils/request'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WorkflowApp {
  id: string
  org_id: string
  name: string
  icon: string | null
  description: string | null
  app_type: string
  owner_id: string
  status: string
  active_version_id: string | null
  catalog_status: string | null
  created_at: string
  updated_at: string
}

export interface WorkflowAppListResponse {
  items: WorkflowApp[]
  total: number
  page: number
  page_size: number
  /**
   * Role-based visibility scope returned by the backend:
   *  - "self"   : 普通用户，仅返回自己创建的 app
   *  - "tenant" : 租户管理员，返回本租户内全部 app
   *  - "global" : 平台管理员，返回全平台 app
   */
  scope: 'self' | 'tenant' | 'global' | null
  /**
   * system_admin 可选租户列表（仅 global scope 时返回）
   */
  visible_tenants: string[] | null
}

export interface WorkflowDraft {
  id: string
  app_id: string
  revision: number
  graph_json: WorkflowGraph | null
  feature_config_json: Record<string, unknown> | null
  resource_bindings_json: Record<string, unknown> | null
  updated_by: string | null
  updated_at: string
}

export interface WorkflowGraph {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  config: Record<string, unknown>
  data?: Record<string, unknown>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  branch?: string
  condition?: string
}

export interface WorkflowVersion {
  id: string
  app_id: string
  version: number
  checksum: string
  change_summary: string | null
  published_by: string | null
  published_at: string
}

export interface CatalogApp {
  id: string
  app_type: string
  target_id: string
  title: string
  icon: string | null
  description: string | null
  is_favorite: boolean
}

export interface CatalogListResponse {
  items: CatalogApp[]
  total: number
}

export interface WorkflowConversation {
  id: string
  app_id: string
  version_id: string | null
  user_id: string
  org_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface WorkflowMessage {
  id: string
  conversation_id: string
  role: string
  content_json: Record<string, unknown> | null
  run_id: string | null
  created_at: string
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const workflowKeys = {
  all: ['workflow'] as const,
  apps: () => [...workflowKeys.all, 'apps'] as const,
  appList: (params?: Record<string, unknown>) =>
    [...workflowKeys.apps(), 'list', params] as const,
  app: (appId: string) => [...workflowKeys.all, 'app', appId] as const,
  draft: (appId: string) => [...workflowKeys.all, 'draft', appId] as const,
  versions: (appId: string) =>
    [...workflowKeys.all, 'versions', appId] as const,
  catalog: () => [...workflowKeys.all, 'catalog'] as const,
  conversations: (appId: string) =>
    [...workflowKeys.all, 'conversations', appId] as const,
  messages: (conversationId: string) =>
    [...workflowKeys.all, 'messages', conversationId] as const,
}

// ─── Admin API (Design Management) ──────────────────────────────────────────

export function listWorkflowApps(params?: {
  page?: number
  page_size?: number
  search?: string
  status?: string
}): Promise<WorkflowAppListResponse> {
  return requestClient.get<WorkflowAppListResponse>('/api/v1/workflow-apps', {
    params,
  }) as unknown as Promise<WorkflowAppListResponse>
}

export function createWorkflowApp(payload: {
  name: string
  icon?: string
  description?: string
}): Promise<WorkflowApp> {
  return requestClient.post<WorkflowApp>('/api/v1/workflow-apps', payload) as unknown as Promise<WorkflowApp>
}

export function getWorkflowApp(appId: string): Promise<WorkflowApp> {
  return requestClient.get<WorkflowApp>(`/api/v1/workflow-apps/${appId}`) as unknown as Promise<WorkflowApp>
}

export function updateWorkflowApp(
  appId: string,
  payload: { name?: string; icon?: string; description?: string },
): Promise<WorkflowApp> {
  return requestClient.patch<WorkflowApp>(`/api/v1/workflow-apps/${appId}`, payload) as unknown as Promise<WorkflowApp>
}

export function deleteWorkflowApp(appId: string) {
  return requestClient.delete(`/api/v1/workflow-apps/${appId}`)
}

export function duplicateWorkflowApp(appId: string): Promise<WorkflowApp> {
  return requestClient.post<WorkflowApp>(`/api/v1/workflow-apps/${appId}/duplicate`) as unknown as Promise<WorkflowApp>
}

export function getWorkflowDraft(appId: string): Promise<WorkflowDraft> {
  return requestClient.get<WorkflowDraft>(`/api/v1/workflow-apps/${appId}/draft`) as unknown as Promise<WorkflowDraft>
}

export function updateWorkflowDraft(
  appId: string,
  payload: {
    graph_json?: WorkflowGraph
    feature_config_json?: Record<string, unknown>
    resource_bindings_json?: Record<string, unknown>
  },
  revision: number,
): Promise<WorkflowDraft> {
  return requestClient.request<WorkflowDraft>({
    method: 'PUT',
    url: `/api/v1/workflow-apps/${appId}/draft`,
    data: payload,
    headers: { 'If-Match': String(revision) },
    meta: { skipGlobalErrorToast: true },
  })
}

export function listWorkflowVersions(appId: string): Promise<WorkflowVersion[]> {
  return requestClient.get<WorkflowVersion[]>(
    `/api/v1/workflow-apps/${appId}/versions`,
  ) as unknown as Promise<WorkflowVersion[]>
}

export function publishWorkflow(appId: string, payload: { change_summary?: string } = {}): Promise<{ version_id: string; status: string }> {
  return requestClient.request<{ version_id: string; status: string }>({
    method: 'POST',
    url: `/api/v1/workflow-apps/${appId}/publish`,
    data: payload,
    meta: { skipGlobalErrorToast: true },
  })
}

export function rollbackWorkflow(appId: string, payload: { target_version_id: string }) {
  return requestClient.post(`/api/v1/workflow-apps/${appId}/rollback`, payload)
}

export function disableWorkflow(appId: string) {
  return requestClient.post(`/api/v1/workflow-apps/${appId}/disable`)
}

export function enableWorkflow(appId: string) {
  return requestClient.post(`/api/v1/workflow-apps/${appId}/enable`)
}

// ─── User API (Runtime) ─────────────────────────────────────────────────────

export function listPlatformApps(): Promise<CatalogListResponse> {
  return requestClient.get<CatalogListResponse>('/api/v1/platform-apps') as unknown as Promise<CatalogListResponse>
}

export function addFavorite(catalogId: string) {
  return requestClient.post(`/api/v1/platform-apps/${catalogId}/favorite`)
}

export function removeFavorite(catalogId: string) {
  return requestClient.delete(`/api/v1/platform-apps/${catalogId}/favorite`)
}

export function getRuntimeConfig(appId: string): Promise<{
  name: string
  icon: string | null
  description: string | null
  opening_message?: string
  suggested_questions?: string[]
}> {
  return requestClient.get<{
    name: string
    icon: string | null
    description: string | null
    opening_message?: string
    suggested_questions?: string[]
  }>(`/api/v1/workflow-apps/${appId}/runtime-config`) as unknown as Promise<{
    name: string
    icon: string | null
    description: string | null
    opening_message?: string
    suggested_questions?: string[]
  }>
}

export function listConversations(appId: string): Promise<WorkflowConversation[]> {
  return requestClient.get<WorkflowConversation[]>(
    `/api/v1/workflow-apps/${appId}/conversations`,
  ) as unknown as Promise<WorkflowConversation[]>
}

export function listMessages(conversationId: string, params?: { page?: number; page_size?: number }): Promise<WorkflowMessage[]> {
  return requestClient.get<WorkflowMessage[]>(
    `/api/v1/workflow-conversations/${conversationId}/messages`,
    { params },
  ) as unknown as Promise<WorkflowMessage[]>
}

export function deleteConversation(conversationId: string) {
  return requestClient.delete(`/api/v1/workflow-conversations/${conversationId}`)
}

// ─── SSE Chat (streaming) ───────────────────────────────────────────────────

export interface ChatMessagePayload {
  request_id: string
  input: string
  conversation_id?: string
}

export function createChatSSEUrl(appId: string): string {
  return `/api/v1/workflow-apps/${appId}/chat-messages`
}
