import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { Button, Tag, Typography, Tooltip } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { DictTag } from '@ff-ai-frontend/dictionaries'
import { useComponentsI18n } from '../locale/index.js'
import { formatDateTime } from './utils.js'

export interface TaskCardError {
  stage: string
  message: string
}

export type TaskCardStatus =
  | 'CREATED'
  | 'ANALYZING'
  | 'ROUTING'
  | 'CODING'
  | 'TESTING'
  | 'DEPLOYING'
  | 'COMPLETED'
  | 'PENDING_APPROVAL'
  | 'FAILED'
  | (string & {})

export interface TaskCardTask {
  title: string
  status: TaskCardStatus
  task_id: string
  tenant_id: string
  created_at: string
  updated_at: string
  last_error?: TaskCardError | null
  retry_count: number
  current_node: string
  web_url?: string | null
}

export interface TaskCardProps {
  showAction?: boolean
  task: TaskCardTask
}

function TaskStatusTag({ status }: { status: TaskCardStatus }) {
  return <DictTag className="m-0! shrink-0" type="task_status" value={status} />
}

function TaskErrorSummary({
  error,
  executionError,
}: {
  error: TaskCardError
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

export function TaskCard({
  showAction = false,
  task,
}: TaskCardProps) {
  const { t } = useComponentsI18n()
  const isApproval = task.status === 'PENDING_APPROVAL'

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
