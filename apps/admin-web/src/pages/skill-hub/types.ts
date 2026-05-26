import type {
  AdminSkillCodeSnippet,
  AdminSkillEnvironment,
  AdminSkillStatus,
} from '@/api/skill-hub'

export interface SkillFilterValues {
  category?: string
  environment?: AdminSkillEnvironment
  status?: AdminSkillStatus
  keyword?: string
}

export interface SkillFormValues {
  name: string
  category: string
  description?: string
  prompt: string
  environment?: AdminSkillEnvironment
  status?: AdminSkillStatus
  code_snippets?: AdminSkillCodeSnippet[]
  embedding_tags?: string[]
  metadata?: string
}

export type SkillDrawerMode = 'create' | 'edit'
