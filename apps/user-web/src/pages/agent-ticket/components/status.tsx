import { Tag } from 'antd'

import type { AgentStatus, TaskStatus, TaskType } from '@/api/agentTicket'

const taskStatusMeta: Record<TaskStatus, { color: string; label: string }> = {
  CREATED: { color: 'blue', label: '已创建' },
  ANALYZING: { color: 'processing', label: '需求分析' },
  ROUTING: { color: 'processing', label: '路由中' },
  CODING: { color: 'processing', label: '编码中' },
  TESTING: { color: 'gold', label: '测试中' },
  DEPLOYING: { color: 'purple', label: '部署中' },
  COMPLETED: { color: 'success', label: '已完成' },
  PENDING_APPROVAL: { color: 'warning', label: '待审批' },
  FAILED: { color: 'error', label: '失败' },
}

const taskTypeMeta: Record<TaskType, string> = {
  direct_result: '直接返回结果',
  process: '创建进程',
  container: '创建容器',
}

const agentStatusMeta: Record<AgentStatus, { color: string; label: string }> = {
  running: { color: 'success', label: '运行中' },
  stopped: { color: 'default', label: '已停止' },
  sandbox: { color: 'processing', label: '沙盒唤醒' },
}

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
