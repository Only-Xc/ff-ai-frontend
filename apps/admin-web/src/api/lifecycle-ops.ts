import type { QueryKey } from '@tanstack/react-query'
import type { ListResult, PaginationQuery } from './types'

import { requestClient } from '@/utils/request'

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

export const adminAgentsKeys = {
  all: ['adminAgents'] as const,
  lifecycleIdleLists: () =>
    [...adminAgentsKeys.all, 'lifecycleIdleCandidates'] as const,
  lifecycleIdleList: (query: LifecycleIdleCandidateListQuery) =>
    [...adminAgentsKeys.lifecycleIdleLists(), query] as const satisfies QueryKey,
  lifecycleHotLists: () =>
    [...adminAgentsKeys.all, 'lifecycleHotCandidates'] as const,
  lifecycleHotList: (query: LifecycleHotCandidateListQuery) =>
    [...adminAgentsKeys.lifecycleHotLists(), query] as const satisfies QueryKey,
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

export function adminAgents_getIdleLifecycleCandidates(
  params: LifecycleIdleCandidateListQuery,
): Promise<ListResult<IdleLifecycleCandidate>> {
  return requestClient({
    url: '/api/admin/agents/lifecycle-candidates/idle',
    method: 'GET',
    params,
  })
}

export function adminAgents_getHotLifecycleCandidates(
  params: LifecycleHotCandidateListQuery,
): Promise<ListResult<HotLifecycleCandidate>> {
  return requestClient({
    url: '/api/admin/agents/lifecycle-candidates/hot',
    method: 'GET',
    params,
  })
}

export function adminAgents_demote(
  agentId: string,
  data: DemoteAgentPayload,
): Promise<DemoteAgent> {
  return requestClient({
    url: `/api/admin/agents/${encodeURIComponent(agentId)}/demote`,
    method: 'POST',
    data,
  })
}

export function adminAgents_promote(
  agentId: string,
  data: PromoteAgentPayload,
): Promise<PromoteAgent> {
  return requestClient({
    url: `/api/admin/agents/${encodeURIComponent(agentId)}/promote`,
    method: 'POST',
    data,
  })
}
