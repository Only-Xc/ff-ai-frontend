import {
  AlertOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  DeploymentUnitOutlined,
  ExclamationCircleOutlined,
  FieldTimeOutlined,
  FileSearchOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

import type { TaskStatus } from '@/api/ticket-kanban'

export type LaneId = 'analysis' | 'coding' | 'testing' | 'blocked' | 'deploying'
export type LaneColor = 'blue' | 'cyan' | 'gold' | 'purple' | 'red'

export interface LaneConfig {
  id: LaneId
  titleKey: string
  description: string
  statuses: TaskStatus[]
  color: LaneColor
  icon: ReactNode
}

export const lanes: LaneConfig[] = [
  {
    id: 'analysis',
    titleKey: 'pages.tickets.lanes.analysis.title',
    description: 'CREATED / ANALYZING',
    statuses: ['CREATED', 'ANALYZING'],
    color: 'blue',
    icon: <FileSearchOutlined />,
  },
  {
    id: 'coding',
    titleKey: 'pages.tickets.lanes.coding.title',
    description: 'ROUTING / CODING',
    statuses: ['ROUTING', 'CODING'],
    color: 'purple',
    icon: <CodeOutlined />,
  },
  {
    id: 'testing',
    titleKey: 'pages.tickets.lanes.testing.title',
    description: 'TESTING',
    statuses: ['TESTING'],
    color: 'cyan',
    icon: <CheckCircleOutlined />,
  },
  {
    id: 'blocked',
    titleKey: 'pages.tickets.lanes.blocked.title',
    description: 'PENDING_APPROVAL / FAILED',
    statuses: ['PENDING_APPROVAL', 'FAILED'],
    color: 'red',
    icon: <AlertOutlined />,
  },
  {
    id: 'deploying',
    titleKey: 'pages.tickets.lanes.deploying.title',
    description: 'DEPLOYING',
    statuses: ['DEPLOYING', 'COMPLETED'],
    color: 'gold',
    icon: <DeploymentUnitOutlined />,
  },
]

export const metricCards = [
  {
    key: 'all',
    titleKey: 'pages.tickets.metrics.all.title',
    captionKey: 'pages.tickets.metrics.all.caption',
    icon: <UsergroupAddOutlined />,
    color: 'var(--admin-primary)',
  },
  {
    key: 'active',
    titleKey: 'pages.tickets.metrics.active.title',
    captionKey: 'pages.tickets.metrics.active.caption',
    icon: <FieldTimeOutlined />,
    color: 'var(--admin-info)',
  },
  {
    key: 'pending_approval',
    titleKey: 'pages.tickets.metrics.pendingApproval.title',
    captionKey: 'pages.tickets.metrics.pendingApproval.caption',
    icon: <ExclamationCircleOutlined />,
    color: 'var(--admin-danger)',
  },
  {
    key: 'failed',
    titleKey: 'pages.tickets.metrics.failed.title',
    captionKey: 'pages.tickets.metrics.failed.caption',
    icon: <AlertOutlined />,
    color: 'var(--admin-warning)',
  },
] as const

export type MetricKey = (typeof metricCards)[number]['key']

export const laneColorMap: Record<LaneConfig['color'], string> = {
  blue: '#2563eb',
  cyan: '#0891b2',
  gold: '#d97706',
  purple: '#7c3aed',
  red: '#dc2626',
}
