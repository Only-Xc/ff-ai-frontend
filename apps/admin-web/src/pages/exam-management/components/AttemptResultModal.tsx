import { Descriptions, Modal, Space, Tag, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

import type { AdminExamAttemptDetail } from '@/api/exam'

interface AttemptResultModalProps {
  attempt?: AdminExamAttemptDetail
  onClose: () => void
}

export function AttemptResultModal({ attempt, onClose }: AttemptResultModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      footer={null}
      open={Boolean(attempt)}
      title={t('pages.examManagement.attemptResult.title')}
      width={760}
      onCancel={onClose}
    >
      {attempt ? (
        <Space className="w-full" orientation="vertical" size={16}>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label={t('pages.examManagement.columns.user')}>
              {attempt.user_name ?? attempt.user_email ?? attempt.user_id}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.examManagement.columns.status')}>
              {attempt.status === 'submitted'
                ? t('pages.examManagement.status.submitted')
                : t('pages.examManagement.status.inProgress')}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.examManagement.columns.score')}>
              {formatScore(attempt.score, attempt.total_score)}
            </Descriptions.Item>
            <Descriptions.Item label={t('pages.examManagement.columns.pass')}>
              {attempt.is_passed === null
                ? '-'
                : attempt.is_passed
                  ? t('pages.examManagement.pass.passed')
                  : t('pages.examManagement.pass.failed')}
            </Descriptions.Item>
          </Descriptions>
          <div className="max-h-110 overflow-y-auto pr-1">
            <Space className="w-full" orientation="vertical" size={12}>
              {attempt.questions.map((question, index) => (
                <div className="rounded-lg border border-(--ant-color-border-secondary) p-3" key={question.question_id}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Typography.Text strong>{index + 1}. {question.text}</Typography.Text>
                    {question.difficulty ? (
                      <Tag>{t(`pages.examManagement.difficulty.${question.difficulty}`)}</Tag>
                    ) : null}
                  </div>
                  <div className="text-sm text-(--muted)">
                    {t('pages.examManagement.attemptResult.answerLine', {
                      correctAnswer: formatKeys(question.correct_keys),
                      score: formatScore(question.earned_score, question.score),
                      userAnswer: formatKeys(question.selected_keys),
                    })}
                  </div>
                  {question.explanation ? (
                    <Typography.Paragraph className="mt-2 mb-0">
                      {t('pages.examManagement.attemptResult.explanation', {
                        explanation: question.explanation,
                      })}
                    </Typography.Paragraph>
                  ) : null}
                </div>
              ))}
            </Space>
          </div>
        </Space>
      ) : null}
    </Modal>
  )
}

function formatScore(score: number | null, total: number | null) {
  if (score === null || total === null) return '-'

  return `${score} / ${total}`
}

function formatKeys(keys: string[]) {
  const value = keys.join(', ')

  if (!value) return '-'

  return value
}
