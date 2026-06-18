import { CloudServerOutlined, SwapOutlined } from '@ant-design/icons'
import { Button, Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  HotLifecycleCandidate,
  IdleLifecycleCandidate,
} from '@/api/lifecycle-ops'
import { TableScrollYWrapper } from '@ff-ai-frontend/components'

import type { CandidateTab } from '../types'
import { numberUtils } from '@ff-ai-frontend/utils'
import { formatDateTime } from '../utils'
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

function renderAgentCell(value: string, record: { agent_id: string }) {
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
  const { t } = useTranslation()
  const idleColumns = useMemo<TableProps<IdleLifecycleCandidate>['columns']>(
    () => [
      {
        title: t('pages.lifecycle.columns.app'),
        dataIndex: 'name',
        width: 300,
        ellipsis: true,
        render: renderAgentCell,
      },
      {
        title: t('pages.lifecycle.columns.tenant'),
        dataIndex: 'tenant_id',
        width: 190,
        render: (value: string) => <CopyableText value={value} />,
      },
      {
        title: t('pages.lifecycle.columns.idleDays'),
        dataIndex: 'idle_days',
        width: 130,
        render: (value: number) => (
          <Tag color={value >= idleDays ? 'red' : 'default'}>
            {t('pages.lifecycle.units.days', { count: value })}
          </Tag>
        ),
      },
      {
        title: t('pages.lifecycle.columns.lastInvoked'),
        dataIndex: 'last_invoked_at',
        width: 180,
        render: (value: string | null) => formatDateTime(value, t),
      },
      {
        title: t('pages.lifecycle.columns.dailyRunCost'),
        dataIndex: 'daily_avg_cost',
        width: 150,
        render: (value: number) => numberUtils.formatCurrency(value),
      },
      {
        title: t('pages.lifecycle.columns.recommendation'),
        key: 'recommendation',
        width: 150,
        render: () => (
          <Tag color="warning">
            {t('pages.lifecycle.recommendations.demote')}
          </Tag>
        ),
      },
      {
        title: t('pages.lifecycle.columns.action'),
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
            {t('pages.lifecycle.actions.demote')}
          </Button>
        ),
      },
    ],
    [demoteCandidateId, demotePending, idleDays, onOpenDemote, t],
  )

  const hotColumns = useMemo<TableProps<HotLifecycleCandidate>['columns']>(
    () => [
      {
        title: t('pages.lifecycle.columns.app'),
        dataIndex: 'name',
        width: 300,
        ellipsis: true,
        render: renderAgentCell,
      },
      {
        title: t('pages.lifecycle.columns.tenant'),
        dataIndex: 'tenant_id',
        width: 190,
        render: (value: string) => <CopyableText value={value} />,
      },
      {
        title: t('pages.lifecycle.columns.dailyInvocations'),
        dataIndex: 'daily_invocations',
        width: 140,
        render: (value: number) => numberUtils.formatNumber(value),
      },
      {
        title: t('pages.lifecycle.columns.avgDuration'),
        dataIndex: 'avg_duration_ms',
        width: 130,
        render: (value: number) => `${numberUtils.formatNumber(value)} ms`,
      },
      {
        title: t('pages.lifecycle.columns.dailySandboxCost'),
        dataIndex: 'daily_avg_cost',
        width: 160,
        render: (value: number) => numberUtils.formatCurrency(value),
      },
      {
        title: t('pages.lifecycle.columns.recommendation'),
        key: 'recommendation',
        width: 170,
        render: () => (
          <Tag color="success">
            {t('pages.lifecycle.recommendations.promote')}
          </Tag>
        ),
      },
      {
        title: t('pages.lifecycle.columns.action'),
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
            {t('pages.lifecycle.actions.promote')}
          </Button>
        ),
      },
    ],
    [onOpenPromote, promoteCandidateId, promotePending, t],
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
