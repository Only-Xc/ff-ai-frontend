import { createRequest, path } from '../client.js'
import type { ListResult, PaginationQuery } from '../common.js'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type EvaluationResult = 'PASS' | 'PASS_WITH_NOTICE' | 'REVIEW_REQUIRED' | 'BLOCKED' | 'ERROR'
export type RuleEvaluatorType = 'builtin' | 'json_logic' | 'manual'
export type ReviewStatus = 'DRAFT' | 'OPEN' | 'IN_REVIEW' | 'APPROVED' | 'APPROVED_WITH_CONDITIONS' | 'REJECTED' | 'REMEDIATION_REQUIRED' | 'EXCEPTION_REQUESTED' | 'EXCEPTION_ACTIVE' | 'EXPIRED' | 'CANCELLED'
export type EvaluationTriggerType = 'promote' | 'deploy' | 'manual' | 'scheduled' | 'rule_change'
export type RuleVersionStatus = 'draft' | 'published' | 'retired'
export type TreatmentStatus = 'open' | 'in_progress' | 'verified' | 'closed' | 'overdue'
export type TreatmentType = 'mitigate' | 'avoid' | 'transfer' | 'accept'
export type ExceptionStatus = 'requested' | 'active' | 'rejected' | 'revoked' | 'expired'
export type DecisionOutcome = 'APPROVED' | 'APPROVED_WITH_CONDITIONS' | 'REJECTED' | 'REMEDIATION_REQUIRED' | 'EXCEPTION_REQUESTED'

export interface GrcRiskProfile {
  id: string
  organization_id: string | null
  agent_id: string
  source_task_id: string | null
  risk_level: RiskLevel
  risk_score: number
  data_classification: string
  autonomy_level: string
  exposure: string
  capabilities: Record<string, any>
  owners: Record<string, any>
  profile_version: number
  assessment_source: string
  status: string
  created_at: string
  updated_at: string
}

export interface GrcRiskProfileCreate {
  agent_id: string
  organization_id?: string | null
  source_task_id?: string | null
  data_classification?: string
  autonomy_level?: string
  exposure?: string
  capabilities?: Record<string, any>
  owners?: Record<string, any>
  assessment_source?: string
}

export interface GrcRiskProfileUpdate {
  risk_level?: RiskLevel
  risk_score?: number
  data_classification?: string
  autonomy_level?: string
  exposure?: string
  capabilities?: Record<string, any>
  owners?: Record<string, any>
  status?: string
}

export interface GrcRule {
  id: string
  code: string
  name: string
  category: string
  description: string | null
  owner_user_id: string | null
  organization_id: string | null
  is_active: boolean
  current_version: number | null
  current_severity: string | null
  current_status: string | null
  created_at: string
  updated_at: string
}

export interface GrcRuleCreate {
  code: string
  name: string
  category: string
  description?: string | null
  organization_id?: string | null
}

export interface GrcRuleUpdate {
  name?: string
  description?: string | null
  is_active?: boolean
}

export interface GrcRuleVersion {
  id: string
  rule_id: string
  version: number
  status: RuleVersionStatus
  severity: string
  risk_score: number
  block_on_fail: boolean
  exception_allowed: boolean
  applicable_scope: Record<string, any>
  evaluator_type: string
  evaluator_config: Record<string, any>
  evidence_requirements: Record<string, any>
  remediation_template: string | null
  effective_from: string | null
  effective_to: string | null
  change_note: string
  created_by: string
  published_by: string | null
  created_at: string
  published_at: string | null
}

export interface GrcRuleVersionCreate {
  version: number
  severity: string
  risk_score: number
  block_on_fail?: boolean
  exception_allowed?: boolean
  applicable_scope?: Record<string, any>
  evaluator_type?: string
  evaluator_config?: Record<string, any>
  evidence_requirements?: Record<string, any>
  remediation_template?: string | null
  effective_from?: string | null
  effective_to?: string | null
  change_note?: string
}

export interface GrcRuleVersionPublish {
  change_note: string
}

