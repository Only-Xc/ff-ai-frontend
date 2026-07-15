import { createRequest, path } from '../client.js'
import type { PaginationQuery } from '../common.js'

export type StageSwitchDirection = 'PROMOTE' | 'DEMOTE'
export type StageSwitchApprovalMode = 'ALL' | 'ANY'
export type StageSwitchApproverSourceType =
  | 'ROLE'
  | 'USER'
  | 'SERVICE_OWNER'
export type StageSwitchApprovalStatus =
  | 'DRAFT'
  | 'PRECHECK_BLOCKED'
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'STALE'
export type StageSwitchNodeStatus =
  | 'WAITING'
  | 'PENDING'
  | 'OVERDUE'
  | 'APPROVED'
  | 'REJECTED'
  | 'SKIPPED'
  | 'CANCELLED'
export type StageSwitchExecutionStatus =
  | 'NOT_READY'
  | 'READY'
  | 'EXECUTING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CONFLICT'
export type StageSwitchAssigneeStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'NOT_REQUIRED'
  | 'CANCELLED'
export type StageSwitchDecision = 'APPROVED' | 'REJECTED'
export type StageSwitchNotificationStatus = 'UNREAD' | 'READ'
export type StageSwitchTemplateStatus = 'DRAFT' | 'PUBLISHED' | 'RETIRED'
export type StageSwitchTemplateNodeKey =
  | 'MINISTRY'
  | 'INFOSEC'
  | 'GOVERNANCE'
  | 'SERVICE_OWNER'

export interface StageSwitchApproverSourceConfig {
  role_ids?: string[]
  user_ids?: string[]
  profile_field?: string
}

export interface StageSwitchReminderPolicy {
  before_due_minutes: number
  repeat_interval_minutes: number
  escalation_threshold_minutes: number
  escalation_role_ids: string[]
}

export interface StageSwitchTemplateNodeInput {
  node_key: StageSwitchTemplateNodeKey
  name: string
  sequence: number
  approval_mode: StageSwitchApprovalMode
  approver_source_type: StageSwitchApproverSourceType
  approver_source_config: StageSwitchApproverSourceConfig
  sla_minutes: number
  reminder_policy: StageSwitchReminderPolicy
}

export interface StageSwitchTemplateNode extends StageSwitchTemplateNodeInput {
  id: string
  template_id: string
}

