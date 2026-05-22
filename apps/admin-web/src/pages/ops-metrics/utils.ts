import type {
  OpsMetricsAgentSummary,
  OpsMetricsHotSkill,
  OpsMetricsLatency,
  OpsMetricsPeriod,
} from '@/api/adminMetrics'

export function formatNumber(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'

  return new Intl.NumberFormat('zh-CN').format(value)
}

export function formatPercent(value?: number | null, precision = 1) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'

  return `${(value * 100).toFixed(precision)}%`
}

export function formatCurrency(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'

  return new Intl.NumberFormat('zh-CN', {
    currency: 'CNY',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(value)
}

export function formatDateTime(value?: string) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatHourLabel(value: string, period: OpsMetricsPeriod) {
  const date = new Date(value.replace(' ', 'T'))

  if (Number.isNaN(date.getTime())) return value

  if (period === 'today') {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    month: '2-digit',
  }).format(date)
}

export function getLatestP95(latency?: OpsMetricsLatency) {
  const latest = latency?.data.at(-1)

  return latest?.p95
}

export function getSkillCallTotal(skills?: OpsMetricsHotSkill[]) {
  return skills?.reduce((total, skill) => total + skill.call_count, 0) ?? 0
}

export function getAgentSegments(summary: OpsMetricsAgentSummary) {
  const known = summary.running + summary.sandbox + summary.stopped
  const other = Math.max(summary.total - known, 0)

  return [
    { label: '运行中', value: summary.running, color: 'var(--admin-success)' },
    { label: '沙盒', value: summary.sandbox, color: 'var(--admin-info)' },
    { label: '停止', value: summary.stopped, color: 'var(--admin-warning)' },
    ...(other ? [{ label: '其他', value: other, color: 'var(--muted)' }] : []),
  ]
}

export function getCssVariable(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback

  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)

  return value.trim() || fallback
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '请求失败'
}
