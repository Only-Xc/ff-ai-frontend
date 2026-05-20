export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatNullableText(value: string | null | undefined): string {
  const content = value?.trim()

  if (content) return content

  return '-'
}
