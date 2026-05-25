import type {
  AgentStatus,
  TaskStatus,
  TaskStatusFilter,
  TaskType,
} from '@/api/agent-ticket'

export const agentTicketTabs = [
  {
    key: 'tickets',
    label: '工单列表',
  },
  {
    key: 'agents',
    label: '智能体列表',
  },
]

export const taskStatusFilterOptions: {
  label: string
  value: TaskStatusFilter
}[] = [
  { label: '流转中', value: 'active' },
  { label: '待审批', value: 'pending_approval' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' },
]

export const agentStatusFilterOptions: {
  label: string
  value: AgentStatus
}[] = [
  { label: '运行中', value: 'running' },
  { label: '已停止', value: 'stopped' },
  { label: '沙盒唤醒', value: 'sandbox' },
]

export const taskStatusMeta: Record<
  TaskStatus,
  { color: string; label: string }
> = {
  CREATED: { color: 'blue', label: '已创建' },
  ANALYZING: { color: 'processing', label: '需求分析' },
  ROUTING: { color: 'processing', label: '路由中' },
  CODING: { color: 'processing', label: '编码中' },
  TESTING: { color: 'gold', label: '测试中' },
  DEPLOYING: { color: 'purple', label: '部署中' },
  COMPLETED: { color: 'success', label: '已完成' },
  PENDING_APPROVAL: { color: 'warning', label: '待审批' },
  FAILED: { color: 'error', label: '失败' },
}

export const taskTypeMeta: Record<TaskType, string> = {
  direct_result: '直接返回结果',
  process: '创建进程',
  container: '创建容器',
}

export const agentStatusMeta: Record<
  AgentStatus,
  { color: string; label: string }
> = {
  running: { color: 'success', label: '运行中' },
  stopped: { color: 'default', label: '已停止' },
  sandbox: { color: 'processing', label: '沙盒唤醒' },
}

export const defaultTaskStep = 2

export const taskStepIndexMap: Record<TaskStatus, number> = {
  CREATED: 0,
  ANALYZING: 0,
  ROUTING: 1,
  CODING: 2,
  TESTING: 2,
  DEPLOYING: 2,
  COMPLETED: 3,
  PENDING_APPROVAL: 2,
  FAILED: 2,
}
