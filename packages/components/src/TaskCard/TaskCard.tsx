import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  LoadingOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { Button, Modal, Tag, Typography, Tooltip } from 'antd'
import { useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router'

import type {
  Task,
  TaskError,
  TaskLog,
  TaskLogLevel,
} from '@ff-ai-frontend/api'
import { DictTag } from '@ff-ai-frontend/dictionaries'
import { useComponentsI18n } from '../locale/index.js'
import type { ComponentsTranslate } from '../locale/types.js'
import { formatDateTime } from './utils.js'

export interface TaskCardProps {
  showAction?: boolean
  task: Task
}

function TaskStatusTag({ status }: { status: string }) {
  return <DictTag className="m-0! shrink-0" type="task_status" value={status} />
}

function TaskErrorSummary({
  error,
  executionError,
}: {
  error: TaskError
  executionError: string
}) {
  return (
    <div className="mt-2 rounded-md border border-[color-mix(in_srgb,var(--admin-danger)_18%,transparent)] bg-[color-mix(in_srgb,var(--admin-danger)_7%,var(--panel))] px-2.5 py-2 text-(--text)">
      <div className="flex min-w-0 items-start gap-2">
        <ExclamationCircleOutlined className="mt-0.5 shrink-0 text-(--admin-danger)" />
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-(--text-strong)">
            {error.stage || executionError}
          </div>
          <div
            className="mt-0.5 line-clamp-2 text-[12px] leading-4 text-(--muted)"
            title={error.message || undefined}
          >
            {error.message || '-'}
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskInfoRow({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[12px] leading-4">
      <span className="text-(--muted)">{label}</span>
      {children}
    </div>
  )
}

function getLogLevelColor(level?: TaskLogLevel) {
  switch (level?.toLowerCase()) {
    case 'error':
      return 'red'
    case 'warn':
    case 'warning':
      return 'orange'
    case 'success':
      return 'green'
    case 'debug':
      return 'blue'
    default:
      return 'default'
  }
}

function getReadableNode(node?: string) {
  if (!node) return ''

  return node
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isTaskActive(status: string) {
  return !['COMPLETED', 'FAILED', 'PENDING_APPROVAL'].includes(status)
}

function toDisplayAgentText(text?: string) {
  return String(text ?? '')
    .replace(/HERMES/g, 'AGENT')
    .replace(/Hermes/g, 'Agent')
    .replace(/hermes/g, 'agent')
}

function stringField(record: Record<string, unknown> | null | undefined, key: string) {
  const value = record?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const text = value?.trim()
    if (text) return text
  }

  return ''
}

function resolveTaskIssueMessage(task: Task) {
  const qualityFailure = task.quality_failure ?? null
  const qualityMessage = stringField(qualityFailure, 'message')
  const solution = stringField(qualityFailure, 'solution')
  const pendingReason =
    typeof task.pending_approval_reason === 'string'
      ? task.pending_approval_reason.trim()
      : ''
  const lastErrorMessage = task.last_error?.message?.trim() ?? ''
  const issueMessage = firstText(
    [qualityMessage, solution].filter(Boolean).join('\n'),
    pendingReason,
  )
  if (issueMessage) return issueMessage

  return lastErrorMessage !== '-' ? lastErrorMessage : ''
}

function resolveTaskError(task: Task, executionError: string): TaskError | null {
  const issueMessage = resolveTaskIssueMessage(task)
  const qualityFailure = task.quality_failure ?? null
  if (qualityFailure || issueMessage) {
    const stage = firstText(
      stringField(qualityFailure, 'code'),
      stringField(qualityFailure, 'step'),
      task.last_error?.stage,
      executionError,
    )
    return {
      stage,
      message: firstText(issueMessage, task.last_error?.message, '-'),
    }
  }
  return task.last_error
}

function buildFallbackLogs(task: Task, t: ComponentsTranslate): TaskLog[] {
  const node = firstText(task.current_node, task.status)
  const readableNode = getReadableNode(node)
  const issueMessage = resolveTaskIssueMessage(task)
  const logs: TaskLog[] = [
    {
      timestamp: task.created_at,
      level: 'success',
      node: 'CREATED',
      message: t('TaskCard.process.created'),
    },
    {
      timestamp: task.updated_at,
      level: isTaskActive(task.status) ? 'info' : 'success',
      node,
      message: isTaskActive(task.status)
        ? t('TaskCard.process.running', { node: firstText(readableNode, node) })
        : t('TaskCard.process.latest', { node: firstText(readableNode, node) }),
    },
  ]

  if (task.status === 'PENDING_APPROVAL') {
    logs.push({
      timestamp: task.updated_at,
      level: 'warn',
      node: firstText(task.current_node, 'PENDING_APPROVAL'),
      message: firstText(
        issueMessage,
        task.last_error?.message,
        t('TaskCard.process.pendingApproval'),
      ),
    })
  }

  if (task.status === 'FAILED') {
    logs.push({
      timestamp: task.updated_at,
      level: 'error',
      node: firstText(task.current_node, 'FAILED'),
      message: firstText(task.last_error?.message, t('TaskCard.process.failed')),
    })
  }

  if (task.status === 'COMPLETED') {
    logs.push({
      timestamp: task.updated_at,
      level: 'success',
      node: 'COMPLETED',
      message: task.web_url
        ? t('TaskCard.process.previewReady')
        : t('TaskCard.process.completed'),
    })
  }

  return logs
}

function TaskLogList({
  compact = false,
  logs,
}: {
  compact?: boolean
  logs: TaskLog[]
}) {
  return (
    <div
      className={`${compact ? 'max-h-48' : 'max-h-64'} overflow-y-auto px-2.5 py-2 [scrollbar-color:var(--scrollbar-thumb)_transparent] scrollbar-thin`}
    >
      <div className="grid gap-2">
        {logs.map((log) => (
          <div
            className="min-w-0 border-l-2 border-[color-mix(in_srgb,var(--admin-primary)_24%,var(--border))] pl-2.5"
            key={`${log.timestamp ?? 'log'}-${log.level ?? 'level'}-${log.message ?? 'message'}`}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="text-[11px] leading-4 text-(--muted)">
                {formatDateTime(log.timestamp)}
              </span>
              <Tag
                color={getLogLevelColor(log.level)}
                className="m-0! text-[11px]! leading-4!"
              >
                {log.level ?? 'info'}
              </Tag>
              {log.node ? (
                <TaskStatusTag status={toDisplayAgentText(log.node)} />
              ) : null}
            </div>
            <div className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-4 text-(--text)">
              {toDisplayAgentText(log.message) || '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskProcessWindow({
  logs,
  task,
}: {
  logs: TaskLog[]
  task: Task
}) {
  const { t } = useComponentsI18n()
  const active = isTaskActive(task.status)

  return (
    <section
      className="mt-2 overflow-hidden rounded-md border border-[color-mix(in_srgb,var(--admin-primary)_18%,var(--border))] bg-[color-mix(in_srgb,var(--control-bg)_72%,var(--panel))]"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-(--border) px-2.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {active ? (
            <LoadingOutlined className="shrink-0 text-(--admin-primary)" />
          ) : task.status === 'COMPLETED' ? (
            <CheckCircleOutlined className="shrink-0 text-(--admin-success)" />
          ) : (
            <HistoryOutlined className="shrink-0 text-(--muted)" />
          )}
          <div className="min-w-0">
            <div className="truncate text-[12px] font-semibold leading-4 text-(--text-strong)">
              {t('TaskCard.process.title')}
            </div>
            <div className="truncate text-[11px] leading-4 text-(--muted)">
              {active
                ? t('TaskCard.process.live')
                : t('TaskCard.process.snapshot')}
            </div>
          </div>
        </div>
        <TaskStatusTag status={task.current_node || task.status} />
      </div>
      <TaskLogList compact logs={logs} />
    </section>
  )
}

function resolvePreviewUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl, window.location.origin)
    const isLocalFrontend =
      url.hostname === window.location.hostname &&
      window.location.port === '8083' &&
      url.pathname.startsWith('/api/')

    if (isLocalFrontend) {
      url.port = '18083'
    }

    return url.toString()
  } catch {
    return rawUrl
  }
}

export function TaskCard({
  showAction = false,
  task,
}: TaskCardProps) {
  const { t } = useComponentsI18n()
  const isApproval = task.status === 'PENDING_APPROVAL'
  const processLogs = useMemo(() => {
    const logs = task.logs ?? []
    return logs.length > 0 ? logs : buildFallbackLogs(task, t)
  }, [task, t])
  const displayError = useMemo(
    () => resolveTaskError(task, t('TaskCard.executionError')),
    [task, t],
  )
  const [previewOpen, setPreviewOpen] = useState(false)
  const previewUrl = useMemo(() => {
    if (!task.web_url) return ''
    return resolvePreviewUrl(task.web_url)
  }, [task.web_url])
  const canPreview = !!previewUrl && task.status === 'COMPLETED'

  const openPreview = () => {
    if (canPreview) {
      setPreviewOpen(true)
    }
  }

  const stopCardClick = (event: MouseEvent) => {
    event.stopPropagation()
  }

  return (
    <>
      <article
      aria-label={canPreview ? `${task.title || task.task_id} preview` : undefined}
      role={canPreview ? 'button' : undefined}
      tabIndex={canPreview ? 0 : undefined}
      onClick={openPreview}
      onKeyDown={(event) => {
        if (!canPreview) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setPreviewOpen(true)
        }
      }}
      className={`relative flex w-full overflow-hidden rounded-lg border p-3 transition-[border-color,box-shadow,transform] duration-160 hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--admin-primary)_32%,var(--border))] hover:shadow-[0_8px_18px_rgb(15_23_42/0.07)] ${
        canPreview ? 'cursor-pointer' : ''
      } ${
        task.status === 'PENDING_APPROVAL'
          ? 'border-[color-mix(in_srgb,var(--admin-danger)_48%,var(--border))] bg-(--panel)'
          : task.status === 'FAILED'
            ? 'border-[color-mix(in_srgb,var(--admin-danger)_40%,var(--border))] bg-(--panel)'
            : 'border-(--border) bg-(--panel)'
      }`}
    >
      <div className="flex min-h-0 w-full flex-col">
        <div className="mb-2 flex shrink-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="line-clamp-1 text-[14px] font-semibold leading-5 text-(--text-strong)">
              {canPreview ? (
                <Tooltip placement="top" title={t('TaskCard.preview')}>
                  <Typography.Link
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setPreviewOpen(true)
                    }}
                    href={previewUrl}
                  >
                    {task.title || '--'}
                  </Typography.Link>
                </Tooltip>
              ) : (
                task.title || '--'
              )}
            </div>
            <Typography.Text
              copyable
              onClick={stopCardClick}
              className="mt-0.5 block max-w-43 truncate text-[12px]! leading-4! text-(--muted)! [&_.ant-typography-copy]:opacity-[0.68]"
            >
              {task.task_id}
            </Typography.Text>
          </div>
          <TaskStatusTag status={task.status} />
        </div>

        <div className="grid shrink-0 gap-1.5 rounded-md bg-(--control-bg) px-2.5 py-2">
          <TaskInfoRow label={t('TaskCard.tenant')}>
            <Typography.Text
              copyable
              onClick={stopCardClick}
              className="max-w-37.5 truncate text-[12px]! leading-4! [&_.ant-typography-copy]:opacity-[0.68]"
            >
              {task.tenant_id || '-'}
            </Typography.Text>
          </TaskInfoRow>
          <TaskInfoRow label={t('TaskCard.node')}>
            <span className="max-w-37.5 truncate text-(--text)">
              {task.current_node || '-'}
            </span>
          </TaskInfoRow>
          <TaskInfoRow label={t('TaskCard.updated')}>
            <span className="text-(--text)">
              {formatDateTime(task.updated_at)}
            </span>
          </TaskInfoRow>
        </div>

        <div className="mt-2 flex shrink-0 flex-wrap items-center gap-1.5">
          <Tag
            icon={<ClockCircleOutlined />}
            className="m-0! text-[12px]! leading-4.5!"
          >
            {formatDateTime(task.created_at)}
          </Tag>
          {task.retry_count > 0 ? (
            <Tag color="orange" className="m-0! text-[12px]! leading-4.5!">
              {t('TaskCard.retry', { count: task.retry_count })}
            </Tag>
          ) : null}
          {isApproval ? (
            <Tag
              color="red"
              icon={<ExclamationCircleOutlined />}
              className="m-0! text-[12px]! leading-4.5!"
            >
              {t('TaskCard.redFlag')}
            </Tag>
          ) : null}
        </div>

        {displayError ? (
          <TaskErrorSummary
            error={displayError}
            executionError={t('TaskCard.executionError')}
          />
        ) : null}
        <TaskProcessWindow logs={processLogs} task={task} />
        {showAction && isApproval ? (
          <Link
            className="block pt-2"
            to={`/tickets/${encodeURIComponent(task.task_id)}/intervention`}
            onClick={stopCardClick}
          >
            <Button
              block
              danger
              icon={<ToolOutlined />}
              size="small"
              type="primary"
            >
              {t('TaskCard.enterIntervention')}
            </Button>
          </Link>
        ) : null}
      </div>
      </article>
      <Modal
        centered
        destroyOnHidden
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        open={previewOpen}
        title={task.title || task.task_id}
        width="min(1120px, calc(100vw - 48px))"
        styles={{
          body: {
            height: 'min(760px, calc(100vh - 150px))',
            padding: 0,
          },
        }}
      >
        {previewUrl ? (
          <iframe
            src={previewUrl}
            title={task.title || task.task_id}
            className="block h-full w-full border-0"
            sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts"
          />
        ) : null}
      </Modal>
    </>
  )
}
