import {
  EyeOutlined,
  ReloadOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Form,
  Pagination,
  Space,
  Table,
  Tooltip,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'

import {
  tenantAgentKeys,
  tenantAgents_list,
  type AgentStatusFilter,
  type TenantAgent,
} from '@/api/agent-ticket'
import {
  tenantApps_add,
  tenantApps_delete,
  type TenantAppQuery,
} from '@/api/tenant-apps'
import { DictSelect } from '@ff-ai-frontend/dictionaries'
import { TableScrollYWrapper } from '@ff-ai-frontend/components'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { useMenuStore } from '@/store/useMenu'

import { AgentStatusTag } from './components/status'
import { formatDateTime } from './utils/format'
import { globalMessage } from '@/utils/message'

interface AgentFilterValues {
  status?: AgentStatusFilter
}

export function AgentList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [form] = Form.useForm<AgentFilterValues>()
  const [status, setStatus] = useState<AgentStatusFilter>()
  const pagination = usePaginationParams()
  const retryMenu = useMenuStore((state) => state.retryMenu)
  const listParams = {
    status: status ?? '',
    ...pagination.query,
  }

  const { data, isError, isFetching, refetch } = useQuery({
    queryKey: tenantAgentKeys.list(listParams),
    queryFn: () => tenantAgents_list(listParams),
    placeholderData: keepPreviousData,
  })

  const collectMutation = useMutation({
    mutationFn: (data: TenantAppQuery) => tenantApps_add(data),
    onSuccess: (_) => {
      globalMessage.success(t('pages.agentTicket.favorite.success'))
      void refetch()
      void retryMenu()
    },
  })

  const cancelCollectMutation = useMutation({
    mutationFn: (id: string) => tenantApps_delete(id),
    onSuccess: (_) => {
      globalMessage.success(t('pages.agentTicket.favorite.cancelSuccess'))
      void refetch()
      void retryMenu()
    },
  })

  const collectToggle = useCallback(
    (record: TenantAgent) => {
      if (record.is_favorited) {
        cancelCollectMutation.mutate(record.agent_id)
      } else {
        collectMutation.mutate({
          title: record.name,
          type: 'app',
          order: 0,
          agent_id: record.agent_id,
          icon_url: '',
        })
      }
    },
    [cancelCollectMutation, collectMutation],
  )

  const columns = useMemo<TableProps<TenantAgent>['columns']>(
    () => [
      {
        title: t('pages.agentTicket.columns.appName'),
        dataIndex: 'name',
        ellipsis: true,
        render: (value: string, record) => (
          <Space orientation="vertical" size={2}>
            {record.endpoint_url ? (
              <Tooltip placement="top" title={t('pages.agentTicket.preview')}>
                <Typography.Link
                  href={record.endpoint_url}
                  target="_blank"
                  strong
                >
                  {value}
                </Typography.Link>
              </Tooltip>
            ) : (
              <Typography.Text strong>{value}</Typography.Text>
            )}
            <Typography.Text copyable type="secondary">
              {record.agent_id}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t('pages.agentTicket.columns.runStatus'),
        dataIndex: 'status',
        width: 100,
        render: (_, record) => <AgentStatusTag status={record.status} />,
      },
      {
        title: t('pages.agentTicket.columns.createdAt'),
        dataIndex: 'created_at',
        width: 180,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: t('pages.agentTicket.columns.lastInvokedAt'),
        dataIndex: 'last_invoked_at',
        width: 180,
        render: (value: string | null) => formatDateTime(value),
      },
      {
        title: t('pages.agentTicket.columns.action'),
        key: 'action',
        width: 240,
        render: (_, record) => (
          <Space size={4}>
            <Button
              icon={<EyeOutlined />}
              type="link"
              onClick={() =>
                void navigate(`/agent-ticket/agents/${record.agent_id}`)
              }
            >
              {t('common.actions.detail')}
            </Button>
            <Button
              icon={record.is_favorited ? <StarFilled /> : <StarOutlined />}
              type="link"
              onClick={() => collectToggle(record)}
            >
              {record.is_favorited
                ? t('pages.agentTicket.favorite.cancel')
                : t('pages.agentTicket.favorite.add')}
            </Button>
          </Space>
        ),
      },
    ],
    [collectToggle, navigate, t],
  )

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4 px-5">
        <Form className="flex-1" form={form} layout="inline">
          <Form.Item name="status">
            <DictSelect<AgentStatusFilter>
              allowClear
              className="w-35!"
              placeholder={t('pages.agentTicket.filters.allStatus')}
              type="agent_status"
              onChange={(value) => {
                setStatus(value)
                pagination.reset()
              }}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                onClick={() => {
                  form.resetFields()
                  setStatus(undefined)
                  pagination.reset()
                }}
              >
                {t('common.actions.reset')}
              </Button>
              <Button
                icon={<ReloadOutlined />}
                loading={isFetching}
                type="primary"
                onClick={() => void refetch()}
              >
                {t('common.actions.refresh')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      {isError ? (
        <Alert
          showIcon
          className="mb-4 shrink-0"
          action={
            <Button size="small" onClick={() => void refetch()}>
              {t('common.actions.retry')}
            </Button>
          }
          title={t('pages.agentTicket.agentListLoadFailed')}
          type="error"
        />
      ) : null}

      <TableScrollYWrapper
        className="min-h-0 flex-1 border-t border-t-(--ant-color-border-secondary)"
        refreshKey={`${data?.data.length ?? 0}:${isFetching}`}
      >
        <Table<TenantAgent>
          columns={columns}
          dataSource={data?.data ?? []}
          loading={isFetching}
          pagination={false}
          rowKey="agent_id"
        />
      </TableScrollYWrapper>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-t-(--ant-color-border-secondary)">
        <Typography.Text className="text-(--muted)!">
          {t('common.labels.totalCount', { total: data?.count ?? 0 })}
        </Typography.Text>
        <Pagination {...pagination.props} total={data?.count ?? 0} />
      </div>
    </div>
  )
}

export default AgentList
