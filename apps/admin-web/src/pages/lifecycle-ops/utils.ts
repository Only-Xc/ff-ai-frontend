import { numberUtils } from '@ff-ai-frontend/utils'
import dayjs from 'dayjs'
import type { TFunction } from 'i18next'
import sumBy from 'lodash-es/sumBy'

import type {
  HotLifecycleCandidate,
  IdleLifecycleCandidate,
  ObserveLifecycleCandidate,
} from '@/api/lifecycle-ops'

export function sumCost<T extends { daily_avg_cost: number }>(items: T[]) {
  return sumBy(items, 'daily_avg_cost')
}

export function summarizeResources(
  items: Array<IdleLifecycleCandidate | ObserveLifecycleCandidate>,
) {
  const cpuSeconds = sumBy(items, (item) => item.occupied_resources?.cpu_seconds ?? 0)
  const memoryValues = items
    .map((item) => item.occupied_resources?.memory_mb_avg ?? 0)
    .filter((value) => value > 0)
  const memoryMbAvg =
    memoryValues.length > 0 ? sumBy(memoryValues, (value) => value) / memoryValues.length : 0
  const storageBytes = sumBy(items, (item) => item.occupied_resources?.storage_bytes ?? 0)

  if (cpuSeconds <= 0 && memoryMbAvg <= 0 && storageBytes <= 0) return '-'

  return `CPU ${numberUtils.formatNumber(cpuSeconds, {
    decimals: 1,
  })}s / 内存 ${numberUtils.formatNumber(memoryMbAvg, {
    decimals: 0,
  })}MB / 存储 ${formatBytes(storageBytes)}`
}

export function getLifecycleActionReason(
  candidate: IdleLifecycleCandidate,
  t: TFunction,
): string
export function getLifecycleActionReason(
  candidate: HotLifecycleCandidate,
  t: TFunction,
): string
export function getLifecycleActionReason(
  candidate: IdleLifecycleCandidate | HotLifecycleCandidate,
  t: TFunction,
) {
  if ('idle_days' in candidate) {
    return t('pages.lifecycle.reason.demote', {
      days: candidate.zero_traffic_days ?? candidate.idle_days,
    })
  }

  return t('pages.lifecycle.reason.promote', {
    count: numberUtils.formatNumber(candidate.daily_invocations),
  })
}

export function formatDateTime(value: string | null | undefined, t: TFunction) {
  if (!value) return t('pages.lifecycle.time.neverInvoked')

  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format('YYYY/MM/DD HH:mm')
}

export function getErrorMessage(error: unknown, t: TFunction) {
  return error instanceof Error
    ? error.message
    : t('common.errors.operationFailed')
}

function formatBytes(value: number) {
  let size = Math.max(value, 0)
  for (const unit of ['B', 'KB', 'MB', 'GB']) {
    if (size < 1024 || unit === 'GB') {
      return unit === 'B' ? `${Math.round(size)}${unit}` : `${size.toFixed(1)}${unit}`
    }
    size /= 1024
  }
  return `${size.toFixed(1)}GB`
}
