import { createRequest, path } from '../client.js'
import type { ListResult, PaginationQuery } from '../common.js'

export interface LifecycleIdleCandidateListQuery extends PaginationQuery {
  idle_days: number
}

export interface LifecycleHotCandidateListQuery extends PaginationQuery {
  min_daily_invocations: number
}

export interface IdleLifecycleCandidate {
  name: string
  agent_id: string
  tenant_id: string
  idle_days: number
  daily_avg_cost: number
  last_invoked_at: string | null
}

export interface HotLifecycleCandidate {
  name: string
  agent_id: string
  tenant_id: string
  daily_avg_cost: number
  avg_duration_ms: number
  daily_invocations: number
}

export interface DemoteAgentPayload {
  reason: string
  operator_id?: string
}

export interface DemoteAgent {
  message: string
  agent_id: string
  current_status: string
  previous_status: string
}

export interface PromoteAgentPayload {
  reason: string
  replicas?: number
  resources?: {
    cpu?: string
    memory?: string
  }
  operator_id?: string
}

export interface PromoteAgent {
  message: string
  task_id: string
  agent_id: string
  target_status: string
  previous_status: string
}

export const listAdminIdleLifecycleCandidatesRequest = (
  params: LifecycleIdleCandidateListQuery,
) =>
  createRequest<ListResult<IdleLifecycleCandidate>>(
    'GET',
    '/api/admin/agents/lifecycle-candidates/idle',
    { params },
  )

export const listAdminHotLifecycleCandidatesRequest = (
  params: LifecycleHotCandidateListQuery,
) =>
  createRequest<ListResult<HotLifecycleCandidate>>(
    'GET',
    '/api/admin/agents/lifecycle-candidates/hot',
    { params },
  )

export const demoteAdminAgentRequest = (
  agentId: string,
  data: DemoteAgentPayload,
) =>
  createRequest<DemoteAgent>('POST', path`/api/admin/agents/${agentId}/demote`, {
    data,
  })

export const promoteAdminAgentRequest = (
  agentId: string,
  data: PromoteAgentPayload,
) =>
  createRequest<PromoteAgent>(
    'POST',
    path`/api/admin/agents/${agentId}/promote`,
    { data },
  )
