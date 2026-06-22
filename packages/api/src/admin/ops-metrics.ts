import { createRequest } from '../client.js'
import type { TaskStatus } from '../task.js'

export type OpsMetricsPeriod = 'today' | 'week' | 'month'

export interface OpsMetricsHotSkill {
  name: string
  rank: number
  category: string
  skill_id: string
  call_count: number
  success_rate: number
}

export interface OpsMetricsLatencyPoint {
  p50: number
  p95: number
  p99: number
  hour: string
}

export interface OpsMetricsLatency {
  data: OpsMetricsLatencyPoint[]
  unit: string
}

export interface OpsMetricsAgentSummary {
  total: number
  running: number
  sandbox: number
  stopped: number
}

export interface OpsMetricsFactoryOutput {
  by_status: Partial<Record<TaskStatus, number>>
  total_tasks: number
  success_rate: number
}

export interface OpsMetricsBillingSummary {
  this_week: number
  yesterday: number
  this_month: number
}

export interface AdminMetricsOverview {
  period: OpsMetricsPeriod
  hot_skills: OpsMetricsHotSkill[]
  llm_latency: OpsMetricsLatency
  generated_at: string
  agent_summary: OpsMetricsAgentSummary
  factory_output: OpsMetricsFactoryOutput
  billing_summary: OpsMetricsBillingSummary
}

export interface AdminMetricsOverviewQuery {
  period: OpsMetricsPeriod
}

export const getAdminMetricsOverviewRequest = (
  params: AdminMetricsOverviewQuery,
) =>
  createRequest<AdminMetricsOverview>('GET', '/api/admin/metrics/overview', {
    params,
  })
