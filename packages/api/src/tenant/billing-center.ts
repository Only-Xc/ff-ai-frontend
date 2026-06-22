import { createRequest, path } from '../client.js'
import type { ListResult, PaginationQuery } from '../common.js'

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

export interface TenantBillingListResult
  extends ListResult<TenantBillingRecord> {
  total_cost: number
}

export type TenantBillingRecordDetail = TenantBillingRecord

export interface TenantBillingBalance {
  tenant_id: string
  balance: number
  updated_at: string
  balance_by_type: Record<BillingResourceType, number>
}

export const listTenantBillingRecordsRequest = (
  params: TenantBillingQuery,
) =>
  createRequest<TenantBillingListResult>('GET', '/api/tenant/billing/records', {
    params,
  })

export const getTenantBillingBalanceRequest = () =>
  createRequest<TenantBillingBalance>('GET', '/api/tenant/billing/balance')

export const getTenantBillingRecordRequest = (recordId: string) =>
  createRequest<TenantBillingRecordDetail>(
    'GET',
    path`/api/tenant/billing/records/${recordId}`,
  )