export interface GrcEvaluation {
  id: string
  organization_id: string | null
  agent_id: string
  task_id: string | null
  trigger_type: string
  trigger_id: string | null
  profile_id: string
  profile_version: number
  result: EvaluationResult
  risk_level: RiskLevel
  risk_score: number
  input_sha256: string
  rule_set_sha256: string
  started_at: string
  completed_at: string | null
  expires_at: string | null
  created_by: string
  created_at: string
}

export interface GrcRuleVersionList extends ListResult<GrcRuleVersion> {}

export const ruleVersionsRequest = (ruleId: string) =>
  createRequest<GrcRuleVersionList>('GET', path`/api/v1/admin/grc/rules/${ruleId}/versions`)

export interface GrcRuleStatsResponse {
  rule_id: string
  total_evaluations: number
  pass_count: number
  fail_count: number
  error_count: number
  review_required_count: number
  recent_results: GrcEvaluationResult[]
  recent_results_count: number
}

export const ruleStatsRequest = (ruleId: string) =>
  createRequest<GrcRuleStatsResponse>('GET', path`/api/v1/admin/grc/rules/${ruleId}/stats`)

export interface GrcEvaluationCreate {
  agent_id: string
  task_id?: string | null
  trigger_type: string
  organization_id?: string | null
  idempotency_key: string
  input_snapshot?: Record<string, any>
}

export interface GrcUserRef {
  id: string
  email: string
  full_name: string | null
}

export interface GrcEvaluationResult {
  id: string
  evaluation_id: string
  rule_id: string
  rule_version_id: string
  result: string
  severity: string
  risk_score: number
  block_on_fail: boolean
  message: string
  evidence: Record<string, any>
  remediation: string | null
  evaluated_at: string
  rule_code?: string | null
  rule_name?: string | null
}

export interface GrcReviewCase {
  id: string
  case_no: string
  organization_id: string | null
  subject_type: string
  subject_id: string
  agent_id: string | null
  task_id: string | null
  evaluation_id: string
  status: ReviewStatus
  risk_level: RiskLevel
  risk_score: number
  title: string
  summary: string
  requester_id: string
  assignee_id: string | null
  due_at: string | null
  version: number
  opened_at: string
  decided_at: string | null
  closed_at: string | null
  requester?: GrcUserRef | null
  assignee?: GrcUserRef | null
}

export interface GrcReviewDecision {
  id: string
  review_case_id: string
  decision: DecisionOutcome
  rationale: string
  conditions: Record<string, any>[]
  evidence_refs: Record<string, any>[]
  evaluation_snapshot: Record<string, any>
  rule_results_snapshot: Record<string, any>[]
  decided_by: string
  decided_at: string
  request_id: string | null
  source_ip: string | null
  user_agent: string | null
  decided_by_user?: GrcUserRef | null
}

export interface GrcReviewDecisionCreate {
  decision: DecisionOutcome
  rationale: string
  conditions?: Record<string, any>[]
  evidence_refs?: Record<string, any>[]
  expected_version?: number
  reprompt_hint?: string
}

export interface GrcReviewCaseAssign {
  assignee_id: string
}

export interface GrcException {
  id: string
  exception_no: string
  review_case_id: string
  rule_id: string
  rule_version_id: string
  scope: Record<string, any>
  justification: string
  compensating_controls: Record<string, any>
  requested_by: string
  approved_by: string | null
  status: ExceptionStatus
  starts_at: string | null
  expires_at: string
  max_uses: number | null
  used_count: number
  revoked_by: string | null
  revoked_reason: string | null
  created_at: string
  updated_at: string
}

export interface GrcExceptionCreate {
  rule_id: string
  rule_version_id: string
  scope: Record<string, any>
  justification: string
  compensating_controls: Record<string, any>
  expires_at: string
  max_uses?: number | null
}

