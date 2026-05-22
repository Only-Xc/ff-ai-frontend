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

const useMockAdminMetrics = import.meta.env.DEV

const hotSkills: OpsMetricsHotSkill[] = [
  {
    name: 'React Admin 页面生成',
    rank: 1,
    category: 'frontend-react',
    skill_id: 'skill-react-admin',
    call_count: 8420,
    success_rate: 0.982,
  },
  {
    name: 'Python ETL 技能',
    rank: 2,
    category: 'python-etl',
    skill_id: 'skill-python-etl',
    call_count: 6298,
    success_rate: 0.974,
  },
  {
    name: 'SQL 审查技能',
    rank: 3,
    category: 'database',
    skill_id: 'skill-sql-review',
    call_count: 5172,
    success_rate: 0.957,
  },
  {
    name: '合同条款抽取',
    rank: 4,
    category: 'legal',
    skill_id: 'skill-contract-extract',
    call_count: 3986,
    success_rate: 0.963,
  },
  {
    name: '客服摘要生成',
    rank: 5,
    category: 'support',
    skill_id: 'skill-support-summary',
    call_count: 3541,
    success_rate: 0.991,
  },
  {
    name: '发票核验',
    rank: 6,
    category: 'finance',
    skill_id: 'skill-invoice-verify',
    call_count: 2874,
    success_rate: 0.948,
  },
  {
    name: '知识库同步巡检',
    rank: 7,
    category: 'knowledge',
    skill_id: 'skill-kb-sync-check',
    call_count: 2410,
    success_rate: 0.935,
  },
  {
    name: '采购审批解析',
    rank: 8,
    category: 'workflow',
    skill_id: 'skill-procurement-approval',
    call_count: 1984,
    success_rate: 0.976,
  },
]

function formatMockHour(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:00`
}

function createLatencyData(period: OpsMetricsPeriod): OpsMetricsLatencyPoint[] {
  const lengthMap: Record<OpsMetricsPeriod, number> = {
    today: 12,
    week: 24,
    month: 30,
  }
  const stepMap: Record<OpsMetricsPeriod, number> = {
    today: 1,
    week: 6,
    month: 24,
  }
  const now = new Date('2026-05-21T12:00:00+08:00')
  const length = lengthMap[period]
  const stepHours = stepMap[period]

  return Array.from({ length }, (_, index) => {
    const offset = length - index - 1
    const pointDate = new Date(now)
    pointDate.setHours(now.getHours() - offset * stepHours)

    const wave = Math.sin(index / 2.3) * 42
    const load = index % 7 === 4 ? 86 : 0
    const p50 = Math.round(420 + wave + index * 3)
    const p95 = Math.round(p50 + 180 + load / 2)
    const p99 = Math.round(p95 + 160 + load)

    return {
      hour: formatMockHour(pointDate),
      p50,
      p95,
      p99,
    }
  })
}

function getMockOverview(period: OpsMetricsPeriod): AdminMetricsOverview {
  const periodFactor: Record<OpsMetricsPeriod, number> = {
    today: 0.2,
    week: 1,
    month: 3.7,
  }
  const factor = periodFactor[period]
  const totalTasks = Math.round(426 * factor)

  return {
    period,
    generated_at: new Date().toISOString(),
    factory_output: {
      total_tasks: totalTasks,
      success_rate: 0.914,
      by_status: {
        CREATED: Math.round(18 * factor),
        ANALYZING: Math.round(36 * factor),
        ROUTING: Math.round(22 * factor),
        CODING: Math.round(64 * factor),
        TESTING: Math.round(43 * factor),
        DEPLOYING: Math.round(31 * factor),
        COMPLETED: Math.round(184 * factor),
        PENDING_APPROVAL: Math.round(16 * factor),
        FAILED: Math.round(12 * factor),
      },
    },
    llm_latency: {
      unit: 'ms',
      data: createLatencyData(period),
    },
    hot_skills: hotSkills.map((skill) => ({
      ...skill,
      call_count: Math.max(1, Math.round(skill.call_count * factor)),
    })),
    billing_summary: {
      yesterday: 1286.42,
      this_week: Math.round(8634.72 * Math.min(factor, 1.4) * 100) / 100,
      this_month: Math.round(32894.5 * Math.min(factor, 1) * 100) / 100,
    },
    agent_summary: {
      total: Math.round(138 * Math.max(factor, 0.35)),
      running: Math.round(82 * Math.max(factor, 0.35)),
      sandbox: Math.round(34 * Math.max(factor, 0.35)),
      stopped: Math.round(16 * Math.max(factor, 0.35)),
    },
  }
}

export function adminMetrics_getOverview(
  period: OpsMetricsPeriod,
): Promise<AdminMetricsOverview> {
  if (useMockAdminMetrics) {
    return Promise.resolve(getMockOverview(period))
  }

  return requestClient({
    url: '/api/admin/metrics/overview',
    method: 'GET',
    params: { period },
    meta: {
      skipGlobalErrorToast: true,
    },
  })
}
