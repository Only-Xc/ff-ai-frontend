import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { Button, Collapse, Tag, Typography, Tooltip } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import type {
  Task,
  TaskError,
  TaskLog,
  TaskLogLevel,
} from '@ff-ai-frontend/api'
import { DictTag } from '@ff-ai-frontend/dictionaries'
import { useComponentsI18n } from '../locale/index.js'
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
          <div className="mt-0.5 line-clamp-1 text-[12px] leading-4 text-(--muted)">
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

function TaskLogList({ logs }: { logs: TaskLog[] }) {
  return (
    <div className="max-h-64 overflow-y-auto border-t border-(--border) px-2.5 py-2 [scrollbar-color:var(--scrollbar-thumb)_transparent] scrollbar-thin">
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
                <TaskStatusTag status={log.node} />
              ) : null}
            </div>
            <div className="mt-1 break-words text-[12px] leading-4 text-(--text)">
              {log.message ?? '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskLogsCollapse({
  label,
  logs,
}: {
  label: string
  logs: TaskLog[]
}) {
  if (!logs.length) return null

  return (
    <Collapse
      bordered={false}
      className="mt-2 rounded-md bg-(--control-bg) [&_.ant-collapse-content-box]:p-0! [&_.ant-collapse-header]:items-center! [&_.ant-collapse-header]:px-2.5! [&_.ant-collapse-header]:py-2!"
      expandIconPlacement="end"
      items={[
        {
          key: 'logs',
          label: (
            <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-medium leading-4 text-(--text-strong)">
              <HistoryOutlined className="shrink-0 text-(--muted)" />
              <span className="truncate">{label}</span>
            </span>
          ),
          children: <TaskLogList logs={logs} />,
        },
      ]}
      size="small"
    />
  )
}

export function TaskCard({
  showAction = false,
  task,
}: TaskCardProps) {
  const { t } = useComponentsI18n()
  const isApproval = task.status === 'PENDING_APPROVAL'
  const logs = task.logs ?? []

  return (
    <article
      className={`relative flex overflow-hidden rounded-lg border p-3 transition-[border-color,box-shadow,transform] duration-160 hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--admin-primary)_32%,var(--border))] hover:shadow-[0_8px_18px_rgb(15_23_42/0.07)] ${
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
              {task.web_url ? (
                <Tooltip placement="top" title={t('TaskCard.preview')}>
                  <Typography.Link href={task.web_url} target="_blank">
                    {task.title || '--'}
                  </Typography.Link>
                </Tooltip>
              ) : (
                task.title || '--'
              )}
            </div>
            <Typography.Text
              copyable
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

        {task.last_error ? (
          <TaskErrorSummary
            error={task.last_error}
            executionError={t('TaskCard.executionError')}
          />
        ) : null}
        {logs.length > 0 ? (
          <TaskLogsCollapse
            label={t('TaskCard.logs', { count: logs.length })}
            logs={logs}
          />
        ) : null}
        {showAction && isApproval ? (
          <Link
            className="block pt-2"
            to={`/tickets/${encodeURIComponent(task.task_id)}/intervention`}
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
  )
}
