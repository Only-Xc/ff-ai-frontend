import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableProps } from 'antd'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  adminOrganizations_tree,
  adminRoles_create,
  adminRoles_delete,
  adminRoles_get,
  adminRoles_list,
  adminRoles_update,
  rbacKeys,
  type Role,
  type RoleDetail,
  type RoleListQuery,
} from '@/api/rbac'
import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { usePermission } from '@/hooks/usePermission'
import { usePaginationParams } from '@/hooks/usePaginationParams'
import { useAuthStore } from '@/store/useAuth'
import { globalMessage } from '@/utils/message'
import { RoleFormDrawer } from './RoleFormDrawer'
import { RolePermissionDrawer } from './RolePermissionDrawer'
import { OrganizationTreePanel } from './OrganizationTreePanel'
import type { RoleFormValues } from './types'

const { Search } = Input

export default function RoleList() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { hasPermission } = usePermission()
  const pagination = usePaginationParams({ defaultPageSize: 20 })

  const [filters, setFilters] = useState<{ keyword?: string; scope_type?: string }>({})
  const [formDrawerState, setFormDrawerState] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    roleId?: string
    detail?: RoleDetail
  }>({ open: false, mode: 'create' })
  const [permRoleId, setPermRoleId] = useState<string | null>(null)
  const [showOrgPanel, setShowOrgPanel] = useState(false)

  const listParams = useMemo<RoleListQuery>(
    () => ({
      ...filters,
      ...pagination.query,
    }),
    [filters, pagination.query],
  )

  const rolesQuery = useQuery({
    queryKey: rbacKeys.roles(listParams),
    queryFn: () => adminRoles_list(listParams),
    placeholderData: keepPreviousData,
  })

  const orgsQuery = useQuery({
    queryKey: rbacKeys.organizations(),
    queryFn: adminOrganizations_tree,
  })

  const orgTree = orgsQuery.data ?? []

  const createMutation = useMutation({
    mutationFn: adminRoles_create,
    onSuccess: () => {
      message.success(t('pages.rbac.messages.roleCreated'))
      setFormDrawerState({ open: false, mode: 'create' })
      pagination.reset()
      void queryClient.invalidateQueries({ queryKey: rbacKeys.all })
      void useAuthStore.getState().refreshRbacProfile()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: Parameters<typeof adminRoles_update>[1] }) =>
      adminRoles_update(roleId, data),
    onSuccess: () => {
      message.success(t('pages.rbac.messages.roleUpdated'))
      setFormDrawerState({ open: false, mode: 'edit' })
      void queryClient.invalidateQueries({ queryKey: rbacKeys.all })
      void useAuthStore.getState().refreshRbacProfile()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminRoles_delete,
    onSuccess: () => {
      message.success(t('pages.rbac.messages.roleDeleted'))
      const remaining = rolesQuery.data?.data?.length ?? 0
      if (remaining === 0 && pagination.current > 1) {
        pagination.setCurrent(pagination.current - 1)
      }
      void queryClient.invalidateQueries({ queryKey: rbacKeys.all })
      void useAuthStore.getState().refreshRbacProfile()
    },
  })

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, keyword: value || undefined }))
    pagination.reset()
  }

  const handleScopeChange = (value: string | undefined) => {
    setFilters((prev) => ({ ...prev, scope_type: value }))
    pagination.reset()
  }

  const openCreateDrawer = () => {
    setFormDrawerState({ open: true, mode: 'create' })
  }

  const openEditDrawer = async (role: Role) => {
    try {
      const detail = await adminRoles_get(role.id)
      setFormDrawerState({ open: true, mode: 'edit', roleId: role.id, detail })
    } catch {
      message.error(t('pages.rbac.errors.detailLoadFailed'))
    }
  }

  const handleFormSubmit = async (values: RoleFormValues) => {
    if (formDrawerState.mode === 'create') {
      await createMutation.mutateAsync(values)
    } else if (formDrawerState.roleId) {
      await updateMutation.mutateAsync({
        roleId: formDrawerState.roleId,
        data: values,
      })
    }
  }

  const columns: TableProps<Role>['columns'] = [
    {
      title: t('pages.rbac.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text className="text-xs" type="secondary">
            {record.code}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('pages.rbac.columns.scope'),
      dataIndex: 'scope_type',
      key: 'scope_type',
      width: 120,
      render: (value: string) => <Tag>{value}</Tag>,
      filters: [
        { text: 'system', value: 'system' },
        { text: 'organization', value: 'organization' },
      ],
      onFilter: (value, record) => record.scope_type === value,
    },
    {
      title: t('pages.rbac.columns.organization'),
      key: 'organization_id',
      width: 140,
      render: (_: unknown, record) => {
        if (!record.organization_id) return '-'
        const org = findOrgById(orgTree, record.organization_id)
        return org ? org.name : record.organization_id.slice(0, 8)
      },
    },
    {
      title: t('pages.rbac.columns.permissions'),
      dataIndex: 'permission_count',
      key: 'permission_count',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.permission_count - b.permission_count,
    },
    {
      title: t('pages.rbac.columns.users'),
      dataIndex: 'user_count',
      key: 'user_count',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.user_count - b.user_count,
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
      filters: [
        { text: t('pages.rbac.status.active'), value: true },
        { text: t('pages.rbac.status.disabled'), value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: t('pages.rbac.columns.system'),
      dataIndex: 'is_system',
      key: 'is_system',
      width: 100,
      render: (value: boolean) =>
        value ? (
          <Tag color="blue">{t('pages.rbac.status.system')}</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: t('pages.rbac.columns.action'),
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size={2}>
          {hasPermission('admin.roles.update') && (
            <Button
              size="small"
              type="link"
              onClick={() => openEditDrawer(record)}
              disabled={record.is_system}
            >
              {t('common.actions.edit')}
            </Button>
          )}
          {hasPermission('admin.roles.update') && (
            <Button
              size="small"
              type="link"
              onClick={() => setPermRoleId(record.id)}
              title={t('pages.rbac.actions.configurePermissions')}
            >
              <SettingOutlined />
            </Button>
          )}
          {hasPermission('admin.roles.delete') && (
            <Popconfirm
              title={t('pages.rbac.actions.deleteConfirmTitle')}
              description={
                record.is_system
                  ? t('pages.rbac.actions.deleteSystemRoleWarning')
                  : t('pages.rbac.actions.deleteConfirmDescription', { name: record.name })
              }
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText={t('common.actions.delete')}
              okButtonProps={{ danger: true }}
              cancelText={t('common.actions.cancel')}
              disabled={record.is_system}
            >
              <Button
                size="small"
                type="link"
                danger
                disabled={record.is_system}
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
            {t('pages.rbac.title')}
          </Space>
        }
        subtitle={t('pages.rbac.subtitle')}
      >
        <Space>
          {hasPermission('admin.roles.create') && (
            <Button icon={<PlusOutlined />} onClick={openCreateDrawer}>
              {t('pages.rbac.actions.newRole')}
            </Button>
          )}
          {hasPermission('admin.orgs.read') && (
            <Button
              icon={<TeamOutlined />}
              onClick={() => setShowOrgPanel(true)}
            >
              {t('pages.rbac.actions.manageOrganizations')}
            </Button>
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              rolesQuery.refetch()
              orgsQuery.refetch()
            }}
            loading={rolesQuery.isFetching}
          >
            {t('pages.rbac.actions.refresh')}
          </Button>
        </Space>
      </PageHeader>

      <Card className="mb-4">
        <Form layout="inline" initialValues={{ keyword: '' }}>
          <Form.Item name="keyword">
            <Search
              placeholder={t('pages.rbac.filters.keyword')}
              onSearch={handleSearch}
              onPressEnter={handleSearch}
              allowClear
              style={{ width: 240 }}
            />
          </Form.Item>
          <Form.Item label={t('pages.rbac.filters.scope')}>
            <Select
              placeholder={t('pages.rbac.filters.allScopes')}
              allowClear
              onChange={handleScopeChange}
              style={{ width: 160 }}
              options={[
                { value: 'system', label: t('pages.rbac.scope.system') },
                { value: 'organization', label: t('pages.rbac.scope.organization') },
              ]}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card styles={{ body: { padding: 0 } }}>
        <Table<Role>
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={rolesQuery.data?.data ?? []}
          loading={rolesQuery.isLoading || rolesQuery.isFetching}
          pagination={{
            ...pagination.props,
            total: rolesQuery.data?.count ?? 0,
            showTotal: (total) =>
              t('pages.rbac.pagination.total', { total }),
          }}
        />
      </Card>

      {/* Role Form Drawer */}
      {formDrawerState.open && (
        <RoleFormDrawer
          open
          mode={formDrawerState.mode}
          initialValues={formDrawerState.detail}
          organizations={orgTree}
          onSubmit={handleFormSubmit}
          onClose={() =>
            setFormDrawerState({ open: false, mode: 'create' })
          }
          submitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Permission Drawer */}
      <RolePermissionDrawer
        roleId={permRoleId}
        open={Boolean(permRoleId)}
        onClose={() => setPermRoleId(null)}
      />

      {/* Organization Tree Panel */}
      <OrganizationTreePanel
        open={showOrgPanel}
        onClose={() => setShowOrgPanel(false)}
      />
    </PageContainer>
  )
}

function findOrgById(nodes: OrganizationNode[], id: string): OrganizationNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children?.length) {
      const found = findOrgById(node.children, id)
      if (found) return found
    }
  }
  return null
}
