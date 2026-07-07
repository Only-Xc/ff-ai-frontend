import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Typography } from 'antd'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  TenantExamQuestionResultOption,
  TenantQuestionResult,
} from '@/api/exam'

interface ResultDetailProps {
  questions: TenantQuestionResult[]
}

export function ResultDetail({ questions }: ResultDetailProps) {
  const { t } = useTranslation()

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgb(15_23_42/0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div>
          <h3 className="m-0 text-base font-semibold text-slate-950">
            {t('pages.exam.result.detailTitle')}
          </h3>
          <p className="m-0 mt-0.5 text-xs text-slate-500">
            {t('pages.exam.result.detailSubtitle', {
              count: questions.length,
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <LegendItem className="bg-emerald-600" label={t('pages.exam.result.legend.correctOption')} />
          <LegendItem className="bg-slate-900" label={t('pages.exam.result.legend.userSelection')} />
          <LegendItem className="bg-rose-600" label={t('pages.exam.result.legend.wrongSelection')} />
        </div>
      </div>

      <div className="space-y-3 bg-slate-50/80 px-3 py-3 sm:px-4 sm:py-4">
        {questions.map((question, index) => (
          <QuestionResultCard
            index={index}
            key={question.question_id}
            question={question}
            t={t}
          />
        ))}
      </div>
    </section>
  )
}

interface QuestionResultCardProps {
  index: number
  question: TenantQuestionResult
  t: ReturnType<typeof useTranslation>['t']
}

function QuestionResultCard({ index, question, t }: QuestionResultCardProps) {
  return (
    <article
      className="scroll-mt-4 overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgb(15_23_42/0.06)]"
      id={getQuestionAnchorId(question.question_id)}
    >
      <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_120px] sm:p-5">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-slate-100 px-2 text-sm font-semibold text-slate-900">
              {index + 1}
            </span>
            <span className={getResultLabelClassName(question.is_correct)}>
              {question.is_correct ? (
                <CheckCircleOutlined />
              ) : (
                <CloseCircleOutlined />
              )}
              {question.is_correct
                ? t('pages.exam.result.answerCorrect')
                : t('pages.exam.result.answerWrong')}
            </span>
            <QuestionTypeTag type={question.type} t={t} />
            {question.difficulty ? (
              <NeutralTag>
                {t(`pages.exam.difficulty.${question.difficulty}`)}
              </NeutralTag>
            ) : null}
            {question.marked_for_review ? (
              <NeutralTag>{t('pages.exam.room.review')}</NeutralTag>
            ) : null}
          </div>
          <Typography.Paragraph className="mb-0! text-[15px]! leading-6! text-slate-950!">
            {question.text}
          </Typography.Paragraph>
        </div>

        <span className={getScoreClassName(question.is_correct)}>
          {t('pages.exam.score.withTotal', {
            score: formatScore(question.earned_score),
            total: formatScore(question.score),
          })}
        </span>
      </div>

      <div className="space-y-3 px-4 pb-4 sm:px-5">
        <div className="grid gap-2">
          {question.options.map((option) => (
            <OptionRow
              correctKeys={question.correct_keys}
              key={option.key}
              option={option}
              selectedKeys={question.selected_keys}
              t={t}
            />
          ))}
        </div>

        <div className="grid gap-2 border-t border-slate-100 pt-3 text-sm md:grid-cols-2">
          <AnswerBox
            label={t('pages.exam.result.yourAnswer')}
            value={formatKeys(question.selected_keys)}
          />
          <AnswerBox
            label={t('pages.exam.result.correctAnswer')}
            tone="success"
            value={formatKeys(question.correct_keys)}
          />
        </div>

        {question.explanation ? (
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="mb-1 text-xs font-semibold text-slate-500">
              {t('pages.exam.result.explanation')}
            </div>
            <Typography.Paragraph className="mb-0! text-sm! leading-6! text-slate-700!">
              {question.explanation}
            </Typography.Paragraph>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
            {t('pages.exam.result.noExplanation')}
          </div>
        )}
      </div>
    </article>
  )
}

interface OptionRowProps {
  correctKeys: string[]
  option: TenantExamQuestionResultOption
  selectedKeys: string[]
  t: ReturnType<typeof useTranslation>['t']
}

function OptionRow({ correctKeys, option, selectedKeys, t }: OptionRowProps) {
  const isSelected = selectedKeys.includes(option.key)
  const isCorrect = correctKeys.includes(option.key) || option.is_correct
  const isWrongSelection = isSelected && !isCorrect
  const className = getOptionClassName(isCorrect, isSelected, isWrongSelection)

  return (
    <div className={className}>
      <span className={getOptionKeyClassName(isCorrect, isWrongSelection)}>
        {option.key}
      </span>
      <span className="min-w-0 flex-1 text-sm leading-6">{option.text}</span>
      <span className="flex shrink-0 flex-wrap justify-end gap-1.5">
        {isWrongSelection ? (
          <StatusPill tone="danger">{t('pages.exam.result.misselected')}</StatusPill>
        ) : null}
        {isSelected && !isWrongSelection ? (
          <StatusPill tone="primary">{t('pages.exam.result.yourSelection')}</StatusPill>
        ) : null}
        {isCorrect ? (
          <StatusPill tone="success">{t('pages.exam.result.correctAnswer')}</StatusPill>
        ) : null}
      </span>
    </div>
  )
}

interface AnswerBoxProps {
  label: string
  tone?: 'default' | 'success'
  value: string
}

function AnswerBox({ label, tone = 'default', value }: AnswerBoxProps) {
  const toneClassName = {
    default: 'text-slate-700',
    success: 'text-emerald-700',
  }[tone]

  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${toneClassName}`}>
        {value}
      </div>
    </div>
  )
}

interface LegendItemProps {
  className: string
  label: string
}

function LegendItem({ className, label }: LegendItemProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  )
}

interface StatusPillProps {
  children: ReactNode
  tone: 'danger' | 'primary' | 'success'
}

function StatusPill({ children, tone }: StatusPillProps) {
  const className = {
    danger: 'text-rose-700',
    primary: 'text-slate-900',
    success: 'text-emerald-700',
  }[tone]

  return (
    <span
      className={`rounded-full bg-white px-2 py-0.5 text-xs font-medium ring-1 ring-slate-200 ${className}`}
    >
      {children}
    </span>
  )
}

function QuestionTypeTag({
  t,
  type,
}: {
  t: ReturnType<typeof useTranslation>['t']
  type: TenantQuestionResult['type']
}) {
  return <NeutralTag>{t(`pages.exam.questionType.${type}`)}</NeutralTag>
}

function NeutralTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center rounded-md bg-slate-100 px-2 text-xs font-medium text-slate-600">
      {children}
    </span>
  )
}

function getResultLabelClassName(isCorrect: boolean) {
  const baseClassName =
    'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold'

  if (isCorrect) return `${baseClassName} bg-emerald-50 text-emerald-700`

  return `${baseClassName} bg-rose-50 text-rose-700`
}

function getScoreClassName(isCorrect: boolean) {
  const baseClassName =
    'justify-self-start text-base font-semibold leading-7 sm:justify-self-end'

  if (isCorrect) return `${baseClassName} text-emerald-700`

  return `${baseClassName} text-rose-700`
}

function getOptionClassName(
  isCorrect: boolean,
  isSelected: boolean,
  isWrongSelection: boolean,
) {
  const baseClassName =
    'flex flex-wrap items-start gap-3 rounded-lg px-3 py-2.5 text-slate-700 transition-colors duration-200 sm:flex-nowrap'

  if (isWrongSelection) return `${baseClassName} bg-rose-50 ring-1 ring-rose-100`
  if (isCorrect && isSelected)
    return `${baseClassName} bg-emerald-50 ring-1 ring-emerald-100`
  if (isCorrect) return `${baseClassName} bg-emerald-50/50`
  if (isSelected) return `${baseClassName} bg-slate-100`

  return `${baseClassName} bg-slate-50`
}

function getOptionKeyClassName(isCorrect: boolean, isWrongSelection: boolean) {
  const baseClassName =
    'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-semibold'

  if (isWrongSelection) return `${baseClassName} bg-rose-600 text-white`
  if (isCorrect) return `${baseClassName} bg-emerald-600 text-white`

  return `${baseClassName} bg-white text-slate-700 shadow-[0_1px_2px_rgb(15_23_42/0.04)]`
}

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatKeys(keys: string[]) {
  const value = keys.join('、')

  if (!value) return '-'

  return value
}

function getQuestionAnchorId(questionId: string) {
  return `question-${questionId}`
}
