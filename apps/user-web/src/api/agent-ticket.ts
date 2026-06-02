import { requestClient } from '@/utils/request'
import type { ListResult, PaginationQuery } from './types'

export type TaskStatusFilter =
  | 'active'
  | 'pending_approval'
  | 'completed'
  | 'failed'
  | ''

export type TaskStatus =
  | 'CREATED'
  | 'ANALYZING'
  | 'ROUTING'
  | 'CODING'
  | 'TESTING'
  | 'DEPLOYING'
  | 'COMPLETED'
  | 'PENDING_APPROVAL'
  | 'FAILED'

export type TaskType = 'direct_result' | 'process' | 'container'

export interface TenantTask {
  title: string
  status: TaskStatus
  task_id: string
  agent_id: string | null
  task_type: TaskType
  created_at: string
  updated_at: string
  web_url?: string
}

export type TenantTaskQuery = {
  status?: TaskStatusFilter
} & PaginationQuery

export type AgentStatus = 'running' | 'stopped' | 'sandbox' | ''

export interface TenantAgent {
  name: string
  status: AgentStatus
  task_id: string | null
  agent_id: string
  created_at: string
  description: string
  endpoint_url: string | null
  last_invoked_at: string | null
}

export type TenantAgentQuery = {
  status?: AgentStatus
} & PaginationQuery

export interface TenantAgentDetail extends TenantAgent {
  current_usage: number
  runtime_token_budget: number | null
}

export interface TenantAgentBudgetResponse {
  agent_id: string
  runtime_token_budget: number | null
}

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

export function tenantTasks_list(
  params: TenantTaskQuery,
): Promise<ListResult<TenantTask>> {
  return requestClient({
    url: '/api/tenant/tasks',
    method: 'GET',
    params: {
      status: params.status,
      skip: params.skip,
      limit: params.limit,
    },
  })
}

export function tenantAgents_list(
  params: TenantAgentQuery,
): Promise<ListResult<TenantAgent>> {
  return requestClient({
    url: '/api/tenant/agents',
    method: 'GET',
    params: {
      status: params.status,
      skip: params.skip,
      limit: params.limit,
    },
  })
}

export function tenantAgents_detail(
  agentId: string,
): Promise<TenantAgentDetail> {
  return requestClient({
    url: `/api/tenant/agents/${agentId}`,
    method: 'GET',
  })
}

export function tenantAgents_updateBudget(
  agentId: string,
  runtimeTokenBudget: number | null,
): Promise<TenantAgentBudgetResponse> {
  return requestClient({
    url: `/api/tenant/agents/${agentId}/budget`,
    method: 'PUT',
    data: {
      runtime_token_budget: runtimeTokenBudget,
    },
  })
}
