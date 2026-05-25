import type { Dayjs } from 'dayjs'

import type {
  BillingResourceType,
  TenantBillingQuery,
} from '@/api/billing-center'

type BillingDateRange = [Dayjs | null, Dayjs | null] | null

export interface BillingFilterValues {
  agent_id?: string
  date_range?: BillingDateRange
  resource_type?: BillingResourceType
}

function formatDateParam(value: Dayjs | null | undefined) {
  return value?.format('YYYY-MM-DD')
}

export function normalizeFilters(
  values: BillingFilterValues,
): Omit<TenantBillingQuery, 'skip' | 'limit'> {
  const agentId = values.agent_id?.trim()
  const [startDateValue, endDateValue] = values.date_range ?? []

  return {
    agent_id: agentId === '' ? undefined : agentId,
    end_date: formatDateParam(endDateValue),
    resource_type: values.resource_type,
    start_date: formatDateParam(startDateValue),
  }
}
