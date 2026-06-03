import type { TaskStatus } from '@/api/agent-ticket'

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
