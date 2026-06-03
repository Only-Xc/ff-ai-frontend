import type { SkillFormValues } from './types'

export const skillFormInitialValues: Partial<SkillFormValues> = {
  environment: 'PROD',
  status: 'hot',
  code_snippets: [],
  embedding_tags: [],
  metadata: '{}',
}
