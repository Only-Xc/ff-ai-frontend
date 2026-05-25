import { Typography } from 'antd'
import type { DescriptionsProps } from 'antd'
import dayjs from 'dayjs'
import isEmpty from 'lodash-es/isEmpty'

import type {
  AdminTaskSnapshot,
  AdminTaskSnapshotContextLine,
  AdminTaskSnapshotError,
  AdminTaskStatus,
} from '@/api/adminTasks'

export const statusLabelMap: Record<AdminTaskStatus, string> = {
  ANALYZING: '解析中',
  CODING: '编码中',
  COMPLETED: '已完成',
  CREATED: '已创建',
  DEPLOYING: '打包中',
  FAILED: '失败',
  PENDING_APPROVAL: '待审批',
  ROUTING: '路由中',
  TESTING: '测试中',
}

export const statusColorMap: Record<AdminTaskStatus, string> = {
  ANALYZING: 'blue',
  CODING: 'purple',
  COMPLETED: 'success',
  CREATED: 'geekblue',
  DEPLOYING: 'gold',
  FAILED: 'error',
  PENDING_APPROVAL: 'red',
  ROUTING: 'processing',
  TESTING: 'cyan',
}

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
  snapshot?: AdminTaskSnapshot,
): DescriptionsProps['items'] {
  if (!snapshot) return []

  return [
    {
      key: 'task_id',
      label: '工单 ID',
      children: (
        <Typography.Text copyable={{ text: snapshot.task_id }}>
          {snapshot.task_id}
        </Typography.Text>
      ),
    },
    {
      key: 'tenant_id',
      label: '租户',
      children: (
        <Typography.Text copyable={{ text: snapshot.tenant_id }}>
          {snapshot.tenant_id || '-'}
        </Typography.Text>
      ),
    },
    {
      key: 'current_node',
      label: '当前节点',
      children: snapshot.current_node || '-',
    },
    {
      key: 'retry_count',
      label: '重试次数',
      children: snapshot.retry_count,
    },
    {
      key: 'snapshot_at',
      label: '快照时间',
      children: formatDateTime(snapshot.snapshot_at),
    },
  ]
}

export function buildErrorItems(
  error?: AdminTaskSnapshotError | null,
): DescriptionsProps['items'] {
  if (!error) return []

  return [
    {
      key: 'stage',
      label: '阶段',
      children: error.stage || '-',
    },
    {
      key: 'type',
      label: '类型',
      children: error.error_type || '-',
    },
    {
      key: 'file',
      label: '文件',
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
      label: '行号',
      children: error.failed_line ?? '-',
    },
    {
      key: 'failed_at',
      label: '出错时间',
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

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '操作失败'
}
