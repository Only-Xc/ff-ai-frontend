import type {
  AdminSkillCreateBody,
  AdminSkillListQuery,
  AdminSkillStatus,
} from '@/api/skill-hub'

export type SkillFilterValues = Omit<AdminSkillListQuery, 'skip' | 'limit'>

export interface SkillFormValues
  extends Omit<AdminSkillCreateBody, 'metadata' | 'status'> {
  status?: AdminSkillStatus
  metadata?: string
}

export type SkillDrawerMode = 'create' | 'edit'
