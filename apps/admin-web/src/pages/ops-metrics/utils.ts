import dayjs from 'dayjs'
import type { TFunction } from 'i18next'

import type {
  OpsMetricsAgentSummary,
  OpsMetricsHotSkill,
  OpsMetricsLatency,
  OpsMetricsPeriod,
} from '@/api/ops-metrics'

export function formatDateTime(value?: string) {
  if (!value) return '-'

  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format('YYYY/MM/DD HH:mm:ss')
}

export function formatHourLabel(value: string, period: OpsMetricsPeriod) {
  const date = dayjs(value.replace(' ', 'T'))

  if (!date.isValid()) return value

  if (period === 'today') {
    return date.format('HH:mm')
  }

  return date.format('MM/DD HH')
}

export function getLatestP95(latency?: OpsMetricsLatency) {
  const latest = latency?.data.at(-1)
  return latest?.p95
}

export function getSkillCallTotal(skills?: OpsMetricsHotSkill[]) {
  return skills?.reduce((total, skill) => total + skill.call_count, 0) ?? 0
}

export function getAgentSegments(
  summary: OpsMetricsAgentSummary,
  t: TFunction,
) {
  const known = summary.running + summary.sandbox + summary.stopped
  const other = Math.max(summary.total - known, 0)

  return [
    {
      label: t('pages.opsMetrics.agents.running'),
      value: summary.running,
      color: 'var(--admin-success)',
    },
    {
      label: t('pages.opsMetrics.agents.sandbox'),
      value: summary.sandbox,
      color: 'var(--admin-info)',
    },
    {
      label: t('pages.opsMetrics.agents.stopped'),
      value: summary.stopped,
      color: 'var(--admin-warning)',
    },
    ...(other
      ? [
          {
            label: t('pages.opsMetrics.agents.other'),
            value: other,
            color: 'var(--muted)',
          },
        ]
      : []),
  ]
}

export function getCssVariable(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback

  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)

  return value.trim() || fallback
}

export function getErrorMessage(error: unknown, t: TFunction) {
  return error instanceof Error
    ? error.message
    : t('common.errors.requestFailed')
}
