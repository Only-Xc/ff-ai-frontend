import {
  DeleteOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  RollbackOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  workflowPublicationKeys,
  workflowPublications_action,
  workflowPublications_list,
  workflowPublications_rollback,
  type WorkflowPluginPublication,
  type WorkflowPublicationStatus,
} from '@/api/plugins'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { useAuthStore } from '@/store/useAuth'
import { PluginCenterTabs } from './components/PluginCenterTabs'

const statusColors: Record<WorkflowPublicationStatus, string> = {
  pending: 'default',
  publishing: 'processing',
  published: 'success',
  superseded: 'default',
  failed: 'error',
  disabled: 'warning',
  rolled_back: 'default',
  archived: 'default',
}

export default function WorkflowPublications() {
  const { message } = App.useApp()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const pagination = usePaginationParams()
  const organizationId = useAuthStore((state) => state.organizationIds[0])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<WorkflowPublicationStatus>()
  const [rollbackSource, setRollbackSource] =
    useState<WorkflowPluginPublication>()
  const [rollbackTarget, setRollbackTarget] = useState<string>()
  const query = useMemo(
    () => ({
      organization_id: organizationId,
      status,
      keyword: keyword || undefined,
      skip: pagination.query.skip,
      limit: pagination.query.limit,
    }),
    [keyword, organizationId, pagination.query, status],
  )
  const publicationsQuery = useQuery({
    queryKey: workflowPublicationKeys.list(query),
    queryFn: () => workflowPublications_list(query),
    placeholderData: keepPreviousData,
  })
  const rollbackHistoryQuery = useQuery({
    queryKey: workflowPublicationKeys.list({
      organization_id: rollbackSource?.organization_id,
      keyword: rollbackSource?.workflow_app_id,
      skip: 0,
      limit: 500,
    }),
    queryFn: () =>
      workflowPublications_list({
        organization_id: rollbackSource?.organization_id,
        keyword: rollbackSource?.workflow_app_id,
        skip: 0,
        limit: 500,
      }),
    enabled: Boolean(rollbackSource),
  })
  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: workflowPublicationKeys.all,
    })
  }
  const actionMutation = useMutation({
    mutationFn: ({
      publication,
      action,
    }: {
      publication: WorkflowPluginPublication
      action: 'retry' | 'enable' | 'disable' | 'archive'
    }) => workflowPublications_action(publication, action),
    onSuccess: async () => {
      await refresh()
      message.success(t('pages.workflowPublications.actionSucceeded'))
    },
  })
  const rollbackMutation = useMutation({
    mutationFn: ({
      source,
      target,
    }: {
      source: WorkflowPluginPublication
      target: string
    }) => workflowPublications_rollback(source, target),
    onSuccess: async () => {
      setRollbackSource(undefined)
      setRollbackTarget(undefined)
      await refresh()
      message.success(t('pages.workflowPublications.rollbackSucceeded'))
    },
  })
  const rollbackOptions = (rollbackHistoryQuery.data?.data ?? [])
    .filter(
      (item) =>
        item.workflow_app_id === rollbackSource?.workflow_app_id &&
        item.workflow_version_id !== rollbackSource.workflow_version_id &&
        Boolean(item.plugin_version_id) &&
        item.status !== 'archived',
    )
    .map((item) => ({
      label: `${item.version} (${item.workflow_version_id})`,
      value: item.workflow_version_id,
    }))

  const columns = useMemo<TableProps<WorkflowPluginPublication>['columns']>(
    () => [
      {
        title: t('pages.workflowPublications.columns.workflow'),
        dataIndex: 'name',
        width: 230,
        render: (_, item) => (
          <Space className="min-w-0 max-w-full" orientation="vertical" size={0}>
            <Typography.Text
              className="max-w-full"
              ellipsis={{ tooltip: item.name }}
              strong
            >
              {item.name}
            </Typography.Text>
            <Typography.Text
              className="max-w-full"
              copyable
              ellipsis={{ tooltip: item.workflow_app_id }}
              type="secondary"
            >
              {item.workflow_app_id}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t('pages.workflowPublications.columns.version'),
        dataIndex: 'version',
        width: 210,
        render: (_, item) => (
          <Space className="min-w-0 max-w-full" orientation="vertical" size={0}>
            <Typography.Text
              className="max-w-full"
              ellipsis={{ tooltip: item.version }}
            >
              {item.version}
            </Typography.Text>
            <Typography.Text
              className="max-w-full"
              copyable
              ellipsis={{ tooltip: item.workflow_version_id }}
              type="secondary"
            >
              {item.workflow_version_id}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t('pages.workflowPublications.columns.status'),
        dataIndex: 'status',
        width: 130,
        render: (value: WorkflowPublicationStatus) => (
          <Tag color={statusColors[value]}>
            {t(`pages.workflowPublications.status.${value}`)}
          </Tag>
        ),
      },
      {
        title: t('pages.workflowPublications.columns.step'),
        dataIndex: 'current_step',
        width: 170,
        render: (value: string | null) => value ?? '-',
      },
      {
        title: t('pages.workflowPublications.columns.error'),
        dataIndex: 'last_error',
        width: 240,
        ellipsis: true,
        render: (value: Record<string, unknown> | null) => {
          const error = value?.message ? JSON.stringify(value.message) : '-'
          return <Tooltip title={error}>{error}</Tooltip>
        },
      },
      {
        title: t('pages.workflowPublications.columns.publishedAt'),
        dataIndex: 'published_at',
        width: 180,
        render: (value: string | null) =>
          value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-',
      },
      {
        title: t('pages.workflowPublications.columns.actions'),
        key: 'actions',
        fixed: 'right',
        width: 190,
        render: (_, item) => (
          <Space size={4}>
            {item.status === 'failed' ? (
              <Tooltip title={t('pages.workflowPublications.retry')}>
                <Button
                  aria-label={t('pages.workflowPublications.retry')}
                  icon={<ReloadOutlined />}
                  loading={actionMutation.isPending}
                  type="text"
                  onClick={() =>
                    actionMutation.mutate({
                      publication: item,
                      action: 'retry',
                    })
                  }
                />
              </Tooltip>
            ) : null}
            {item.status === 'disabled' ? (
              <Tooltip title={t('pages.workflowPublications.enable')}>
                <Button
                  aria-label={t('pages.workflowPublications.enable')}
                  icon={<PlayCircleOutlined />}
                  loading={actionMutation.isPending}
                  type="text"
                  onClick={() =>
                    actionMutation.mutate({
                      publication: item,
                      action: 'enable',
                    })
                  }
                />
              </Tooltip>
            ) : null}
            {item.status === 'published' ? (
              <Tooltip title={t('pages.workflowPublications.disable')}>
                <Button
                  aria-label={t('pages.workflowPublications.disable')}
                  icon={<PauseCircleOutlined />}
                  loading={actionMutation.isPending}
                  type="text"
                  onClick={() =>
                    actionMutation.mutate({
                      publication: item,
                      action: 'disable',
                    })
                  }
                />
              </Tooltip>
            ) : null}
            {item.status === 'published' ? (
              <Tooltip title={t('pages.workflowPublications.rollback')}>
                <Button
                  aria-label={t('pages.workflowPublications.rollback')}
                  icon={<RollbackOutlined />}
                  type="text"
                  onClick={() => setRollbackSource(item)}
                />
              </Tooltip>
            ) : null}
            {item.status === 'published' || item.status === 'disabled' ? (
              <Popconfirm
                title={t('pages.workflowPublications.archiveConfirm')}
                onConfirm={() =>
                  actionMutation.mutate({
                    publication: item,
                    action: 'archive',
                  })
                }
              >
                <Tooltip title={t('pages.workflowPublications.archive')}>
                  <Button
                    aria-label={t('pages.workflowPublications.archive')}
                    danger
                    icon={<DeleteOutlined />}
                    type="text"
                  />
                </Tooltip>
              </Popconfirm>
            ) : null}
          </Space>
        ),
      },
    ],
    [actionMutation, t],
  )

  return (
    <>
      <PageContainer className="p-5">
        <PageHeader
          subtitle={t('pages.workflowPublications.subtitle')}
          title={t('pages.workflowPublications.title')}
        >
          <Space>
            <Button
              icon={<ReloadOutlined />}
              loading={publicationsQuery.isFetching}
              onClick={() => void publicationsQuery.refetch()}
            >
              {t('common.actions.refresh')}
            </Button>
          </Space>
        </PageHeader>
        <PluginCenterTabs />
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input
            allowClear
            className="w-80"
            placeholder={t('pages.workflowPublications.search')}
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              pagination.reset()
            }}
          />
          <Select
            allowClear
            className="w-52"
            options={Object.keys(statusColors).map((value) => ({
              label: t(`pages.workflowPublications.status.${value}`),
              value,
            }))}
            placeholder={t('pages.workflowPublications.allStatuses')}
            value={status}
            onChange={(value) => {
              setStatus(value)
              pagination.reset()
            }}
          />
          <Typography.Text type="secondary">
            共 {publicationsQuery.data?.count ?? 0} 条
          </Typography.Text>
        </div>
        {publicationsQuery.isError ? (
          <Alert
            className="mb-3"
            message={t('pages.workflowPublications.loadFailed')}
            showIcon
            type="error"
          />
        ) : null}
        <Table
          columns={columns}
          dataSource={publicationsQuery.data?.data ?? []}
          loading={publicationsQuery.isPending}
          pagination={{
            ...pagination.props,
            total: publicationsQuery.data?.count ?? 0,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowKey="id"
          scroll={{ x: 1350 }}
          size="middle"
          tableLayout="fixed"
        />
      </PageContainer>
      <Modal
        confirmLoading={rollbackMutation.isPending}
        okButtonProps={{ disabled: !rollbackTarget }}
        open={Boolean(rollbackSource)}
        title={t('pages.workflowPublications.rollbackTitle')}
        onCancel={() => {
          setRollbackSource(undefined)
          setRollbackTarget(undefined)
        }}
        onOk={() => {
          if (rollbackSource && rollbackTarget) {
            rollbackMutation.mutate({
              source: rollbackSource,
              target: rollbackTarget,
            })
          }
        }}
      >
        <Typography.Paragraph type="secondary">
          {t('pages.workflowPublications.rollbackDescription')}
        </Typography.Paragraph>
        <Select
          className="w-full"
          options={rollbackOptions}
          placeholder={t('pages.workflowPublications.rollbackTarget')}
          value={rollbackTarget}
          onChange={setRollbackTarget}
        />
      </Modal>
    </>
  )
}
