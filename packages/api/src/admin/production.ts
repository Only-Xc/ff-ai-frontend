// Agent Production Release Approval — type skeleton (Stage 1)
// 阶段 1 仅提供类型；createRequest 调用在阶段 2/4 补齐。

export type ProductionApprovalStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'PRECHECK_BLOCKED'

export type ProductionApprovalMode = 'ANY' | 'ALL'

export type ProductionDecision = 'APPROVED' | 'REJECTED'

export type ProductionActivationStatus = 'PENDING' | 'ACTIVE' | 'FAILED'

export type ProductionApprovalAction =
  | 'APPROVE'
  | 'REJECT'
  | 'CANCEL'
  | 'RETRY_ACTIVATION'

export type ProductionStatus =
  | 'none'
  | 'pre_production'
  | 'production'
  | 'decommissioned'

export type ProductionTargetType = 'agent' | 'workflow'

export interface ProductionApproval {
  id: string
  approval_no: string
  organization_id: string | null
  target_type: ProductionTargetType
  agent_id: string
  task_id: string | null
  workflow_app_id: string | null
  workflow_version_id: string | null
  deployment_version: number
  deployment_sha256: string
  qa_passed: boolean
  evaluation_id: string | null
  risk_level: string
  risk_score: number
  status: ProductionApprovalStatus
  activation_status: ProductionActivationStatus
  approval_mode: ProductionApprovalMode
  requester_id: string
  approved_by: string | null
  rationale: string
  version: number
  created_at: string
  decided_at: string | null
  approved_at: string | null
  rejected_at: string | null
  cancelled_at: string | null
  available_actions: ProductionApprovalAction[]
}

export interface ApproverRef {
  id: string
  name: string
  email?: string | null
}

export interface ProductionErrorInfo extends Record<string, unknown> {
  message?: string | null
}

export interface ProductionArtifactSnapshot extends Record<string, unknown> {
  release_id?: string | null
  image_name?: string | null
  oci_digest?: string | null
  artifact_bucket?: string | null
  artifact_prefix?: string | null
  image_object_key?: string | null
  artifact_sha256?: string | null
  artifact_size_bytes?: number | null
  build_finished_at?: string | null
  runtime_base_image?: string | null
  runtime_base_digest?: string | null
  flow_id?: string | null
  access_scope?: string | null
  role_ids?: string[] | null
  roles?: Array<Record<string, unknown>> | null
}

export interface ProductionReleaseSnapshot extends Record<string, unknown> {
  status?: string | null
  current_step?: string | null
  error_json?: ProductionErrorInfo | null
  build_started_at?: string | null
  build_finished_at?: string | null
}

export interface ProductionRuntimeSnapshot extends Record<string, unknown> {
  status?: string | null
  container_port?: number | null
  container_name?: string | null
  container_id?: string | null
  network_name?: string | null
  network_alias?: string | null
  image?: string | null
  image_digest?: string | null
  upstream_url?: string | null
  health_url?: string | null
  prediction_path?: string | null
  last_error?: string | ProductionErrorInfo | null
}

export interface ProductionApprovalDetail {
  request: ProductionApproval
  qa_result_snapshot: Record<string, unknown>
  artifact_snapshot: ProductionArtifactSnapshot
  release_snapshot: ProductionReleaseSnapshot
  runtime_snapshot: ProductionRuntimeSnapshot
  approver_role_ids: string[]
  approver_user_ids: string[]
  approver_users: ApproverRef[]
  approver_roles: ApproverRef[]
  decisions: Array<Record<string, unknown>>
}

export interface ProductionApprovalListResponse {
  data: ProductionApproval[]
  count: number
}

export interface ProductionRollback {
  id: string
  agent_id: string
  task_id: string
  approval_id: string | null
  deployment_version_before: number
  reason: string
  rolled_back_by: string
  rolled_back_at: string
}

export interface ProductionApprovalCreatePayload {
  agent_id: string
  task_id: string
  idempotency_key: string
}

export interface ProductionApprovalDecisionPayload {
  decision: ProductionDecision
  rationale: string
  expected_version: number
}

export interface ProductionApprovalCancelPayload {
  rationale: string
}

export interface ProductionRollbackCreatePayload {
  reason: string
}

export interface ProductionApprovalQuery {
  status?: ProductionApprovalStatus
  agent_id?: string
  target_type?: ProductionTargetType
  keyword?: string
  organization_id?: string
  skip?: number
  limit?: number
}

// API calls（阶段 5 补齐）
import { createRequest } from '../client.js'

const PRODUCTION_PREFIX = '/api/v1/admin/production'

export const listProductionApprovalsRequest = (
  params?: ProductionApprovalQuery,
) =>
  createRequest<ProductionApprovalListResponse>(
    'GET',
    `${PRODUCTION_PREFIX}/approvals`,
    { params },
  )

export const getProductionApprovalRequest = (approvalId: string) =>
  createRequest<ProductionApprovalDetail>(
    'GET',
    `${PRODUCTION_PREFIX}/approvals/${encodeURIComponent(approvalId)}`,
  )

export const createProductionApprovalRequest = (
  data: ProductionApprovalCreatePayload,
) =>
  createRequest<ProductionApprovalDetail>(
    'POST',
    `${PRODUCTION_PREFIX}/approvals`,
    { data },
  )

export const submitProductionDecisionRequest = (
  approvalId: string,
  data: ProductionApprovalDecisionPayload,
) =>
  createRequest<ProductionApprovalDetail>(
    'POST',
    `${PRODUCTION_PREFIX}/approvals/${encodeURIComponent(approvalId)}/decisions`,
    { data },
  )

export const cancelProductionApprovalRequest = (
  approvalId: string,
  data: ProductionApprovalCancelPayload,
) =>
  createRequest<ProductionApprovalDetail>(
    'POST',
    `${PRODUCTION_PREFIX}/approvals/${encodeURIComponent(approvalId)}/cancel`,
    { data },
  )

export const applyProductionApprovalRequest = (approvalId: string) =>
  createRequest<ProductionApprovalDetail>(
    'POST',
    `${PRODUCTION_PREFIX}/approvals/${encodeURIComponent(approvalId)}/apply`,
  )

export const rollbackProductionAgentRequest = (
  agentId: string,
  data: ProductionRollbackCreatePayload,
) =>
  createRequest<ProductionRollback>(
    'POST',
    `${PRODUCTION_PREFIX}/agents/${encodeURIComponent(agentId)}/rollback`,
    { data },
  )

export const refreshRuntimeRequest = (approvalId: string) =>
  createRequest<ProductionApprovalDetail>(
    'POST',
    `${PRODUCTION_PREFIX}/approvals/${encodeURIComponent(approvalId)}/runtime/refresh`,
  )

export const stopRuntimeRequest = (approvalId: string) =>
  createRequest<ProductionApprovalDetail>(
    'POST',
    `${PRODUCTION_PREFIX}/approvals/${encodeURIComponent(approvalId)}/runtime/stop`,
  )

export const restartRuntimeRequest = (approvalId: string) =>
  createRequest<ProductionApprovalDetail>(
    'POST',
    `${PRODUCTION_PREFIX}/approvals/${encodeURIComponent(approvalId)}/runtime/restart`,
  )
