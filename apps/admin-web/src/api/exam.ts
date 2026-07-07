import {
  createAdminQuestionBankRequest,
  createAdminExamQuestionRequest,
  createAdminExamRequest,
  deleteAdminExamQuestionRequest,
  deleteAdminExamRequest,
  getAdminAttemptRequest,
  getAdminExamRequest,
  importAdminQuestionBankRequest,
  importAdminExamQuestionsRequest,
  linkAdminExamQuestionsRequest,
  listAdminAllExamAttemptsRequest,
  listAdminExamAttemptsRequest,
  listAdminExamQuestionStatsRequest,
  listAdminExamQuestionsRequest,
  listAdminQuestionBankRequest,
  listAdminExamsRequest,
  publishAdminExamRequest,
  unpublishAdminExamRequest,
  unlinkAdminExamQuestionRequest,
  updateAdminExamQuestionRequest,
  updateAdminExamRequest,
  type AdminExamAttemptListQuery,
  type AdminGlobalAttemptListQuery,
  type AdminExamListQuery,
  type AdminQuestionListQuery,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  AdminExamAttemptDetail,
  AdminExamAttemptList,
  AdminExamAttemptListQuery,
  AdminExamQuestionList,
  AdminExamAttemptSummary,
  AdminExamCreateBody,
  AdminGlobalAttemptListQuery,
  AdminExamList,
  AdminExamListQuery,
  AdminExamPaper,
  AdminExamPaperDetail,
  AdminExamQuestion,
  AdminExamQuestionBody,
  AdminExamQuestionImportBody,
  AdminExamQuestionResult,
  AdminExamQuestionUpdateBody,
  AdminExamUpdateBody,
  AdminQuestionAccuracyStat,
  AdminQuestionLinkBody,
  AdminQuestionListQuery,
  AttemptStatus,
  ExamMode,
  ExamQuestionOption,
  QuestionDifficulty,
  QuestionType,
} from '@ff-ai-frontend/api'

export const adminExamKeys = {
  all: ['admin-exams'] as const,
  lists: () => [...adminExamKeys.all, 'list'] as const,
  list: (query: AdminExamListQuery) =>
    [...adminExamKeys.lists(), query] as const,
  details: () => [...adminExamKeys.all, 'detail'] as const,
  detail: (paperId: string) => [...adminExamKeys.details(), paperId] as const,
  questions: (paperId: string) =>
    [...adminExamKeys.detail(paperId), 'questions'] as const,
  attemptLists: (paperId: string) =>
    [...adminExamKeys.detail(paperId), 'attempts'] as const,
  attempts: (paperId: string, query: AdminExamAttemptListQuery) =>
    [...adminExamKeys.attemptLists(paperId), query] as const,
  globalAttempts: (query: AdminGlobalAttemptListQuery) =>
    [...adminExamKeys.all, 'global-attempts', query] as const,
  attemptDetail: (attemptId: string) =>
    [...adminExamKeys.all, 'attempt-detail', attemptId] as const,
  questionStats: (paperId: string) =>
    [...adminExamKeys.detail(paperId), 'question-stats'] as const,
  questionBank: () => [...adminExamKeys.all, 'question-bank'] as const,
  questionBankList: (query: AdminQuestionListQuery) =>
    [...adminExamKeys.questionBank(), query] as const,
}

export const adminExams_list = request(listAdminExamsRequest)
export const adminExams_create = request(createAdminExamRequest)
export const adminExams_get = request(getAdminExamRequest)
export const adminExams_update = request(updateAdminExamRequest)
export const adminExams_delete = request(deleteAdminExamRequest)
export const adminExams_publish = request(publishAdminExamRequest)
export const adminExams_unpublish = request(unpublishAdminExamRequest)
export const adminExamQuestions_import = request(
  importAdminExamQuestionsRequest,
)
export const adminExamQuestions_link = request(linkAdminExamQuestionsRequest)
export const adminExamQuestions_unlink = request(
  unlinkAdminExamQuestionRequest,
)
export const adminExamQuestions_list = request(listAdminExamQuestionsRequest)
export const adminExamQuestions_create = request(
  createAdminExamQuestionRequest,
)
export const adminExamQuestions_update = request(
  updateAdminExamQuestionRequest,
)
export const adminExamQuestions_delete = request(
  deleteAdminExamQuestionRequest,
)
export const adminQuestionBank_list = request(listAdminQuestionBankRequest)
export const adminQuestionBank_create = request(
  createAdminQuestionBankRequest,
)
export const adminQuestionBank_import = request(
  importAdminQuestionBankRequest,
)
export const adminExamAttempts_list = request(listAdminExamAttemptsRequest)
export const adminExamAttempts_listAll = request(
  listAdminAllExamAttemptsRequest,
)
export const adminExamAttempts_get = request(getAdminAttemptRequest)
export const adminExamQuestionStats_list = request(
  listAdminExamQuestionStatsRequest,
)
