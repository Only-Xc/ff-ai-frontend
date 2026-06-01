import type { ListResult, PaginationQuery } from './types'

import { requestClient } from '@/utils/request'

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

export const adminTasksKeys = {
  all: ['adminTasks'] as const,
  lists: () => [...adminTasksKeys.all, 'list'] as const,
  list: (query: AdminTaskQuery) => [...adminTasksKeys.lists(), query] as const,
  stats: () => [...adminTasksKeys.all, 'stats'] as const,
  snapshots: () => [...adminTasksKeys.all, 'snapshot'] as const,
  snapshot: (taskId: string) =>
    [...adminTasksKeys.snapshots(), taskId] as const,
}

export function adminTasks_list(
  params: AdminTaskListQuery,
): Promise<AdminTaskList> {
  return requestClient({
    url: '/api/admin/tasks',
    method: 'GET',
    params: {
      status: params.status,
      skip: params.skip,
      limit: params.limit,
    },
  })
}

export function adminTasks_getSnapshot(
  taskId: string,
): Promise<AdminTaskSnapshot> {
  return requestClient({
    url: `/api/admin/tasks/${encodeURIComponent(taskId)}/snapshot`,
    method: 'GET',
  })
}

export function adminTasks_getStats(): Promise<AdminTaskStats> {
  return requestClient({
    url: '/api/admin/tasks/stats',
    method: 'GET',
  })
}

export function adminTasks_reprompt(
  taskId: string,
  data: AdminTaskRepromptBody,
): Promise<AdminTaskAction> {
  return requestClient({
    url: `/api/admin/tasks/${encodeURIComponent(taskId)}/reprompt`,
    method: 'POST',
    data,
  })
}

export function adminTasks_reject(
  taskId: string,
  data: AdminTaskRejectBody,
): Promise<AdminTaskAction> {
  return requestClient({
    url: `/api/admin/tasks/${encodeURIComponent(taskId)}/reject`,
    method: 'POST',
    data,
  })
}
