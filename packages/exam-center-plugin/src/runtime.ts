import type { RequestClient } from '@ff-ai-frontend/utils'

export interface ExamCenterMessageApi {
  error(message: string): void
  success(message: string): void
}

export interface ExamCenterRuntime {
  requestClient: RequestClient
  message: ExamCenterMessageApi
}

let runtime: ExamCenterRuntime | undefined

const fallbackMessage: ExamCenterMessageApi = {
  error: () => undefined,
  success: () => undefined,
}

export function configureExamCenterPlugin(nextRuntime: ExamCenterRuntime) {
  runtime = nextRuntime
}

export function getExamCenterRuntime(): ExamCenterRuntime {
  if (!runtime) {
    throw new Error('Exam center plugin runtime has not been configured.')
  }

  return runtime
}

export function getExamCenterMessage(): ExamCenterMessageApi {
  return runtime?.message ?? fallbackMessage
}

export const globalMessage = {
  error(message: string) {
    getExamCenterMessage().error(message)
  },
  success(message: string) {
    getExamCenterMessage().success(message)
  },
}
