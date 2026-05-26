import type { AdminSkillEnvironment, AdminSkillStatus } from '@/api/skill-hub'

import type { SkillFormValues } from './types'

export const environmentOptions: {
  label: string
  value: AdminSkillEnvironment
}[] = [
  { label: 'UAT', value: 'UAT' },
  { label: 'PROD', value: 'PROD' },
]

export const statusOptions: { label: string; value: AdminSkillStatus }[] = [
  { label: '热存储', value: 'hot' },
  { label: '冷存储', value: 'cold' },
  { label: '已废弃', value: 'deprecated' },
]

export const createStatusOptions = statusOptions.filter(
  (option) => option.value !== 'deprecated',
)

export const statusColorMap: Record<AdminSkillStatus, string> = {
  hot: 'success',
  cold: 'warning',
  deprecated: 'default',
}

export const statusLabelMap: Record<AdminSkillStatus, string> = {
  hot: '热存储',
  cold: '冷存储',
  deprecated: '已废弃',
}

export const skillFormInitialValues: Partial<SkillFormValues> = {
  environment: 'PROD',
  status: 'hot',
  code_snippets: [],
  embedding_tags: [],
  metadata: '{}',
}
