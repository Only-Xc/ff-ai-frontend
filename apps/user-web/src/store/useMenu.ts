import { create } from 'zustand'

import { tenantApps_menu, type TenantAppMenuNode } from '@/api/tenant-apps'
import { plugins_catalog, type PluginCatalogItem } from '@/api/plugins'
import { i18n } from '@/i18n'
import type { NavTreeItem } from '@/layouts/components/Sidebar/layoutNav'

export type MenuLoadStatus = 'idle' | 'loading' | 'success' | 'error'

interface MenuState {
  appMenuNodes: TenantAppMenuNode[]
  pluginCatalogItems: PluginCatalogItem[]
  error: unknown
  lastUpdatedAt: number | null
  status: MenuLoadStatus
  getAppByTaskId: (taskId: string) => TenantAppMenuNode | undefined
  loadMenu: () => Promise<void>
  retryMenu: () => Promise<void>
  refreshPluginCatalog: () => Promise<void>
}

const WORKSPACE_NAV_KEY = 'workspace'
const PLATFORM_APPS_KEY = 'workspace-platform-apps'
const KNOWLEDGE_BASE_KEY = 'knowledge-base'
const PLATFORM_APP_NAV_KEYS = new Set([
  'exams',
  'attempts',
  'platform-apps-catalog',
])
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

function getEmptyMenuItem(key: string): NavTreeItem {
  return {
    key,
    label: i18n.t('pages.menu.empty'),
    kind: 'menu',
    disabled: true,
  }
}

function buildWorkspaceNavChildren(
  appMenuNavItems: NavTreeItem[],
  platformAppNavItems: NavTreeItem[],
  knowledgeBaseNavItem?: NavTreeItem,
  onOpenPlatformApps?: () => void,
) {
  const knowledgeBaseChildren = knowledgeBaseNavItem?.children?.length
    ? knowledgeBaseNavItem.children
    : [getEmptyMenuItem(`${KNOWLEDGE_BASE_KEY}-empty`)]

  return [
    ...appMenuNavItems,
    {
      key: PLATFORM_APPS_KEY,
      label: i18n.t('pages.menu.platformApps'),
      kind: 'group',
      groupAction: onOpenPlatformApps
        ? {
            label: i18n.t('pages.platformApps.openCatalog'),
            onClick: onOpenPlatformApps,
          }
        : undefined,
      children: platformAppNavItems.length
        ? platformAppNavItems
        : [getEmptyMenuItem(`${PLATFORM_APPS_KEY}-empty`)],
    },
    {
      key: knowledgeBaseNavItem?.key ?? KNOWLEDGE_BASE_KEY,
      label: knowledgeBaseNavItem?.label ?? i18n.t('pages.menu.knowledgeBase'),
      kind: 'group',
      children: knowledgeBaseChildren,
    },
  ] satisfies NavTreeItem[]
}

function extractWorkspaceChildNavItems(navItems: NavTreeItem[]) {
  const platformAppNavItems: NavTreeItem[] = []
  let knowledgeBaseNavItem: NavTreeItem | undefined
  const restNavItems = navItems.filter((item) => {
    if (item.key === KNOWLEDGE_BASE_KEY) {
      knowledgeBaseNavItem = item
      return false
    }

    if (!PLATFORM_APP_NAV_KEYS.has(item.key)) return true

    platformAppNavItems.push(item)
    return false
  })

  return { knowledgeBaseNavItem, platformAppNavItems, restNavItems }
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
      label: i18n.t('pages.menu.myApps'),
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
    pluginCatalogItems: PluginCatalogItem[]
    onOpenPlatformApps: () => void
    onRetry: () => void
    status: MenuLoadStatus
  },
) {
  const {
    appMenuNodes,
    onOpenPlatformApps,
    onRetry,
    pluginCatalogItems,
    status,
  } = options
  const { knowledgeBaseNavItem, platformAppNavItems, restNavItems } =
    extractWorkspaceChildNavItems(staticNavItems)
  let appMenuNavItems: NavTreeItem[]

  if (status === 'success') {
    const items = buildTenantAppNavItems(appMenuNodes)

    appMenuNavItems = items.length
      ? items
      : [
          {
            key: APP_MENU_EMPTY_KEY,
            label: i18n.t('pages.menu.empty'),
            kind: 'menu',
            disabled: true,
          },
        ]
  } else if (status === 'error') {
    appMenuNavItems = [
      {
        key: APP_MENU_RETRY_KEY,
        label: i18n.t('pages.menu.retry'),
        kind: 'menu',
        onClick: onRetry,
      },
    ]
  } else {
    appMenuNavItems = [
      {
        key: APP_MENU_LOADING_KEY,
        label: i18n.t('pages.menu.loading'),
        kind: 'menu',
        disabled: true,
      },
    ]
  }

  const favoritePluginNavItems = pluginCatalogItems.map((item) => ({
    key: `plugin-${item.installation_id}`,
    label: item.name,
    kind: 'menu' as const,
    path: item.entry_path,
  }))

  return withWorkspaceNavChildren(
    restNavItems,
    buildWorkspaceNavChildren(
      appMenuNavItems,
      [...platformAppNavItems, ...favoritePluginNavItems],
      knowledgeBaseNavItem,
      onOpenPlatformApps,
    ),
  )
}

function isMenuCacheFresh(lastUpdatedAt: number | null, now = Date.now()) {
  return lastUpdatedAt !== null && now - lastUpdatedAt < MENU_CACHE_TTL
}

export const useMenuStore = create<MenuState>((set, get) => {
  async function fetchMenu() {
    set({ error: null, status: 'loading' })

    try {
      const [response, pluginCatalog] = await Promise.all([
        tenantApps_menu(),
        plugins_catalog({ favorites_only: true }).catch(() => ({
          data: [],
          count: 0,
        })),
      ])

      set({
        appMenuNodes: response.data,
        pluginCatalogItems: pluginCatalog.data,
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
    pluginCatalogItems: [],
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
    refreshPluginCatalog: async () => {
      const pluginCatalog = await plugins_catalog({ favorites_only: true })
      set({ pluginCatalogItems: pluginCatalog.data })
    },
  }
})
