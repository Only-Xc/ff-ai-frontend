import { DollarOutlined } from '@ant-design/icons'
import { Skeleton, Space, Statistic } from 'antd'

import type { OpsMetricsBillingSummary } from '@/api/adminMetrics'

import { formatCurrency } from '../utils'

interface BillingSummaryProps {
  loading: boolean
  summary?: OpsMetricsBillingSummary
}

export function BillingSummary({ loading, summary }: BillingSummaryProps) {
  return (
    <Skeleton active loading={loading} paragraph={{ rows: 5 }} title={false}>
      <Space className="w-full" direction="vertical" size={14}>
        <Statistic
          title="本月消费"
          value={summary ? formatCurrency(summary.this_month) : '-'}
          prefix={<DollarOutlined />}
          valueStyle={{ color: 'var(--text-strong)', fontSize: 26 }}
        />
        <div className="grid grid-cols-2 gap-2.5 max-[520px]:grid-cols-1">
          <div className="rounded-lg border border-(--ops-border) bg-(--control-bg) p-3">
            <div className="text-[12px] text-(--muted)">本周</div>
            <div className="mt-1 font-semibold text-(--text-strong) tabular-nums">
              {summary ? formatCurrency(summary.this_week) : '-'}
            </div>
          </div>
          <div className="rounded-lg border border-(--ops-border) bg-(--control-bg) p-3">
            <div className="text-[12px] text-(--muted)">昨日</div>
            <div className="mt-1 font-semibold text-(--text-strong) tabular-nums">
              {summary ? formatCurrency(summary.yesterday) : '-'}
            </div>
          </div>
        </div>
      </Space>
    </Skeleton>
  )
}
