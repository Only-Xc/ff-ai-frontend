import { Card, Skeleton, Typography } from 'antd'

import { useOpsMetricsStyles } from '../styles'
import type { MetricCardProps } from '../types'

export function MetricCard({
  hint,
  icon,
  loading,
  title,
  value,
  valueColor,
}: MetricCardProps) {
  const { styles } = useOpsMetricsStyles()

  return (
    <Card
      className={`${styles.metricCard} h-full overflow-hidden rounded-xl! transition-[border-color,box-shadow,transform] duration-160 hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--admin-primary)_24%,var(--border))] hover:shadow-(--ops-shadow)`}
    >
      <Skeleton active loading={loading} paragraph={{ rows: 2 }} title={false}>
        <div className="flex h-full flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-3">
            <Typography.Text className="text-[12px]! font-medium text-(--muted)!">
              {title}
            </Typography.Text>
            <span className="grid h-8 w-8 place-items-center rounded-[10px] border border-[color-mix(in_srgb,var(--admin-primary)_16%,transparent)] bg-[color-mix(in_srgb,var(--admin-primary)_9%,transparent)] text-[16px] text-(--admin-primary)">
              {icon}
            </span>
          </div>
          <div>
            <div
              className="truncate text-[26px] font-[680] leading-tight text-(--text-strong) tabular-nums"
              style={valueColor ? { color: valueColor } : undefined}
            >
              {value}
            </div>
            <div className="mt-1.5 truncate text-[11px] leading-4 text-(--muted)">
              {hint}
            </div>
          </div>
        </div>
      </Skeleton>
    </Card>
  )
}
