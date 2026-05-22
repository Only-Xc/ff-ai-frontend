import { requestClient } from '@/utils/request'

export interface LifecycleCandidateQuery {
  idle_days: number
  min_daily_invocations: number
}

export interface IdleLifecycleCandidate {
  name: string
  agent_id: string
  tenant_id: string
  idle_days: number
  daily_avg_cost: number
  last_invoked_at: string | null
}

export interface HotLifecycleCandidate {
  name: string
  agent_id: string
  tenant_id: string
  daily_avg_cost: number
  avg_duration_ms: number
  daily_invocations: number
}

export interface LifecycleCandidateResponse {
  pools: {
    idle: IdleLifecycleCandidate[]
    hot: HotLifecycleCandidate[]
  }
}

export interface DemoteAgentPayload {
  reason: string
  operator_id?: string
}

export interface DemoteAgentResponse {
  message: string
  agent_id: string
  current_status: string
  previous_status: string
}

export interface PromoteAgentPayload {
  reason: string
  replicas?: number
  resources?: {
    cpu?: string
    memory?: string
  }
  operator_id?: string
}

export interface PromoteAgentResponse {
  message: string
  task_id: string
  agent_id: string
  target_status: string
  previous_status: string
}

const useMockAdminAgents = import.meta.env.DEV

let mockIdleCandidates: IdleLifecycleCandidate[] = [
  {
    name: '采购审批助手',
    agent_id: 'agent-procurement-approval',
    tenant_id: 'tenant-ops-hz',
    idle_days: 12,
    daily_avg_cost: 18.5,
    last_invoked_at: '2026-05-09T11:24:10+08:00',
  },
  {
    name: '客服质检分析',
    agent_id: 'agent-support-quality',
    tenant_id: 'tenant-support-sh',
    idle_days: 9,
    daily_avg_cost: 12.2,
    last_invoked_at: '2026-05-12T09:18:42+08:00',
  },
  {
    name: '门店巡检日报',
    agent_id: 'agent-store-inspection',
    tenant_id: 'tenant-retail-bj',
    idle_days: 18,
    daily_avg_cost: 24.9,
    last_invoked_at: null,
  },
]

let mockHotCandidates: HotLifecycleCandidate[] = [
  {
    name: '合同摘要脚本',
    agent_id: 'agent-contract-summary',
    tenant_id: 'tenant-legal-sh',
    daily_avg_cost: 42.8,
    avg_duration_ms: 320,
    daily_invocations: 3500,
  },
  {
    name: '发票核验脚本',
    agent_id: 'agent-invoice-check',
    tenant_id: 'tenant-finance-sz',
    daily_avg_cost: 36.4,
    avg_duration_ms: 280,
    daily_invocations: 2860,
  },
  {
    name: '知识库命中判断',
    agent_id: 'agent-kb-hit-check',
    tenant_id: 'tenant-support-sh',
    daily_avg_cost: 28.7,
    avg_duration_ms: 410,
    daily_invocations: 1740,
  },
]

function getMockLifecycleCandidates(
  params: LifecycleCandidateQuery,
): LifecycleCandidateResponse {
  return {
    pools: {
      idle: mockIdleCandidates.filter(
        (candidate) => candidate.idle_days >= params.idle_days,
      ),
      hot: mockHotCandidates.filter(
        (candidate) =>
          candidate.daily_invocations >= params.min_daily_invocations,
      ),
    },
  }
}

function createPromotionTaskId() {
  const timestamp = new Date()
    .toISOString()
    .replace(/\D/g, '')
    .slice(0, 14)

  return `lifecycle-promote-${timestamp}`
}

export function adminAgents_getLifecycleCandidates(
  params: LifecycleCandidateQuery,
): Promise<LifecycleCandidateResponse> {
  if (useMockAdminAgents) {
    return Promise.resolve(getMockLifecycleCandidates(params))
  }

  return requestClient({
    url: '/api/admin/agents/lifecycle-candidates',
    method: 'GET',
    params,
    meta: {
      skipGlobalErrorToast: true,
    },
  })
}

export function adminAgents_demote(
  agentId: string,
  data: DemoteAgentPayload,
): Promise<DemoteAgentResponse> {
  if (useMockAdminAgents) {
    mockIdleCandidates = mockIdleCandidates.filter(
      (candidate) => candidate.agent_id !== agentId,
    )

    return Promise.resolve({
      message: data.reason ? '已降级为沙盒按需唤醒态' : '已降级',
      agent_id: agentId,
      current_status: 'sandbox',
      previous_status: 'running',
    })
  }

  return requestClient({
    url: `/api/admin/agents/${encodeURIComponent(agentId)}/demote`,
    method: 'POST',
    data,
  })
}

export function adminAgents_promote(
  agentId: string,
  data: PromoteAgentPayload,
): Promise<PromoteAgentResponse> {
  if (useMockAdminAgents) {
    mockHotCandidates = mockHotCandidates.filter(
      (candidate) => candidate.agent_id !== agentId,
    )

    return Promise.resolve({
      message: data.reason ? '晋升部署任务已创建' : '已创建晋升任务',
      task_id: createPromotionTaskId(),
      agent_id: agentId,
      target_status: 'running',
      previous_status: 'sandbox',
    })
  }

  return requestClient({
    url: `/api/admin/agents/${encodeURIComponent(agentId)}/promote`,
    method: 'POST',
    data,
  })
}
