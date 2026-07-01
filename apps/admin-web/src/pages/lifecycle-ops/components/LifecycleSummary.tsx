import {
  CheckCircleOutlined,
  EyeOutlined,
  FireOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { Typography } from 'antd'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  HotLifecycleCandidate,
  IdleLifecycleCandidate,
  ObserveLifecycleCandidate,
} from '@/api/lifecycle-ops'

import { numberUtils } from '@ff-ai-frontend/utils'
import { summarizeResources } from '../utils'

interface SummaryCardProps {
  hint: string
  icon: ReactNode
  title: string
  value: ReactNode
}

interface LifecycleSummaryProps {
  hotCandidates: HotLifecycleCandidate[]
  hotTotal: number
  idleCandidates: IdleLifecycleCandidate[]
  idleTotal: number
  observeCandidates: ObserveLifecycleCandidate[]
  observeTotal: number
}

function SummaryCard({ hint, icon, title, value }: SummaryCardProps) {
  return (
    <div className="min-w-0 rounded-lg border border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) px-3 py-2 shadow-[0_1px_2px_rgb(15_23_42/0.04)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Typography.Text className="block text-[12px] leading-4 text-(--muted)!">
            {title}
          </Typography.Text>
          <div className="mt-1 truncate text-[20px] font-semibold leading-6 tracking-normal text-(--text-strong) tabular-nums">
            {value}
          </div>
          <div className="mt-1 truncate text-[11px] leading-4 text-(--muted)">
            {hint}
          </div>
        </div>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-(--ant-color-border-secondary) bg-(--control-bg) text-[15px] text-(--admin-primary)">
          {icon}
        </span>
      </div>
    </div>
  )
}

export function LifecycleSummary({
  hotCandidates,
  hotTotal,
  idleCandidates,
  idleTotal,
  observeCandidates,
  observeTotal,
}: LifecycleSummaryProps) {
  const { t } = useTranslation()
  const summaryItems = useMemo(
    () => [
      {
        title: t('pages.lifecycle.summary.idle.title'),
        value: numberUtils.formatNumber(idleTotal),
        hint: t('pages.lifecycle.summary.idle.hint'),
        icon: <SwapOutlined />,
      },
      {
        title: t('pages.lifecycle.summary.observe.title'),
        value: numberUtils.formatNumber(observeTotal),
        hint: t('pages.lifecycle.summary.observe.hint'),
        icon: <EyeOutlined />,
      },
      {
        title: t('pages.lifecycle.summary.hot.title'),
        value: numberUtils.formatNumber(hotTotal),
        hint: t('pages.lifecycle.summary.hot.hint'),
        icon: <FireOutlined />,
      },
      {
        title: t('pages.lifecycle.summary.releasableResources.title'),
        value: summarizeResources(idleCandidates),
        hint: t('pages.lifecycle.summary.releasableResources.hint'),
        icon: <CheckCircleOutlined />,
      },
    ],
    [
      hotCandidates,
      hotTotal,
      idleCandidates,
      idleTotal,
      observeCandidates,
      observeTotal,
      t,
    ],
  )

  return (
    <div className="flex min-w-0 items-stretch gap-3 max-[1180px]:w-full">
      <div
        aria-label={t('pages.lifecycle.summary.aria')}
        className="grid min-w-155 flex-1 grid-cols-4 gap-2.5 max-[1180px]:min-w-0 max-[760px]:grid-cols-2 max-[520px]:grid-cols-1"
      >
        {summaryItems.map((item) => (
          <SummaryCard
            key={item.title}
            title={item.title}
            value={item.value}
            hint={item.hint}
            icon={item.icon}
          />
        ))}
      </div>
    </div>
  )
}
