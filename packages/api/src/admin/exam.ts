import { createRequest, path } from '../client.js'
import type { ListResult, PaginationQuery } from '../common.js'

export type QuestionType = 'single' | 'multiple' | 'true_false'
export type ExamMode = 'fixed' | 'random'
export type AttemptStatus = 'in_progress' | 'submitted'
export type QuestionDifficulty = 'easy' | 'medium' | 'hard'
export type ExamGenerationStatus = 'completed' | 'generating' | 'failed'

export interface ExamQuestionOption {
  key: string
  text: string
  is_correct: boolean
}

export interface AdminExamPaper {
  id: string
  title: string
  description: string | null
  time_limit_minutes: number | null
  mode: ExamMode
  random_count: number | null
  random_difficulty_counts?: Partial<Record<QuestionDifficulty, number>> | null
  passing_score: number
  allowed_user_ids: string[]
  max_attempts_per_user?: number | null
  generation_status: ExamGenerationStatus
  knowledge_dataset_id?: string | null
  question_generation_job_id?: string | null
  is_published: boolean
  created_by: string
  created_at: string
  updated_at: string
  question_count?: number
}

export interface AdminExamQuestion {
  id: string
  paper_id: string
  type: QuestionType
  text: string
  options: ExamQuestionOption[]
  explanation: string | null
  score: number
  difficulty?: QuestionDifficulty | null
  order: number
  created_at: string
}

export interface AdminExamPaperDetail extends AdminExamPaper {
  questions: AdminExamQuestion[]
}

export interface AdminExamAttemptSummary {
  id: string
  user_id: string
  user_email?: string | null
  user_name?: string | null
  paper_id: string
  paper_title?: string | null
  status: AttemptStatus
  started_at: string
  submitted_at: string | null
  time_used_seconds: number | null
  score: number | null
  total_score: number | null
  is_passed: boolean | null
}

export interface AdminExamQuestionResult {
  question_id: string
  type: QuestionType
  text: string
  options: ExamQuestionOption[]
  selected_keys: string[]
  correct_keys: string[]
  marked_for_review?: boolean
  score: number
  earned_score: number
  difficulty?: QuestionDifficulty | null
  explanation: string | null
  is_correct: boolean
}

export interface AdminExamAttemptDetail extends AdminExamAttemptSummary {
  passing_score: number
  questions: AdminExamQuestionResult[]
}

export type AdminExamListQuery = {
  sort?: string
  title?: string
  is_published?: boolean
} & PaginationQuery

export type AdminExamAttemptListQuery = PaginationQuery

export type AdminGlobalAttemptListQuery = {
  paper_id?: string
  status?: AttemptStatus
  user_id?: string
} & PaginationQuery

export interface AdminExamCreateBody {
  title: string
  description?: string | null
  time_limit_minutes?: number | null
  mode: ExamMode
  random_count?: number | null
  random_difficulty_counts?: Partial<Record<QuestionDifficulty, number>> | null
  passing_score: number
  allowed_user_ids?: string[] | null
  max_attempts_per_user?: number | null
  knowledge_dataset_id?: string | null
}

export type AdminExamUpdateBody = Partial<AdminExamCreateBody> & {
  is_published?: boolean
}

export interface AdminExamQuestionBody {
  type: QuestionType
  text: string
  options: ExamQuestionOption[]
  explanation?: string | null
  score: number
  difficulty?: QuestionDifficulty | null
  order?: number
}

export type AdminExamQuestionUpdateBody = Partial<AdminExamQuestionBody>

export interface AdminExamQuestionImportBody {
  questions: AdminExamQuestionBody[]
}

export type AdminExamList = ListResult<AdminExamPaper>
export type AdminExamAttemptList = ListResult<AdminExamAttemptSummary>

export interface AdminQuestionAccuracyStat {
  question_id: string
  text: string
  type: QuestionType
  difficulty?: QuestionDifficulty | null
  order: number
  attempt_count: number
  correct_count: number
  accuracy_rate: number
}

