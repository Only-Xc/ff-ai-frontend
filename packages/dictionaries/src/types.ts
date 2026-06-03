export type DictType =
  | 'admin_skill_environment'
  | 'admin_skill_status'
  | 'agent_status'
  | 'billing_resource_type'
  | 'ops_metrics_period'
  | 'pending_task_type'
  | 'task_status'
  | 'task_status_filter'
  | 'task_type'

export type DictLocale = 'zh-CN' | 'en-US' | 'ar' | (string & {})

export interface DictItem<Value extends string = string> {
  label: string
  labels?: Partial<Record<DictLocale, string>>
  value: Value
  color?: string
  disabled?: boolean
  sort?: number
  raw?: Record<string, unknown>
}

export type DictRegistry = Record<DictType, readonly DictItem[]>