export interface GrcRiskTreatment {
  id: string
  review_case_id: string
  evaluation_result_id: string | null
  treatment_type: TreatmentType
  action_plan: string
  owner_id: string
  due_at: string | null
  status: TreatmentStatus
  verification_evidence: Record<string, any>
  verified_by: string | null
  verified_at: string | null
  residual_risk_level: string | null
  residual_risk_score: number | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface GrcRiskTreatmentCreate {
  evaluation_result_id?: string | null
  treatment_type: TreatmentType
  action_plan: string
  owner_id: string
  due_at?: string | null
}

export interface GrcTreatmentUpdate {
  action_plan?: string
  due_at?: string | null
  residual_risk_level?: string | null
  residual_risk_score?: number | null
}

export interface GrcAuditEvent {
  id: number
  organization_id: string | null
  aggregate_type: string
  aggregate_id: string
  event_type: string
  actor_type: string
  actor_id: string
  action: string
  outcome: string
  metadata: Record<string, any>
  request_id: string | null
  trace_id: string | null
  source_ip: string | null
  user_agent: string | null
  created_at: string
}

export interface GrcDashboardOverview {
  total_agents: number
  risk_distribution: Record<string, number>
  evaluations_total: number
  evaluations_passed: number
  evaluations_blocked: number
  evaluations_error: number
  reviews_open: number
  reviews_overdue: number
  avg_review_seconds: number | null
  active_exceptions: number
  expiring_soon_exceptions: number
  overdue_treatments: number
  top_failing_rules: Array<{ rule_code: string; rule_name: string; fail_count: number }>
}

export interface GrcRiskDistributionItem {
  date: string | null
  risk_level: string
  count: number
}

export interface GrcComplianceTrendItem {
  date: string | null
  result: string
  count: number
}

export interface GrcReviewSlaReport {
  total_decided: number
  on_time_count: number
  sla_rate_percent: number
  avg_resolution_seconds: number | null
  avg_resolution_hours: number | null
}

export interface GrcExceptionReport {
  total: number
  by_status: Record<string, number>
  active_count: number
  expired_count: number
  rejected_count: number
}

export interface GrcTreatmentReport {
  total: number
  by_type: Record<string, number>
  by_status: Record<string, number>
  closure_rate: number
}

export interface GrcRuleHitsReportItem {
  rule_id: string
  rule_code: string
  rule_name: string
  total_evaluations: number
  pass_count: number
  fail_count: number
  error_count: number
  review_required_count: number
  hit_rate: number
  last_evaluated_at: string | null
}

export interface AgentReleaseStatus {
  agent_id: string
  last_evaluation_id: string | null
  last_evaluation_result: EvaluationResult | null
  last_evaluation_risk_level: RiskLevel | null
  last_evaluation_at: string | null
  is_stale: boolean
  active_exceptions: GrcException[]
  can_release: boolean
}

// ---- Request definitions ----

export interface RiskProfileListQuery extends PaginationQuery {
  agent_id?: string
  risk_level?: RiskLevel
  organization_id?: string
}

export type GrcRiskProfileList = ListResult<GrcRiskProfile>

export const listRiskProfilesRequest = (params: RiskProfileListQuery) =>
  createRequest<GrcRiskProfileList>('GET', '/api/v1/admin/grc/risk-profiles', { params })

export const getRiskProfileRequest = (id: string) =>
  createRequest<GrcRiskProfile>('GET', path`/api/v1/admin/grc/risk-profiles/${id}`)

export const createRiskProfileRequest = (body: GrcRiskProfileCreate) =>
  createRequest<GrcRiskProfile>('POST', '/api/v1/admin/grc/risk-profiles/assess', { data: body })

export const updateRiskProfileRequest = (id: string, body: GrcRiskProfileUpdate) =>
  createRequest<GrcRiskProfile>('PUT', path`/api/v1/admin/grc/risk-profiles/${id}`, { data: body })

export interface GrcRuleListQuery extends PaginationQuery {
  category?: string
  is_active?: boolean
  keyword?: string
  organization_id?: string
}

export type GrcRuleList = ListResult<GrcRule>

export const listGrcRulesRequest = (params: GrcRuleListQuery) =>
  createRequest<GrcRuleList>('GET', '/api/v1/admin/grc/rules', { params })

export const getGrcRuleRequest = (id: string) =>
  createRequest<GrcRule>('GET', path`/api/v1/admin/grc/rules/${id}`)

export const createGrcRuleRequest = (body: GrcRuleCreate) =>
  createRequest<GrcRule>('POST', '/api/v1/admin/grc/rules', { data: body })

export const updateGrcRuleRequest = (id: string, body: GrcRuleUpdate) =>
  createRequest<GrcRule>('PATCH', path`/api/v1/admin/grc/rules/${id}`, { data: body })

export const createGrcRuleVersionRequest = (ruleId: string, body: GrcRuleVersionCreate) =>
  createRequest<GrcRuleVersion>('POST', path`/api/v1/admin/grc/rules/${ruleId}/versions`, { data: body })

export const publishGrcRuleVersionRequest = (ruleId: string, version: number, body: GrcRuleVersionPublish) =>
  createRequest<GrcRuleVersion>('POST', path`/api/v1/admin/grc/rules/${ruleId}/versions/${version}/publish`, { data: body })

export const retireGrcRuleVersionRequest = (ruleId: string, version: number) =>
  createRequest<GrcRuleVersion>('POST', path`/api/v1/admin/grc/rules/${ruleId}/versions/${version}/retire`, { data: {} })

export interface GrcRuleValidateBody {
  evaluator_type?: string
  evaluator_config?: Record<string, unknown>
  applicable_scope?: Record<string, unknown>
  evidence_requirements?: Record<string, unknown>
}

export interface GrcRuleValidateResult {
  valid: boolean
  evaluator_type: string
  evaluator?: string | null
  applicable_scope: Record<string, unknown>
  evidence_requirements?: Record<string, unknown>
  errors: string[]
  warnings: string[]
  required_fields?: string[]
  examples?: {
    applicable_scope?: Record<string, unknown>
    evidence_requirements?: Record<string, unknown>
    evaluator_config?: Record<string, unknown>
  }
}

export const validateRuleEvaluatorRequest = (body: GrcRuleValidateBody) =>
  createRequest<GrcRuleValidateResult>('POST', '/api/v1/admin/grc/rules/validate', { data: body })

export interface GrcRuleTestBody {
  evaluator_type?: string
  evaluator_config?: Record<string, unknown>
  applicable_scope?: Record<string, unknown>
  evidence_requirements?: Record<string, unknown>
  input_snapshot?: Record<string, unknown>
}

export interface GrcRuleTestResult {
  valid: boolean
  errors?: string[]
  result?: 'pass' | 'fail' | 'error' | 'review_required'
  message?: string
  evidence?: Record<string, unknown>
}

export const testRuleEvaluatorRequest = (body: GrcRuleTestBody) =>
  createRequest<GrcRuleTestResult>('POST', '/api/v1/admin/grc/rules/test', { data: body })

export interface GrcEvaluationListQuery extends PaginationQuery {
  agent_id?: string
  result?: EvaluationResult
  risk_level?: RiskLevel
}

export type GrcEvaluationList = ListResult<GrcEvaluation>

export const createEvaluationRequest = (body: GrcEvaluationCreate) =>
  createRequest<{ id: string; status: string }>('POST', '/api/v1/admin/grc/evaluations', { data: body })

export const listEvaluationsRequest = (params: GrcEvaluationListQuery) =>
  createRequest<GrcEvaluationList>('GET', '/api/v1/admin/grc/evaluations', { params })

export const getEvaluationRequest = (id: string) =>
  createRequest<GrcEvaluation>('GET', path`/api/v1/admin/grc/evaluations/${id}`)

export const getEvaluationResultsRequest = (evaluationId: string) =>
  createRequest<ListResult<GrcEvaluationResult>>('GET', path`/api/v1/admin/grc/evaluations/${evaluationId}/results`)

export const rerunEvaluationRequest = (id: string) =>
  createRequest<GrcEvaluation>('POST', path`/api/v1/admin/grc/evaluations/${id}/rerun`, { data: {} })

export const getAgentReleaseStatusRequest = (agentId: string) =>
  createRequest<AgentReleaseStatus>('GET', path`/api/v1/admin/grc/agents/${agentId}/release-status`)

export interface GrcReviewCaseListQuery extends PaginationQuery {
  status?: ReviewStatus
  risk_level?: RiskLevel
  assignee_id?: string
  organization_id?: string
  keyword?: string
}

export type GrcReviewCaseList = ListResult<GrcReviewCase>

export const listReviewCasesRequest = (params: GrcReviewCaseListQuery) =>
  createRequest<GrcReviewCaseList>('GET', '/api/v1/admin/grc/reviews', { params })

export const getReviewCaseRequest = (id: string) =>
  createRequest<GrcReviewCase>('GET', path`/api/v1/admin/grc/reviews/${id}`)

export const assignReviewCaseRequest = (id: string, body: GrcReviewCaseAssign) =>
  createRequest<GrcReviewCase>('POST', path`/api/v1/admin/grc/reviews/${id}/assign`, { data: body })

export const submitReviewDecisionRequest = (id: string, body: GrcReviewDecisionCreate) =>
  createRequest<GrcReviewDecision>('POST', path`/api/v1/admin/grc/reviews/${id}/decisions`, { data: body })

export const listReviewDecisionsRequest = (caseId: string) =>
  createRequest<GrcReviewDecision[]>('GET', path`/api/v1/admin/grc/reviews/${caseId}/decisions`)

export interface GrcExceptionListQuery extends PaginationQuery {
  status?: ExceptionStatus
  rule_id?: string
  organization_id?: string
  keyword?: string
}

export type GrcExceptionList = ListResult<GrcException>

export const listExceptionsRequest = (params: GrcExceptionListQuery) =>
  createRequest<GrcExceptionList>('GET', '/api/v1/admin/grc/exceptions', { params })

export const requestExceptionRequest = (caseId: string, body: GrcExceptionCreate) =>
  createRequest<GrcException>('POST', path`/api/v1/admin/grc/reviews/${caseId}/exceptions`, { data: body })

export const approveExceptionRequest = (exceptionId: string) =>
  createRequest<GrcException>('POST', path`/api/v1/admin/grc/exceptions/${exceptionId}/approve`, { data: {} })

export const rejectExceptionRequest = (exceptionId: string, reason: string) =>
  createRequest<GrcException>('POST', path`/api/v1/admin/grc/exceptions/${exceptionId}/reject`, { data: { reason } })

export const revokeExceptionRequest = (exceptionId: string, reason: string) =>
  createRequest<GrcException>('POST', path`/api/v1/admin/grc/exceptions/${exceptionId}/revoke`, { data: { reason } })

export interface GrcTreatmentListQuery extends PaginationQuery {
  case_id?: string
  status?: TreatmentStatus
  owner_id?: string
}

export type GrcTreatmentList = ListResult<GrcRiskTreatment>

export const listTreatmentsRequest = (params: GrcTreatmentListQuery) =>
  createRequest<GrcTreatmentList>('GET', '/api/v1/admin/grc/treatments', { params })

export const createTreatmentRequest = (caseId: string, body: GrcRiskTreatmentCreate) =>
  createRequest<GrcRiskTreatment>('POST', path`/api/v1/admin/grc/reviews/${caseId}/treatments`, { data: body })

export const updateTreatmentRequest = (treatmentId: string, body: GrcTreatmentUpdate) =>
  createRequest<GrcRiskTreatment>('PATCH', path`/api/v1/admin/grc/treatments/${treatmentId}`, { data: body })

export const verifyTreatmentRequest = (treatmentId: string, evidence: Record<string, any>) =>
  createRequest<GrcRiskTreatment>('POST', path`/api/v1/admin/grc/treatments/${treatmentId}/verify`, { data: { verification_evidence: evidence } })

export const closeTreatmentRequest = (treatmentId: string) =>
  createRequest<GrcRiskTreatment>('POST', path`/api/v1/admin/grc/treatments/${treatmentId}/close`, { data: {} })

export const getDashboardOverviewRequest = (days = 30, organizationId?: string) => {
  const params: Record<string, any> = { days: String(days) }
  if (organizationId) params.organization_id = organizationId
  return createRequest<GrcDashboardOverview>('GET', '/api/v1/admin/grc/dashboard/overview', { params })
}

export const getRiskDistributionRequest = (days = 90, organizationId?: string) => {
  const params: Record<string, any> = { days: String(days) }
  if (organizationId) params.organization_id = organizationId
  return createRequest<GrcRiskDistributionItem[]>('GET', '/api/v1/admin/grc/reports/risk-distribution', { params })
}

export const getComplianceTrendRequest = (days = 90, organizationId?: string) => {
  const params: Record<string, any> = { days: String(days) }
  if (organizationId) params.organization_id = organizationId
  return createRequest<GrcComplianceTrendItem[]>('GET', '/api/v1/admin/grc/reports/compliance-trend', { params })
}

export const getReviewSlaReportRequest = (days = 30, organizationId?: string) => {
  const params: Record<string, any> = { days: String(days) }
  if (organizationId) params.organization_id = organizationId
  return createRequest<GrcReviewSlaReport>('GET', '/api/v1/admin/grc/reports/review-sla', { params })
}

export const getExceptionReportRequest = (days = 30, organizationId?: string) => {
  const params: Record<string, any> = { days: String(days) }
  if (organizationId) params.organization_id = organizationId
  return createRequest<GrcExceptionReport>('GET', '/api/v1/admin/grc/reports/exceptions', { params })
}

export const getTreatmentReportRequest = (days = 30, organizationId?: string) => {
  const params: Record<string, any> = { days: String(days) }
  if (organizationId) params.organization_id = organizationId
  return createRequest<GrcTreatmentReport>('GET', '/api/v1/admin/grc/reports/treatments', { params })
}

export const getRuleHitsReportRequest = (days = 30, organizationId?: string) => {
  const params: Record<string, any> = { days: String(days) }
  if (organizationId) params.organization_id = organizationId
  return createRequest<GrcRuleHitsReportItem[]>('GET', '/api/v1/admin/grc/reports/rule-hits', { params })
}

export interface GrcAuditEventListQuery extends PaginationQuery {
  aggregate_type?: string
  aggregate_id?: string
  event_type?: string
  actor_id?: string
  organization_id?: string
}

export type GrcAuditEventList = ListResult<GrcAuditEvent>

export const listAuditEventsRequest = (params: GrcAuditEventListQuery) =>
  createRequest<GrcAuditEventList>('GET', '/api/v1/admin/grc/audit-events', { params })

export const getAuditEventRequest = (id: number) =>
  createRequest<GrcAuditEvent>('GET', path`/api/v1/admin/grc/audit-events/${id}`)

export const verifyAuditChainRequest = (fromId?: number, toId?: number) => {
  const params: Record<string, any> = {}
  if (fromId) params.from_id = String(fromId)
  if (toId) params.to_id = String(toId)
  return createRequest<{
    from_id: number
    to_id: number
    chain_valid: boolean
    events_in_range: number
    broken_at: number | null
  }>('GET', '/api/v1/admin/grc/audit-events/verify-chain', { params })
}

// ============ Reports export ============
export interface GrcReportExportBody {
  report_type: string
  format: 'csv' | 'xlsx'
}

export interface GrcReportExportJob {
  job_id: string
  status: string
  format?: string
  report_type?: string
}

export interface GrcReportExportStatus {
  job_id: string
  status: string
  download_url?: string
}

export const exportReportRequest = (body: GrcReportExportBody) =>
  createRequest<GrcReportExportJob>('POST', '/api/v1/admin/grc/reports/exports', { data: body })

export const getExportStatusRequest = (jobId: string) =>
  createRequest<GrcReportExportStatus>('GET', path`/api/v1/admin/grc/reports/exports/${jobId}`)
