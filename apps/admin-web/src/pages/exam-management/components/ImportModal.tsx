import { Alert, Input, Modal, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import type { AdminExamQuestionImportBody, QuestionType } from '@/api/exam'

interface ImportModalProps {
  open: boolean
  loading?: boolean
  onCancel: () => void
  onSubmit: (body: AdminExamQuestionImportBody) => void
}

export function ImportModal({
  loading,
  onCancel,
  onSubmit,
  open,
}: ImportModalProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState(() => buildSampleJson(t))

  const parsed = useMemo(() => parseQuestionImport(value), [value])

  return (
    <Modal
      destroyOnHidden
      okButtonProps={{ disabled: Boolean(parsed.error), loading }}
      okText={t('pages.examManagement.import.submit')}
      open={open}
      title={t('pages.examManagement.import.title')}
      width={760}
      onCancel={onCancel}
      onOk={() => {
        if (parsed.body) onSubmit(parsed.body)
      }}
    >
      <Typography.Paragraph type="secondary">
        {t('pages.examManagement.import.description')}
      </Typography.Paragraph>
      <Input.TextArea
        className="font-mono"
        value={value}
        autoSize={{ minRows: 14, maxRows: 24 }}
        onChange={(event) => setValue(event.target.value)}
      />
      {parsed.error ? (
        <Alert
          showIcon
          className="mt-3"
          title={formatImportError(parsed.error, t)}
          type="error"
        />
      ) : (
        <Alert
          showIcon
          className="mt-3"
          title={t('pages.examManagement.import.parsedCount', {
            count: parsed.body?.questions.length ?? 0,
          })}
          type="success"
        />
      )}
    </Modal>
  )
}

function parseQuestionImport(value: string): {
  body?: AdminExamQuestionImportBody
  error?: ImportParseError
} {
  let parsed: unknown

  try {
    parsed = JSON.parse(value)
  } catch {
    return { error: { key: 'invalidJson' } }
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.questions)) {
    return { error: { key: 'missingQuestions' } }
  }

  const questions = []
  for (const [index, item] of parsed.questions.entries()) {
    const question = parseQuestion(item)
    if ('error' in question) {
      return {
        error: {
          key: 'questionError',
          values: {
            index: index + 1,
            reason: question.error,
          },
        },
      }
    }
    questions.push(question)
  }

  if (!questions.length) return { error: { key: 'emptyQuestions' } }

  return { body: { questions } }
}

function parseQuestion(item: unknown) {
  if (!isRecord(item)) return { error: 'questionMustBeObject' as const }

  const type = item.type
  if (!isQuestionType(type)) return { error: 'invalidQuestionType' as const }
  if (typeof item.text !== 'string' || !item.text.trim()) return { error: 'textRequired' as const }
  if (!Array.isArray(item.options) || item.options.length === 0) {
    return { error: 'optionsRequired' as const }
  }

  const options = []
  const keys = new Set<string>()
  let correctCount = 0

  for (const option of item.options) {
    if (!isRecord(option)) return { error: 'optionMustBeObject' as const }
    if (typeof option.key !== 'string' || !option.key.trim()) {
      return { error: 'optionKeyRequired' as const }
    }
    if (keys.has(option.key)) return { error: 'optionKeyDuplicate' as const }
    if (typeof option.text !== 'string' || !option.text.trim()) {
      return { error: 'optionTextRequired' as const }
    }
    if (typeof option.is_correct !== 'boolean') {
      return { error: 'optionCorrectBoolean' as const }
    }

    keys.add(option.key)
    if (option.is_correct) correctCount += 1
    options.push({
      key: option.key.trim(),
      text: option.text.trim(),
      is_correct: option.is_correct,
    })
  }

  if (type === 'multiple' && correctCount < 2) {
    return { error: 'multipleCorrectRequired' as const }
  }
  if (type !== 'multiple' && correctCount !== 1) {
    return { error: 'singleCorrectRequired' as const }
  }
  if (typeof item.score !== 'number' || item.score <= 0) return { error: 'scorePositive' as const }

  return {
    type,
    text: item.text.trim(),
    options,
    explanation:
      typeof item.explanation === 'string' && item.explanation.trim()
        ? item.explanation.trim()
        : null,
    score: item.score,
    order: typeof item.order === 'number' ? item.order : 0,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isQuestionType(value: unknown): value is QuestionType {
  return value === 'single' || value === 'multiple' || value === 'true_false'
}

type ImportParseErrorKey =
  | 'emptyQuestions'
  | 'invalidJson'
  | 'missingQuestions'
  | 'questionError'

type QuestionParseErrorKey =
  | 'invalidQuestionType'
  | 'multipleCorrectRequired'
  | 'optionCorrectBoolean'
  | 'optionKeyDuplicate'
  | 'optionKeyRequired'
  | 'optionMustBeObject'
  | 'optionTextRequired'
  | 'optionsRequired'
  | 'questionMustBeObject'
  | 'scorePositive'
  | 'singleCorrectRequired'
  | 'textRequired'

interface ImportParseError {
  key: ImportParseErrorKey
  values?: {
    index?: number
    reason?: QuestionParseErrorKey
  }
}

function formatImportError(error: ImportParseError, t: TFunction) {
  if (error.key !== 'questionError') {
    return t(`pages.examManagement.import.errors.${error.key}`)
  }

  return t('pages.examManagement.import.errors.questionError', {
    index: error.values?.index,
    reason: t(`pages.examManagement.import.errors.${error.values?.reason}`),
  })
}

function buildSampleJson(t: TFunction) {
  return JSON.stringify(
    {
      questions: [
        {
          type: 'single',
          text: t('pages.examManagement.import.sample.questionText'),
          options: [
            {
              key: 'A',
              text: t('pages.examManagement.import.sample.optionA'),
              is_correct: false,
            },
            {
              key: 'B',
              text: t('pages.examManagement.import.sample.optionB'),
              is_correct: true,
            },
          ],
          explanation: t('pages.examManagement.import.sample.explanation'),
          score: 5,
        },
      ],
    },
    null,
    2,
  )
}
