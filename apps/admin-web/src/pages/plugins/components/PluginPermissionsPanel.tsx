import { SaveOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, App, Button, Checkbox, Empty, Select, Space, Spin, Tag, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  pluginKeys,
  plugins_permissions,
  plugins_rolePermission,
  plugins_updateRolePermission,
  type PluginPermission,
} from '@/api/plugins'
import {
  adminOrganizations_list,
  adminRoles_list,
  rbacKeys,
} from '@/api/rbac'

const GLOBAL_SCOPE = '__global__'

export function PluginPermissionsPanel({ pluginId }: { pluginId: string }) {
  const { message } = App.useApp()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [roleId, setRoleId] = useState<string>()
  const [organizationValue, setOrganizationValue] = useState(GLOBAL_SCOPE)
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const organizationId =
    organizationValue === GLOBAL_SCOPE ? undefined : organizationValue
  const rolesQuery = useQuery({
    queryKey: rbacKeys.roles({ keyword: '', skip: 0, limit: 500 }),
    queryFn: () => adminRoles_list({ keyword: '', skip: 0, limit: 500 }),
  })
  const organizationsQuery = useQuery({
    queryKey: rbacKeys.organizationList({ skip: 0, limit: 100 }),
    queryFn: () => adminOrganizations_list({ skip: 0, limit: 100 }),
  })
  const permissionsQuery = useQuery({
    queryKey: pluginKeys.permissions(pluginId),
    queryFn: () => plugins_permissions(pluginId),
  })
  const assignmentQuery = useQuery({
    queryKey: pluginKeys.rolePermission(pluginId, roleId, organizationId),
    queryFn: () => plugins_rolePermission(pluginId, roleId!, organizationId),
    enabled: Boolean(roleId),
  })
  const saveMutation = useMutation({
    mutationFn: () =>
      plugins_updateRolePermission(
        pluginId,
        roleId!,
        organizationId,
        selectedCodes,
      ),
    onSuccess: async () => {
      message.success(t('pages.pluginCenter.permissions.saved'))
      await queryClient.invalidateQueries({
        queryKey: pluginKeys.rolePermission(pluginId, roleId, organizationId),
      })
    },
  })

  useEffect(() => {
    setSelectedCodes(assignmentQuery.data?.permission_codes ?? [])
  }, [assignmentQuery.data])

  const permissions = permissionsQuery.data?.data
  const permissionGroups = useMemo(() => {
    const groups = new Map<string, PluginPermission[]>()
    for (const permission of permissions ?? []) {
      const current = groups.get(permission.permission_type) ?? []
      current.push(permission)
      groups.set(permission.permission_type, current)
    }
    return [...groups.entries()]
  }, [permissions])

  if (permissionsQuery.isError || rolesQuery.isError || organizationsQuery.isError) {
    return <Alert title={t('pages.pluginCenter.permissions.loadFailed')} showIcon type="error" />
  }

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 border-b border-(--border) pb-4">
        <label className="flex min-w-64 flex-col gap-1 text-sm">
          <span>{t('pages.pluginCenter.permissions.role')}</span>
          <Select
            loading={rolesQuery.isPending}
            options={(rolesQuery.data?.data ?? []).map((role) => ({
              label: `${role.name} (${role.code})`,
              value: role.id,
            }))}
            showSearch
            optionFilterProp="label"
            value={roleId}
            onChange={setRoleId}
          />
        </label>
        <label className="flex min-w-64 flex-col gap-1 text-sm">
          <span>{t('pages.pluginCenter.permissions.organization')}</span>
          <Select
            loading={organizationsQuery.isPending}
            options={[
              {
                label: t('pages.pluginCenter.permissions.global'),
                value: GLOBAL_SCOPE,
              },
              ...(organizationsQuery.data?.data ?? []).map((organization) => ({
                label: `${organization.name} (${organization.code})`,
                value: organization.id,
              })),
            ]}
            showSearch
            optionFilterProp="label"
            value={organizationValue}
            onChange={setOrganizationValue}
          />
        </label>
        <Button
          disabled={!roleId}
          icon={<SaveOutlined />}
          loading={saveMutation.isPending}
          type="primary"
          onClick={() => saveMutation.mutate()}
        >
          {t('pages.pluginCenter.permissions.save')}
        </Button>
      </div>

      {!roleId ? (
        <Empty description={t('pages.pluginCenter.permissions.selectRole')} />
      ) : assignmentQuery.isPending ? (
        <Spin />
      ) : (
        <Checkbox.Group
          className="flex! flex-col! gap-4"
          value={selectedCodes}
          onChange={(values) => setSelectedCodes(values)}
        >
          {permissionGroups.map(([type, permissions]) => (
            <section className="border-b border-(--border) pb-4" key={type}>
              <div className="mb-2 flex items-center gap-2">
                <Typography.Text strong>{type}</Typography.Text>
                <Tag>{permissions.length}</Tag>
              </div>
              <Space direction="vertical" size={8}>
                {permissions.map((permission) => (
                  <Checkbox disabled={!permission.is_active} key={permission.code} value={permission.code}>
                    <span className="font-medium">{permission.name}</span>
                    <span className="ml-2 font-mono text-xs text-(--muted)">
                      {permission.code}
                    </span>
                    {permission.description ? (
                      <span className="ml-2 text-xs text-(--muted)">
                        {permission.description}
                      </span>
                    ) : null}
                  </Checkbox>
                ))}
              </Space>
            </section>
          ))}
        </Checkbox.Group>
      )}
    </div>
  )
}
