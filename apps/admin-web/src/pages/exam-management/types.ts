import type {
  AdminExamCreateBody,
  AdminExamQuestionBody,
  AdminExamQuestionUpdateBody,
  AdminExamUpdateBody,
  ExamMode,
  QuestionDifficulty,
  QuestionType,
} from '@/api/exam'

export type ExamDrawerMode = 'create' | 'edit'
export type QuestionDrawerMode = 'create' | 'edit'

export interface ExamFilterValues {
  title?: string
  is_published?: boolean
}

export interface ExamFormValues {
  title: string
  description?: string
  time_limit_minutes?: number | null
  mode: ExamMode
  random_count?: number | null
  random_difficulty_counts?: Partial<Record<QuestionDifficulty, number>> | null
  passing_score: number
  allowed_user_ids_text?: string
  max_attempts_per_user?: number | null
  knowledge_dataset_id?: string | null
}

export interface QuestionOptionFormValue {
  key: string
  text: string
  is_correct: boolean
}

export interface QuestionFormValues {
  type: QuestionType
  text: string
  options: QuestionOptionFormValue[]
  explanation?: string
  score: number
  difficulty: QuestionDifficulty
  order?: number
}

export interface QuestionImportParseResult {
  body?: {
    questions: AdminExamQuestionBody[]
  }
  error?: string
}

export function toExamCreateBody(values: ExamFormValues): AdminExamCreateBody {
  return {
    title: values.title.trim(),
    description: normalizeOptionalText(values.description),
    time_limit_minutes: values.time_limit_minutes ?? null,
    mode: values.mode,
    random_count: values.mode === 'random' ? (values.random_count ?? null) : null,
    random_difficulty_counts: values.random_difficulty_counts ?? null,
    passing_score: values.passing_score,
    allowed_user_ids: parseUserIds(values.allowed_user_ids_text),
    max_attempts_per_user: values.max_attempts_per_user ?? null,
    knowledge_dataset_id: values.knowledge_dataset_id ?? null,
  }
}

export function toExamUpdateBody(values: ExamFormValues): AdminExamUpdateBody {
  return toExamCreateBody(values)
}

export function toQuestionBody(
  values: QuestionFormValues,
): AdminExamQuestionBody {
  return {
    type: values.type,
    text: values.text.trim(),
    options: values.options.map((option) => ({
      key: option.key.trim(),
      text: option.text.trim(),
      is_correct: option.is_correct,
    })),
    explanation: normalizeOptionalText(values.explanation),
    score: values.score,
    difficulty: values.difficulty,
    order: values.order ?? 0,
  }
}

export function toQuestionUpdateBody(
  values: QuestionFormValues,
): AdminExamQuestionUpdateBody {
  return toQuestionBody(values)
}

function normalizeOptionalText(value: string | undefined): string | null {
  const nextValue = value?.trim()

  if (!nextValue) return null

  return nextValue
}

function parseUserIds(value: string | undefined): string[] | null {
  const ids = (value ?? '')
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean)

  return ids.length ? Array.from(new Set(ids)) : null
}
