import { requestClient } from '@/utils/request'

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

export interface TenantBillingRecordsParams {
  agent_id?: string
  resource_type?: BillingResourceType
  start_date?: string
  end_date?: string
  skip: number
  limit: number
}

export interface TenantBillingRecordsResponse {
  data: TenantBillingRecord[]
  count: number
  total_cost: number
}

export interface TenantBillingBalance {
  tenant_id: string
  balance: number
  updated_at: string
  balance_by_type: Record<BillingResourceType, number>
}

const useMockTenantData = import.meta.env.DEV

const mockBalance: TenantBillingBalance = {
  tenant_id: 'tenant-demo',
  balance: 12890.55,
  updated_at: '2026-05-21T10:30:00+08:00',
  balance_by_type: {
    compute_token: 6280.25,
    storage_gb: 2480,
    network_egress_gb: 1130.3,
    compute_hour: 3000,
  },
}

const mockRecords: TenantBillingRecord[] = [
  {
    record_id: 'billing-rec-001',
    resource_type: 'compute_token',
    amount: 182000,
    unit: 'tokens',
    cost: 36.4,
    agent_id: 'agent-contract-review',
    agent_name: '合同审查助手',
    task_id: 'task-20260519-001',
    description: '合同风险识别调用，输入 146000 tokens / 输出 36000 tokens',
    created_at: '2026-05-21T09:45:00+08:00',
  },
  {
    record_id: 'billing-rec-002',
    resource_type: 'compute_hour',
    amount: 2.75,
    unit: '核时',
    cost: 24.75,
    agent_id: 'agent-ticket-router',
    agent_name: '售后工单分流助手',
    task_id: 'task-20260517-004',
    description: '沙盒执行与部署验证',
    created_at: '2026-05-20T16:10:00+08:00',
  },
  {
    record_id: 'billing-rec-003',
    resource_type: 'storage_gb',
    amount: 18.6,
    unit: 'GB / 月',
    cost: 13.02,
    agent_id: null,
    agent_name: null,
    task_id: null,
    description: '租户知识库与运行产物存储',
    created_at: '2026-05-20T03:00:00+08:00',
  },
  {
    record_id: 'billing-rec-004',
    resource_type: 'network_egress_gb',
    amount: 6.2,
    unit: 'GB',
    cost: 4.96,
    agent_id: 'agent-invoice-checker',
    agent_name: '财务发票核验助手',
    task_id: 'task-20260510-009',
    description: '外发 API 响应流量',
    created_at: '2026-05-19T21:25:00+08:00',
  },
  {
    record_id: 'billing-rec-005',
    resource_type: 'compute_token',
    amount: 95000,
    unit: 'tokens',
    cost: 19,
    agent_id: 'agent-invoice-checker',
    agent_name: '财务发票核验助手',
    task_id: 'task-20260510-009',
    description: '发票字段抽取与一致性校验',
    created_at: '2026-05-18T11:40:00+08:00',
  },
  {
    record_id: 'billing-rec-006',
    resource_type: 'compute_hour',
    amount: 1.5,
    unit: '核时',
    cost: 13.5,
    agent_id: 'agent-contract-review',
    agent_name: '合同审查助手',
    task_id: 'task-20260519-001',
    description: '容器运行时资源消耗',
    created_at: '2026-05-17T15:20:00+08:00',
  },
]

function isDateInRange(recordDate: string, startDate?: string, endDate?: string) {
  const date = recordDate.slice(0, 10)

  if (startDate && date < startDate) return false
  if (endDate && date > endDate) return false

  return true
}

function filterMockRecords(params: TenantBillingRecordsParams) {
  return mockRecords
    .filter((record) => {
      if (params.resource_type && record.resource_type !== params.resource_type) {
        return false
      }

      if (params.agent_id && record.agent_id !== params.agent_id) {
        return false
      }

      return isDateInRange(record.created_at, params.start_date, params.end_date)
    })
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
}

export function tenantBilling_records(
  params: TenantBillingRecordsParams,
): Promise<TenantBillingRecordsResponse> {
  if (useMockTenantData) {
    const filteredRecords = filterMockRecords(params)
    const totalCost = filteredRecords.reduce(
      (sum, record) => sum + record.cost,
      0,
    )

    return Promise.resolve({
      data: filteredRecords.slice(params.skip, params.skip + params.limit),
      count: filteredRecords.length,
      total_cost: Number(totalCost.toFixed(2)),
    })
  }

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
  if (useMockTenantData) {
    return Promise.resolve(mockBalance)
  }

  return requestClient({
    url: '/api/tenant/billing/balance',
    method: 'GET',
  })
}
