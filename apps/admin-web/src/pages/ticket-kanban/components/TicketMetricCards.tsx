import type { CSSProperties } from 'react'

import type { MetricKey } from '../constants'
import { metricCards } from '../constants'
import { formatCount, formatPercent, getMetricPercent } from '../utils'

interface TicketMetricCardsProps {
  countByKey: Record<MetricKey, number>
  currentCount?: number
  statsLoading: boolean
}

function getMetricDisplayMeta({
  currentCount,
  key,
  totalCount,
  value,
}: {
  currentCount?: number
  key: MetricKey
  totalCount: number
  value: number
}) {
  if (key === 'pending_approval' && value > 0) return '需处理'
  if (key === 'failed' && value > 0) return '需复盘'
  if (key === 'all') return `当前筛选 ${formatCount(currentCount)} 条`

  return `占全局 ${formatPercent(getMetricPercent(value, totalCount))}`
}

export function TicketMetricCards({
  countByKey,
  currentCount,
  statsLoading,
}: TicketMetricCardsProps) {
  const totalCount = formatCount(countByKey.all)

  return (
    <div
      aria-label="工单指标"
      className="contents"
      role="list"
    >
      {metricCards.map((item) => {
        const value = formatCount(countByKey[item.key])
        const assistText = getMetricDisplayMeta({
          currentCount,
          key: item.key,
          totalCount,
          value,
        })

        return (
          <article
            key={item.key}
            className="relative flex min-h-14 min-w-0 items-center gap-2.5 overflow-hidden rounded-lg border border-(--border) bg-(--panel) px-3 py-2 shadow-[0_1px_2px_rgb(15_23_42/0.05)] transition-[background-color,border-color,box-shadow,color] duration-160 hover:border-[color-mix(in_srgb,var(--admin-primary)_22%,var(--border))] hover:bg-[color-mix(in_srgb,var(--admin-primary)_3%,var(--panel))]"
            role="listitem"
            style={{ '--metric-color': item.color } as CSSProperties}
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-[7px] bg-[color-mix(in_srgb,var(--metric-color)_12%,transparent)] text-sm text-(--metric-color)">
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold leading-4 text-(--text-strong)">
                {item.title}
              </div>
              <div className="flex min-w-0 items-center gap-1.5 text-[11px] leading-4 text-(--muted)">
                <span className="min-w-0 truncate">{item.caption}</span>
                <span
                  className={`relative truncate pl-[7px] before:absolute before:left-0 before:top-1/2 before:size-0.5 before:-translate-y-1/2 before:rounded-full before:bg-[color:color-mix(in_srgb,var(--muted)_56%,transparent)] before:content-[''] ${
                    item.key === 'pending_approval' && value > 0
                      ? 'shrink-0 font-medium text-(--admin-danger)'
                      : item.key === 'failed' && value > 0
                        ? 'shrink-0 font-medium text-(--admin-warning)'
                        : 'min-w-0'
                  }`}
                >
                  {assistText}
                </span>
              </div>
            </div>
            <div className="min-w-7 shrink-0 text-end text-[22px] font-[750] leading-6 tracking-normal text-(--text-strong) tabular-nums">
              {statsLoading ? '-' : value}
            </div>
          </article>
        )
      })}
    </div>
  )
}
