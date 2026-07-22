import type { TFunction } from 'i18next'

import type { ProductionApprovalStatus } from '@/api/production'

export function approvalStatusColor(status: ProductionApprovalStatus): string {
  switch (status) {
    case 'PENDING':
      return 'gold'
    case 'IN_REVIEW':
      return 'blue'
    case 'APPROVED':
      return 'green'
    case 'REJECTED':
      return 'red'
    case 'PRECHECK_BLOCKED':
      return 'volcano'
    default:
      return 'default'
  }
}

export function approvalStatusLabel(t: TFunction, status: ProductionApprovalStatus): string {
  const key = `pages.production.status.${status}`
  const label = t(key)
  return label === key ? status : label
}
