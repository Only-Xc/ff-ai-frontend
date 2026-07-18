import { createRequest, path } from '../client.js'
import type { ListResult, PaginationQuery } from '../common.js'

const EXAM_PLUGIN_ACCESS_BASE = '/api/v1/plugins/examapi'
const EXAM_PLUGIN_API_BASE = `${EXAM_PLUGIN_ACCESS_BASE}/proxy`

function examPluginApiPath(apiPath: string) {
  return `${EXAM_PLUGIN_API_BASE}${apiPath}`
}

export type TenantQuestionType = 'single' | 'multiple' | 'true_false'
export type TenantExamMode = 'fixed' | 'random'
export type TenantAttemptStatus = 'in_progress' | 'submitted'
export type TenantQuestionDifficulty = 'easy' | 'medium' | 'hard'
export type TenantExamPluginInstallationStatus =
  | 'registered'
  | 'pending'
  | 'installing'
  | 'installed'
  | 'starting'
  | 'enabled'
  | 'healthy'
  | 'unhealthy'
  | 'disabled'
  | 'failed'
  | string
export type TenantExamPluginServiceStatus =
  | 'starting'
  | 'healthy'
  | 'unhealthy'
  | 'disabled'
  | 'deleted'
  | string

export interface TenantExamPluginServiceHealth {
  service_id: string
  service_name: string
  status: TenantExamPluginServiceStatus
  http_status: number | null
  latency_ms: number | null
  openapi_hash: string | null
  error: string | null
}

export interface TenantExamPluginHealth {
  installation_id: string
  status: TenantExamPluginInstallationStatus
  services: TenantExamPluginServiceHealth[]
}

export interface TenantExamQuestionOption {
  key: string
  text: string
}

export interface TenantExamQuestionResultOption
  extends TenantExamQuestionOption {
  is_correct: boolean
}

export interface TenantExamPaper {
  id: string
  title: string
  description: string | null
  time_limit_minutes: number | null
  mode: TenantExamMode
  random_count: number | null
  random_difficulty_counts?: Partial<Record<TenantQuestionDifficulty, number>> | null
  passing_score: number
  max_attempts_per_user?: number | null
  is_published: boolean
  created_by: string
  created_at: string
  updated_at: string
  question_count?: number
  allowed_user_ids?: string[]
}

export interface TenantExamPaperDetail extends TenantExamPaper {
  questions?: TenantAttemptQuestion[]
}

export interface TenantAttemptQuestion {
  id: string
  question_id?: string
  type: TenantQuestionType
  text: string
  options: TenantExamQuestionOption[]
  score: number
  difficulty?: TenantQuestionDifficulty | null
  order: number
}

export interface TenantAttemptAnswerBody {
  question_id: string
  selected_keys: string[]
  marked_for_review?: boolean
}

export interface TenantAttemptSubmitBody {
  answers: TenantAttemptAnswerBody[]
}

export interface TenantAttemptStartResponse {
  id: string
  paper_id: string
  paper_title: string
  status: TenantAttemptStatus
  started_at: string
  submitted_at: string | null
  time_limit_minutes: number | null
  questions: TenantAttemptQuestion[]
}

export interface TenantAttemptState extends TenantAttemptStartResponse {
  answers: TenantAttemptAnswerBody[]
}

export interface TenantAttemptSummary {
  id: string
  paper_id: string
  paper_title: string
  status: TenantAttemptStatus
  started_at: string
  submitted_at: string | null
  time_used_seconds: number | null
  score: number | null
  total_score: number | null
  is_passed: boolean | null
}

export interface TenantQuestionResult {
  question_id: string
  type: TenantQuestionType
  text: string
  options: TenantExamQuestionResultOption[]
  selected_keys: string[]
  correct_keys: string[]
  marked_for_review?: boolean
  score: number
  earned_score: number
  difficulty?: TenantQuestionDifficulty | null
  explanation: string | null
  is_correct: boolean
}

export interface TenantAttemptResult extends TenantAttemptSummary {
  passing_score: number
  questions: TenantQuestionResult[]
}

export type TenantExamListQuery = {
  sort?: string
  title?: string
} & PaginationQuery

export type TenantAttemptListQuery = PaginationQuery
export type TenantAttemptHistoryQuery = {
  paper_id?: string
  status?: TenantAttemptStatus
} & PaginationQuery

export type TenantExamList = ListResult<TenantExamPaper>
export type TenantAttemptList = ListResult<TenantAttemptSummary>

export const getTenantExamPluginHealthRequest = () =>
  createRequest<TenantExamPluginHealth>('GET', `${EXAM_PLUGIN_ACCESS_BASE}/health`, {
    meta: { skipGlobalErrorToast: true },
  })

export const listTenantExamsRequest = (params: TenantExamListQuery) =>
  createRequest<TenantExamList>('GET', examPluginApiPath('/exams'), { params })

export const getTenantExamRequest = (paperId: string) =>
  createRequest<TenantExamPaperDetail>(
    'GET',
    examPluginApiPath(path`/exams/${paperId}`),
  )

export const createTenantAttemptRequest = (paperId: string) =>
  createRequest<TenantAttemptStartResponse>(
    'POST',
    examPluginApiPath(path`/exams/${paperId}/attempts`),
  )

export const getTenantAttemptRequest = (attemptId: string) =>
  createRequest<TenantAttemptState>(
    'GET',
    examPluginApiPath(path`/attempts/${attemptId}`),
    { meta: { skipGlobalErrorToast: true } },
  )

export const submitTenantAttemptRequest = (
  attemptId: string,
  data: TenantAttemptSubmitBody,
) =>
  createRequest<TenantAttemptResult>(
    'POST',
    examPluginApiPath(path`/attempts/${attemptId}/submit`),
    { data, meta: { skipGlobalErrorToast: true } },
  )

export const saveTenantAttemptAnswersRequest = (
  attemptId: string,
  data: TenantAttemptSubmitBody,
) =>
  createRequest<TenantAttemptState>(
    'PATCH',
    examPluginApiPath(path`/attempts/${attemptId}/answers`),
    { data, meta: { skipGlobalErrorToast: true } },
  )

export const listTenantAttemptsRequest = (params: TenantAttemptHistoryQuery) =>
  createRequest<TenantAttemptList>('GET', examPluginApiPath('/attempts'), { params })

export const getTenantAttemptResultRequest = (attemptId: string) =>
  createRequest<TenantAttemptResult>(
    'GET',
    examPluginApiPath(path`/attempts/${attemptId}/result`),
  )
