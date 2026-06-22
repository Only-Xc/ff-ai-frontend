import { createRequest, path } from '../client.js'
import type { ListResult, PaginationQuery } from '../common.js'

export type AdminTaskStatusFilter =
  | 'active'
  | 'pending_approval'
  | 'completed'
  | 'failed'
  | ''

export type AdminTaskStatus =
  | 'CREATED'
  | 'ANALYZING'
  | 'ROUTING'
  | 'CODING'
  | 'TESTING'
  | 'DEPLOYING'
  | 'COMPLETED'
  | 'PENDING_APPROVAL'
  | 'FAILED'

export interface AdminTaskError {
  stage: string
  message: string
}

export interface AdminTaskSnapshotContextLine {
  line_no: number
  content: string
}

export interface AdminTaskSnapshotError {
  stage: string
  context: AdminTaskSnapshotContextLine[] | null
  message: string
  failed_at: string
  traceback: string | null
  error_type: string
  failed_file: string | null
  failed_line: number | null
}

export interface AdminTaskSourceCode {
  branch: string
  repo_url: string
  clone_url: string
  commit_sha: string
}

export interface AdminTaskSnapshot {
  error: AdminTaskSnapshotError | null
  title: string
  status: AdminTaskStatus
  task_id: string
  tenant_id: string
  retry_count: number
  snapshot_at: string
  source_code: AdminTaskSourceCode | null
  current_node: string
  payload_summary: Record<string, unknown>
}

export interface AdminTaskAction {
  status: AdminTaskStatus
  message: string
  task_id: string
}

export interface AdminTaskRejectBody {
  reason: string
  operator_id?: string
}

export interface AdminTaskRepromptBody {
  prompt_hint: string
  operator_id?: string
}

export interface AdminTask {
  title: string
  status: AdminTaskStatus
  task_id: string
  tenant_id: string
  created_at: string
  updated_at: string
  last_error: AdminTaskError | null
  retry_count: number
  current_node: string
  web_url?: string
}

export interface AdminTaskQuery {
  status?: AdminTaskStatusFilter
}

export type AdminTaskList = ListResult<AdminTask>

export type AdminTaskListQuery = AdminTaskQuery & PaginationQuery

export interface AdminTaskStats {
  total_count: number
  active_count: number
  failed_count: number
  filtered_count: number
  pending_approval_count: number
}

export const listAdminTasksRequest = (params: AdminTaskListQuery) =>
  createRequest<AdminTaskList>('GET', '/api/admin/tasks', { params })

export const getAdminTaskSnapshotRequest = (taskId: string) =>
  createRequest<AdminTaskSnapshot>(
    'GET',
    path`/api/admin/tasks/${taskId}/snapshot`,
  )

export const getAdminTaskStatsRequest = () =>
  createRequest<AdminTaskStats>('GET', '/api/admin/tasks/stats')

export const repromptAdminTaskRequest = (
  taskId: string,
  data: AdminTaskRepromptBody,
) =>
  createRequest<AdminTaskAction>(
    'POST',
    path`/api/admin/tasks/${taskId}/reprompt`,
    { data },
  )

export const rejectAdminTaskRequest = (
  taskId: string,
  data: AdminTaskRejectBody,
) =>
  createRequest<AdminTaskAction>(
    'POST',
    path`/api/admin/tasks/${taskId}/reject`,
    { data },
  )
