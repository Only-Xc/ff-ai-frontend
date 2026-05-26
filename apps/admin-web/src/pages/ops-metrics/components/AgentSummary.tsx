import { CloudServerOutlined } from '@ant-design/icons'
import { Progress, Skeleton, Space, Statistic } from 'antd'

import type { OpsMetricsAgentSummary } from '@/api/ops-metrics'

import { numberUtils } from '@ff-ai-frontend/utils'
import { getAgentSegments } from '../utils'
import { EmptyBlock } from './EmptyBlock'

interface AgentSummaryProps {
  loading: boolean
  summary?: OpsMetricsAgentSummary
}

export function AgentSummary({ loading, summary }: AgentSummaryProps) {
  const segments = summary ? getAgentSegments(summary) : []

  return (
    <Skeleton active loading={loading} paragraph={{ rows: 5 }} title={false}>
      {summary ? (
        <Space className="w-full" orientation="vertical" size={14}>
          <Statistic
            title="智能体总数"
            value={numberUtils.formatNumber(summary.total)}
            prefix={<CloudServerOutlined />}
            styles={{
              content: { color: 'var(--text-strong)', fontSize: 26 },
            }}
          />
          <Space className="w-full" orientation="vertical" size={10}>
            {segments.map((segment) => {
              const percent = summary.total
                ? Math.round((segment.value / summary.total) * 100)
                : 0

              return (
                <div key={segment.label}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-[12px]">
                    <span className="text-(--muted)">{segment.label}</span>
                    <span className="font-semibold text-(--text-strong) tabular-nums">
                      {numberUtils.formatNumber(segment.value)}
                    </span>
                  </div>
                  <Progress
                    percent={percent}
                    showInfo={false}
                    strokeColor={segment.color}
                    railColor="var(--control-bg)"
                  />
                </div>
              )
            })}
          </Space>
        </Space>
      ) : (
        <EmptyBlock description="暂无智能体数据" />
      )}
    </Skeleton>
  )
}
