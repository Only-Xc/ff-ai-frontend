import {
  type AgentReleaseStatus,
  type GrcAuditEvent,
  type GrcComplianceTrendItem,
  type GrcDashboardOverview,
  type GrcException,
  type GrcExceptionCreate,
  type GrcExceptionReport,
  type GrcEvaluation,
  type GrcEvaluationCreate,
  type GrcEvaluationResult,
  type GrcRiskDistributionItem,
  type GrcRiskProfile,
  type GrcRiskProfileCreate,
  type GrcRiskProfileUpdate,
  type GrcRiskTreatment,
  type GrcRiskTreatmentCreate,
  type GrcTreatmentUpdate,
  type GrcReviewCase,
  type GrcReviewCaseAssign,
  type GrcReviewDecision,
  type GrcReviewDecisionCreate,
  type GrcReviewSlaReport,
  type GrcRule,
  type GrcRuleCreate,
  type GrcRuleUpdate,
  type GrcRuleVersion,
  type GrcRuleVersionCreate,
  type GrcRuleVersionPublish,
  type GrcRuleTestBody,
  type GrcRuleTestResult,
  type GrcRuleStatsResponse,
  type GrcRuleVersionList,
  type GrcTreatmentReport,
  type RiskLevel,
  type ExceptionStatus,
  type GrcExceptionList,
  assignReviewCaseRequest,
  approveExceptionRequest,
  closeTreatmentRequest,
  createEvaluationRequest,
  createGrcRuleRequest,
  createGrcRuleVersionRequest,
  createRiskProfileRequest,
  createTreatmentRequest,
  getAgentReleaseStatusRequest,
  getAuditEventRequest,
  getComplianceTrendRequest,
  getDashboardOverviewRequest,
  getExceptionReportRequest,
  getEvaluationRequest,
  getEvaluationResultsRequest,
  getExportStatusRequest,
  exportReportRequest,
  getRiskDistributionRequest,
  getGrcRuleRequest,
  getRiskProfileRequest,
  getReviewCaseRequest,
  getReviewSlaReportRequest,
  getRuleHitsReportRequest,
  getTreatmentReportRequest,
  listAuditEventsRequest,
  listExceptionsRequest,
  listEvaluationsRequest,
  listGrcRulesRequest,
  listReviewCasesRequest,
  listReviewDecisionsRequest,
  listTreatmentsRequest,
  listRiskProfilesRequest,
  publishGrcRuleVersionRequest,
  rejectExceptionRequest,
  requestExceptionRequest,
  rerunEvaluationRequest,
  retireGrcRuleVersionRequest,
  revokeExceptionRequest,
  ruleVersionsRequest,
  ruleStatsRequest,
  submitReviewDecisionRequest,
  updateGrcRuleRequest,
  updateRiskProfileRequest,
  updateTreatmentRequest,
  validateRuleEvaluatorRequest,
  testRuleEvaluatorRequest,
  verifyAuditChainRequest,
  verifyTreatmentRequest,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  AgentReleaseStatus,
  GrcAuditEvent,
  GrcComplianceTrendItem,
  GrcDashboardOverview,
  GrcException,
  GrcExceptionCreate,
  GrcExceptionReport,
  GrcEvaluation,
  GrcEvaluationCreate,
  GrcEvaluationResult,
  GrcRiskDistributionItem,
  GrcRiskProfile,
  GrcRiskProfileCreate,
  GrcRiskProfileUpdate,
  GrcRiskTreatment,
  GrcRiskTreatmentCreate,
  GrcReviewCase,
  GrcReviewCaseAssign,
  GrcReviewDecision,
  GrcReviewDecisionCreate,
  GrcReviewSlaReport,
  GrcTreatmentReport,
  GrcTreatmentUpdate,
  GrcRule,
  GrcRuleCreate,
  GrcRuleUpdate,
  GrcRuleVersion,
  GrcRuleVersionCreate,
  GrcRuleVersionPublish,
  GrcRuleTestBody,
  GrcRuleTestResult,
  GrcRuleHitsReportItem,
  GrcRuleStatsResponse,
  GrcRuleVersionList,
  GrcEvaluationCreate,
  RiskLevel,
  ExceptionStatus,
}

