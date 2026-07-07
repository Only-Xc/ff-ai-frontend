import {
  ArrowLeftOutlined,
  FlagOutlined,
} from '@ant-design/icons'
import { Alert, Button, Spin } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import {
  tenantAttempts_result,
  tenantExamKeys,
  type TenantQuestionResult,
} from '@/api/exam'
import { PageContainer } from '@ff-ai-frontend/components'

import { ResultDetail } from './components/ResultDetail'
import { useExamStyles } from './styles'

export function ExamResult() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { styles } = useExamStyles()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const resultQuery = useQuery({
    queryKey: tenantExamKeys.attemptResult(attemptId ?? ''),
    queryFn: () => tenantAttempts_result(attemptId!),
    enabled: Boolean(attemptId),
  })

  const result = resultQuery.data
  const summary = useMemo(() => {
    if (!result) return null

    const questions = result.questions ?? []
    const totalQuestions = questions.length
    const correctCount = questions.filter(
      (question) => question.is_correct,
    ).length
    const reviewCount = questions.filter(
      (question) => question.marked_for_review,
    ).length
    const answeredCount = questions.filter(
      (question) => question.selected_keys.length > 0,
    ).length
    const earnedScore =
      result.score ??
      questions.reduce((total, question) => total + question.earned_score, 0)
    const totalScore =
      result.total_score ??
      questions.reduce((total, question) => total + question.score, 0)
    const scorePercent =
      totalScore > 0 ? Math.round((earnedScore / totalScore) * 100) : 0
    const correctPercent =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

    return {
      answeredCount,
      correctCount,
      correctPercent,
      earnedScore,
      reviewCount,
      scorePercent: clampPercent(scorePercent),
      totalQuestions,
      totalScore,
      wrongCount: Math.max(totalQuestions - correctCount, 0),
    }
  }, [result])
  const wrongQuestions = useMemo(() => {
    return (result?.questions ?? [])
      .map((question, index) => ({ question, index }))
      .filter((item) => !item.question.is_correct)
  }, [result?.questions])

  const scrollToQuestion = (questionId: string) => {
    const container = scrollContainerRef.current
    const target = document.getElementById(getQuestionAnchorId(questionId))

    if (!container || !target) return

    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const offsetTop = targetRect.top - containerRect.top + container.scrollTop

    container.scrollTo({
      behavior: 'smooth',
      top: Math.max(offsetTop - 16, 0),
    })
  }

  return (
    <div className={styles.pageShell}>
      <PageContainer
        bordered={false}
        className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent! p-0 shadow-none!"
      >
        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 overflow-y-auto bg-slate-100/80"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_272px] lg:px-6">
            <div className="flex min-w-0 flex-col gap-5">
              {!attemptId ? (
                <Alert showIcon message={t('pages.exam.errors.missingAttemptId')} type="error" />
              ) : null}
              {resultQuery.isError ? (
                <Alert showIcon message={t('pages.exam.errors.resultLoadFailed')} type="error" />
              ) : null}
              {resultQuery.isLoading ? (
                <div
                  aria-live="polite"
                  className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgb(15_23_42/0.06)]"
                >
                  <Spin />
                </div>
              ) : null}
              {result && summary ? (
                <>
                  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_44px_rgb(15_23_42/0.08)]">
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                        <Button
                          className="-ml-2 text-slate-600!"
                          icon={<ArrowLeftOutlined />}
                          type="text"
                          onClick={() => void navigate('/exams')}
                        >
                          {t('pages.exam.actions.backToList')}
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-5 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
                      <div className="min-w-0">
                        <h1 className="m-0 text-xl font-semibold leading-8 text-slate-950 sm:text-2xl">
                          {result.paper_title}
                        </h1>
                        <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                          {getResultInsight(
                            result.is_passed,
                            summary.earnedScore,
                            result.passing_score,
                            t,
                          )}
                        </p>
                        <div className="mt-4 grid gap-x-5 gap-y-3 sm:grid-cols-3">
                          <SummaryMetric
                            helper={t('pages.exam.result.answeredHelper', {
                              answered: summary.answeredCount,
                              total: summary.totalQuestions,
                            })}
                            label={t('pages.exam.result.progress')}
                            value={t('pages.exam.units.questions', {
                              count: summary.totalQuestions,
                            })}
                          />
                          <SummaryMetric
                            helper={t('pages.exam.result.correctHelper', {
                              count: summary.correctCount,
                            })}
                            label={t('pages.exam.result.correctRate')}
                            value={`${summary.correctPercent}%`}
                          />
                          <SummaryMetric
                            helper={t('pages.exam.result.reviewHelper', {
                              count: summary.reviewCount,
                            })}
                            label={t('pages.exam.result.wrongQuestions')}
                            strong={summary.wrongCount > 0}
                            value={t('pages.exam.units.questions', {
                              count: summary.wrongCount,
                            })}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col justify-between border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                        <div>
                          <div className="text-xs font-medium text-slate-500">
                            {t('pages.exam.result.finalScore')}
                          </div>
                          <div
                            className={`mt-2 text-4xl font-semibold leading-none ${
                              result.is_passed === false
                                ? 'text-rose-700'
                                : 'text-slate-950'
                            }`}
                          >
                            {formatScoreValue(summary.earnedScore)}
                            <span className="ml-1 text-base font-medium text-slate-500">
                              / {formatScoreValue(summary.totalScore)}
                            </span>
                          </div>
                          <div className="mt-2 text-xs leading-5 text-slate-500">
                            {t('pages.exam.result.passingLine', {
                              score: formatScoreValue(result.passing_score),
                            })}
                          </div>
                        </div>

                        <div className="mt-5">
                          <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
                            <span>{t('pages.exam.result.scoreRate')}</span>
                            <span>{summary.scorePercent}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                            <div
                              className={getScoreBarClassName(
                                result.is_passed,
                              )}
                              style={{ width: `${summary.scorePercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-x-5 gap-y-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:grid-cols-3 sm:px-5">
                      <SummaryMetric
                        helper={t('pages.exam.result.submittedAt')}
                        label={t('pages.exam.result.submission')}
                        value={formatDateTime(result.submitted_at, t)}
                      />
                      <SummaryMetric
                        helper={t('pages.exam.result.timeUsed')}
                        label={t('pages.exam.result.duration')}
                        value={formatSeconds(result.time_used_seconds, t)}
                      />
                      <SummaryMetric
                        helper={t(
                          summary.earnedScore >= result.passing_score
                            ? 'pages.exam.result.passingLineReached'
                            : 'pages.exam.result.passingLineNeedsImprovement',
                        )}
                        label={t('pages.exam.result.judgement')}
                        strong={result.is_passed === false}
                        value={getPassLabel(result.is_passed, t)}
                      />
                    </div>
                  </section>

                  <ResultDetail questions={result.questions} />
                </>
              ) : null}
            </div>
            {result && summary ? (
              <WrongQuestionNavigator
                totalQuestions={summary.totalQuestions}
                wrongItems={wrongQuestions}
                t={t}
                onSelect={scrollToQuestion}
              />
            ) : null}
          </div>
        </div>
      </PageContainer>
    </div>
  )
}

interface WrongQuestionNavigatorProps {
  totalQuestions: number
  wrongItems: Array<{
    index: number
    question: TenantQuestionResult
  }>
  t: TFunction
  onSelect: (questionId: string) => void
}

function WrongQuestionNavigator({
  t,
  totalQuestions,
  wrongItems,
  onSelect,
}: WrongQuestionNavigatorProps) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-4 lg:self-start">
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_32px_rgb(15_23_42/0.06)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="m-0 text-base font-semibold text-slate-950">
              {t('pages.exam.result.wrongNavigator')}
            </h3>
            <p className="m-0 mt-1 text-xs text-slate-500">
              {t('pages.exam.result.wrongNavigatorSubtitle', {
                wrong: wrongItems.length,
                total: totalQuestions,
              })}
            </p>
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <FlagOutlined />
          </span>
        </div>

        {wrongItems.length > 0 ? (
          <div className="flex max-h-[calc(100dvh-180px)] flex-col gap-1 overflow-y-auto pr-1">
            {wrongItems.map(({ index, question }) => (
              <button
                className="group flex w-full cursor-pointer items-start gap-2 rounded-xl border border-transparent bg-white px-2.5 py-2 text-left transition-colors duration-200 hover:border-slate-200 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                key={question.question_id}
                type="button"
                onClick={() => onSelect(question.question_id)}
              >
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-rose-50 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {question.text}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span>{formatQuestionType(question.type, t)}</span>
                    {question.difficulty ? (
                      <span>{formatDifficulty(question.difficulty, t)}</span>
                    ) : null}
                    <span>
                      {t('pages.exam.score.withTotal', {
                        score: formatScoreValue(question.earned_score),
                        total: formatScoreValue(question.score),
                      })}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600">
            {t('pages.exam.result.noWrongQuestions')}
          </div>
        )}
      </section>
    </aside>
  )
}

interface SummaryMetricProps {
  helper: string
  label: string
  strong?: boolean
  value: string
}

function SummaryMetric({
  helper,
  label,
  strong = false,
  value,
}: SummaryMetricProps) {
  return (
    <div className="min-w-0 border-l border-slate-200 pl-3 first:border-l-0 first:pl-0">
      <div className="text-[11px] font-medium leading-none text-slate-500">
        {label}
      </div>
      <div
        className={`mt-1 text-base font-semibold leading-none ${
          strong ? 'text-rose-700' : 'text-slate-950'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] leading-4 text-slate-500">{helper}</div>
    </div>
  )
}

function formatDateTime(value: string | null, t: TFunction) {
  if (!value) return '-'

  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format(t('common.dateTime.longFormat'))
}

function formatSeconds(value: number | null, t: TFunction) {
  if (value === null) return '-'
  const normalizedValue = Math.max(0, value)
  const hours = Math.floor(normalizedValue / 3600)
  const minutes = Math.floor((normalizedValue % 3600) / 60)
  const seconds = normalizedValue % 60

  if (hours > 0) {
    return t('pages.exam.duration.hms', { hours, minutes, seconds })
  }
  if (minutes > 0) return t('pages.exam.duration.ms', { minutes, seconds })

  return t('pages.exam.duration.seconds', { seconds })
}

function formatScoreValue(value: number | null | undefined) {
  if (typeof value !== 'number') return '-'

  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatQuestionType(type: TenantQuestionResult['type'], t: TFunction) {
  return t(`pages.exam.questionType.${type}`)
}

function formatDifficulty(value: TenantQuestionResult['difficulty'], t: TFunction) {
  if (!value) return ''

  return t(`pages.exam.difficulty.${value}`)
}

function getQuestionAnchorId(questionId: string) {
  return `question-${questionId}`
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value))
}

function getPassLabel(value: boolean | null, t: TFunction) {
  if (value === null) return t('pages.exam.pass.pending')

  return value ? t('pages.exam.pass.passed') : t('pages.exam.pass.failed')
}

function getScoreBarClassName(isPassed: boolean | null) {
  const baseClassName = 'h-full rounded-full transition-[width] duration-300'

  if (isPassed === false) return `${baseClassName} bg-rose-600`
  if (isPassed === null) return `${baseClassName} bg-slate-500`

  return `${baseClassName} bg-emerald-600`
}

function getResultInsight(
  isPassed: boolean | null,
  score: number,
  passingScore: number,
  t: TFunction,
) {
  if (isPassed === null) return t('pages.exam.result.insightPending')

  const distance = Math.abs(score - passingScore)
  const formattedDistance = formatScoreValue(distance)

  if (isPassed) {
    return t('pages.exam.result.insightPassed', {
      distance: formattedDistance,
    })
  }

  return t('pages.exam.result.insightFailed', {
    distance: formattedDistance,
  })
}

export default ExamResult
