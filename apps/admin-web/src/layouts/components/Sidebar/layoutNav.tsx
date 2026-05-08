import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'

import type { AppRouteObject } from '@/router/routes'
import { getRouteTitle } from '@/utils/routeMeta'

export interface NavItem {
  key: string
  label: string
  path: string
  icon?: ReactNode
  order: number
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

function joinPath(parentPath: string, path?: string) {
  if (!path) return parentPath
  if (path.startsWith('/')) return path

  return `${parentPath.replace(/\/$/, '')}/${path}`.replace(/\/+/g, '/')
}

function collectNavItems(
  routes: AppRouteObject[],
  t: TFunction,
  parentPath = '',
): (NavItem & { group: string })[] {
  return routes.flatMap((route) => {
    const routePath = joinPath(parentPath, route.path)
    const meta = route.handle
    const current =
      meta?.title && meta.navGroup && !meta.hideInMenu
        ? [
            {
              group: getNavGroupLabel(meta.navGroup, meta.navGroupKey, t),
              key: meta.navKey ?? routePath,
              label: getRouteTitle(meta, t),
              path: routePath,
              icon: meta.icon,
              order: meta.navOrder ?? 0,
            },
          ]
        : []
    const children = route.children
      ? collectNavItems(route.children, t, routePath)
      : []

    return [...current, ...children]
  })
}

function getNavGroupLabel(
  navGroup: string,
  navGroupKey: string | undefined,
  t: TFunction,
) {
  if (navGroupKey) {
    const translated = t(navGroupKey)

    if (translated && translated !== navGroupKey) return translated
  }

  return navGroup
}

export function buildNavGroups(routes: AppRouteObject[], t: TFunction): NavGroup[] {
  const groupMap = new Map<string, NavItem[]>()

  for (const item of collectNavItems(routes, t)) {
    const groupItems = groupMap.get(item.group) ?? []

    groupItems.push({
      key: item.key,
      label: item.label,
      path: item.path,
      icon: item.icon,
      order: item.order,
    })
    groupMap.set(item.group, groupItems)
  }

  return Array.from(groupMap.entries()).map(([label, items]) => ({
    label,
    items: items.sort((left, right) => left.order - right.order),
  }))
}

export function getActiveNavKey(pathname: string, navGroups: NavGroup[]) {
  const items = navGroups.flatMap((group) => group.items)
  const exactMatch = items.find((item) => item.path === pathname)

  if (exactMatch) return exactMatch.key

  return (
    items
      .filter((item) => pathname.startsWith(`${item.path}/`))
      .sort((left, right) => right.path.length - left.path.length)
      .at(0)?.key ?? ''
  )
}