export const grcKeys = {
  all: ['grc'] as const,
  dashboard: () => [...grcKeys.all, 'dashboard'] as const,
  riskProfiles: (query: Record<string, unknown>) => [...grcKeys.all, 'riskProfiles', query] as const,
  riskProfile: (id: string) => [...grcKeys.all, 'riskProfile', id] as const,
  rules: (query: Record<string, unknown>) => [...grcKeys.all, 'rules', query] as const,
  rule: (id: string) => [...grcKeys.all, 'rule', id] as const,
  ruleVersions: (ruleId: string) => [...grcKeys.all, 'ruleVersions', ruleId] as const,
  ruleStats: (ruleId: string) => [...grcKeys.all, 'ruleStats', ruleId] as const,
  evaluations: (query: Record<string, unknown>) => [...grcKeys.all, 'evaluations', query] as const,
  evaluation: (id: string) => [...grcKeys.all, 'evaluation', id] as const,
  reviewCases: (query: Record<string, unknown>) => [...grcKeys.all, 'reviewCases', query] as const,
  reviewCase: (id: string) => [...grcKeys.all, 'reviewCase', id] as const,
  exceptions: (query: Record<string, unknown>) => [...grcKeys.all, 'exceptions', query] as const,
  treatments: (query: Record<string, unknown>) => [...grcKeys.all, 'treatments', query] as const,
  reports: () => [...grcKeys.all, 'reports'] as const,
  auditEvents: (query: Record<string, unknown>) => [...grcKeys.all, 'auditEvents', query] as const,
  agentRelease: (agentId: string) => [...grcKeys.all, 'agentRelease', agentId] as const,
}

// Dashboard
export const grcDashboard_get = request(getDashboardOverviewRequest)

// Risk Profiles
export const grcRiskProfiles_list = request(listRiskProfilesRequest)
export const grcRiskProfile_get = request(getRiskProfileRequest)
export const grcRiskProfile_create = request(createRiskProfileRequest)
export const grcRiskProfile_update = request(updateRiskProfileRequest)

// Rules
export const grcRules_list = request(listGrcRulesRequest)
export const grcRule_get = request(getGrcRuleRequest)
export const grcRule_create = request(createGrcRuleRequest)
export const grcRule_update = request(updateGrcRuleRequest)
export const grcRuleVersion_create = request(createGrcRuleVersionRequest)
export const grcRuleVersion_publish = request(publishGrcRuleVersionRequest)
export const grcRuleVersion_retire = request(retireGrcRuleVersionRequest)
export const grcRule_validate = request(validateRuleEvaluatorRequest)
export const grcRule_test = request(testRuleEvaluatorRequest)
export const grcRuleVersions_list = request(ruleVersionsRequest)
export const grcRuleStats_get = request(ruleStatsRequest)

// Evaluations
export const grcEvaluations_create = request(createEvaluationRequest)
export const grcEvaluations_list = request(listEvaluationsRequest)
export const grcEvaluation_get = request(getEvaluationRequest)
export const grcEvaluationResults_list = request(getEvaluationResultsRequest)
export const grcEvaluation_rerun = request(rerunEvaluationRequest)
export const grcAgentReleaseStatus_get = request(getAgentReleaseStatusRequest)

// Reviews
export const grcReviewCases_list = request(listReviewCasesRequest)
export const grcReviewCase_get = request(getReviewCaseRequest)
export const grcReviewCase_assign = request(assignReviewCaseRequest)
export const grcReviewDecision_submit = request(submitReviewDecisionRequest)
export const grcReviewDecisions_list = request(listReviewDecisionsRequest)

// Exceptions
export const grcExceptions_list = request(listExceptionsRequest)
export const grcException_request = request(requestExceptionRequest)
export const grcException_approve = request(approveExceptionRequest)
export const grcException_reject = request(rejectExceptionRequest)
export const grcException_revoke = request(revokeExceptionRequest)

// Exception convenience wrappers
export const getExceptions = (params: Parameters<typeof listExceptionsRequest>[0]): Promise<GrcExceptionList> =>
  grcExceptions_list(params)

export const approveException = (id: string) => grcException_approve(id)
export const rejectException = (id: string, reason: string) => grcException_reject(id, reason)
export const revokeException = (id: string, reason: string) => grcException_revoke(id, reason)

// Treatments
export const grcTreatments_list = request(listTreatmentsRequest)
export const grcTreatment_create = request(createTreatmentRequest)
export const grcTreatment_update = request(updateTreatmentRequest)
export const grcTreatment_verify = request(verifyTreatmentRequest)
export const grcTreatment_close = request(closeTreatmentRequest)

// Reports
export const grcReports_riskDistribution = request(getRiskDistributionRequest)
export const grcReports_complianceTrend = request(getComplianceTrendRequest)
export const grcReports_reviewSla = request(getReviewSlaReportRequest)
export const grcReports_exceptions = request(getExceptionReportRequest)
export const grcReports_treatments = request(getTreatmentReportRequest)
export const grcReports_export = request(exportReportRequest)
export const grcReports_exportStatus = request(getExportStatusRequest)

// Rule hits
export const grcReports_ruleHits = request(getRuleHitsReportRequest)

// Audit
export const grcAuditEvents_list = request(listAuditEventsRequest)
export const grcAuditEvent_get = request(getAuditEventRequest)
export const grcAuditChain_verify = request(verifyAuditChainRequest)
