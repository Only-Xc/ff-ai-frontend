import { Typography } from 'antd'
import type { DescriptionsProps } from 'antd'
import dayjs from 'dayjs'
import type { TFunction } from 'i18next'
import isEmpty from 'lodash-es/isEmpty'

import type {
  AdminTaskSnapshot,
  AdminTaskSnapshotContextLine,
  AdminTaskSnapshotError,
} from '@/api/ticket-kanban'

export function formatDateTime(value?: string) {
  if (!value) return '-'

  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format('YYYY/MM/DD HH:mm:ss')
}

export function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function getRepoDirectoryName(url: string) {
  const cleaned = url.split('?')[0]?.replace(/\/$/, '') ?? ''
  const name = cleaned.slice(cleaned.lastIndexOf('/') + 1).replace(/\.git$/, '')

  return name || 'repo'
}

export function buildCloneCommand(snapshot: AdminTaskSnapshot) {
  const source = snapshot.source_code

  if (!source) return ''

  const cloneUrl = source.clone_url || source.repo_url

  if (!cloneUrl) return ''

  const lines = [
    `git clone ${cloneUrl}`,
    `cd ${getRepoDirectoryName(cloneUrl)}`,
  ]

  if (source.commit_sha) {
    lines.push(`git checkout ${source.commit_sha}`)
  } else if (source.branch) {
    lines.push(`git checkout ${source.branch}`)
  }

  return lines.join('\n')
}

export function buildSnapshotItems(
  snapshot: AdminTaskSnapshot | undefined,
  t: TFunction,
): DescriptionsProps['items'] {
  if (!snapshot) return []

  return [
    {
      key: 'task_id',
      label: t('pages.intervention.fields.taskId'),
      children: (
        <Typography.Text copyable={{ text: snapshot.task_id }}>
          {snapshot.task_id}
        </Typography.Text>
      ),
    },
    {
      key: 'tenant_id',
      label: t('pages.intervention.fields.tenant'),
      children: (
        <Typography.Text copyable={{ text: snapshot.tenant_id }}>
          {snapshot.tenant_id || '-'}
        </Typography.Text>
      ),
    },
    {
      key: 'current_node',
      label: t('pages.intervention.fields.currentNode'),
      children: snapshot.current_node || '-',
    },
    {
      key: 'retry_count',
      label: t('pages.intervention.fields.retryCount'),
      children: snapshot.retry_count,
    },
    {
      key: 'snapshot_at',
      label: t('pages.intervention.fields.snapshotAt'),
      children: formatDateTime(snapshot.snapshot_at),
    },
  ]
}

export function buildErrorItems(
  error: AdminTaskSnapshotError | null | undefined,
  t: TFunction,
): DescriptionsProps['items'] {
  if (!error) return []

  return [
    {
      key: 'stage',
      label: t('pages.intervention.fields.stage'),
      children: error.stage || '-',
    },
    {
      key: 'type',
      label: t('pages.intervention.fields.type'),
      children: error.error_type || '-',
    },
    {
      key: 'file',
      label: t('pages.intervention.fields.file'),
      children: error.failed_file ? (
        <Typography.Text copyable={{ text: error.failed_file }}>
          {error.failed_file}
        </Typography.Text>
      ) : (
        '-'
      ),
    },
    {
      key: 'line',
      label: t('pages.intervention.fields.line'),
      children: error.failed_line ?? '-',
    },
    {
      key: 'failed_at',
      label: t('pages.intervention.fields.failedAt'),
      children: formatDateTime(error.failed_at),
    },
  ]
}

export function buildContextText(
  context?: AdminTaskSnapshotContextLine[] | null,
) {
  return (
    context
      ?.map(
        (line) => `${String(line.line_no).padStart(4, ' ')}  ${line.content}`,
      )
      .join('\n') ?? ''
  )
}

export function buildPayloadText(payloadSummary?: Record<string, unknown>) {
  return payloadSummary && !isEmpty(payloadSummary)
    ? safeStringify(payloadSummary)
    : ''
}

export function getErrorMessage(error: unknown, t: TFunction) {
  return error instanceof Error
    ? error.message
    : t('common.errors.operationFailed')
}
