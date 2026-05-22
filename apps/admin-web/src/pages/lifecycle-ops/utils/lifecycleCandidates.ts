import slice from 'lodash-es/slice'
import sumBy from 'lodash-es/sumBy'

import type {
  HotLifecycleCandidate,
  IdleLifecycleCandidate,
} from '@/api/adminAgents'

import { formatNumber } from './lifecycleFormatters'

export function sumCost<T extends { daily_avg_cost: number }>(items: T[]) {
  return sumBy(items, 'daily_avg_cost')
}

export function getDemoteReason(candidate: IdleLifecycleCandidate) {
  return `连续 ${candidate.idle_days} 天零调用流量，降级以释放 K8s 资源`
}

export function getPromoteReason(candidate: HotLifecycleCandidate) {
  return `日均调用 ${formatNumber(candidate.daily_invocations)} 次，晋升为常驻微服务`
}

export function slicePage<T>(items: T[], skip: number, limit: number) {
  return slice(items, skip, skip + limit)
}
