import {
  ArrowLeftOutlined,
  BarChartOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ImportOutlined,
  PlusOutlined,
  ProfileOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { Alert, Button, Descriptions, Drawer, Menu, Pagination, Space, Spin, Statistic, Tag, Typography } from 'antd'
import { createStyles } from 'antd-style'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import {
  adminExamAttempts_get,
  adminExamAttempts_list,
  adminExamKeys,
  adminExamQuestions_create,
  adminExamQuestions_import,
  adminExamQuestions_delete,
  adminExamQuestions_update,
  adminExamQuestionStats_list,
  adminExams_get,
  type AdminExamAttemptDetail,
  type AdminExamQuestion,
  type AdminExamQuestionUpdateBody,
  type AdminQuestionAccuracyStat,
} from '@/api/exam'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { globalMessage } from '@/utils/message'
import { PageContainer, PageHeader, TableScrollYWrapper } from '@ff-ai-frontend/components'

import { AttemptHistory } from './components/AttemptHistory'
import { AttemptResultModal } from './components/AttemptResultModal'
import { ImportModal } from './components/ImportModal'
import { QuestionForm } from './components/QuestionForm'
import { QuestionList } from './components/QuestionList'
import { QuestionStats } from './components/QuestionStats'
import type { QuestionDrawerMode, QuestionFormValues } from './types'
import { toQuestionBody, toQuestionUpdateBody } from './types'

type ExamDetailSection = 'info' | 'questions' | 'attempts' | 'stats'

const menuCountClassName =
  'inline-flex h-5 min-w-6 items-center justify-center rounded-full border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) text-[12px] font-[650] leading-[18px] text-(--muted) tabular-nums'

const useExamDetailAntdStyles = createStyles(({ css }) => ({
  detailMenu: css`
    min-width: 0;
    border-inline-end: 0 !important;
    background: transparent !important;

    .ant-menu-item {
      height: 40px;
      margin: 0 0 4px;
      border-radius: 7px;
      color: var(--muted);
      font-weight: 600;
    }

    .ant-menu-item-selected {
      background: color-mix(in srgb, var(--admin-primary) 10%, transparent) !important;
      color: var(--text-strong) !important;
    }

    .ant-menu-item::after {
      display: none;
    }

    @media (max-width: 860px) {
      display: flex;
      overflow-x: auto;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }

      .ant-menu-item {
        flex: 0 0 auto;
        width: auto;
        min-width: max-content;
        margin: 0 6px 0 0;
        padding-inline: 12px !important;
      }
    }
  `,
  metricStatistic: css`
    .ant-statistic-title {
      margin-bottom: 4px;
      color: var(--muted);
      font-size: 12px;
      line-height: 18px;
    }

    .ant-statistic-content {
      color: var(--text-strong);
      font-weight: 680;
      letter-spacing: 0;
      font-variant-numeric: tabular-nums;
    }
  `,
  detailDescriptions: css`
    .ant-descriptions-view {
      overflow: hidden;
    }

    .ant-descriptions-row > th,
    .ant-descriptions-row > td {
      padding-bottom: 10px;
    }

    .ant-descriptions-item-label {
      min-width: 96px;
      color: var(--muted);
      font-size: 13px;
      line-height: 20px;
    }

    .ant-descriptions-item-content {
      min-width: 0;
      color: var(--text-strong);
      font-size: 13px;
      line-height: 20px;
    }
  `,
}))

export function ExamDetail() {
  const { paperId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { styles: antdStyles } = useExamDetailAntdStyles()
  const queryClient = useQueryClient()
  const pagination = usePaginationParams({ defaultPageSize: 10 })
  const [questionDrawer, setQuestionDrawer] = useState<{
    mode: QuestionDrawerMode
    question?: AdminExamQuestion
  }>()
  const [importOpen, setImportOpen] = useState(false)
  const [attemptDetail, setAttemptDetail] = useState<AdminExamAttemptDetail>()
  const [activeSection, setActiveSection] = useState<ExamDetailSection>('questions')

  const attemptsQueryParams = useMemo(() => pagination.query, [pagination.query])

  const detailQuery = useQuery({
    queryKey: adminExamKeys.detail(paperId ?? ''),
    queryFn: () => adminExams_get(paperId!),
    enabled: Boolean(paperId),
  })

  const attemptsQuery = useQuery({
    queryKey: adminExamKeys.attempts(paperId ?? '', attemptsQueryParams),
    queryFn: () => adminExamAttempts_list(paperId!, attemptsQueryParams),
    enabled: Boolean(paperId),
  })

  const questionStatsQuery = useQuery({
    queryKey: adminExamKeys.questionStats(paperId ?? ''),
    queryFn: () => adminExamQuestionStats_list(paperId!),
    enabled: Boolean(paperId),
    retry: false,
  })

  const invalidateDetail = () => {
    if (!paperId) return
    void queryClient.invalidateQueries({ queryKey: adminExamKeys.detail(paperId) })
    void queryClient.invalidateQueries({ queryKey: adminExamKeys.lists() })
  }

  const createQuestionMutation = useMutation({
    mutationFn: (data: QuestionFormValues) => adminExamQuestions_create(paperId!, toQuestionBody(data)),
    onSuccess: () => {
      globalMessage.success(t('pages.examManagement.messages.questionCreated'))
      setQuestionDrawer(undefined)
      invalidateDetail()
      void queryClient.invalidateQueries({ queryKey: adminExamKeys.questionStats(paperId!) })
    },
  })

  const updateQuestionMutation = useMutation({
    mutationFn: ({ data, questionId }: { questionId: string; data: AdminExamQuestionUpdateBody }) =>
      adminExamQuestions_update(paperId!, questionId, data),
    onSuccess: () => {
      globalMessage.success(t('pages.examManagement.messages.questionUpdated'))
      setQuestionDrawer(undefined)
      invalidateDetail()
      void queryClient.invalidateQueries({ queryKey: adminExamKeys.questionStats(paperId!) })
    },
  })

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => adminExamQuestions_delete(paperId!, questionId),
    onSuccess: () => {
      globalMessage.success(t('pages.examManagement.messages.questionDeleted'))
      invalidateDetail()
      void queryClient.invalidateQueries({ queryKey: adminExamKeys.questionStats(paperId!) })
    },
  })

  const importMutation = useMutation({
    mutationFn: (body: Parameters<typeof adminExamQuestions_import>[1]) =>
      adminExamQuestions_import(paperId!, body),
    onSuccess: () => {
      globalMessage.success(t('pages.examManagement.messages.questionsImported'))
      setImportOpen(false)
      invalidateDetail()
      void queryClient.invalidateQueries({ queryKey: adminExamKeys.questionStats(paperId!) })
    },
  })

  const attemptDetailMutation = useMutation({
    mutationFn: adminExamAttempts_get,
    onSuccess: setAttemptDetail,
  })

  const handleQuestionSubmit = (values: QuestionFormValues) => {
    if (questionDrawer?.mode === 'edit' && questionDrawer.question) {
      updateQuestionMutation.mutate({
        questionId: questionDrawer.question.id,
        data: toQuestionUpdateBody(values),
      })
      return
    }

    createQuestionMutation.mutate(values)
  }

  const paper = detailQuery.data
  const questions = useMemo(() => paper?.questions ?? [], [paper?.questions])
  const totalScore = useMemo(
    () => questions.reduce((sum, question) => sum + question.score, 0),
    [questions],
  )
  const derivedQuestionStats = useMemo(
    () => buildQuestionStats(questions, attemptDetail ? [attemptDetail] : []),
    [attemptDetail, questions],
  )
  const questionStats = questionStatsQuery.data?.questions ?? derivedQuestionStats
  const activeSectionMeta = getSectionMeta(activeSection, t)

  if (!paperId) {
    return <Alert showIcon title={t('pages.examManagement.errors.missingPaperId')} type="error" />
  }

  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <PageHeader
        title={paper?.title ?? t('pages.examManagement.detail.titleFallback')}
        subtitle={t('pages.examManagement.detail.subtitle')}
      >
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => void navigate('/exams')}>
            {t('pages.examManagement.actions.backToList')}
          </Button>
          <Button icon={<ReloadOutlined />} loading={detailQuery.isFetching} onClick={() => void detailQuery.refetch()}>
            {t('common.actions.refresh')}
          </Button>
          <Button icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>
            {t('pages.examManagement.actions.importJson')}
          </Button>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setQuestionDrawer({ mode: 'create' })}>
            {t('pages.examManagement.actions.createQuestion')}
          </Button>
        </Space>
      </PageHeader>

      <PageContainer className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden bg-(--ant-color-bg-container) shadow-[0_1px_2px_rgb(15_23_42/4%)] [contain:paint]">
        {detailQuery.isError ? (
          <Alert showIcon className="m-5" title={t('pages.examManagement.errors.detailLoadFailed')} type="error" />
        ) : null}

        {detailQuery.isLoading ? (
          <div className="flex min-h-80 items-center justify-center">
            <Spin />
          </div>
        ) : paper ? (
          <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)] overflow-hidden max-[860px]:grid-cols-1 max-[860px]:grid-rows-[auto_minmax(0,1fr)]">
            <aside className="flex min-h-0 flex-col gap-3 border-r border-r-(--ant-color-border-secondary) bg-[color-mix(in_srgb,var(--ant-color-bg-layout)_46%,var(--ant-color-bg-container))] p-3.5 max-[860px]:border-r-0 max-[860px]:border-b max-[860px]:border-b-(--ant-color-border-secondary) max-[860px]:p-3">
              <div className="min-w-0 rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) p-3 max-[860px]:hidden">
                <Typography.Text className="block text-[12px]! leading-[18px] text-(--muted)!">
                  {t('pages.examManagement.detail.currentPaper')}
                </Typography.Text>
                <Typography.Text className="line-clamp-2 text-[14px]! leading-5 text-(--text-strong)!" strong>
                  {paper.title}
                </Typography.Text>
                <Tag className="mt-2 w-fit" color={paper.is_published ? 'green' : 'default'}>
                  {paper.is_published
                    ? t('pages.examManagement.publishStatus.published')
                    : t('pages.examManagement.publishStatus.draft')}
                </Tag>
              </div>
              <Menu
                className={antdStyles.detailMenu}
                items={[
                  {
                    icon: <ProfileOutlined />,
                    key: 'info',
	                    label: (
	                      <span className="flex min-w-0 items-center justify-between gap-2">
	                        <span>{t('pages.examManagement.sections.info.title')}</span>
	                      </span>
	                    ),
                  },
                  {
                    icon: <FileTextOutlined />,
                    key: 'questions',
	                    label: (
	                      <span className="flex min-w-0 items-center justify-between gap-2">
	                        <span>{t('pages.examManagement.sections.questions.title')}</span>
	                        <span className={menuCountClassName}>{questions.length}</span>
	                      </span>
                    ),
                  },
                  {
                    icon: <HistoryOutlined />,
                    key: 'attempts',
	                    label: (
	                      <span className="flex min-w-0 items-center justify-between gap-2">
	                        <span>{t('pages.examManagement.sections.attempts.title')}</span>
	                        <span className={menuCountClassName}>{attemptsQuery.data?.count ?? 0}</span>
	                      </span>
                    ),
                  },
                  {
                    icon: <BarChartOutlined />,
                    key: 'stats',
	                    label: (
	                      <span className="flex min-w-0 items-center justify-between gap-2">
	                        <span>{t('pages.examManagement.sections.stats.title')}</span>
	                      </span>
	                    ),
                  },
                ]}
                mode="inline"
                selectedKeys={[activeSection]}
                onClick={({ key }) => setActiveSection(key as ExamDetailSection)}
              />
            </aside>

            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
              <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-b-(--ant-color-border-secondary) px-4.5 py-3">
                <div className="min-w-0">
                  <Typography.Title className="mb-1! text-lg!" level={2}>
                    {activeSectionMeta.title}
                  </Typography.Title>
                  <Typography.Text className="text-(--muted)!">
                    {activeSectionMeta.description}
                  </Typography.Text>
                </div>
                {activeSection === 'info' ? (
                  <Tag color={paper.is_published ? 'green' : 'default'}>
                    {paper.is_published
                      ? t('pages.examManagement.publishStatus.published')
                      : t('pages.examManagement.publishStatus.draft')}
                  </Tag>
                ) : null}
                {activeSection === 'questions' ? (
                  <Typography.Text className="tabular-nums text-(--muted)!">
                    {t('pages.examManagement.labels.questionCount', {
                      total: questions.length,
                    })}
                  </Typography.Text>
                ) : null}
                {activeSection === 'attempts' ? (
                  <Typography.Text className="tabular-nums text-(--muted)!">
                    {t('common.labels.totalCount', {
                      total: attemptsQuery.data?.count ?? 0,
                    })}
                  </Typography.Text>
                ) : null}
                {activeSection === 'stats' ? (
                  <Typography.Text className="tabular-nums text-(--muted)!">
                    {t('pages.examManagement.labels.questionCount', {
                      total: questionStats.length,
                    })}
                  </Typography.Text>
                ) : null}
              </div>

              {activeSection === 'info' ? (
                <div className="min-h-0 overflow-auto p-4.5">
                  <div className="grid grid-cols-4 gap-3 max-[1180px]:grid-cols-2 max-[560px]:grid-cols-1">
                    <div className="min-w-0 rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) p-3.5">
                      <Statistic className={antdStyles.metricStatistic} title={t('pages.examManagement.metrics.questionCount')} value={questions.length} />
                    </div>
                    <div className="min-w-0 rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) p-3.5">
                      <Statistic className={antdStyles.metricStatistic} title={t('pages.examManagement.metrics.totalScore')} value={totalScore} suffix={t('pages.examManagement.units.points')} />
                    </div>
                    <div className="min-w-0 rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) p-3.5">
                      <Statistic className={antdStyles.metricStatistic} title={t('pages.examManagement.metrics.passingScore')} value={paper.passing_score} suffix={t('pages.examManagement.units.points')} />
                    </div>
                    <div className="min-w-0 rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) p-3.5">
                      <Statistic
                        className={antdStyles.metricStatistic}
                        title={t('pages.examManagement.metrics.duration')}
                        value={paper.time_limit_minutes ?? t('pages.examManagement.time.unlimited')}
                        suffix={paper.time_limit_minutes ? t('pages.examManagement.units.minutes') : ''}
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)] gap-3 max-[960px]:grid-cols-1">
                    <div className="min-w-0 rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) p-3.5">
                      <Typography.Text className="mb-3 block text-[14px]! font-[650] leading-5 text-(--text-strong)!">
                        {t('pages.examManagement.detail.ruleSettings')}
                      </Typography.Text>
                      <Descriptions className={antdStyles.detailDescriptions} column={1} size="small">
                        <Descriptions.Item label={t('pages.examManagement.columns.status')}>
                          <Tag color={paper.is_published ? 'green' : 'default'}>
                            {paper.is_published
                              ? t('pages.examManagement.publishStatus.published')
                              : t('pages.examManagement.publishStatus.draft')}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('pages.examManagement.columns.mode')}>
                          {paper.mode === 'random'
                            ? t('pages.examManagement.mode.randomWithCount', {
                              count: paper.random_count ?? '-',
                            })
                            : t('pages.examManagement.mode.fixed')}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('pages.examManagement.columns.allowedUsers')}>
                          {paper.allowed_user_ids?.length
                            ? t('pages.examManagement.labels.userCount', {
                              total: paper.allowed_user_ids.length,
                            })
                            : t('pages.examManagement.labels.defaultScope')}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('pages.examManagement.columns.maxAttempts')}>
                          {paper.max_attempts_per_user ?? t('pages.examManagement.attemptLimit.unlimited')}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    <div className="min-w-0 rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) p-3.5">
                      <Typography.Text className="mb-3 block text-[14px]! font-[650] leading-5 text-(--text-strong)!">
                        {t('pages.examManagement.detail.timeInfo')}
                      </Typography.Text>
                      <Descriptions className={antdStyles.detailDescriptions} column={1} size="small">
                        <Descriptions.Item label={t('pages.examManagement.columns.createdAt')}>
                          {formatDateTime(paper.created_at, t)}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('pages.examManagement.columns.updatedAt')}>
                          {formatDateTime(paper.updated_at, t)}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>
                  </div>

                  <div className="mt-3 min-w-0 rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) p-3.5">
                    <Typography.Text className="mb-3 block text-[14px]! font-[650] leading-5 text-(--text-strong)!">
                      {t('pages.examManagement.columns.description')}
                    </Typography.Text>
                    <Typography.Paragraph className="mb-0! text-(--text)!">
                      {paper.description ?? t('pages.examManagement.empty.description')}
                    </Typography.Paragraph>
                  </div>
                </div>
              ) : null}

              {activeSection === 'questions' ? (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4.5 pt-3">
                  <TableScrollYWrapper className="min-h-0 flex-1" refreshKey={`${questions.length}:${detailQuery.isFetching}`}>
                    {({ scrollY }) => (
                      <QuestionList
                        data={questions}
                        deletingId={deleteQuestionMutation.variables}
                        loading={detailQuery.isFetching}
                        scrollY={scrollY}
                        onDelete={(questionId) => deleteQuestionMutation.mutate(questionId)}
                        onEdit={(question) => setQuestionDrawer({ mode: 'edit', question })}
                      />
                    )}
                  </TableScrollYWrapper>
                </div>
              ) : null}

              {activeSection === 'attempts' ? (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4.5 pt-3">
                  <TableScrollYWrapper className="min-h-0 flex-1" refreshKey={`${attemptsQuery.data?.data.length ?? 0}:${attemptsQuery.isFetching}`}>
                    {({ scrollY }) => (
                      <AttemptHistory
                        data={attemptsQuery.data?.data ?? []}
                        loading={attemptsQuery.isFetching || attemptDetailMutation.isPending}
                        scrollY={scrollY}
                        onOpenDetail={(attemptId) => attemptDetailMutation.mutate(attemptId)}
                      />
                    )}
                  </TableScrollYWrapper>
                  <div className="flex shrink-0 items-center justify-between border-t border-t-(--ant-color-border-secondary) py-3">
                    <Typography.Text type="secondary">
                      {t('common.labels.totalCount', { total: attemptsQuery.data?.count ?? 0 })}
                    </Typography.Text>
                    <Pagination {...pagination.props} total={attemptsQuery.data?.count ?? 0} />
                  </div>
                </div>
              ) : null}

              {activeSection === 'stats' ? (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4.5 pt-3">
                  {questionStatsQuery.isError ? (
                    <Alert
                      showIcon
                      className="mb-3 shrink-0"
                      title={t('pages.examManagement.errors.statsFallback')}
                      type="info"
                    />
                  ) : null}
                  <TableScrollYWrapper className="min-h-0 flex-1" refreshKey={`${questionStats.length}:${questionStatsQuery.isFetching}`}>
                    {({ scrollY }) => (
                      <QuestionStats
                        data={questionStats}
                        loading={questionStatsQuery.isFetching}
                        scrollY={scrollY}
                      />
                    )}
                  </TableScrollYWrapper>
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </PageContainer>

      <Drawer
        destroyOnHidden
        open={Boolean(questionDrawer)}
        size={1040}
        title={questionDrawer?.mode === 'edit'
          ? t('pages.examManagement.actions.editQuestion')
          : t('pages.examManagement.actions.createQuestion')}
        extra={
          <Space>
            <Button onClick={() => setQuestionDrawer(undefined)}>{t('common.actions.cancel')}</Button>
            <Button
              form="admin-question-form"
              htmlType="submit"
              loading={createQuestionMutation.isPending || updateQuestionMutation.isPending}
              type="primary"
            >
              {t('common.actions.save')}
            </Button>
          </Space>
        }
        styles={{
          body: {
            background: 'var(--ant-color-bg-layout)',
            padding: 16,
          },
        }}
        onClose={() => setQuestionDrawer(undefined)}
      >
        <QuestionForm initialValues={questionDrawer?.question} onSubmit={handleQuestionSubmit} />
      </Drawer>

      <ImportModal
        loading={importMutation.isPending}
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        onSubmit={(body) => importMutation.mutate(body)}
      />

      <AttemptResultModal
        attempt={attemptDetail}
        onClose={() => setAttemptDetail(undefined)}
      />
    </div>
  )
}

