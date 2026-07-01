import { CloudServerOutlined, HistoryOutlined, SwapOutlined } from '@ant-design/icons'
import { Button, Space, Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type {
  HotLifecycleCandidate,
  IdleLifecycleCandidate,
  ObserveLifecycleCandidate,
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
  observeCandidates: ObserveLifecycleCandidate[]
  onOpenDemote: (candidate: IdleLifecycleCandidate) => void
  onOpenHistory: (agentId: string) => void
  onOpenPromote: (candidate: HotLifecycleCandidate) => void
  promoteCandidateId?: string
  promotePending: boolean
}

function renderAgentCell(value: string, record: { agent_id: string }) {
  return <AgentCell name={value} agentId={record.agent_id} />
}

function getZeroTrafficDays(record: IdleLifecycleCandidate) {
  return record.zero_traffic_days ?? record.idle_days
}

function getSuggestionColor(action?: string | null) {
  if (action === '归档') return 'purple'
  if (action === '下线') return 'warning'
  return 'default'
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
  observeCandidates,
  onOpenDemote,
  onOpenHistory,
  onOpenPromote,
  promoteCandidateId,
  promotePending,
}: LifecycleCandidateTablesProps) {
  const { t } = useTranslation()
  const idleColumns = useMemo<TableProps<IdleLifecycleCandidate>['columns']>(
    () => [
      {
        title: t('pages.lifecycle.columns.workOrderTitle'),
        dataIndex: 'name',
        width: 300,
        ellipsis: true,
        render: renderAgentCell,
      },
      {
        title: t('pages.lifecycle.columns.tenant'),
        dataIndex: 'tenant',
        width: 190,
        render: (value: string | null | undefined, record) => (
          <CopyableText value={value || record.tenant_id} />
        ),
      },
      {
        title: t('pages.lifecycle.columns.lastInvoked'),
        dataIndex: 'last_invoked_at',
        width: 180,
        render: (value: string | null) => formatDateTime(value, t),
      },
      {
        title: t('pages.lifecycle.columns.zeroTrafficDays'),
        key: 'zero_traffic_days',
        width: 160,
        render: (_, record) => {
          const days = getZeroTrafficDays(record)
          return (
            <Tag color={days >= idleDays ? 'red' : 'default'}>
              {t('pages.lifecycle.units.days', { count: days })}
            </Tag>
          )
        },
      },
      {
        title: t('pages.lifecycle.columns.occupiedResources'),
        dataIndex: 'occupied_resources',
        width: 260,
        ellipsis: true,
        render: (value: IdleLifecycleCandidate['occupied_resources']) =>
          value?.summary || '-',
      },
      {
        title: t('pages.lifecycle.columns.recommendation'),
        dataIndex: 'suggested_action',
        width: 140,
        render: (value: string | null | undefined) => (
          <Tag color={getSuggestionColor(value)}>
            {value || t('pages.lifecycle.recommendations.observe')}
          </Tag>
        ),
      },
      {
        title: t('pages.lifecycle.columns.action'),
        key: 'action',
        fixed: 'right',
        width: 220,
        render: (_, record) => (
          <Space>
            <Button
              danger
              icon={<SwapOutlined />}
              loading={demotePending && demoteCandidateId === record.agent_id}
              type="link"
              onClick={() => onOpenDemote(record)}
            >
              {t('pages.lifecycle.actions.demote')}
            </Button>
            <Button
              icon={<HistoryOutlined />}
              type="link"
              onClick={() => onOpenHistory(record.agent_id)}
            >
              {t('pages.lifecycle.actions.history')}
            </Button>
          </Space>
        ),
      },
    ],
    [demoteCandidateId, demotePending, idleDays, onOpenDemote, onOpenHistory, t],
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
        width: 220,
        render: (_, record) => (
          <Space>
            <Button
              icon={<CloudServerOutlined />}
              loading={promotePending && promoteCandidateId === record.agent_id}
              type="link"
              onClick={() => onOpenPromote(record)}
            >
              {t('pages.lifecycle.actions.promote')}
            </Button>
            <Button
              icon={<HistoryOutlined />}
              type="link"
              onClick={() => onOpenHistory(record.agent_id)}
            >
              {t('pages.lifecycle.actions.history')}
            </Button>
          </Space>
        ),
      },
    ],
    [onOpenHistory, onOpenPromote, promoteCandidateId, promotePending, t],
  )

  const observeColumns = useMemo<TableProps<ObserveLifecycleCandidate>['columns']>(
    () => [
      {
        title: t('pages.lifecycle.columns.workOrderTitle'),
        dataIndex: 'name',
        width: 300,
        ellipsis: true,
        render: renderAgentCell,
      },
      {
        title: t('pages.lifecycle.columns.tenant'),
        dataIndex: 'tenant',
        width: 190,
        render: (value: string | null | undefined, record) => (
          <CopyableText value={value || record.tenant_id} />
        ),
      },
      {
        title: t('pages.lifecycle.columns.lastInvoked'),
        dataIndex: 'last_invoked_at',
        width: 180,
        render: (value: string | null) => formatDateTime(value, t),
      },
      {
        title: t('pages.lifecycle.columns.recentInvocations'),
        dataIndex: 'recent_invocations',
        width: 150,
        render: (value: number) => numberUtils.formatNumber(value),
      },
      {
        title: t('pages.lifecycle.columns.occupiedResources'),
        dataIndex: 'occupied_resources',
        width: 260,
        ellipsis: true,
        render: (value: ObserveLifecycleCandidate['occupied_resources']) =>
          value?.summary || '-',
      },
      {
        title: t('pages.lifecycle.columns.currentStatus'),
        dataIndex: 'current_status',
        width: 130,
        render: (value: string) => <Tag color="success">{value}</Tag>,
      },
      {
        title: t('pages.lifecycle.columns.recommendation'),
        dataIndex: 'suggested_action',
        width: 140,
        render: (value: string | null | undefined) => (
          <Tag>{value || t('pages.lifecycle.recommendations.observe')}</Tag>
        ),
      },
      {
        title: t('pages.lifecycle.columns.action'),
        key: 'action',
        fixed: 'right',
        width: 120,
        render: (_, record) => (
          <Button
            icon={<HistoryOutlined />}
            type="link"
            onClick={() => onOpenHistory(record.agent_id)}
          >
            {t('pages.lifecycle.actions.history')}
          </Button>
        ),
      },
    ],
    [onOpenHistory, t],
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
      ) : activeTab === 'observe' ? (
        <Table<ObserveLifecycleCandidate>
          columns={observeColumns}
          dataSource={observeCandidates}
          loading={isLoading}
          pagination={false}
          rowKey="agent_id"
          scroll={{ x: 1330 }}
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
