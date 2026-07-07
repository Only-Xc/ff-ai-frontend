import { ImportOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  Pagination,
  Select,
  Space,
  Typography,
} from 'antd'
import { createStyles } from 'antd-style'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  adminExamKeys,
  adminExamQuestions_delete,
  adminExamQuestions_update,
  adminExams_list,
  adminQuestionBank_create,
  adminQuestionBank_import,
  adminQuestionBank_list,
  type AdminExamListQuery,
  type AdminExamQuestion,
  type AdminExamQuestionImportBody,
  type AdminExamQuestionUpdateBody,
  type AdminQuestionListQuery,
  type QuestionDifficulty,
  type QuestionType,
} from '@/api/exam'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { globalMessage } from '@/utils/message'
import {
  PageContainer,
  PageHeader,
  TableScrollYWrapper,
} from '@ff-ai-frontend/components'

import { ImportModal } from './components/ImportModal'
import { QuestionForm } from './components/QuestionForm'
import { QuestionList } from './components/QuestionList'
import type { QuestionDrawerMode, QuestionFormValues } from './types'
import { toQuestionBody, toQuestionUpdateBody } from './types'

const useQuestionManagementAntdStyles = createStyles(({ css }) => ({
  toolbar: css`
    .ant-form-item {
      margin-bottom: 0;
    }
  `,
}))

const examLinkListQuery = {
  skip: 0,
  limit: 100,
  sort: 'created_at:desc',
} satisfies AdminExamListQuery

