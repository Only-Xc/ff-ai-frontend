import dayjs from 'dayjs'

export function formatDateTime(value?: string) {
  if (!value) return '-'

  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format('MM/DD HH:mm')
}
