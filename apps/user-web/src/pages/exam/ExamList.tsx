import { FileTextOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Pagination, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'

import {
  tenantAttempts_create,
  tenantExamKeys,
  tenantExams_list,
  type TenantExamListQuery,
  type TenantExamMode,
  type TenantExamPaper,
} from '@/api/exam'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { globalMessage } from '@/utils/message'
import { PageContainer, PageHeader, TableScrollYWrapper } from '@ff-ai-frontend/components'

import { useExamStyles } from './styles'

export function ExamList() {
  const { styles } = useExamStyles()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const pagination = usePaginationParams()

  const listParams = useMemo<TenantExamListQuery>(
    () => ({ ...pagination.query, sort: 'created_at:desc' }),
    [pagination.query],
  )

  const listQuery = useQuery({
    queryKey: tenantExamKeys.list(listParams),
    queryFn: () => tenantExams_list(listParams),
    placeholderData: keepPreviousData,
  })

  const startMutation = useMutation({
    mutationFn: tenantAttempts_create,
    onSuccess: (attempt) => {
      void navigate(`/attempts/${attempt.id}`)
    },
    onError: (error) => {
      globalMessage.error(error instanceof Error ? error.message : t('pages.exam.errors.startFailed'))
    },
  })

  const columns: TableProps<TenantExamPaper>['columns'] = [
    {
      title: t('pages.exam.columns.paper'),
      dataIndex: 'title',
      ellipsis: true,
      render: (value: string, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">
            {record.description ?? t('pages.exam.empty.description')}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('pages.exam.columns.mode'),
      dataIndex: 'mode',
      width: 130,
      render: (value: TenantExamMode, record) =>
        value === 'random' ? (
          <Tag color="blue">
            {t('pages.exam.mode.randomWithCount', {
              count: record.random_count ?? '-',
            })}
          </Tag>
        ) : (
          <Tag>{t('pages.exam.mode.fixed')}</Tag>
        ),
    },
    {
      title: t('pages.exam.columns.duration'),
      dataIndex: 'time_limit_minutes',
      width: 120,
      render: (value: number | null) =>
        value
          ? t('pages.exam.units.minutes', { count: value })
          : t('pages.exam.time.unlimited'),
    },
    {
      title: t('pages.exam.columns.passingScore'),
      dataIndex: 'passing_score',
      width: 110,
      render: (value: number) => t('pages.exam.units.points', { count: value }),
    },
    {
      title: t('pages.exam.columns.questionCount'),
      dataIndex: 'question_count',
      width: 90,
      render: (value: number | undefined) => value ?? '-',
    },
    {
      title: t('pages.exam.columns.attemptLimit'),
      dataIndex: 'max_attempts_per_user',
      width: 120,
      render: (_, record) => formatAttemptLimit(record, t),
    },
    {
      title: t('pages.exam.columns.action'),
      key: 'action',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Button
          icon={<PlayCircleOutlined />}
          loading={startMutation.isPending && startMutation.variables === record.id}
          type="primary"
          onClick={() => startMutation.mutate(record.id)}
        >
          {t('pages.exam.actions.start')}
        </Button>
      ),
    },
  ]

  return (
    <div className={styles.pageShell}>
      <PageHeader
        title={t('pages.exam.list.title')}
        subtitle={t('pages.exam.list.subtitle')}
      >
        <Space>
          <Button icon={<FileTextOutlined />} onClick={() => void navigate('/attempts')}>
            {t('pages.exam.actions.attemptHistory')}
          </Button>
          <Button icon={<ReloadOutlined />} loading={listQuery.isFetching} onClick={() => void listQuery.refetch()}>
            {t('common.actions.refresh')}
          </Button>
        </Space>
      </PageHeader>

      <PageContainer className={styles.workSurface}>
        {listQuery.isError ? (
          <Alert showIcon className="m-5" message={t('pages.exam.errors.listLoadFailed')} type="error" />
        ) : null}
        <TableScrollYWrapper className="min-h-0 flex-1">
          <Table<TenantExamPaper>
            columns={columns}
            dataSource={listQuery.data?.data ?? []}
            loading={listQuery.isFetching}
            pagination={false}
            rowKey="id"
            scroll={{ x: 1020 }}
          />
        </TableScrollYWrapper>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-t-(--ant-color-border-secondary) px-5 py-3">
          <Typography.Text type="secondary">
            {t('common.labels.totalCount', { total: listQuery.data?.count ?? 0 })}
          </Typography.Text>
          <Pagination {...pagination.props} total={listQuery.data?.count ?? 0} />
        </div>
      </PageContainer>
    </div>
  )
}

function formatAttemptLimit(record: TenantExamPaper, t: ReturnType<typeof useTranslation>['t']) {
  if (typeof record.max_attempts_per_user === 'number') {
    return t('pages.exam.attemptLimit.max', {
      count: record.max_attempts_per_user,
    })
  }

  return t('pages.exam.attemptLimit.unlimited')
}

export default ExamList
