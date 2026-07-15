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

/**
 * Lifecycle demote/promote now enqueue a stage-switch approval request
 * (HTTP 202) instead of switching the stage synchronously.
 */
export interface StageSwitchRequestAck {
  request_id: string
  request_no: string
  approval_status: string
  execution_status: string
  message: string
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
  createRequest<StageSwitchRequestAck>(
    'POST',
    path`/api/admin/agents/${agentId}/demote`,
    {
      data,
    },
  )

export const promoteAdminAgentRequest = (
  agentId: string,
  data: PromoteAgentPayload,
) =>
  createRequest<StageSwitchRequestAck>(
    'POST',
    path`/api/admin/agents/${agentId}/promote`,
    { data },
  )
