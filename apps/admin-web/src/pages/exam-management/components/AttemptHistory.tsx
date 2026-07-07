import { Button, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import type { AdminExamAttemptSummary, AttemptStatus } from '@/api/exam'

interface AttemptHistoryProps {
  data: AdminExamAttemptSummary[]
  loading?: boolean
  scrollY?: number
  onOpenDetail: (attemptId: string) => void
}

export function AttemptHistory({
  data,
  loading,
  scrollY,
  onOpenDetail,
}: AttemptHistoryProps) {
  const { t } = useTranslation()
  const columns: TableProps<AdminExamAttemptSummary>['columns'] = [
    {
      title: t('pages.examManagement.columns.user'),
      dataIndex: 'user_email',
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text strong>
            {record.user_name ?? record.user_email ?? record.user_id}
          </Typography.Text>
          <Typography.Text copyable type="secondary">
            {record.user_id}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('pages.examManagement.columns.paper'),
      dataIndex: 'paper_title',
      ellipsis: true,
      render: (value: string | null | undefined, record) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text>{value ?? record.paper_id}</Typography.Text>
          <Typography.Text copyable type="secondary">
            {record.paper_id}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('pages.examManagement.columns.status'),
      dataIndex: 'status',
      width: 120,
      render: (value: AdminExamAttemptSummary['status']) => (
        <Tag color={value === 'submitted' ? 'green' : 'blue'}>
          {formatAttemptStatus(value, t)}
        </Tag>
      ),
    },
    {
      title: t('pages.examManagement.columns.score'),
      dataIndex: 'score',
      width: 120,
      render: (_, record) => formatScore(record.score, record.total_score),
    },
    {
      title: t('pages.examManagement.columns.pass'),
      dataIndex: 'is_passed',
      width: 100,
      render: (value: boolean | null) => {
        if (value === null) return '-'
        return <Tag color={value ? 'green' : 'red'}>{formatPassStatus(value, t)}</Tag>
      },
    },
    {
      title: t('pages.examManagement.columns.startedAt'),
      dataIndex: 'started_at',
      width: 180,
      render: (value: string | null) => formatDateTime(value, t),
    },
    {
      title: t('pages.examManagement.columns.submittedAt'),
      dataIndex: 'submitted_at',
      width: 180,
      render: (value: string | null) => formatDateTime(value, t),
    },
    {
      title: t('pages.examManagement.columns.action'),
      key: 'action',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button type="link" onClick={() => onOpenDetail(record.id)}>
          {t('common.actions.detail')}
        </Button>
      ),
    },
  ]

  return (
    <Table<AdminExamAttemptSummary>
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      rowKey="id"
      scroll={{ x: 1160, y: scrollY }}
    />
  )
}

function formatScore(score: number | null, total: number | null) {
  if (score === null || total === null) return '-'

  return `${score} / ${total}`
}

function formatDateTime(value: string | null, t: TFunction) {
  if (!value) return '-'

  const date = dayjs(value)

  if (!date.isValid()) return '-'

  return date.format(t('common.dateTime.longFormat'))
}

function formatAttemptStatus(status: AttemptStatus, t: TFunction) {
  return status === 'submitted'
    ? t('pages.examManagement.status.submitted')
    : t('pages.examManagement.status.inProgress')
}

function formatPassStatus(value: boolean, t: TFunction) {
  return value
    ? t('pages.examManagement.pass.passed')
    : t('pages.examManagement.pass.failed')
}
