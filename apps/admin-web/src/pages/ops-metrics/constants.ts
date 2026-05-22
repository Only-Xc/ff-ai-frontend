import type {
  OpsMetricsPeriod,
  OpsMetricsTaskStatus,
} from '@/api/adminMetrics'

export const periodOptions: { label: string; value: OpsMetricsPeriod }[] = [
  { label: '今日', value: 'today' },
  { label: '近 7 天', value: 'week' },
  { label: '本月', value: 'month' },
]

export const statusOrder: OpsMetricsTaskStatus[] = [
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

export const statusLabelMap: Record<OpsMetricsTaskStatus, string> = {
  ANALYZING: '解析中',
  CODING: '编码中',
  COMPLETED: '已完成',
  CREATED: '已创建',
  DEPLOYING: '打包中',
  FAILED: '失败',
  PENDING_APPROVAL: '待介入',
  ROUTING: '路由中',
  TESTING: '测试中',
}

export const statusColorMap: Record<OpsMetricsTaskStatus, string> = {
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
