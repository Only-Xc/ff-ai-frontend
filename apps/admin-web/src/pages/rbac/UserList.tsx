import {
  KeyOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Button, Card, Form, Input, message, Modal, Popconfirm, Space, Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  adminRoles_list,
  adminUsers_issueDataGatewayToken,
  adminUsers_create,
  adminUsers_delete,
  adminUsers_list,
  adminUsers_update,
  rbacKeys,
  userRoles_list,
  type DataGatewayToken,
  type User,
  type UserCreateBody,
  type UserListQuery,
  type UserUpdateBody,
  type UserRoleAssignment,
} from '@/api/rbac'
import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { usePermission } from '@/hooks/usePermission'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { useLocale } from '@/i18n/useLocale'
import { useAuthStore } from '@/store/useAuth'
import { UserFormDrawer } from './UserFormDrawer'
import { UserRoleDrawer } from './UserRoleDrawer'
import { getRoleDisplayName } from './roleDisplay'

const { Search } = Input

// Resolve role IDs to short display names
function useRoleNameMap() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { data } = useQuery({
    queryKey: rbacKeys.roles({ keyword: '', skip: 0, limit: 200 }),
    queryFn: () => adminRoles_list({ keyword: '', skip: 0, limit: 200 }),
  })
  return useMemo(() => {
    const map = new Map<string, string>()
    for (const r of data?.data ?? []) {
      map.set(r.id, getRoleDisplayName(r, locale, t))
    }
    return map
  }, [data, locale, t])
}

// Component that renders a user's roles as tags
function UserRolesCell({ userId }: { userId: string }) {
  const roleNameMap = useRoleNameMap()
  const { data: assignments } = useQuery({
    queryKey: rbacKeys.userRoles(userId),
    queryFn: () => userRoles_list(userId),
    staleTime: 30_000,
  })

  const roleIds = assignments?.map((a: UserRoleAssignment) => a.role_id) ?? []

  if (roleIds.length === 0) {
    return <Tag>viewer</Tag>
  }
  return (
    <Space size={[4, 4]} wrap>
      {roleIds.map((rid) => (
        <Tag key={rid} style={{ margin: 0 }}>
          {roleNameMap.get(rid) ?? rid.slice(0, 8)}
        </Tag>
      ))}
    </Space>
  )
}

