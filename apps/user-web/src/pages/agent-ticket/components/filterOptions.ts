import type { AgentStatus, TaskStatusFilter } from '@/api/agentTicket'

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
