import {
  createAdminExamQuestionRequest,
  createAdminExamRequest,
  createQuestionGenerationJobRequest,
  deleteAdminExamQuestionRequest,
  deleteAdminExamRequest,
  getAdminAttemptRequest,
  getAdminExamRequest,
  importAdminExamQuestionsRequest,
  listAdminAllExamAttemptsRequest,
  listAdminExamAttemptsRequest,
  listAdminExamQuestionStatsRequest,
  listAdminExamQuestionsRequest,
  listAdminExamsRequest,
  listKnowledgeDatasetsRequest,
  publishAdminExamRequest,
  unpublishAdminExamRequest,
  updateAdminExamQuestionRequest,
  updateAdminExamRequest,
  type AdminExamAttemptListQuery,
  type AdminGlobalAttemptListQuery,
  type AdminExamListQuery,
  type KnowledgeDatasetQuery,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  AdminExamAttemptDetail,
  AdminExamAttemptList,
  AdminExamAttemptListQuery,
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
  ExamGenerationStatus,
  AttemptStatus,
  ExamMode,
  ExamQuestionOption,
  KnowledgeDataset,
  KnowledgeDatasetQuery,
  KnowledgeListResult,
  QuestionDifficulty,
  QuestionGenerationJobCreateBody,
  QuestionGenerationJobDetail,
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
  knowledgeDatasets: (query: KnowledgeDatasetQuery) =>
    [...adminExamKeys.all, 'knowledge-datasets', query] as const,
}

export const adminExams_list = request(listAdminExamsRequest)
export const adminExams_create = request(createAdminExamRequest)
export const adminExams_createQuestionGenerationJob = request(
  createQuestionGenerationJobRequest,
)
export const adminExams_get = request(getAdminExamRequest)
export const adminExams_update = request(updateAdminExamRequest)
export const adminExams_delete = request(deleteAdminExamRequest)
export const adminExams_publish = request(publishAdminExamRequest)
export const adminExams_unpublish = request(unpublishAdminExamRequest)
export const adminExamQuestions_import = request(
  importAdminExamQuestionsRequest,
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
export const adminExamAttempts_list = request(listAdminExamAttemptsRequest)
export const adminExamAttempts_listAll = request(
  listAdminAllExamAttemptsRequest,
)
export const adminExamAttempts_get = request(getAdminAttemptRequest)
export const adminExamQuestionStats_list = request(
  listAdminExamQuestionStatsRequest,
)
export const adminExams_listKnowledgeDatasets = request(
  listKnowledgeDatasetsRequest,
)
