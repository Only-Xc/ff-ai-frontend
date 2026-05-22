export interface FilterValues {
  idle_days: number
  min_daily_invocations: number
}

export interface DemoteFormValues {
  reason: string
}

export interface PromoteFormValues {
  reason: string
  replicas: number
  cpu?: string
  memory?: string
}

export type CandidateTab = 'idle' | 'hot'
