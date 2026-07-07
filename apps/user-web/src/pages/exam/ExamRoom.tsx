import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { Alert, Button, Modal, Space, Spin, Tag, Typography } from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { isRequestError } from '@ff-ai-frontend/utils'
import { useTranslation } from 'react-i18next'

import {
  tenantAttempts_get,
  tenantAttempts_saveAnswers,
  tenantAttempts_submit,
  tenantExamKeys,
  type TenantAttemptState,
  type TenantAttemptSubmitBody,
} from '@/api/exam'
import { globalMessage } from '@/utils/message'

import { CountdownTimer } from './components/CountdownTimer'
import { QuestionCard } from './components/QuestionCard'
import { QuestionNav } from './components/QuestionNav'
import { useExamStyles } from './styles'
import {
  answersToMap,
  mapToAnswers,
  marksFromAnswers,
  type AnswerMap,
  type ReviewMarkMap,
} from './types'

interface SaveAnswersVariables {
  attemptId: string
  body: TenantAttemptSubmitBody
  version: number
}

interface SubmitAttemptVariables {
  attemptId: string
  body: TenantAttemptSubmitBody
}

export function ExamRoom() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { styles } = useExamStyles()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [marks, setMarks] = useState<ReviewMarkMap>({})
  const [exitOpen, setExitOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const initializedRef = useRef(false)
  const attemptIdRef = useRef<string | null>(attemptId ?? null)
  const attemptRef = useRef<TenantAttemptState | null>(null)
  const answersRef = useRef<AnswerMap>({})
  const marksRef = useRef<ReviewMarkMap>({})
  const dirtyRef = useRef(false)
  const dirtyVersionRef = useRef(0)
  const submittingRef = useRef(false)
  const submittedRef = useRef(false)
  const allowLeaveRef = useRef(false)

  const attemptQuery = useQuery({
    queryKey: tenantExamKeys.attempt(attemptId ?? ''),
    queryFn: () => tenantAttempts_get(attemptId!),
    enabled: Boolean(attemptId),
    retry: (_failureCount, error) => !isAttemptAlreadySubmittedError(error),
  })

  const redirectToResult = useCallback((targetAttemptId: string) => {
    submittedRef.current = true
    submittingRef.current = true
    allowLeaveRef.current = true
    dirtyRef.current = false
    setHasUnsavedChanges(false)
    void queryClient.invalidateQueries({ queryKey: tenantExamKeys.attemptLists() })
    void navigate(`/attempts/${targetAttemptId}/result`, { replace: true })
  }, [navigate, queryClient])

  const saveMutation = useMutation({
    mutationFn: ({ attemptId: targetAttemptId, body }: SaveAnswersVariables) =>
      tenantAttempts_saveAnswers(targetAttemptId, body),
    onSuccess: (state, variables) => {
      if (variables.attemptId !== attemptIdRef.current) return

      if (state.status === 'submitted') {
        queryClient.setQueryData(tenantExamKeys.attempt(state.id), state)
        redirectToResult(state.id)
        return
      }

      if (submittingRef.current || submittedRef.current) return

      if (variables.version === dirtyVersionRef.current) {
        dirtyRef.current = false
        setHasUnsavedChanges(false)
      }

      queryClient.setQueryData(tenantExamKeys.attempt(state.id), state)
      void queryClient.invalidateQueries({ queryKey: tenantExamKeys.attemptLists() })
    },
    onError: (error, variables) => {
      if (isAttemptAlreadySubmittedError(error)) {
        redirectToResult(variables.attemptId)
        return
      }

      globalMessage.error(error instanceof Error ? error.message : t('pages.exam.errors.saveFailed'))
    },
  })

  const submitMutation = useMutation({
    mutationFn: ({ attemptId: targetAttemptId, body }: SubmitAttemptVariables) =>
      tenantAttempts_submit(targetAttemptId, body),
    onSuccess: (result, variables) => {
      if (variables.attemptId !== attemptIdRef.current) return

      queryClient.setQueryData(tenantExamKeys.attemptResult(result.id), result)
      redirectToResult(result.id)
    },
    onError: (error, variables) => {
      if (isAttemptAlreadySubmittedError(error)) {
        redirectToResult(variables.attemptId)
        return
      }

      if (variables.attemptId === attemptIdRef.current) {
        submittingRef.current = false
      }
      globalMessage.error(error instanceof Error ? error.message : t('pages.exam.errors.submitFailed'))
    },
  })
  const saveAnswers = saveMutation.mutate
  const submitAttempt = submitMutation.mutate

  const attempt = attemptQuery.data
  const questions = useMemo(() => attempt?.questions ?? [], [attempt?.questions])
  const currentQuestion = questions[currentIndex]
  const isSubmitting = submitMutation.isPending

  const buildSubmitBody = useCallback(
    (): TenantAttemptSubmitBody => ({
      answers: mapToAnswers(answersRef.current, marksRef.current),
    }),
    [],
  )

  const navItems = useMemo(
    () =>
      questions.map((question, index) => ({
        questionId: question.id,
        index,
        answered: Boolean(answers[question.id]?.length),
        marked: Boolean(marks[question.id]),
      })),
    [answers, marks, questions],
  )

  useEffect(() => {
    attemptIdRef.current = attemptId ?? null
    attemptRef.current = null
    answersRef.current = {}
    marksRef.current = {}
    initializedRef.current = false
    dirtyRef.current = false
    dirtyVersionRef.current = 0
    submittingRef.current = false
    submittedRef.current = false
    allowLeaveRef.current = false
    setCurrentIndex(0)
    setAnswers({})
    setMarks({})
    setExitOpen(false)
    setHasUnsavedChanges(false)
  }, [attemptId])

  useEffect(() => {
    if (!attempt) return

    attemptRef.current = attempt

    if (attempt.status === 'submitted') {
      redirectToResult(attempt.id)
      return
    }

    if (initializedRef.current && dirtyRef.current) return

    const nextAnswers = answersToMap(attempt.answers ?? [])
    const nextMarks = marksFromAnswers(attempt.answers ?? [])
    answersRef.current = nextAnswers
    marksRef.current = nextMarks
    dirtyRef.current = false
    setAnswers(nextAnswers)
    setMarks(nextMarks)
    setHasUnsavedChanges(false)
    initializedRef.current = true
  }, [attempt, redirectToResult])

  useEffect(() => {
    if (!attemptId || !isAttemptAlreadySubmittedError(attemptQuery.error)) return

    redirectToResult(attemptId)
  }, [attemptId, attemptQuery.error, redirectToResult])

  useEffect(() => {
    setCurrentIndex((index) => {
      if (questions.length === 0) return 0
      return Math.min(index, questions.length - 1)
    })
  }, [questions.length])

  const runSubmit = useCallback(() => {
    const targetAttemptId = attemptIdRef.current

    if (!targetAttemptId || submittingRef.current || submittedRef.current) return

    submittingRef.current = true
    submitAttempt({
      attemptId: targetAttemptId,
      body: buildSubmitBody(),
    })
  }, [buildSubmitBody, submitAttempt])

  const requestSubmit = useCallback((force = false) => {
    if (submittingRef.current || submittedRef.current) return

    if (force) {
      runSubmit()
      return
    }

    Modal.confirm({
      title: t('pages.exam.room.submitConfirmTitle'),
      content: t('pages.exam.room.submitConfirmContent'),
      okText: t('pages.exam.room.submit'),
      cancelText: t('pages.exam.room.continueAnswering'),
      onOk: runSubmit,
    })
  }, [runSubmit, t])

  const submit = () => {
    requestSubmit(false)
  }

  const saveNow = useCallback(() => {
    const targetAttemptId = attemptIdRef.current

    if (
      !targetAttemptId ||
      !attemptRef.current ||
      !dirtyRef.current ||
      submittedRef.current ||
      submittingRef.current
    ) {
      return
    }

    saveAnswers({
      attemptId: targetAttemptId,
      body: buildSubmitBody(),
      version: dirtyVersionRef.current,
    })
  }, [buildSubmitBody, saveAnswers])

  const updateAnswer = (questionId: string, selectedKeys: string[]) => {
    if (submittingRef.current || submittedRef.current) return

    const previousKeys = answersRef.current[questionId] ?? []
    if (areStringArraysEqual(previousKeys, selectedKeys)) return

    const nextAnswers = { ...answersRef.current, [questionId]: selectedKeys }
    answersRef.current = nextAnswers
    dirtyRef.current = true
    dirtyVersionRef.current += 1
    setHasUnsavedChanges(true)
    setAnswers(nextAnswers)
  }

  const toggleMark = () => {
    if (!currentQuestion) return
    if (submittingRef.current || submittedRef.current) return

    const next = { ...marksRef.current }

    if (next[currentQuestion.id]) {
      delete next[currentQuestion.id]
    } else {
      next[currentQuestion.id] = true
    }

    marksRef.current = next
    dirtyRef.current = true
    dirtyVersionRef.current += 1
    setHasUnsavedChanges(true)
    setMarks(next)
  }

  useEffect(() => {
    if (!attempt || submittedRef.current || !hasUnsavedChanges) return undefined

    const timer = window.setTimeout(() => {
      const targetAttemptId = attemptIdRef.current
      if (!targetAttemptId || !dirtyRef.current || submittingRef.current) return

      saveAnswers({
        attemptId: targetAttemptId,
        body: buildSubmitBody(),
        version: dirtyVersionRef.current,
      })
    }, 800)

    return () => window.clearTimeout(timer)
  }, [answers, attempt, buildSubmitBody, hasUnsavedChanges, marks, saveAnswers])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowLeaveRef.current || submittedRef.current) return

      saveNow()
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveNow])

  useEffect(() => {
    if (!attemptId) return undefined

    window.history.pushState({ examAttemptId: attemptId }, '', window.location.href)

    const handlePopState = () => {
      if (allowLeaveRef.current || submittedRef.current) return

      window.history.pushState({ examAttemptId: attemptId }, '', window.location.href)
      saveNow()
      setExitOpen(true)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [attemptId, saveNow])

  useEffect(() => {
    return () => {
      if (!allowLeaveRef.current && !submittedRef.current && dirtyRef.current) {
        saveNow()
      }
    }
  }, [saveNow])

  if (!attemptId) return <Alert showIcon message={t('pages.exam.errors.missingAttemptId')} type="error" />

  return (
    <div className={styles.examFocusShell}>
      <div className="box-border flex h-full min-h-0 w-full overflow-hidden bg-slate-100/80">
        <div className="mx-auto box-border flex h-full min-h-0 w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:px-5 lg:px-6">
          <section className="shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_44px_rgb(15_23_42/0.08)]">
            <div className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div className="min-w-0">
                <h1 className="m-0 truncate text-xl font-semibold leading-8 text-slate-950 sm:text-2xl">
                  {attempt?.paper_title ?? t('pages.exam.room.titleFallback')}
                </h1>
                <p className="m-0 mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {t('pages.exam.room.subtitle')}
                </p>
              </div>
              <Space className="flex! w-full justify-start lg:justify-end" wrap>
                {attempt ? (
                  <CountdownTimer
                    startedAt={attempt.started_at}
                    timeLimitMinutes={attempt.time_limit_minutes}
                    onExpire={() => requestSubmit(true)}
                  />
                ) : null}
                <Tag
                  className="m-0!"
                  color={saveMutation.isPending ? 'processing' : hasUnsavedChanges ? 'warning' : 'success'}
                >
                  {saveMutation.isPending
                    ? t('pages.exam.room.saving')
                    : hasUnsavedChanges
                      ? t('pages.exam.room.unsaved')
                      : t('pages.exam.room.saved')}
                </Tag>
                <Button
                  icon={<ReloadOutlined />}
                  loading={attemptQuery.isFetching}
                  onClick={() => void attemptQuery.refetch()}
                >
                  {t('common.actions.refresh')}
                </Button>
              </Space>
            </div>
          </section>

          <section className="flex min-h-0 flex-1 basis-0 flex-col overflow-visible">
            {attemptQuery.isError && !isAttemptAlreadySubmittedError(attemptQuery.error) ? (
              <Alert showIcon message={t('pages.exam.errors.attemptLoadFailed')} type="error" />
            ) : null}
            {attemptQuery.isLoading || isAttemptAlreadySubmittedError(attemptQuery.error) ? (
              <div
                aria-live="polite"
                className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgb(15_23_42/0.06)]"
              >
                <Spin />
              </div>
            ) : currentQuestion ? (
              <div className="grid min-h-0 flex-1 basis-0 grid-rows-[minmax(0,1fr)] items-stretch gap-4 overflow-visible lg:grid-cols-[272px_minmax(0,1fr)]">
                <QuestionNav
                  currentIndex={currentIndex}
                  items={navItems}
                  submitting={isSubmitting}
                  onSelect={setCurrentIndex}
                  onSubmit={submit}
                />
                <main className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-[0_18px_44px_rgb(15_23_42/0.08)]">
                  <QuestionCard
                    index={currentIndex}
                    marked={Boolean(marks[currentQuestion.id])}
                    question={currentQuestion}
                    total={questions.length}
                    value={answers[currentQuestion.id] ?? []}
                    onChange={(selectedKeys) => updateAnswer(currentQuestion.id, selectedKeys)}
                    onToggleMark={toggleMark}
                  />
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
                    <Button
                      disabled={currentIndex === 0 || isSubmitting}
                      icon={<ArrowLeftOutlined />}
                      onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                    >
                      {t('pages.exam.room.previousQuestion')}
                    </Button>
                    <span className="text-sm leading-6 text-slate-500">
                      {t('pages.exam.room.answeredCount', {
                        answered: navItems.filter((item) => item.answered).length,
                        total: questions.length,
                      })}
                    </span>
                    {currentIndex === questions.length - 1 ? (
                      <Button
                        icon={<CheckOutlined />}
                        loading={isSubmitting}
                        type="primary"
                        onClick={submit}
                      >
                        {t('pages.exam.room.submit')}
                      </Button>
                    ) : (
                      <Button
                        icon={<ArrowRightOutlined />}
                        disabled={isSubmitting}
                        type="primary"
                        onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
                      >
                        {t('pages.exam.room.nextQuestion')}
                      </Button>
                    )}
                  </div>
                </main>
              </div>
            ) : (
              <Alert showIcon message={t('pages.exam.errors.emptyAttemptQuestions')} type="warning" />
            )}
          </section>
        </div>
      </div>

      <Modal
        cancelButtonProps={{ style: { display: 'none' } }}
        okText={t('pages.exam.room.continueAnswering')}
        open={exitOpen}
        title={t('pages.exam.room.exitTitle')}
        onCancel={() => setExitOpen(false)}
        onOk={() => {
          saveNow()
          setExitOpen(false)
        }}
      >
        <Typography.Paragraph>
          {t('pages.exam.room.exitContent')}
        </Typography.Paragraph>
      </Modal>
    </div>
  )
}

export default ExamRoom

function areStringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false

  return left.every((value, index) => value === right[index])
}

function isAttemptAlreadySubmittedError(error: unknown) {
  if (!isRequestError(error)) return false

  return (
    error.message === ATTEMPT_ALREADY_SUBMITTED_MESSAGE ||
    readErrorDetail(error.data) === ATTEMPT_ALREADY_SUBMITTED_MESSAGE
  )
}

const ATTEMPT_ALREADY_SUBMITTED_MESSAGE = 'Attempt already submitted'

function readErrorDetail(data: unknown) {
  if (!data || typeof data !== 'object' || !('detail' in data)) return undefined

  const detail = data.detail
  return typeof detail === 'string' ? detail : undefined
}
