import { createRequest, path } from '../client.js'
import type { ListResult, PaginationQuery } from '../common.js'

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

export type AgentStatus = 'running' | 'stopped' | 'sandbox'

export type AgentStatusFilter = AgentStatus | ''

export interface TenantAgent {
  name: string
  status: AgentStatus
  task_id: string | null
  agent_id: string
  created_at: string
  description: string
  endpoint_url: string | null
  last_invoked_at: string | null
  is_favorited: boolean
}

export type TenantAgentQuery = {
  status?: AgentStatusFilter
} & PaginationQuery

export interface TenantAgentDetail extends TenantAgent {
  current_usage: number
  runtime_token_budget: number | null
}

export interface TenantAgentBudgetResponse {
  agent_id: string
  runtime_token_budget: number | null
}

export const listTenantTasksRequest = (params: TenantTaskQuery) =>
  createRequest<ListResult<TenantTask>>('GET', '/api/tenant/tasks', { params })

export const listTenantAgentsRequest = (params: TenantAgentQuery) =>
  createRequest<ListResult<TenantAgent>>('GET', '/api/tenant/agents', { params })

export const getTenantAgentDetailRequest = (agentId: string) =>
  createRequest<TenantAgentDetail>('GET', path`/api/tenant/agents/${agentId}`)

export const updateTenantAgentBudgetRequest = (
  agentId: string,
  runtimeTokenBudget: number | null,
) =>
  createRequest<TenantAgentBudgetResponse>(
    'PUT',
    path`/api/tenant/agents/${agentId}/budget`,
    { data: { runtime_token_budget: runtimeTokenBudget } },
  )
