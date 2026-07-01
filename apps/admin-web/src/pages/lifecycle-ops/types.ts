import type {
  DemoteAgentPayload,
  LifecycleCandidateFilterQuery,
  LifecycleHotCandidateListQuery,
  LifecycleIdleCandidateListQuery,
  PromoteAgentPayload,
} from '@/api/lifecycle-ops'
import type { Dayjs } from 'dayjs'

export type RuntimeStatusFilter = NonNullable<
  LifecycleCandidateFilterQuery['runtime_status']
>

export type FilterValues = Pick<LifecycleIdleCandidateListQuery, 'idle_days'> &
  Pick<LifecycleHotCandidateListQuery, 'min_daily_invocations'> &
  LifecycleCandidateFilterQuery & {
    invoked_range?: [Dayjs | null, Dayjs | null] | null
  }

export type DemoteFormValues = Pick<
  DemoteAgentPayload,
  'reason' | 'preserve_data' | 'remove_image'
>

export type PromoteFormValues = Pick<PromoteAgentPayload, 'reason'> & {
  replicas: NonNullable<PromoteAgentPayload['replicas']>
  cpu?: NonNullable<PromoteAgentPayload['resources']>['cpu']
  memory?: NonNullable<PromoteAgentPayload['resources']>['memory']
}

export type CandidateTab = 'idle' | 'observe' | 'hot'
