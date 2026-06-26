export type TaskStatusFilter =
  | 'active'
  | 'pending_approval'
  | 'completed'
  | 'failed'
  | ''

export type TaskStatus =
  | 'CREATED'
  | 'ANALYZING'
  | 'ROUTING'
  | 'CODING'
  | 'TESTING'
  | 'DEPLOYING'
  | 'COMPLETED'
  | 'PENDING_APPROVAL'
  | 'FAILED'

export type TaskType = 'direct_result' | 'process' | 'container'

export interface TaskError {
  stage: string
  message: string
}

export interface TaskQualityFailure {
  [key: string]: unknown
  code?: string
  message?: string
  reprompt_hint?: string
  solution?: string
  step?: string
}

export type TaskLogLevel =
  | 'debug'
  | 'error'
  | 'info'
  | 'success'
  | 'warn'
  | 'warning'
  | (string & {})

export interface TaskLog {
  [key: string]: unknown
  task_id?: string
  timestamp?: string
  level?: TaskLogLevel
  node?: string
  message?: string
  metadata?: Record<string, unknown> | null
}

export interface Task {
  title: string
  status: TaskStatus
  task_id: string
  tenant_id: string
  agent_id: string | null
  task_type: TaskType
  created_at: string
  updated_at: string
  last_error: TaskError | null
  retry_count: number
  current_node: string
  quality_failure?: TaskQualityFailure | null
  manual_fix_required?: boolean | null
  pending_approval_reason?: string | null
  web_url?: string | null
  logs?: TaskLog[]
}
