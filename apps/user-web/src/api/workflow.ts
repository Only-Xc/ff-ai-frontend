import { requestClient } from '@/utils/request'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WorkflowApp {
  id: string
  org_id: string
  name: string
  icon: string | null
  description: string | null
  app_type: 'chatflow' | 'agentflow'
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

export type WorkflowAccessScope = 'tenant' | 'roles'

export interface WorkflowAccessRole {
  id: string
  code: string
  name: string
}

export interface PublishWorkflowPayload {
  change_summary?: string
  access_scope: WorkflowAccessScope
  role_ids: string[]
}

export interface PublishWorkflowResponse {
  version_id: string
  version: number
  release_id: string | null
  status: string
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

export type WorkflowTestTargetType = 'draft' | 'version'
export type WorkflowTestStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'completed_with_errors'
  | 'cancel_requested'
  | 'failed'
  | 'cancelled'

export interface WorkflowTestSuite {
  id: string
  org_id: string
  app_id: string
  name: string
  description: string | null
  revision: number
  case_count: number
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export interface WorkflowTestSuiteCreatePayload {
  name: string
  description?: string
}

export interface WorkflowTestSuiteUpdatePayload {
  name?: string
  description?: string
}

export interface WorkflowTestCase {
  id: string
  suite_id: string
  ordinal: number
  question: string
  expected_answer: string | null
  tags: string[]
  variables: Record<string, unknown>
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface WorkflowTestRuleEvaluatorConfig {
  exact_match: boolean
  contains_keywords: string[]
  citation_required: boolean
  weights: Record<string, number>
}

export interface WorkflowTestLlmEvaluatorConfig {
  enabled: boolean
  model: string | null
  prompt_version: string
}

export interface WorkflowTestEvaluatorConfig {
  rules: WorkflowTestRuleEvaluatorConfig
  llm: WorkflowTestLlmEvaluatorConfig
}

export interface WorkflowTestResult {
  id: string
  case_id: string
  ordinal: number
  question: string
  expected_answer: string | null
  tags: string[]
  variables: Record<string, unknown>
  status: WorkflowTestStatus
  attempt: number
  actual_answer: string | null
  citations: Record<string, unknown>[]
  evidence: Record<string, unknown>[]
  retrieval_trace: Record<string, unknown>
  metrics: Record<string, unknown>
  rule_scores: Record<string, unknown>
  evaluator_result: Record<string, unknown> | null
  score: number | null
  error: Record<string, unknown> | null
  started_at: string | null
  finished_at: string | null
}

export interface WorkflowTestRun {
  id: string
  org_id: string
  app_id: string
  suite_id: string
  suite_revision: number
  target_type: WorkflowTestTargetType
  target_version_id: string | null
  target_revision: number | null
  graph_checksum: string
  prompt_checksum: string
  evaluator_config: WorkflowTestEvaluatorConfig
  status: WorkflowTestStatus
  total_count: number
  completed_count: number
  failed_count: number
  cancelled_count: number
  cleanup_status: string
  cleanup_error: Record<string, unknown> | null
  created_by: string
  created_at: string
  started_at: string | null
  finished_at: string | null
  results: WorkflowTestResult[]
}

export interface WorkflowTestComparisonRow {
  case_id: string
  question: string
  left_score: number | null
  right_score: number | null
  score_delta: number | null
  left_status: WorkflowTestStatus | null
  right_status: WorkflowTestStatus | null
}

export interface WorkflowTestComparisonSummary {
  left_average_score: number | null
  right_average_score: number | null
  score_delta: number | null
}

export interface WorkflowTestComparison {
  left: WorkflowTestRun
  right: WorkflowTestRun
  summary: WorkflowTestComparisonSummary
  cases: WorkflowTestComparisonRow[]
}

export interface WorkflowTestCaseImportResponse {
  imported_count: number
  skipped_count: number
  errors: Record<string, unknown>[]
  suite_revision: number
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
  testSuites: (appId: string) =>
    [...workflowKeys.all, 'test-suites', appId] as const,
  testCases: (appId: string, suiteId: string) =>
    [...workflowKeys.testSuites(appId), suiteId, 'cases'] as const,
  testRuns: (appId: string) =>
    [...workflowKeys.all, 'test-runs', appId] as const,
  testRun: (appId: string, runId: string) =>
    [...workflowKeys.testRuns(appId), runId] as const,
  testComparison: (appId: string, left: string, right: string) =>
    [...workflowKeys.testRuns(appId), 'compare', left, right] as const,
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
  app_type?: 'chatflow' | 'agentflow'
}): Promise<WorkflowApp> {
  return requestClient.post<WorkflowApp>(
    '/api/v1/workflow-apps',
    payload,
  ) as unknown as Promise<WorkflowApp>
}

export function getWorkflowApp(appId: string): Promise<WorkflowApp> {
  return requestClient.get<WorkflowApp>(
    `/api/v1/workflow-apps/${appId}`,
  ) as unknown as Promise<WorkflowApp>
}

export function updateWorkflowApp(
  appId: string,
  payload: { name?: string; icon?: string; description?: string },
): Promise<WorkflowApp> {
  return requestClient.patch<WorkflowApp>(
    `/api/v1/workflow-apps/${appId}`,
    payload,
  ) as unknown as Promise<WorkflowApp>
}

export function deleteWorkflowApp(appId: string) {
  return requestClient.delete(`/api/v1/workflow-apps/${appId}`)
}

export function duplicateWorkflowApp(appId: string): Promise<WorkflowApp> {
  return requestClient.post<WorkflowApp>(
    `/api/v1/workflow-apps/${appId}/duplicate`,
  ) as unknown as Promise<WorkflowApp>
}

export function getWorkflowDraft(appId: string): Promise<WorkflowDraft> {
  return requestClient.get<WorkflowDraft>(
    `/api/v1/workflow-apps/${appId}/draft`,
  ) as unknown as Promise<WorkflowDraft>
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

export function listWorkflowVersions(
  appId: string,
): Promise<WorkflowVersion[]> {
  return requestClient.get<WorkflowVersion[]>(
    `/api/v1/workflow-apps/${appId}/versions`,
  ) as unknown as Promise<WorkflowVersion[]>
}

export function listWorkflowAccessRoles(): Promise<WorkflowAccessRole[]> {
  return requestClient.get<WorkflowAccessRole[]>(
    '/api/v1/workflow-apps/access-roles',
  ) as unknown as Promise<WorkflowAccessRole[]>
}

export function publishWorkflow(
  appId: string,
  payload: PublishWorkflowPayload,
): Promise<PublishWorkflowResponse> {
  return requestClient.request<PublishWorkflowResponse>({
    method: 'POST',
    url: `/api/v1/workflow-apps/${appId}/publish`,
    data: payload,
    meta: { skipGlobalErrorToast: true },
  })
}

export function rollbackWorkflow(
  appId: string,
  payload: { target_version_id: string },
) {
  return requestClient.post(`/api/v1/workflow-apps/${appId}/rollback`, payload)
}

export function disableWorkflow(appId: string) {
  return requestClient.post(`/api/v1/workflow-apps/${appId}/disable`)
}

export function enableWorkflow(appId: string) {
  return requestClient.post(`/api/v1/workflow-apps/${appId}/enable`)
}

// ─── Batch Evaluation API ──────────────────────────────────────────────────

export function listWorkflowTestSuites(
  appId: string,
): Promise<WorkflowTestSuite[]> {
  return requestClient.get<WorkflowTestSuite[]>(
    `/api/v1/workflow-apps/${appId}/test-suites`,
  ) as unknown as Promise<WorkflowTestSuite[]>
}

export function createWorkflowTestSuite(
  appId: string,
  payload: WorkflowTestSuiteCreatePayload,
): Promise<WorkflowTestSuite> {
  return requestClient.post<WorkflowTestSuite>(
    `/api/v1/workflow-apps/${appId}/test-suites`,
    payload,
  ) as unknown as Promise<WorkflowTestSuite>
}

export function updateWorkflowTestSuite(
  appId: string,
  suiteId: string,
  payload: WorkflowTestSuiteUpdatePayload,
): Promise<WorkflowTestSuite> {
  return requestClient.patch<WorkflowTestSuite>(
    `/api/v1/workflow-apps/${appId}/test-suites/${suiteId}`,
    payload,
  ) as unknown as Promise<WorkflowTestSuite>
}

export function deleteWorkflowTestSuite(appId: string, suiteId: string) {
  return requestClient.delete(
    `/api/v1/workflow-apps/${appId}/test-suites/${suiteId}`,
  )
}

export function listWorkflowTestCases(
  appId: string,
  suiteId: string,
): Promise<WorkflowTestCase[]> {
  return requestClient.get<WorkflowTestCase[]>(
    `/api/v1/workflow-apps/${appId}/test-suites/${suiteId}/cases`,
  ) as unknown as Promise<WorkflowTestCase[]>
}

export function addWorkflowTestCase(
  appId: string,
  suiteId: string,
  payload: {
    question: string
    expected_answer?: string
    tags?: string[]
    variables?: Record<string, unknown>
    enabled?: boolean
    ordinal?: number
  },
): Promise<WorkflowTestCase> {
  return requestClient.post<WorkflowTestCase>(
    `/api/v1/workflow-apps/${appId}/test-suites/${suiteId}/cases`,
    payload,
  ) as unknown as Promise<WorkflowTestCase>
}

export function updateWorkflowTestCase(
  appId: string,
  suiteId: string,
  caseId: string,
  payload: {
    question?: string
    expected_answer?: string | null
    tags?: string[]
    variables?: Record<string, unknown>
    enabled?: boolean
    ordinal?: number
  },
): Promise<WorkflowTestCase> {
  return requestClient.patch<WorkflowTestCase>(
    `/api/v1/workflow-apps/${appId}/test-suites/${suiteId}/cases/${caseId}`,
    payload,
  ) as unknown as Promise<WorkflowTestCase>
}

export function deleteWorkflowTestCase(
  appId: string,
  suiteId: string,
  caseId: string,
): Promise<void> {
  return requestClient.delete<void>(
    `/api/v1/workflow-apps/${appId}/test-suites/${suiteId}/cases/${caseId}`,
  ) as unknown as Promise<void>
}

export function importWorkflowTestCases(
  appId: string,
  suiteId: string,
  file: File,
): Promise<WorkflowTestCaseImportResponse> {
  const data = new FormData()
  data.append('file', file)
  return requestClient.post<WorkflowTestCaseImportResponse>(
    `/api/v1/workflow-apps/${appId}/test-suites/${suiteId}/import`,
    data,
  ) as unknown as Promise<WorkflowTestCaseImportResponse>
}

export function listWorkflowTestRuns(
  appId: string,
): Promise<WorkflowTestRun[]> {
  return requestClient.get<WorkflowTestRun[]>(
    `/api/v1/workflow-apps/${appId}/test-runs`,
  ) as unknown as Promise<WorkflowTestRun[]>
}

export function createWorkflowTestRun(
  appId: string,
  payload: {
    suite_id: string
    target_type: WorkflowTestTargetType
    target_version_id?: string
    evaluator_config: WorkflowTestEvaluatorConfig
  },
): Promise<WorkflowTestRun> {
  return requestClient.post<WorkflowTestRun>(
    `/api/v1/workflow-apps/${appId}/test-runs`,
    payload,
  ) as unknown as Promise<WorkflowTestRun>
}

export function getWorkflowTestRun(
  appId: string,
  runId: string,
): Promise<WorkflowTestRun> {
  return requestClient.get<WorkflowTestRun>(
    `/api/v1/workflow-apps/${appId}/test-runs/${runId}`,
  ) as unknown as Promise<WorkflowTestRun>
}

export function cancelWorkflowTestRun(
  appId: string,
  runId: string,
): Promise<WorkflowTestRun> {
  return requestClient.post<WorkflowTestRun>(
    `/api/v1/workflow-apps/${appId}/test-runs/${runId}/cancel`,
  ) as unknown as Promise<WorkflowTestRun>
}

export function rerunFailedWorkflowTestResults(
  appId: string,
  runId: string,
): Promise<WorkflowTestRun> {
  return requestClient.post<WorkflowTestRun>(
    `/api/v1/workflow-apps/${appId}/test-runs/${runId}/rerun-failed`,
  ) as unknown as Promise<WorkflowTestRun>
}

export function compareWorkflowTestRuns(
  appId: string,
  left: string,
  right: string,
): Promise<WorkflowTestComparison> {
  return requestClient.get<WorkflowTestComparison>(
    `/api/v1/workflow-apps/${appId}/test-runs/compare`,
    { params: { left, right } },
  ) as unknown as Promise<WorkflowTestComparison>
}

export function exportWorkflowTestRun(
  appId: string,
  runId: string,
  format: 'csv' | 'json',
): Promise<Blob> {
  return requestClient.get(
    `/api/v1/workflow-apps/${appId}/test-runs/${runId}/export`,
    { params: { format }, responseType: 'blob' },
  ) as unknown as Promise<Blob>
}

// ─── User API (Runtime) ─────────────────────────────────────────────────────

export function listPlatformApps(): Promise<CatalogListResponse> {
  return requestClient.get<CatalogListResponse>(
    '/api/v1/platform-apps',
  ) as unknown as Promise<CatalogListResponse>
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

export function listConversations(
  appId: string,
): Promise<WorkflowConversation[]> {
  return requestClient.get<WorkflowConversation[]>(
    `/api/v1/workflow-apps/${appId}/conversations`,
  ) as unknown as Promise<WorkflowConversation[]>
}

export function listMessages(
  conversationId: string,
  params?: { page?: number; page_size?: number },
): Promise<WorkflowMessage[]> {
  return requestClient.get<WorkflowMessage[]>(
    `/api/v1/workflow-conversations/${conversationId}/messages`,
    { params },
  ) as unknown as Promise<WorkflowMessage[]>
}

export function deleteConversation(conversationId: string) {
  return requestClient.delete(
    `/api/v1/workflow-conversations/${conversationId}`,
  )
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
