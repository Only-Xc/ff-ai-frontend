import type { AgentStatus, TaskStatus, TaskType } from '@/api/agent-ticket'
import { DictTag } from '@ff-ai-frontend/dictionaries'

export function TaskStatusTag({ status }: { status: TaskStatus }) {
  return <DictTag type="task_status" value={status} />
}

export function TaskTypeTag({ type }: { type: TaskType }) {
  return <DictTag type="task_type" value={type} />
}

export function AgentStatusTag({ status }: { status: AgentStatus }) {
  return <DictTag type="agent_status" value={status} />
}
