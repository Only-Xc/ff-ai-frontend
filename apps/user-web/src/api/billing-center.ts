import { requestClient } from '@/utils/request'
import type { ListResult, PaginationQuery } from './types'

export type BillingResourceType =
  | 'compute_token'
  | 'storage_gb'
  | 'network_egress_gb'
  | 'compute_hour'

export interface TenantBillingRecord {
  record_id: string
  resource_type: BillingResourceType
  amount: number
  unit: string
  cost: number
  agent_id: string | null
  agent_name: string | null
  task_id: string | null
  description: string | null
  created_at: string
}

export type TenantBillingQuery = {
  agent_id?: string
  resource_type?: BillingResourceType
  start_date?: string
  end_date?: string
} & PaginationQuery

export interface TenantBillingListResult extends ListResult<TenantBillingRecord> {
  total_cost: number
}

export type TenantBillingRecordDetail = TenantBillingRecord

export interface TenantBillingBalance {
  tenant_id: string
  balance: number
  updated_at: string
  balance_by_type: Record<BillingResourceType, number>
}

export const tenantBillingKeys = {
  all: ['tenant-billing'] as const,
  balance: () => [...tenantBillingKeys.all, 'balance'] as const,
  list: (params: TenantBillingQuery) =>
    [...tenantBillingKeys.all, 'list', params] as const,
  detail: (recordId: string | undefined) =>
    [...tenantBillingKeys.all, 'detail', recordId] as const,
}

export function tenantBilling_records(
  params: TenantBillingQuery,
): Promise<TenantBillingListResult> {
  return requestClient({
    url: '/api/tenant/billing/records',
    method: 'GET',
    params: {
      agent_id: params.agent_id,
      resource_type: params.resource_type,
      start_date: params.start_date,
      end_date: params.end_date,
      skip: params.skip,
      limit: params.limit,
    },
  })
}

export function tenantBilling_balance(): Promise<TenantBillingBalance> {
  return requestClient({
    url: '/api/tenant/billing/balance',
    method: 'GET',
  })
}

export function tenantBilling_record(
  recordId: string,
): Promise<TenantBillingRecordDetail> {
  return requestClient({
    url: `/api/tenant/billing/records/${recordId}`,
    method: 'GET',
  })
}