function getSectionMeta(section: ExamDetailSection, t: TFunction) {
  return {
    description: t(`pages.examManagement.sections.${section}.description`),
    title: t(`pages.examManagement.sections.${section}.title`),
  }
}

function formatDateTime(value: string | null, t: TFunction) {
  if (!value) return '-'

  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format(t('common.dateTime.longFormat'))
}

function buildQuestionStats(
  questions: AdminExamQuestion[],
  attempts: AdminExamAttemptDetail[],
): AdminQuestionAccuracyStat[] {
  const resultMap = new Map<string, { correct: number; total: number }>()

  attempts.forEach((attempt) => {
    attempt.questions.forEach((question) => {
      const current = resultMap.get(question.question_id) ?? { correct: 0, total: 0 }
      current.total += 1
      if (question.is_correct) current.correct += 1
      resultMap.set(question.question_id, current)
    })
  })

  return questions.map((question) => {
    const result = resultMap.get(question.id) ?? { correct: 0, total: 0 }

    return {
      question_id: question.id,
      text: question.text,
      type: question.type,
      difficulty: question.difficulty,
      order: question.order,
      attempt_count: result.total,
      correct_count: result.correct,
      accuracy_rate: result.total ? result.correct / result.total : 0,
    }
  })
}

export default ExamDetail
