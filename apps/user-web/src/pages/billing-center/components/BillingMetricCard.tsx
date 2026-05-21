import { Skeleton } from 'antd'
import type { CSSProperties, ReactNode } from 'react'

interface BillingMetricCardProps {
  accent: string
  caption?: string
  className?: string
  icon?: ReactNode
  loading?: boolean
  title: string
  value: string
}

function MetricValue({ loading, value }: { loading?: boolean; value: string }) {
  if (loading) {
    return (
      <Skeleton.Input
        active
        size="small"
        style={{
          height: 28,
          width: 128,
        }}
      />
    )
  }

  return (
    <strong
      className={[
        'block truncate font-semibold leading-none tracking-normal text-(--text-strong) tabular-nums',
        'text-[24px] max-[640px]:text-[22px]',
      ].join(' ')}
      title={value}
    >
      {value}
    </strong>
  )
}

export function BillingMetricCard({
  accent,
  caption,
  className,
  icon,
  loading,
  title,
  value,
}: BillingMetricCardProps) {
  const cardClassName = [
    'relative min-w-0 overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--border)_78%,transparent)] shadow-[0_1px_0_rgb(15_23_42/0.03)] transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--metric-accent)_30%,var(--border))]',
    'min-h-[90px] px-4 py-3.5',
    'bg-[color-mix(in_srgb,var(--panel)_96%,var(--bg))]',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const iconClassName =
    'inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--metric-accent)_10%,transparent)] text-[16px] text-[var(--metric-accent)]'

  return (
    <div
      className={cardClassName}
      style={{ '--metric-accent': accent } as CSSProperties}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--metric-accent)_42%,transparent),transparent)]"
      />
      <div className="relative flex h-full min-w-0 flex-col gap-2.5">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full bg-(--metric-accent) shadow-[0_0_0_3px_color-mix(in_srgb,var(--metric-accent)_10%,transparent)]"
            />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="whitespace-nowrap text-[14px] font-medium leading-5 text-(--muted)">
                {title}
              </span>
              {caption ? (
                <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--metric-accent)_8%,transparent)] px-1.5 py-0.5 text-[12px] leading-[1.2] text-(--dark-text)">
                  {caption}
                </span>
              ) : null}
            </div>
          </div>
          <span aria-hidden="true" className={iconClassName}>
            {icon}
          </span>
        </div>
        <MetricValue loading={loading} value={value} />
      </div>
    </div>
  )
}
