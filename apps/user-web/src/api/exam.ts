import {
  createTenantAttemptRequest,
  getTenantAttemptRequest,
  getTenantAttemptResultRequest,
  getTenantExamRequest,
  listTenantAttemptsRequest,
  listTenantExamsRequest,
  saveTenantAttemptAnswersRequest,
  submitTenantAttemptRequest,
  type TenantAttemptHistoryQuery,
  type TenantExamListQuery,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  TenantAttemptAnswerBody,
  TenantAttemptList,
  TenantAttemptHistoryQuery,
  TenantAttemptListQuery,
  TenantAttemptResult,
  TenantAttemptState,
  TenantAttemptStatus,
  TenantAttemptStartResponse,
  TenantAttemptSubmitBody,
  TenantAttemptSummary,
  TenantExamList,
  TenantExamListQuery,
  TenantExamMode,
  TenantExamPaper,
  TenantExamPaperDetail,
  TenantExamQuestionOption,
  TenantExamQuestionResultOption,
  TenantQuestionDifficulty,
  TenantQuestionResult,
  TenantQuestionType,
  TenantAttemptQuestion,
} from '@ff-ai-frontend/api'

export const tenantExamKeys = {
  all: ['tenant-exams'] as const,
  lists: () => [...tenantExamKeys.all, 'list'] as const,
  list: (query: TenantExamListQuery) =>
    [...tenantExamKeys.lists(), query] as const,
  detail: (paperId: string) => [...tenantExamKeys.all, 'detail', paperId] as const,
  attempts: ['exam-attempts'] as const,
  attemptLists: () => [...tenantExamKeys.attempts, 'list'] as const,
  attempt: (attemptId: string) =>
    [...tenantExamKeys.attempts, 'detail', attemptId] as const,
  attemptResult: (attemptId: string) =>
    [...tenantExamKeys.attempts, 'result', attemptId] as const,
  myAttempts: (query: TenantAttemptHistoryQuery) =>
    [...tenantExamKeys.attemptLists(), 'mine', query] as const,
}

export const tenantExams_list = request(listTenantExamsRequest)
export const tenantExams_get = request(getTenantExamRequest)
export const tenantAttempts_create = request(createTenantAttemptRequest)
export const tenantAttempts_get = request(getTenantAttemptRequest)
export const tenantAttempts_submit = request(submitTenantAttemptRequest)
export const tenantAttempts_saveAnswers = request(saveTenantAttemptAnswersRequest)
export const tenantAttempts_list = request(listTenantAttemptsRequest)
export const tenantAttempts_result = request(getTenantAttemptResultRequest)
