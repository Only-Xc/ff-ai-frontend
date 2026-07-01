import { Drawer, Empty, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type { AgentLifecycleOperation } from '@/api/lifecycle-ops'

import { formatDateTime } from '../utils'
import { CopyableText } from './CopyableText'

interface LifecycleOperationsDrawerProps {
  agentId?: string
  loading: boolean
  operations: AgentLifecycleOperation[]
  open: boolean
  onClose: () => void
}

export function LifecycleOperationsDrawer({
  agentId,
  loading,
  operations,
  open,
  onClose,
}: LifecycleOperationsDrawerProps) {
  const { t } = useTranslation()
  const columns = useMemo<TableProps<AgentLifecycleOperation>['columns']>(
    () => [
      {
        title: t('pages.lifecycle.history.action'),
        dataIndex: 'action',
        width: 100,
        render: (value: string) => <Tag>{value}</Tag>,
      },
      {
        title: t('pages.lifecycle.history.status'),
        dataIndex: 'status',
        width: 110,
        render: (value: string) => (
          <Tag
            color={
              value === 'failed'
                ? 'error'
                : value === 'succeeded'
                  ? 'success'
                  : 'processing'
            }
          >
            {value}
          </Tag>
        ),
      },
      {
        title: t('pages.lifecycle.history.task'),
        dataIndex: 'task_id',
        width: 180,
        render: (value?: string | null) =>
          value ? <CopyableText value={value} /> : '-',
      },
      {
        title: t('pages.lifecycle.history.container'),
        dataIndex: 'docker_container',
        width: 180,
        render: (value?: string | null) =>
          value ? <CopyableText value={value} /> : '-',
      },
      {
        title: t('pages.lifecycle.history.error'),
        dataIndex: 'error_message',
        width: 220,
        ellipsis: true,
        render: (value?: string | null) => value || '-',
      },
      {
        title: t('pages.lifecycle.history.createdAt'),
        dataIndex: 'created_at',
        width: 170,
        render: (value: string) => formatDateTime(value, t),
      },
    ],
    [t],
  )

  return (
    <Drawer
      width={860}
      title={t('pages.lifecycle.history.title')}
      open={open}
      onClose={onClose}
    >
      {agentId ? (
        <Typography.Text className="mb-4 block text-(--muted)!">
          <CopyableText value={agentId} />
        </Typography.Text>
      ) : null}
      <Table<AgentLifecycleOperation>
        columns={columns}
        dataSource={operations}
        loading={loading}
        locale={{
          emptyText: (
            <Empty description={t('pages.lifecycle.history.empty')} />
          ),
        }}
        pagination={false}
        rowKey="id"
        scroll={{ x: 960 }}
      />
    </Drawer>
  )
}
