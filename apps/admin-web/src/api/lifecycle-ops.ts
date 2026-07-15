import {
  demoteAdminAgentRequest,
  listAdminHotLifecycleCandidatesRequest,
  listAdminIdleLifecycleCandidatesRequest,
  promoteAdminAgentRequest,
  type LifecycleHotCandidateListQuery,
  type LifecycleIdleCandidateListQuery,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  DemoteAgentPayload,
  HotLifecycleCandidate,
  IdleLifecycleCandidate,
  LifecycleHotCandidateListQuery,
  LifecycleIdleCandidateListQuery,
  PromoteAgentPayload,
  StageSwitchRequestAck,
} from '@ff-ai-frontend/api'

export const adminAgentsKeys = {
  all: ['adminAgents'] as const,
  lifecycleIdleLists: () =>
    [...adminAgentsKeys.all, 'lifecycleIdleCandidates'] as const,
  lifecycleIdleList: (query: LifecycleIdleCandidateListQuery) =>
    [...adminAgentsKeys.lifecycleIdleLists(), query] as const,
  lifecycleHotLists: () =>
    [...adminAgentsKeys.all, 'lifecycleHotCandidates'] as const,
  lifecycleHotList: (query: LifecycleHotCandidateListQuery) =>
    [...adminAgentsKeys.lifecycleHotLists(), query] as const,
}

export const adminAgents_getIdleLifecycleCandidates = request(
  listAdminIdleLifecycleCandidatesRequest,
)
export const adminAgents_getHotLifecycleCandidates = request(
  listAdminHotLifecycleCandidatesRequest,
)
export const adminAgents_demote = request(demoteAdminAgentRequest)
export const adminAgents_promote = request(promoteAdminAgentRequest)
