import type { QueryKey } from '@tanstack/react-query'

import { requestClient } from '@/utils/request'

export type OpsMetricsPeriod = 'today' | 'week' | 'month'

export type OpsMetricsTaskStatus =
  | 'CREATED'
  | 'ANALYZING'
  | 'ROUTING'
  | 'CODING'
  | 'TESTING'
  | 'DEPLOYING'
  | 'COMPLETED'
  | 'PENDING_APPROVAL'
  | 'FAILED'

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
  by_status: Partial<Record<OpsMetricsTaskStatus, number>>
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

export const adminMetricsKeys = {
  all: ['adminMetrics'] as const,
  overviews: () => [...adminMetricsKeys.all, 'overview'] as const,
  overview: (query: AdminMetricsOverviewQuery) =>
    [...adminMetricsKeys.overviews(), query] as const satisfies QueryKey,
}

export function adminMetrics_getOverview(
  params: AdminMetricsOverviewQuery,
): Promise<AdminMetricsOverview> {
  return requestClient({
    url: '/api/admin/metrics/overview',
    method: 'GET',
    params,
  })
}
