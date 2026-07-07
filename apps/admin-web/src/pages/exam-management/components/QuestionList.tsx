import { Button, Popconfirm, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import type {
  AdminExamQuestion,
  QuestionDifficulty,
  QuestionType,
} from '@/api/exam'

interface QuestionListProps {
  data: AdminExamQuestion[]
  loading?: boolean
  deletingId?: string
  deleteText?: string
  deleteTitle?: string
  deleteDescription?: string
  scrollY?: number
  onEdit: (question: AdminExamQuestion) => void
  onDelete: (questionId: string) => void
}

export function QuestionList({
  data,
  deleteDescription,
  deleteText,
  deleteTitle,
  deletingId,
  loading,
  scrollY,
  onDelete,
  onEdit,
}: QuestionListProps) {
  const { t } = useTranslation()
  const resolvedDeleteDescription =
    deleteDescription ?? t('pages.examManagement.questions.deleteDescription')
  const resolvedDeleteText = deleteText ?? t('common.actions.delete')
  const resolvedDeleteTitle = deleteTitle ?? t('pages.examManagement.questions.deleteTitle')

  const columns: TableProps<AdminExamQuestion>['columns'] = [
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
        value ? (
          <Tag color={getDifficultyColor(value)}>{formatDifficulty(value, t)}</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: t('pages.examManagement.columns.questionText'),
      dataIndex: 'text',
      ellipsis: true,
      render: (value: string, record) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">
            {t('pages.examManagement.questionForm.correctAnswerWithColon')}
            {formatCorrectKeys(record)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('pages.examManagement.columns.scoreValue'),
      dataIndex: 'score',
      width: 90,
      render: (value: number) =>
        t('pages.examManagement.units.pointsWithValue', { value }),
    },
    {
      title: t('pages.examManagement.columns.action'),
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" onClick={() => onEdit(record)}>
            {t('common.actions.edit')}
          </Button>
          <Popconfirm
            title={resolvedDeleteTitle}
            description={resolvedDeleteDescription}
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            okText={resolvedDeleteText}
            onConfirm={() => onDelete(record.id)}
          >
            <Button danger type="link">
              {resolvedDeleteText}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Table<AdminExamQuestion>
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      rowKey="id"
      scroll={{ x: 960, y: scrollY }}
    />
  )
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

function formatCorrectKeys(record: AdminExamQuestion) {
  const value = record.options
    .filter((option) => option.is_correct)
    .map((option) => option.key)
    .join('、')

  if (!value) return '-'

  return value
}
