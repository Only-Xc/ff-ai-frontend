import type { TenantAttemptAnswerBody } from '@/api/exam'

export type AnswerMap = Record<string, string[]>
export type ReviewMarkMap = Record<string, boolean>

export interface QuestionNavItem {
  questionId: string
  index: number
  answered: boolean
  marked: boolean
}

export function answersToMap(answers: TenantAttemptAnswerBody[]): AnswerMap {
  return answers.reduce<AnswerMap>((result, answer) => {
    result[answer.question_id] = answer.selected_keys
    return result
  }, {})
}

export function marksFromAnswers(answers: TenantAttemptAnswerBody[]): ReviewMarkMap {
  return answers.reduce<ReviewMarkMap>((result, answer) => {
    if (answer.marked_for_review) {
      result[answer.question_id] = true
    }
    return result
  }, {})
}

export function mapToAnswers(
  answerMap: AnswerMap,
  markMap: ReviewMarkMap = {},
): TenantAttemptAnswerBody[] {
  const questionIds = new Set([
    ...Object.keys(answerMap),
    ...Object.keys(markMap),
  ])

  return Array.from(questionIds).map((question_id) => ({
    question_id,
    selected_keys: answerMap[question_id] ?? [],
    marked_for_review: Boolean(markMap[question_id]),
  }))
}
