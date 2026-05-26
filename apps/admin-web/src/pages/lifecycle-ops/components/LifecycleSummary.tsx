import {
  CheckCircleOutlined,
  DollarOutlined,
  FireOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { Typography } from 'antd'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

import type {
  HotLifecycleCandidate,
  IdleLifecycleCandidate,
} from '@/api/lifecycle-ops'

import type { FilterValues } from '../types'
import { numberUtils } from '@ff-ai-frontend/utils'
import { sumCost } from '../utils'

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
  queryParams: FilterValues
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
  queryParams,
}: LifecycleSummaryProps) {
  const summaryItems = useMemo(
    () => [
      {
        title: '沉寂候选',
        value: numberUtils.formatNumber(idleTotal),
        hint: `连续 ${queryParams.idle_days} 天零调用`,
        icon: <SwapOutlined />,
      },
      {
        title: '火爆候选',
        value: numberUtils.formatNumber(hotTotal),
        hint: `日均调用高于 ${numberUtils.formatNumber(queryParams.min_daily_invocations)}`,
        icon: <FireOutlined />,
      },
      {
        title: '可释放成本',
        value: numberUtils.formatCurrency(sumCost(idleCandidates)),
        hint: '当前页沉寂候选日均运行成本',
        icon: <DollarOutlined />,
      },
      {
        title: '沙盒执行成本',
        value: numberUtils.formatCurrency(sumCost(hotCandidates)),
        hint: '当前页火爆候选日均沙盒成本',
        icon: <CheckCircleOutlined />,
      },
    ],
    [
      hotCandidates,
      hotTotal,
      idleCandidates,
      idleTotal,
      queryParams.idle_days,
      queryParams.min_daily_invocations,
    ],
  )

  return (
    <div className="flex min-w-0 items-stretch gap-3 max-[1180px]:w-full">
      <div
        aria-label="生命周期指标"
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
