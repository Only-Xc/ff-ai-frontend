import { ReloadOutlined } from '@ant-design/icons'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Empty,
  Input,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
} from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  stageSwitchKeys,
  stageSwitchRequests_list,
  stageSwitchTasks_list,
  type StageSwitchApprovalStatus,
  type StageSwitchDirection,
  type StageSwitchExecutionStatus,
  type StageSwitchRequest,
  type StageSwitchRequestListQuery,
  type StageSwitchTaskListQuery,
} from '@/api/stage-switch'
import { usePaginationParams } from '@/hooks/usePaginationParams'

import {
  APPROVAL_STATUS_OPTIONS,
  DIRECTION_OPTIONS,
  EXECUTION_STATUS_OPTIONS,
  approvalStatusColor,
  approvalStatusLabel,
  directionColor,
  directionLabel,
  executionStatusColor,
  executionStatusLabel,
} from './status'

type RequestListTab = 'myTodo' | 'all'
type TaskStatus = NonNullable<StageSwitchTaskListQuery['status']>

function formatDateTime(value: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

export default function RequestList() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<RequestListTab>('myTodo')
  const [keyword, setKeyword] = useState('')
  const [approvalStatus, setApprovalStatus] =
    useState<StageSwitchApprovalStatus>()
  const [executionStatus, setExecutionStatus] =
    useState<StageSwitchExecutionStatus>()
  const [direction, setDirection] = useState<StageSwitchDirection>()
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('pending')
  const todoPagination = usePaginationParams()
  const allPagination = usePaginationParams()

  const taskParams = useMemo<StageSwitchTaskListQuery>(
    () => ({
      status: taskStatus,
      ...todoPagination.query,
    }),
    [taskStatus, todoPagination.query],
  )

  const requestParams = useMemo<StageSwitchRequestListQuery>(
    () => ({
      keyword: keyword || undefined,
      approval_status: approvalStatus,
      execution_status: executionStatus,
      direction,
      ...allPagination.query,
    }),
    [
      allPagination.query,
      approvalStatus,
      direction,
      executionStatus,
      keyword,
    ],
  )

  const tasksQuery = useQuery({
    queryKey: stageSwitchKeys.taskList(taskParams),
    queryFn: () => stageSwitchTasks_list(taskParams),
    placeholderData: keepPreviousData,
    enabled: activeTab === 'myTodo',
  })

  const requestsQuery = useQuery({
    queryKey: stageSwitchKeys.requestList(requestParams),
    queryFn: () => stageSwitchRequests_list(requestParams),
    placeholderData: keepPreviousData,
    enabled: activeTab === 'all',
  })

  const activeQuery = activeTab === 'myTodo' ? tasksQuery : requestsQuery
  const activePagination =
    activeTab === 'myTodo' ? todoPagination : allPagination
  const rows = activeQuery.data?.data ?? []
  const total = activeQuery.data?.total ?? 0

  const columns = useMemo<TableProps<StageSwitchRequest>['columns']>(
    () => [
      {
        title: t('pages.stageSwitch.columns.requestNo'),
        dataIndex: 'request_no',
        width: 190,
        render: (value: string, record) => (
          <Button
            type="link"
            className="h-auto p-0!"
            onClick={(event) => {
              event.stopPropagation()
              void navigate(`/stage-switch/requests/${record.id}`)
            }}
          >
            {value}
          </Button>
        ),
      },
      {
        title: t('pages.stageSwitch.columns.agentId'),
        dataIndex: 'agent_id',
        width: 200,
        ellipsis: true,
      },
      {
        title: t('pages.stageSwitch.columns.direction'),
        dataIndex: 'direction',
        width: 110,
        render: (value: StageSwitchDirection) => (
          <Tag color={directionColor(value)}>{directionLabel(value, t)}</Tag>
        ),
      },
      {
        title: t('pages.stageSwitch.columns.stageChange'),
        key: 'stageChange',
        width: 190,
        render: (_, record) =>
          t('pages.stageSwitch.columns.stageChangeValue', {
            source: record.source_stage,
            target: record.target_stage,
          }),
      },
      {
        title: t('pages.stageSwitch.columns.approvalStatus'),
        dataIndex: 'approval_status',
        width: 140,
        render: (value: StageSwitchApprovalStatus) => (
          <Tag color={approvalStatusColor(value)}>
            {approvalStatusLabel(value, t)}
          </Tag>
        ),
      },
      {
        title: t('pages.stageSwitch.columns.executionStatus'),
        dataIndex: 'execution_status',
        width: 140,
        render: (value: StageSwitchExecutionStatus) => (
          <Tag color={executionStatusColor(value)}>
            {executionStatusLabel(value, t)}
          </Tag>
        ),
      },
      {
        title: t('pages.stageSwitch.columns.createdAt'),
        dataIndex: 'created_at',
        width: 170,
        render: formatDateTime,
      },
    ],
    [navigate, t],
  )

  const resetAllFilters = () => {
    setKeyword('')
    setApprovalStatus(undefined)
    setExecutionStatus(undefined)
    setDirection(undefined)
    allPagination.reset()
  }

  return (
    <PageContainer className="p-5">
      <PageHeader
        title={t('routes.stageSwitch.requests.title')}
        subtitle={t('routes.stageSwitch.requests.subtitle')}
      >
        <Button
          icon={<ReloadOutlined />}
          loading={activeQuery.isFetching}
          onClick={() => void activeQuery.refetch()}
        >
          {t('common.actions.refresh')}
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented
          value={activeTab}
          options={[
            {
              value: 'myTodo',
              label: t('pages.stageSwitch.tabs.myTodo'),
            },
            { value: 'all', label: t('pages.stageSwitch.tabs.all') },
          ]}
          onChange={(value) => {
            setActiveTab(value as RequestListTab)
            if (value === 'myTodo') todoPagination.reset()
            else allPagination.reset()
          }}
        />

        {activeTab === 'myTodo' ? (
          <Select<TaskStatus>
            value={taskStatus}
            className="w-40"
            options={[
              {
                value: 'pending',
                label: t('pages.stageSwitch.filters.pendingTasks'),
              },
              {
                value: 'overdue',
                label: t('pages.stageSwitch.filters.overdueTasks'),
              },
            ]}
            onChange={(value) => {
              setTaskStatus(value)
              todoPagination.reset()
            }}
          />
        ) : (
          <Space wrap>
            <Input.Search
              allowClear
              className="w-60"
              placeholder={t('pages.stageSwitch.filters.keywordPlaceholder')}
              onSearch={(value) => {
                setKeyword(value.trim())
                allPagination.reset()
              }}
            />
            <Select<StageSwitchDirection>
              allowClear
              className="w-36"
              placeholder={t('pages.stageSwitch.filters.direction')}
              options={DIRECTION_OPTIONS.map((item) => ({
                value: item.value,
                label: t(item.labelKey),
              }))}
              value={direction}
              onChange={(value) => {
                setDirection(value)
                allPagination.reset()
              }}
            />
            <Select<StageSwitchApprovalStatus>
              allowClear
              className="w-44"
              placeholder={t('pages.stageSwitch.filters.approvalStatus')}
              options={APPROVAL_STATUS_OPTIONS.map((item) => ({
                value: item.value,
                label: t(item.labelKey),
              }))}
              value={approvalStatus}
              onChange={(value) => {
                setApprovalStatus(value)
                allPagination.reset()
              }}
            />
            <Select<StageSwitchExecutionStatus>
              allowClear
              className="w-44"
              placeholder={t('pages.stageSwitch.filters.executionStatus')}
              options={EXECUTION_STATUS_OPTIONS.map((item) => ({
                value: item.value,
                label: t(item.labelKey),
              }))}
              value={executionStatus}
              onChange={(value) => {
                setExecutionStatus(value)
                allPagination.reset()
              }}
            />
            <Button onClick={resetAllFilters}>
              {t('common.actions.reset')}
            </Button>
          </Space>
        )}
      </div>

      {activeQuery.isError ? (
        <Alert
          showIcon
          className="mb-4"
          type="error"
          title={t('pages.stageSwitch.list.loadFailed')}
          description={
            activeQuery.error instanceof Error
              ? activeQuery.error.message
              : t('common.errors.requestFailed')
          }
          action={
            <Button size="small" onClick={() => void activeQuery.refetch()}>
              {t('common.actions.retry')}
            </Button>
          }
        />
      ) : null}

      <Table<StageSwitchRequest>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={activeQuery.isFetching}
        scroll={{ x: 1140 }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t(
                activeTab === 'myTodo'
                  ? 'pages.stageSwitch.list.noTasks'
                  : 'pages.stageSwitch.list.noRequests',
              )}
            />
          ),
        }}
        pagination={{
          ...activePagination.props,
          total,
          showTotal: (value) =>
            t('pages.stageSwitch.list.total', { total: value }),
        }}
        onRow={(record) => ({
          className: 'cursor-pointer',
          onClick: () => void navigate(`/stage-switch/requests/${record.id}`),
        })}
      />
    </PageContainer>
  )
}
