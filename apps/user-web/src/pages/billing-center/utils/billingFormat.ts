import { format, isValid, parseISO } from 'date-fns'

export function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'

  return new Intl.NumberFormat('zh-CN', {
    currency: 'CNY',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(value)
}

export function formatBillingDateTime(
  value: string | null | undefined,
): string {
  if (!value) return '-'

  const date = parseISO(value)

  if (!isValid(date)) return '-'

  return format(date, 'yyyy年M月d日 HH:mm')
}

export function formatAmount(
  amount: number | null | undefined,
  unit: string | null | undefined,
): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '-'

  const formattedAmount = new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 4,
  }).format(amount)

  return [formattedAmount, unit?.trim()].filter(Boolean).join(' ')
}
