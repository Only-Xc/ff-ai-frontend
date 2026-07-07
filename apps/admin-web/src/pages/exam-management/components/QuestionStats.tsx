import { Progress, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import type { AdminQuestionAccuracyStat, QuestionDifficulty, QuestionType } from '@/api/exam'

interface QuestionStatsProps {
  data: AdminQuestionAccuracyStat[]
  loading?: boolean
  scrollY?: number
}

export function QuestionStats({
  data,
  loading,
  scrollY,
}: QuestionStatsProps) {
  const { t } = useTranslation()
  const columns: TableProps<AdminQuestionAccuracyStat>['columns'] = [
    {
      title: t('pages.examManagement.columns.order'),
      dataIndex: 'order',
      width: 80,
    },
    {
      title: t('pages.examManagement.columns.questionType'),
      dataIndex: 'type',
      width: 90,
      render: (value: QuestionType) => <Tag>{formatQuestionType(value, t)}</Tag>,
    },
    {
      title: t('pages.examManagement.columns.difficulty'),
      dataIndex: 'difficulty',
      width: 90,
      render: (value: QuestionDifficulty | null | undefined) =>
        value ? <Tag color={getDifficultyColor(value)}>{formatDifficulty(value, t)}</Tag> : '-',
    },
    {
      title: t('pages.examManagement.columns.questionText'),
      dataIndex: 'text',
      ellipsis: true,
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: t('pages.examManagement.columns.attemptCount'),
      dataIndex: 'attempt_count',
      width: 110,
    },
    {
      title: t('pages.examManagement.columns.correctCount'),
      dataIndex: 'correct_count',
      width: 110,
    },
    {
      title: t('pages.examManagement.columns.accuracyRate'),
      dataIndex: 'accuracy_rate',
      width: 180,
      render: (value: number) => {
        const percent = normalizePercent(value)

        return <Progress percent={percent} size="small" />
      },
    },
  ]

  return (
    <Table<AdminQuestionAccuracyStat>
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      rowKey="question_id"
      scroll={{ x: 980, y: scrollY }}
    />
  )
}

function normalizePercent(value: number) {
  if (value <= 1) return Math.round(value * 100)

  return Math.round(value)
}

function getDifficultyColor(value: QuestionDifficulty) {
  if (value === 'easy') return 'green'
  if (value === 'hard') return 'red'

  return 'blue'
}

function formatQuestionType(type: QuestionType, t: TFunction) {
  return t(`pages.examManagement.questionType.${type}`)
}

function formatDifficulty(value: QuestionDifficulty, t: TFunction) {
  return t(`pages.examManagement.difficulty.${value}`)
}
