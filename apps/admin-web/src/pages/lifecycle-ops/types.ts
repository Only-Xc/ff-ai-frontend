import type {
  DemoteAgentPayload,
  LifecycleHotCandidateListQuery,
  LifecycleIdleCandidateListQuery,
  PromoteAgentPayload,
} from '@/api/lifecycle-ops'

export type FilterValues = Pick<LifecycleIdleCandidateListQuery, 'idle_days'> &
  Pick<LifecycleHotCandidateListQuery, 'min_daily_invocations'>

export type DemoteFormValues = Pick<DemoteAgentPayload, 'reason'>

export type PromoteFormValues = Pick<PromoteAgentPayload, 'reason'> & {
  replicas: NonNullable<PromoteAgentPayload['replicas']>
  cpu?: NonNullable<PromoteAgentPayload['resources']>['cpu']
  memory?: NonNullable<PromoteAgentPayload['resources']>['memory']
}

export type CandidateTab = 'idle' | 'hot'
