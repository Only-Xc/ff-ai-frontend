import { create } from 'zustand'

import { tenantApps_menu, type TenantAppMenuNode } from '@/api/tenant-apps'
import type { NavTreeItem } from '@/layouts/components/Sidebar/layoutNav'

export type MenuLoadStatus = 'idle' | 'loading' | 'success' | 'error'

interface MenuState {
  appMenuNodes: TenantAppMenuNode[]
  error: unknown
  lastUpdatedAt: number | null
  status: MenuLoadStatus
  getAppByTaskId: (taskId: string) => TenantAppMenuNode | undefined
  loadMenu: () => Promise<void>
  retryMenu: () => Promise<void>
}

const WORKSPACE_NAV_KEY = 'workspace'
const APP_MENU_LOADING_KEY = 'workspace-apps-loading'
const APP_MENU_EMPTY_KEY = 'workspace-apps-empty'
const APP_MENU_RETRY_KEY = 'workspace-apps-retry'
const MENU_CACHE_TTL = 5 * 60 * 1000

function sortNodes(nodes: TenantAppMenuNode[]) {
  return [...nodes].sort((left, right) => {
    const orderDiff = (left.order ?? 0) - (right.order ?? 0)

    if (orderDiff !== 0) return orderDiff

    return left.title.localeCompare(right.title, 'zh-Hans-CN')
  })
}

function getAppPath(taskId: string) {
  return `/apps/${encodeURIComponent(taskId)}`
}

function toNavItem(node: TenantAppMenuNode): NavTreeItem | null {
  const children = sortNodes(node.children ?? [])
    .map(toNavItem)
    .filter((item): item is NavTreeItem => Boolean(item))

  if (node.type === 'app') {
    if (!node.task_id || !node.preview_url) return null

    return {
      key: node.id,
      label: node.title,
      kind: 'menu',
      path: getAppPath(node.task_id),
    }
  }

  if (!children.length) return null

  return {
    key: node.id,
    label: node.title,
    kind: node.type === 'group' ? 'group' : 'submenu',
    children,
  }
}

function buildTenantAppNavItems(nodes: TenantAppMenuNode[]) {
  return sortNodes(nodes)
    .map(toNavItem)
    .filter((item): item is NavTreeItem => Boolean(item))
}

function withWorkspaceNavChildren(
  navItems: NavTreeItem[],
  children: NavTreeItem[],
): NavTreeItem[] {
  let replaced = false

  const nextItems = navItems.map((item) => {
    if (item.key !== WORKSPACE_NAV_KEY) return item

    replaced = true

    return {
      ...item,
      children,
    }
  })

  if (replaced) return nextItems

  return [
    ...nextItems,
    {
      key: WORKSPACE_NAV_KEY,
      label: '应用列表',
      kind: 'group',
      children,
    },
  ]
}

function findTenantAppByTaskId(
  nodes: TenantAppMenuNode[],
  taskId: string,
): TenantAppMenuNode | undefined {
  const decodedTaskId = decodeURIComponentSafe(taskId)

  for (const node of nodes) {
    if (
      node.type === 'app' &&
      (node.task_id === taskId || node.task_id === decodedTaskId)
    ) {
      return node
    }

    const matched = findTenantAppByTaskId(node.children ?? [], decodedTaskId)

    if (matched) return matched
  }

  return undefined
}

function decodeURIComponentSafe(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function buildSidebarNavItemsWithAppMenu(
  staticNavItems: NavTreeItem[],
  options: {
    appMenuNodes: TenantAppMenuNode[]
    onRetry: () => void
    status: MenuLoadStatus
  },
) {
  const { appMenuNodes, onRetry, status } = options
  let appMenuNavItems: NavTreeItem[]

  if (status === 'success') {
    const items = buildTenantAppNavItems(appMenuNodes)

    appMenuNavItems = items.length
      ? items
      : [
          {
            key: APP_MENU_EMPTY_KEY,
            label: '暂无应用',
            kind: 'menu',
            disabled: true,
          },
        ]
  } else if (status === 'error') {
    appMenuNavItems = [
      {
        key: APP_MENU_RETRY_KEY,
        label: '加载失败，点击重试',
        kind: 'menu',
        onClick: onRetry,
      },
    ]
  } else {
    appMenuNavItems = [
      {
        key: APP_MENU_LOADING_KEY,
        label: '应用加载中',
        kind: 'menu',
        disabled: true,
      },
    ]
  }

  return withWorkspaceNavChildren(staticNavItems, appMenuNavItems)
}

function isMenuCacheFresh(lastUpdatedAt: number | null, now = Date.now()) {
  return lastUpdatedAt !== null && now - lastUpdatedAt < MENU_CACHE_TTL
}

export const useMenuStore = create<MenuState>((set, get) => {
  async function fetchMenu() {
    set({ error: null, status: 'loading' })

    try {
      const response = await tenantApps_menu()

      set({
        appMenuNodes: response.data,
        error: null,
        lastUpdatedAt: Date.now(),
        status: 'success',
      })
    } catch (error: unknown) {
      set({
        error,
        status: 'error',
      })
    }
  }

  return {
    appMenuNodes: [],
    error: null,
    lastUpdatedAt: null,
    status: 'idle',
    getAppByTaskId: (taskId) => {
      return findTenantAppByTaskId(get().appMenuNodes, taskId)
    },
    loadMenu: async () => {
      const { lastUpdatedAt, status } = get()

      if (status === 'loading') return
      if (status === 'success' && isMenuCacheFresh(lastUpdatedAt)) return

      await fetchMenu()
    },
    retryMenu: () => fetchMenu(),
  }
})
