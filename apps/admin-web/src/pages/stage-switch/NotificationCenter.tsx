import { CheckOutlined, ReloadOutlined } from '@ant-design/icons'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Badge,
  Button,
  Empty,
  List,
  Popconfirm,
  Segmented,
  Space,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import {
  stageSwitchKeys,
  stageSwitchNotification_read,
  stageSwitchNotifications_list,
  stageSwitchNotifications_readAll,
  stageSwitchNotifications_unreadCount,
  type StageSwitchNotification,
  type StageSwitchNotificationListQuery,
} from '@/api/stage-switch'
import { usePaginationParams } from '@/hooks/usePaginationParams'

export default function NotificationCenter() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const pagination = usePaginationParams()
  const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread')

  const query = useMemo<StageSwitchNotificationListQuery>(
    () => ({
      status: activeTab === 'unread' ? 'UNREAD' : undefined,
      ...pagination.query,
    }),
    [activeTab, pagination.query],
  )

  const notificationsQuery = useQuery({
    queryKey: stageSwitchKeys.notifications(query),
    queryFn: () => stageSwitchNotifications_list(query),
    placeholderData: keepPreviousData,
  })
  const unreadCountQuery = useQuery({
    queryKey: stageSwitchKeys.unreadCount(),
    queryFn: stageSwitchNotifications_unreadCount,
  })

  const invalidateNotifications = () => {
    void queryClient.invalidateQueries({
      queryKey: stageSwitchKeys.notificationLists(),
    })
    void queryClient.invalidateQueries({
      queryKey: stageSwitchKeys.unreadCount(),
    })
  }

  const readMutation = useMutation({
    mutationFn: (notification: StageSwitchNotification) =>
      stageSwitchNotification_read(notification.id),
    onSuccess: () => {
      invalidateNotifications()
    },
    onError: (error) => {
      void message.error(
        error instanceof Error
          ? error.message
          : t('common.errors.operationFailed'),
      )
    },
  })

  const readAllMutation = useMutation({
    mutationFn: stageSwitchNotifications_readAll,
    onSuccess: (result) => {
      void message.success(
        t('pages.stageSwitch.notifications.readAllSuccess', {
          count: result.updated_count,
        }),
      )
      invalidateNotifications()
    },
    onError: (error) => {
      void message.error(
        error instanceof Error
          ? error.message
          : t('common.errors.operationFailed'),
      )
    },
  })

  const openNotification = async (notification: StageSwitchNotification) => {
    if (notification.status === 'UNREAD') {
      try {
        await readMutation.mutateAsync(notification)
      } catch {
        return
      }
    }
    if (notification.request_id) {
      void navigate(`/stage-switch/requests/${notification.request_id}`)
    }
  }

  const renderTranslation = (
    key: string,
    payload: Record<string, unknown>,
  ) => t(key, { ...payload, defaultValue: key })

  return (
    <PageContainer className="p-5">
      <PageHeader
        title={t('routes.stageSwitch.notifications.title')}
        subtitle={t('routes.stageSwitch.notifications.subtitle')}
      >
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            loading={notificationsQuery.isFetching}
            onClick={() => {
              void notificationsQuery.refetch()
              void unreadCountQuery.refetch()
            }}
          >
            {t('common.actions.refresh')}
          </Button>
          <Popconfirm
            title={t('pages.stageSwitch.notifications.readAllConfirm')}
            okText={t('common.actions.confirm')}
            cancelText={t('common.actions.cancel')}
            disabled={(unreadCountQuery.data?.count ?? 0) === 0}
            onConfirm={() => readAllMutation.mutate()}
          >
            <Button
              icon={<CheckOutlined />}
              disabled={(unreadCountQuery.data?.count ?? 0) === 0}
              loading={readAllMutation.isPending}
            >
              {t('pages.stageSwitch.notifications.markAllRead')}
            </Button>
          </Popconfirm>
        </Space>
      </PageHeader>

      <div className="mb-4">
        <Segmented
          value={activeTab}
          options={[
            {
              value: 'unread',
              label: (
                <Space size="small">
                  {t('pages.stageSwitch.notifications.tabs.unread')}
                  <Badge
                    count={unreadCountQuery.data?.count ?? 0}
                    overflowCount={999}
                  />
                </Space>
              ),
            },
            {
              value: 'all',
              label: t('pages.stageSwitch.notifications.tabs.all'),
            },
          ]}
          onChange={(value) => {
            setActiveTab(value as 'unread' | 'all')
            pagination.reset()
          }}
        />
      </div>

      {notificationsQuery.isError ? (
        <Alert
          showIcon
          className="mb-4"
          type="error"
          title={t('pages.stageSwitch.notifications.loadFailed')}
          description={
            notificationsQuery.error instanceof Error
              ? notificationsQuery.error.message
              : t('common.errors.requestFailed')
          }
          action={
            <Button size="small" onClick={() => void notificationsQuery.refetch()}>
              {t('common.actions.retry')}
            </Button>
          }
        />
      ) : null}

      <List<StageSwitchNotification>
        bordered
        loading={notificationsQuery.isFetching}
        dataSource={notificationsQuery.data?.data ?? []}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t(
                activeTab === 'unread'
                  ? 'pages.stageSwitch.notifications.emptyUnread'
                  : 'pages.stageSwitch.notifications.emptyAll',
              )}
            />
          ),
        }}
        pagination={{
          ...pagination.props,
          total: notificationsQuery.data?.total ?? 0,
          showTotal: (total) => t('common.labels.totalCount', { total }),
        }}
        renderItem={(notification) => {
          const unread = notification.status === 'UNREAD'
          const pending =
            readMutation.isPending && readMutation.variables?.id === notification.id
          return (
            <List.Item
              className={notification.request_id ? 'cursor-pointer' : undefined}
              onClick={() => void openNotification(notification)}
              actions={
                unread
                  ? [
                      <Button
                        key="read"
                        type="link"
                        size="small"
                        loading={pending}
                        onClick={(event) => {
                          event.stopPropagation()
                          readMutation.mutate(notification)
                        }}
                      >
                        {t('pages.stageSwitch.notifications.markRead')}
                      </Button>,
                    ]
                  : undefined
              }
            >
              <List.Item.Meta
                avatar={<Badge status={unread ? 'processing' : 'default'} />}
                title={
                  <Space wrap>
                    <Typography.Text strong={unread}>
                      {renderTranslation(notification.title_key, notification.payload)}
                    </Typography.Text>
                    {unread ? (
                      <Typography.Text type="secondary">
                        {t('pages.stageSwitch.notifications.unreadLabel')}
                      </Typography.Text>
                    ) : null}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={2}>
                    <Typography.Text type="secondary">
                      {renderTranslation(notification.body_key, notification.payload)}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {dayjs(notification.created_at).format('YYYY-MM-DD HH:mm')}
                    </Typography.Text>
                  </Space>
                }
              />
            </List.Item>
          )
        }}
      />
    </PageContainer>
  )
}
