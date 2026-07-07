import { Button, Checkbox, Radio, Space, Tag } from 'antd'
import { createStyles } from 'antd-style'
import { useTranslation } from 'react-i18next'

import type {
  TenantAttemptQuestion,
  TenantExamQuestionOption,
} from '@/api/exam'

interface QuestionCardProps {
  question: TenantAttemptQuestion
  index: number
  marked: boolean
  total: number
  value: string[]
  onChange: (selectedKeys: string[]) => void
  onToggleMark: () => void
}

const useStyles = createStyles(({ css }) => ({
  optionGroup: css`
    display: block;
    width: 100%;
    margin-top: 20px;

    .ant-space {
      width: 100%;
    }

    .ant-space-item {
      width: 100%;
      box-sizing: border-box;
    }

    .ant-radio-wrapper,
    .ant-checkbox-wrapper {
      display: flex;
      align-items: center;
      min-height: 48px;
      width: 100%;
      gap: 12px;
      border-radius: 8px;
      background: rgb(248 250 252);
      margin-inline: 0;
      padding: 10px 20px;
      transition:
        background-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .ant-radio-wrapper:hover,
    .ant-checkbox-wrapper:hover {
      background: rgb(241 245 249);
    }

    .ant-radio-wrapper.is-select,
    .ant-checkbox-wrapper.is-select {
      background: rgb(245 243 255);
      box-shadow: inset 0 0 0 1px rgb(221 214 254);
    }

    .ant-radio-wrapper.is-select:hover,
    .ant-checkbox-wrapper.is-select:hover {
      background: rgb(237 233 254);
    }

    .ant-radio,
    .ant-checkbox {
      align-self: center;
      top: 0;
    }

    .ant-radio-wrapper > span:last-child,
    .ant-checkbox-wrapper > span:last-child {
      display: flex;
      min-width: 0;
      flex: 1;
      align-items: center;
    }
  `,
}))

export function QuestionCard({
  index,
  marked,
  onChange,
  onToggleMark,
  question,
  total,
  value,
}: QuestionCardProps) {
  const { styles } = useStyles()
  const { t } = useTranslation()
  const title = t('pages.exam.room.questionTitle', {
    current: index + 1,
    total,
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="min-w-0">
          <h2 className="m-0 text-xl font-semibold leading-8 text-slate-950">
            {title}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{t(`pages.exam.questionType.${question.type}`)}</span>
            <span>{t('pages.exam.units.points', { count: question.score })}</span>
            {question.difficulty ? (
              <Tag className="m-0!">{t(`pages.exam.difficulty.${question.difficulty}`)}</Tag>
            ) : null}
          </div>
        </div>
        <Button type={marked ? 'primary' : 'default'} onClick={onToggleMark}>
          {marked
            ? t('pages.exam.room.unmarkReview')
            : t('pages.exam.room.markReview')}
        </Button>
      </div>

      <p className="m-0 text-base leading-7 text-slate-950">
        {question.text}
      </p>

      {question.type === 'multiple' ? (
        <Checkbox.Group className={styles.optionGroup} value={value} onChange={(keys) => onChange(keys.map((key) => String(key)))}>
          <Space direction="vertical" size={8}>
            {question.options.map((option) => (
              <Checkbox
                className={value.includes(option.key) ? 'is-select' : undefined}
                key={option.key}
                value={option.key}
              >
                <OptionContent option={option} />
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      ) : (
        <Radio.Group className={styles.optionGroup} value={value[0]} onChange={(event) => onChange([String(event.target.value)])}>
          <Space direction="vertical" size={8}>
            {question.options.map((option) => (
              <Radio
                className={value[0] === option.key ? 'is-select' : undefined}
                key={option.key}
                value={option.key}
              >
                <OptionContent option={option} />
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      )}
    </div>
  )
}

interface OptionContentProps {
  option: TenantExamQuestionOption
}

function OptionContent({ option }: OptionContentProps) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <span className={getOptionKeyClassName()}>{option.key}.</span>
      <span className="min-w-0 flex-1 text-sm leading-6 text-slate-700">
        {option.text}
      </span>
    </span>
  )
}

function getOptionKeyClassName() {
  const baseClassName =
    'inline-flex shrink-0 text-sm font-semibold leading-6 text-slate-700'

  return baseClassName
}
