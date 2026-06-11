import dayjs from 'dayjs'
import { i18n } from '@/i18n'

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'

  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format(i18n.t('common.dateTime.longFormat'))
}
