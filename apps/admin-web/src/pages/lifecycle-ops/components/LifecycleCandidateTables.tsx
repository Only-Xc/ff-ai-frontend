import { CloudServerOutlined, SwapOutlined } from '@ant-design/icons'
import { Button, Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import { useMemo } from 'react'

import type {
  HotLifecycleCandidate,
  IdleLifecycleCandidate,
} from '@/api/adminAgents'
import { TableScrollYWrapper } from '@/components/TableScrollYWrapper'

import type { CandidateTab } from '../types'
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
} from '../utils/lifecycleFormatters'
import { AgentCell } from './AgentCell'
import { CopyableText } from './CopyableText'

interface LifecycleCandidateTablesProps {
  activeTab: CandidateTab
  activeTotal: number
  demoteCandidateId?: string
  demotePending: boolean
  hotCandidates: HotLifecycleCandidate[]
  idleCandidates: IdleLifecycleCandidate[]
  idleDays: number
  isLoading: boolean
  onOpenDemote: (candidate: IdleLifecycleCandidate) => void
  onOpenPromote: (candidate: HotLifecycleCandidate) => void
  promoteCandidateId?: string
  promotePending: boolean
}

function renderAgentCell(
  value: string,
  record: { agent_id: string },
) {
  return <AgentCell name={value} agentId={record.agent_id} />
}

export function LifecycleCandidateTables({
  activeTab,
  activeTotal,
  demoteCandidateId,
  demotePending,
  hotCandidates,
  idleCandidates,
  idleDays,
  isLoading,
  onOpenDemote,
  onOpenPromote,
  promoteCandidateId,
  promotePending,
}: LifecycleCandidateTablesProps) {
  const idleColumns = useMemo<TableProps<IdleLifecycleCandidate>['columns']>(
    () => [
      {
        title: '应用',
        dataIndex: 'name',
        width: 300,
        ellipsis: true,
        render: renderAgentCell,
      },
      {
        title: '租户',
        dataIndex: 'tenant_id',
        width: 190,
        render: (value: string) => <CopyableText value={value} />,
      },
      {
        title: '沉寂天数',
        dataIndex: 'idle_days',
        width: 130,
        render: (value: number) => (
          <Tag color={value >= idleDays ? 'red' : 'default'}>{value} 天</Tag>
        ),
      },
      {
        title: '最近调用',
        dataIndex: 'last_invoked_at',
        width: 180,
        render: (value: string | null) => formatDateTime(value),
      },
      {
        title: '日均运行成本',
        dataIndex: 'daily_avg_cost',
        width: 150,
        render: (value: number) => formatCurrency(value),
      },
      {
        title: '推荐动作',
        key: 'recommendation',
        width: 150,
        render: () => <Tag color="warning">降级为沙盒</Tag>,
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 150,
        render: (_, record) => (
          <Button
            danger
            icon={<SwapOutlined />}
            loading={demotePending && demoteCandidateId === record.agent_id}
            type="link"
            onClick={() => onOpenDemote(record)}
          >
            降级
          </Button>
        ),
      },
    ],
    [demoteCandidateId, demotePending, idleDays, onOpenDemote],
  )

  const hotColumns = useMemo<TableProps<HotLifecycleCandidate>['columns']>(
    () => [
      {
        title: '应用',
        dataIndex: 'name',
        width: 300,
        ellipsis: true,
        render: renderAgentCell,
      },
      {
        title: '租户',
        dataIndex: 'tenant_id',
        width: 190,
        render: (value: string) => <CopyableText value={value} />,
      },
      {
        title: '日均调用',
        dataIndex: 'daily_invocations',
        width: 140,
        render: (value: number) => formatNumber(value),
      },
      {
        title: '平均耗时',
        dataIndex: 'avg_duration_ms',
        width: 130,
        render: (value: number) => `${formatNumber(value)} ms`,
      },
      {
        title: '日均沙盒成本',
        dataIndex: 'daily_avg_cost',
        width: 160,
        render: (value: number) => formatCurrency(value),
      },
      {
        title: '推荐动作',
        key: 'recommendation',
        width: 170,
        render: () => <Tag color="success">晋升为常驻服务</Tag>,
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 150,
        render: (_, record) => (
          <Button
            icon={<CloudServerOutlined />}
            loading={promotePending && promoteCandidateId === record.agent_id}
            type="link"
            onClick={() => onOpenPromote(record)}
          >
            晋升
          </Button>
        ),
      },
    ],
    [onOpenPromote, promoteCandidateId, promotePending],
  )

  return (
    <TableScrollYWrapper
      className="min-h-0 flex-1 border-t border-t-(--ant-color-border-secondary)"
      refreshKey={`${activeTab}:${activeTotal}:${isLoading}`}
    >
      {activeTab === 'idle' ? (
        <Table<IdleLifecycleCandidate>
          columns={idleColumns}
          dataSource={idleCandidates}
          loading={isLoading}
          pagination={false}
          rowKey="agent_id"
          scroll={{ x: 1250 }}
        />
      ) : (
        <Table<HotLifecycleCandidate>
          columns={hotColumns}
          dataSource={hotCandidates}
          loading={isLoading}
          pagination={false}
          rowKey="agent_id"
          scroll={{ x: 1280 }}
        />
      )}
    </TableScrollYWrapper>
  )
}