export interface AdminQuestionAccuracyStatsResponse {
  paper_id: string
  questions: AdminQuestionAccuracyStat[]
}

export const listAdminExamsRequest = (params: AdminExamListQuery) =>
  createRequest<AdminExamList>('GET', '/api/v1/exam/admin/exams', { params })

export const createAdminExamRequest = (data: AdminExamCreateBody) =>
  createRequest<AdminExamPaper>('POST', '/api/v1/exam/admin/exams', { data })

export const getAdminExamRequest = (paperId: string) =>
  createRequest<AdminExamPaperDetail>(
    'GET',
    path`/api/v1/exam/admin/exams/${paperId}`,
  )

export const updateAdminExamRequest = (
  paperId: string,
  data: AdminExamUpdateBody,
) =>
  createRequest<AdminExamPaper>('PATCH', path`/api/v1/exam/admin/exams/${paperId}`, {
    data,
  })

export const deleteAdminExamRequest = (paperId: string) =>
  createRequest<void>('DELETE', path`/api/v1/exam/admin/exams/${paperId}`)

export const publishAdminExamRequest = (paperId: string) =>
  createRequest<AdminExamPaper>(
    'POST',
    path`/api/v1/exam/admin/exams/${paperId}/publish`,
  )

export const unpublishAdminExamRequest = (paperId: string) =>
  createRequest<AdminExamPaper>(
    'POST',
    path`/api/v1/exam/admin/exams/${paperId}/unpublish`,
  )

export const importAdminExamQuestionsRequest = (
  paperId: string,
  data: AdminExamQuestionImportBody,
) =>
  createRequest<AdminExamQuestion[]>(
    'POST',
    path`/api/v1/exam/admin/exams/${paperId}/questions/import`,
    { data },
  )

export const listAdminExamQuestionsRequest = (paperId: string) =>
  createRequest<AdminExamQuestion[]>(
    'GET',
    path`/api/v1/exam/admin/exams/${paperId}/questions`,
  )

export const createAdminExamQuestionRequest = (
  paperId: string,
  data: AdminExamQuestionBody,
) =>
  createRequest<AdminExamQuestion>(
    'POST',
    path`/api/v1/exam/admin/exams/${paperId}/questions`,
    { data },
  )

export const deleteAdminExamQuestionRequest = (
  paperId: string,
  questionId: string,
) =>
  createRequest<void>(
    'DELETE',
    path`/api/v1/exam/admin/exams/${paperId}/questions/${questionId}`,
)

export const updateAdminExamQuestionRequest = (
  paperId: string,
  questionId: string,
  data: AdminExamQuestionUpdateBody,
) =>
  createRequest<AdminExamQuestion>(
    'PATCH',
    path`/api/v1/exam/admin/exams/${paperId}/questions/${questionId}`,
    { data },
  )

export const listAdminExamAttemptsRequest = (
  paperId: string,
  params: AdminExamAttemptListQuery,
) =>
  createRequest<AdminExamAttemptList>(
    'GET',
    path`/api/v1/exam/admin/exams/${paperId}/attempts`,
    { params },
  )

export const listAdminAllExamAttemptsRequest = (
  params: AdminGlobalAttemptListQuery,
) =>
  createRequest<AdminExamAttemptList>('GET', '/api/v1/exam/admin/attempts', {
    params,
  })

export const getAdminAttemptRequest = (attemptId: string) =>
  createRequest<AdminExamAttemptDetail>(
    'GET',
    path`/api/v1/exam/admin/attempts/${attemptId}`,
  )

export const listAdminExamQuestionStatsRequest = (paperId: string) =>
  createRequest<AdminQuestionAccuracyStatsResponse>(
    'GET',
    path`/api/v1/exam/admin/exams/${paperId}/question-accuracy`,
  )
