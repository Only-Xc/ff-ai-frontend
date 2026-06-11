import { numberUtils } from '@ff-ai-frontend/utils'
import dayjs from 'dayjs'
import type { TFunction } from 'i18next'
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
      days: candidate.idle_days,
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