export interface StageSwitchTemplate {
  id: string
  template_key: string
  organization_id: string | null
  name: string
  direction: StageSwitchDirection
  version: number
  status: StageSwitchTemplateStatus
  is_default: boolean
  description: string
  created_by: string
  published_by: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface StageSwitchTemplateList {
  data: StageSwitchTemplate[]
  total: number
}

export interface StageSwitchTemplateDetail {
  template: StageSwitchTemplate
  nodes: StageSwitchTemplateNode[]
}

export type StageSwitchTemplateListQuery = PaginationQuery & {
  direction?: StageSwitchDirection
  status?: StageSwitchTemplateStatus
  keyword?: string
  organization_id?: string
}

export interface StageSwitchTemplateCreate {
  template_key: string
  name: string
  direction: StageSwitchDirection
  description: string
  nodes: StageSwitchTemplateNodeInput[]
}

export interface StageSwitchTemplateUpdate {
  name?: string
  description?: string
  node_updates: StageSwitchTemplateNodeInput[]
}

export interface StageSwitchTemplateValidationResult {
  valid: boolean
  errors?: string[]
}

export interface StageSwitchRequest {
  id: string
  request_no: string
  organization_id: string | null
  agent_id: string
  source_stage: string
  target_stage: string
  direction: StageSwitchDirection
  reason: string
  transition_params: Record<string, unknown>
  requester_id: string
  template_id: string
  evaluation_id: string | null
  review_case_id: string | null
  approval_status: StageSwitchApprovalStatus
  execution_status: StageSwitchExecutionStatus
  current_node_sequence: number | null
  version: number
  submitted_at: string | null
  approved_at: string | null
  rejected_at: string | null
  created_at: string
  updated_at: string
  can_current_user_decide: boolean
}

export interface StageSwitchRequestList {
  data: StageSwitchRequest[]
  total: number
}

export interface StageSwitchNode {
  id: string
  request_id: string
  node_key: string
  name: string
  sequence: number
  approval_mode: StageSwitchApprovalMode
  status: StageSwitchNodeStatus
  required_count: number
  approved_count: number
  rejected_count: number
  activated_at: string | null
  due_at: string | null
  completed_at: string | null
  version: number
}

export interface StageSwitchAssignee {
  id: string
  node_id: string
  user_id: string
  source_type: StageSwitchApproverSourceType
  assignee_status: StageSwitchAssigneeStatus
  acted_at: string | null
  created_at: string
}

export interface StageSwitchDecisionRecord {
  id: string
  request_id: string
  node_id: string
  decision: StageSwitchDecision
  rationale: string
  decided_by: string
  decided_at: string
}

export interface StageSwitchRequestDetail {
  request: StageSwitchRequest
  nodes: StageSwitchNode[]
  assignees: StageSwitchAssignee[]
  decisions: StageSwitchDecisionRecord[]
}

export type StageSwitchRequestListQuery = PaginationQuery & {
  agent_id?: string
  approval_status?: StageSwitchApprovalStatus
  execution_status?: StageSwitchExecutionStatus
  direction?: StageSwitchDirection
  organization_id?: string
  keyword?: string
}

export type StageSwitchTaskListQuery = PaginationQuery & {
  status?: 'pending' | 'overdue'
}

export interface StageSwitchTaskList {
  data: StageSwitchRequest[]
  total: number
}

export interface StageSwitchDecisionCreate {
  decision: StageSwitchDecision
  rationale: string
  expected_request_version: number
  expected_node_version: number
}

export interface StageSwitchRequestCancel {
  rationale: string
}

export interface StageSwitchNotification {
  id: string
  recipient_id: string
  request_id: string | null
  notification_type: string
  title_key: string
  body_key: string
  payload: Record<string, unknown>
  status: StageSwitchNotificationStatus
  read_at: string | null
  created_at: string
}

export interface StageSwitchNotificationList {
  data: StageSwitchNotification[]
  total: number
}

export type StageSwitchNotificationListQuery = PaginationQuery & {
  status?: StageSwitchNotificationStatus
}

export interface StageSwitchUnreadCount {
  count: number
}

export interface StageSwitchReadAllResult {
  success: boolean
  updated_count: number
}

const STAGE_SWITCH_PREFIX = '/api/v1/admin/stage-switch'

export const listStageSwitchTemplatesRequest = (
  params: StageSwitchTemplateListQuery,
) =>
  createRequest<StageSwitchTemplateList>(
    'GET',
    `${STAGE_SWITCH_PREFIX}/templates`,
    { params },
  )

export const getStageSwitchTemplateRequest = (templateId: string) =>
  createRequest<StageSwitchTemplateDetail>(
    'GET',
    path`/api/v1/admin/stage-switch/templates/${templateId}`,
  )

export const createStageSwitchTemplateRequest = (
  data: StageSwitchTemplateCreate,
) =>
  createRequest<StageSwitchTemplate, StageSwitchTemplateCreate>(
    'POST',
    `${STAGE_SWITCH_PREFIX}/templates`,
    { data },
  )

export const updateStageSwitchTemplateRequest = (
  templateId: string,
  data: StageSwitchTemplateUpdate,
) =>
  createRequest<StageSwitchTemplate, StageSwitchTemplateUpdate>(
    'PUT',
    path`/api/v1/admin/stage-switch/templates/${templateId}`,
    { data },
  )

export const validateStageSwitchTemplateRequest = (templateId: string) =>
  createRequest<StageSwitchTemplateValidationResult>(
    'POST',
    path`/api/v1/admin/stage-switch/templates/${templateId}/validate`,
    { data: {} },
  )

export const publishStageSwitchTemplateRequest = (templateId: string) =>
  createRequest<StageSwitchTemplate>(
    'POST',
    path`/api/v1/admin/stage-switch/templates/${templateId}/publish`,
    { data: {} },
  )

export const retireStageSwitchTemplateRequest = (templateId: string) =>
  createRequest<StageSwitchTemplate>(
    'POST',
    path`/api/v1/admin/stage-switch/templates/${templateId}/retire`,
    { data: {} },
  )

export const cloneStageSwitchTemplateRequest = (templateId: string) =>
  createRequest<StageSwitchTemplate>(
    'POST',
    path`/api/v1/admin/stage-switch/templates/${templateId}/clone`,
    { data: {} },
  )

export const listStageSwitchRequestsRequest = (
  params: StageSwitchRequestListQuery,
) =>
  createRequest<StageSwitchRequestList>('GET', `${STAGE_SWITCH_PREFIX}/requests`, {
    params,
  })

export const getStageSwitchRequestRequest = (requestId: string) =>
  createRequest<StageSwitchRequestDetail>(
    'GET',
    path`/api/v1/admin/stage-switch/requests/${requestId}`,
  )

export const listStageSwitchTasksRequest = (params: StageSwitchTaskListQuery) =>
  createRequest<StageSwitchTaskList>('GET', `${STAGE_SWITCH_PREFIX}/tasks`, {
    params,
  })

export const submitStageSwitchDecisionRequest = (
  requestId: string,
  data: StageSwitchDecisionCreate,
) =>
  createRequest<StageSwitchDecisionRecord>(
    'POST',
    path`/api/v1/admin/stage-switch/requests/${requestId}/decisions`,
    { data },
  )

export const cancelStageSwitchRequestRequest = (
  requestId: string,
  data: StageSwitchRequestCancel,
) =>
  createRequest<StageSwitchRequest>(
    'POST',
    path`/api/v1/admin/stage-switch/requests/${requestId}/cancel`,
    { data },
  )

export const retryStageSwitchExecutionRequest = (requestId: string) =>
  createRequest<StageSwitchRequest>(
    'POST',
    path`/api/v1/admin/stage-switch/requests/${requestId}/retry-execution`,
    { data: {} },
  )

export const listStageSwitchNotificationsRequest = (
  params: StageSwitchNotificationListQuery,
) =>
  createRequest<StageSwitchNotificationList>(
    'GET',
    `${STAGE_SWITCH_PREFIX}/notifications`,
    { params },
  )

export const getStageSwitchUnreadCountRequest = () =>
  createRequest<StageSwitchUnreadCount>(
    'GET',
    `${STAGE_SWITCH_PREFIX}/notifications/unread-count`,
  )

export const readStageSwitchNotificationRequest = (notificationId: string) =>
  createRequest<StageSwitchNotification>(
    'POST',
    path`/api/v1/admin/stage-switch/notifications/${notificationId}/read`,
    { data: {} },
  )

export const readAllStageSwitchNotificationsRequest = () =>
  createRequest<StageSwitchReadAllResult>(
    'POST',
    `${STAGE_SWITCH_PREFIX}/notifications/read-all`,
    { data: {} },
  )