export default function UserList() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { hasPermission } = usePermission()
  const isCurrentUserSuperuser = useAuthStore((state) =>
    Boolean(state.user?.is_superuser),
  )
  const pagination = usePaginationParams({ defaultPageSize: 20 })

  const [filters, setFilters] = useState<{ keyword?: string }>({})
  const isPlatformAdmin =
    useAuthStore((state) => state.user?.is_superuser) === true ||
    useAuthStore((state) => state.roleCodes).includes('system_admin')

  const [formDrawerState, setFormDrawerState] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    userId?: string
    detail?: Partial<User>
  }>({ open: false, mode: 'create' })
  const [permTarget, setPermTarget] = useState<{
    userId: string
    userName: string
  } | null>(null)
  const [gatewayTokenTarget, setGatewayTokenTarget] = useState<{
    user: User
    token: DataGatewayToken
  } | null>(null)

  const listParams = useMemo<UserListQuery>(
    () => ({
      ...filters,
      ...pagination.query,
    }),
    [filters, pagination.query],
  )

  const usersQuery = useQuery({
    queryKey: rbacKeys.users(listParams),
    queryFn: () => adminUsers_list(listParams),
    placeholderData: keepPreviousData,
  })

  const createMutation = useMutation({
    mutationFn: adminUsers_create,
    onSuccess: () => {
      message.success(t('pages.rbac.messages.userCreated'))
      setFormDrawerState({ open: false, mode: 'create' })
      pagination.reset()
      void queryClient.invalidateQueries({ queryKey: rbacKeys.all })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Parameters<typeof adminUsers_update>[1] }) =>
      adminUsers_update(userId, data),
    onSuccess: () => {
      message.success(t('pages.rbac.messages.userUpdated'))
      setFormDrawerState({ open: false, mode: 'edit' })
      void queryClient.invalidateQueries({ queryKey: rbacKeys.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminUsers_delete,
    onSuccess: () => {
      message.success(t('pages.rbac.messages.userDeleted'))
      const remaining = usersQuery.data?.data?.length ?? 0
      if (remaining === 0 && pagination.current > 1) {
        pagination.setCurrent(pagination.current - 1)
      }
      void queryClient.invalidateQueries({ queryKey: rbacKeys.all })
    },
  })

  const issueGatewayTokenMutation = useMutation({
    mutationFn: adminUsers_issueDataGatewayToken,
  })

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, keyword: value || undefined }))
    pagination.reset()
  }

  const openCreateDrawer = () => {
    setFormDrawerState({ open: true, mode: 'create' })
  }

  const openEditDrawer = (user: User) => {
    setFormDrawerState({ open: true, mode: 'edit', userId: user.id, detail: user })
  }

  const handleFormSubmit = async (values: UserCreateBody | UserUpdateBody) => {
    if (formDrawerState.mode === 'create') {
      await createMutation.mutateAsync(values as UserCreateBody)
    } else if (formDrawerState.userId) {
      await updateMutation.mutateAsync({
        userId: formDrawerState.userId,
        data: values,
      })
    }
  }

  const openGatewayTokenModal = async (user: User) => {
    const token = await issueGatewayTokenMutation.mutateAsync(user.id)
    setGatewayTokenTarget({ user, token })
    message.success(t('pages.rbac.messages.gatewayTokenIssued'))
  }

  const columns: TableProps<User>['columns'] = [
    {
      title: t('pages.rbac.columns.userName'),
      dataIndex: 'full_name',
      key: 'full_name',
      render: (value: string | null, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>
            {value ?? t('pages.rbac.columns.noName')}
          </Typography.Text>
          <Typography.Text className="text-xs" type="secondary">
            {record.email}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('pages.rbac.columns.role'),
      key: 'roles',
      width: 200,
      render: (_, record) => <UserRolesCell userId={record.id} />,
    },
    {
      title: t('pages.rbac.columns.tenant'),
      key: 'tenant',
      width: 180,
      render: (_, record) => {
        const org = record.primary_organization
        if (!org) return <Tag>{t('pages.rbac.status.noTenant')}</Tag>
        return <Tag color="blue">{org.name}</Tag>
      },
    },
    {
      title: t('pages.rbac.columns.status'),
      key: 'is_active',
      width: 100,
      render: (_, record) => (
        <Tag color={record.is_active ? 'green' : 'default'}>
          {record.is_active
            ? t('pages.rbac.status.active')
            : t('pages.rbac.status.disabled')}
        </Tag>
      ),
    },
    {
      title: t('pages.rbac.columns.superuser'),
      dataIndex: 'is_superuser',
      key: 'is_superuser',
      width: 100,
      render: (value: boolean) =>
        value ? (
          <Tag color="red">{t('pages.rbac.status.superuser')}</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: t('pages.rbac.columns.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (value: string | null) =>
        value ? new Date(value).toLocaleString() : '-',
    },
    {
      title: t('pages.rbac.columns.action'),
      key: 'action',
      width: 300,
      render: (_, record) => (
        <Space size={2}>
          {isCurrentUserSuperuser && hasPermission('admin.users.update') && (
            <Button
              size="small"
              type="link"
              onClick={() => openEditDrawer(record)}
            >
              {t('common.actions.edit')}
            </Button>
          )}
          {hasPermission('admin.users.update') && (
            <Button
              size="small"
              type="link"
              onClick={() =>
                setPermTarget({
                  userId: record.id,
                  userName: record.full_name ?? record.email,
                })
              }
              title={t('pages.rbac.actions.assignRoles')}
            >
              <TeamOutlined />
            </Button>
          )}
          {hasPermission('admin.users.update') && (
            <Button
              icon={<KeyOutlined />}
              loading={
                issueGatewayTokenMutation.isPending &&
                issueGatewayTokenMutation.variables === record.id
              }
              size="small"
              type="link"
              onClick={() => {
                void openGatewayTokenModal(record)
              }}
            >
              {t('pages.rbac.actions.gatewayToken')}
            </Button>
          )}
          {hasPermission('admin.users.delete') && !record.is_superuser && (
            <Popconfirm
              title={t('pages.rbac.actions.deleteConfirmTitle')}
              description={t('pages.rbac.actions.deleteConfirmDescription', {
                name: record.full_name ?? record.email,
              })}
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText={t('common.actions.delete')}
              okButtonProps={{ danger: true }}
              cancelText={t('common.actions.cancel')}
            >
              <Button
                size="small"
                type="link"
                danger
              >
                {t('common.actions.delete')}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <PageContainer className="min-h-full p-4">
      <PageHeader
        title={
          <Space>
            <SafetyCertificateOutlined />
            {t('pages.rbac.userManagement.title')}
          </Space>
        }
        subtitle={t('pages.rbac.userManagement.subtitle')}
      >
        <Space>
          {hasPermission('admin.users.create') && (
            <Button icon={<PlusOutlined />} onClick={openCreateDrawer}>
              {t('pages.rbac.actions.newUser')}
            </Button>
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              void usersQuery.refetch()
            }}
            loading={usersQuery.isFetching}
          >
            {t('pages.rbac.actions.refresh')}
          </Button>
        </Space>
      </PageHeader>

      <Card className="mb-4">
        <Form layout="inline">
          <Form.Item>
            <Search
              placeholder={t('pages.rbac.filters.keyword')}
              onSearch={handleSearch}
              allowClear
              style={{ width: 240 }}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card styles={{ body: { padding: 0 } }}>
        <Table<User>
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={usersQuery.data?.data ?? []}
          loading={usersQuery.isLoading || usersQuery.isFetching}
          pagination={{
            ...pagination.props,
            total: usersQuery.data?.count ?? 0,
            showTotal: (total) =>
              t('pages.rbac.pagination.total', { total }),
          }}
        />
      </Card>

      {/* User Form Drawer */}
      {formDrawerState.open && (
        <UserFormDrawer
          open
          mode={formDrawerState.mode}
          initialValues={formDrawerState.detail}
          isPlatformAdmin={isPlatformAdmin}
          onSubmit={handleFormSubmit}
          onClose={() =>
            setFormDrawerState({ open: false, mode: 'create' })
          }
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Permission/Role Drawer */}
      {permTarget && (
        <UserRoleDrawer
          userId={permTarget.userId}
          userName={permTarget.userName}
          open
          onClose={() => setPermTarget(null)}
        />
      )}

      <Modal
        destroyOnHidden
        footer={null}
        open={Boolean(gatewayTokenTarget)}
        title={t('pages.rbac.gatewayToken.title')}
        width={720}
        onCancel={() => setGatewayTokenTarget(null)}
      >
        {gatewayTokenTarget ? (
          <Space className="w-full" direction="vertical" size={12}>
            <Typography.Text type="secondary">
              {t('pages.rbac.gatewayToken.description', {
                name:
                  gatewayTokenTarget.user.full_name ??
                  gatewayTokenTarget.user.email,
              })}
            </Typography.Text>
            <Space size={8} wrap>
              <Tag color="blue">
                {t('pages.rbac.gatewayToken.subject', {
                  value: gatewayTokenTarget.token.subject_id,
                })}
              </Tag>
              <Tag color="cyan">
                {t('pages.rbac.gatewayToken.expiresAt', {
                  value: dayjs(gatewayTokenTarget.token.expires_at).format(
                    'YYYY-MM-DD HH:mm',
                  ),
                })}
              </Tag>
            </Space>
            <Typography.Paragraph
              className="max-h-56 overflow-auto rounded-lg border border-(--border) bg-(--control-subtle-bg) p-3!"
              copyable={{ text: gatewayTokenTarget.token.access_token }}
            >
              <Typography.Text code>
                {gatewayTokenTarget.token.access_token}
              </Typography.Text>
            </Typography.Paragraph>
            <Typography.Text type="secondary">
              {t('pages.rbac.gatewayToken.usageHint')}
            </Typography.Text>
          </Space>
        ) : null}
      </Modal>
    </PageContainer>
  )
}
