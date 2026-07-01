import {
  demoteAdminAgentRequest,
  listAdminAgentLifecycleOperationsByAgentRequest,
  listAdminAgentLifecycleOperationsRequest,
  listAdminHotLifecycleCandidatesRequest,
  listAdminIdleLifecycleCandidatesRequest,
  listAdminObserveLifecycleCandidatesRequest,
  promoteAdminAgentRequest,
  type LifecycleHotCandidateListQuery,
  type LifecycleIdleCandidateListQuery,
  type LifecycleObserveCandidateListQuery,
  type LifecycleOperationListQuery,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  AgentLifecycleOperation,
  DemoteAgent,
  DemoteAgentPayload,
  HotLifecycleCandidate,
  LifecycleCandidateFilterQuery,
  IdleLifecycleCandidate,
  LifecycleHotCandidateListQuery,
  LifecycleIdleCandidateListQuery,
  LifecycleObserveCandidateListQuery,
  LifecycleOperationListQuery,
  ObserveLifecycleCandidate,
  PromoteAgent,
  PromoteAgentPayload,
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
  lifecycleObserveLists: () =>
    [...adminAgentsKeys.all, 'lifecycleObserveCandidates'] as const,
  lifecycleObserveList: (query: LifecycleObserveCandidateListQuery) =>
    [...adminAgentsKeys.lifecycleObserveLists(), query] as const,
  lifecycleOperationLists: () =>
    [...adminAgentsKeys.all, 'lifecycleOperations'] as const,
  lifecycleOperationList: (query: LifecycleOperationListQuery) =>
    [...adminAgentsKeys.lifecycleOperationLists(), query] as const,
  lifecycleOperationListByAgent: (
    agentId: string,
    query: LifecycleOperationListQuery,
  ) => [...adminAgentsKeys.lifecycleOperationLists(), agentId, query] as const,
}

export const adminAgents_getIdleLifecycleCandidates = request(
  listAdminIdleLifecycleCandidatesRequest,
)
export const adminAgents_getHotLifecycleCandidates = request(
  listAdminHotLifecycleCandidatesRequest,
)
export const adminAgents_getObserveLifecycleCandidates = request(
  listAdminObserveLifecycleCandidatesRequest,
)
export const adminAgents_demote = request(demoteAdminAgentRequest)
export const adminAgents_promote = request(promoteAdminAgentRequest)
export const adminAgents_getLifecycleOperations = request(
  listAdminAgentLifecycleOperationsRequest,
)
export const adminAgents_getLifecycleOperationsByAgent = request(
  listAdminAgentLifecycleOperationsByAgentRequest,
)
