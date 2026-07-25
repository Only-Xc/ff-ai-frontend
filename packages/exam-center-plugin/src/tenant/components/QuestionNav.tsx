import { Button, Space, Tag } from 'antd'
import { useTranslation } from 'react-i18next'

import { useExamStyles } from '../styles'
import type { QuestionNavItem } from '../types'

interface QuestionNavProps {
  items: QuestionNavItem[]
  currentIndex: number
  onSelect: (index: number) => void
  onSubmit: () => void
  submitting?: boolean
}

export function QuestionNav({
  currentIndex,
  items,
  onSelect,
  onSubmit,
  submitting,
}: QuestionNavProps) {
  const { styles } = useExamStyles()
  const { t } = useTranslation()

  return (
    <aside className="flex min-h-0 min-w-0 self-stretch flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_32px_rgb(15_23_42/0.06)]">
      <div className="mb-3">
        <h3 className="m-0 text-base font-semibold text-slate-950">
          {t('pages.exam.room.questionNav')}
        </h3>
        <p className="m-0 mt-1 text-xs text-slate-500">
          {t('pages.exam.units.questions', { count: items.length })}
        </p>
      </div>

      <div className={`${styles.questionGrid} min-h-0 flex-1 overflow-y-auto pr-1`}>
        {items.map((item) => {
          const isCurrent = item.index === currentIndex
          const buttonClassName = [
            'relative flex h-9 w-full cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors duration-200',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700',
            isCurrent
              ? 'border-violet-300 bg-violet-50 text-violet-800 shadow-sm hover:border-violet-400 hover:bg-violet-100'
              : item.answered
                ? 'border-green-300 bg-green-50 text-green-800 hover:border-green-400 hover:bg-green-100'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
          ].join(' ')

          return (
            <button
              className={buttonClassName}
              key={item.questionId}
              type="button"
              onClick={() => onSelect(item.index)}
            >
              {item.index + 1}
              {item.marked ? (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="shrink-0">
        <Space className="mt-4" wrap>
          <Tag className="m-0!">{t('pages.exam.room.unanswered')}</Tag>
          <Tag className="m-0! border-green-300! bg-green-50! text-green-800!">
            {t('pages.exam.room.answered')}
          </Tag>
          <Tag className="m-0!" color="orange">{t('pages.exam.room.review')}</Tag>
        </Space>

        <Button className="mt-4 w-full" danger loading={submitting} type="primary" onClick={onSubmit}>
          {t('pages.exam.room.submitPaper')}
        </Button>
      </div>
    </aside>
  )
}
