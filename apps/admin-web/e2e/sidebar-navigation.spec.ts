import { expect, test, type Page } from '@playwright/test'

const TOKEN = 'mock-sidebar-navigation-token'

const ALL_MENU_CODES = [
  'menu.admin.rbac',
  'menu.admin.grc',
  'menu.admin.stage_switch',
]

const ALL_PERMISSIONS = [
  'admin.roles.read',
  'admin.users.read',
  'admin.orgs.read',
  'admin.grc.dashboard.read',
  'admin.grc.rules.read',
  'admin.grc.evaluations.read',
  'admin.grc.reviews.read',
  'admin.grc.exceptions.read',
  'admin.grc.reports.read',
  'admin.stage_switch.read',
  'admin.stage_switch.templates.read',
  'admin.stage_switch.notifications.read',
]

interface ProfileOptions {
  menuCodes?: string[]
  permissionCodes?: string[]
}

async function setupAuthenticatedPage(
  page: Page,
  {
    menuCodes = ALL_MENU_CODES,
    permissionCodes = ALL_PERMISSIONS,
  }: ProfileOptions = {},
) {
  await page.addInitScript((token) => {
    localStorage.setItem('ff-admin-access-token', token)
    localStorage.setItem('ff-admin-locale', 'zh-CN')
    localStorage.setItem('ff-admin-sidebar-collapsed', 'false')
  }, TOKEN)

  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    })
  })
  await page.route('**/api/v1/login/test-token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'sidebar-admin',
        email: 'sidebar-admin@example.com',
        full_name: 'Sidebar Admin',
        is_active: true,
        is_superuser: false,
      }),
    })
  })
  await page.route('**/api/v1/rbac/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user_id: 'sidebar-admin',
        role_codes: [],
        permission_codes: permissionCodes,
        menu_codes: menuCodes,
        organizations: [],
      }),
    })
  })
  await page.route(/\/api\/v1\/users\/?(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], count: 0 }),
    })
  })
}

function desktopSidebar(page: Page) {
  return page.locator('.ant-layout-sider').first()
}

function submenu(page: Page, label: string) {
  const title = desktopSidebar(page)
    .locator('.ant-menu-submenu-title')
    .filter({ hasText: label })
    .first()

  return {
    item: title.locator('..'),
    title,
  }
}

async function openSubmenu(page: Page, label: string) {
  const group = submenu(page, label)

  if (
    !(await group.item.getAttribute('class'))?.includes('ant-menu-submenu-open')
  ) {
    await group.title.click()
  }
  await expect(group.item).toHaveClass(/ant-menu-submenu-open/)

  return group.item
}

async function visibleChildLabels(group: ReturnType<Page['locator']>) {
  return group
    .locator(':scope > .ant-menu-sub > .ant-menu-item .ant-menu-title-content')
    .allTextContents()
}

test.describe('admin sidebar module grouping', () => {
  test('allows the active module group to be collapsed manually', async ({
    page,
  }) => {
    await setupAuthenticatedPage(page)
    await page.goto('/rbac/roles')

    const accessControl = submenu(page, '权限管理')
    await expect(accessControl.item).toHaveClass(/ant-menu-submenu-open/)
    await expect(accessControl.title).toHaveAttribute('aria-expanded', 'true')

    await accessControl.title.click()

    await expect(accessControl.item).not.toHaveClass(/ant-menu-submenu-open/)
    await expect(accessControl.title).toHaveAttribute('aria-expanded', 'false')
  })

  test('groups multi-entry modules and preserves child order', async ({
    page,
  }) => {
    await setupAuthenticatedPage(page)
    await page.goto('/rbac/users')

    const accessControl = await openSubmenu(page, '权限管理')
    expect(await visibleChildLabels(accessControl)).toEqual([
      '角色权限',
      '用户管理',
      '组织管理',
    ])

    const governance = await openSubmenu(page, '治理与合规')
    expect(await visibleChildLabels(governance)).toEqual([
      'GRC 仪表盘',
      '合规规则库',
      '评估记录',
      '审批队列',
      '例外管理',
      '治理报表',
    ])

    const stageSwitch = await openSubmenu(page, '阶段切换管理')
    expect(await visibleChildLabels(stageSwitch)).toEqual([
      '阶段切换审批',
      '审批模板',
      '通知中心',
    ])

    const sidebar = desktopSidebar(page)
    await expect(sidebar.getByText('规则详情', { exact: true })).toHaveCount(0)
    await expect(sidebar.getByText('评估详情', { exact: true })).toHaveCount(0)
    await expect(
      sidebar.getByText('阶段切换详情', { exact: true }),
    ).toHaveCount(0)
    await expect(
      sidebar.getByText('审批模板编辑', { exact: true }),
    ).toHaveCount(0)
  })

  test('opens and selects the owning menu for a hidden detail route', async ({
    page,
  }) => {
    await setupAuthenticatedPage(page, {
      menuCodes: ['menu.admin.grc'],
      permissionCodes: ['admin.grc.rules.read'],
    })
    await page.goto('/grc/rules/rule-1')

    const governance = submenu(page, '治理与合规')
    await expect(governance.item).toHaveClass(/ant-menu-submenu-open/)
    await expect(
      governance.item.locator('.ant-menu-item-selected'),
    ).toContainText('合规规则库')
    await expect(
      desktopSidebar(page).getByText('规则详情', { exact: true }),
    ).toHaveCount(0)
  })

  test('shows only authorized children and omits empty groups', async ({
    page,
  }) => {
    await setupAuthenticatedPage(page, {
      menuCodes: ['menu.admin.rbac'],
      permissionCodes: ['admin.users.read'],
    })
    await page.goto('/rbac/users')

    const accessControl = submenu(page, '权限管理')
    await expect(accessControl.item).toHaveClass(/ant-menu-submenu-open/)
    expect(await visibleChildLabels(accessControl.item)).toEqual(['用户管理'])

    const sidebar = desktopSidebar(page)
    await expect(sidebar.getByText('治理与合规', { exact: true })).toHaveCount(
      0,
    )
    await expect(
      sidebar.getByText('阶段切换管理', { exact: true }),
    ).toHaveCount(0)
  })
})
