import { Button, Drawer, Space, Spin, Tabs } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  adminPermissions_list,
  adminRolePermissions_update,
  adminRoles_get,
  rbacKeys,
} from '@/api/rbac'
import { usePermission } from '@/hooks/usePermission'
import { globalMessage } from '@/utils/message'
import { PermissionTree } from './components/PermissionTree'
import type { PermFormValues } from './types'

export interface RolePermissionDrawerProps {
  roleId: string | null
  open: boolean
  onClose: () => void
}

export function RolePermissionDrawer({
  roleId,
  open,
  onClose,
}: RolePermissionDrawerProps) {
  const { t } = useTranslation()
  const { hasPermission } = usePermission()
  const [menuCheckedIds, setMenuCheckedIds] = useState<string[]>([])
  const [apiCheckedIds, setApiCheckedIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const roleQuery = useQuery({
    queryKey: rbacKeys.role(roleId ?? ''),
    queryFn: () => adminRoles_get(roleId!),
    enabled: Boolean(roleId) && open,
  })

  const permissionsQuery = useQuery({
    queryKey: rbacKeys.permissions({ keyword: '', skip: 0, limit: 200 }),
    queryFn: () => adminPermissions_list({ keyword: '', skip: 0, limit: 200 }),
    enabled: open,
  })

  const allPermissions = permissionsQuery.data?.data ?? []

  // Split permissions into menu and api groups
  const menuPerms = useMemo(
    () => allPermissions.filter((p) => p.is_menu),
    [allPermissions],
  )
  const apiPerms = useMemo(
    () => allPermissions.filter((p) => p.is_api),
    [allPermissions],
  )

  // Initialize checked IDs when role data arrives
  useEffect(() => {
    if (roleQuery.data?.permission_ids && open && !initialized) {
      setMenuCheckedIds(
        roleQuery.data.permission_ids.filter((id: string) =>
          menuPerms.some((p) => p.id === id),
        ),
      )
      setApiCheckedIds(
        roleQuery.data.permission_ids.filter((id: string) =>
          apiPerms.some((p) => p.id === id),
        ),
      )
      setInitialized(true)
    }
  }, [roleQuery.data?.permission_ids, open, menuPerms, apiPerms, initialized])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setMenuCheckedIds([])
      setApiCheckedIds([])
      setInitialized(false)
    }
  }, [open])

  const handleSave = async () => {
    if (!roleId) return

    const allChecked = [...menuCheckedIds, ...apiCheckedIds]
    setSaving(true)

    try {
      await adminRolePermissions_update(roleId, { permission_ids: allChecked })
      globalMessage.success(t('pages.rbac.messages.permissionsSaved'))
      onClose()
    } catch {
      // error handled by global error handler
    } finally {
      setSaving(false)
    }
  }

  const canUpdate = hasPermission('admin.roles.update')

  return (
    <Drawer
      title={t('pages.rbac.drawers.permissionConfig')}
      open={open && Boolean(roleId)}
      onClose={onClose}
      width={560}
      destroyOnClose
      extra={
        canUpdate ? (
          <Space>
            <Button onClick={onClose}>{t('common.actions.cancel')}</Button>
            <Button type="primary" onClick={handleSave} loading={saving}>
              {t('pages.rbac.actions.save')}
            </Button>
          </Space>
        ) : null
      }
    >
      {roleQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spin />
        </div>
      ) : (
        <Tabs
          items={[
            {
              key: 'menu',
              label: t('pages.rbac.tabs.menuPermissions'),
              children: (
                <PermissionTree
                  permissions={menuPerms}
                  checkedIds={menuCheckedIds}
                  onChange={canUpdate ? setMenuCheckedIds : () => {}}
                />
              ),
            },
            {
              key: 'api',
              label: t('pages.rbac.tabs.apiPermissions'),
              children: (
                <PermissionTree
                  permissions={apiPerms}
                  checkedIds={apiCheckedIds}
                  onChange={canUpdate ? setApiCheckedIds : () => {}}
                />
              ),
            },
          ]}
        />
      )}
    </Drawer>
  )
}
