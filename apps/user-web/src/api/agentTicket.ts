import { requestClient } from '@/utils/request'

export type TaskStatusFilter =
  | 'active'
  | 'pending_approval'
  | 'completed'
  | 'failed'

export type TaskStatus =
  | 'CREATED'
  | 'ANALYZING'
  | 'ROUTING'
  | 'CODING'
  | 'TESTING'
  | 'DEPLOYING'
  | 'COMPLETED'
  | 'PENDING_APPROVAL'
  | 'FAILED'

export type TaskType = 'direct_result' | 'process' | 'container'

export type AgentStatus = 'running' | 'stopped' | 'sandbox'

export interface TenantListParams<TStatus extends string> {
  status?: TStatus
  skip: number
  limit: number
}

export interface TenantListResponse<TItem> {
  data: TItem[]
  count: number
}

export interface TenantTask {
  title: string
  status: TaskStatus
  task_id: string
  agent_id: string | null
  task_type: TaskType
  created_at: string
  updated_at: string
}

export interface TenantAgent {
  name: string
  status: AgentStatus
  task_id: string | null
  agent_id: string
  created_at: string
  description: string
  endpoint_url: string | null
  last_invoked_at: string | null
}

export interface TenantAgentDetail extends TenantAgent {
  current_usage: number
  runtime_token_budget: number | null
}

export interface TenantAgentBudgetResponse {
  agent_id: string
  runtime_token_budget: number | null
}

const useMockTenantData = import.meta.env.DEV

let mockAgents: TenantAgentDetail[] = [
  {
    name: '合同审查助手',
    status: 'running',
    task_id: 'task-20260519-001',
    agent_id: 'agent-contract-review',
    created_at: '2026-05-18T10:20:00+08:00',
    description: '自动识别合同风险条款并输出修订建议。',
    endpoint_url: 'https://api.example.com/docs/agents/contract-review',
    last_invoked_at: '2026-05-19T14:30:00+08:00',
    current_usage: 126.5,
    runtime_token_budget: 500,
  },
  {
    name: '售后工单分流助手',
    status: 'sandbox',
    task_id: 'task-20260517-004',
    agent_id: 'agent-ticket-router',
    created_at: '2026-05-17T16:45:00+08:00',
    description: '根据客户问题自动判断工单类型、优先级和处理团队。',
    endpoint_url: null,
    last_invoked_at: null,
    current_usage: 0,
    runtime_token_budget: null,
  },
  {
    name: '财务发票核验助手',
    status: 'stopped',
    task_id: 'task-20260510-009',
    agent_id: 'agent-invoice-checker',
    created_at: '2026-05-10T09:05:00+08:00',
    description: '核验发票字段、金额一致性和重复报销风险。',
    endpoint_url: 'https://api.example.com/docs/agents/invoice-checker',
    last_invoked_at: '2026-05-15T11:10:00+08:00',
    current_usage: 78.2,
    runtime_token_budget: 300,
  },
]

const mockTasks: TenantTask[] = [
  {
    title: '生成合同审查智能体',
    status: 'COMPLETED',
    task_id: 'task-20260519-001',
    agent_id: 'agent-contract-review',
    task_type: 'container',
    created_at: '2026-05-18T09:30:00+08:00',
    updated_at: '2026-05-18T10:20:00+08:00',
  },
  {
    title: '搭建客户咨询分流流程',
    status: 'CODING',
    task_id: 'task-20260519-002',
    agent_id: null,
    task_type: 'process',
    created_at: '2026-05-19T09:15:00+08:00',
    updated_at: '2026-05-19T15:40:00+08:00',
  },
  {
    title: '审批采购单自动化助手',
    status: 'PENDING_APPROVAL',
    task_id: 'task-20260518-006',
    agent_id: null,
    task_type: 'direct_result',
    created_at: '2026-05-18T13:00:00+08:00',
    updated_at: '2026-05-18T17:25:00+08:00',
  },
  {
    title: '发票核验智能体',
    status: 'COMPLETED',
    task_id: 'task-20260510-009',
    agent_id: 'agent-invoice-checker',
    task_type: 'container',
    created_at: '2026-05-10T08:30:00+08:00',
    updated_at: '2026-05-10T09:05:00+08:00',
  },
  {
    title: '知识库同步巡检任务',
    status: 'FAILED',
    task_id: 'task-20260508-003',
    agent_id: null,
    task_type: 'process',
    created_at: '2026-05-08T10:00:00+08:00',
    updated_at: '2026-05-08T10:40:00+08:00',
  },
  {
    title: '部署售后工单分流助手',
    status: 'DEPLOYING',
    task_id: 'task-20260517-004',
    agent_id: 'agent-ticket-router',
    task_type: 'container',
    created_at: '2026-05-17T15:10:00+08:00',
    updated_at: '2026-05-17T16:45:00+08:00',
  },
]

