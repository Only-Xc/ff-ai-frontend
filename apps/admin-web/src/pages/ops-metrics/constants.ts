import type { TaskStatus } from '@/api/ops-metrics'

export const statusOrder: TaskStatus[] = [
  'CREATED',
  'ANALYZING',
  'ROUTING',
  'CODING',
  'TESTING',
  'DEPLOYING',
  'COMPLETED',
  'PENDING_APPROVAL',
  'FAILED',
]

export const statusColorMap: Record<TaskStatus, string> = {
  ANALYZING: '#4096ff',
  CODING: '#7c3aed',
  COMPLETED: '#0f9f8f',
  CREATED: '#64748b',
  DEPLOYING: '#f59e0b',
  FAILED: '#dc2626',
  PENDING_APPROVAL: '#ef4444',
  ROUTING: '#2563eb',
  TESTING: '#d97706',
}
