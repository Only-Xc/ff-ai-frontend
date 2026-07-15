import { Input } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { Tree } from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { Permission } from '@/api/rbac'

const { Search } = Input
const { DirectoryTree } = Tree

export interface PermissionTreeProps {
  permissions: Permission[]
  checkedIds: string[]
  onChange: (checkedIds: string[]) => void
}

export function PermissionTree({
  permissions,
  checkedIds,
  onChange,
}: PermissionTreeProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const treeData = useMemo(() => {
    const filtered = search
      ? permissions.filter((p) => {
          const label = search.toLowerCase()
          const name = t(`pages.rbac.permissions.${p.code}`, p.name)
          return (
            name.toLowerCase().includes(label) ||
            p.name.toLowerCase().includes(label) ||
            p.code.toLowerCase().includes(label)
          )
        })
      : permissions

    const groups = new Map<string, Permission[]>()
    for (const p of filtered) {
      const key = p.group || '__other__'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(p)
    }

    return Array.from(groups.entries()).map(([group, items]) => ({
      title: t(`pages.rbac.permissionGroups.${group}`, group),
      key: `group:${group}`,
      children: items.map((p) => ({
        title: (
          <span className="flex items-center justify-between">
            <span>{t(`pages.rbac.permissions.${p.code}`, p.name)}</span>
            <span className="text-xs text-gray-400">{p.code}</span>
          </span>
        ),
        key: p.id,
      })),
    })) as DataNode[]
  }, [permissions, search, t])

  return (
    <div className="flex h-full flex-col">
      <Search
        className="mb-3"
        placeholder={t('pages.rbac.permissionTree.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onSearch={setSearch}
        allowClear
      />
      <div className="flex-1 overflow-auto">
        <DirectoryTree
          checkable
          multiple
          checkedKeys={checkedIds}
          onCheck={(_, info) => {
            onChange(
              info.checkedNodes
                .map((n) => String(n.key))
                .filter((key) => !key.startsWith('group:')),
            )
          }}
          treeData={treeData}
          height={400}
          virtual
        />
      </div>
    </div>
  )
}