function paginate<TItem>(
  items: TItem[],
  params: TenantListParams<string>,
): TenantListResponse<TItem> {
  return {
    data: items.slice(params.skip, params.skip + params.limit),
    count: items.length,
  }
}

function isActiveTaskStatus(status: TaskStatus) {
  return [
    'CREATED',
    'ANALYZING',
    'ROUTING',
    'CODING',
    'TESTING',
    'DEPLOYING',
  ].includes(status)
}

function filterTasks(status?: TaskStatusFilter) {
  if (!status) return mockTasks

  if (status === 'active') {
    return mockTasks.filter((task) => isActiveTaskStatus(task.status))
  }

  const statusMap: Record<Exclude<TaskStatusFilter, 'active'>, TaskStatus> = {
    pending_approval: 'PENDING_APPROVAL',
    completed: 'COMPLETED',
    failed: 'FAILED',
  }

  return mockTasks.filter((task) => task.status === statusMap[status])
}

export function tenantTasks_list(
  params: TenantListParams<TaskStatusFilter>,
): Promise<TenantListResponse<TenantTask>> {
  if (useMockTenantData) {
    return Promise.resolve(paginate(filterTasks(params.status), params))
  }

  return requestClient({
    url: '/api/tenant/tasks',
    method: 'GET',
    params: {
      status: params.status,
      skip: params.skip,
      limit: params.limit,
    },
  })
}

export function tenantAgents_list(
  params: TenantListParams<AgentStatus>,
): Promise<TenantListResponse<TenantAgent>> {
  if (useMockTenantData) {
    const items = params.status
      ? mockAgents.filter((agent) => agent.status === params.status)
      : mockAgents

    return Promise.resolve(paginate(items, params))
  }

  return requestClient({
    url: '/api/tenant/agents',
    method: 'GET',
    params: {
      status: params.status,
      skip: params.skip,
      limit: params.limit,
    },
  })
}

export function tenantAgents_detail(
  agentId: string,
): Promise<TenantAgentDetail> {
  if (useMockTenantData) {
    const agent = mockAgents.find((item) => item.agent_id === agentId)

    if (agent) return Promise.resolve(agent)

    return Promise.reject(new Error('智能体不存在'))
  }

  return requestClient({
    url: `/api/tenant/agents/${agentId}`,
    method: 'GET',
  })
}

export function tenantAgents_updateBudget(
  agentId: string,
  runtimeTokenBudget: number | null,
): Promise<TenantAgentBudgetResponse> {
  if (useMockTenantData) {
    mockAgents = mockAgents.map((agent) =>
      agent.agent_id === agentId
        ? { ...agent, runtime_token_budget: runtimeTokenBudget }
        : agent,
    )

    return Promise.resolve({
      agent_id: agentId,
      runtime_token_budget: runtimeTokenBudget,
    })
  }

  return requestClient({
    url: `/api/tenant/agents/${agentId}/budget`,
    method: 'PUT',
    data: {
      runtime_token_budget: runtimeTokenBudget,
    },
  })
}
