import dayjs from 'dayjs'

import { i18n } from '@/i18n'

export function formatKnowledgeDateTime(value?: string | null): string {
  if (!value) return '-'

  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format(i18n.t('common.dateTime.longFormat'))
}

export function formatFileSize(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'

  if (value < 1024) return `${value} B`

  const units = ['KB', 'MB', 'GB', 'TB']
  let size = value / 1024
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

export function formatSearchScore(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'

  return value.toFixed(4)
}
