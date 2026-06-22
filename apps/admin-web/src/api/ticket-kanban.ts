import {
  getAdminTaskSnapshotRequest,
  getAdminTaskStatsRequest,
  listAdminTasksRequest,
  rejectAdminTaskRequest,
  repromptAdminTaskRequest,
  type AdminTaskQuery,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  Task,
  AdminTaskAction,
  TaskList,
  AdminTaskListQuery,
  AdminTaskQuery,
  AdminTaskRejectBody,
  AdminTaskRepromptBody,
  AdminTaskSnapshot,
  AdminTaskSnapshotContextLine,
  AdminTaskSnapshotError,
  AdminTaskSourceCode,
  AdminTaskStats,
  TaskError,
  TaskLog,
  TaskLogLevel,
  TaskStatus,
  TaskStatusFilter,
} from '@ff-ai-frontend/api'

export const adminTasksKeys = {
  all: ['adminTasks'] as const,
  lists: () => [...adminTasksKeys.all, 'list'] as const,
  list: (query: AdminTaskQuery) => [...adminTasksKeys.lists(), query] as const,
  stats: () => [...adminTasksKeys.all, 'stats'] as const,
  snapshots: () => [...adminTasksKeys.all, 'snapshot'] as const,
  snapshot: (taskId: string) =>
    [...adminTasksKeys.snapshots(), taskId] as const,
}

export const adminTasks_list = request(listAdminTasksRequest)
export const adminTasks_getSnapshot = request(getAdminTaskSnapshotRequest)
export const adminTasks_getStats = request(getAdminTaskStatsRequest)
export const adminTasks_reprompt = request(repromptAdminTaskRequest)
export const adminTasks_reject = request(rejectAdminTaskRequest)
