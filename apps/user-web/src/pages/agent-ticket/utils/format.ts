import dayjs from 'dayjs'

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'

  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format('YYYY年M月D日 HH:mm')
}
