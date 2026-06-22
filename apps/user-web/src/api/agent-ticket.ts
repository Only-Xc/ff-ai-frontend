import {
  getTenantAgentDetailRequest,
  listTenantAgentsRequest,
  listTenantTasksRequest,
  updateTenantAgentBudgetRequest,
  type TenantAgentQuery,
  type TenantTaskQuery,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  AgentStatus,
  AgentStatusFilter,
  TaskStatus,
  TaskStatusFilter,
  TaskType,
  TenantAgent,
  TenantAgentBudgetResponse,
  TenantAgentDetail,
  TenantAgentQuery,
  TenantTask,
  TenantTaskQuery,
} from '@ff-ai-frontend/api'

export const tenantTaskKeys = {
  all: ['tenant-task'] as const,
  list: (params: TenantTaskQuery) =>
    [...tenantTaskKeys.all, 'list', params] as const,
}

export const tenantAgentKeys = {
  all: ['tenant-agent'] as const,
  list: (params: TenantAgentQuery) =>
    [...tenantAgentKeys.all, 'list', params] as const,
  detail: (agentId: string | undefined) =>
    [...tenantAgentKeys.all, 'detail', agentId] as const,
}

export const tenantTasks_list = request(listTenantTasksRequest)
export const tenantAgents_list = request(listTenantAgentsRequest)
export const tenantAgents_detail = request(getTenantAgentDetailRequest)
export const tenantAgents_updateBudget = request(updateTenantAgentBudgetRequest)
