import type { FilterValues, PromoteFormValues } from './types'

export const DEFAULT_FILTER_VALUES: FilterValues = {
  idle_days: 7,
  min_daily_invocations: 1000,
}

export const DEFAULT_PROMOTE_VALUES: Pick<
  PromoteFormValues,
  'cpu' | 'memory' | 'replicas'
> = {
  cpu: '500m',
  memory: '512Mi',
  replicas: 1,
}