export function QuestionManagement() {
  const { t } = useTranslation()
  const { styles: antdStyles } = useQuestionManagementAntdStyles()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<QuestionFilterValues>()
  const pagination = usePaginationParams()
  const [filters, setFilters] = useState<QuestionFilterValues>({})
  const [questionDrawer, setQuestionDrawer] = useState<{
    mode: QuestionDrawerMode
    question?: AdminExamQuestion
  }>()
  const [importOpen, setImportOpen] = useState(false)

  const questionBankQuery = useMemo<AdminQuestionListQuery>(
    () => ({
      ...filters,
      ...pagination.query,
      sort: 'created_at:desc',
    }),
    [filters, pagination.query],
  )

  const questionsQuery = useQuery({
    queryKey: adminExamKeys.questionBankList(questionBankQuery),
    queryFn: () => adminQuestionBank_list(questionBankQuery),
    placeholderData: keepPreviousData,
  })

  const examsQuery = useQuery({
    queryKey: adminExamKeys.list(examLinkListQuery),
    queryFn: () => adminExams_list(examLinkListQuery),
    placeholderData: keepPreviousData,
  })

  const questions = useMemo(
    () => questionsQuery.data?.data ?? [],
    [questionsQuery.data?.data],
  )

  const invalidateQuestionBank = () => {
    void queryClient.invalidateQueries({
      queryKey: adminExamKeys.questionBank(),
    })
    void queryClient.invalidateQueries({ queryKey: adminExamKeys.details() })
    void queryClient.invalidateQueries({ queryKey: adminExamKeys.lists() })
  }

  const createQuestionMutation = useMutation({
    mutationFn: (data: QuestionFormValues) =>
      adminQuestionBank_create(toQuestionBody(data)),
    onSuccess: () => {
      globalMessage.success(t('pages.examManagement.messages.questionCreated'))
      setQuestionDrawer(undefined)
      pagination.reset()
      invalidateQuestionBank()
    },
  })

  const updateQuestionMutation = useMutation({
    mutationFn: ({
      data,
      questionId,
    }: {
      questionId: string
      data: AdminExamQuestionUpdateBody
    }) => adminExamQuestions_update(questionId, data),
    onSuccess: () => {
      globalMessage.success(t('pages.examManagement.messages.questionUpdated'))
      setQuestionDrawer(undefined)
      invalidateQuestionBank()
    },
  })

  const deleteQuestionMutation = useMutation({
    mutationFn: adminExamQuestions_delete,
    onSuccess: () => {
      globalMessage.success(t('pages.examManagement.messages.questionDeleted'))
      invalidateQuestionBank()
    },
  })

  const importMutation = useMutation({
    mutationFn: (body: AdminExamQuestionImportBody) =>
      adminQuestionBank_import(body),
    onSuccess: () => {
      globalMessage.success(t('pages.examManagement.messages.questionsImported'))
      setImportOpen(false)
      pagination.reset()
      invalidateQuestionBank()
    },
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

  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <PageHeader
        title={t('pages.examManagement.questionBank.title')}
        subtitle={t('pages.examManagement.questionBank.subtitle')}
      >
        <Space wrap>
          <Button icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>
            {t('pages.examManagement.actions.importJson')}
          </Button>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => setQuestionDrawer({ mode: 'create' })}
          >
            {t('pages.examManagement.actions.createQuestion')}
          </Button>
        </Space>
      </PageHeader>

      <PageContainer className="flex min-h-0 flex-1 flex-col overflow-hidden bg-(--ant-color-bg-container) shadow-[0_1px_2px_rgb(15_23_42/4%)] [contain:paint]">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-b-(--ant-color-border-secondary) px-5 py-3">
          <Form<QuestionFilterValues>
            className={`${antdStyles.toolbar} flex-1`}
            form={form}
            layout="inline"
            onFinish={(values) => {
              const text = values.text?.trim()

              setFilters({
                text: text === '' ? undefined : text,
                type: values.type,
                difficulty: values.difficulty,
                paper_id: values.paper_id,
              })
              pagination.reset()
            }}
          >
            <Form.Item name="text">
              <Input
                allowClear
                className="w-64"
                placeholder={t('pages.examManagement.filters.questionText')}
              />
            </Form.Item>
            <Form.Item name="type">
              <Select<QuestionType>
                allowClear
                className="w-32"
                options={getQuestionTypeOptions(t)}
                placeholder={t('pages.examManagement.filters.questionType')}
              />
            </Form.Item>
            <Form.Item name="difficulty">
              <Select<QuestionDifficulty>
                allowClear
                className="w-32"
                options={getDifficultyOptions(t)}
                placeholder={t('pages.examManagement.filters.difficulty')}
              />
            </Form.Item>
            <Form.Item name="paper_id">
              <Select
                allowClear
                className="w-56"
                loading={examsQuery.isFetching}
                optionFilterProp="label"
                options={(examsQuery.data?.data ?? []).map((paper) => ({
                  label: paper.title,
                  value: paper.id,
                }))}
                placeholder={t('pages.examManagement.filters.linkedPaper')}
                showSearch
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button htmlType="submit" type="primary">
                  {t('common.actions.search')}
                </Button>
                <Button
                  onClick={() => {
                    form.resetFields()
                    setFilters({})
                    pagination.reset()
                  }}
                >
                  {t('common.actions.reset')}
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  loading={questionsQuery.isFetching}
                  onClick={() => void questionsQuery.refetch()}
                >
                  {t('common.actions.refresh')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>

        {questionsQuery.isError ? (
          <Alert
            showIcon
            className="mx-5 mt-4 shrink-0"
            title={t('pages.examManagement.errors.questionBankLoadFailed')}
            type="error"
          />
        ) : null}

        <TableScrollYWrapper
          className="min-h-0 flex-1"
          refreshKey={`${questions.length}:${questionsQuery.isFetching}`}
        >
          <QuestionList
            data={questions}
            deletingId={deleteQuestionMutation.variables}
            loading={questionsQuery.isFetching}
            onDelete={(questionId) => deleteQuestionMutation.mutate(questionId)}
            onEdit={(question) => setQuestionDrawer({ mode: 'edit', question })}
          />
        </TableScrollYWrapper>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-t-(--ant-color-border-secondary) px-5 py-3">
          <Typography.Text type="secondary">
            {t('pages.examManagement.labels.questionCount', {
              total: questionsQuery.data?.count ?? 0,
            })}
          </Typography.Text>
          <Pagination
            {...pagination.props}
            total={questionsQuery.data?.count ?? 0}
          />
        </div>
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
            <Button onClick={() => setQuestionDrawer(undefined)}>
              {t('common.actions.cancel')}
            </Button>
            <Button
              form="admin-question-form"
              htmlType="submit"
              loading={
                createQuestionMutation.isPending ||
                updateQuestionMutation.isPending
              }
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
        <QuestionForm
          initialValues={questionDrawer?.question}
          onSubmit={handleQuestionSubmit}
        />
      </Drawer>

      <ImportModal
        loading={importMutation.isPending}
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        onSubmit={(body) => importMutation.mutate(body)}
      />
    </div>
  )
}

interface QuestionFilterValues {
  text?: string
  type?: QuestionType
  difficulty?: QuestionDifficulty
  paper_id?: string
}

function getQuestionTypeOptions(t: ReturnType<typeof useTranslation>['t']) {
  return [
    { label: t('pages.examManagement.questionType.single'), value: 'single' },
    { label: t('pages.examManagement.questionType.multiple'), value: 'multiple' },
    { label: t('pages.examManagement.questionType.true_false'), value: 'true_false' },
  ] satisfies Array<{ label: string; value: QuestionType }>
}

function getDifficultyOptions(t: ReturnType<typeof useTranslation>['t']) {
  return [
    { label: t('pages.examManagement.difficulty.easy'), value: 'easy' },
    { label: t('pages.examManagement.difficulty.medium'), value: 'medium' },
    { label: t('pages.examManagement.difficulty.hard'), value: 'hard' },
  ] satisfies Array<{ label: string; value: QuestionDifficulty }>
}

export default QuestionManagement
