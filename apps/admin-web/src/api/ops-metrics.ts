import {
  getAdminMetricsOverviewRequest,
  type AdminMetricsOverviewQuery,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  AdminMetricsOverview,
  AdminMetricsOverviewQuery,
  OpsMetricsAgentSummary,
  OpsMetricsBillingSummary,
  OpsMetricsFactoryOutput,
  OpsMetricsHotSkill,
  OpsMetricsLatency,
  OpsMetricsLatencyPoint,
  OpsMetricsPeriod,
  OpsMetricsTaskStatus,
} from '@ff-ai-frontend/api'

export const adminMetricsKeys = {
  all: ['adminMetrics'] as const,
  overviews: () => [...adminMetricsKeys.all, 'overview'] as const,
  overview: (query: AdminMetricsOverviewQuery) =>
    [...adminMetricsKeys.overviews(), query] as const,
}

export const adminMetrics_getOverview = request(getAdminMetricsOverviewRequest)
