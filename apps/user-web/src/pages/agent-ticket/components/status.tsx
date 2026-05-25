import { Tag } from 'antd'

import type { AgentStatus, TaskStatus, TaskType } from '@/api/agent-ticket'
import { agentStatusMeta, taskStatusMeta, taskTypeMeta } from '../constants'

export function TaskStatusTag({ status }: { status: TaskStatus }) {
  const meta = taskStatusMeta[status]

  return <Tag color={meta.color}>{meta.label}</Tag>
}

export function TaskTypeTag({ type }: { type: TaskType }) {
  return <Tag>{taskTypeMeta[type]}</Tag>
}

export function AgentStatusTag({ status }: { status: AgentStatus }) {
  const meta = agentStatusMeta[status]

  return <Tag color={meta.color}>{meta.label}</Tag>
}
