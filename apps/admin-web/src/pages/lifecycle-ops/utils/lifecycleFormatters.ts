import { format, isValid, parseISO } from 'date-fns'
import trim from 'lodash-es/trim'

export function formatNumber(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'

  return new Intl.NumberFormat('zh-CN').format(value)
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

export function formatDateTime(value?: string | null) {
  if (!value) return '从未调用'

  const date = parseISO(value)

  if (!isValid(date)) return '-'

  return format(date, 'yyyy/MM/dd HH:mm')
}

export function formatText(value?: string | null) {
  const text = trim(value ?? '')

  if (text) return text

  return '-'
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '操作失败'
}
