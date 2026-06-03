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

import type { AdminTaskStatus } from '@/api/ticket-kanban'

export type LaneId = 'analysis' | 'coding' | 'testing' | 'blocked' | 'deploying'
export type LaneColor = 'blue' | 'cyan' | 'gold' | 'purple' | 'red'
export type MetricKey = 'active' | 'all' | 'failed' | 'pending_approval'

export interface LaneConfig {
  id: LaneId
  title: string
  description: string
  statuses: AdminTaskStatus[]
  color: LaneColor
  icon: ReactNode
}

export const lanes: LaneConfig[] = [
  {
    id: 'analysis',
    title: '解析中',
    description: 'CREATED / ANALYZING',
    statuses: ['CREATED', 'ANALYZING'],
    color: 'blue',
    icon: <FileSearchOutlined />,
  },
  {
    id: 'coding',
    title: '编码中',
    description: 'ROUTING / CODING',
    statuses: ['ROUTING', 'CODING'],
    color: 'purple',
    icon: <CodeOutlined />,
  },
  {
    id: 'testing',
    title: '测试中',
    description: 'TESTING',
    statuses: ['TESTING'],
    color: 'cyan',
    icon: <CheckCircleOutlined />,
  },
  {
    id: 'blocked',
    title: '异常挂起',
    description: 'PENDING_APPROVAL / FAILED',
    statuses: ['PENDING_APPROVAL', 'FAILED'],
    color: 'red',
    icon: <AlertOutlined />,
  },
  {
    id: 'deploying',
    title: '打包中',
    description: 'DEPLOYING',
    statuses: ['DEPLOYING', 'COMPLETED'],
    color: 'gold',
    icon: <DeploymentUnitOutlined />,
  },
]

export const metricCards = [
  {
    key: 'all',
    title: '全局工单',
    caption: '全部状态池',
    icon: <UsergroupAddOutlined />,
    color: 'var(--admin-primary)',
  },
  {
    key: 'active',
    title: '流转中',
    caption: '处理中占比',
    icon: <FieldTimeOutlined />,
    color: 'var(--admin-info)',
  },
  {
    key: 'pending_approval',
    title: '待审批',
    caption: '人工确认',
    icon: <ExclamationCircleOutlined />,
    color: 'var(--admin-danger)',
  },
  {
    key: 'failed',
    title: '失败',
    caption: '执行失败',
    icon: <AlertOutlined />,
    color: 'var(--admin-warning)',
  },
] as const

export const laneColorMap: Record<LaneConfig['color'], string> = {
  blue: '#2563eb',
  cyan: '#0891b2',
  gold: '#d97706',
  purple: '#7c3aed',
  red: '#dc2626',
}
