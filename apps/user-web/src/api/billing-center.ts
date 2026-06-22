import {
  getTenantBillingBalanceRequest,
  getTenantBillingRecordRequest,
  listTenantBillingRecordsRequest,
  type TenantBillingQuery,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  BillingResourceType,
  TenantBillingBalance,
  TenantBillingListResult,
  TenantBillingQuery,
  TenantBillingRecord,
  TenantBillingRecordDetail,
} from '@ff-ai-frontend/api'

export const tenantBillingKeys = {
  all: ['tenant-billing'] as const,
  balance: () => [...tenantBillingKeys.all, 'balance'] as const,
  list: (params: TenantBillingQuery) =>
    [...tenantBillingKeys.all, 'list', params] as const,
  detail: (recordId: string | undefined) =>
    [...tenantBillingKeys.all, 'detail', recordId] as const,
}

export const tenantBilling_records = request(listTenantBillingRecordsRequest)
export const tenantBilling_balance = request(getTenantBillingBalanceRequest)
export const tenantBilling_record = request(getTenantBillingRecordRequest)
