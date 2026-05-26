import { numberUtils } from '@ff-ai-frontend/utils'
import dayjs from 'dayjs'
import sumBy from 'lodash-es/sumBy'

import type {
  HotLifecycleCandidate,
  IdleLifecycleCandidate,
} from '@/api/lifecycle-ops'

export function sumCost<T extends { daily_avg_cost: number }>(items: T[]) {
  return sumBy(items, 'daily_avg_cost')
}

export function getLifecycleActionReason(
  candidate: IdleLifecycleCandidate,
): string
export function getLifecycleActionReason(
  candidate: HotLifecycleCandidate,
): string
export function getLifecycleActionReason(
  candidate: IdleLifecycleCandidate | HotLifecycleCandidate,
) {
  if ('idle_days' in candidate) {
    return `连续 ${candidate.idle_days} 天零调用流量，降级以释放 K8s 资源`
  }

  return `日均调用 ${numberUtils.formatNumber(candidate.daily_invocations)} 次，晋升为常驻微服务`
}

export function formatDateTime(value?: string | null) {
  if (!value) return '从未调用'

  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format('YYYY/MM/DD HH:mm')
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '操作失败'
}
