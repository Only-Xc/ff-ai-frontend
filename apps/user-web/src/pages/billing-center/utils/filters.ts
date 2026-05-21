import { format } from 'date-fns'

import type { BillingResourceType } from '@/api/billing'

type BillingDateRange = [Date | null, Date | null] | null

export interface BillingFilterValues {
  agent_id?: string
  date_range?: BillingDateRange
  resource_type?: BillingResourceType
}

export interface BillingFilters {
  agent_id?: string
  end_date?: string
  resource_type?: BillingResourceType
  start_date?: string
}

function formatDateParam(value: Date | null | undefined) {
  return value ? format(value, 'yyyy-MM-dd') : undefined
}

export function normalizeFilters(values: BillingFilterValues): BillingFilters {
  const agentId = values.agent_id?.trim()
  const [startDateValue, endDateValue] = values.date_range ?? []

  return {
    agent_id: agentId === '' ? undefined : agentId,
    end_date: formatDateParam(endDateValue),
    resource_type: values.resource_type,
    start_date: formatDateParam(startDateValue),
  }
}
