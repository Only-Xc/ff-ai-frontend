import {
  cancelStageSwitchRequestRequest,
  cloneStageSwitchTemplateRequest,
  createStageSwitchTemplateRequest,
  getStageSwitchRequestRequest,
  getStageSwitchTemplateRequest,
  getStageSwitchUnreadCountRequest,
  listStageSwitchNotificationsRequest,
  listStageSwitchRequestsRequest,
  listStageSwitchTasksRequest,
  listStageSwitchTemplatesRequest,
  publishStageSwitchTemplateRequest,
  readAllStageSwitchNotificationsRequest,
  readStageSwitchNotificationRequest,
  retireStageSwitchTemplateRequest,
  retryStageSwitchExecutionRequest,
  submitStageSwitchDecisionRequest,
  updateStageSwitchTemplateRequest,
  validateStageSwitchTemplateRequest,
  type StageSwitchNotificationListQuery,
  type StageSwitchRequestListQuery,
  type StageSwitchTaskListQuery,
  type StageSwitchTemplateListQuery,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  StageSwitchApprovalMode,
  StageSwitchApprovalStatus,
  StageSwitchApproverSourceType,
  StageSwitchAssignee,
  StageSwitchAssigneeStatus,
  StageSwitchDecision,
  StageSwitchDecisionCreate,
  StageSwitchDecisionRecord,
  StageSwitchDirection,
  StageSwitchExecutionStatus,
  StageSwitchNode,
  StageSwitchNodeStatus,
  StageSwitchNotification,
  StageSwitchNotificationList,
  StageSwitchNotificationListQuery,
  StageSwitchNotificationStatus,
  StageSwitchReadAllResult,
  StageSwitchRequest,
  StageSwitchRequestCancel,
  StageSwitchRequestDetail,
  StageSwitchRequestList,
  StageSwitchRequestListQuery,
  StageSwitchTaskList,
  StageSwitchTaskListQuery,
  StageSwitchTemplate,
  StageSwitchTemplateCreate,
  StageSwitchTemplateDetail,
  StageSwitchTemplateList,
  StageSwitchTemplateListQuery,
  StageSwitchTemplateNode,
  StageSwitchTemplateNodeInput,
  StageSwitchTemplateNodeKey,
  StageSwitchTemplateStatus,
  StageSwitchTemplateUpdate,
  StageSwitchTemplateValidationResult,
  StageSwitchUnreadCount,
} from '@ff-ai-frontend/api'

export const stageSwitchKeys = {
  all: ['stageSwitch'] as const,
  templateLists: () => [...stageSwitchKeys.all, 'templates'] as const,
  templateList: (query: StageSwitchTemplateListQuery) =>
    [...stageSwitchKeys.templateLists(), query] as const,
  template: (templateId: string) =>
    [...stageSwitchKeys.all, 'template', templateId] as const,
  requestLists: () => [...stageSwitchKeys.all, 'requests'] as const,
  requestList: (query: StageSwitchRequestListQuery) =>
    [...stageSwitchKeys.requestLists(), query] as const,
  request: (requestId: string) =>
    [...stageSwitchKeys.all, 'request', requestId] as const,
  taskLists: () => [...stageSwitchKeys.all, 'tasks'] as const,
  taskList: (query: StageSwitchTaskListQuery) =>
    [...stageSwitchKeys.taskLists(), query] as const,
  notificationLists: () =>
    [...stageSwitchKeys.all, 'notifications'] as const,
  notifications: (query: StageSwitchNotificationListQuery) =>
    [...stageSwitchKeys.notificationLists(), query] as const,
  unreadCount: () => [...stageSwitchKeys.all, 'notifications', 'unreadCount'] as const,
}

export const stageSwitchTemplates_list = request(
  listStageSwitchTemplatesRequest,
)
export const stageSwitchTemplate_get = request(getStageSwitchTemplateRequest)
export const stageSwitchTemplate_create = request(
  createStageSwitchTemplateRequest,
)
export const stageSwitchTemplate_update = request(
  updateStageSwitchTemplateRequest,
)
export const stageSwitchTemplate_validate = request(
  validateStageSwitchTemplateRequest,
)
export const stageSwitchTemplate_publish = request(
  publishStageSwitchTemplateRequest,
)
export const stageSwitchTemplate_retire = request(
  retireStageSwitchTemplateRequest,
)
export const stageSwitchTemplate_clone = request(
  cloneStageSwitchTemplateRequest,
)

export const stageSwitchRequests_list = request(
  listStageSwitchRequestsRequest,
)
export const stageSwitchRequest_get = request(getStageSwitchRequestRequest)
export const stageSwitchTasks_list = request(listStageSwitchTasksRequest)
export const stageSwitchDecision_submit = request(
  submitStageSwitchDecisionRequest,
)
export const stageSwitchRequest_cancel = request(
  cancelStageSwitchRequestRequest,
)
export const stageSwitchExecution_retry = request(
  retryStageSwitchExecutionRequest,
)
export const stageSwitchNotifications_list = request(
  listStageSwitchNotificationsRequest,
)
export const stageSwitchNotifications_unreadCount = request(
  getStageSwitchUnreadCountRequest,
)
export const stageSwitchNotification_read = request(
  readStageSwitchNotificationRequest,
)
export const stageSwitchNotifications_readAll = request(
  readAllStageSwitchNotificationsRequest,
)
