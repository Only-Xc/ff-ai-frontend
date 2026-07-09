import { Button, Card, Drawer, Select, Space, Spin } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  adminOrganizations_tree,
  adminRoles_list,
  rbacKeys,
  userRoles_list,
  userRoles_update,
} from '@/api/rbac'
import { globalMessage } from '@/utils/message'

export interface UserRoleDrawerProps {
  userId: string | null
  userName: string | null
  open: boolean
  onClose: () => void
}

export function UserRoleDrawer({
  userId,
  userName,
  open,
  onClose,
}: UserRoleDrawerProps) {
  const { t } = useTranslation()
  const [assignments, setAssignments] = useState<
    { role_id: string; organization_id?: string | null }[]
  >([])
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const rolesQuery = useQuery({
    queryKey: rbacKeys.roles({ keyword: '', skip: 0, limit: 200 }),
    queryFn: () => adminRoles_list({ keyword: '', skip: 0, limit: 200 }),
    enabled: open,
  })

  const orgsQuery = useQuery({
    queryKey: rbacKeys.organizations(),
    queryFn: adminOrganizations_tree,
    enabled: open,
  })

  const userRolesQuery = useQuery({
    queryKey: ['userRoles', userId],
    queryFn: () => userRoles_list(userId!),
    enabled: Boolean(userId) && open,
  })

  const allRoles = rolesQuery.data?.data ?? []

  const flatOrgOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = []
    if (orgsQuery.data) {
      function walk(nodes: typeof orgsQuery.data) {
        for (const node of nodes) {
          opts.push({ value: node.id, label: node.name })
          if (node.children?.length) walk(node.children)
        }
      }
      walk(orgsQuery.data)
    }
    return opts
  }, [orgsQuery.data]) // eslint-disable-next-line react-x/exhaustive-deps -- orgsQuery is stable

  useEffect(() => {
    if (userRolesQuery.data && open && !initialized) {
      setAssignments(
        userRolesQuery.data.map((a) => ({
          role_id: a.role_id,
          organization_id: a.organization_id ?? undefined,
        })),
      )
      setInitialized(true)
    }
  }, [userRolesQuery.data, open, initialized])

  useEffect(() => {
    if (!open) {
      setAssignments([])
      setInitialized(false)
    }
  }, [open])

  const handleSave = async () => {
    if (!userId) return

    setSaving(true)
    try {
      await userRoles_update(userId,
        assignments.map((a) => ({
          role_id: a.role_id,
          organization_id: a.organization_id ?? null,
          expires_at: null,
        })),
      )
      globalMessage.success(t('pages.rbac.messages.userRolesSaved'))
      onClose()
    } catch {
      // handled globally
    } finally {
      setSaving(false)
    }
  }

  const addAssignment = () => {
    setAssignments((prev) => [...prev, { role_id: '', organization_id: undefined }])
  }

  const removeAssignment = (index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Drawer
      title={t('pages.rbac.drawers.userRoles', { name: userName ?? '' })}
      open={open && Boolean(userId)}
      onClose={onClose}
      width={560}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>{t('common.actions.cancel')}</Button>
          <Button type="primary" onClick={handleSave} loading={saving}>
            {t('pages.rbac.actions.save')}
          </Button>
        </Space>
      }
    >
      {userRolesQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spin />
        </div>
      ) : (
        <Space direction="vertical" className="w-full" size="middle">
          {assignments.map((assignment, index) => (
            <Card key={index} size="small">
              <Space direction="vertical" className="w-full" size="middle">
                <Select
                  placeholder={t('pages.rbac.form.selectRole')}
                  value={assignment.role_id || undefined}
                  onChange={(value) => {
                    setAssignments((prev) =>
                      prev.map((a, i) =>
                        i === index ? { ...a, role_id: value } : a,
                      ),
                    )
                  }}
                  options={allRoles.map((r) => ({
                    value: r.id,
                    label: `${r.name} (${r.code})`,
                  }))}
                  showSearch
                  optionFilterProp="label"
                  className="w-full"
                />
                <Select
                  placeholder={t('pages.rbac.form.selectOrganization')}
                  value={assignment.organization_id ?? undefined}
                  onChange={(value) => {
                    setAssignments((prev) =>
                      prev.map((a, i) =>
                        i === index ? { ...a, organization_id: value || undefined } : a,
                      ),
                    )
                  }}
                  allowClear
                  options={flatOrgOptions}
                  className="w-full"
                />
                <Button
                  danger
                  size="small"
                  onClick={() => removeAssignment(index)}
                >
                  {t('pages.rbac.actions.remove')}
                </Button>
              </Space>
            </Card>
          ))}
          <Button onClick={addAssignment} block>
            {t('pages.rbac.actions.addRole')}
          </Button>
        </Space>
      )}
    </Drawer>
  )
}
