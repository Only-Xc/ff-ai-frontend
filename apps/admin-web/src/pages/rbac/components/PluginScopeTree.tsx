import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Button,
  Empty,
  Select,
  Space,
  Spin,
  Tree,
  Typography,
} from 'antd'
import type { DataNode } from 'antd/es/tree'
import { useEffect, useMemo, useState } from 'react'
import type { Key } from 'react'

import {
  pluginKeys,
  plugins_list,
  plugins_permissions,
  plugins_rolePermission,
  plugins_updateRolePermission,
  type PluginPermission,
} from '@/api/plugins'
import { adminOrganizations_list, rbacKeys } from '@/api/rbac'

export interface PluginScopeTreeProps {
  roleId: string
  editable: boolean
}

export function PluginScopeTree({ roleId, editable }: PluginScopeTreeProps) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [pluginId, setPluginId] = useState<string>()
  const [organizationId, setOrganizationId] = useState<string>()
  const [checked, setChecked] = useState<string[]>([])
  const pluginsQuery = useQuery({
    queryKey: pluginKeys.list({ limit: 500 }),
    queryFn: () => plugins_list({ limit: 500 }),
  })
  const organizationsQuery = useQuery({
    queryKey: rbacKeys.organizationList({ skip: 0, limit: 100 }),
    queryFn: () => adminOrganizations_list({ skip: 0, limit: 100 }),
  })
  const permissionsQuery = useQuery({
    queryKey: pluginKeys.permissions(pluginId ?? ''),
    queryFn: () => plugins_permissions(pluginId!),
    enabled: Boolean(pluginId),
  })
  const grantQuery = useQuery({
    queryKey: pluginKeys.rolePermission(pluginId ?? '', roleId, organizationId),
    queryFn: () => plugins_rolePermission(pluginId!, roleId, organizationId),
    enabled: Boolean(pluginId),
  })
  const updateMutation = useMutation({
    mutationFn: () =>
      plugins_updateRolePermission(pluginId!, roleId, organizationId, checked),
    onSuccess: async () => {
      message.success('插件 Scope 授权已保存并立即生效')
      await queryClient.invalidateQueries({
        queryKey: pluginKeys.rolePermission(pluginId!, roleId, organizationId),
      })
    },
  })

  useEffect(() => {
    if (!pluginId && pluginsQuery.data?.data[0])
      setPluginId(pluginsQuery.data.data[0].plugin_id)
  }, [pluginId, pluginsQuery.data])
  useEffect(
    () => setChecked(grantQuery.data?.permission_codes ?? []),
    [grantQuery.data],
  )

  const treeData = useMemo<DataNode[]>(() => {
    const groups = new Map<string, Map<string, PluginPermission[]>>()
    for (const permission of permissionsQuery.data?.data ?? []) {
      const service = permission.service_name ?? '通用服务'
      const operation = permission.permission_type ?? 'access'
      if (!groups.has(service)) groups.set(service, new Map())
      const operations = groups.get(service)!
      operations.set(operation, [
        ...(operations.get(operation) ?? []),
        permission,
      ])
    }
    return Array.from(groups.entries()).map(([service, operations]) => ({
      key: `service:${service}`,
      title: service,
      selectable: false,
      children: Array.from(operations.entries()).map(
        ([operation, permissions]) => ({
          key: `operation:${service}:${operation}`,
          title: operation,
          selectable: false,
          children: permissions.map((permission) => ({
            key: permission.code,
            title: `${permission.name} (${permission.code})`,
          })),
        }),
      ),
    }))
  }, [permissionsQuery.data])

  if (pluginsQuery.isPending)
    return (
      <div className="flex justify-center py-10">
        <Spin />
      </div>
    )
  if (pluginsQuery.isError)
    return <Alert showIcon title="插件列表加载失败" type="error" />
  if (!pluginsQuery.data?.data.length)
    return <Empty description="暂无已登记插件" />

  return (
    <div className="flex flex-col gap-4">
      <Alert
        showIcon
        title="按插件、服务和操作授予 Scope。保存后用户菜单与网关鉴权立即按新权限生效。"
        type="info"
      />
      <Space wrap>
        <Select
          className="w-64"
          options={pluginsQuery.data.data.map((item) => ({
            label: `${item.name} (${item.plugin_id})`,
            value: item.plugin_id,
          }))}
          value={pluginId}
          onChange={setPluginId}
        />
        <Select
          allowClear
          className="w-64"
          options={(organizationsQuery.data?.data ?? []).map((item) => ({
            label: `${item.name} (${item.code})`,
            value: item.id,
          }))}
          placeholder="全局授权（可选择组织范围）"
          value={organizationId}
          onChange={setOrganizationId}
        />
      </Space>
      {permissionsQuery.isPending || grantQuery.isPending ? (
        <Spin />
      ) : permissionsQuery.isError || grantQuery.isError ? (
        <Alert showIcon title="插件 Scope 加载失败" type="error" />
      ) : (
        <Tree
          checkable
          checkedKeys={checked}
          defaultExpandAll
          disabled={!editable}
          key={pluginId}
          treeData={treeData}
          onCheck={(keys) =>
            setChecked(
              (keys as Key[])
                .map(String)
                .filter(
                  (key) =>
                    !key.startsWith('service:') &&
                    !key.startsWith('operation:'),
                ),
            )
          }
        />
      )}
      <Typography.Text type="secondary">
        已选择 {checked.length} 个 Scope
      </Typography.Text>
      {editable ? (
        <Button
          className="self-start"
          loading={updateMutation.isPending}
          type="primary"
          onClick={() => updateMutation.mutate()}
        >
          保存插件 Scope
        </Button>
      ) : null}
    </div>
  )
}
