import {
  applyProductionApprovalRequest,
  cancelProductionApprovalRequest,
  createProductionApprovalRequest,
  getProductionApprovalRequest,
  listProductionApprovalsRequest,
  rollbackProductionAgentRequest,
  submitProductionDecisionRequest,
  type ProductionApprovalQuery,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  ProductionApproval,
  ProductionApprovalCancelPayload,
  ProductionApprovalCreatePayload,
  ProductionApprovalDecisionPayload,
  ProductionApprovalDetail,
  ProductionApprovalListResponse,
  ProductionApprovalMode,
  ProductionApprovalQuery,
  ProductionApprovalStatus,
  ProductionDecision,
  ProductionRollback,
  ProductionRollbackCreatePayload,
  ProductionStatus,
} from '@ff-ai-frontend/api'

export const productionKeys = {
  all: ['production'] as const,
  lists: () => [...productionKeys.all, 'list'] as const,
  list: (query: ProductionApprovalQuery) =>
    [...productionKeys.lists(), query] as const,
  details: () => [...productionKeys.all, 'detail'] as const,
  detail: (id: string) => [...productionKeys.details(), id] as const,
}

export const productionApprovals_list = request(listProductionApprovalsRequest)

export const productionApprovals_get = request(getProductionApprovalRequest)

export const productionApprovals_create = request(
  createProductionApprovalRequest,
)

export const productionApprovals_submitDecision = request(
  submitProductionDecisionRequest,
)

export const productionApprovals_cancel = request(
  cancelProductionApprovalRequest,
)

export const productionApprovals_apply = request(applyProductionApprovalRequest)

export const productionAgents_rollback = request(rollbackProductionAgentRequest)
