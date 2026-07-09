import { createRequest } from '../client.js'

export type QuestionGenerationDifficulty = 'easy' | 'medium' | 'hard'
export type QuestionGenerationType = 'single' | 'multiple' | 'true_false'
export type QuestionGenerationJobStatus =
  | 'pending'
  | 'generating'
  | 'generated'
  | 'syncing'
  | 'synced'
  | 'failed'

export interface QuestionGenerationKnowledgePayload {
  enabled?: boolean
  dataset_ids?: string[]
  top_k?: number
  query?: string | null
}

export interface QuestionGenerationJobCreateBody {
  paper_id?: string
  title: string
  description?: string | null
  question_count?: number
  question_types?: QuestionGenerationType[]
  difficulty?: QuestionGenerationDifficulty
  score_per_question?: number
  time_limit_minutes?: number | null
  passing_score?: number
  max_attempts_per_user?: number | null
  knowledge?: QuestionGenerationKnowledgePayload
  allowed_user_ids?: string[] | null
  sync_to_exam?: boolean
  prompt?: string | null
}

export interface QuestionGenerationJobDetail {
  id: string
  user_id: string
  tenant_id?: string | null
  status: QuestionGenerationJobStatus
  title: string
  question_count: number
  ai_run_id?: string | null
  exam_paper_id?: string | null
  source_dataset_ids?: string[]
  error_code?: string | null
  error_message?: string | null
  request_payload?: Record<string, unknown>
  ai_raw_payload?: Record<string, unknown> | null
  exam_payload?: Record<string, unknown> | null
  exam_response?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export const createQuestionGenerationJobRequest = (
  data: QuestionGenerationJobCreateBody,
) =>
  createRequest<QuestionGenerationJobDetail>(
    'POST',
    '/api/v1/question-generation/jobs',
    { data },
  )
