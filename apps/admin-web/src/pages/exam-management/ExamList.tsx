import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { createStyles } from 'antd-style'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import {
  adminExamKeys,
  adminExams_create,
  adminExams_delete,
  adminExams_list,
  adminExams_publish,
  adminExams_unpublish,
  adminExams_update,
  type AdminExamListQuery,
  type AdminExamPaper,
  type AdminExamUpdateBody,
  type ExamMode,
} from '@/api/exam'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { globalMessage } from '@/utils/message'
import { PageContainer, PageHeader, TableScrollYWrapper } from '@ff-ai-frontend/components'

import { ExamForm } from './components/ExamForm'
import type { ExamDrawerMode, ExamFilterValues, ExamFormValues } from './types'
import { toExamCreateBody, toExamUpdateBody } from './types'

const useExamListAntdStyles = createStyles(({ css }) => ({
  toolbar: css`
    .ant-form-item {
      margin-bottom: 0;
    }
  `,
}))

export function ExamList() {
  const { styles: antdStyles } = useExamListAntdStyles()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<ExamFilterValues>()
  const pagination = usePaginationParams()
  const [filters, setFilters] = useState<ExamFilterValues>({})
  const [drawer, setDrawer] = useState<{
    mode: ExamDrawerMode
    exam?: AdminExamPaper
  }>()

  const listParams = useMemo<AdminExamListQuery>(
    () => ({
      ...filters,
      ...pagination.query,
      sort: 'created_at:desc',
    }),
    [filters, pagination.query],
  )

  const listQuery = useQuery({
    queryKey: adminExamKeys.list(listParams),
    queryFn: () => adminExams_list(listParams),
    placeholderData: keepPreviousData,
  })

  const closeDrawer = () => setDrawer(undefined)
  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: adminExamKeys.lists() })

  const createMutation = useMutation({
    mutationFn: adminExams_create,
    onSuccess: () => {
      globalMessage.success(t('pages.examManagement.messages.examCreated'))
      closeDrawer()
      pagination.reset()
      void invalidateList()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ data, paperId }: { paperId: string; data: AdminExamUpdateBody }) =>
      adminExams_update(paperId, data),
    onSuccess: () => {
      globalMessage.success(t('pages.examManagement.messages.examUpdated'))
      closeDrawer()
      void invalidateList()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminExams_delete,
    onSuccess: () => {
      globalMessage.success(t('pages.examManagement.messages.examDeleted'))
      void invalidateList()
    },
  })

  const publishMutation = useMutation({
    mutationFn: adminExams_publish,
    onSuccess: () => {
      globalMessage.success(t('pages.examManagement.messages.examPublished'))
      void invalidateList()
    },
  })

  const unpublishMutation = useMutation({
    mutationFn: adminExams_unpublish,
    onSuccess: () => {
      globalMessage.success(t('pages.examManagement.messages.examUnpublished'))
      void invalidateList()
    },
  })

  const handleSubmit = (values: ExamFormValues) => {
    if (drawer?.mode === 'edit' && drawer.exam) {
      updateMutation.mutate({
        paperId: drawer.exam.id,
        data: toExamUpdateBody(values),
      })
      return
    }

    createMutation.mutate(toExamCreateBody(values))
  }

  const columns: TableProps<AdminExamPaper>['columns'] = [
    {
      title: t('pages.examManagement.columns.paper'),
      dataIndex: 'title',
      ellipsis: true,
      render: (value: string, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">
            {record.description ?? t('pages.examManagement.empty.description')}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('pages.examManagement.columns.status'),
      dataIndex: 'is_published',
      width: 100,
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'default'}>
          {value
            ? t('pages.examManagement.publishStatus.published')
            : t('pages.examManagement.publishStatus.draft')}
        </Tag>
      ),
    },
    {
      title: t('pages.examManagement.columns.mode'),
      dataIndex: 'mode',
      width: 110,
      render: (value: ExamMode, record) =>
        value === 'random'
          ? t('pages.examManagement.mode.randomWithCount', {
            count: record.random_count ?? '-',
          })
          : t('pages.examManagement.mode.fixed'),
    },
    {
      title: t('pages.examManagement.metrics.duration'),
      dataIndex: 'time_limit_minutes',
      width: 100,
      render: (value: number | null) =>
        value
          ? t('pages.examManagement.units.minutesWithValue', { value })
          : t('pages.examManagement.time.unlimited'),
    },
    {
      title: t('pages.examManagement.metrics.passingScore'),
      dataIndex: 'passing_score',
      width: 100,
      render: (value: number) =>
        t('pages.examManagement.units.pointsWithValue', { value }),
    },
    {
      title: t('pages.examManagement.metrics.questionCount'),
      dataIndex: 'question_count',
      width: 90,
      render: (value: number | undefined) => value ?? '-',
    },
    {
      title: t('pages.examManagement.columns.allowedUsers'),
      dataIndex: 'allowed_user_ids',
      width: 110,
      render: (value: string[] | null | undefined) =>
        value?.length
          ? t('pages.examManagement.labels.userCount', { total: value.length })
          : t('pages.examManagement.labels.defaultScope'),
    },
    {
      title: t('pages.examManagement.columns.maxAttempts'),
      dataIndex: 'max_attempts_per_user',
      width: 110,
      render: (value: number | null | undefined) =>
        value ?? t('pages.examManagement.attemptLimit.unlimited'),
    },
    {
      title: t('pages.examManagement.columns.createdAt'),
      dataIndex: 'created_at',
      width: 180,
      render: (value: string) => formatDateTime(value, t),
    },
    {
      title: t('pages.examManagement.columns.action'),
      key: 'action',
      fixed: 'right',
      width: 340,
      render: (_, record) => (
        <Space size={4}>
          <Button icon={<EyeOutlined />} type="link" onClick={() => void navigate(`/exams/${record.id}`)}>
            {t('common.actions.detail')}
          </Button>
          <Button icon={<EditOutlined />} type="link" onClick={() => setDrawer({ mode: 'edit', exam: record })}>
            {t('common.actions.edit')}
          </Button>
          {record.is_published ? (
            <Button loading={unpublishMutation.isPending} type="link" onClick={() => unpublishMutation.mutate(record.id)}>
              {t('pages.examManagement.actions.unpublish')}
            </Button>
          ) : (
            <Button loading={publishMutation.isPending} type="link" onClick={() => publishMutation.mutate(record.id)}>
              {t('pages.examManagement.actions.publish')}
            </Button>
          )}
          <Popconfirm
            title={t('pages.examManagement.exam.deleteTitle')}
            description={t('pages.examManagement.exam.deleteDescription')}
            okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
            okText={t('common.actions.delete')}
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} type="link">
              {t('common.actions.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <PageHeader
        title={t('pages.examManagement.list.title')}
        subtitle={t('pages.examManagement.list.subtitle')}
      >
        <Space wrap>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => setDrawer({ mode: 'create' })}>
            {t('pages.examManagement.actions.createExam')}
          </Button>
        </Space>
      </PageHeader>

      <PageContainer className="flex min-h-0 flex-1 flex-col overflow-hidden bg-(--ant-color-bg-container) shadow-[0_1px_2px_rgb(15_23_42/4%)] [contain:paint]">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-b-(--ant-color-border-secondary) px-5 py-3">
          <Form<ExamFilterValues>
            className={`${antdStyles.toolbar} flex-1`}
            form={form}
            layout="inline"
            onFinish={(values) => {
              const title = values.title?.trim()

              setFilters({
                title: title ?? undefined,
                is_published: values.is_published,
              })
              pagination.reset()
            }}
          >
            <Form.Item name="title">
              <Input
                allowClear
                className="w-64"
                placeholder={t('pages.examManagement.filters.paperTitle')}
              />
            </Form.Item>
            <Form.Item name="is_published">
              <Select
                allowClear
                className="w-32"
                options={[
                  {
                    label: t('pages.examManagement.publishStatus.published'),
                    value: true,
                  },
                  {
                    label: t('pages.examManagement.publishStatus.draft'),
                    value: false,
                  },
                ]}
                placeholder={t('pages.examManagement.filters.status')}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button htmlType="submit" type="primary">{t('common.actions.search')}</Button>
                <Button
                  onClick={() => {
                    form.resetFields()
                    setFilters({})
                    pagination.reset()
                  }}
                >
                  {t('common.actions.reset')}
                </Button>
                <Button icon={<ReloadOutlined />} loading={listQuery.isFetching} onClick={() => void listQuery.refetch()}>
                  {t('common.actions.refresh')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>

        {listQuery.isError ? (
          <Alert
            showIcon
            className="mx-5 mt-4 shrink-0"
            message={t('pages.examManagement.errors.listLoadFailed')}
            type="error"
          />
        ) : null}

        <TableScrollYWrapper className="min-h-0 flex-1" refreshKey={`${listQuery.data?.data.length ?? 0}:${listQuery.isFetching}`}>
          <Table<AdminExamPaper>
            columns={columns}
            dataSource={listQuery.data?.data ?? []}
            loading={listQuery.isFetching}
            pagination={false}
            rowKey="id"
            scroll={{ x: 1460 }}
          />
        </TableScrollYWrapper>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-t-(--ant-color-border-secondary) px-5 py-3">
          <Typography.Text type="secondary">
            {t('common.labels.totalCount', { total: listQuery.data?.count ?? 0 })}
          </Typography.Text>
          <Pagination {...pagination.props} total={listQuery.data?.count ?? 0} />
        </div>
      </PageContainer>

      <Drawer
        destroyOnHidden
        open={Boolean(drawer)}
        title={drawer?.mode === 'edit'
          ? t('pages.examManagement.actions.editExam')
          : t('pages.examManagement.actions.createExam')}
        size={560}
        extra={
          <Space>
            <Button onClick={closeDrawer}>{t('common.actions.cancel')}</Button>
            <Button
              form="admin-exam-form"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              type="primary"
            >
              {t('common.actions.save')}
            </Button>
          </Space>
        }
        onClose={closeDrawer}
      >
        <ExamForm initialValues={drawer?.exam} onSubmit={handleSubmit} />
      </Drawer>
    </div>
  )
}

function formatDateTime(value: string, t: TFunction) {
  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format(t('common.dateTime.longFormat'))
}

export default ExamList
