import { createRequest, path } from '../client.js'
import type { ListResult, PaginationQuery } from '../common.js'

export interface LifecycleCandidateFilterQuery {
  tenant_keyword?: string
  invoked_from?: string
  invoked_to?: string
  runtime_status?: 'running' | 'sandbox'
}

export interface LifecycleIdleCandidateListQuery
  extends PaginationQuery,
    LifecycleCandidateFilterQuery {
  idle_days: number
}

export interface LifecycleHotCandidateListQuery
  extends PaginationQuery,
    LifecycleCandidateFilterQuery {
  min_daily_invocations: number
}

export interface LifecycleObserveCandidateListQuery
  extends PaginationQuery,
    LifecycleCandidateFilterQuery {
  idle_days: number
  min_daily_invocations: number
}

export interface IdleLifecycleCandidate {
  name: string
  agent_id: string
  tenant_id: string
  tenant?: string | null
  idle_days: number
  zero_traffic_days?: number | null
  daily_avg_cost: number
  last_invoked_at: string | null
  occupied_resources?: {
    cpu_seconds: number
    memory_mb_avg: number
    network_egress_bytes: number
    storage_bytes: number
    summary: string
  } | null
  suggested_action?: string | null
}

export interface HotLifecycleCandidate {
  name: string
  agent_id: string
  tenant_id: string
  daily_avg_cost: number
  avg_duration_ms: number
  daily_invocations: number
}

export interface ObserveLifecycleCandidate {
  name: string
  agent_id: string
  tenant_id: string
  tenant?: string | null
  last_invoked_at: string | null
  recent_invocations: number
  daily_avg_cost: number
  occupied_resources?: IdleLifecycleCandidate['occupied_resources']
  current_status: string
  suggested_action: string
}

export interface DemoteAgentPayload {
  reason: string
  operator_id?: string
  preserve_data?: boolean
  remove_image?: boolean
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

export interface AgentLifecycleOperation {
  id: string
  agent_id: string
  task_id?: string | null
  source_task_id?: string | null
  tenant_id: string
  operator_id?: string | null
  action: string
  reason?: string | null
  previous_status?: string | null
  target_status?: string | null
  status: string
  docker_container?: string | null
  docker_image?: string | null
  docker_network?: string | null
  docker_volume?: string | null
  endpoint_url?: string | null
  error_message?: string | null
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  finished_at?: string | null
}

export interface LifecycleOperationListQuery extends PaginationQuery {
  action?: string
  status?: string
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

export const listAdminObserveLifecycleCandidatesRequest = (
  params: LifecycleObserveCandidateListQuery,
) =>
  createRequest<ListResult<ObserveLifecycleCandidate>>(
    'GET',
    '/api/admin/agents/lifecycle-candidates/observe',
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

export const listAdminAgentLifecycleOperationsRequest = (
  params: LifecycleOperationListQuery,
) =>
  createRequest<ListResult<AgentLifecycleOperation>>(
    'GET',
    '/api/admin/agents/lifecycle-operations',
    { params },
  )

export const listAdminAgentLifecycleOperationsByAgentRequest = (
  agentId: string,
  params: LifecycleOperationListQuery,
) =>
  createRequest<ListResult<AgentLifecycleOperation>>(
    'GET',
    path`/api/admin/agents/${agentId}/lifecycle-operations`,
    { params },
  )
