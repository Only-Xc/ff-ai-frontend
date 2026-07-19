import {
  cancelProductionApprovalRequest,
  createProductionApprovalRequest,
  getProductionApprovalRequest,
  listProductionApprovalsRequest,
  rollbackProductionAgentRequest,
  submitProductionDecisionRequest,
  type ProductionApproval,
  type ProductionApprovalCancelPayload,
  type ProductionApprovalCreatePayload,
  type ProductionApprovalDecisionPayload,
  type ProductionApprovalDetail,
  type ProductionApprovalListResponse,
  type ProductionApprovalQuery,
  type ProductionRollback,
  type ProductionRollbackCreatePayload,
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
  list: (query: ProductionApprovalQuery) => [...productionKeys.lists(), query] as const,
  details: () => [...productionKeys.all, 'detail'] as const,
  detail: (id: string) => [...productionKeys.details(), id] as const,
}

export const productionApprovals_list = (params?: ProductionApprovalQuery) =>
  request<ProductionApprovalListResponse>(listProductionApprovalsRequest, params)

export const productionApprovals_get = (approvalId: string) =>
  request<ProductionApprovalDetail>(getProductionApprovalRequest, approvalId)

export const productionApprovals_create = (data: ProductionApprovalCreatePayload) =>
  request<ProductionApprovalDetail>(createProductionApprovalRequest, data)

export const productionApprovals_submitDecision = (
  approvalId: string,
  data: ProductionApprovalDecisionPayload,
) => request<ProductionApprovalDetail>(submitProductionDecisionRequest, approvalId, data)

export const productionApprovals_cancel = (
  approvalId: string,
  data: ProductionApprovalCancelPayload,
) => request<ProductionApprovalDetail>(cancelProductionApprovalRequest, approvalId, data)

export const productionAgents_rollback = (
  agentId: string,
  data: ProductionRollbackCreatePayload,
) => request<ProductionRollback>(rollbackProductionAgentRequest, agentId, data)
